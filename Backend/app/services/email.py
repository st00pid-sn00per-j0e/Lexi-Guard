import logging
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

from app.config import settings

logger = logging.getLogger(__name__)


def _smtp_configured() -> bool:
    return bool(settings.SMTP_USER and settings.SMTP_PASSWORD)


def send_email(to_email: str, subject: str, html_content: str) -> bool:
    """Send an email using Gmail SMTP."""
    if not _smtp_configured():
        logger.warning("SMTP credentials not configured. Email not sent.")
        return False

    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = settings.EMAIL_FROM
    msg["To"] = to_email
    msg.attach(MIMEText(html_content, "html"))

    try:
        with smtplib.SMTP(settings.SMTP_SERVER, settings.SMTP_PORT) as server:
            server.ehlo()
            server.starttls()
            server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            server.send_message(msg)

        logger.info("Email successfully sent to %s via SMTP", to_email)
        return True
    except Exception as e:
        logger.error("Failed to send email to %s via SMTP: %s", to_email, str(e))
        return False


def send_signup_verification_email(
    to_email: str,
    user_name: str,
    confirm_url: str,
    cancel_url: str,
) -> bool:
    html_content = f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
        <h2 style="color: #333;">Confirm Your LexiGuard Account</h2>
        <p>Hi {user_name},</p>
        <p>Welcome to LexiGuard! To complete your signup, please confirm that this is you.</p>

        <div style="text-align: center; margin: 30px 0;">
            <a href="{confirm_url}" style="background-color: #2563eb; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px; display: inline-block;">
                Yes, this is me
            </a>
        </div>

        <div style="text-align: center; margin-top: 20px;">
            <a href="{cancel_url}" style="color: #ef4444; text-decoration: none; font-size: 14px;">
                No, this is not me (Cancel signup)
            </a>
        </div>

        <p style="font-size: 12px; color: #888; margin-top: 30px; text-align: center;">If you did not request this, you can ignore this email.</p>
    </div>
    """

    return send_email(
        to_email=to_email,
        subject="Confirm your LexiGuard signup",
        html_content=html_content,
    )

