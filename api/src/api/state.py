"""Application state container, populated at startup."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Literal

import pandas as pd

from .schemas import Location

ModelKind = Literal["real", "stub"]


@dataclass
class AppState:
    raw_df: pd.DataFrame
    daily_df: pd.DataFrame
    features_df: pd.DataFrame
    location_meta: dict[str, Location]
    model: Any | None
    feature_cols: list[str]
    model_kind: ModelKind
    model_path: str
