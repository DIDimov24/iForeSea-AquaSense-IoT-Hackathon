from __future__ import annotations

from fastapi import APIRouter, HTTPException, Query, Request

from ..predictor import recent_readings
from ..schemas import Reading
from ..state import AppState

router = APIRouter(tags=["readings"])


@router.get("/readings/{location_id}", response_model=list[Reading])
def get_readings(
    location_id: str,
    request: Request,
    days: int = Query(14, ge=1, le=365),
) -> list[Reading]:
    state: AppState = request.app.state.bloom
    if location_id not in state.location_meta:
        raise HTTPException(status_code=404, detail=f"Unknown location_id: {location_id}")
    rows = recent_readings(state, location_id, days)
    if rows is None:
        raise HTTPException(status_code=503, detail="Readings unavailable for this location.")
    return [Reading(**r) for r in rows]
