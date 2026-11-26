"""Pydantic schemas for /api/v1/reports matching shared/api-contracts.md."""

from __future__ import annotations

from typing import Literal
from pydantic import BaseModel, Field


class ErrorDetail(BaseModel):
    code: str
    message: str
    request_id: str


class ErrorResponse(BaseModel):
    error: ErrorDetail


class Measurement(BaseModel):
    """Single documented ultrasound measurement with source page citation."""

    name: str = Field(..., description="Abbreviation or name as written in the report (e.g., BPD, FL, EFW).")
    full_name: str = Field(default="unknown", description="Expanded medical term if known, else 'unknown'.")
    value: float | str | None = Field(default=None, description="Numeric or text value, or null if missing.")
    unit: str = Field(default="unknown", description="Measurement unit (e.g., mm, cm, g, bpm), or 'unknown'.")
    documented_gestational_age: str | None = Field(
        default=None,
        description="Gestational age printed next to this measurement, if any.",
    )
    reference_range: str | None = Field(
        default=None,
        description="Reference range printed in the report for this measurement, if any.",
    )
    page: int = Field(..., ge=1, description="1-based page number where this measurement appears.")
    quote: str = Field(..., min_length=1, description="Exact verbatim quote from the source report.")


class ExtractedReportData(BaseModel):
    """Structured factual values extracted from the uploaded ultrasound report."""

    gestational_age_weeks: float | int | None = Field(
        default=None,
        description="Overall documented gestational age in weeks, or null if not stated.",
    )
    measurements: list[Measurement] = Field(default_factory=list)
    other_findings: list[str] = Field(
        default_factory=list,
        description="Other factual observations explicitly stated in the report.",
    )


class TermExplanation(BaseModel):
    """Plain-language explanation and factual comparison for a documented term or value."""

    term: str = Field(..., description="Medical term or measurement abbreviation.")
    plain_explanation: str = Field(..., description="Simple, everyday language explanation.")
    comparison_note: str | None = Field(
        default=None,
        description="Factual comparison of documented values without clinical conclusions or diagnosis.",
    )
    page: int = Field(..., ge=1, description="1-based source page number.")


class Citation(BaseModel):
    """Exact source page and verbatim quote backing extracted data."""

    page: int = Field(..., ge=1)
    quote: str = Field(..., min_length=1)


class ReportResponse(BaseModel):
    """Response schema for POST /api/v1/reports and GET /api/v1/reports/{report_id}."""

    report_id: str
    status: Literal["completed", "processing"] = "completed"
    extracted: ExtractedReportData
    explanations: list[TermExplanation] = Field(default_factory=list)
    citations: list[Citation] = Field(default_factory=list)
    warnings: list[str] = Field(default_factory=list)


class GeminiExtractionPayload(BaseModel):
    """Structured output schema requested from the Gemini API."""

    gestational_age_weeks: float | None = None
    measurements: list[Measurement] = Field(default_factory=list)
    other_findings: list[str] = Field(default_factory=list)
    explanations: list[TermExplanation] = Field(default_factory=list)
    citations: list[Citation] = Field(default_factory=list)
