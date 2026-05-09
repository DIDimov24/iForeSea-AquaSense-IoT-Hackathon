# Data Dictionary

This document describes the columns of the simulated Burgas Bay water-quality dataset.

> **Source of truth for column names and units:** the header of `data/raw/water_quality_burgas_simulated_2025_2026.csv`. This file documents the **meaning** of each column, not its raw structure.

## Dataset at a Glance

| Property      | Value                                                |
| ------------- | ---------------------------------------------------- |
| File          | `data/raw/water_quality_burgas_simulated_2025_2026.csv` |
| Period        | 2025-05-15 → 2026-05-15                              |
| Frequency     | 2 measurements per day (08:00 and 16:00 local time)  |
| Locations     | Sarafovo, Central Beach Burgas, Kraimorie            |
| Total rows    | 2196                                                 |
| Nature        | Synthetic, but seasonally structured and correlated  |
| Intended use  | Prototyping, visualization, correlation analysis, ML |

## Columns

| Column                | Type         | Unit       | Description                                                                                          |
| --------------------- | ------------ | ---------- | ---------------------------------------------------------------------------------------------------- |
| `timestamp`           | ISO datetime | -          | Date and time of the measurement.                                                                    |
| `measurement_session` | string       | -          | Either `morning` (08:00) or `afternoon` (16:00).                                                     |
| `location_id`         | string       | -          | ASCII identifier for the monitoring point (e.g. `sarafovo`). Stable across the dataset.              |
| `location_name_bg`    | string       | -          | Human-readable Bulgarian name of the location (e.g. *Сарафово*).                                     |
| `latitude`            | float        | degrees    | Approximate latitude of the monitoring point.                                                        |
| `longitude`           | float        | degrees    | Approximate longitude of the monitoring point.                                                       |
| `temperature_c`       | float        | °C         | Water temperature in degrees Celsius.                                                                |
| `nitrate_no3_mg_l`    | float        | mg/L       | Nitrate (NO₃) concentration. A key nutrient driver of phytoplankton growth.                          |
| `phosphate_po4_mg_l`  | float        | mg/L       | Phosphate (PO₄) concentration. A key nutrient driver of phytoplankton growth.                        |
| `turbidity_ntu`       | float        | NTU        | Water turbidity (cloudiness) in Nephelometric Turbidity Units.                                       |
| `chlorophyll_a_ug_l`  | float        | µg/L       | Chlorophyll-a concentration. Used as the **bloom indicator** and as the ML model's training target.  |

## Notes

- All three locations share the same timestamp grid - one row per location per session, twice a day.
- Latitude/longitude are approximate and intended only for map plotting, not for navigation.
- `chlorophyll_a_ug_l` is the model's **target variable**. The forecasting task is the maximum chlorophyll-a expected 3-5 days ahead (see [`architecture.md`](./architecture.md)).
- Risk thresholds applied on top of the predicted chlorophyll value:

  | Class    | Range (µg/L)        |
  | -------- | ------------------- |
  | 🟢 green  | `< 5`               |
  | 🟡 yellow | `>= 5` and `< 12`   |
  | 🔴 red    | `>= 12`             |
