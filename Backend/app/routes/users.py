from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Request
from app.routes.auth import get_current_user_from_access_token

router = APIRouter(prefix="/api/users", tags=["users"])


@router.get("/me")
async def get_me(request: Request, current_user: dict = Depends(get_current_user_from_access_token)):
    # Expose fields needed by UI. Keep response minimal.
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
    }


@router.patch("/profile")
async def update_profile(
    request: Request,
    first_name: Optional[str] = None,
    last_name: Optional[str] = None,
    current_user: dict = Depends(get_current_user_from_access_token),
):
    db = request.app.db
    update_data = {}

    if first_name is not None:
        update_data["first_name"] = first_name
    if last_name is not None:
        update_data["last_name"] = last_name

    if update_data:
        update_data["updated_at"] = datetime.utcnow()
        await db.users.update_one({"_id": current_user["_id"]}, {"$set": update_data})
        current_user.update(update_data)

    return {"message": "Profile updated successfully", "user": current_user}


@router.patch("/settings")
async def update_settings(
    request: Request,
    company_name: Optional[str] = None,
    ai_model: Optional[str] = None,
    two_factor_auth: Optional[bool] = None,
    current_user: dict = Depends(get_current_user_from_access_token),
):
    db = request.app.db
    update_data = {}

    # Only company accounts can update company_name (individual accounts keep their own branding)
    if company_name is not None and current_user.get("account_type") == "company":
        update_data["company_name"] = company_name

    if ai_model is not None:
        update_data["ai_model"] = ai_model

    if two_factor_auth is not None:
        update_data["is_2fa_enabled"] = bool(two_factor_auth)

    if update_data:
        update_data["updated_at"] = datetime.utcnow()
        await db.users.update_one({"_id": current_user["_id"]}, {"$set": update_data})
        current_user.update(update_data)

    return {"message": "Settings updated successfully", "user": current_user}

