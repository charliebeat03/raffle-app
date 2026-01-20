import os
from dotenv import load_dotenv
from pydantic_settings import BaseSettings

load_dotenv()

class Settings:
    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./raffle.db")
    
    # JWT
    SECRET_KEY: str = os.getenv("SECRET_KEY", "tu-clave-secreta-muy-larga-y-segura-aqui-cambiala-en-produccion")
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
    
    class Config:
        env_file = ".env"

settings = Settings()

