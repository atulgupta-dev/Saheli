from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_error_schema_format():
    # Call an endpoint that triggers 401
    res = client.get("/api/v1/profile")
    assert res.status_code == 401
    body = res.json()

    # Schema must strictly match {"error": {"code": "...", "message": "...", "request_id": "..."}}
    assert "error" in body
    assert "code" in body["error"]
    assert "message" in body["error"]
    assert "request_id" in body["error"]
    assert isinstance(body["error"]["code"], str)
    assert isinstance(body["error"]["message"], str)
    assert isinstance(body["error"]["request_id"], str)

    # Response headers must include X-Request-ID
    assert "x-request-id" in res.headers
    assert res.headers["x-request-id"] == body["error"]["request_id"]


def test_404_error_schema_format():
    res = client.get(
        "/api/v1/reports/non_existent_report_id",
        headers={"Authorization": "Bearer mock_err_user"}
    )
    assert res.status_code == 404
    body = res.json()
    assert body["error"]["code"] == "NOT_FOUND"
    assert "request_id" in body["error"]
