from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
import os
import uuid

from app.database.database import get_db
from app.auth.security import get_current_user
from app.models.user import User, FarmerProfile
from app.schemas.auth import UserProfileResponse, UserProfileUpdate, VisibilityUpdate
from app.config.settings import settings

router = APIRouter(prefix="/profile", tags=["Farmer Profile"])


def _build_profile(user: User, db: Session) -> UserProfileResponse:
    profile = user.profile
    from app.models.digital_twin import FarmerField
    has_farms = db.query(FarmerField).filter(FarmerField.farmer_id == str(user.id)).count() > 0
    return UserProfileResponse(
        id=user.id,
        email=user.email,
        phone=user.phone,
        role=user.role,
        full_name=profile.full_name if profile else "Farmer",
        village=profile.village if profile else None,
        district=profile.district if profile else None,
        state=profile.state if profile else None,
        preferred_language=profile.preferred_language if profile else "English",
        profile_photo_url=profile.profile_photo_url if profile else None,
        visibility=profile.visibility if profile else "village",
        joined_date=profile.joined_date.isoformat() if profile and profile.joined_date else None,
        is_active=user.is_active,
        has_farms=has_farms,
    )


@router.get("", response_model=UserProfileResponse)
def get_profile(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Get authenticated farmer's full profile."""
    return _build_profile(user, db)


@router.put("", response_model=UserProfileResponse)
def update_profile(
    data: UserProfileUpdate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Update farmer profile fields."""
    profile = user.profile
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")

    if data.full_name is not None:
        profile.full_name = data.full_name
    if data.phone is not None:
        user.phone = data.phone
    if data.village is not None:
        profile.village = data.village
    if data.district is not None:
        profile.district = data.district
    if data.state is not None:
        profile.state = data.state
    if data.preferred_language is not None:
        profile.preferred_language = data.preferred_language
    if data.visibility is not None:
        profile.visibility = data.visibility

    db.commit()
    db.refresh(user)
    return _build_profile(user, db)


@router.put("/visibility", response_model=UserProfileResponse)
def update_visibility(
    data: VisibilityUpdate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Update visibility preference."""
    profile = user.profile
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")

    profile.visibility = data.visibility
    db.commit()
    db.refresh(user)
    return _build_profile(user, db)


@router.post("/photo", response_model=UserProfileResponse)
async def upload_photo(
    file: UploadFile = File(...),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Upload profile photo."""
    profile = user.profile
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")

    # Ensure upload dir exists
    upload_dir = os.path.join(settings.UPLOAD_DIR, "profiles")
    os.makedirs(upload_dir, exist_ok=True)

    # Save file
    ext = file.filename.split(".")[-1] if file.filename else "jpg"
    filename = f"{user.id}_{uuid.uuid4().hex[:8]}.{ext}"
    filepath = os.path.join(upload_dir, filename)

    content = await file.read()
    with open(filepath, "wb") as f:
        f.write(content)

    profile.profile_photo_url = f"/uploads/profiles/{filename}"
    db.commit()
    db.refresh(user)
    return _build_profile(user, db)
