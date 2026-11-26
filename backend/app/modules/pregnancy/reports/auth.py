"""Firebase ID token verification dependency (with stub fallback for local dev/tests).

NOTE for Member 5 (backend/app/core/):
When central Firebase auth is wired in backend/app/core/, this dependency can
delegate to the shared core verifier without changing the /api/v1/reports router.
"""

from __future__ import annotations

import os
from fastapi import Header

from .errors import ReportAPIError

try:
    import firebase_admin  # type: ignore[import-untyped]
    from firebase_admin import auth as firebase_auth  # type: ignore[import-untyped]
except ImportError:  # pragma: no cover - firebase_admin is optional in local scaffold
    firebase_admin = None
    firebase_auth = None


def verify_firebase_token(token: str) -> str:
    """Verify a Firebase ID token and return the authenticated user's UID.

    Never accepts a client-supplied user_id outside the verified bearer token.
    """
    if not token or not token.strip():
        raise ReportAPIError(
            code="UNAUTHORIZED",
            message="Missing or empty bearer token.",
            status_code=401,
        )

    if firebase_admin is not None and firebase_auth is not None:
        try:
            if getattr(firebase_admin, "_apps", None):
                decoded = firebase_auth.verify_id_token(token)
                uid = decoded.get("uid") or decoded.get("sub")
                if not uid:
                    raise ReportAPIError(
                        code="UNAUTHORIZED",
                        message="Token does not contain a valid user identifier.",
                        status_code=401,
                    )
                return str(uid)
        except ReportAPIError:
            raise
        except Exception as exc:
            raise ReportAPIError(
                code="UNAUTHORIZED",
                message="Invalid or expired Firebase ID token.",
                status_code=401,
            ) from exc

    # Stub fallback when firebase_admin is not initialized/installed (e.g., local demo/tests).
    if os.getenv("ENABLE_DEMO_MOCKS", "false").lower() == "true":
        if token.startswith("demo:"):
            uid = token.split(":", 1)[1].strip()
            if uid:
                return uid
        if len(token) >= 8 and token != "invalid":
            return f"stub_{token[:12]}"

    raise ReportAPIError(
        code="UNAUTHORIZED",
        message="Invalid or unverified Firebase ID token.",
        status_code=401,
    )


async def get_current_user_id(authorization: str | None = Header(default=None)) -> str:
    """FastAPI dependency extracting and verifying Authorization: Bearer <token>."""
    if not authorization:
        raise ReportAPIError(
            code="UNAUTHORIZED",
            message="Authorization header is required.",
            status_code=401,
        )

    parts = authorization.split(" ", 1)
    if len(parts) != 2 or parts[0].lower() != "bearer" or not parts[1].strip():
        raise ReportAPIError(
            code="UNAUTHORIZED",
            message="Authorization header must use Bearer <Firebase ID token> format.",
            status_code=401,
        )

    return verify_firebase_token(parts[1].strip())
