from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.auth.security import get_current_user
from app.models.user import User
from app.models.digital_twin import Notifications

router = APIRouter(prefix="/notifications", tags=["Notifications"])


@router.get("")
def get_notifications(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get all notifications for the current user."""
    notifications = db.query(Notifications).filter(
        Notifications.farmer_id == str(user.id)
    ).order_by(Notifications.created_at.desc()).limit(50).all()

    return [
        {
            "id": n.id,
            "type": n.type,
            "message": n.message,
            "is_read": n.is_read,
            "created_at": n.created_at.isoformat() if n.created_at else None,
            "field_id": n.field_id,
        }
        for n in notifications
    ]


@router.put("/{notification_id}/read")
def mark_read(
    notification_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Mark a notification as read."""
    notification = db.query(Notifications).filter(
        Notifications.id == notification_id,
        Notifications.farmer_id == str(user.id),
    ).first()

    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")

    notification.is_read = True
    db.commit()
    return {"message": "Marked as read"}


@router.get("/unread-count")
def unread_count(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get count of unread notifications."""
    count = db.query(Notifications).filter(
        Notifications.farmer_id == str(user.id),
        Notifications.is_read == False,
    ).count()
    return {"unread_count": count}
