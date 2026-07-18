import secrets
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, Request
from app.routes.auth import get_current_user_from_access_token

# CRITICAL: NO prefix here! main.py already adds "/api/company"
router = APIRouter(tags=["company"])

async def require_company_account(request: Request):
    user = await get_current_user_from_access_token(request)
    if user.get("account_type") != "company":
        raise HTTPException(status_code=403, detail="Only company accounts can access this feature.")
    return user

@router.get("/users")
async def get_company_users(
    request: Request,
    current_user: dict = Depends(require_company_account)
):
    db = request.app.db
    company_name = current_user.get("company_name")
    
    users = await db.users.find({"company_name": company_name}).to_list(length=100)
    
    formatted_users = []
    for u in users:
        u["id"] = str(u.pop("_id"))
        u.pop("password_hash", None)
        formatted_users.append(u)
        
    return formatted_users

@router.post("/invite")
async def send_invite(
    request: Request,
    email: str,
    role: str = "member",
    current_user: dict = Depends(require_company_account)
):
    db = request.app.db
    
    existing_user = await db.users.find_one({"email": email})
    if existing_user:
        raise HTTPException(status_code=400, detail="User already exists in the system.")

    token = secrets.token_urlsafe(32)

    # Anchor company_id to the company's root account id.
    # For the current codebase, company admins are stored with their own _id as company_id.
    # This keeps company_id stable for all invitees.
    anchored_company_id = current_user.get("company_id") or current_user.get("_id")

    invite_data = {
        "token": token,
        "email": email,
        "company_name": current_user.get("company_name"),
        "company_id": str(anchored_company_id),
        "role": role,
        "invited_by": str(current_user.get("_id")),
        "expires_at": datetime.utcnow() + timedelta(hours=48),
        "created_at": datetime.utcnow(),
    }

    await db.company_invites.insert_one(invite_data)

    frontend_url = "http://localhost:9002"
    invite_link = f"{frontend_url}/invite?token={token}"

    return {
        "message": "Invite link generated successfully",
        "invite_link": invite_link,
        "email": email
    }

@router.get("/invite/validate")
async def validate_invite(request: Request, token: str):
    db = request.app.db
    invite = await db.company_invites.find_one({"token": token})

    if not invite:
        raise HTTPException(status_code=404, detail="Invalid or expired invite link.")

    if invite.get("expires_at") < datetime.utcnow():
        raise HTTPException(status_code=400, detail="This invite link has expired.")

    return {
        "email": invite.get("email"),
        "company_name": invite.get("company_name"),
        "role": invite.get("role")
    }



