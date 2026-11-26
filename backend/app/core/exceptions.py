from __future__ import annotations

import logging
from typing import Any, Dict, Optional
from fastapi import Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

logger = logging.getLogger("saheli.exceptions")


class SaheliAppError(Exception):
    """Base exception for structured Saheli errors."""

    def __init__(
        self,
        message: str,
        code: str = "INTERNAL_ERROR",
        status_code: int = status.HTTP_500_INTERNAL_SERVER_ERROR,
        details: Optional[Dict[str, Any]] = None,
    ):
        super().__init__(message)
        self.message = message
        self.code = code
        self.status_code = status_code
        self.details = details or {}


class AuthenticationError(SaheliAppError):
    def __init__(self, message: str = "Invalid or missing authentication credentials"):
        super().__init__(
            message=message,
            code="AUTHENTICATION_ERROR",
            status_code=status.HTTP_401_UNAUTHORIZED,
        )


class AuthorizationError(SaheliAppError):
    def __init__(self, message: str = "Access forbidden to requested resource"):
        super().__init__(
            message=message,
            code="AUTHORIZATION_ERROR",
            status_code=status.HTTP_403_FORBIDDEN,
        )


class NotFoundError(SaheliAppError):
    def __init__(self, message: str = "Requested resource not found"):
        super().__init__(
            message=message,
            code="NOT_FOUND",
            status_code=status.HTTP_404_NOT_FOUND,
        )


class ValidationError(SaheliAppError):
    def __init__(self, message: str = "Invalid request payload", details: Optional[Dict[str, Any]] = None):
        super().__init__(
            message=message,
            code="VALIDATION_ERROR",
            status_code=422,
            details=details,
        )


class FeatureNotAvailableError(SaheliAppError):
    def __init__(
        self,
        message: str = "Feature not available in current stage. Only pregnancy is supported for MVP.",
    ):
        super().__init__(
            message=message,
            code="FEATURE_NOT_AVAILABLE",
            status_code=status.HTTP_501_NOT_IMPLEMENTED,
        )


class FileTooLargeError(SaheliAppError):
    def __init__(self, message: str = "Uploaded file exceeds maximum allowed size"):
        super().__init__(
            message=message,
            code="FILE_TOO_LARGE",
            status_code=413,
        )


class UnsupportedMediaTypeError(SaheliAppError):
    def __init__(self, message: str = "Unsupported media format. Allowed: PDF, JPEG, PNG"):
        super().__init__(
            message=message,
            code="UNSUPPORTED_MEDIA_TYPE",
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
        )


def _get_request_id(request: Request) -> str:
    return getattr(request.state, "request_id", "unknown-request-id")


def make_error_response(status_code: int, code: str, message: str, request_id: str) -> JSONResponse:
    return JSONResponse(
        status_code=status_code,
        content={
            "error": {
                "code": code,
                "message": message,
                "request_id": request_id,
            }
        },
    )


async def saheli_app_exception_handler(request: Request, exc: SaheliAppError) -> JSONResponse:
    req_id = _get_request_id(request)
    logger.warning(f"[{req_id}] SaheliAppError ({exc.code}): {exc.message}")
    return make_error_response(
        status_code=exc.status_code,
        code=exc.code,
        message=exc.message,
        request_id=req_id,
    )


async def validation_exception_handler(request: Request, exc: RequestValidationError) -> JSONResponse:
    req_id = _get_request_id(request)
    errors = exc.errors()
    msg = "; ".join([f"{'.'.join(str(loc) for loc in err['loc'])}: {err['msg']}" for err in errors])
    logger.warning(f"[{req_id}] ValidationError: {msg}")
    return make_error_response(
        status_code=422,
        code="VALIDATION_ERROR",
        message=msg or "Invalid request parameters",
        request_id=req_id,
    )


async def http_exception_handler(request: Request, exc: StarletteHTTPException) -> JSONResponse:
    req_id = _get_request_id(request)
    code = "HTTP_ERROR"
    if exc.status_code == 404:
        code = "NOT_FOUND"
    elif exc.status_code == 401:
        code = "AUTHENTICATION_ERROR"
    elif exc.status_code == 403:
        code = "AUTHORIZATION_ERROR"
    elif exc.status_code == 405:
        code = "METHOD_NOT_ALLOWED"
    elif exc.status_code == 501:
        code = "FEATURE_NOT_AVAILABLE"

    logger.warning(f"[{req_id}] HTTPException {exc.status_code}: {exc.detail}")
    return make_error_response(
        status_code=exc.status_code,
        code=code,
        message=str(exc.detail),
        request_id=req_id,
    )


async def generic_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    req_id = _get_request_id(request)
    logger.exception(f"[{req_id}] Unhandled server exception: {exc}")
    return make_error_response(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        code="INTERNAL_SERVER_ERROR",
        message="An unexpected server error occurred",
        request_id=req_id,
    )
