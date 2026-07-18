from datetime import datetime
from typing import List

from fastapi import APIRouter, Depends, HTTPException, Request

from app.routes.auth import get_current_user_from_access_token

router = APIRouter(prefix="/api/notifications", tags=["Notifications"])


@router.get("/", response_model=List[dict])
async def get_notification_history(
    request: Request,
    current_user: dict = Depends(get_current_user_from_access_token),
):
    """Fetch notification history for the authenticated user."""
    try:
        db = request.app.db

        # This project stores MongoDB ids as ObjectId; user ids are compared as strings elsewhere.
        user_id = str(current_user.get("_id"))

        cursor = (
            db.notifications.find({"user_id": user_id})
            .sort("created_at", -1)
            .limit(100)
        )
        docs = await cursor.to_list(length=100)

        formatted: List[dict] = []
        for doc in docs:
            formatted.append(
                {
                    "id": str(doc.get("_id")),
                    "type": doc.get("type", "Info"),
                    "title": doc.get("title", ""),
                    "description": doc.get("description", ""),
                    "created_at": doc.get("created_at") or datetime.utcnow(),
                    # Frontend expects: "personal" | "company" | "system"
                    "scope": doc.get("contract_scope", doc.get("scope", "system")),
                }
            )

        return formatted

    except HTTPException:
        raise
    except Exception as e:
        # Keep error generic to the client; log server-side.
        print(f"Error fetching notifications: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve notification history")

