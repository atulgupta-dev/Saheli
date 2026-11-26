"""Focused full-platform integration test suite validating end-to-end wiring."""

from __future__ import annotations

import io
from types import SimpleNamespace
from typing import Any
import pytest
from fastapi.testclient import TestClient
from PIL import Image, ImageDraw

from app.main import app
from app.core.config import Settings
from app.modules.pregnancy.reports.schemas import (
    Citation,
    GeminiExtractionPayload,
    Measurement,
    TermExplanation,
)
from app.services.firestore import FirestoreService

client = TestClient(app)
AUTH_HEADERS = {"Authorization": "Bearer mock_full_platform_user"}


def _build_test_png() -> bytes:
    img = Image.new("RGB", (400, 200), color=(255, 255, 255))
    draw = ImageDraw.Draw(img)
    draw.text((10, 10), "SYNTHETIC TEST ULTRASOUND", fill=(0, 0, 0))
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return buf.getvalue()


class FakeGeminiTestClient:
    def __init__(self, payload: GeminiExtractionPayload) -> None:
        self.payload = payload
        self.models = self

    def generate_content(self, *, model: str, contents: list[Any], config: Any) -> SimpleNamespace:
        return SimpleNamespace(parsed=self.payload, text=None)


def test_reports_adapter_wires_to_gemini_extraction(monkeypatch):
    """Verify ReportsAdapter delegates to Member 3 Gemini extractor with real citations."""
    fake_payload = GeminiExtractionPayload(
        gestational_age_weeks=28.0,
        measurements=[
            Measurement(
                name="BPD",
                full_name="Biparietal diameter",
                value="71.2",
                unit="mm",
                documented_gestational_age="28w 3d",
                reference_range="65 - 77 mm",
                page=1,
                quote="BPD: 71.2 mm (28w 3d)",
            )
        ],
        other_findings=["Single live fetus"],
        explanations=[
            TermExplanation(
                term="BPD",
                plain_explanation="Distance across baby's head.",
                comparison_note="Consistent with 28w 3d",
                page=1,
            )
        ],
        citations=[Citation(page=1, quote="BPD: 71.2 mm (28w 3d)")],
    )

    from app.modules.pregnancy.reports import extractor
    monkeypatch.setattr(extractor, "get_gemini_client", lambda: FakeGeminiTestClient(fake_payload))

    png_bytes = _build_test_png()
    res = client.post(
        "/api/v1/reports",
        headers=AUTH_HEADERS,
        data={"stage": "pregnancy", "consent_to_store": "true"},
        files={"file": ("scan.png", png_bytes, "image/png")},
    )

    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "completed"
    assert data["extracted"]["gestational_age_weeks"] == 28
    assert len(data["extracted"]["measurements"]) == 1
    assert data["extracted"]["measurements"][0]["name"] == "BPD"
    assert data["extracted"]["measurements"][0]["page"] == 1
    assert data["extracted"]["measurements"][0]["quote"] == "BPD: 71.2 mm (28w 3d)"
    assert data["citations"][0]["page"] == 1
    assert "Education only" in data["warnings"][0]

    # Verify retrieval for authenticated owner
    report_id = data["report_id"]
    get_res = client.get(f"/api/v1/reports/{report_id}", headers=AUTH_HEADERS)
    assert get_res.status_code == 200
    assert get_res.json()["report_id"] == report_id


def test_production_firestore_failure_raises_runtime_error(monkeypatch):
    """Verify that in production mode, failing Firestore connection does NOT silently use memory."""
    prod_settings = Settings(
        ENV="production",
        ENABLE_DEMO_MOCKS=False,
        FIREBASE_PROJECT_ID="saheli-prod-test",
    )

    # Force firestore.Client to raise an exception simulating invalid credentials
    from google.cloud import firestore as google_firestore
    def mock_broken_client(*args, **kwargs):
        raise ConnectionError("Google Cloud unreachable")

    monkeypatch.setattr(google_firestore, "Client", mock_broken_client)
    monkeypatch.setattr("app.services.firestore.settings", prod_settings)

    with pytest.raises(RuntimeError) as exc_info:
        FirestoreService(use_mock=False)

    assert "Cloud Firestore connection failed in production" in str(exc_info.value)
