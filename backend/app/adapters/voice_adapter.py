from __future__ import annotations

import logging
import uuid
from typing import Optional
from app.core.exceptions import FeatureNotAvailableError
from app.core.models import ChatRequest, ChatResponse, ChatSafety
from app.modules.menstrual.safety import evaluate_menstrual_symptoms
from app.services.firestore import FirestoreService

logger = logging.getLogger("saheli.adapters.voice")


class VoiceAdapter:
    """
    Adapter interfacing conversational companion services for supported stages.
    Supports pregnancy and menstrual stages.
    Postpartum returns FEATURE_NOT_AVAILABLE.
    """

    def __init__(self, firestore_service: FirestoreService):
        self.firestore_service = firestore_service

    async def handle_chat(self, uid: str, request: ChatRequest) -> ChatResponse:
        stage = request.stage.lower().strip()

        # Check stage availability
        if stage not in ("pregnancy", "menstrual"):
            raise FeatureNotAvailableError(
                f"Conversational companion is not available for '{request.stage}' in MVP. "
                "Supported stages: pregnancy, menstrual. Postpartum features are coming soon."
            )

        # -------------------------------------------------------------
        # 1. Pregnancy Chat (Preserves working implementation)
        # -------------------------------------------------------------
        if stage == "pregnancy":
            # Check if Member 1 module is dynamically imported and implemented
            try:
                from app.services.voice import service as member1_voice_service  # type: ignore
                if hasattr(member1_voice_service, "process_chat"):
                    return await member1_voice_service.process_chat(uid, request)
            except (ImportError, AttributeError):
                pass

            conv_id = request.conversation_id or f"conv_{uuid.uuid4().hex[:8]}"
            reply_text = (
                "Namaste! Main Saheli hoon. Aapki pregnancy journey ke liye yahan hoon. "
                "Aapka aaram bahut zaroori hai; paani khoob piyein aur zaroorat padne par doctor se paramarsh lein."
            )
            sources = ["Saheli Maternal Health Guide v0.1"]
            safety = ChatSafety(level="informational", message=None)

            if request.save_to_memory:
                self.firestore_service.save_conversation_message(
                    uid=uid,
                    conversation_id=conv_id,
                    message_data={
                        "user_message": request.message,
                        "agent_reply": reply_text,
                        "locale": request.locale,
                        "safety": safety.model_dump(),
                    },
                )

            return ChatResponse(
                conversation_id=conv_id,
                reply=reply_text,
                sources=sources,
                safety=safety,
                memory_saved=request.save_to_memory,
            )

        # -------------------------------------------------------------
        # 2. Menstrual Chat (Educational, Safe, Non-Diagnostic)
        # -------------------------------------------------------------
        # Evaluate user query for red-flag symptoms
        safety_eval = evaluate_menstrual_symptoms(
            symptoms=[request.message],
            severity="mild",
            notes="",
        )

        conv_id = request.conversation_id or f"conv_{uuid.uuid4().hex[:8]}"

        if safety_eval["level"] == "urgent":
            safety = ChatSafety(
                level="urgent",
                message=safety_eval["message"],
            )
            reply_text = (
                "Namaste! Aapne jo lakshan bataye hain, unke liye doctor se paramarsh lena zaroori hai. "
                "Yadi dard achanak aur tezz hai ya bleeding bahut zyada hai, toh kripya turant nazdeeki clinic ya doctor se milein. "
                "Saheli ek shaikshik saathi hai aur chikitsakiy jaanch nahi kar sakti."
            )
        else:
            safety = ChatSafety(level="informational", message=None)
            reply_text = (
                "Namaste! Main Saheli hoon. Aapki menstrual health journey mein sahayata ke liye yahan hoon. "
                "Periods ke dauran poshan, aaram aur hydration ka dhyan rakhein. "
                "Yaad rahe, yeh jankari keval shaikshik sahuliyat ke liye hai aur doctor ki salah ka vikalp nahi hai."
            )

        sources = ["Saheli Menstrual Health Guide v0.1"]

        # Only save to memory if consent is active
        memory_saved = False
        if request.save_to_memory:
            profile = self.firestore_service.get_user_profile(uid)
            can_save = profile is None or profile.consent.store_conversations
            if can_save:
                self.firestore_service.save_conversation_message(
                    uid=uid,
                    conversation_id=conv_id,
                    message_data={
                        "user_message": request.message,
                        "agent_reply": reply_text,
                        "locale": request.locale,
                        "stage": "menstrual",
                        "safety": safety.model_dump(),
                    },
                )
                memory_saved = True

        return ChatResponse(
            conversation_id=conv_id,
            reply=reply_text,
            sources=sources,
            safety=safety,
            memory_saved=memory_saved,
        )
