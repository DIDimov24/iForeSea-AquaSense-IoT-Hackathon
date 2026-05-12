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

## Email Subscription Pipeline

A second pipeline runs alongside the map and delivers the same forecast as a daily email.

```
[/subscribe form (web)]
     │  POST /subscriptions  (email, beach, hour, tz)
     ▼
[Supabase Postgres]
   subscriptions (one row per email × beach, double opt-in)
   sent_log     (subscription_id, send_date) - idempotency
     ▲                                  ▲
     │ confirm / unsubscribe tokens     │ write after send
     │                                  │
[FastAPI /subscriptions/*]      [FastAPI dispatcher]
     │                                  ▲
     │ Resend (confirm email)           │ POST /internal/tick
     │                                  │ X-Tick-Secret header
     ▼                                  │
[user mailbox]               [GitHub Actions hourly cron]
                                        │
                                        ▼
                            [predictor + Open-Meteo weather]
                                        │
                                        ▼
                                  [Resend (daily email)]
                                        │
                                        ▼
                                  [user mailbox]
```

Key points:

- **Storage** is Supabase Postgres (managed). The API is the only DB client; no anon key is exposed and there is no user-auth system.
- **Transactional email** goes through Resend's REST API via `httpx` (kept async, no SDK).
- **Scheduling** uses a GitHub Actions cron (`0 * * * *` UTC) that POSTs to `/internal/tick`. The dispatcher selects active, confirmed subscriptions whose `hour_local` matches the current local hour for their `timezone`, runs the predictor for each beach, fetches the current Burgas weather once per tick, and sends the email.
- **Idempotency** is enforced by `sent_log` (composite PK `(subscription_id, send_date)`), so even if the cron fires twice in the same hour a subscriber gets at most one email per local day.
- **Internal endpoints** (`/internal/tick`, `/internal/test-email`) are gated by an `X-Tick-Secret` header compared in constant time. Confirmation and unsubscribe URLs use unguessable `secrets.token_urlsafe(32)` tokens and redirect back to the web app.

## Pilot Locations

| Location ID            | Name (BG)             | Name (EN)            |
| ---------------------- | --------------------- | -------------------- |
| `sarafovo`             | Сарафово              | Sarafovo             |
| `central_beach_burgas` | Централен плаж Бургас | Central Beach Burgas |
| `kraimorie`            | Крайморие             | Kraimorie            |
