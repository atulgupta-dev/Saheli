"""Upload validation and page-level text extraction for PDF and image reports."""

from __future__ import annotations

import io
from dataclasses import dataclass
from pathlib import Path

from fastapi import UploadFile
from PIL import Image, UnidentifiedImageError
from pypdf import PdfReader
from pypdf.errors import PdfReadError

from .errors import ReportAPIError

MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024  # 10 MB

ALLOWED_MIME_TYPES: dict[str, set[str]] = {
    "application/pdf": {".pdf"},
    "image/jpeg": {".jpg", ".jpeg"},
    "image/png": {".png"},
}

EXTENSION_TO_MIME: dict[str, str] = {
    ".pdf": "application/pdf",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
}


@dataclass(frozen=True)
class ValidatedUpload:
    """Validated file bytes, normalized MIME type, and per-page text (for PDFs)."""

    filename: str
    mime_type: str
    data: bytes
    page_count: int
    page_texts: dict[int, str]


def _detect_magic_mime(data: bytes) -> str | None:
    if data.startswith(b"%PDF-"):
        return "application/pdf"
    if data.startswith(b"\xff\xd8\xff"):
        return "image/jpeg"
    if data.startswith(b"\x89PNG\r\n\x1a\n"):
        return "image/png"
    return None


def _validate_pdf(data: bytes) -> tuple[int, dict[int, str]]:
    try:
        reader = PdfReader(io.BytesIO(data), strict=False)
        page_count = len(reader.pages)
    except (PdfReadError, Exception) as exc:
        raise ReportAPIError(
            code="VALIDATION_ERROR",
            message="Uploaded PDF file is corrupt or unreadable.",
            status_code=400,
        ) from exc

    if page_count < 1:
        raise ReportAPIError(
            code="VALIDATION_ERROR",
            message="Uploaded PDF contains no pages.",
            status_code=400,
        )

    page_texts: dict[int, str] = {}
    for idx, page in enumerate(reader.pages, start=1):
        try:
            text = page.extract_text() or ""
        except Exception:
            text = ""
        page_texts[idx] = text.strip()

    return page_count, page_texts


def _validate_image(data: bytes, expected_mime: str) -> None:
    try:
        with Image.open(io.BytesIO(data)) as img:
            img.verify()
        with Image.open(io.BytesIO(data)) as img:
            fmt = (img.format or "").upper()
    except (UnidentifiedImageError, OSError, Exception) as exc:
        raise ReportAPIError(
            code="VALIDATION_ERROR",
            message="Uploaded image file is corrupt or unreadable.",
            status_code=400,
        ) from exc

    expected_formats = {
        "image/jpeg": {"JPEG", "MPO"},
        "image/png": {"PNG"},
    }
    if fmt not in expected_formats.get(expected_mime, set()):
        raise ReportAPIError(
            code="VALIDATION_ERROR",
            message="Image contents do not match the declared file type.",
            status_code=400,
        )


async def validate_report_upload(file: UploadFile) -> ValidatedUpload:
    """Validate uploaded PDF/JPEG/PNG report for type, size, emptiness, and integrity."""
    filename = (file.filename or "").strip()
    ext = Path(filename).suffix.lower()
    declared_mime = (file.content_type or "").split(";")[0].strip().lower()

    if declared_mime and declared_mime not in ALLOWED_MIME_TYPES:
        raise ReportAPIError(
            code="VALIDATION_ERROR",
            message="Unsupported file type. Only PDF, JPEG, and PNG files are allowed.",
            status_code=400,
        )

    if ext and ext not in EXTENSION_TO_MIME:
        raise ReportAPIError(
            code="VALIDATION_ERROR",
            message="Unsupported file extension. Only .pdf, .jpg, .jpeg, and .png are allowed.",
            status_code=400,
        )

    data = await file.read()
    if not data:
        raise ReportAPIError(
            code="VALIDATION_ERROR",
            message="Uploaded file is empty.",
            status_code=400,
        )

    if len(data) > MAX_FILE_SIZE_BYTES:
        raise ReportAPIError(
            code="VALIDATION_ERROR",
            message=f"File exceeds maximum allowed size of {MAX_FILE_SIZE_BYTES // (1024 * 1024)} MB.",
            status_code=413,
        )

    magic_mime = _detect_magic_mime(data)
    if magic_mime is None:
        raise ReportAPIError(
            code="VALIDATION_ERROR",
            message="File signature is invalid or unsupported. Please upload a valid PDF, JPEG, or PNG.",
            status_code=400,
        )

    if declared_mime and declared_mime != magic_mime:
        raise ReportAPIError(
            code="VALIDATION_ERROR",
            message="File content does not match the uploaded Content-Type.",
            status_code=400,
        )

    if ext and EXTENSION_TO_MIME[ext] != magic_mime:
        raise ReportAPIError(
            code="VALIDATION_ERROR",
            message="File content does not match the file extension.",
            status_code=400,
        )

    if magic_mime == "application/pdf":
        page_count, page_texts = _validate_pdf(data)
    else:
        _validate_image(data, magic_mime)
        page_count = 1
        page_texts = {}

    return ValidatedUpload(
        filename=filename or "upload",
        mime_type=magic_mime,
        data=data,
        page_count=page_count,
        page_texts=page_texts,
    )
