# Burgas Bay Water-Quality Dataset (Simulated)

Synthetic water-quality dataset for Burgas Bay, used for prototyping the iForeSea HAB early-warning pipeline.

## Overview

| Field     | Value                                          |
| --------- | ---------------------------------------------- |
| File      | `water_quality_burgas_simulated_2025_2026.csv` |
| Period    | 2025-05-15 → 2026-05-15                        |
| Frequency | 2 measurements per day (08:00, 16:00)          |
| Locations | Sarafovo, Central Beach Burgas, Kraimorie      |
| Rows      | 2196                                           |
| Columns   | 11                                             |

## Columns

| Column                | Type     | Description                                                |
| --------------------- | -------- | ---------------------------------------------------------- |
| `timestamp`           | ISO 8601 | Measurement datetime                                       |
| `measurement_session` | string   | `morning` / `afternoon`                                    |
| `location_id`         | string   | ASCII id (`sarafovo`, `central_beach_burgas`, `kraimorie`) |
| `location_name_bg`    | string   | Bulgarian location name                                    |
| `latitude`            | float    | Approximate latitude                                       |
| `longitude`           | float    | Approximate longitude                                      |
| `temperature_c`       | float    | Water temperature (°C)                                     |
| `nitrate_no3_mg_l`    | float    | Nitrate concentration (mg/L)                               |
| `phosphate_po4_mg_l`  | float    | Phosphate concentration (mg/L)                             |
| `turbidity_ntu`       | float    | Turbidity (NTU)                                            |
| `chlorophyll_a_ug_l`  | float    | Chlorophyll-a concentration (µg/L) - target variable       |

## Risk class mapping (derived, not in CSV)

Traffic-light status derived from `chlorophyll_a_ug_l`:

| Class                                      | Color  | Threshold (µg/L)   |
| ------------------------------------------ | ------ | ------------------ |
| Good ecological condition / low bloom risk | Green  | `<= 12`            |
| Moderate eutrophication risk               | Yellow | `> 12` and `<= 22` |
| High bloom risk / possible HAB conditions  | Red    | `> 22`             |

Mapping is a pure function - keep identical between ML and frontend.

## Notes

- Data are synthetic but seasonally structured and feature-correlated.
- Suitable for EDA, correlation analysis, and ML experimentation.
- Forecast target per project spec: max `chlorophyll_a_ug_l` over T+3..T+5 days.
