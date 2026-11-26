from fastapi.testclient import TestClient
from app.main import app
from app.services.storage import StorageService

client = TestClient(app)
AUTH_HEADERS = {"Authorization": "Bearer mock_reports_user"}


def test_upload_report_with_storage_consent(monkeypatch):
    from app.services.firestore import FirestoreService
    saved = []
    monkeypatch.setattr(FirestoreService, "save_report_metadata", lambda *args, **kwargs: saved.append(kwargs))
    # Upload with valid PDF magic bytes %PDF-
    valid_pdf_bytes = b"%PDF-1.4 simulated ultrasound report content"
    res = client.post(
        "/api/v1/reports",
        headers=AUTH_HEADERS,
        data={"stage": "pregnancy", "consent_to_store": "true"},
        files={"file": ("ultrasound_week28.pdf", valid_pdf_bytes, "application/pdf")},
    )
    assert res.status_code == 501
    assert res.json()["error"]["code"] == "FEATURE_NOT_AVAILABLE"
    assert saved == []


def test_upload_report_without_storage_consent():
    # Valid PNG magic bytes \x89PNG\r\n\x1a\n
    valid_png_bytes = b"\x89PNG\r\n\x1a\n fake image bytes"
    res = client.post(
        "/api/v1/reports",
        headers=AUTH_HEADERS,
        data={"stage": "pregnancy", "consent_to_store": "false"},
        files={"file": ("ultrasound_scan.png", valid_png_bytes, "image/png")},
    )
    assert res.status_code == 501
    assert res.json()["error"]["code"] == "FEATURE_NOT_AVAILABLE"


def test_upload_jpeg_valid_magic_bytes():
    # Valid JPEG magic bytes \xff\xd8\xff
    valid_jpeg_bytes = b"\xff\xd8\xff\xe0\x00\x10JFIF"
    res = client.post(
        "/api/v1/reports",
        headers=AUTH_HEADERS,
        data={"stage": "pregnancy", "consent_to_store": "true"},
        files={"file": ("ultrasound.jpg", valid_jpeg_bytes, "image/jpeg")},
    )
    assert res.status_code == 501
    assert res.json()["error"]["code"] == "FEATURE_NOT_AVAILABLE"


def test_upload_corrupted_magic_bytes_rejected():
    # Declares PDF MIME type, but binary content is plain text / corrupted
    fake_pdf_bytes = b"This is not a real PDF file content without magic bytes"
    res = client.post(
        "/api/v1/reports",
        headers=AUTH_HEADERS,
        data={"stage": "pregnancy", "consent_to_store": "true"},
        files={"file": ("fake.pdf", fake_pdf_bytes, "application/pdf")},
    )
    assert res.status_code == 415
    data = res.json()
    assert data["error"]["code"] == "UNSUPPORTED_MEDIA_TYPE"


def test_upload_unsupported_media_type():
    res = client.post(
        "/api/v1/reports",
        headers=AUTH_HEADERS,
        data={"stage": "pregnancy", "consent_to_store": "false"},
        files={"file": ("script.sh", b"#!/bin/bash echo bad", "text/x-shellscript")},
    )
    assert res.status_code == 415
    data = res.json()
    assert data["error"]["code"] == "UNSUPPORTED_MEDIA_TYPE"


def test_upload_file_too_large():
    # 11MB file with PDF magic bytes exceeds 10MB limit
    huge_bytes = b"%PDF-" + (b"0" * (11 * 1024 * 1024))
    res = client.post(
        "/api/v1/reports",
        headers=AUTH_HEADERS,
        data={"stage": "pregnancy", "consent_to_store": "false"},
        files={"file": ("huge.pdf", huge_bytes, "application/pdf")},
    )
    assert res.status_code == 413
    data = res.json()
    assert data["error"]["code"] == "FILE_TOO_LARGE"


def test_upload_non_pregnancy_not_available():
    res = client.post(
        "/api/v1/reports",
        headers=AUTH_HEADERS,
        data={"stage": "menstrual", "consent_to_store": "false"},
        files={"file": ("doc.pdf", b"%PDF-1.4", "application/pdf")},
    )
    assert res.status_code == 501
    assert res.json()["error"]["code"] == "FEATURE_NOT_AVAILABLE"


def test_storage_service_ephemeral_temp_file_cleanup():
    storage = StorageService()
    test_bytes = b"%PDF-1.4 ephemeral testing"
    temp_path_captured = None

    with storage.ephemeral_temp_file("test.pdf", test_bytes) as temp_path:
        temp_path_captured = temp_path
        import os
        assert os.path.exists(temp_path)
        with open(temp_path, "rb") as f:
            assert f.read() == test_bytes

    # Ensure file is deleted immediately upon exiting context
    import os
    assert not os.path.exists(temp_path_captured)
