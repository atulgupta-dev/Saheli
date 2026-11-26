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


def test_non_pregnancy_chat_feature_not_available():
    payload = {
        "stage": "menstrual",
        "message": "Cramps are painful",
        "locale": "hi-IN",
        "save_to_memory": True,
    }
    res = client.post("/api/v1/chat", headers=AUTH_HEADERS, json=payload)
    assert res.status_code == 501
    data = res.json()
    assert data["error"]["code"] == "FEATURE_NOT_AVAILABLE"
    assert "request_id" in data["error"]
