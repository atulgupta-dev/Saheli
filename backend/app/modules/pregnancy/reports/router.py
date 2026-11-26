"""FastAPI router for /api/v1/reports endpoints."""

from __future__ import annotations

import uuid
from fastapi import APIRouter, Depends, FastAPI, File, Form, UploadFile

from .auth import get_current_user_id
from .errors import ReportAPIError, register_report_exception_handlers
from .extractor import GeminiClientProtocol, extract_report_with_gemini, get_gemini_client
from .schemas import ReportResponse
from .storage import InMemoryReportStore, report_store
from .validation import validate_report_upload

ALLOWED_STAGES = {"pregnancy", "menstrual", "postpartum"}

router = APIRouter(prefix="/api/v1/reports", tags=["reports"])


def get_report_store() -> InMemoryReportStore:
    """Dependency returning the report store (overridable in tests or Firestore wiring)."""
    return report_store


def get_extractor_client() -> GeminiClientProtocol:
    """Dependency returning the server-side Gemini client (overridable in tests)."""
    return get_gemini_client()


@router.post("", response_model=ReportResponse)
async def upload_and_analyze_report(
    file: UploadFile = File(...),
    stage: str = Form("pregnancy"),
    consent_to_store: bool = Form(False),
    user_id: str = Depends(get_current_user_id),
    store: InMemoryReportStore = Depends(get_report_store),
    gemini_client: GeminiClientProtocol = Depends(get_extractor_client),
) -> ReportResponse:
    """Upload a synthetic ultrasound PDF/JPEG/PNG and return cited plain-language analysis."""
    normalized_stage = stage.strip().lower()
    if normalized_stage not in ALLOWED_STAGES:
        raise ReportAPIError(
            code="VALIDATION_ERROR",
            message="Invalid stage. Must be one of: pregnancy, menstrual, postpartum.",
            status_code=400,
        )

    if normalized_stage != "pregnancy":
        raise ReportAPIError(
            code="FEATURE_NOT_AVAILABLE",
            message=f"Report analysis for '{normalized_stage}' is coming soon. Only 'pregnancy' is supported in MVP.",
            status_code=501,
        )

    validated = await validate_report_upload(file)
    report_id = f"rep_{uuid.uuid4().hex[:12]}"
    result = extract_report_with_gemini(
        upload=validated,
        report_id=report_id,
        client=gemini_client,
    )

    if consent_to_store:
        store.save(owner_uid=user_id, report=result)

    return result


@router.get("/{report_id}", response_model=ReportResponse)
async def get_report(
    report_id: str,
    user_id: str = Depends(get_current_user_id),
    store: InMemoryReportStore = Depends(get_report_store),
) -> ReportResponse:
    """Retrieve a previously consented report belonging to the authenticated user."""
    return store.get_for_owner(owner_uid=user_id, report_id=report_id)


def create_reports_app() -> FastAPI:
    """Create a standalone FastAPI app mounting the reports router and error handlers."""
    app = FastAPI(title="Saheli AI — Reports Module", version="0.1.0")
    register_report_exception_handlers(app)
    app.include_router(router)
    return app
