"""Simple in-memory rate limit for auth endpoints."""
import time
from collections import defaultdict
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware

# IP -> list of request timestamps (pruned to last window_secs)
_auth_attempts: dict[str, list[float]] = defaultdict(list)
WINDOW_SECS = 60
MAX_REQUESTS = 10


def _get_client_ip(request: Request) -> str:
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


class AuthRateLimitMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        # Let CORS preflight requests pass through untouched
        if request.method == "OPTIONS":
            return await call_next(request)

        path = request.url.path
        if path not in ("/api/auth/login", "/api/auth/signup"):
            return await call_next(request)


        ip = _get_client_ip(request)
        now = time.monotonic()
        # Keep only timestamps within window
        _auth_attempts[ip] = [t for t in _auth_attempts[ip] if now - t < WINDOW_SECS]
        if len(_auth_attempts[ip]) >= MAX_REQUESTS:
            return Response(
                content='{"detail":"Too many attempts. Try again later."}',
                status_code=429,
                media_type="application/json",
            )
        _auth_attempts[ip].append(now)
        return await call_next(request)
