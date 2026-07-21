import os
import secrets
from datetime import datetime, timedelta
from fastapi import APIRouter, HTTPException, status, Request, Depends, Query
from fastapi.responses import JSONResponse, RedirectResponse
from app.config import settings
from app.schemas.user import (
    UserCreate,
    UserLogin,
    UserResponse,
    Token,
    MessageResponse,
    OTPVerifyRequest,
    ForgotPasswordRequest,
    ResetPasswordRequest,
)
from app.utils.security import (
    verify_password,
    get_password_hash,
    create_access_token,
    create_refresh_token,
    decode_token,
)
from app.models.user import User
from app.services.otp import generate_and_send_otp, verify_otp
from app.services.email import send_signup_verification_email

router = APIRouter()
ACCESS_COOKIE = "lexiguard_access_token"
REFRESH_COOKIE = "lexiguard_refresh_token"
ACCESS_COOKIE_MAX_AGE_SECONDS = 60 * 60
REFRESH_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 7


async def get_db(request: Request):
    return request.app.db


def _get_client_ip(request: Request) -> str:
    return request.client.host if request.client else "unknown"


def _get_user_agent(request: Request) -> str:
    return request.headers.get("user-agent") or "unknown"


async def _get_session_or_401(request: Request, *, jti: str):
    db = request.app.db
    session = await db.sessions.find_one({"jti": jti})
    if not session:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid session")
    if session.get("is_revoked"):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Session revoked")
    expires_at = session.get("expires_at")
    if expires_at and expires_at < datetime.utcnow():
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Session expired")
    return session


async def get_current_user_from_access_token(request: Request) -> User:
    access_token = request.cookies.get(ACCESS_COOKIE)
    if not access_token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")
    payload = decode_token(access_token)
    if not payload:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    if payload.get("type") != "access":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token type")
    email = payload.get("sub")
    jti = payload.get("jti")
    if not email or not jti:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token payload")
    await _get_session_or_401(request, jti=jti)
    user = await request.app.db.users.find_one({"email": email})
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    return user


@router.post("/signup", status_code=201)
async def signup(request: Request, user_data: UserCreate, db=Depends(get_db)):
    existing_user = await db.users.find_one({"email": user_data.email})
    if existing_user:
        if existing_user.get("is_verified"):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Please check your email to verify your account.",
        )

    invite_token = getattr(user_data, "invite_token", None)
    role = "member"
    company_id = None

    # 1. Handle Invitees (bypass any company name/company creation checks)
    if invite_token:
        invite = await db.company_invites.find_one({"token": invite_token})
        if not invite or (invite.get("expires_at") and invite.get("expires_at") < datetime.utcnow()):
            raise HTTPException(status_code=400, detail="Invalid or expired invite link.")
        if invite.get("email") != user_data.email:
            raise HTTPException(status_code=400, detail="This invite link is for a different email address.")

        user_data.account_type = "company"
        # Keep company_name for UI/compat, but do NOT validate/create company here.
        user_data.company_name = invite.get("company_name")
        company_id = invite.get("company_id")
        role = invite.get("role", "member")

        if not company_id:
            raise HTTPException(status_code=400, detail="Invalid invite link: missing company_id.")

        await db.company_invites.delete_one({"token": invite_token})

    # 2. Handle Company Founders (First creator of a unique company)
    elif user_data.account_type == "company" and user_data.company_name:
        existing_admin = await db.users.find_one(
            {
                "company_name": user_data.company_name,
                "role": "admin",
                "is_verified": True,
            }
        )
        if existing_admin:
            raise HTTPException(
                status_code=400,
                detail="Company name already exists. Please use an invite link to join.",
            )
        role = "admin"  # Founder is always admin

    verification_token = secrets.token_urlsafe(32)
    password_hash = get_password_hash(user_data.password)

    user_dict = {
        "email": user_data.email,
        "password_hash": password_hash,
        "first_name": user_data.first_name,
        "last_name": user_data.last_name,
        "account_type": user_data.account_type,
        "company_name": user_data.company_name,
        "role": role,
        "company_id": company_id,
        "is_verified": False,
        "verification_token": verification_token,
    }
    result = await db.users.insert_one(user_dict)

    # If Founder, set their company_id to their own user _id
    user_id_str = str(result.inserted_id)
    if role == "admin" and not company_id:
        await db.users.update_one(
            {"_id": result.inserted_id},
            {"$set": {"company_id": user_id_str}},
        )
        company_id = user_id_str

    frontend_url = (
        settings.FRONTEND_URL
        if getattr(settings, "FRONTEND_URL", None)
        else os.getenv("FRONTEND_URL", "http://localhost:3000")
    )
    backend_url = (
        settings.BACKEND_URL
        if getattr(settings, "BACKEND_URL", None)
        else os.getenv("BACKEND_URL", "http://localhost:8001")
    )

    yes_url = f"{backend_url}/api/auth/verify-email?token={verification_token}&action=confirm"
    no_url = f"{backend_url}/api/auth/verify-email?token={verification_token}&action=cancel"
    user_name = f"{user_data.first_name} {user_data.last_name}".strip() or "User"

    ok = send_signup_verification_email(user_data.email, user_name, yes_url, no_url)
    if not ok:
        print(f"\n⚠️ Email failed to send. Manual verification link: {yes_url}\n")

    # NOTE: Do not auto-verify. We must always start as unverified,
    # including invite signups, and require frontend redirect to verification.


    jti = str(result.inserted_id)
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user_data.email, "jti": jti},
        expires_delta=access_token_expires,
    )
    refresh_token = create_refresh_token(
        data={"sub": user_data.email, "jti": jti},
    )

    resp = JSONResponse(
        status_code=201,
        content={
            "message": "Account created successfully. Please verify your email.",
            "requires_verification": True,
            "access_token": access_token,
            "refresh_token": refresh_token,
            "email": user_data.email,
            "user": {
                "id": user_id_str,
                "email": user_data.email,
                "account_type": user_data.account_type,
                "role": role,
            },
        },
    )


    is_secure = settings.ENVIRONMENT == "production"
    resp.set_cookie(
        key=ACCESS_COOKIE,
        value=access_token,
        httponly=True,
        secure=is_secure,
        samesite="lax",
        max_age=access_token_expires.total_seconds(),
        path="/",
    )
    resp.set_cookie(
        key=REFRESH_COOKIE,
        value=refresh_token,
        httponly=True,
        secure=is_secure,
        samesite="lax",
        max_age=REFRESH_COOKIE_MAX_AGE_SECONDS,
        path="/",
    )

    return resp


@router.get("/verify-email")
async def verify_email(request: Request, token: str = Query(...), action: str = Query(...)):
    db = request.app.db
    user = await db.users.find_one({"verification_token": token})
    frontend_url = (
        settings.FRONTEND_URL
        if getattr(settings, "FRONTEND_URL", None)
        else os.getenv("FRONTEND_URL", "http://localhost:3000")
    )
    if not user:
        return RedirectResponse(url=f"{frontend_url}/verify-error?msg=Invalid or expired link.")
    if action == "confirm":
        await db.users.update_one(
            {"_id": user["_id"]},
            {"$set": {"is_verified": True}, "$unset": {"verification_token": ""}},
        )
        return RedirectResponse(url=f"{frontend_url}/verify-success?email={user['email']}")
    if action == "cancel":
        await db.users.delete_one({"_id": user["_id"]})
        return RedirectResponse(url=f"{frontend_url}/signup?msg=Signup cancelled successfully.")
    return RedirectResponse(url=f"{frontend_url}/verify-error?msg=Invalid action.")


@router.get("/check-verification")
async def check_verification(request: Request, email: str = Query(...)):
    user = await request.app.db.users.find_one({"email": email})
    if not user:
        return JSONResponse(status_code=200, content={"is_verified": False})
    return JSONResponse(status_code=200, content={"is_verified": bool(user.get("is_verified", False))})


@router.post("/resend-verification")
async def resend_verification(request: Request, db=Depends(get_db)):
    body = await request.json()
    email = body.get("email", "")
    if not email:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email is required.")

    user = await db.users.find_one({"email": email})
    if not user:
        # Don't reveal whether the email exists
        return {"message": "If an unverified account exists, a new verification email has been sent."}
    if user.get("is_verified"):
        return {"message": "This account is already verified. Please log in."}

    # Generate a fresh verification token
    verification_token = secrets.token_urlsafe(32)
    await db.users.update_one(
        {"_id": user["_id"]},
        {"$set": {"verification_token": verification_token}},
    )

    frontend_url = (
        settings.FRONTEND_URL
        if getattr(settings, "FRONTEND_URL", None)
        else os.getenv("FRONTEND_URL", "http://localhost:3000")
    )
    backend_url = (
        settings.BACKEND_URL
        if getattr(settings, "BACKEND_URL", None)
        else os.getenv("BACKEND_URL", "http://localhost:8001")
    )

    yes_url = f"{backend_url}/api/auth/verify-email?token={verification_token}&action=confirm"
    no_url = f"{backend_url}/api/auth/verify-email?token={verification_token}&action=cancel"
    user_name = f"{user.get('first_name', '')} {user.get('last_name', '')}".strip() or "User"

    ok = send_signup_verification_email(email, user_name, yes_url, no_url)
    if not ok:
        print(f"\n⚠️ Resend email failed. Manual verification link: {yes_url}\n")

    return {"message": "If an unverified account exists, a new verification email has been sent."}


@router.post("/login", response_model=Token)
async def login(user_data: UserLogin, request: Request, db=Depends(get_db)):
    user = await db.users.find_one({"email": user_data.email})
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")
    if not verify_password(user_data.password, user["password_hash"]):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")
    if not user.get("is_verified", False):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Please verify your email address before logging in.")

    if user.get("is_2fa_enabled"):
        await generate_and_send_otp(db, user["email"], user.get("first_name") or "User")
        return JSONResponse(status_code=202, content={"message": "2FA required. OTP sent to email.", "requires_2fa": True})

    jti = str(user["_id"])
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(data={"sub": user["email"], "jti": jti}, expires_delta=access_token_expires)
    refresh_token = create_refresh_token(data={"sub": user["email"], "jti": jti})
    expires_at = datetime.utcnow() + timedelta(days=7)

    await db.sessions.update_one(
        {"jti": jti},
        {
            "$set": {
                "jti": jti,
                "user_id": str(user["_id"]),
                "ip_address": _get_client_ip(request),
                "user_agent": _get_user_agent(request),
                "expires_at": expires_at,
                "is_revoked": False,
            }
        },
        upsert=True,
    )

    user_response = UserResponse(
        id=str(user["_id"]),
        email=user["email"],
        first_name=user["first_name"],
        last_name=user["last_name"],
        account_type=user["account_type"],
        company_name=user.get("company_name"),
        company_id=user.get("company_id"),
        role=user.get("role", "member"),
    )

    resp = JSONResponse(content=Token(access_token="", token_type="bearer", user=user_response).model_dump())
    is_secure = settings.ENVIRONMENT == "production"
    resp.set_cookie(
        key=ACCESS_COOKIE,
        value=access_token,
        httponly=True,
        secure=is_secure,
        samesite="lax",
        max_age=access_token_expires.total_seconds(),
        path="/",
    )
    resp.set_cookie(
        key=REFRESH_COOKIE,
        value=refresh_token,
        httponly=True,
        secure=is_secure,
        samesite="lax",
        max_age=REFRESH_COOKIE_MAX_AGE_SECONDS,
        path="/",
    )
    return resp


@router.get("/me", response_model=UserResponse)
async def get_current_user_info(request: Request):
    user = await get_current_user_from_access_token(request)
    return UserResponse(
        id=str(user["_id"]),
        email=user["email"],
        first_name=user["first_name"],
        last_name=user["last_name"],
        account_type=user["account_type"],
        company_name=user.get("company_name"),
        company_id=user.get("company_id"),
        role=user.get("role", "member"),
    )


@router.post("/refresh", response_model=Token)
async def refresh(request: Request, db=Depends(get_db)):
    refresh_token = request.cookies.get(REFRESH_COOKIE)
    if not refresh_token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")
    payload = decode_token(refresh_token)
    if not payload or payload.get("type") != "refresh":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    email = payload.get("sub")
    jti = payload.get("jti")
    if not email or not jti:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token payload")
    await _get_session_or_401(request, jti=jti)

    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(data={"sub": email, "jti": jti}, expires_delta=access_token_expires)
    user = await db.users.find_one({"email": email})
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")

    user_response = UserResponse(
        id=str(user["_id"]),
        email=user["email"],
        first_name=user["first_name"],
        last_name=user["last_name"],
        account_type=user["account_type"],
        company_name=user.get("company_name"),
        company_id=user.get("company_id"),
        role=user.get("role", "member"),
    )

    resp = JSONResponse(content=Token(access_token="", token_type="bearer", user=user_response).model_dump())
    is_secure = settings.ENVIRONMENT == "production"
    resp.set_cookie(
        key=ACCESS_COOKIE,
        value=access_token,
        httponly=True,
        secure=is_secure,
        samesite="lax",
        max_age=access_token_expires.total_seconds(),
        path="/",
    )
    return resp


@router.post("/forgot-password")
async def forgot_password(request: Request, payload: ForgotPasswordRequest, db=Depends(get_db)):
    user = await db.users.find_one({"email": payload.email})
    if not user:
        return {"message": "If the email exists, a reset code has been sent."}
    user_name = (f"{user.get('first_name', '')} {user.get('last_name', '')}".strip() or "User")
    await generate_and_send_otp(db, payload.email, user_name)
    return {"message": "If the email exists, a reset code has been sent."}


@router.post("/reset-password")
async def reset_password(request: Request, payload: ResetPasswordRequest, db=Depends(get_db)):
    is_valid = await verify_otp(db, payload.email, payload.otp_code)
    if not is_valid:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid or expired OTP.")
    user = await db.users.find_one({"email": payload.email})
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")
    new_hashed_password = get_password_hash(payload.new_password)
    await db.users.update_one({"_id": user["_id"]}, {"$set": {"password_hash": new_hashed_password}})
    return {"message": "Password reset successfully. Please login with your new password."}


@router.post("/logout")
async def logout(request: Request, db=Depends(get_db)):
    access_token = request.cookies.get(ACCESS_COOKIE)
    if access_token:
        payload = decode_token(access_token)
        if payload and payload.get("type") == "access":
            jti = payload.get("jti")
            if jti:
                await db.sessions.update_one({"jti": jti}, {"$set": {"is_revoked": True}})
    resp = JSONResponse(content=MessageResponse(message="Logged out").model_dump())
    resp.delete_cookie(key=ACCESS_COOKIE, path="/")
    resp.delete_cookie(key=REFRESH_COOKIE, path="/")
    return resp

