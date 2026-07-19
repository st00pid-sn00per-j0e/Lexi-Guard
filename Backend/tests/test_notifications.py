from datetime import datetime, timezone

import pytest
from bson import ObjectId
from fastapi import FastAPI
from httpx import ASGITransport, AsyncClient

from app.routes.auth import get_current_user_from_access_token
from app.routes.notifications import router


class FakeCursor:
    def __init__(self, docs):
        self.docs = docs
        self.sort_args = None
        self.limit_value = None

    def sort(self, *args):
        self.sort_args = args
        return self

    def limit(self, value):
        self.limit_value = value
        return self

    async def to_list(self, length):
        return self.docs[:length]


class FakeNotificationsCollection:
    def __init__(self, docs):
        self.cursor = FakeCursor(docs)
        self.last_query = None

    def find(self, query):
        self.last_query = query
        return self.cursor


class FakeDb:
    def __init__(self, notifications):
        self.notifications = notifications


@pytest.mark.asyncio
async def test_notification_history_returns_user_company_and_system_notifications():
    user_id = ObjectId()
    company_id = "company-123"
    notification_id = ObjectId()

    collection = FakeNotificationsCollection(
        [
            {
                "_id": notification_id,
                "user_id": str(user_id),
                "type": "High Risk",
                "title": "Contract flagged",
                "description": "One clause requires review.",
                "created_at": datetime(2026, 7, 19, 10, 0, tzinfo=timezone.utc),
                "scope": "personal",
            },
            {
                "_id": ObjectId(),
                "company_id": company_id,
                "type": "Update",
                "title": "Company policy updated",
                "description": "A shared rule changed.",
                "created_at": "2026-07-19T09:30:00Z",
                "contract_scope": "company",
            },
            {
                "_id": ObjectId(),
                "type": "Info",
                "title": "System maintenance",
                "description": "Maintenance window scheduled.",
                "scope": "system",
            },
        ]
    )

    test_app = FastAPI()
    test_app.db = FakeDb(collection)

    async def current_user_override():
        return {
            "_id": user_id,
            "account_type": "company",
            "company_id": company_id,
        }

    test_app.dependency_overrides[get_current_user_from_access_token] = current_user_override
    test_app.include_router(router)

    async with AsyncClient(
        transport=ASGITransport(app=test_app),
        base_url="http://test",
    ) as client:
        response = await client.get("/api/notifications")

    assert response.status_code == 200, response.text
    assert collection.last_query == {
        "$or": [
            {"user_id": {"$in": [user_id, str(user_id)]}},
            {"scope": "system"},
            {"contract_scope": "system"},
            {"scope": "company", "company_id": {"$in": [company_id]}},
            {"contract_scope": "company", "company_id": {"$in": [company_id]}},
        ]
    }
    assert collection.cursor.sort_args == ("created_at", -1)
    assert collection.cursor.limit_value == 100

    data = response.json()
    assert [item["scope"] for item in data] == ["personal", "company", "system"]
    assert data[0] == {
        "id": str(notification_id),
        "type": "High Risk",
        "title": "Contract flagged",
        "description": "One clause requires review.",
        "created_at": "2026-07-19T10:00:00Z",
        "scope": "personal",
    }
