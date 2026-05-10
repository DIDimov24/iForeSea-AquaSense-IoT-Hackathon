"""Inference layer: shared by /risk/{id} and /risk."""

from __future__ import annotations

from datetime import timedelta

import pandas as pd

from bloom_ml.features import to_risk_class
from bloom_ml.target import HORIZON_DAYS

from .schemas import ForecastWindow, RiskPrediction
from .state import AppState


def _latest_feature_row(state: AppState, location_id: str) -> pd.Series | None:
    loc_col = f"loc_{location_id}"
    feats = state.features_df
    if loc_col not in feats.columns:
        return None
    rows = feats[feats[loc_col] == 1].sort_values("date")
    if rows.empty:
        return None
    return rows.iloc[-1]


def _stub_chlorophyll(state: AppState, location_id: str) -> tuple[float, pd.Timestamp] | None:
    daily = state.daily_df
    rows = daily[daily["location_id"] == location_id].sort_values("date")
    if rows.empty:
        return None
    last = rows.iloc[-1]
    return float(last["chlorophyll_a_ug_l"]), pd.Timestamp(last["date"])


def predict_for_location(state: AppState, location_id: str) -> RiskPrediction | None:
    if location_id not in state.location_meta:
        return None

    if state.model is not None and state.feature_cols:
        row = _latest_feature_row(state, location_id)
        if row is None:
            return None
        as_of = pd.Timestamp(row["date"])
        X = (
            row.reindex(state.feature_cols)
            .to_frame()
            .T.fillna(0.0)
            .astype(float)
        )
        chl = float(state.model.predict(X)[0])
    else:
        stub = _stub_chlorophyll(state, location_id)
        if stub is None:
            return None
        chl, as_of = stub

    chl = max(chl, 0.0)
    as_of_date = as_of.date()
    window = ForecastWindow(
        start=as_of_date + timedelta(days=HORIZON_DAYS[0]),
        end=as_of_date + timedelta(days=HORIZON_DAYS[-1]),
    )
    return RiskPrediction(
        location_id=location_id,
        as_of_date=as_of_date,
        forecast_window=window,
        predicted_chlorophyll_ug_l=round(chl, 3),
        risk_class=to_risk_class(chl),
        model=state.model_kind,
    )


def predict_all(state: AppState) -> list[RiskPrediction]:
    out: list[RiskPrediction] = []
    for loc_id in state.location_meta:
        pred = predict_for_location(state, loc_id)
        if pred is not None:
            out.append(pred)
    return out


def recent_readings(state: AppState, location_id: str, days: int) -> list[dict] | None:
    if location_id not in state.location_meta:
        return None
    daily = state.daily_df
    rows = daily[daily["location_id"] == location_id].sort_values("date").tail(days)
    return [
        {
            "date": pd.Timestamp(r["date"]).date(),
            "temperature_c": float(r["temperature_c"]),
            "nitrate_no3_mg_l": float(r["nitrate_no3_mg_l"]),
            "phosphate_po4_mg_l": float(r["phosphate_po4_mg_l"]),
            "turbidity_ntu": float(r["turbidity_ntu"]),
            "chlorophyll_a_ug_l": float(r["chlorophyll_a_ug_l"]),
        }
        for _, r in rows.iterrows()
    ]
