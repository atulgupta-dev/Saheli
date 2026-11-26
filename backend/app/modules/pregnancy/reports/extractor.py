"""Gemini API report extraction, citation grounding, and plain-language explanation."""

from __future__ import annotations

import json
import os
from typing import Any, Protocol

from google import genai
from google.genai import types

from .errors import ReportAPIError
from .schemas import (
    Citation,
    ExtractedReportData,
    GeminiExtractionPayload,
    Measurement,
    ReportResponse,
    TermExplanation,
)
from .validation import ValidatedUpload

DEFAULT_GEMINI_MODEL = "gemini-2.5-flash"

STANDARD_EDUCATIONAL_WARNING = (
    "Education only — this summary is not a medical diagnosis, clinical interpretation, "
    "or treatment advice. Please discuss your full report with your doctor or midwife."
)

EXTRACTION_SYSTEM_PROMPT = """You are a careful, non-diagnostic medical document reader for pregnant users.
Your job is to extract ONLY factual information explicitly written in the uploaded ultrasound report.

STRICT RULES:
1. NEVER invent, guess, or extrapolate any measurement, gestational age, or finding.
   - If a value is not present in the document, set it to null (for numbers/optional fields) or "unknown" (for string units/full_name).
2. CITE EXACT SOURCE PAGES:
   - Every measurement and citation MUST include the exact 1-based `page` number where it appears and a verbatim `quote` copied from that page.
   - For single-page images, `page` is always 1.
3. SIMPLE EVERYDAY EXPLANATIONS:
   - For each medical term or abbreviation found in the report (e.g., BPD, HC, AC, FL, EFW, AFI, FHR, CRL), provide a short explanation in simple, everyday language.
4. FACTUAL COMPARISON WITHOUT DIAGNOSIS:
   - In `comparison_note`, clearly compare documented measurements against any reference range or per-measurement gestational age printed in the report (for example: "Listed as 71.2 mm (28w 3d), while the report's overall documented gestational age is 28w 0d").
   - NEVER make clinical conclusions, diagnoses, risk assessments, or treatment recommendations (do not say "normal", "abnormal", "healthy", "concerning", or "requires treatment" unless quoting the report verbatim).
5. Return valid JSON matching the requested schema."""


class GeminiClientProtocol(Protocol):
    """Minimal protocol for dependency-injecting or mocking the Gemini client in tests."""

    @property
    def models(self) -> Any: ...


def get_gemini_client() -> genai.Client:
    """Create a server-side Gemini client using GEMINI_API_KEY or GOOGLE_API_KEY."""
    api_key = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
    if not api_key or api_key == "replace-with-server-side-key":
        raise ReportAPIError(
            code="CONFIGURATION_ERROR",
            message="Server Gemini API key is not configured.",
            status_code=503,
        )
    return genai.Client(api_key=api_key)


def _build_prompt(upload: ValidatedUpload) -> str:
    lines = [
        f"Document filename: {upload.filename}",
        f"Total pages: {upload.page_count}",
        "Extract all documented ultrasound measurements, gestational age (if stated), "
        "plain-language explanations, factual comparisons, and exact page citations.",
    ]
    if upload.page_texts:
        lines.append("\nExtracted text by page (1-based) to help verify exact page numbers and quotes:")
        for page_num in sorted(upload.page_texts):
            text = upload.page_texts[page_num]
            if text:
                lines.append(f"--- PAGE {page_num} ---\n{text}")
            else:
                lines.append(f"--- PAGE {page_num} ---\n[No embedded text; inspect visual page]")
    return "\n".join(lines)


def _parse_payload(raw_response: Any) -> GeminiExtractionPayload:
    parsed = getattr(raw_response, "parsed", None)
    if isinstance(parsed, GeminiExtractionPayload):
        return parsed
    if isinstance(parsed, dict):
        return GeminiExtractionPayload.model_validate(parsed)

    text = getattr(raw_response, "text", None)
    if not text:
        raise ReportAPIError(
            code="EXTRACTION_ERROR",
            message="Gemini returned an empty response while reading the report.",
            status_code=502,
        )
    try:
        data = json.loads(text)
        return GeminiExtractionPayload.model_validate(data)
    except Exception as exc:
        raise ReportAPIError(
            code="EXTRACTION_ERROR",
            message="Unable to parse structured report extraction from Gemini response.",
            status_code=502,
        ) from exc


def _normalize_page(page: int, max_pages: int) -> int:
    if page < 1:
        return 1
    if page > max_pages:
        return max_pages
    return page


def extract_report_with_gemini(
    upload: ValidatedUpload,
    report_id: str,
    client: GeminiClientProtocol | None = None,
) -> ReportResponse:
    """Send validated PDF/image bytes to Gemini API and return cited, non-diagnostic results."""
    gemini_client = client or get_gemini_client()
    model_name = os.getenv("GEMINI_MODEL", DEFAULT_GEMINI_MODEL)

    contents = [
        types.Part.from_bytes(data=upload.data, mime_type=upload.mime_type),
        _build_prompt(upload),
    ]

    try:
        raw_response = gemini_client.models.generate_content(
            model=model_name,
            contents=contents,
            config=types.GenerateContentConfig(
                system_instruction=EXTRACTION_SYSTEM_PROMPT,
                temperature=0.0,
                response_mime_type="application/json",
                response_schema=GeminiExtractionPayload,
            ),
        )
    except ReportAPIError:
        raise
    except Exception as exc:
        raise ReportAPIError(
            code="EXTRACTION_ERROR",
            message="Failed to analyze the uploaded report with Gemini.",
            status_code=502,
        ) from exc

    payload = _parse_payload(raw_response)

    normalized_measurements: list[Measurement] = []
    seen_citations: set[tuple[int, str]] = set()
    citations: list[Citation] = []

    for m in payload.measurements:
        page = _normalize_page(m.page, upload.page_count)
        quote = m.quote.strip()
        normalized_measurements.append(
            m.model_copy(
                update={
                    "page": page,
                    "quote": quote,
                    "unit": m.unit.strip() if m.unit and m.unit.strip() else "unknown",
                    "full_name": (
                        m.full_name.strip() if m.full_name and m.full_name.strip() else "unknown"
                    ),
                }
            )
        )
        key = (page, quote)
        if quote and key not in seen_citations:
            seen_citations.add(key)
            citations.append(Citation(page=page, quote=quote))

    for c in payload.citations:
        page = _normalize_page(c.page, upload.page_count)
        quote = c.quote.strip()
        key = (page, quote)
        if quote and key not in seen_citations:
            seen_citations.add(key)
            citations.append(Citation(page=page, quote=quote))

    explanations = [
        TermExplanation(
            term=exp.term.strip(),
            plain_explanation=exp.plain_explanation.strip(),
            comparison_note=exp.comparison_note.strip() if exp.comparison_note else None,
            page=_normalize_page(exp.page, upload.page_count),
        )
        for exp in payload.explanations
    ]

    warnings = [STANDARD_EDUCATIONAL_WARNING]
    if not normalized_measurements:
        warnings.append(
            "No structured measurements were found in this document; missing fields are marked null or unknown."
        )

    return ReportResponse(
        report_id=report_id,
        status="completed",
        extracted=ExtractedReportData(
            gestational_age_weeks=payload.gestational_age_weeks,
            measurements=normalized_measurements,
            other_findings=payload.other_findings,
        ),
        explanations=explanations,
        citations=citations,
        warnings=warnings,
    )
