from __future__ import annotations

from fastapi import APIRouter, HTTPException, Request

from ..schemas import Location
from ..state import AppState

router = APIRouter(tags=["locations"])


@router.get("/locations", response_model=list[Location])
def list_locations(request: Request) -> list[Location]:
    state: AppState = request.app.state.bloom
    return list(state.location_meta.values())


@router.get("/locations/{location_id}", response_model=Location)
def get_location(location_id: str, request: Request) -> Location:
    state: AppState = request.app.state.bloom
    loc = state.location_meta.get(location_id)
    if loc is None:
        raise HTTPException(status_code=404, detail=f"Unknown location_id: {location_id}")
    return loc
