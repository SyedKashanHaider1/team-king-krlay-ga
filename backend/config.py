import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    SECRET_KEY = os.getenv("SECRET_KEY", "ai-mcc-super-secret-key-2025-change-in-production")
    JWT_ACCESS_EXPIRY_MINUTES = int(os.getenv("JWT_ACCESS_EXPIRY_MINUTES", 15))
    JWT_REFRESH_EXPIRY_DAYS = int(os.getenv("JWT_REFRESH_EXPIRY_DAYS", 7))
    
    # Database configuration - support both local SQLite and Railway PostgreSQL
    if os.getenv("RAILWAY_ENVIRONMENT") == "production":
        DATABASE_URL = os.getenv("DATABASE_URL")
        # For PostgreSQL on Railway
        if DATABASE_URL and DATABASE_URL.startswith("postgresql"):
            DATABASE_TYPE = "postgresql"
        else:
            DATABASE_TYPE = "sqlite"
            DATABASE_PATH = os.getenv("DATABASE_PATH", "/tmp/marketing.db")
    else:
        DATABASE_TYPE = "sqlite"
        DATABASE_PATH = os.getenv("DATABASE_PATH", os.path.join(os.path.dirname(__file__), "data", "marketing.db"))
    
    DEBUG = os.getenv("FLASK_DEBUG", "false").lower() == "true"
    FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5000")
    PORT = int(os.getenv("PORT", 5000))

    GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
    GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-1.5-flash")
