"""Saheli AI FastAPI main application."""
from __future__ import annotations

import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.api.v1.router import router as api_v1_router
from app.modules.menstrual.router import router as menstrual_router
from app.core.config import settings
from app.core.exceptions import (
    SaheliAppError,
    generic_exception_handler,
    http_exception_handler,
    saheli_app_exception_handler,
    validation_exception_handler,
)
from app.modules.pregnancy.reports.errors import (
    ReportAPIError,
    report_api_error_handler,
)
from app.core.firebase import get_firebase_app
from app.core.middleware import RequestTracingMiddleware

# Configure logging format
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] [%(name)s] %(message)s",
)
logger = logging.getLogger("saheli.app")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application startup and shutdown events."""
    logger.info("Initializing Saheli AI backend services...")
    # Initialize Firebase Admin SDK
    get_firebase_app(settings)
    logger.info(f"Saheli AI backend ready in {settings.ENV} mode (Demo mocks: {settings.ENABLE_DEMO_MOCKS})")
    yield
    logger.info("Shutting down Saheli AI backend services...")


app = FastAPI(
    title="Saheli AI",
    version="0.1.0",
    description="A mobile-first reproductive health companion API",
    lifespan=lifespan,
)

# Request tracing and correlation ID middleware
app.add_middleware(RequestTracingMiddleware)

# Explicit CORS configuration (Disallows wildcard with credentials; supports Vercel and local origins)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_origin_regex=settings.CORS_ORIGIN_REGEX,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["X-Request-ID"],
)

# Structured Error Exception Handlers
app.add_exception_handler(SaheliAppError, saheli_app_exception_handler)
app.add_exception_handler(ReportAPIError, report_api_error_handler)
app.add_exception_handler(RequestValidationError, validation_exception_handler)
app.add_exception_handler(StarletteHTTPException, http_exception_handler)
app.add_exception_handler(Exception, generic_exception_handler)

# Public Health Endpoint
@app.get("/health", tags=["Health"])
def health() -> dict[str, str]:
    return {"status": "ok", "service": "saheli-api", "version": "0.1.0"}


# Register V1 API Routes
app.include_router(api_v1_router)
app.include_router(menstrual_router)
