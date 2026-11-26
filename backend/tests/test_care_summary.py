from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)
AUTH_HEADERS = {"Authorization": "Bearer mock_care_user"}


def test_care_summary_pregnancy():
    payload = {
        "stage": "pregnancy",
        "report_ids": ["rep_demo_1", "rep_demo_2"],
        "include_symptoms": True,
    }
    res = client.post("/api/v1/care-summary", headers=AUTH_HEADERS, json=payload)
    assert res.status_code == 200
    data = res.json()
    assert "summary" in data
    assert "references" in data
    assert data["medical_disclaimer"] == "For clinician review, not diagnosis"


def test_care_summary_non_pregnancy_unavailable():
    payload = {
        "stage": "postpartum",
        "report_ids": [],
        "include_symptoms": True,
    }
    res = client.post("/api/v1/care-summary", headers=AUTH_HEADERS, json=payload)
    assert res.status_code == 501
    assert res.json()["error"]["code"] == "FEATURE_NOT_AVAILABLE"
