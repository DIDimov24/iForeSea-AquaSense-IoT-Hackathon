"""FastAPI app entry point for bloom-api."""

from __future__ import annotations

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import CORS_ORIGINS
from .loader import build_app_state
from .routers import health, locations, readings, risk

logging.basicConfig(level=logging.INFO)


@asynccontextmanager
async def lifespan(app: FastAPI):
    app.state.bloom = build_app_state()
    yield


app = FastAPI(
    title="bloom-api",
    description="iForeSea harmful-algal-bloom risk forecasting API.",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_methods=["GET"],
    allow_headers=["*"],
)

app.include_router(health.router)
app.include_router(locations.router)
app.include_router(risk.router)
app.include_router(readings.router)


@app.get("/", tags=["meta"])
def root() -> dict[str, str]:
    return {"service": "bloom-api", "docs": "/docs"}
