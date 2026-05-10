from __future__ import annotations

from fastapi import APIRouter, Request

from ..schemas import HealthResponse
from ..state import AppState

router = APIRouter(tags=["health"])


@router.get("/health", response_model=HealthResponse)
def health(request: Request) -> HealthResponse:
    state: AppState = request.app.state.bloom
    return HealthResponse(
        model_loaded=state.model_kind == "real",
        model_path=state.model_path,
    )
