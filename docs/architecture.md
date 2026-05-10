# Architecture

This document describes how data flows through the iForeSea platform - from sensor readings to the color-coded risk shown on the map.

## End-to-End Data Flow

```
[Water-quality sensors]
        │  Twice-daily readings: temperature, NO₃, PO₄, turbidity, chlorophyll-a
        ▼
[Raw CSV: data/raw/water_quality_burgas_simulated_2025_2026.csv]
        │
        ▼
[ML training pipeline (ml/)]
   1. Load CSV → daily aggregation per location
   2. Feature engineering: lag features, rolling statistics,
      seasonality, location one-hot encoding
   3. Target: maximum chlorophyll-a over T+3 to T+5 days
   4. Model: XGBoost regressor with a time-aware train/test split
        │
        ▼
[Model artifact: ml/models/bloom_forecaster.pkl
                + ml/models/feature_columns.pkl]
        │
        ▼
[FastAPI backend (api/)]
   - Loads the artifact at startup (or falls back to a stub model)
   - GET /health           → service status
   - GET /risk/{location_id} → predicted chlorophyll + risk class
        │  HTTP / JSON
        ▼
[Next.js web app (web/)]
   - Calls the API once per beach
   - Renders risk badges on a map and a card grid for Burgas Bay
```

## Components

| Layer    | Folder  | Responsibility                                                                |
| -------- | ------- | ----------------------------------------------------------------------------- |
| Data     | `data/` | Raw, processed, and sample CSVs. Currently a synthetic Burgas Bay dataset.    |
| ML       | `ml/`   | Feature engineering + bloom-forecasting model. Outputs a serialized artifact. |
| Backend  | `api/`  | FastAPI service that loads the model and exposes prediction endpoints.        |
| Frontend | `web/`  | Next.js app. Renders the bay map and the per-beach traffic-light risk badges. |

## Forecast Horizon

Each prediction targets the **maximum chlorophyll-a expected 3 to 5 days from "now"**, where "now" is the latest available daily-aggregated reading.

This horizon is the core promise of the system: it gives citizens and institutions enough lead time to react **before** the bloom occurs.

## Risk Classification

The regressor outputs a chlorophyll-a value in µg/L. A pure (deterministic) function maps that number to one of three classes shown on the map:

| Class     | Chlorophyll-a (µg/L) | Meaning                                            |
| --------- | -------------------- | -------------------------------------------------- |
| 🟢 green  | `<= 10`              | Good ecological condition / low bloom risk         |
| 🟡 yellow | `> 10` and `<= 22`   | Moderate eutrophication risk                       |
| 🔴 red    | `> 22`               | High bloom risk / possible HAB conditions          |

Because the mapping is a pure function, the same predicted value always yields the same class - making results easy to interpret and reproduce.

## Inter-Component Contracts

These are the stable interfaces between layers. Changing them requires updating both sides.

- **ML → API:** the file paths `ml/models/bloom_forecaster.pkl` and `ml/models/feature_columns.pkl`, both joblib-serialized.
- **API → Web:** the JSON response shape of `GET /risk/{location_id}`, documented in `api/README.md`.

## Pilot Locations

| Location ID | Name (BG)             | Name (EN)            |
| ----------- | --------------------- | -------------------- |
| `sarafovo`  | Сарафово              | Sarafovo             |
| `central`   | Централен плаж Бургас | Central Beach Burgas |
| `kraimorie` | Крайморие             | Kraimorie            |
