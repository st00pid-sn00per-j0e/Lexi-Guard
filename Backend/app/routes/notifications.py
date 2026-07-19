import logging
from datetime import datetime, timezone
from typing import Any, Dict, List

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel

from app.routes.auth import get_current_user_from_access_token

router = APIRouter(prefix="/api/notifications", tags=["Notifications"])
logger = logging.getLogger("lexiguard.notifications")


class NotificationResponse(BaseModel):
    id: str
    type: str
    title: str
    description: str
    created_at: str
    scope: str


def _utc_now_iso() -> str:
    return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")


def _serialize_datetime(value: Any) -> str:
    if isinstance(value, datetime):
        if value.tzinfo is None:
            value = value.replace(tzinfo=timezone.utc)
        return value.isoformat().replace("+00:00", "Z")
    if isinstance(value, str) and value.strip():
        return value
    return _utc_now_iso()


def _identity_values(value: Any) -> List[Any]:
    if value is None:
        return []

    values: List[Any] = [value]
    value_as_string = str(value)
    if value_as_string not in values:
        values.append(value_as_string)
    return values


def _notification_scope(doc: Dict[str, Any]) -> str:
    return str(doc.get("contract_scope") or doc.get("scope") or "system")


@router.get("", response_model=List[NotificationResponse])
@router.get("/", response_model=List[NotificationResponse], include_in_schema=False)
async def get_notification_history(
    request: Request,
    current_user: dict = Depends(get_current_user_from_access_token),
):
    """Fetch notification history for the authenticated user."""
    try:
        db = request.app.db

        user_id_values = _identity_values(current_user.get("_id"))
        if not user_id_values:
            raise HTTPException(status_code=401, detail="Invalid user context")

        visibility_filters: List[Dict[str, Any]] = [
            {"user_id": {"$in": user_id_values}},
            {"scope": "system"},
            {"contract_scope": "system"},
        ]

        company_id_values = _identity_values(current_user.get("company_id"))
        if current_user.get("account_type") == "company" and company_id_values:
            company_filter = {"company_id": {"$in": company_id_values}}
            visibility_filters.extend(
                [
                    {"scope": "company", **company_filter},
                    {"contract_scope": "company", **company_filter},
                ]
            )

        cursor = (
            db.notifications.find({"$or": visibility_filters})
            .sort("created_at", -1)
            .limit(100)
        )
        docs = await cursor.to_list(length=100)

        formatted: List[NotificationResponse] = []
        for doc in docs:
            formatted.append(
                NotificationResponse(
                    id=str(doc.get("_id")),
                    type=str(doc.get("type") or "Info"),
                    title=str(doc.get("title") or ""),
                    description=str(doc.get("description") or ""),
                    created_at=_serialize_datetime(doc.get("created_at")),
                    scope=_notification_scope(doc),
                )
            )

        return formatted

    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Error fetching notifications: %s", e)
        raise HTTPException(status_code=500, detail="Failed to retrieve notification history")

