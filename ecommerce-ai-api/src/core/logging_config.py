import logging
import sys
from logging.handlers import RotatingFileHandler
from pathlib import Path

from core.config import get_settings


def setup_logging() -> None:
    settings = get_settings()

    log_level = getattr(
        logging,
        settings.LOG_LEVEL.upper(),
        logging.INFO,
    )
    handlers: list[logging.Handler] = [logging.StreamHandler(sys.stdout)]
    if settings.LOG_TO_FILE:
        Path("logs").mkdir(parents=True, exist_ok=True)
        handlers.append(
            RotatingFileHandler(
                "logs/app.log",
                maxBytes=10_000_000,
                backupCount=5,
                encoding="utf-8",
            ),
        )

    logging.basicConfig(
        level=log_level,
        format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
        handlers=handlers,
    )
    # reload + logs/app.log → watchfiles her satırda "change detected" (gürültü / gereksiz reload)
    logging.getLogger("watchfiles").setLevel(logging.WARNING)