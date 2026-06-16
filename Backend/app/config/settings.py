import os

class Settings:
    PROJECT_NAME: str = "Andhra Pradesh Paddy Crop Monitoring Platform"
    API_V1_STR: str = "/api"
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./paddy_monitoring.db")

settings = Settings()
