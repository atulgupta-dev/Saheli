from __future__ import annotations

import logging
from fastapi import APIRouter, Depends, status
from app.core.dependencies import get_current_user, get_firestore_service
from app.core.models import AuthenticatedUser
from app.modules.menstrual.models import (
    CyclePrediction,
    CycleStatistics,
    MenstrualSymptomCreate,
    MenstrualSymptomListResponse,
    MenstrualSymptomResponse,
    PeriodListResponse,
    PeriodRecordCreate,
    PeriodRecordResponse,
    PeriodRecordUpdate,
)
from app.modules.menstrual.service import MenstrualService
from app.services.firestore import FirestoreService

logger = logging.getLogger("saheli.menstrual.router")

router = APIRouter(prefix="/api/v1/menstrual", tags=["Menstrual Health"])


def get_menstrual_service(
    firestore_service: FirestoreService = Depends(get_firestore_service),
) -> MenstrualService:
    return MenstrualService(firestore_service=firestore_service)


# -------------------------------------------------------------
# Period Cycle Tracking Endpoints
# -------------------------------------------------------------

@router.post(
    "/cycles",
    response_model=PeriodRecordResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new period record",
)
def create_cycle_record(
    payload: PeriodRecordCreate,
    current_user: AuthenticatedUser = Depends(get_current_user),
    service: MenstrualService = Depends(get_menstrual_service),
) -> PeriodRecordResponse:
    return service.create_cycle_record(uid=current_user.uid, payload=payload)


@router.get(
    "/cycles",
    response_model=PeriodListResponse,
    summary="Retrieve period cycle history for the authenticated user",
)
def list_cycle_records(
    current_user: AuthenticatedUser = Depends(get_current_user),
    service: MenstrualService = Depends(get_menstrual_service),
) -> PeriodListResponse:
    return service.list_cycle_records(uid=current_user.uid)


@router.get(
    "/cycles/statistics",
    response_model=CycleStatistics,
    summary="Retrieve calculated cycle intervals and statistics",
)
def get_cycle_statistics(
    current_user: AuthenticatedUser = Depends(get_current_user),
    service: MenstrualService = Depends(get_menstrual_service),
) -> CycleStatistics:
    return service.get_statistics(uid=current_user.uid)


@router.get(
    "/cycles/predictions",
    response_model=CyclePrediction,
    summary="Retrieve estimated next period dates with uncertainty handling",
)
def get_cycle_predictions(
    current_user: AuthenticatedUser = Depends(get_current_user),
    service: MenstrualService = Depends(get_menstrual_service),
) -> CyclePrediction:
    return service.get_predictions(uid=current_user.uid)


@router.get(
    "/cycles/{cycle_id}",
    response_model=PeriodRecordResponse,
    summary="Retrieve a specific period record",
)
def get_cycle_record(
    cycle_id: str,
    current_user: AuthenticatedUser = Depends(get_current_user),
    service: MenstrualService = Depends(get_menstrual_service),
) -> PeriodRecordResponse:
    return service.get_cycle_record(uid=current_user.uid, cycle_id=cycle_id)


@router.patch(
    "/cycles/{cycle_id}",
    response_model=PeriodRecordResponse,
    summary="Update an existing period record",
)
def update_cycle_record(
    cycle_id: str,
    payload: PeriodRecordUpdate,
    current_user: AuthenticatedUser = Depends(get_current_user),
    service: MenstrualService = Depends(get_menstrual_service),
) -> PeriodRecordResponse:
    return service.update_cycle_record(uid=current_user.uid, cycle_id=cycle_id, payload=payload)


@router.delete(
    "/cycles/{cycle_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a period record",
)
def delete_cycle_record(
    cycle_id: str,
    current_user: AuthenticatedUser = Depends(get_current_user),
    service: MenstrualService = Depends(get_menstrual_service),
) -> None:
    service.delete_cycle_record(uid=current_user.uid, cycle_id=cycle_id)


# -------------------------------------------------------------
# Menstrual Symptoms Endpoints
# -------------------------------------------------------------

@router.post(
    "/symptoms",
    response_model=MenstrualSymptomResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Log menstrual symptoms with safety rule evaluation",
)
def log_menstrual_symptom(
    payload: MenstrualSymptomCreate,
    current_user: AuthenticatedUser = Depends(get_current_user),
    service: MenstrualService = Depends(get_menstrual_service),
) -> MenstrualSymptomResponse:
    return service.log_symptom_entry(uid=current_user.uid, payload=payload)


@router.get(
    "/symptoms",
    response_model=MenstrualSymptomListResponse,
    summary="Retrieve logged menstrual symptoms history",
)
def list_menstrual_symptoms(
    current_user: AuthenticatedUser = Depends(get_current_user),
    service: MenstrualService = Depends(get_menstrual_service),
) -> MenstrualSymptomListResponse:
    return service.list_symptom_entries(uid=current_user.uid)
