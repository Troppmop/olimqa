from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    database_url: str = "postgresql+asyncpg://olim:olimpass@db:5432/olimqa"
    redis_url: str = "redis://redis:6379"
    secret_key: str = "changeme_super_secret_key_32chars"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 60
    refresh_token_expire_days: int = 30

    cors_origins: str = "http://localhost:5173"

settings = Settings()
