from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_cors_localhost_origin():
    res = client.options(
        "/health",
        headers={
            "Origin": "http://localhost:3000",
            "Access-Control-Request-Method": "GET",
        },
    )
    assert res.status_code == 200
    assert res.headers.get("access-control-allow-origin") == "http://localhost:3000"
    assert res.headers.get("access-control-allow-credentials") == "true"


def test_cors_vercel_preview_domain():
    # Should match CORS_ORIGIN_REGEX: https://.*\.vercel\.app
    res = client.options(
        "/health",
        headers={
            "Origin": "https://saheli-preview-xyz.vercel.app",
            "Access-Control-Request-Method": "GET",
        },
    )
    assert res.status_code == 200
    assert res.headers.get("access-control-allow-origin") == "https://saheli-preview-xyz.vercel.app"
    assert res.headers.get("access-control-allow-credentials") == "true"


def test_cors_disallows_arbitrary_untrusted_origins():
    res = client.options(
        "/health",
        headers={
            "Origin": "https://malicious-site.example.com",
            "Access-Control-Request-Method": "GET",
        },
    )
    # Untrusted origin should not receive access-control-allow-origin
    assert res.headers.get("access-control-allow-origin") is None
