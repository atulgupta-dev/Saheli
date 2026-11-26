from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)
AUTH_HEADERS = {"Authorization": "Bearer mock_chat_user"}


def test_pregnancy_chat_success():
    payload = {
        "stage": "pregnancy",
        "message": "Aaj thakan hai",
        "locale": "hi-IN",
        "conversation_id": None,
        "save_to_memory": True,
    }
    res = client.post("/api/v1/chat", headers=AUTH_HEADERS, json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["conversation_id"].startswith("conv_")
    assert "Saheli" in data["reply"]
    assert isinstance(data["sources"], list)
    assert data["safety"]["level"] in ("informational", "consult", "urgent")
    assert data["memory_saved"] is True


def test_menstrual_chat_success():
    payload = {
        "stage": "menstrual",
        "message": "Periods ke dauran hydration kaise maintain karein?",
        "locale": "hi-IN",
        "save_to_memory": True,
    }
    res = client.post("/api/v1/chat", headers=AUTH_HEADERS, json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["conversation_id"].startswith("conv_")
    assert "Saheli" in data["reply"]
    assert data["safety"]["level"] == "informational"
    assert data["memory_saved"] is True


def test_menstrual_chat_urgent_safety_escalation():
    payload = {
        "stage": "menstrual",
        "message": "Fainting with sudden severe abdominal pain and heavy bleeding",
        "locale": "hi-IN",
        "save_to_memory": False,
    }
    res = client.post("/api/v1/chat", headers=AUTH_HEADERS, json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["safety"]["level"] == "urgent"
    assert data["memory_saved"] is False


def test_unimplemented_stage_chat_feature_not_available():
    payload = {
        "stage": "postpartum",
        "message": "Postpartum recovery question",
        "locale": "hi-IN",
        "save_to_memory": True,
    }
    res = client.post("/api/v1/chat", headers=AUTH_HEADERS, json=payload)
    assert res.status_code == 501
    data = res.json()
    assert data["error"]["code"] == "FEATURE_NOT_AVAILABLE"
    assert "request_id" in data["error"]
