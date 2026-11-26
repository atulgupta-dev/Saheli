from __future__ import annotations

import datetime
import logging
import uuid
from typing import List, Optional
from app.core.exceptions import NotFoundError, ValidationError
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
from app.modules.menstrual.prediction import (
    calculate_statistics,
    check_period_overlap,
    predict_next_cycle,
)
from app.modules.menstrual.safety import evaluate_menstrual_symptoms
from app.services.firestore import FirestoreService

logger = logging.getLogger("saheli.menstrual.service")


class MenstrualService:
    """Service managing menstrual cycle tracking, predictions, and symptom evaluation."""

    def __init__(self, firestore_service: FirestoreService):
        self.firestore = firestore_service

    def _convert_doc_to_response(self, doc: dict) -> PeriodRecordResponse:
        start_d = datetime.date.fromisoformat(doc["start_date"])
        end_d = datetime.date.fromisoformat(doc["end_date"]) if doc.get("end_date") else None
        duration = ((end_d - start_d).days + 1) if end_d else None

        return PeriodRecordResponse(
            cycle_id=doc["cycle_id"],
            start_date=doc["start_date"],
            end_date=doc.get("end_date"),
            duration_days=duration,
            flow_intensity=doc.get("flow_intensity", "medium"),
            notes=doc.get("notes"),
            created_at=doc.get("created_at", ""),
            updated_at=doc.get("updated_at", ""),
        )

    def create_cycle_record(self, uid: str, payload: PeriodRecordCreate) -> PeriodRecordResponse:
        # Check existing records to prevent duplicates and overlaps
        existing_docs = self.firestore.list_menstrual_cycles(uid)
        existing_periods = [self._convert_doc_to_response(d) for d in existing_docs]

        overlap = check_period_overlap(payload.start_date, payload.end_date, existing_periods)
        if overlap:
            raise ValidationError(
                f"Period overlaps with an existing recorded cycle from {overlap[0]} to {overlap[1]}."
            )

        cycle_id = f"cyc_{uuid.uuid4().hex[:8]}"
        duration = ((payload.end_date - payload.start_date).days + 1) if payload.end_date else None

        cycle_data = {
            "cycle_id": cycle_id,
            "start_date": payload.start_date.isoformat(),
            "end_date": payload.end_date.isoformat() if payload.end_date else None,
            "duration_days": duration,
            "flow_intensity": payload.flow_intensity,
            "notes": payload.notes,
        }

        self.firestore.save_menstrual_cycle(uid, cycle_id, cycle_data)

        # Update menstrual stage profile summary
        updated_periods = existing_periods + [self._convert_doc_to_response(cycle_data)]
        stats = calculate_statistics(updated_periods)
        self.firestore.set_stage_profile(
            uid=uid,
            stage="menstrual",
            stage_data={
                "last_period_date": payload.start_date.isoformat(),
                "average_cycle_length": stats.average_cycle_length_days,
                "average_period_duration": stats.average_period_duration_days,
                "is_irregular": stats.is_irregular,
            },
        )

        return self._convert_doc_to_response(cycle_data)

    def update_cycle_record(
        self,
        uid: str,
        cycle_id: str,
        payload: PeriodRecordUpdate,
    ) -> PeriodRecordResponse:
        doc = self.firestore.get_menstrual_cycle(uid, cycle_id)
        if not doc:
            raise NotFoundError(f"Menstrual cycle record '{cycle_id}' not found.")

        current_start = datetime.date.fromisoformat(doc["start_date"])
        current_end = datetime.date.fromisoformat(doc["end_date"]) if doc.get("end_date") else None

        new_start = payload.start_date if payload.start_date is not None else current_start
        new_end = payload.end_date if payload.end_date is not None else current_end

        if new_end and new_end < new_start:
            raise ValidationError("end_date cannot be earlier than start_date.")

        if new_end:
            duration = (new_end - new_start).days + 1
            if duration > 16:
                raise ValidationError("Period duration cannot exceed 16 days in a single record.")
        else:
            duration = None

        # Check overlaps against all other periods
        existing_docs = self.firestore.list_menstrual_cycles(uid)
        existing_periods = [self._convert_doc_to_response(d) for d in existing_docs]
        overlap = check_period_overlap(new_start, new_end, existing_periods, ignore_cycle_id=cycle_id)
        if overlap:
            raise ValidationError(
                f"Updated period dates overlap with an existing recorded cycle from {overlap[0]} to {overlap[1]}."
            )

        updated_data = {
            **doc,
            "start_date": new_start.isoformat(),
            "end_date": new_end.isoformat() if new_end else None,
            "duration_days": duration,
            "flow_intensity": payload.flow_intensity if payload.flow_intensity is not None else doc.get("flow_intensity"),
            "notes": payload.notes if payload.notes is not None else doc.get("notes"),
        }

        self.firestore.save_menstrual_cycle(uid, cycle_id, updated_data)
        return self._convert_doc_to_response(updated_data)

    def get_cycle_record(self, uid: str, cycle_id: str) -> PeriodRecordResponse:
        doc = self.firestore.get_menstrual_cycle(uid, cycle_id)
        if not doc:
            raise NotFoundError(f"Menstrual cycle record '{cycle_id}' not found.")
        return self._convert_doc_to_response(doc)

    def list_cycle_records(self, uid: str) -> PeriodListResponse:
        docs = self.firestore.list_menstrual_cycles(uid)
        periods = [self._convert_doc_to_response(d) for d in docs]
        return PeriodListResponse(cycles=periods, total_count=len(periods))

    def delete_cycle_record(self, uid: str, cycle_id: str) -> None:
        deleted = self.firestore.delete_menstrual_cycle(uid, cycle_id)
        if not deleted:
            raise NotFoundError(f"Menstrual cycle record '{cycle_id}' not found.")

    def get_statistics(self, uid: str) -> CycleStatistics:
        docs = self.firestore.list_menstrual_cycles(uid)
        periods = [self._convert_doc_to_response(d) for d in docs]
        return calculate_statistics(periods)

    def get_predictions(self, uid: str) -> CyclePrediction:
        docs = self.firestore.list_menstrual_cycles(uid)
        periods = [self._convert_doc_to_response(d) for d in docs]
        return predict_next_cycle(periods)

    def log_symptom_entry(self, uid: str, payload: MenstrualSymptomCreate) -> MenstrualSymptomResponse:
        safety_eval = evaluate_menstrual_symptoms(
            symptoms=payload.symptoms,
            severity=payload.severity or "mild",
            notes=payload.notes or "",
        )

        entry_id = f"msym_{uuid.uuid4().hex[:8]}"
        entry_data = {
            "entry_id": entry_id,
            "date": payload.date.isoformat(),
            "symptoms": payload.symptoms,
            "severity": payload.severity,
            "notes": payload.notes,
            "safety": safety_eval,
        }

        self.firestore.save_menstrual_symptom(uid, entry_id, entry_data)

        return MenstrualSymptomResponse(
            entry_id=entry_id,
            date=payload.date.isoformat(),
            symptoms=payload.symptoms,
            severity=payload.severity,
            notes=payload.notes,
            safety=safety_eval,
            created_at=entry_data.get("created_at", datetime.datetime.now(datetime.timezone.utc).isoformat()),
        )

    def list_symptom_entries(self, uid: str) -> MenstrualSymptomListResponse:
        docs = self.firestore.list_menstrual_symptoms(uid)
        entries = [
            MenstrualSymptomResponse(
                entry_id=d["entry_id"],
                date=d["date"],
                symptoms=d["symptoms"],
                severity=d.get("severity", "mild"),
                notes=d.get("notes"),
                safety=d.get("safety", {}),
                created_at=d.get("created_at", ""),
            )
            for d in docs
        ]
        return MenstrualSymptomListResponse(entries=entries, total_count=len(entries))
