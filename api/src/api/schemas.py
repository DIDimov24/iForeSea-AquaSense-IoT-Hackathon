"""Pydantic response models for the bloom-api endpoints."""

from __future__ import annotations

from datetime import date
from typing import Literal

from pydantic import BaseModel, EmailStr, Field

LocationIdLit = Literal["sarafovo", "central_beach_burgas", "kraimorie"]

RiskClass = Literal["green", "yellow", "red"]
ModelKind = Literal["real", "stub"]


class HealthResponse(BaseModel):
    status: Literal["ok"] = "ok"
    model_loaded: bool
    model_path: str


class Location(BaseModel):
    location_id: str
    name_bg: str
    name_en: str
    latitude: float
    longitude: float


class ForecastWindow(BaseModel):
    start: date
    end: date


class RiskPrediction(BaseModel):
    location_id: str
    as_of_date: date
    forecast_window: ForecastWindow
    predicted_chlorophyll_ug_l: float = Field(..., ge=0)
    risk_class: RiskClass
    model: ModelKind


class RiskAllResponse(BaseModel):
    as_of_date: date
    items: list[RiskPrediction]


class Reading(BaseModel):
    date: date
    temperature_c: float
    nitrate_no3_mg_l: float
    phosphate_po4_mg_l: float
    turbidity_ntu: float
    chlorophyll_a_ug_l: float


class SubscribeIn(BaseModel):
    email: EmailStr
    location_id: LocationIdLit
    hour_local: int = Field(8, ge=0, le=23)
    timezone: str = Field("Europe/Sofia", min_length=1, max_length=64)


class SubscribeOut(BaseModel):
    status: Literal["pending_confirmation", "already_active"]
    message: str
