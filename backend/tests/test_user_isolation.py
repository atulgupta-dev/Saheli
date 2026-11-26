from fastapi.testclient import TestClient
from app.main import app
from app.services.firestore import get_default_firestore_service

client = TestClient(app)
USER_A_HEADERS = {"Authorization": "Bearer mock_user_alice"}
USER_B_HEADERS = {"Authorization": "Bearer mock_user_bob"}


def test_cross_user_isolation_reports():
    # Seed synthetic metadata independently of the unfinished analysis endpoint.
    alice_report_id = "rep_synthetic_isolation"
    get_default_firestore_service().save_report_metadata(
        uid="mock_user_alice",
        report_id=alice_report_id,
        report_data={"report_id": alice_report_id, "status": "completed", "extracted": {}},
    )

    # User Alice can access her report
    alice_get = client.get(f"/api/v1/reports/{alice_report_id}", headers=USER_A_HEADERS)
    assert alice_get.status_code == 200
    assert alice_get.json()["report_id"] == alice_report_id

    # User Bob cannot access Alice's report (404 NOT_FOUND strictly scoped to Bob)
    bob_get = client.get(f"/api/v1/reports/{alice_report_id}", headers=USER_B_HEADERS)
    assert bob_get.status_code == 404
    assert bob_get.json()["error"]["code"] == "NOT_FOUND"


def test_cross_user_profile_isolation():
    client.patch("/api/v1/profile/stage", headers=USER_A_HEADERS, json={"active_stage": "postpartum"})
    client.patch("/api/v1/profile/stage", headers=USER_B_HEADERS, json={"active_stage": "menstrual"})

    res_a = client.get("/api/v1/profile", headers=USER_A_HEADERS).json()
    res_b = client.get("/api/v1/profile", headers=USER_B_HEADERS).json()

    assert res_a["user_id"] == "mock_user_alice"
    assert res_a["active_stage"] == "postpartum"
    assert res_b["user_id"] == "mock_user_bob"
    assert res_b["active_stage"] == "menstrual"
