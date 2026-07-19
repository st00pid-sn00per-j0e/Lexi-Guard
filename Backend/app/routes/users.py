from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, Request
from pydantic import BaseModel

from app.routes.auth import get_current_user_from_access_token

router = APIRouter(tags=["users"])


class ProfileUpdateRequest(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None


class SettingsUpdateRequest(BaseModel):
    company_name: Optional[str] = None
    ai_model: Optional[str] = None
    two_factor_auth: Optional[bool] = None


def serialize_user(current_user: dict) -> dict:
    return {
        "id": str(current_user.get("_id")),
        "email": current_user.get("email"),
        "first_name": current_user.get("first_name"),
        "last_name": current_user.get("last_name"),
        "account_type": current_user.get("account_type"),
        "company_name": current_user.get("company_name"),
        "company_id": str(current_user.get("company_id")) if current_user.get("company_id") else None,
        "role": current_user.get("role"),
        "ai_model": current_user.get("ai_model") or "Legal Bert By Nizami",
        "is_2fa_enabled": bool(current_user.get("is_2fa_enabled", False)),
        "avatar_url": current_user.get("avatar_url") or current_user.get("profile_picture_url"),
    }


@router.get("/me")
async def get_me(current_user: dict = Depends(get_current_user_from_access_token)):
    return serialize_user(current_user)


@router.patch("/profile")
async def update_profile(
    request: Request,
    payload: ProfileUpdateRequest,
    current_user: dict = Depends(get_current_user_from_access_token),
):
    db = request.app.db
    update_data = {}

    if payload.first_name is not None:
        update_data["first_name"] = payload.first_name
    if payload.last_name is not None:
        update_data["last_name"] = payload.last_name

    if update_data:
        update_data["updated_at"] = datetime.utcnow()
        await db.users.update_one({"_id": current_user["_id"]}, {"$set": update_data})
        current_user.update(update_data)

    return {"message": "Profile updated successfully", "user": serialize_user(current_user)}


@router.patch("/settings")
async def update_settings(
    request: Request,
    payload: SettingsUpdateRequest,
    current_user: dict = Depends(get_current_user_from_access_token),
):
    db = request.app.db
    update_data = {}

    # Only company accounts can update company_name (individual accounts keep their own branding)
    if payload.company_name is not None and current_user.get("account_type") == "company":
        update_data["company_name"] = payload.company_name

    if payload.ai_model is not None:
        update_data["ai_model"] = payload.ai_model

    if payload.two_factor_auth is not None:
        update_data["is_2fa_enabled"] = bool(payload.two_factor_auth)

    if update_data:
        update_data["updated_at"] = datetime.utcnow()
        await db.users.update_one({"_id": current_user["_id"]}, {"$set": update_data})
        current_user.update(update_data)

    return {"message": "Settings updated successfully", "user": serialize_user(current_user)}

