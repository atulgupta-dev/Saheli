from __future__ import annotations

from typing import Any, Dict, List

# Clinically reviewed menstrual warning indicators
URGENT_KEYWORDS = {
    "excessive bleeding",
    "hemorrhage",
    "soaking pad hourly",
    "soaking tampon hourly",
    "severe abdominal pain",
    "fainting",
    "high fever with tampon",
    "toxic shock",
    "dizziness with bleeding",
}

CONSULT_KEYWORDS = {
    "spotting between periods",
    "prolonged bleeding",
    "bleeding over 8 days",
    "missed period",
    "severe cramps",
    "pmdd",
    "nausea with cramps",
}


def evaluate_menstrual_symptoms(symptoms: List[str], severity: str = "mild", notes: str = "") -> Dict[str, Any]:
    """
    Deterministic rule engine evaluating reported menstrual symptoms.
    Independent of LLM output. Urgent escalation cannot be downgraded.
    """
    all_text = " ".join(symptoms + ([notes] if notes else [])).lower()

    # 1. Check urgent red-flags
    matched_urgent = [kw for kw in URGENT_KEYWORDS if kw in all_text]
    if matched_urgent or (severity == "severe" and any(k in all_text for k in ("bleeding", "fainting", "fever"))):
        return {
            "level": "urgent",
            "message": (
                "Concerning symptom detected (e.g. unusually heavy bleeding, sudden severe pain, or fever). "
                "Please seek prompt clinical evaluation from a healthcare professional or urgent care."
            ),
            "rule_ids": ["RULE-MENST-URG-01"],
            "disclaimer": "Safety screening is non-diagnostic. Always consult a healthcare provider for medical emergencies.",
        }

    # 2. Check consult-level flags
    matched_consult = [kw for kw in CONSULT_KEYWORDS if kw in all_text]
    if matched_consult or severity == "severe":
        return {
            "level": "consult",
            "message": (
                "Symptoms may benefit from non-urgent review by a doctor or gynecologist, "
                "especially if recurrent across multiple cycles."
            ),
            "rule_ids": ["RULE-MENST-CON-01"],
            "disclaimer": "Educational safety flag. Discuss your history with a qualified clinician.",
        }

    # 3. Informational baseline
    return {
        "level": "informational",
        "message": "Symptoms logged in your menstrual health journal. Gentle warmth, hydration, and rest can help manage routine discomfort.",
        "rule_ids": [],
        "disclaimer": "Non-diagnostic educational guidance.",
    }
