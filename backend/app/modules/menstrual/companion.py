from __future__ import annotations

import logging
import uuid
from typing import Optional

from app.core.models import ChatRequest, ChatResponse, ChatSafety
from app.modules.menstrual.safety import evaluate_menstrual_symptoms
from app.services.firestore import FirestoreService

logger = logging.getLogger("saheli.menstrual.companion")


class MenstrualCompanion:
    """
    Dedicated menstrual health companion providing safe, educational,
    and non-diagnostic guidance.
    """

    def __init__(self, firestore_service: FirestoreService):
        self.firestore = firestore_service

    async def handle_chat(self, uid: str, request: ChatRequest) -> ChatResponse:
        """
        Processes a menstrual health chat request.
        Performs deterministic safety screening before responding.
        """
        safety_eval = evaluate_menstrual_symptoms(
            symptoms=[request.message],
            severity="mild",
            notes="",
        )

        conv_id = request.conversation_id or f"conv_{uuid.uuid4().hex[:8]}"
        level = safety_eval["level"]

        if level == "urgent":
            safety = ChatSafety(
                level="urgent",
                message=safety_eval["message"],
            )
            reply_text = (
                "Namaste! Aapne jo lakshan bataye hain, unke liye doctor se paramarsh lena zaroori hai. "
                "Yadi bleeding bahut zyada hai (jaise har ghante pad badalna) ya achanak tezz dard hai ya chakkar/behosh ho rahe hain, "
                "toh kripya turant nazdeeki aspatal ya emergency chikitsak se sampark karein. "
                "Saheli ek shaikshik saathi hai aur chikitsakiy jaanch nahi kar sakti."
            )
        elif level == "consult":
            safety = ChatSafety(
                level="consult",
                message=safety_eval["message"],
            )
            reply_text = (
                "Namaste! In lakshano ke liye gynaecologist ya doctor se salah lena faydemand rahega. "
                "Saheli aapko jankari de sakti hai, kintu chikitsakiy jaanch ke liye doctor se sampark karein."
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
            profile = self.firestore.get_user_profile(uid)
            can_save = profile is None or profile.consent.store_conversations
            if can_save:
                self.firestore.save_conversation_message(
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
