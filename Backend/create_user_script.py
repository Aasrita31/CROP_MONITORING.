import sys
import os

sys.path.append(r"c:\Aasritha\AgriTwin\Backend")

from sqlalchemy.orm import Session
from app.database.database import SessionLocal
from app.models.user import User, FarmerProfile
from app.auth.security import hash_password

def create_user():
    db = SessionLocal()
    try:
        # Check if user already exists
        existing_user = db.query(User).filter(User.email == "aasritareddy.c@gmail.com").first()
        if existing_user:
            print("User already exists. Updating password...")
            existing_user.hashed_password = hash_password("AgriTwin2026!")
            db.commit()
            print("Password updated successfully.")
            return

        new_user = User(
            email="aasritareddy.c@gmail.com",
            phone="9493562799",
            hashed_password=hash_password("AgriTwin2026!"),
            role="farmer",
            is_active=True
        )
        db.add(new_user)
        db.flush() # to get the new_user.id
        
        new_profile = FarmerProfile(
            user_id=new_user.id,
            full_name="Aasrita",
            village="nellore",
            district="Nellore",
            state="Andhra Pradesh",
            preferred_language="English",
            visibility="public"
        )
        db.add(new_profile)
        db.commit()
        print("User and profile created successfully.")
    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    create_user()
