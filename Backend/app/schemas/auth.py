from pydantic import BaseModel, EmailStr, Field, field_validator
from typing import Optional
from datetime import datetime
import re


# ─── Registration ───────────────────────────────────────────────
class UserRegister(BaseModel):
    full_name: str = Field(..., min_length=2, max_length=100)
    email: str = Field(..., min_length=5, max_length=100)
    phone: Optional[str] = Field(None, max_length=15)
    password: str = Field(..., min_length=8, max_length=64)
    confirm_password: str = Field(..., min_length=8, max_length=64)
    state: Optional[str] = None
    district: Optional[str] = None
    village: Optional[str] = None
    preferred_language: Optional[str] = "English"
    visibility: Optional[str] = "village"  # private / village / public

    @field_validator("confirm_password")
    @classmethod
    def passwords_match(cls, v, info):
        password = info.data.get("password")
        if password and v != password:
            raise ValueError("Passwords do not match")
        return v

    @field_validator("password")
    @classmethod
    def validate_password_complexity(cls, v):
        if not re.match(r'^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z0-9]).{8,64}$', v):
            raise ValueError("Password must be 8–64 characters and include uppercase, lowercase, a number, and a special character.")
        return v

    @field_validator("email")
    @classmethod
    def validate_email(cls, v):
        if "@" not in v or "." not in v:
            raise ValueError("Invalid email address")
        return v.lower().strip()


# ─── Login ──────────────────────────────────────────────────────
class UserLogin(BaseModel):
    identifier: str = Field(..., description="Email or mobile number")
    password: str = Field(..., min_length=6)
    remember_me: Optional[bool] = False


# ─── Token Response ────────────────────────────────────────────
class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int
    user: "UserProfileResponse"


class RefreshTokenRequest(BaseModel):
    refresh_token: str


# ─── Password Reset ────────────────────────────────────────────
class PasswordResetRequest(BaseModel):
    email: str


class PasswordResetVerify(BaseModel):
    email: str
    otp: str


class PasswordResetConfirm(BaseModel):
    email: str
    otp: str
    new_password: str = Field(..., min_length=8, max_length=64)

    @field_validator("new_password")
    @classmethod
    def validate_password_complexity(cls, v):
        if not re.match(r'^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z0-9]).{8,64}$', v):
            raise ValueError("Password must be 8–64 characters and include uppercase, lowercase, a number, and a special character.")
        return v


# ─── User Profile ──────────────────────────────────────────────
class UserProfileResponse(BaseModel):
    id: int
    email: str
    phone: Optional[str] = None
    role: str
    full_name: str
    village: Optional[str] = None
    district: Optional[str] = None
    state: Optional[str] = None
    preferred_language: str = "English"
    profile_photo_url: Optional[str] = None
    visibility: str = "village"
    joined_date: Optional[str] = None
    is_active: bool = True
    has_farms: bool = False

    class Config:
        from_attributes = True


class UserProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    village: Optional[str] = None
    district: Optional[str] = None
    state: Optional[str] = None
    preferred_language: Optional[str] = None
    visibility: Optional[str] = None


class VisibilityUpdate(BaseModel):
    visibility: str = Field(..., pattern="^(private|village|public)$")
