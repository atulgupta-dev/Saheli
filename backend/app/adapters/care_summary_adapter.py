from __future__ import annotations

from app.core.exceptions import FeatureNotAvailableError
from app.core.models import CareSummaryRequest, CareSummaryResponse
from app.services.firestore import FirestoreService

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

        raise FeatureNotAvailableError("Care summary generation is not available yet")
