"""Gemini-powered conversational maternal companion service for Saheli AI."""

from __future__ import annotations

import logging
import os
import uuid
from typing import Any, Optional

from google import genai
from google.genai import types

from app.core.exceptions import FeatureNotAvailableError
from app.core.models import ChatRequest, ChatResponse, ChatSafety
from app.services.firestore import FirestoreService, get_default_firestore_service

logger = logging.getLogger("saheli.services.voice")

DEFAULT_GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")

SAHELI_SYSTEM_INSTRUCTION = """You are Saheli (सहेली), a warm, empathetic, caring, and culturally attuned maternal health companion for pregnant women in India.

CRITICAL RULES:
1. LANGUAGE MATCHING:
   - Match the user's language and tone naturally.
   - If user asks in English -> Respond in clear, friendly English.
   - If user asks in Hinglish (Hindi written in English script) -> Respond in natural, warm Hinglish (e.g., "Namaste! Main samajh sakti hoon ki dizziness ki wajah se aap pareshan ho rahi hain...").
   - If user asks in Hindi (Devanagari) -> Respond in respectful, comforting Hindi.

2. MEDICAL SAFETY & NON-DIAGNOSTIC BOUNDARIES:
   - You are an educational and supportive maternal companion, NOT a licensed medical doctor.
   - NEVER diagnose a condition, NEVER prescribe specific medications or dosages, and NEVER claim serious symptoms are "harmless" or "completely normal".
   - If the user reports dizziness, weakness, headache, bleeding, swelling, pain, or reduced baby movements:
     * First validate their feelings with empathy and care.
     * Explain common reasons factually in simple terms (e.g., dehydration, blood pressure fluctuation, low blood sugar, sudden posture change).
     * Provide safe, practical comfort tips (sit down slowly, drink water or ORS/lemon water, rest on the left side).
     * Strongly advise consulting their doctor or visiting the clinic if dizziness is sudden, severe, accompanied by blurred vision, or does not improve with rest.

3. CONCISE & READABLE ON MOBILE:
   - Keep answers focused, conversational, and easy to read on mobile screens (2-4 short paragraphs or bullet points).
   - Use warm maternal encouragement. Include standard health guide references where helpful.
"""

URGENT_SYMPTOMS = {
    "bleeding", "blood", "severe headache", "convulsion", "seizure",
    "severe pain", "fluid leak", "water break", "vision loss", "chest pain"
}

CONSULT_SYMPTOMS = {
    "dizzy", "dizziness", "faint", "swelling", "vomiting", "fever",
    "cramp", "reduced movement", "baby not moving", "chakkar"
}


def _get_gemini_client() -> genai.Client | None:
    api_key = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
    if not api_key or api_key == "replace-with-server-side-key":
        return None
    return genai.Client(api_key=api_key)


def _evaluate_chat_safety(user_text: str) -> ChatSafety:
    text_lower = user_text.lower()
    if any(s in text_lower for s in URGENT_SYMPTOMS):
        return ChatSafety(
            level="urgent",
            message="Possible urgent warning sign detected. Please seek immediate healthcare evaluation.",
        )
    if any(s in text_lower for s in CONSULT_SYMPTOMS):
        return ChatSafety(
            level="consult",
            message="Please mention this symptom to your healthcare provider during your visit.",
        )
    return ChatSafety(level="informational", message=None)


async def process_chat(
    uid: str,
    request: ChatRequest,
    firestore_service: Optional[FirestoreService] = None,
    **kwargs: Any,
) -> ChatResponse:
    """Process companion chat message with Gemini API and manage consented memory."""
    fs = firestore_service or get_default_firestore_service()
    conv_id = request.conversation_id or f"conv_{uuid.uuid4().hex[:8]}"

    safety = _evaluate_chat_safety(request.message)

    # Retrieve pregnancy stage context if available
    profile = fs.get_user_profile(uid)
    gestational_week = None
    if profile and profile.stage_profiles:
        preg_profile = profile.stage_profiles.get("pregnancy", {})
        gestational_week = preg_profile.get("gestational_week")

    context_prompt = f"User is in pregnancy stage (Week {gestational_week or 'unspecified'}).\nUser query: {request.message}"

    client = _get_gemini_client()
    reply_text: str

    if client:
        try:
            response = client.models.generate_content(
                model=DEFAULT_GEMINI_MODEL,
                contents=context_prompt,
                config=types.GenerateContentConfig(
                    system_instruction=SAHELI_SYSTEM_INSTRUCTION,
                    temperature=0.3,
                ),
            )
            reply_text = (response.text or "").strip()
        except Exception as exc:
            logger.warning(f"Gemini chat generation failed: {exc}. Using compassionate fallback.")
            reply_text = (
                "Namaste! Mujhe sunkar chinta hui. Pregnancy mein aaram aur hydration bahut zaroori hai. "
                "Agar aapko chakkar ya kamzori mehsoos ho rahi hai, toh kripya turant baith jaayein, paani piyein, "
                "aur zaroorat padne par apne doctor ya midwife se paramarsh lein."
            )
    else:
        logger.info("GEMINI_API_KEY not configured. Falling back to supportive contextual guidance.")
        if safety.level == "urgent":
            reply_text = (
                "Kripya dhyan dein: Yeh lakshan mahatvapoorna ho sakte hain. "
                "Aapko turant apne doctor ya nazdeeki clinic se sampark karna chahiye. "
                "Akele safar na karein aur kisi parivaar ke sadasya ki madad lein."
            )
        elif "dizzy" in request.message.lower() or "chakkar" in request.message.lower():
            reply_text = (
                "Dizziness (chakkar aana) pregnancy mein aksar dehydration, low blood sugar ya blood pressure "
                "mein badlav ke kaaran ho sakti hai. Kripya turant aaram se baith ya let jaayein, thoda paani ya "
                "nimbu paani piyein. Agar yeh baar-baar ho ya severe ho, toh apne gynaecologist se zaroor consult karein."
            )
        else:
            reply_text = (
                "Namaste! Main Saheli hoon. Aapki pregnancy journey mein aapka aaram aur swasthya sabse zaroori hai. "
                "Paani khoob piyein, poshtik aahar lein aur kisi bhi asuvidha par doctor se paramarsh zaroor lein."
            )

    sources = ["Saheli Maternal Health Guide v0.1", "WHO Antenatal Care Guidelines"]

    # Scoped persistence if user consented to memory
    if request.save_to_memory:
        try:
            fs.save_conversation_message(
                uid=uid,
                conversation_id=conv_id,
                message_data={
                    "user_message": request.message,
                    "agent_reply": reply_text,
                    "locale": request.locale,
                    "safety": safety.model_dump(),
                },
            )
        except Exception as exc:
            logger.warning(f"Could not save conversation message to memory: {exc}")

    return ChatResponse(
        conversation_id=conv_id,
        reply=reply_text,
        sources=sources,
        safety=safety,
        memory_saved=request.save_to_memory,
    )
