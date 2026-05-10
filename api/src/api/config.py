"""Static config: paths, pilot identifiers, location English names."""

from __future__ import annotations

import os
from pathlib import Path

from dotenv import load_dotenv

REPO_ROOT = Path(__file__).resolve().parents[3]

load_dotenv(REPO_ROOT / "api" / ".env")
DATA_PATH = REPO_ROOT / "data" / "water_quality_burgas_simulated_2025_2026.csv"
MODELS_DIR = REPO_ROOT / "ml" / "models"
MODEL_PATH = MODELS_DIR / "bloom_forecaster.pkl"
COLUMNS_PATH = MODELS_DIR / "feature_columns.pkl"

PILOT_IDS: list[str] = ["sarafovo", "central_beach_burgas", "kraimorie"]

LOCATION_NAME_EN: dict[str, str] = {
    "sarafovo": "Sarafovo",
    "central_beach_burgas": "Central Beach Burgas",
    "kraimorie": "Kraimorie",
}

_DEFAULT_CORS = "http://localhost:3000,http://127.0.0.1:3000"
CORS_ORIGINS: list[str] = [
    o.strip()
    for o in os.getenv("BLOOM_CORS_ORIGINS", _DEFAULT_CORS).split(",")
    if o.strip()
]
