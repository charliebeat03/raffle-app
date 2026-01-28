import os
from dotenv import load_dotenv
from typing import Optional

load_dotenv()

class Settings:
    # Database - PostgreSQL
    DATABASE_URL: str = os.getenv("DATABASE_URL", "postgresql://raffle_user:6BmIRJsRuOtQh1R0v4HGWjlJf8zyJRZl@dpg-d5sqke49c44c739g0oh0-a/raffle_db_7wzs")
    
    # JWT
    SECRET_KEY: str = os.getenv("SECRET_KEY", "#2756e208dd3a275897f8f9125fb3c3de")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 días
    
    # Admin por defecto
    ADMIN_USERNAME: str = os.getenv("ADMIN_USERNAME", "admin")
    ADMIN_PASSWORD: str = os.getenv("ADMIN_PASSWORD", "Admin123!")
    ADMIN_EMAIL: str = os.getenv("ADMIN_EMAIL", "admin@raffleapp.com")
    
    # CORS
    FRONTEND_URL: str = os.getenv("FRONTEND_URL", "http://localhost:3000")

    # WhatsApp Settings
    WHATSAPP_BASE_URL: str = "https://wa.me/"
    
    # App Settings
    DEBUG: bool = os.getenv("DEBUG", "False").lower() == "true"
    
    # Server Settings
    HOST: str = os.getenv("HOST", "0.0.0.0")
    PORT: int = int(os.getenv("PORT", "8000"))

    class Config:
        env_file = ".env"

settings = Settings()