import base64
import json
from unittest.mock import patch
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.core.config import Settings
from app.core.firebase import get_service_account_info, verify_firebase_token
from app.core.exceptions import AuthenticationError

client = TestClient(app)


def test_auth_missing_header():
    res = client.get("/api/v1/profile")
    assert res.status_code == 401
    data = res.json()
    assert "error" in data
    assert data["error"]["code"] == "AUTHENTICATION_ERROR"
    assert "request_id" in data["error"]


def test_auth_empty_token():
    res = client.get("/api/v1/profile", headers={"Authorization": "Bearer   "})
    assert res.status_code == 401
    assert res.json()["error"]["code"] == "AUTHENTICATION_ERROR"


def test_auth_invalid_token():
    res = client.get(
        "/api/v1/profile",
        headers={"Authorization": "Bearer invalid_garbage_token"}
    )
    assert res.status_code == 401
    data = res.json()
    assert data["error"]["code"] == "AUTHENTICATION_ERROR"


def test_auth_raw_oauth_access_token_rejected():
    # Google OAuth access tokens start with ya29. and must NOT be accepted as Firebase ID tokens
    res = client.get(
        "/api/v1/profile",
        headers={"Authorization": "Bearer ya29.a0AfH6SMBxyz_mock_oauth_token"}
    )
    assert res.status_code == 401
    data = res.json()
    assert data["error"]["code"] == "AUTHENTICATION_ERROR"
    assert "Raw Google OAuth access tokens are not accepted" in data["error"]["message"]


def test_auth_google_provider_token():
    # Token from Firebase Google Sign-In
    res = client.get(
        "/api/v1/profile",
        headers={"Authorization": "Bearer mock_google_user_priya"}
    )
    assert res.status_code == 200
    data = res.json()
    assert data["user_id"] == "mock_google_user_priya"
    assert data["auth_provider"] == "google.com"
    assert data["display_name"] == "Saheli Google User"
    assert data["photo_url"] is not None


def test_auth_email_password_provider_token():
    # Token from Firebase Email/Password Sign-In
    res = client.get(
        "/api/v1/profile",
        headers={"Authorization": "Bearer mock_email_user_anita"}
    )
    assert res.status_code == 200
    data = res.json()
    assert data["user_id"] == "mock_email_user_anita"
    assert data["auth_provider"] == "password"
    assert data["display_name"] == "Saheli Email User"


def test_auth_valid_mock_token_dev():
    res = client.get(
        "/api/v1/profile",
        headers={"Authorization": "Bearer mock_user_auth_test"}
    )
    assert res.status_code == 200
    data = res.json()
    assert data["user_id"] == "mock_user_auth_test"


def test_auth_production_rejects_mock_token():
    prod_settings = Settings(ENV="production", ENABLE_DEMO_MOCKS=True)
    with pytest.raises(AuthenticationError):
        verify_firebase_token("mock_user_in_prod", cfg=prod_settings)


def test_auth_expired_or_revoked_token_in_production():
    prod_settings = Settings(ENV="production", ENABLE_DEMO_MOCKS=False)
    with patch("firebase_admin.auth.verify_id_token", side_effect=Exception("Firebase token has expired")):
        with pytest.raises(AuthenticationError):
            verify_firebase_token("Bearer expired_jwt_token", cfg=prod_settings)


def test_service_account_b64_decoding():
    sample_sa = {
        "project_id": "saheli-2576f",
        "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC...\n-----END PRIVATE KEY-----\n"
    }
    b64_str = base64.b64encode(json.dumps(sample_sa).encode()).decode()

    cfg = Settings(FIREBASE_SERVICE_ACCOUNT_B64=b64_str)
    decoded = get_service_account_info(cfg)
    assert decoded is not None
    assert decoded["project_id"] == "saheli-2576f"


def test_service_account_b64_invalid_handling():
    cfg_invalid = Settings(FIREBASE_SERVICE_ACCOUNT_B64="not-valid-base64-json@@")
    decoded = get_service_account_info(cfg_invalid)
    assert decoded is None

    cfg_none = Settings(FIREBASE_SERVICE_ACCOUNT_B64=None)
    assert get_service_account_info(cfg_none) is None
