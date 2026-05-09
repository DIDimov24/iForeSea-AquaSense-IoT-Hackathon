"""Train bloom forecaster and save joblib artifacts for the API."""

from __future__ import annotations

from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error

from bloom_ml.features import (
    SENSOR_COLUMNS,
    aggregate_daily,
    build_features,
    feature_columns,
    to_risk_class,
)
from bloom_ml.target import add_target

REPO_ROOT = Path(__file__).resolve().parents[3]
DATA_PATH = REPO_ROOT / "data" / "water_quality_burgas_simulated_2025_2026.csv"
MODELS_DIR = REPO_ROOT / "ml" / "models"
MODEL_PATH = MODELS_DIR / "bloom_forecaster.pkl"
COLUMNS_PATH = MODELS_DIR / "feature_columns.pkl"

TARGET = "y_max_chl_t3_t5"
TIME_SPLIT_QUANTILE = 0.8


def _try_xgboost():
    try:
        from xgboost import XGBRegressor
        return XGBRegressor(
            n_estimators=400,
            max_depth=5,
            learning_rate=0.05,
            random_state=42,
            n_jobs=-1,
        )
    except ImportError:
        return None


def load_raw(path: Path = DATA_PATH) -> pd.DataFrame:
    df = pd.read_csv(path)
    df["timestamp"] = pd.to_datetime(df["timestamp"])
    return df


def build_dataset(raw: pd.DataFrame) -> tuple[pd.DataFrame, pd.Series, list[str]]:
    daily = aggregate_daily(raw)
    daily = add_target(daily)

    known_locations = sorted(raw["location_id"].unique().tolist())
    features = build_features(raw, known_locations=known_locations)
    merged = features.copy()
    target_lookup = daily.set_index(["location_id", "date"])[TARGET]
    loc_cols = [c for c in merged.columns if c.startswith("loc_")]
    merged["__location_id"] = merged[loc_cols].idxmax(axis=1).str.replace("loc_", "", regex=False)
    merged[TARGET] = [
        target_lookup.get((loc, d), np.nan)
        for loc, d in zip(merged["__location_id"], merged["date"])
    ]
    merged = merged.drop(columns="__location_id")

    merged = merged.dropna(subset=[TARGET]).copy()
    feature_cols = feature_columns(merged)
    feature_cols = [c for c in feature_cols if c != TARGET]
    merged = merged.dropna(subset=feature_cols)

    X = merged[feature_cols].astype(float)
    y = merged[TARGET].astype(float)
    return merged[["date"] + feature_cols + [TARGET]], (X, y), feature_cols


def time_split(df_full: pd.DataFrame, X: pd.DataFrame, y: pd.Series, quantile: float = TIME_SPLIT_QUANTILE):
    cutoff = df_full["date"].quantile(quantile)
    train_mask = df_full["date"] < cutoff
    test_mask = ~train_mask
    return X[train_mask], X[test_mask], y[train_mask], y[test_mask], cutoff


def class_accuracy(y_true: pd.Series, y_pred: np.ndarray) -> float:
    cls_true = [to_risk_class(v) for v in y_true]
    cls_pred = [to_risk_class(v) for v in y_pred]
    return float(np.mean([a == b for a, b in zip(cls_true, cls_pred)]))


def main() -> None:
    print(f"Loading raw data from {DATA_PATH}")
    raw = load_raw()
    print(f"  rows={len(raw)}  locations={raw['location_id'].unique().tolist()}")

    df_full, (X, y), feature_cols = build_dataset(raw)
    print(f"Built feature matrix: shape={X.shape}, target={TARGET}")

    X_tr, X_te, y_tr, y_te, cutoff = time_split(df_full, X, y)
    print(f"Time split at {cutoff.date()} -> train={len(X_tr)} test={len(X_te)}")

    print("\n[Baseline] RandomForestRegressor")
    rf = RandomForestRegressor(n_estimators=200, random_state=42, n_jobs=-1)
    rf.fit(X_tr, y_tr)
    rf_pred = rf.predict(X_te)
    print(f"  MAE       = {mean_absolute_error(y_te, rf_pred):.3f} ug/L")
    print(f"  class acc = {class_accuracy(y_te, rf_pred):.3f}")

    final_model = rf
    final_name = "RandomForest"

    xgb = _try_xgboost()
    if xgb is not None:
        print("\n[Final] XGBRegressor")
        xgb.fit(X_tr, y_tr)
        xgb_pred = xgb.predict(X_te)
        xgb_mae = mean_absolute_error(y_te, xgb_pred)
        print(f"  MAE       = {xgb_mae:.3f} ug/L")
        print(f"  class acc = {class_accuracy(y_te, xgb_pred):.3f}")
        if xgb_mae <= mean_absolute_error(y_te, rf_pred):
            final_model = xgb
            final_name = "XGBoost"
    else:
        print("\nxgboost not installed - keeping RandomForest")

    MODELS_DIR.mkdir(parents=True, exist_ok=True)
    joblib.dump(final_model, MODEL_PATH)
    joblib.dump(feature_cols, COLUMNS_PATH)
    print(f"\nSaved {final_name} -> {MODEL_PATH}")
    print(f"Saved feature columns ({len(feature_cols)}) -> {COLUMNS_PATH}")
