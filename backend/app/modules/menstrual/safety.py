from __future__ import annotations

import re
from typing import Any, Dict, List

# -------------------------------------------------------------
# Clinical Pattern Matchers for Menstrual Safety Screening
# -------------------------------------------------------------

# 1. Severe blood loss / Hemorrhagic patterns
RE_HEMORRHAGE = re.compile(
    r"(soak|soaking|soaked|filled|filling|drench|drenching|drenched|saturated?)\s+.*(pad|tampon|cloth|towel)"
    r"|(bleed|bleeding)\s+(through|out)\s+.*(pad|tampon|cloth|clothes|towel)"
    r"|(pad|tampon|cloth)\s+.*(every hour|hourly|each hour|1 hour|2 hours|dono ghante|har ghante)"
    r"|(excessive|uncontrolled|severe|extreme|massive|heavy|bahut zyada|behad|chhoot|bhaari)\s+.*(bleed|bleeding|flow|khoon|raktsrav|blood)"
    r"|(bleed|bleeding|flow|khoon|raktsrav|blood)\s+.*(excessive|uncontrolled|severe|extreme|massive|heavy|bahut zyada|behad|chhoot|bhaari)"
    r"|(blood clot|clot|clots|thakke)\s+.*(large|huge|golf ball|golf-ball|big|bade|bahut bade)"
    r"|(large|huge|golf ball|golf-ball|big|bade)\s+.*(blood clot|clot|clots|thakke)"
    r"|hemorrhag",
    re.IGNORECASE,
)

# 2. Hemodynamic shock / Syncope patterns
RE_SHOCK_SYNCOPE = re.compile(
    r"\b(faint|fainted|fainting|pass out|passed out|passing out|black out|blacked out|blacking out|blackout|blackouts|unconscious|unconsciousness|loss of consciousness|behosh|behosh ho gayi|chakkar khakar gir)\b"
    r"|((dizzy|dizziness|lightheaded|vertigo|chakkar|kamzori|khoon ki kami)\s+.*(bleed|bleeding|blood|khoon|period))"
    r"|((bleed|bleeding|blood|khoon)\s+.*(dizzy|dizziness|lightheaded|vertigo|chakkar|kamzori))"
    r"|\b(clammy|pale|cold sweat|cyanosis)\b",
    re.IGNORECASE,
)

# 3. Toxic Shock Syndrome (TSS) patterns
RE_TSS = re.compile(
    r"((tampon|menstrual cup|cup)\s+.*(fever|chills|rash|vomit|vomiting|bukhar|ulti))"
    r"|((fever|chills|rash|vomit|vomiting|bukhar|ulti)\s+.*(tampon|menstrual cup|cup))"
    r"|\b(toxic shock|tss)\b"
    r"|((high fever|102|103|104|tez bukhar)\s+.*(period|menstrua))",
    re.IGNORECASE,
)

# 4. Acute / Unbearable Pelvic & Abdominal Pain
RE_ACUTE_PAIN = re.compile(
    r"\b(unbearable|excruciating|severe|intense|acute|sudden sharp|stabbing|agonizing|asahan|tezz|chubhan)\s+.*(pain|cramp|cramps|dard|pelvi|abdom|lower belly)"
    r"|\b(pain|cramp|cramps|dard)\s+.*(unbearable|excruciating|severe|intense|acute|sudden sharp|stabbing|agonizing|asahan|tezz)"
    r"|((one side|single side|ek taraf|right side|left side)\s+.*(severe pain|sharp pain|tez dard))",
    re.IGNORECASE,
)

# 5. Consult-level patterns (Prolonged bleeding, intermenstrual spotting, severe PMDD)
RE_CONSULT_PROLONGED = re.compile(
    r"(prolonged|longer than|more than|over|exceeding)\s+.*(7 days|8 days|9 days|10 days|two weeks|2 weeks|hafte se zyada|8 din se zyada)"
    r"|(bleed|bleeding|khoon)\s+.*(for|lasting)\s+([8-9]|\d{2,})\s+days"
    r"|(bleed|bleeding|khoon)\s+.*(won\'t stop|does not stop|not stopping|ruk nahi raha|band nahi ho raha)"
    r"|([8-9]|\d{2,})\s+days\s+(straight|continuously)",
    re.IGNORECASE,
)

RE_CONSULT_SPOTTING_MISSED = re.compile(
    r"\b(spotting|spot|bleed|bleeding)\s+.*(between period|between periods|mid-cycle|beech mein)\b"
    r"|\b(missed|skipped|no period|delayed|amenorrhea)\s+.*(month|months|cycle|cycles|mahine)\b",
    re.IGNORECASE,
)

RE_CONSULT_PMDD = re.compile(
    r"\b(pmdd|severe pms)\b"
    r"|((depression|anxiety|panic|hopeless)\s+.*(before period|during period|menstrua))",
    re.IGNORECASE,
)


def evaluate_menstrual_symptoms(symptoms: List[str], severity: str = "mild", notes: str = "") -> Dict[str, Any]:
    """
    Robust clinical safety screening for menstrual symptoms.
    Uses multi-pattern clinical rules covering diverse phrasing, pad saturation,
    syncope, TSS, acute pain, and bilingual (English/Hinglish) terms.
    Independent of LLM output; urgent guidance is deterministic and non-downgradable.
    """
    combined_text = " ".join(symptoms + ([notes] if notes else [])).strip()

    # 1. Urgent Screening
    urgent_rules = []
    urgent_signals = []

    if RE_HEMORRHAGE.search(combined_text):
        urgent_rules.append("RULE-MENST-URG-01")
        urgent_signals.append("severe or rapid blood loss")

    if RE_SHOCK_SYNCOPE.search(combined_text):
        urgent_rules.append("RULE-MENST-URG-02")
        urgent_signals.append("syncope or hemodynamic instability")

    if RE_TSS.search(combined_text):
        urgent_rules.append("RULE-MENST-URG-03")
        urgent_signals.append("suspected toxic shock or systemic infection signs")

    if RE_ACUTE_PAIN.search(combined_text):
        urgent_rules.append("RULE-MENST-URG-04")
        urgent_signals.append("acute severe or stabbing pain")

    if severity == "severe" and any(k in combined_text.lower() for k in ("bleed", "fever", "faint", "pain", "dard", "khoon")):
        if not urgent_rules:
            urgent_rules.append("RULE-MENST-URG-05")
        urgent_signals.append("severe reported distress with systemic symptoms")

    if urgent_rules:
        return {
            "level": "urgent",
            "message": (
                "Concerning symptom pattern detected (such as unusually heavy bleeding, sudden severe pain, fever with tampon use, or fainting). "
                "Please seek prompt clinical evaluation from a healthcare professional or emergency care."
            ),
            "rule_ids": urgent_rules,
            "disclaimer": "Safety screening is non-diagnostic. Always seek immediate professional care for severe or acute symptoms.",
        }

    # 2. Consult Screening
    consult_rules = []
    if RE_CONSULT_PROLONGED.search(combined_text):
        consult_rules.append("RULE-MENST-CON-01")
    if RE_CONSULT_SPOTTING_MISSED.search(combined_text):
        consult_rules.append("RULE-MENST-CON-02")
    if RE_CONSULT_PMDD.search(combined_text):
        consult_rules.append("RULE-MENST-CON-03")
    if severity == "severe" and not consult_rules:
        consult_rules.append("RULE-MENST-CON-04")

    if consult_rules:
        return {
            "level": "consult",
            "message": (
                "Symptoms noted for non-urgent evaluation with a gynecologist or healthcare provider "
                "(such as prolonged bleeding >7 days, spotting between periods, or recurrent severe discomfort)."
            ),
            "rule_ids": consult_rules,
            "disclaimer": "Educational safety flag. Discuss persistent or changing symptoms with your doctor.",
        }

    # 3. Informational Baseline
    return {
        "level": "informational",
        "message": "Symptoms logged in your menstrual health journal. Gentle warmth, hydration, and rest can help manage routine discomfort.",
        "rule_ids": [],
        "disclaimer": "Non-diagnostic educational guidance.",
    }
