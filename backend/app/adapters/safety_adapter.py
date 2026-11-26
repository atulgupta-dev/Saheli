from __future__ import annotations

import logging
import uuid
from typing import Optional
from app.core.exceptions import FeatureNotAvailableError
from app.core.models import SymptomRequest, SymptomResponse, SymptomSafety
from app.services.firestore import FirestoreService

logger = logging.getLogger("saheli.adapters.safety")


class SafetyAdapter:
    """
    Adapter interfacing Member 2's pregnancy safety and deterministic red-flag warning rules.
    Only pregnancy features are available for MVP; others return FEATURE_NOT_AVAILABLE.
    Provides contract-compliant mock response when Member 2 module is not yet integrated.
    """

    def __init__(self, firestore_service: FirestoreService):
        self.firestore_service = firestore_service

    async def handle_symptoms(self, uid: str, request: SymptomRequest) -> SymptomResponse:
        # Check stage availability
        if request.stage.lower() != "pregnancy":
            raise FeatureNotAvailableError(
                f"Symptom journaling and safety check is not available for '{request.stage}' in MVP. "
                "Only pregnancy is supported."
            )

        # Check if Member 2 module is implemented
        try:
            from app.modules.pregnancy.safety import service as member2_safety_service  # type: ignore
            if hasattr(member2_safety_service, "evaluate_symptoms"):
                return await member2_safety_service.evaluate_symptoms(uid, request)
        except (ImportError, AttributeError):
            pass

        # Deterministic red-flag check stub (independent of LLM)
        entry_id = f"sym_{uuid.uuid4().hex[:8]}"
        symptoms_lower = [s.lower() for s in request.symptoms]

        urgent_signals = {"bleeding", "severe headache", "convulsions", "severe abdominal pain", "vision loss"}
        matched_urgent = [s for s in symptoms_lower if any(u in s for u in urgent_signals)]

        if matched_urgent:
            safety = SymptomSafety(
                level="urgent",
                message="Urgent warning sign detected. Please seek immediate healthcare evaluation.",
                rule_ids=["RULE-PREG-URG-01"],
            )
        else:
            safety = SymptomSafety(
                level="informational",
                message="Symptoms recorded safely in your journal. Stay hydrated and rest.",
                rule_ids=[],
            )

        # Scoped persistence
        self.firestore_service.save_symptom_entry(
            uid=uid,
            entry_id=entry_id,
            entry_data={
                "entry_id": entry_id,
                "stage": request.stage,
                "reported_at": request.reported_at,
                "symptoms": request.symptoms,
                "notes": request.notes,
                "safety": safety.model_dump(),
            },
        )

        return SymptomResponse(
            entry_id=entry_id,
            saved=True,
            safety=safety,
        )
