from __future__ import annotations

import logging
from typing import Optional
from fastapi import APIRouter, Depends, File, Form, UploadFile, status
from app.adapters.care_summary_adapter import CareSummaryAdapter
from app.adapters.reports_adapter import ReportsAdapter
from app.adapters.safety_adapter import SafetyAdapter
from app.adapters.voice_adapter import VoiceAdapter
from app.core.dependencies import (
    get_current_user,
    get_firestore_service,
    get_storage_service,
)
from app.core.exceptions import NotFoundError, ValidationError
from app.core.models import (
    AuthenticatedUser,
    CareSummaryRequest,
    CareSummaryResponse,
    ChatRequest,
    ChatResponse,
    ReportResponse,
    StageSwitchRequest,
    StageSwitchResponse,
    SymptomRequest,
    SymptomResponse,
    UserProfileResponse,
)
from app.services.firestore import FirestoreService
from app.services.storage import StorageService

logger = logging.getLogger("saheli.api.v1")

router = APIRouter(prefix="/api/v1", tags=["Saheli V1 API"])


# -------------------------------------------------------------
# GET /api/v1/profile
# -------------------------------------------------------------
@router.get(
    "/profile",
    response_model=UserProfileResponse,
    summary="Get user profile and active stage",
)
def get_user_profile(
    current_user: AuthenticatedUser = Depends(get_current_user),
    firestore_service: FirestoreService = Depends(get_firestore_service),
) -> UserProfileResponse:
    profile = firestore_service.create_or_get_user_profile(
        uid=current_user.uid,
        email=current_user.email,
        display_name=current_user.display_name,
        photo_url=current_user.photo_url,
        auth_provider=current_user.sign_in_provider,
    )
    return profile


# -------------------------------------------------------------
# PATCH /api/v1/profile/stage
# -------------------------------------------------------------
@router.patch(
    "/profile/stage",
    response_model=StageSwitchResponse,
    summary="Switch user active reproductive health stage",
)
def switch_stage(
    payload: StageSwitchRequest,
    current_user: AuthenticatedUser = Depends(get_current_user),
    firestore_service: FirestoreService = Depends(get_firestore_service),
) -> StageSwitchResponse:
    allowed_stages = {"menstrual", "pregnancy", "postpartum"}
    if payload.active_stage.lower() not in allowed_stages:
        raise ValidationError(
            f"Invalid stage '{payload.active_stage}'. Allowed: {', '.join(allowed_stages)}"
        )

    firestore_service.update_active_stage(
        uid=current_user.uid,
        new_stage=payload.active_stage.lower(),
    )
    return StageSwitchResponse(active_stage=payload.active_stage.lower())  # type: ignore[arg-type]


# -------------------------------------------------------------
# POST /api/v1/chat
# -------------------------------------------------------------
@router.post(
    "/chat",
    response_model=ChatResponse,
    summary="Conversational companion message",
)
async def post_chat(
    payload: ChatRequest,
    current_user: AuthenticatedUser = Depends(get_current_user),
    firestore_service: FirestoreService = Depends(get_firestore_service),
) -> ChatResponse:
    adapter = VoiceAdapter(firestore_service=firestore_service)
    return await adapter.handle_chat(uid=current_user.uid, request=payload)


# -------------------------------------------------------------
# POST /api/v1/symptoms
# -------------------------------------------------------------
@router.post(
    "/symptoms",
    response_model=SymptomResponse,
    summary="Record symptom entry and evaluate safety warning signs",
)
async def post_symptoms(
    payload: SymptomRequest,
    current_user: AuthenticatedUser = Depends(get_current_user),
    firestore_service: FirestoreService = Depends(get_firestore_service),
) -> SymptomResponse:
    adapter = SafetyAdapter(firestore_service=firestore_service)
    return await adapter.handle_symptoms(uid=current_user.uid, request=payload)


# -------------------------------------------------------------
# POST /api/v1/reports
# -------------------------------------------------------------
@router.post(
    "/reports",
    response_model=ReportResponse,
    summary="Upload and analyze medical/ultrasound report",
)
async def upload_report(
    file: UploadFile = File(...),
    stage: str = Form("pregnancy"),
    consent_to_store: bool = Form(False),
    current_user: AuthenticatedUser = Depends(get_current_user),
    firestore_service: FirestoreService = Depends(get_firestore_service),
    storage_service: StorageService = Depends(get_storage_service),
) -> ReportResponse:
    file_bytes = await file.read()
    content_type = file.content_type or "application/octet-stream"

    adapter = ReportsAdapter(
        firestore_service=firestore_service,
        storage_service=storage_service,
    )
    return await adapter.handle_report_upload(
        uid=current_user.uid,
        filename=file.filename or "report",
        file_bytes=file_bytes,
        content_type=content_type,
        stage=stage,
        consent_to_store=consent_to_store,
    )


# -------------------------------------------------------------
# GET /api/v1/reports/{report_id}
# -------------------------------------------------------------
@router.get(
    "/reports/{report_id}",
    response_model=ReportResponse,
    summary="Retrieve report analysis strictly for authenticated owner",
)
def get_report(
    report_id: str,
    current_user: AuthenticatedUser = Depends(get_current_user),
    firestore_service: FirestoreService = Depends(get_firestore_service),
) -> ReportResponse:
    # Strictly scoped to current_user.uid: preventing cross-user access
    metadata = firestore_service.get_report_metadata(current_user.uid, report_id)
    if not metadata:
        raise NotFoundError(f"Report '{report_id}' not found")

    return ReportResponse(
        report_id=metadata.get("report_id", report_id),
        status=metadata.get("status", "completed"),
        extracted=metadata.get("extracted", {}),
        explanations=metadata.get("explanations", []),
        citations=metadata.get("citations", []),
        warnings=metadata.get("warnings", ["Education only"]),
    )


# -------------------------------------------------------------
# POST /api/v1/care-summary
# -------------------------------------------------------------
@router.post(
    "/care-summary",
    response_model=CareSummaryResponse,
    summary="Generate clinician review care summary",
)
async def post_care_summary(
    payload: CareSummaryRequest,
    current_user: AuthenticatedUser = Depends(get_current_user),
    firestore_service: FirestoreService = Depends(get_firestore_service),
) -> CareSummaryResponse:
    adapter = CareSummaryAdapter(firestore_service=firestore_service)
    return await adapter.handle_care_summary(uid=current_user.uid, request=payload)
