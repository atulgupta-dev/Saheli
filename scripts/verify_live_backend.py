"""
Synthetic verification script for live Render backend: https://saheli-backend-bo6j.onrender.com
Validates live Firebase ID token authentication, Firestore scoping, and API contracts.

USAGE:
  1. Set environment variable:
       $env:SAHELI_TEST_BEARER_TOKEN="<your_firebase_id_token>"
     OR write the token to a local file:
       Saheli/.token.secret
  2. Run:
       python scripts/verify_live_backend.py
"""

from __future__ import annotations

import datetime
import json
import os
import sys
import urllib.error
import urllib.request
from pathlib import Path

BACKEND_BASE_URL = os.environ.get("SAHELI_BACKEND_URL", "https://saheli-backend-bo6j.onrender.com").rstrip("/")
TOKEN_SECRET_FILE = Path(__file__).resolve().parent.parent / ".token.secret"


def get_bearer_token() -> str:
    env_token = os.environ.get("SAHELI_TEST_BEARER_TOKEN", "").strip()
    if env_token:
        return env_token

    if TOKEN_SECRET_FILE.exists():
        file_token = TOKEN_SECRET_FILE.read_text(encoding="utf-8").strip()
        if file_token:
            return file_token

    return ""


def make_request(
    endpoint: str,
    method: str = "GET",
    token: str | None = None,
    payload: dict | None = None,
    timeout: int = 90,
) -> tuple[int, dict]:
    url = f"{BACKEND_BASE_URL}{endpoint}"
    headers = {"Accept": "application/json"}
    data_bytes = None

    if token:
        headers["Authorization"] = f"Bearer {token}"
    if payload is not None:
        headers["Content-Type"] = "application/json"
        data_bytes = json.dumps(payload).encode("utf-8")

    req = urllib.request.Request(url, data=data_bytes, headers=headers, method=method)

    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            status_code = resp.status
            body = json.loads(resp.read().decode("utf-8"))
            return status_code, body
    except urllib.error.HTTPError as exc:
        err_body = {}
        try:
            err_body = json.loads(exc.read().decode("utf-8"))
        except Exception:
            pass
        return exc.code, err_body
    except Exception as exc:
        print(f"[-] Network connection error: {exc}")
        return 0, {"error": str(exc)}


def main() -> int:
    print("=" * 65)
    print(" Saheli AI: Production Backend Verification Suite")
    print(f" Target: {BACKEND_BASE_URL}")
    print("=" * 65)

    # 1. Health check
    print("\n[1/4] Checking Public Health Endpoint (/health)...")
    code, data = make_request("/health")
    if code == 200 and data.get("status") == "ok":
        print(f"  [+] Status: {code} OK - {data}")
    else:
        print(f"  [-] Failed: Status {code}, Response: {data}")
        return 1

    # 2. Token retrieval
    token = get_bearer_token()
    if not token:
        print("\n" + "!" * 65)
        print(" SECURE HANDOFF INSTRUCTIONS:")
        print(" No Firebase ID token found.")
        print(" To perform authenticated write/read verification without pasting")
        print(" credentials into chat:")
        print()
        print("   Option A: Set in PowerShell session:")
        print('     $env:SAHELI_TEST_BEARER_TOKEN = "<your_firebase_id_token>"')
        print("     python scripts/verify_live_backend.py")
        print()
        print("   Option B: Save to git-ignored local file:")
        print(f"     File path: {TOKEN_SECRET_FILE}")
        print("     (This file is in .gitignore and will never be tracked or committed)")
        print("!" * 65)
        return 0

    print("\n[+] Authenticated token detected (length: %d chars, secret not printed)." % len(token))

    # 3. Authenticated Profile Read/Create
    print("\n[2/4] Testing Authenticated Profile (/api/v1/profile)...")
    code, profile = make_request("/api/v1/profile", method="GET", token=token)
    if code == 200:
        uid = profile.get("user_id")
        active_stage = profile.get("active_stage")
        locale = profile.get("locale")
        print(f"  [+] Profile Verified (HTTP {code}):")
        print(f"      - Scoped UID:    {uid}")
        print(f"      - Active Stage:  {active_stage}")
        print(f"      - Locale:        {locale}")
    elif code == 401:
        print(f"  [-] HTTP 401 Unauthorized: The Firebase token was rejected by production verify_id_token.")
        print(f"      Response: {profile}")
        return 1
    else:
        print(f"  [-] Unexpected status {code}: {profile}")
        return 1

    # 4. Authenticated Symptom Write
    print("\n[3/4] Testing Authenticated Symptom Journal Write (/api/v1/symptoms)...")
    symptom_payload = {
        "stage": "pregnancy",
        "reported_at": datetime.datetime.now(datetime.timezone.utc).isoformat(),
        "symptoms": ["mild fatigue", "hydration check"],
        "notes": "Synthetic integration verification test entry",
    }
    code, sym_resp = make_request("/api/v1/symptoms", method="POST", token=token, payload=symptom_payload)
    if code == 200 and sym_resp.get("saved"):
        entry_id = sym_resp.get("entry_id")
        safety = sym_resp.get("safety", {})
        print(f"  [+] Symptom Record Created (HTTP {code}):")
        print(f"      - Entry ID:      {entry_id}")
        print(f"      - Safety Level:  {safety.get('level')}")
        print(f"      - Rule IDs:      {safety.get('rule_ids')}")
        print(f"      - Message:       {safety.get('message')}")
        print()
        print("  >>> FIRESTORE PERSISTENCE AUDIT CHECK:")
        print(f"      Open Firebase Console for project 'saheli-2576f'")
        print(f"      Navigate to Firestore Database path:")
        print(f"      users/{uid}/symptom_entries/{entry_id}")
        print("      If this document exists in Firebase Console, Cloud Firestore")
        print("      persistence is 100% LIVE and durable (not using memory fallback).")
    else:
        print(f"  [-] Symptom write failed: Status {code}, Response: {sym_resp}")

    # 5. Authenticated Companion Chat
    print("\n[4/4] Testing Companion Conversation (/api/v1/chat)...")
    chat_payload = {
        "stage": "pregnancy",
        "message": "Namaste Saheli, aaj thakan mehsoos ho rahi hai.",
        "locale": "hi-IN",
        "conversation_id": None,
        "save_to_memory": True,
    }
    code, chat_resp = make_request("/api/v1/chat", method="POST", token=token, payload=chat_payload)
    if code == 200:
        conv_id = chat_resp.get("conversation_id")
        reply = chat_resp.get("reply", "")
        print(f"  [+] Chat Companion Verified (HTTP {code}):")
        print(f"      - Conv ID:       {conv_id}")
        print(f"      - Safety Level:  {chat_resp.get('safety', {}).get('level')}")
        print(f"      - Sample Reply:  {reply[:70]}...")
    else:
        print(f"  [-] Chat failed: Status {code}, Response: {chat_resp}")

    print("\n" + "=" * 65)
    print(" Verification Complete.")
    print("=" * 65)
    return 0


if __name__ == "__main__":
    sys.exit(main())
