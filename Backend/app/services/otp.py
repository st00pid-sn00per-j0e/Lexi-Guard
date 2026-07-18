import random
import string
from datetime import datetime, timedelta

from app.config import settings
from app.services.email import send_email


async def create_ttl_index(db) -> None:
    """Create TTL index for OTP cleanup."""
    await db.otp_codes.create_index(
        "expires_at",
        expireAfterSeconds=settings.OTP_TTL_SECONDS,
    )


async def generate_and_send_otp(db, email: str, user_name: str) -> str:
    """Generate a 6-digit OTP, store in MongoDB, and email it."""
    otp_code = "".join(random.choices(string.digits, k=6))
    now = datetime.utcnow()
    expires_at = now + timedelta(seconds=settings.OTP_TTL_SECONDS)

    await db.otp_codes.insert_one(
        {
            "email": email,
            "code": otp_code,
            "created_at": now,
            "expires_at": expires_at,
        }
    )

    minutes = max(1, settings.OTP_TTL_SECONDS // 60)
    html_content = f"""
    <h2>Your Verification Code</h2>
    <p>Hi {user_name},</p>
    <p>
      Your One-Time Password (OTP) is:
      <strong style="font-size: 24px; letter-spacing: 5px;">{otp_code}</strong>
    </p>
    <p>This code will expire in {minutes} minutes.</p>
    """

    send_email(email, "Your Verification Code", html_content)
    return otp_code


async def verify_otp(db, email: str, code: str) -> bool:
    """Verify OTP, and delete it upon success (single-use)."""
    record = await db.otp_codes.find_one({"email": email, "code": code})
    if not record:
        return False

    now = datetime.utcnow()
    expires_at = record.get("expires_at")
    if expires_at and expires_at < now:
        await db.otp_codes.delete_one({"_id": record["_id"]})
        return False

    await db.otp_codes.delete_one({"_id": record["_id"]})
    return True

