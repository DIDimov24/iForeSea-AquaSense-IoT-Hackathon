"""Load saved artifacts and predict on the latest available data per location.

Mimics what the API will do at request time. Run before committing .pkl files.
"""

from pathlib import Path

import joblib
import pandas as pd

from bloom_ml.features import build_features, to_risk_class

REPO_ROOT = Path(__file__).resolve().parents[2]
DATA_PATH = REPO_ROOT / "data" / "water_quality_burgas_simulated_2025_2026.csv"
MODEL_PATH = REPO_ROOT / "ml" / "models" / "bloom_forecaster.pkl"
COLUMNS_PATH = REPO_ROOT / "ml" / "models" / "feature_columns.pkl"


def main() -> None:
    model = joblib.load(MODEL_PATH)
    feature_cols = joblib.load(COLUMNS_PATH)
    print(f"Loaded {type(model).__name__} with {len(feature_cols)} feature columns")

    raw = pd.read_csv(DATA_PATH)
    raw["timestamp"] = pd.to_datetime(raw["timestamp"])

    known_locations = sorted(raw["location_id"].unique().tolist())
    features = build_features(raw, known_locations=known_locations)
    features = features.dropna(subset=feature_cols)

    loc_cols = [c for c in features.columns if c.startswith("loc_")]
    features["__loc"] = features[loc_cols].idxmax(axis=1).str.replace("loc_", "", regex=False)

    print("\nLatest prediction per location (max chlorophyll-a over T+3..T+5 days):")
    print(f"{'location':<22} {'date':<12} {'pred ug/L':>10}  risk")
    for loc, group in features.groupby("__loc"):
        latest = group.sort_values("date").iloc[-1]
        x = latest[feature_cols].to_frame().T.astype(float)
        pred = float(model.predict(x)[0])
        risk = to_risk_class(pred)
        print(f"{loc:<22} {str(latest['date'].date()):<12} {pred:>10.2f}  {risk}")


if __name__ == "__main__":
    main()
