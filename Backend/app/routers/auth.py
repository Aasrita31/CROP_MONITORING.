from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.auth.security import (
    create_access_token, create_refresh_token, decode_token, get_current_user,
)
from app.services.auth_service import (
    create_user, authenticate_user, generate_otp, verify_otp, reset_password,
)
from app.schemas.auth import (
    UserRegister, UserLogin, TokenResponse, RefreshTokenRequest,
    PasswordResetRequest, PasswordResetVerify, PasswordResetConfirm,
    UserProfileResponse,
)
from app.models.user import User
from app.models.digital_twin import FarmerField
from app.config.settings import settings

router = APIRouter(prefix="/auth", tags=["Authentication"])


def _build_profile_response(user: User, db: Session) -> UserProfileResponse:
    profile = user.profile
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


@router.post("/register", response_model=UserProfileResponse, status_code=status.HTTP_201_CREATED)
def register(data: UserRegister, db: Session = Depends(get_db)):
    """Register a new farmer account."""
    try:
        user = create_user(
            db=db,
            email=data.email,
            phone=data.phone,
            password=data.password,
            full_name=data.full_name,
            state=data.state,
            district=data.district,
            village=data.village,
            preferred_language=data.preferred_language or "English",
            visibility=data.visibility or "village",
        )
        return _build_profile_response(user, db)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.post("/login", response_model=TokenResponse)
def login(data: UserLogin, db: Session = Depends(get_db)):
    """Authenticate and receive JWT tokens."""
    user = authenticate_user(db, data.identifier, data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email/phone or password",
        )

    access_token = create_access_token(data={"sub": str(user.id)})
    refresh_token = create_refresh_token(data={"sub": str(user.id)})

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="bearer",
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        user=_build_profile_response(user, db),
    )


@router.post("/refresh", response_model=TokenResponse)
def refresh_token(data: RefreshTokenRequest, db: Session = Depends(get_db)):
    """Refresh access token using refresh token."""
    payload = decode_token(data.refresh_token)
    if not payload or payload.get("type") != "refresh":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token",
        )

    user_id = payload.get("sub")
    user = db.query(User).filter(User.id == int(user_id)).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")

    access_token = create_access_token(data={"sub": str(user.id)})
    refresh_token_new = create_refresh_token(data={"sub": str(user.id)})

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token_new,
        token_type="bearer",
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        user=_build_profile_response(user, db),
    )


@router.post("/logout")
def logout():
    """Logout is handled client-side by clearing stored tokens."""
    return {"message": "Logged out successfully"}


@router.get("/me", response_model=UserProfileResponse)
def get_me(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Get current authenticated user profile."""
    return _build_profile_response(user, db)


# ─── Password Reset Flow ────────────────────────────────────────
@router.post("/forgot-password")
def forgot_password(data: PasswordResetRequest, db: Session = Depends(get_db)):
    """Initiate password reset — sends OTP to email (mocked)."""
    user = db.query(User).filter(User.email == data.email.lower().strip()).first()
    if not user:
        # Don't reveal if user exists
        return {"message": "If the email exists, an OTP has been sent."}

    otp = generate_otp(data.email)
    return {"message": "If the email exists, an OTP has been sent.", "debug_otp": otp}


@router.post("/verify-otp")
def verify_otp_endpoint(data: PasswordResetVerify):
    """Verify OTP code."""
    if not verify_otp(data.email, data.otp):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid OTP")
    return {"message": "OTP verified successfully", "verified": True}


@router.post("/reset-password")
def reset_password_endpoint(data: PasswordResetConfirm, db: Session = Depends(get_db)):
    """Reset password after OTP verification."""
    if not verify_otp(data.email, data.otp):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid OTP")

    success = reset_password(db, data.email, data.new_password)
    if not success:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    return {"message": "Password reset successful"}
