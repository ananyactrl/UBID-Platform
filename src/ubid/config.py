from dataclasses import dataclass
import os


@dataclass
class Settings:
    """Runtime settings for prototype execution."""

    db_url: str = os.getenv("UBID_DB_URL", "sqlite:///ubid.db")
    auto_link_threshold: float = 0.95
    review_threshold: float = 0.70


def get_settings() -> Settings:
    return Settings()
