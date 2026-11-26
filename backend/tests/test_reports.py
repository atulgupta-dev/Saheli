"""Automated tests for Member 3's /api/v1/reports module."""

from __future__ import annotations

import io
import json
from types import SimpleNamespace
from typing import Any

import pytest
from fastapi.testclient import TestClient
from PIL import Image, ImageDraw
from reportlab.pdfgen import canvas

from app.modules.pregnancy.reports import (
    create_reports_app,
    get_extractor_client,
    get_report_store,
)
from app.modules.pregnancy.reports.auth import get_current_user_id
from app.modules.pregnancy.reports.storage import InMemoryReportStore
from app.modules.pregnancy.reports.validation import MAX_FILE_SIZE_BYTES


def _build_synthetic_ultrasound_pdf() -> bytes:
    """Create a 2-page synthetic ultrasound PDF using reportlab."""
    buf = io.BytesIO()
    c = canvas.Canvas(buf)
    c.drawString(72, 750, "SYNTHETIC PRENATAL ULTRASOUND REPORT (DEMO)")
    c.drawString(72, 730, "Gestational Age (Overall): 28 weeks 0 days")
    c.drawString(72, 700, "BPD: 71.2 mm (28w 3d) [Ref: 65 - 77 mm]")
    c.drawString(72, 680, "HC: 262.0 mm (28w 2d)")
    c.showPage()
    c.drawString(72, 750, "Page 2 - Additional Biometry")
    c.drawString(72, 730, "FL: 53.4 mm (28w 1d)")
    c.drawString(72, 710, "EFW: 1180 g")
    c.save()
    return buf.getvalue()


def _build_synthetic_ultrasound_png() -> bytes:
    """Create a synthetic ultrasound report PNG image using Pillow."""
    img = Image.new("RGB", (600, 300), color=(255, 255, 255))
    draw = ImageDraw.Draw(img)
    draw.text((20, 20), "SYNTHETIC ULTRASOUND SCAN - 20w 2d", fill=(0, 0, 0))
    draw.text((20, 60), "BPD: 47.0 mm", fill=(0, 0, 0))
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return buf.getvalue()


class FakeGeminiClient:
    """Test double capturing the exact payload sent to Gemini and returning structured JSON."""

    def __init__(self, payload: dict[str, Any]) -> None:
        self.payload = payload
        self.calls: list[dict[str, Any]] = []
        self.models = self

    def generate_content(self, *, model: str, contents: list[Any], config: Any) -> SimpleNamespace:
        self.calls.append({"model": model, "contents": contents, "config": config})
        return SimpleNamespace(text=json.dumps(self.payload), parsed=None)


@pytest.fixture()
def store() -> InMemoryReportStore:
    return InMemoryReportStore()


@pytest.fixture()
def make_client(store: InMemoryReportStore):
    def _factory(fake_gemini: FakeGeminiClient | None = None, user_id: str = "user_alpha") -> TestClient:
        app = create_reports_app()
        app.dependency_overrides[get_current_user_id] = lambda: user_id
        app.dependency_overrides[get_report_store] = lambda: store
        if fake_gemini is not None:
            app.dependency_overrides[get_extractor_client] = lambda: fake_gemini
        return TestClient(app)

    return _factory


def test_valid_synthetic_pdf_upload_and_citations(make_client) -> None:
    pdf_bytes = _build_synthetic_ultrasound_pdf()
    fake_gemini = FakeGeminiClient(
        {
            "gestational_age_weeks": 28,
            "measurements": [
                {
                    "name": "BPD",
                    "full_name": "Biparietal Diameter",
                    "value": 71.2,
                    "unit": "mm",
                    "documented_gestational_age": "28w 3d",
                    "reference_range": "65 - 77 mm",
                    "page": 1,
                    "quote": "BPD: 71.2 mm (28w 3d) [Ref: 65 - 77 mm]",
                },
                {
                    "name": "FL",
                    "full_name": "Femur Length",
                    "value": 53.4,
                    "unit": "mm",
                    "documented_gestational_age": "28w 1d",
                    "reference_range": None,
                    "page": 2,
                    "quote": "FL: 53.4 mm (28w 1d)",
                },
            ],
            "other_findings": ["EFW: 1180 g"],
            "explanations": [
                {
                    "term": "BPD (Biparietal Diameter)",
                    "plain_explanation": "The side-to-side width of the baby's head.",
                    "comparison_note": "Listed as 71.2 mm (28w 3d) within the printed range of 65 - 77 mm, compared to overall 28w 0d.",
                    "page": 1,
                }
            ],
            "citations": [
                {"page": 1, "quote": "Gestational Age (Overall): 28 weeks 0 days"},
            ],
        }
    )
    client = make_client(fake_gemini=fake_gemini)

    resp = client.post(
        "/api/v1/reports",
        files={"file": ("ultrasound.pdf", pdf_bytes, "application/pdf")},
        data={"stage": "pregnancy", "consent_to_store": "true"},
    )

    assert resp.status_code == 200
    body = resp.json()
    assert body["report_id"].startswith("rep_")
    assert body["status"] == "completed"
    assert body["extracted"]["gestational_age_weeks"] == 28
    assert len(body["extracted"]["measurements"]) == 2
    assert body["extracted"]["measurements"][0]["page"] == 1
    assert body["extracted"]["measurements"][1]["page"] == 2
    assert any(c["page"] == 2 and "FL: 53.4 mm" in c["quote"] for c in body["citations"])
    assert any("Education only" in w for w in body["warnings"])
    # Verify Gemini received both the raw PDF Part and page-annotated text
    assert len(fake_gemini.calls) == 1
    prompt_text = fake_gemini.calls[0]["contents"][1]
    assert "--- PAGE 1 ---" in prompt_text
    assert "--- PAGE 2 ---" in prompt_text


def test_valid_synthetic_image_upload(make_client) -> None:
    png_bytes = _build_synthetic_ultrasound_png()
    fake_gemini = FakeGeminiClient(
        {
            "gestational_age_weeks": 20,
            "measurements": [
                {
                    "name": "BPD",
                    "full_name": "Biparietal Diameter",
                    "value": 47.0,
                    "unit": "mm",
                    "page": 1,
                    "quote": "BPD: 47.0 mm",
                }
            ],
            "explanations": [
                {
                    "term": "BPD",
                    "plain_explanation": "The width of the baby's head.",
                    "comparison_note": "Documented as 47.0 mm alongside 20w 2d.",
                    "page": 1,
                }
            ],
            "citations": [{"page": 1, "quote": "BPD: 47.0 mm"}],
        }
    )
    client = make_client(fake_gemini=fake_gemini)

    resp = client.post(
        "/api/v1/reports",
        files={"file": ("scan.png", png_bytes, "image/png")},
        data={"stage": "pregnancy", "consent_to_store": "false"},
    )

    assert resp.status_code == 200
    body = resp.json()
    assert body["extracted"]["gestational_age_weeks"] == 20
    assert body["citations"][0]["page"] == 1


def test_missing_values_in_report_use_null_and_unknown(make_client) -> None:
    png_bytes = _build_synthetic_ultrasound_png()
    fake_gemini = FakeGeminiClient(
        {
            "gestational_age_weeks": None,
            "measurements": [],
            "other_findings": [],
            "explanations": [],
            "citations": [],
        }
    )
    client = make_client(fake_gemini=fake_gemini)

    resp = client.post(
        "/api/v1/reports",
        files={"file": ("partial.png", png_bytes, "image/png")},
        data={"stage": "pregnancy"},
    )

    assert resp.status_code == 200
    body = resp.json()
    assert body["extracted"]["gestational_age_weeks"] is None
    assert body["extracted"]["measurements"] == []
    assert any("null or unknown" in w for w in body["warnings"])


def test_invalid_file_type_rejected(make_client) -> None:
    client = make_client(fake_gemini=FakeGeminiClient({}))
    resp = client.post(
        "/api/v1/reports",
        files={"file": ("notes.txt", b"plain text report", "text/plain")},
        data={"stage": "pregnancy"},
    )

    assert resp.status_code == 400
    err = resp.json()["error"]
    assert err["code"] == "VALIDATION_ERROR"
    assert err["request_id"]


def test_empty_upload_rejected(make_client) -> None:
    client = make_client(fake_gemini=FakeGeminiClient({}))
    resp = client.post(
        "/api/v1/reports",
        files={"file": ("empty.pdf", b"", "application/pdf")},
        data={"stage": "pregnancy"},
    )

    assert resp.status_code == 400
    assert resp.json()["error"]["code"] == "VALIDATION_ERROR"
    assert "empty" in resp.json()["error"]["message"].lower()


def test_corrupt_pdf_and_corrupt_image_rejected(make_client) -> None:
    client = make_client(fake_gemini=FakeGeminiClient({}))

    bad_pdf = client.post(
        "/api/v1/reports",
        files={"file": ("broken.pdf", b"%PDF-1.4\nnot-a-real-pdf", "application/pdf")},
        data={"stage": "pregnancy"},
    )
    assert bad_pdf.status_code == 400
    assert bad_pdf.json()["error"]["code"] == "VALIDATION_ERROR"

    bad_png = client.post(
        "/api/v1/reports",
        files={"file": ("broken.png", b"\x89PNG\r\n\x1a\ncorrupt", "image/png")},
        data={"stage": "pregnancy"},
    )
    assert bad_png.status_code == 400
    assert bad_png.json()["error"]["code"] == "VALIDATION_ERROR"


def test_oversized_upload_rejected(make_client) -> None:
    client = make_client(fake_gemini=FakeGeminiClient({}))
    oversized = b"%PDF-1.4\n" + (b"0" * MAX_FILE_SIZE_BYTES)
    resp = client.post(
        "/api/v1/reports",
        files={"file": ("huge.pdf", oversized, "application/pdf")},
        data={"stage": "pregnancy"},
    )

    assert resp.status_code == 413
    assert resp.json()["error"]["code"] == "VALIDATION_ERROR"


def test_auth_required_and_owner_only_get(store: InMemoryReportStore) -> None:
    app = create_reports_app()
    raw_client = TestClient(app)

    # Missing Authorization header must fail with 401 UNAUTHORIZED
    unauth = raw_client.post(
        "/api/v1/reports",
        files={"file": ("scan.png", _build_synthetic_ultrasound_png(), "image/png")},
    )
    assert unauth.status_code == 401
    assert unauth.json()["error"]["code"] == "UNAUTHORIZED"

    # Owner saves with consent_to_store=True; another user gets 403 FORBIDDEN
    fake_gemini = FakeGeminiClient(
        {
            "gestational_age_weeks": 20,
            "measurements": [],
            "explanations": [],
            "citations": [],
        }
    )
    app.dependency_overrides[get_report_store] = lambda: store
    app.dependency_overrides[get_extractor_client] = lambda: fake_gemini
    app.dependency_overrides[get_current_user_id] = lambda: "owner_1"

    owner_client = TestClient(app)
    created = owner_client.post(
        "/api/v1/reports",
        files={"file": ("scan.png", _build_synthetic_ultrasound_png(), "image/png")},
        data={"stage": "pregnancy", "consent_to_store": "true"},
    )
    assert created.status_code == 200
    report_id = created.json()["report_id"]

    fetched = owner_client.get(f"/api/v1/reports/{report_id}")
    assert fetched.status_code == 200
    assert fetched.json()["report_id"] == report_id

    app.dependency_overrides[get_current_user_id] = lambda: "other_user_2"
    forbidden = owner_client.get(f"/api/v1/reports/{report_id}")
    assert forbidden.status_code == 403
    assert forbidden.json()["error"]["code"] == "FORBIDDEN"


def test_non_pregnancy_stage_returns_501(make_client) -> None:
    client = make_client(fake_gemini=FakeGeminiClient({}))
    resp = client.post(
        "/api/v1/reports",
        files={"file": ("scan.png", _build_synthetic_ultrasound_png(), "image/png")},
        data={"stage": "menstrual"},
    )
    assert resp.status_code == 501
    assert resp.json()["error"]["code"] == "FEATURE_NOT_AVAILABLE"


def test_missing_gemini_key_returns_503_not_mock(make_client, monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.delenv("GEMINI_API_KEY", raising=False)
    monkeypatch.delenv("GOOGLE_API_KEY", raising=False)
    client = make_client(fake_gemini=None)

    resp = client.post(
        "/api/v1/reports",
        files={"file": ("scan.png", _build_synthetic_ultrasound_png(), "image/png")},
        data={"stage": "pregnancy"},
    )
    assert resp.status_code == 503
    assert resp.json()["error"]["code"] == "CONFIGURATION_ERROR"
