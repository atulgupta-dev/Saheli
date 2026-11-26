from __future__ import annotations

import logging
import uuid
from typing import List
from app.core.exceptions import FeatureNotAvailableError
from app.core.models import CareSummaryRequest, CareSummaryResponse
from app.services.firestore import FirestoreService

logger = logging.getLogger("saheli.adapters.care_summary")


class CareSummaryAdapter:
    """
    Adapter for generating clinician care summaries.
    Aggregates reports and symptoms under authenticated user scope.
    Only pregnancy features are available for MVP; others return FEATURE_NOT_AVAILABLE.
    """

    def __init__(self, firestore_service: FirestoreService):
        self.firestore_service = firestore_service

    async def handle_care_summary(self, uid: str, request: CareSummaryRequest) -> CareSummaryResponse:
        if request.stage.lower() != "pregnancy":
            raise FeatureNotAvailableError(
                f"Care summary generation is not available for '{request.stage}' in MVP. "
                "Only pregnancy is supported."
            )

        # Check existing reports requested by the user
        valid_references: List[str] = []
        for rep_id in request.report_ids:
            metadata = self.firestore_service.get_report_metadata(uid, rep_id)
            if metadata:
                valid_references.append(rep_id)

        event_id = f"care_{uuid.uuid4().hex[:8]}"
        summary_text = (
            f"Compiled pregnancy care overview for healthcare provider review. "
            f"Includes {len(valid_references)} submitted report record(s). "
            f"Patient-reported symptom history included: {request.include_symptoms}. "
            f"For clinician reference only; does not provide a medical diagnosis or clinical evaluation."
        )

        # Store care event under users/{uid}/care_events/{id}
        self.firestore_service.save_care_event(
            uid=uid,
            event_id=event_id,
            event_data={
                "event_id": event_id,
                "summary": summary_text,
                "references": valid_references,
                "stage": request.stage,
            },
        )

        return CareSummaryResponse(
            summary=summary_text,
            references=valid_references,
            medical_disclaimer="For clinician review, not diagnosis",
        )
