from typing import Optional
from pydantic_settings import BaseSettings

_DEFAULT_SECRET = "your-super-secret-key-change-in-production"


class Settings(BaseSettings):
    # MongoDB settings
    MONGO_HOST: str = "localhost"
    MONGO_PORT: int = 27017
    MONGO_USER: str = "lexiuser"
    MONGO_PASSWORD: str = "lexipass123"
    MONGO_DB_NAME: str = "lexi-guard"
    CONTRACTS_COLLECTION_NAME: str = "user_contracts"

    # Resend Email (API key via .env)
    RESEND_API_KEY: str = ""

    # Gmail SMTP settings (use a Gmail App Password)
    SMTP_SERVER: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""

    # Default from address used in templates
    # NOTE: set EMAIL_FROM in .env to match your SMTP_USER
    EMAIL_FROM: str = "LexiGuard <onboarding@resend.dev>"

    # URLs
    FRONTEND_URL: str = "http://localhost:9002"
    BACKEND_URL: str = "http://localhost:8001"



    # OTP / 2FA
    OTP_TTL_SECONDS: int = 600  # 10 minutes

    # Cookie/security environment toggle
    ENVIRONMENT: str = "development"  # set to "production" in prod

    # JWT settings - SECRET_KEY must be set in production
    SECRET_KEY: str = _DEFAULT_SECRET
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    # Set to true in production to require a non-default SECRET_KEY
    REQUIRE_STRONG_SECRET: bool = False
    # Comma-separated extra CORS origins (e.g. https://app.example.com)
    CORS_ORIGINS: Optional[str] = None


    # Optional: set to "admin" when using Mongo root user (e.g. in Docker)
    MONGO_AUTH_SOURCE: Optional[str] = None

    # AI API (e.g. PDF processing, classification) – default port 8000
    AI_API_BASE_URL: str = "http://localhost:8000"
    # Path for PDF process (e.g. /api/pdf/process or /pdf/process)
    AI_API_PROCESS_PATH: str = "/api/v1/analyze/file"

    # Celery / Redis (background contract analysis)
    REDIS_HOST: str = "localhost"
    REDIS_PORT: int = 6379
    REDIS_DB: int = 0
    CELERY_BROKER_URL: Optional[str] = None
    CELERY_RESULT_BACKEND: Optional[str] = None
    CELERY_TASK_ALWAYS_EAGER: bool = False

    @property
    def redis_url(self) -> str:
        return f"redis://{self.REDIS_HOST}:{self.REDIS_PORT}/{self.REDIS_DB}"

    @property
    def celery_broker(self) -> str:
        return self.CELERY_BROKER_URL or self.redis_url

    @property
    def celery_backend(self) -> str:
        return self.CELERY_RESULT_BACKEND or self.redis_url

    @property
    def MONGO_URI(self) -> str:
        if not self.MONGO_USER or not self.MONGO_PASSWORD:
            return f"mongodb://{self.MONGO_HOST}:{self.MONGO_PORT}"
        base = f"mongodb://{self.MONGO_USER}:{self.MONGO_PASSWORD}@{self.MONGO_HOST}:{self.MONGO_PORT}"
        if self.MONGO_AUTH_SOURCE:
            return f"{base}/?authSource={self.MONGO_AUTH_SOURCE}"
        return base

    def validate_secret_key(self) -> None:
        if self.REQUIRE_STRONG_SECRET and (
            not self.SECRET_KEY or self.SECRET_KEY == _DEFAULT_SECRET or len(self.SECRET_KEY) < 32
        ):
            raise ValueError(
                "SECRET_KEY must be set to a strong value (32+ chars) in production. "
                "Set REQUIRE_STRONG_SECRET=false for local dev only."
            )

    class Config:
        env_file = ".env"


settings = Settings()

