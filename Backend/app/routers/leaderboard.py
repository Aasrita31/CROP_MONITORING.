from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.services.community_service import get_leaderboard

router = APIRouter(prefix="/leaderboard", tags=["Leaderboard"])


@router.get("")
def leaderboard(
    category: str = Query("health", pattern="^(health|ndvi|water|sustainability|improvement)$"),
    db: Session = Depends(get_db),
):
    """Get community leaderboard for a given category."""
    return get_leaderboard(db, category=category)


@router.get("/badges/{farmer_id}")
def farmer_badges(
    farmer_id: str,
    db: Session = Depends(get_db),
):
    """Get badges for a specific farmer."""
    entries = get_leaderboard(db, category="health")
    farmer_entries = [e for e in entries if str(e.get("farmer_id")) == farmer_id]

    all_badges = set()
    for entry in farmer_entries:
        all_badges.update(entry.get("badges", []))

    return {
        "farmer_id": farmer_id,
        "badges": list(all_badges),
        "total_badges": len(all_badges),
    }
