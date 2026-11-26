from __future__ import annotations

import logging
import uuid
from typing import Optional
from app.core.exceptions import FeatureNotAvailableError
from app.core.models import ChatRequest, ChatResponse, ChatSafety
from app.services.firestore import FirestoreService

logger = logging.getLogger("saheli.adapters.voice")


class VoiceAdapter:
    """
    Adapter interfacing Member 1's voice/Gemini companion service.
    Only pregnancy features are available for MVP; others return FEATURE_NOT_AVAILABLE.
    Provides contract-compliant mock response when Member 1 module is not yet integrated.
    """

    def __init__(self, firestore_service: FirestoreService):
        self.firestore_service = firestore_service

    async def handle_chat(self, uid: str, request: ChatRequest) -> ChatResponse:
        # Check stage availability
        if request.stage.lower() != "pregnancy":
            raise FeatureNotAvailableError(
                f"Conversational companion is not available for '{request.stage}' in MVP. "
                "Only pregnancy is supported. Menstrual and postpartum features are coming soon."
            )

        # Check if Member 1 module is dynamically imported and implemented
        try:
            from app.services.voice import service as member1_voice_service  # type: ignore
            if hasattr(member1_voice_service, "process_chat"):
                return await member1_voice_service.process_chat(uid, request)
        except (ImportError, AttributeError):
            pass

        # Fallback to contract-compliant mock
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
