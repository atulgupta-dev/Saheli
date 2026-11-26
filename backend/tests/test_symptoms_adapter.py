from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)
AUTH_HEADERS = {"Authorization": "Bearer mock_symptom_user"}


def test_pregnancy_symptom_informational():
    payload = {
        "stage": "pregnancy",
        "reported_at": "2026-11-26T15:00:00Z",
        "symptoms": ["mild fatigue", "mild backache"],
        "notes": "Tired in afternoon",
    }
    res = client.post("/api/v1/symptoms", headers=AUTH_HEADERS, json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["entry_id"].startswith("sym_")
    assert data["saved"] is True
    assert data["safety"]["level"] == "informational"
    assert data["safety"]["rule_ids"] == []


def test_pregnancy_symptom_urgent_escalation():
    # Urgent warning sign: bleeding or severe headache
    payload = {
        "stage": "pregnancy",
        "reported_at": "2026-11-26T15:00:00Z",
        "symptoms": ["vaginal bleeding", "severe abdominal pain"],
        "notes": "Started an hour ago",
    }
    res = client.post("/api/v1/symptoms", headers=AUTH_HEADERS, json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["saved"] is True
    assert data["safety"]["level"] == "urgent"
    assert "RULE-PREG-URG-01" in data["safety"]["rule_ids"]


def test_non_pregnancy_symptoms_not_available():
    payload = {
        "stage": "postpartum",
        "reported_at": "2026-11-26T15:00:00Z",
        "symptoms": ["fatigue"],
    }
    res = client.post("/api/v1/symptoms", headers=AUTH_HEADERS, json=payload)
    assert res.status_code == 501
    assert res.json()["error"]["code"] == "FEATURE_NOT_AVAILABLE"
