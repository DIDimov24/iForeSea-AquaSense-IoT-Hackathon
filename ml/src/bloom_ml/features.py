"""Shared feature engineering. Used by training pipeline AND API at predict time."""

from __future__ import annotations

import pandas as pd

SENSOR_COLUMNS: list[str] = [
    "temperature_c",
    "nitrate_no3_mg_l",
    "phosphate_po4_mg_l",
    "turbidity_ntu",
    "chlorophyll_a_ug_l",
]

LAGS: list[int] = [1, 2, 3, 7]
ROLLING_WINDOWS: list[int] = [3, 7]


def aggregate_daily(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()
    df["timestamp"] = pd.to_datetime(df["timestamp"])
    df["date"] = df["timestamp"].dt.normalize()
    return (
        df.groupby(["location_id", "date"], as_index=False)[SENSOR_COLUMNS]
        .mean()
        .sort_values(["location_id", "date"])
        .reset_index(drop=True)
    )


def add_lag_features(df: pd.DataFrame) -> pd.DataFrame:
    df = df.sort_values(["location_id", "date"]).copy()
    grouped = df.groupby("location_id")
    for col in SENSOR_COLUMNS:
        for k in LAGS:
            df[f"{col}_lag{k}"] = grouped[col].shift(k)
    return df


def add_rolling_features(df: pd.DataFrame) -> pd.DataFrame:
    df = df.sort_values(["location_id", "date"]).copy()
    grouped = df.groupby("location_id")
    for col in SENSOR_COLUMNS:
        shifted = grouped[col].shift(1)
        for w in ROLLING_WINDOWS:
            df[f"{col}_roll{w}"] = (
                shifted.groupby(df["location_id"]).rolling(w).mean()
                .reset_index(level=0, drop=True)
            )
    return df


def add_calendar_features(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()
    dates = pd.to_datetime(df["date"])
    df["month"] = dates.dt.month
    df["dayofyear"] = dates.dt.dayofyear
    return df


def encode_location(df: pd.DataFrame, known_locations: list[str] | None = None) -> pd.DataFrame:
    df = df.copy()
    df = pd.get_dummies(df, columns=["location_id"], prefix="loc")
    if known_locations is not None:
        for loc in known_locations:
            col = f"loc_{loc}"
            if col not in df.columns:
                df[col] = 0
    return df


def build_features(df: pd.DataFrame, known_locations: list[str] | None = None) -> pd.DataFrame:
    """Full pipeline: raw rows → engineered feature frame.

    Same call signature used at train and predict time.
    """
    df = aggregate_daily(df)
    df = add_lag_features(df)
    df = add_rolling_features(df)
    df = add_calendar_features(df)
    df = encode_location(df, known_locations=known_locations)
    return df


def feature_columns(df: pd.DataFrame) -> list[str]:
    drop = {"date"}
    return [c for c in df.columns if c not in drop and c not in SENSOR_COLUMNS]


def to_risk_class(chlorophyll_ug_l: float) -> str:
    if chlorophyll_ug_l < 5:
        return "green"
    if chlorophyll_ug_l < 12:
        return "yellow"
    return "red"
