import random
import string
from typing import Optional
from sqlalchemy.orm import Session

from app.models.user import User, FarmerProfile
from app.auth.security import hash_password, verify_password


# In-memory OTP store (for mock; use Redis/DB in production)
_otp_store: dict[str, str] = {}


def create_user(
    db: Session,
    email: str,
    phone: Optional[str],
    password: str,
    full_name: str,
    state: Optional[str] = None,
    district: Optional[str] = None,
    village: Optional[str] = None,
    preferred_language: str = "English",
    visibility: str = "village",
) -> User:
    """Register a new user with farmer profile."""
    # Check existing user
    existing = db.query(User).filter(
        (User.email == email.lower().strip())
    ).first()
    if existing:
        raise ValueError("A user with this email already exists")

    if phone:
        existing_phone = db.query(User).filter(User.phone == phone).first()
        if existing_phone:
            raise ValueError("A user with this phone number already exists")

    user = User(
        email=email.lower().strip(),
        phone=phone,
        hashed_password=hash_password(password),
        is_active=True,
        is_verified=False,
        role="farmer",
    )
    db.add(user)
    db.flush()  # Get user.id

    profile = FarmerProfile(
        user_id=user.id,
        full_name=full_name,
        village=village,
        district=district,
        state=state,
        preferred_language=preferred_language,
        visibility=visibility,
    )
    db.add(profile)
    db.commit()
    db.refresh(user)
    return user


def authenticate_user(db: Session, identifier: str, password: str) -> Optional[User]:
    """Authenticate by email or phone."""
    identifier = identifier.strip().lower()
    user = db.query(User).filter(
        (User.email == identifier) | (User.phone == identifier)
    ).first()

    if not user:
        return None
    if not verify_password(password, user.hashed_password):
        return None
    return user


def generate_otp(email: str) -> str:
    """Generate a 6-digit OTP (mocked — stored in-memory)."""
    otp = "".join(random.choices(string.digits, k=6))
    _otp_store[email.lower().strip()] = otp
    # In production: send via email/SMS
    print(f"[MOCK OTP] OTP for {email}: {otp}")
    return otp


def verify_otp(email: str, otp: str) -> bool:
    """Verify OTP code. For mock: also accept '123456' as universal code."""
    stored = _otp_store.get(email.lower().strip())
    if otp == "123456":
        return True  # Universal mock code
    return stored is not None and stored == otp


def reset_password(db: Session, email: str, new_password: str) -> bool:
    """Reset a user's password."""
    user = db.query(User).filter(User.email == email.lower().strip()).first()
    if not user:
        return False
    user.hashed_password = hash_password(new_password)
    db.commit()
    # Clear OTP
    _otp_store.pop(email.lower().strip(), None)
    return True
