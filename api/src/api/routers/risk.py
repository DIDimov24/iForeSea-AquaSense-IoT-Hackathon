from __future__ import annotations

from datetime import date

from fastapi import APIRouter, HTTPException, Request

from ..predictor import predict_all, predict_for_location
from ..schemas import RiskAllResponse, RiskPrediction
from ..state import AppState

router = APIRouter(tags=["risk"])


@router.get("/risk", response_model=RiskAllResponse)
def risk_all(request: Request) -> RiskAllResponse:
    state: AppState = request.app.state.bloom
    items = predict_all(state)
    as_of: date = max((p.as_of_date for p in items), default=date.today())
    return RiskAllResponse(as_of_date=as_of, items=items)


@router.get("/risk/{location_id}", response_model=RiskPrediction)
def risk_for_location(location_id: str, request: Request) -> RiskPrediction:
    state: AppState = request.app.state.bloom
    if location_id not in state.location_meta:
        raise HTTPException(status_code=404, detail=f"Unknown location_id: {location_id}")
    pred = predict_for_location(state, location_id)
    if pred is None:
        raise HTTPException(status_code=503, detail="Prediction unavailable for this location.")
    return pred
