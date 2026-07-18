import os

# Set before app reads config
os.environ.setdefault("MONGO_DB_NAME", "lexi-guard-test")
os.environ.setdefault("CELERY_TASK_ALWAYS_EAGER", "true")

import pytest
from httpx import ASGITransport, AsyncClient
from app.main import app


@pytest.fixture
def anyio_backend():
    return "asyncio"


@pytest.fixture
async def client():
    """Async client with app lifespan (DB connected). Use for auth/contracts tests."""
    async with app.router.lifespan_context(app):
        async with AsyncClient(
            transport=ASGITransport(app=app),
            base_url="http://test",
        ) as ac:
            yield ac
