"""Har so'rovga request_id — E2E tracing va 502 diagnostikasi."""
from __future__ import annotations

import uuid

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response


class RequestIDMiddleware(BaseHTTPMiddleware):
    """
    X-Request-ID: mijoz yuborsa saqlanadi, aks holda UUID.
    Javobda ham X-Request-ID qaytariladi (loglarni bog'lash uchun).
    """

    async def dispatch(self, request: Request, call_next) -> Response:
        rid = (
            request.headers.get("x-request-id")
            or request.headers.get("X-Request-ID")
            or str(uuid.uuid4())
        )
        request.state.request_id = rid
        response = await call_next(request)
        response.headers["X-Request-ID"] = rid
        return response
