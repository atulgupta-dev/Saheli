from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_get_profile_initial_creation():
    init_headers = {"Authorization": "Bearer mock_profile_init_user"}
    res = client.get("/api/v1/profile", headers=init_headers)
    assert res.status_code == 200
    data = res.json()
    assert data["user_id"] == "mock_profile_init_user"
    assert data["active_stage"] == "pregnancy"
    assert data["locale"] == "hi-IN"
    assert "store_conversations" in data["consent"]
    assert "pregnancy" in data["stage_profiles"]
    assert data["stage_profiles"]["pregnancy"]["gestational_week"] == 28


def test_switch_stage_and_history_retention():
    switch_headers = {"Authorization": "Bearer mock_profile_switch_user"}
    # Initial fetch
    res = client.get("/api/v1/profile", headers=switch_headers)
    assert res.status_code == 200
    assert res.json()["active_stage"] == "pregnancy"

    # Switch to menstrual
    patch_res = client.patch(
        "/api/v1/profile/stage",
        headers=switch_headers,
        json={"active_stage": "menstrual"},
    )
    assert patch_res.status_code == 200
    assert patch_res.json()["active_stage"] == "menstrual"

    # Verify history is retained
    get_res = client.get("/api/v1/profile", headers=switch_headers)
    assert get_res.status_code == 200
    profile_data = get_res.json()
    assert profile_data["active_stage"] == "menstrual"
    # Pregnancy history retained
    assert "pregnancy" in profile_data["stage_profiles"]
    assert profile_data["stage_profiles"]["pregnancy"]["gestational_week"] == 28

    # Switch to postpartum
    patch_postpartum = client.patch(
        "/api/v1/profile/stage",
        headers=switch_headers,
        json={"active_stage": "postpartum"},
    )
    assert patch_postpartum.status_code == 200
    assert patch_postpartum.json()["active_stage"] == "postpartum"


def test_returning_user_profile_preservation():
    # A user logs in and sets stage to postpartum
    returning_user_headers = {"Authorization": "Bearer mock_google_user_returning_mom"}
    client.patch(
        "/api/v1/profile/stage",
        headers=returning_user_headers,
        json={"active_stage": "postpartum"}
    )

    # User adds a symptom
    sym_res = client.post(
        "/api/v1/symptoms",
        headers=returning_user_headers,
        json={
            "stage": "pregnancy",
            "reported_at": "2026-11-27T00:00:00Z",
            "symptoms": ["mild nausea"],
        }
    )
    assert sym_res.status_code == 200

    # User signs in again (e.g. fresh session / Google Sign-In)
    profile_res = client.get("/api/v1/profile", headers=returning_user_headers)
    assert profile_res.status_code == 200
    profile_data = profile_res.json()

    # Active stage must still be postpartum, NOT reset to default pregnancy!
    assert profile_data["active_stage"] == "postpartum"
    assert profile_data["auth_provider"] == "google.com"
    assert "pregnancy" in profile_data["stage_profiles"]
    assert profile_data["stage_profiles"]["pregnancy"]["gestational_week"] == 28


def test_invalid_stage_rejected():
    res = client.patch(
        "/api/v1/profile/stage",
        headers={"Authorization": "Bearer mock_profile_stage_test"},
        json={"active_stage": "invalid_stage_xyz"},
    )
    assert res.status_code == 422
    data = res.json()
    assert data["error"]["code"] == "VALIDATION_ERROR"
