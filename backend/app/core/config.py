from __future__ import annotations

import os
from typing import List, Optional, Union
from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application configuration loaded from environment or .env file."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    ENV: str = "development"
    PORT: int = 8080
    HOST: str = "0.0.0.0"

    # Google Cloud / Firebase Spark Plan
    GOOGLE_CLOUD_PROJECT: str = "saheli-2576f"
    FIREBASE_PROJECT_ID: str = "saheli-2576f"
    GOOGLE_CLOUD_STORAGE_BUCKET: str = "saheli-reports-dev"

    # Base64-encoded Firebase Service Account JSON (Render Free / Secret injection)
    FIREBASE_SERVICE_ACCOUNT_B64: Optional[str] = None

    # Gemini API key (server-side only, free tier compatible)
    GEMINI_API_KEY: str = ""

    # CORS configuration
    CORS_ORIGINS: Union[str, List[str]] = ["http://localhost:3000"]
    CORS_ORIGIN_REGEX: Optional[str] = r"https://.*\.vercel\.app"

    # Demo / Testing Mocks
    ENABLE_DEMO_MOCKS: bool = True

    # Upload constraints
    MAX_UPLOAD_SIZE_BYTES: int = 10 * 1024 * 1024  # 10 MB
    ALLOWED_UPLOAD_MIME_TYPES: List[str] = [
        "application/pdf",
        "image/jpeg",
        "image/png",
    ]

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def parse_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str):
            return [origin.strip() for origin in v.split(",") if origin.strip()]
        return v

    @property
    def is_production(self) -> bool:
        return self.ENV.lower() in ("production", "prod")

    @property
    def is_testing(self) -> bool:
        return self.ENV.lower() in ("testing", "test")


settings = Settings()
