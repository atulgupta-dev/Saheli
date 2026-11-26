from __future__ import annotations

from typing import Optional
from fastapi import Depends, Header, Request
from app.core.config import Settings, settings
from app.core.exceptions import AuthenticationError
from app.core.firebase import verify_firebase_token
from app.core.models import AuthenticatedUser
from app.services.firestore import FirestoreService, get_default_firestore_service
from app.services.storage import StorageService, get_default_storage_service


def get_app_settings() -> Settings:
    return settings


def get_current_user(
    request: Request,
    authorization: Optional[str] = Header(None, alias="Authorization"),
    cfg: Settings = Depends(get_app_settings),
) -> AuthenticatedUser:
    """Extract and strictly verify Firebase ID token from Authorization header."""
    if not authorization:
        raise AuthenticationError("Authorization header is required")

    user = verify_firebase_token(token=authorization, cfg=cfg)
    request.state.user = user
    return user


def get_firestore_service() -> FirestoreService:
    return get_default_firestore_service()


def get_storage_service() -> StorageService:
    return get_default_storage_service()
