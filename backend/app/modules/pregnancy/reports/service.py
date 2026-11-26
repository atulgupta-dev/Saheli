"""Integration service connecting ReportsAdapter with Member 3 report extraction."""

from __future__ import annotations

import logging
from pathlib import Path
from typing import Any, Optional
from app.core.exceptions import FeatureNotAvailableError, ValidationError
from app.core.models import (
    ReportCitation,
    ReportExtracted,
    ReportResponse as CoreReportResponse,
)
from app.modules.pregnancy.reports.errors import ReportAPIError
from app.modules.pregnancy.reports.extractor import extract_report_with_gemini
from app.modules.pregnancy.reports.validation import (
    ValidatedUpload,
    _detect_magic_mime,
    _validate_image,
    _validate_pdf,
)
from app.services.firestore import get_default_firestore_service

logger = logging.getLogger("saheli.modules.reports.service")


async def process_report(
    uid: str,
    report_id: str,
    file_bytes: bytes,
    content_type: str,
    consent_to_store: bool,
    storage_uri: Optional[str] = None,
    temp_file_path: Optional[str] = None,
    filename: Optional[str] = None,
    gemini_client: Any = None,
    **kwargs: Any,
) -> CoreReportResponse:
    """
    Process report upload with Member 3's Gemini multimodal extractor and page citation engine.
    Persists structured metadata under users/{uid}/reports/{report_id} when consent_to_store is True.
    """
    effective_filename = filename
    if not effective_filename and temp_file_path:
        effective_filename = Path(temp_file_path).name
    if not effective_filename:
        effective_filename = "report"

    magic_mime = _detect_magic_mime(file_bytes)
    if not magic_mime:
        raise ValidationError("File signature is invalid or unsupported. Please upload a valid PDF, JPEG, or PNG.")

    try:
        if magic_mime == "application/pdf":
            page_count, page_texts = _validate_pdf(file_bytes)
        else:
            _validate_image(file_bytes, magic_mime)
            page_count = 1
            page_texts = {}
    except Exception as exc:
        logger.warning(f"Document structure validation failed for report {report_id}: {exc}")
        raise FeatureNotAvailableError("Report analysis is not available for this document content.") from exc

    upload = ValidatedUpload(
        filename=effective_filename,
        mime_type=magic_mime,
        data=file_bytes,
        page_count=page_count,
        page_texts=page_texts,
    )

    try:
        analysis = extract_report_with_gemini(upload=upload, report_id=report_id, client=gemini_client)
    except ReportAPIError as exc:
        if exc.code == "CONFIGURATION_ERROR":
            raise FeatureNotAvailableError("Gemini report extraction service is currently unconfigured.") from exc
        raise ValidationError(exc.message) from exc
    except Exception as exc:
        logger.warning(f"Report analysis extraction failed: {exc}")
        raise FeatureNotAvailableError("Report analysis could not safely complete.") from exc

    extracted_measurements = [m.model_dump() for m in analysis.extracted.measurements]
    gestational_age = (
        int(analysis.extracted.gestational_age_weeks)
        if analysis.extracted.gestational_age_weeks is not None
        else None
    )

    core_response = CoreReportResponse(
        report_id=report_id,
        status="completed",
        extracted=ReportExtracted(
            gestational_age_weeks=gestational_age,
            measurements=extracted_measurements,
        ),
        explanations=[e.model_dump() for e in analysis.explanations],
        citations=[ReportCitation(page=c.page, quote=c.quote) for c in analysis.citations],
        warnings=analysis.warnings,
    )

    if consent_to_store:
        try:
            firestore = get_default_firestore_service()
            firestore.save_report_metadata(
                uid=uid,
                report_id=report_id,
                report_data=core_response.model_dump(),
            )
        except Exception as exc:
            logger.warning(f"Could not persist report metadata for {report_id}: {exc}")

    return core_response
