"""Startup loaders: dataset, model artifacts, location metadata."""

from __future__ import annotations

import logging
from pathlib import Path
from typing import Any

import joblib
import pandas as pd

from bloom_ml.features import aggregate_daily, build_features

from .config import COLUMNS_PATH, DATA_PATH, LOCATION_NAME_EN, MODEL_PATH, PILOT_IDS
from .schemas import Location
from .state import AppState

logger = logging.getLogger(__name__)


def load_raw_dataset(path: Path = DATA_PATH) -> pd.DataFrame:
    df = pd.read_csv(path)
    df["timestamp"] = pd.to_datetime(df["timestamp"])
    return df


def build_location_meta(raw: pd.DataFrame) -> dict[str, Location]:
    meta: dict[str, Location] = {}
    for loc_id in PILOT_IDS:
        rows = raw[raw["location_id"] == loc_id]
        if rows.empty:
            continue
        first = rows.iloc[0]
        meta[loc_id] = Location(
            location_id=loc_id,
            name_bg=str(first["location_name_bg"]),
            name_en=LOCATION_NAME_EN.get(loc_id, loc_id),
            latitude=float(first["latitude"]),
            longitude=float(first["longitude"]),
        )
    return meta


def load_model_artifacts() -> tuple[Any | None, list[str]]:
    if not MODEL_PATH.exists() or not COLUMNS_PATH.exists():
        logger.warning("Model artifacts missing at %s - using stub predictor.", MODEL_PATH)
        return None, []
    try:
        model = joblib.load(MODEL_PATH)
        feature_cols = list(joblib.load(COLUMNS_PATH))
        return model, feature_cols
    except Exception as exc:
        logger.exception("Failed to load model artifacts: %s - using stub predictor.", exc)
        return None, []


def build_app_state() -> AppState:
    raw = load_raw_dataset()
    daily = aggregate_daily(raw)
    features = build_features(raw, known_locations=PILOT_IDS)
    meta = build_location_meta(raw)
    model, feature_cols = load_model_artifacts()
    return AppState(
        raw_df=raw,
        daily_df=daily,
        features_df=features,
        location_meta=meta,
        model=model,
        feature_cols=feature_cols,
        model_kind="real" if model is not None else "stub",
        model_path=str(MODEL_PATH),
    )
