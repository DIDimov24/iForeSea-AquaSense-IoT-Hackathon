# bloom-api

FastAPI backend for the iForeSea harmful-algal-bloom (HAB) early-warning platform. Loads the
model artifact produced by `ml/` at startup and serves per-beach risk predictions to the web
client.

## Install & run

From `api/` (Windows PowerShell shown; bash analogous):

```powershell
python -m venv .venv
.venv\Scripts\activate
pip install -e .
pip install -e ../ml          # bloom-ml: shared feature pipeline
copy .env.example .env        # local dev only; Render uses dashboard env vars
uvicorn api.main:app --reload --port 8000
```

### Environment variables

| Var                  | Default                                              | Purpose                                           |
| -------------------- | ---------------------------------------------------- | ------------------------------------------------- |
| `BLOOM_CORS_ORIGINS` | `http://localhost:3000,http://127.0.0.1:3000`        | Comma-separated allowed origins for CORS.         |

For Render, set `BLOOM_CORS_ORIGINS` to your deployed frontend URL(s). Do not commit `.env`.

If `ml/models/bloom_forecaster.pkl` is missing the API still starts and serves a deterministic
**stub** predictor (last-known chlorophyll-a) so the frontend can integrate end-to-end. Train a
real model with `bloom-train` from `ml/`.

## Endpoints

| Method | Path                              | Purpose                                            |
| ------ | --------------------------------- | -------------------------------------------------- |
| `GET`  | `/`                               | Service info                                       |
| `GET`  | `/health`                         | Status + whether real model loaded                 |
| `GET`  | `/locations`                      | All pilot beaches (id, name_bg, name_en, lat, lon) |
| `GET`  | `/locations/{location_id}`        | Single beach metadata                              |
| `GET`  | `/risk`                           | Predicted risk for all pilot locations             |
| `GET`  | `/risk/{location_id}`             | Predicted risk for one location                    |
| `GET`  | `/readings/{location_id}?days=14` | Recent daily-aggregated sensor readings            |

Auto-generated OpenAPI docs at `/docs`.

### Pilot location ids

`sarafovo`, `central`, `kraimorie` - stable identifiers used as URL params, ML one-hot
features, and dataset keys.

### Risk classification (deterministic, shared with ML + Web)

Defined in `bloom_ml.features.to_risk_class`:

| Class    | Predicted chlorophyll-a (µg/L) |
| -------- | ------------------------------ |
| `green`  | `< 5`                          |
| `yellow` | `>= 5` and `< 12`              |
| `red`    | `>= 12`                        |

### `/risk/{location_id}` JSON shape

```json
{
  "location_id": "sarafovo",
  "as_of_date": "2026-05-09",
  "forecast_window": { "start": "2026-05-12", "end": "2026-05-14" },
  "predicted_chlorophyll_ug_l": 7.31,
  "risk_class": "yellow",
  "model": "real"
}
```

`forecast_window` covers T+3..T+5 days from `as_of_date` (matches
`bloom_ml.target.HORIZON_DAYS`). `model` is `"real"` when the joblib artifact loaded
successfully, `"stub"` otherwise.

## Architecture role

```
ml/models/*.pkl ──► api/ (this service) ──► web/ (Next.js)
                  loads at startup,
                  reuses bloom_ml.features
                  for predict-time feature
                  building (no duplication)
```

See `docs/architecture.md` for the end-to-end data flow.
