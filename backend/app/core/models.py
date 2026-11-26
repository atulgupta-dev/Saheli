from __future__ import annotations

from typing import Any, Dict, List, Literal, Optional
from pydantic import BaseModel, Field

StageType = Literal["menstrual", "pregnancy", "postpartum"]
SafetyLevel = Literal["informational", "consult", "urgent"]


class AuthenticatedUser(BaseModel):
    """User derived strictly from verified Firebase ID token."""
    uid: str
    email: Optional[str] = None
    display_name: Optional[str] = None
    photo_url: Optional[str] = None
    sign_in_provider: Optional[str] = None
    claims: Dict[str, Any] = Field(default_factory=dict)


class ConsentPreferences(BaseModel):
    store_conversations: bool = True
    store_reports: bool = False


class PregnancyStageProfile(BaseModel):
    gestational_week: Optional[int] = None
    due_date: Optional[str] = None


class UserProfileResponse(BaseModel):
    user_id: str
    active_stage: StageType
    locale: str = "hi-IN"
    consent: ConsentPreferences = Field(default_factory=ConsentPreferences)
    stage_profiles: Dict[str, Any] = Field(default_factory=dict)
    display_name: Optional[str] = None
    photo_url: Optional[str] = None
    auth_provider: Optional[str] = None


class StageSwitchRequest(BaseModel):
    active_stage: StageType


class StageSwitchResponse(BaseModel):
    active_stage: StageType


class ChatSafety(BaseModel):
    level: SafetyLevel = "informational"
    message: Optional[str] = None


class ChatRequest(BaseModel):
    stage: str
    message: str
    locale: str = "hi-IN"
    conversation_id: Optional[str] = None
    save_to_memory: bool = True


class ChatResponse(BaseModel):
    conversation_id: str
    reply: str
    sources: List[str] = Field(default_factory=list)
    safety: ChatSafety = Field(default_factory=ChatSafety)
    memory_saved: bool = True


class SymptomSafety(BaseModel):
    level: SafetyLevel = "informational"
    message: Optional[str] = None
    rule_ids: List[str] = Field(default_factory=list)


class SymptomRequest(BaseModel):
    stage: str
    reported_at: str
    symptoms: List[str]
    notes: Optional[str] = None


class SymptomResponse(BaseModel):
    entry_id: str
    saved: bool = True
    safety: SymptomSafety = Field(default_factory=SymptomSafety)


class ReportCitation(BaseModel):
    page: int
    quote: str


class ReportExtracted(BaseModel):
    gestational_age_weeks: Optional[int] = None
    measurements: List[Dict[str, Any]] = Field(default_factory=list)


class ReportResponse(BaseModel):
    report_id: str
    status: Literal["completed", "processing"] = "completed"
    extracted: ReportExtracted = Field(default_factory=ReportExtracted)
    explanations: List[Dict[str, Any]] = Field(default_factory=list)
    citations: List[ReportCitation] = Field(default_factory=list)
    warnings: List[str] = Field(default_factory=lambda: ["Education only"])


class CareSummaryRequest(BaseModel):
    stage: str
    report_ids: List[str] = Field(default_factory=list)
    include_symptoms: bool = True


class CareSummaryResponse(BaseModel):
    summary: str
    references: List[str] = Field(default_factory=list)
    medical_disclaimer: str = "For clinician review, not diagnosis"


class ErrorEnvelope(BaseModel):
    code: str
    message: str
    request_id: str


class ErrorResponse(BaseModel):
    error: ErrorEnvelope
