import os
import secrets

class Settings:
    PROJECT_NAME: str = "AgriTwin Intelligence Platform"
    API_V1_STR: str = "/api"
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./paddy_monitoring.db")

    # JWT Authentication
    SECRET_KEY: str = os.getenv("SECRET_KEY", secrets.token_urlsafe(64))
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60  # 1 hour
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # File uploads
    UPLOAD_DIR: str = os.getenv("UPLOAD_DIR", "./uploads")

settings = Settings()
