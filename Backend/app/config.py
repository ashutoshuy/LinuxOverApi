# app/config.py
import os
from pydantic_settings import BaseSettings
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

class Settings(BaseSettings):
    API_V1_PREFIX: str = "/api/v1"
    PROJECT_NAME: str = "LinuxOverApi"
    
    # Database
    DATABASE_URL: str = "sqlite:///./api_data.db"
    
    # Security
    SECRET_KEY: str = os.getenv("SECRET_KEY", "default-secret-key-for-dev")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 720
    
    # Admin
    ADMIN_SECRET_KEY: str = os.getenv("ADMIN_SECRET_KEY", "admin-secret")
    
    # API settings
    API_FREE_LIMIT: int = 15

    class Config:
        env_file = ".env"

settings = Settings()
