from __future__ import annotations

import datetime
from typing import Any, Dict, List, Literal, Optional
from pydantic import BaseModel, Field, field_validator

FlowIntensity = Literal["light", "medium", "heavy"]
SeverityLevel = Literal["mild", "moderate", "severe"]
PredictionConfidence = Literal["none", "low", "medium", "high"]


class PeriodRecordCreate(BaseModel):
    start_date: datetime.date
    end_date: Optional[datetime.date] = None
    flow_intensity: Optional[FlowIntensity] = "medium"
    notes: Optional[str] = None

    @field_validator("end_date")
    @classmethod
    def validate_dates(cls, v: Optional[datetime.date], info: Any) -> Optional[datetime.date]:
        if v is not None and "start_date" in info.data:
            start = info.data["start_date"]
            if v < start:
                raise ValueError("end_date cannot be earlier than start_date")
            duration = (v - start).days + 1
            if duration > 16:
                raise ValueError("Period duration cannot exceed 16 days in a single record")
        return v


class PeriodRecordUpdate(BaseModel):
    start_date: Optional[datetime.date] = None
    end_date: Optional[datetime.date] = None
    flow_intensity: Optional[FlowIntensity] = None
    notes: Optional[str] = None


class PeriodRecordResponse(BaseModel):
    cycle_id: str
    start_date: str
    end_date: Optional[str] = None
    duration_days: Optional[int] = None
    flow_intensity: Optional[str] = "medium"
    notes: Optional[str] = None
    created_at: str
    updated_at: str


class PeriodListResponse(BaseModel):
    cycles: List[PeriodRecordResponse]
    total_count: int


class CycleStatistics(BaseModel):
    total_records: int
    completed_cycles_evaluated: int
    average_cycle_length_days: Optional[float] = None
    average_period_duration_days: Optional[float] = None
    min_cycle_length_days: Optional[int] = None
    max_cycle_length_days: Optional[int] = None
    is_irregular: bool = False
    notes: str


class CyclePrediction(BaseModel):
    status: Literal["insufficient_data", "calculated"]
    predicted_next_start_date: Optional[str] = None
    predicted_next_end_date: Optional[str] = None
    estimated_cycle_length_days: Optional[int] = None
    confidence: PredictionConfidence = "none"
    cycle_variation_days: Optional[int] = None
    is_irregular: bool = False
    message: str
    medical_disclaimer: str = (
        "Educational estimate only. Do not use for contraception, fertility planning, or medical diagnosis."
    )


class MenstrualSymptomCreate(BaseModel):
    date: datetime.date
    symptoms: List[str]
    severity: Optional[SeverityLevel] = "mild"
    notes: Optional[str] = None


class MenstrualSymptomResponse(BaseModel):
    entry_id: str
    date: str
    symptoms: List[str]
    severity: Optional[str] = "mild"
    notes: Optional[str] = None
    safety: Dict[str, Any] = Field(default_factory=dict)
    created_at: str


class MenstrualSymptomListResponse(BaseModel):
    entries: List[MenstrualSymptomResponse]
    total_count: int
