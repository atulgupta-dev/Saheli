"""Standardized error handling for the pregnancy reports module."""

from __future__ import annotations

import uuid
from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse


class ReportAPIError(Exception):
    """Domain exception formatted to match shared/api-contracts.md."""

    def __init__(self, code: str, message: str, status_code: int = 400) -> None:
        super().__init__(message)
        self.code = code
        self.message = message
        self.status_code = status_code


def build_error_payload(code: str, message: str, request_id: str | None = None) -> dict:
    """Build the standard error envelope: {"error": {"code", "message", "request_id"}}."""
    return {
        "error": {
            "code": code,
            "message": message,
            "request_id": request_id or str(uuid.uuid4()),
        }
    }


async def report_api_error_handler(_request: Request, exc: ReportAPIError) -> JSONResponse:
    """Handle ReportAPIError with the shared API contract error envelope."""
    return JSONResponse(
        status_code=exc.status_code,
        content=build_error_payload(code=exc.code, message=exc.message),
    )


async def validation_error_handler(_request: Request, exc: RequestValidationError) -> JSONResponse:
    """Normalize FastAPI request validation errors to VALIDATION_ERROR envelope."""
    details = "; ".join(
        f"{'.'.join(str(loc) for loc in err.get('loc', []))}: {err.get('msg', 'invalid')}"
        for err in exc.errors()
    )
    return JSONResponse(
        status_code=422,
        content=build_error_payload(
            code="VALIDATION_ERROR",
            message=details or "Invalid request parameters.",
        ),
    )


def register_report_exception_handlers(app: FastAPI) -> None:
    """Register report module exception handlers on a FastAPI app."""
    app.add_exception_handler(ReportAPIError, report_api_error_handler)
    app.add_exception_handler(RequestValidationError, validation_error_handler)
