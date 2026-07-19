from bson import ObjectId
from fastapi import FastAPI
from httpx import ASGITransport, AsyncClient
import pytest

from app.routes.auth import get_current_user_from_access_token
from app.routes.users import router


class FakeUsersCollection:
    def __init__(self):
        self.last_filter = None
        self.last_update = None

    async def update_one(self, filter_query, update_query):
        self.last_filter = filter_query
        self.last_update = update_query


class FakeDb:
    def __init__(self):
        self.users = FakeUsersCollection()


@pytest.mark.asyncio
async def test_users_me_and_profile_settings_use_real_api_paths_and_json_payloads():
    user_id = ObjectId()
    current_user = {
        "_id": user_id,
        "email": "founder@example.com",
        "first_name": "Ada",
        "last_name": "Lovelace",
        "account_type": "company",
        "company_name": "Analytical Engines Ltd",
        "company_id": str(user_id),
        "role": "admin",
        "ai_model": "Legal Bert By Nizami",
        "is_2fa_enabled": False,
        "avatar_url": "https://cdn.example.com/ada.png",
    }

    test_app = FastAPI()
    test_app.db = FakeDb()

    async def current_user_override():
        return current_user

    test_app.dependency_overrides[get_current_user_from_access_token] = current_user_override
    test_app.include_router(router, prefix="/api/users")

    async with AsyncClient(
        transport=ASGITransport(app=test_app),
        base_url="http://test",
    ) as client:
        me = await client.get("/api/users/me")
        profile = await client.patch(
            "/api/users/profile",
            json={"first_name": "Grace", "last_name": "Hopper"},
        )
        settings = await client.patch(
            "/api/users/settings",
            json={
                "company_name": "Compiler Systems Inc",
                "ai_model": "Default GPT-4",
                "two_factor_auth": True,
            },
        )

    assert me.status_code == 200, me.text
    assert me.json()["company_name"] == "Analytical Engines Ltd"
    assert me.json()["avatar_url"] == "https://cdn.example.com/ada.png"

    assert profile.status_code == 200, profile.text
    assert profile.json()["user"]["first_name"] == "Grace"
    assert profile.json()["user"]["last_name"] == "Hopper"

    assert settings.status_code == 200, settings.text
    assert settings.json()["user"]["company_name"] == "Compiler Systems Inc"
    assert settings.json()["user"]["ai_model"] == "Default GPT-4"
    assert settings.json()["user"]["is_2fa_enabled"] is True
