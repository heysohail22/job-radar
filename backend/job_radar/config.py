from pathlib import Path
from typing import Literal

from pydantic import Field, SecretStr, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=Path(__file__).resolve().parents[1] / ".env",
        extra="ignore",
        case_sensitive=False,
    )
    supabase_url: str = ""
    supabase_secret_key: SecretStr = SecretStr("")
    job_radar_profile_version: str = "skills-v2"
    auth_mode: Literal["local", "owner"] = "owner"
    owner_user_id: str = ""
    host: str = "127.0.0.1"
    port: int = Field(default=3001, ge=1, le=65535)
    website_origins: str = "http://127.0.0.1:3000,http://localhost:3000"
    collector_enabled: bool = False
    collector_timezone: str = "Asia/Kolkata"
    collector_hour: int = Field(default=9, ge=0, le=23)
    collector_minute: int = Field(default=0, ge=0, le=59)
    collector_write: bool = True
    old_collector_disabled: bool = False
    enable_browser: bool = False
    max_queries: int = Field(default=20, ge=1, le=20)
    max_candidates: int = Field(default=100, ge=1, le=500)
    tavily_api_key: SecretStr = SecretStr("")
    firecrawl_api_key: SecretStr = SecretStr("")
    groq_api_key: SecretStr = SecretStr("")
    gemini_api_key: SecretStr = SecretStr("")
    groq_model: str = "openai/gpt-oss-120b"
    gemini_model: str = "gemini-3.8-flash"
    tavily_daily_limit: int = Field(default=20, ge=0)
    tavily_monthly_limit: int = Field(default=900, ge=0)
    firecrawl_daily_limit: int = Field(default=20, ge=0)
    firecrawl_monthly_limit: int = Field(default=900, ge=0)

    @model_validator(mode="after")
    def safe_host(self):
        if self.auth_mode == "local" and self.host not in ("127.0.0.1", "::1", "localhost"):
            raise ValueError(
                "Local mode must bind to loopback. Public hosting requires AUTH_MODE=owner."
            )
        return self
