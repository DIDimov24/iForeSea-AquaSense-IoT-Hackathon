"""Forecast target: max chlorophyll-a over T+3..T+5 days, per location."""

from __future__ import annotations

import pandas as pd

HORIZON_DAYS: tuple[int, int, int] = (3, 4, 5)


def add_target(daily_df: pd.DataFrame, target_col: str = "chlorophyll_a_ug_l") -> pd.DataFrame:
    df = daily_df.sort_values(["location_id", "date"]).copy()
    grouped = df.groupby("location_id")[target_col]
    shifted = pd.concat(
        [grouped.shift(-h).rename(f"_y_t{h}") for h in HORIZON_DAYS], axis=1
    )
    df["y_max_chl_t3_t5"] = shifted.max(axis=1)
    return df
