from __future__ import annotations

import base64
import json
import logging
from typing import Any, Dict, Optional
import firebase_admin
from firebase_admin import auth, credentials
from app.core.config import Settings, settings as app_settings
from app.core.exceptions import AuthenticationError
from app.core.models import AuthenticatedUser

logger = logging.getLogger("saheli.firebase")

_firebase_app: Optional[firebase_admin.App] = None


def get_service_account_info(cfg: Optional[Settings] = None) -> Optional[Dict[str, Any]]:
    """Decode base64 service account JSON in memory without logging or writing to disk."""
    config = cfg or app_settings
    b64_val = config.FIREBASE_SERVICE_ACCOUNT_B64
    if not b64_val or not b64_val.strip():
        return None

    try:
        decoded_bytes = base64.b64decode(b64_val.strip())
        info = json.loads(decoded_bytes.decode("utf-8"))
        if not isinstance(info, dict) or "project_id" not in info:
            logger.error("FIREBASE_SERVICE_ACCOUNT_B64 JSON is invalid or missing project_id")
            return None
        return info
    except Exception as exc:
        logger.error(f"Failed to decode FIREBASE_SERVICE_ACCOUNT_B64: {type(exc).__name__}")
        return None


def get_firebase_app(cfg: Optional[Settings] = None) -> Optional[firebase_admin.App]:
    """
    Initialize Firebase Admin SDK using decoded in-memory service account credentials
    or Application Default Credentials (ADC).
    """
    global _firebase_app
    if _firebase_app is not None:
        return _firebase_app

    config = cfg or app_settings
    try:
        if not firebase_admin._apps:
            sa_info = get_service_account_info(config)
            if sa_info:
                cred = credentials.Certificate(sa_info)
                _firebase_app = firebase_admin.initialize_app(
                    credential=cred,
                    options={"projectId": sa_info.get("project_id", config.FIREBASE_PROJECT_ID)},
                )
                logger.info(f"Firebase Admin SDK initialized using in-memory service account ({config.FIREBASE_PROJECT_ID})")
            else:
                # Fallback to Application Default Credentials
                _firebase_app = firebase_admin.initialize_app(
                    options={"projectId": config.FIREBASE_PROJECT_ID}
                )
                logger.info(f"Firebase Admin SDK initialized with ADC ({config.FIREBASE_PROJECT_ID})")
        else:
            _firebase_app = firebase_admin.get_app()
        return _firebase_app
    except Exception as exc:
        logger.warning(f"Could not initialize live Firebase Admin SDK ({type(exc).__name__}). Using fallback.")
        return None


def verify_firebase_token(token: str, cfg: Optional[Settings] = None) -> AuthenticatedUser:
    """
    Verify Firebase Bearer token and derive user identity strictly from verified token.
    Supports both Firebase Google Sign-In and Email/Password authenticated ID tokens.
    Rejects raw OAuth access tokens, expired tokens, forged tokens, and mock bypass in production.
    """
    config = cfg or app_settings

    if not token or not token.strip():
        raise AuthenticationError("Authentication token is missing")

    clean_token = token.strip()
    if clean_token.lower().startswith("bearer "):
        clean_token = clean_token[7:].strip()

    if not clean_token:
        raise AuthenticationError("Bearer token is empty")

    # Reject raw Google OAuth access tokens (e.g. ya29...)
    if clean_token.startswith("ya29."):
        raise AuthenticationError(
            "Raw Google OAuth access tokens are not accepted. The frontend must exchange OAuth "
            "credentials with Firebase and provide a valid Firebase ID token."
        )

    # STRICT CHECK: In production, NEVER allow mock tokens
    if config.is_production:
        try:
            get_firebase_app(config)
            decoded = auth.verify_id_token(clean_token, check_revoked=True)
            uid = decoded.get("uid") or decoded.get("sub")
            if not uid:
                raise AuthenticationError("Verified token missing UID")
            firebase_meta = decoded.get("firebase", {})
            return AuthenticatedUser(
                uid=uid,
                email=decoded.get("email"),
                display_name=decoded.get("name"),
                photo_url=decoded.get("picture"),
                sign_in_provider=firebase_meta.get("sign_in_provider"),
                claims=decoded,
            )
        except Exception as exc:
            logger.error(f"Production token verification failed: {type(exc).__name__}")
            raise AuthenticationError("Invalid or expired authentication token")

    # Development / Testing Mode with ENABLE_DEMO_MOCKS=True
    if config.ENABLE_DEMO_MOCKS and not config.is_production:
        # Check for recognized mock / test tokens
        if clean_token.startswith("mock_google_") or clean_token == "mock_google_user":
            uid = clean_token
            return AuthenticatedUser(
                uid=uid,
                email=f"{uid}@gmail.com",
                display_name="Saheli Google User",
                photo_url="https://lh3.googleusercontent.com/a/sample_avatar",
                sign_in_provider="google.com",
                claims={"auth_type": "mock_google", "firebase": {"sign_in_provider": "google.com"}, "uid": uid},
            )
        elif clean_token.startswith("mock_email_") or clean_token == "mock_email_user":
            uid = clean_token
            return AuthenticatedUser(
                uid=uid,
                email=f"{uid}@example.com",
                display_name="Saheli Email User",
                photo_url=None,
                sign_in_provider="password",
                claims={"auth_type": "mock_password", "firebase": {"sign_in_provider": "password"}, "uid": uid},
            )
        elif clean_token.startswith("mock_") or clean_token.startswith("demo_") or clean_token.startswith("test_") or clean_token in ("test-token", "demo-token", "mock-token"):
            uid = clean_token
            return AuthenticatedUser(
                uid=uid,
                email=f"{uid}@saheli.example.test",
                display_name=f"User {uid}",
                photo_url=None,
                sign_in_provider="custom",
                claims={"auth_type": "mock_development", "uid": uid},
            )

    # Attempt standard Firebase verification in non-production
    try:
        get_firebase_app(config)
        decoded = auth.verify_id_token(clean_token)
        uid = decoded.get("uid") or decoded.get("sub")
        if not uid:
            raise AuthenticationError("Verified token missing UID")
        firebase_meta = decoded.get("firebase", {})
        return AuthenticatedUser(
            uid=uid,
            email=decoded.get("email"),
            display_name=decoded.get("name"),
            photo_url=decoded.get("picture"),
            sign_in_provider=firebase_meta.get("sign_in_provider"),
            claims=decoded,
        )
    except Exception as exc:
        logger.warning(f"Firebase token verification failed: {type(exc).__name__}")
        raise AuthenticationError("Invalid or expired authentication token")
