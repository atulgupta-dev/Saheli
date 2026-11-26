from __future__ import annotations

import logging
import time
import uuid
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.requests import Request
from starlette.responses import Response

logger = logging.getLogger("saheli.middleware")


class RequestTracingMiddleware(BaseHTTPMiddleware):
    """Middleware for request correlation ID tracing and structured access logging."""

    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        request_id = request.headers.get("X-Request-ID") or str(uuid.uuid4())
        request.state.request_id = request_id

        start_time = time.perf_counter()
        logger.info(f"[{request_id}] --> {request.method} {request.url.path}")

        try:
            response = await call_next(request)
            duration_ms = (time.perf_counter() - start_time) * 1000
            response.headers["X-Request-ID"] = request_id
            logger.info(
                f"[{request_id}] <-- {request.method} {request.url.path} "
                f"Status: {response.status_code} ({duration_ms:.2f}ms)"
            )
            return response
        except Exception as exc:
            duration_ms = (time.perf_counter() - start_time) * 1000
            logger.error(
                f"[{request_id}] <!- {request.method} {request.url.path} "
                f"FAILED with {type(exc).__name__} ({duration_ms:.2f}ms)"
            )
            raise
