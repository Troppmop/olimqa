from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    database_url: str = "postgresql+asyncpg://olim:olimpass@db:5432/olimqa"

    @field_validator("database_url")
    @classmethod
    def ensure_asyncpg_driver(cls, v: str) -> str:
        # Railway injects plain postgresql:// — replace with the asyncpg driver
        if v.startswith("postgresql://") and "+asyncpg" not in v:
            return v.replace("postgresql://", "postgresql+asyncpg://", 1)
        return v
    redis_url: str = "redis://redis:6379"
    secret_key: str = "changeme_super_secret_key_32chars"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 60
    refresh_token_expire_days: int = 30

    # Comma-separated list of allowed CORS origins, e.g.:
    # "http://localhost:5173,https://myapp.up.railway.app"
    cors_origins: str = "http://localhost:5173"
    # Set this to your email to be auto-promoted to admin on first startup
    admin_email: str = ""

    # Email / SMTP
    smtp_host: str = "mailhog"
    smtp_port: int = 1025
    smtp_user: str = ""
    smtp_password: str = ""
    smtp_from: str = "noreply@olimqa.local"
    smtp_tls: bool = False       # True for port 465 (TLS)
    smtp_starttls: bool = False  # True for port 587 (STARTTLS) — used by Resend/SendGrid
    frontend_url: str = "http://localhost:5173"

    @property
    def cors_origins_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


settings = Settings()
