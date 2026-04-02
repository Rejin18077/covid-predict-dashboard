import numpy as np
import pandas as pd
import lightgbm as lgb
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from contextlib import asynccontextmanager
from datetime import date

# =============================================================================
# Config
# =============================================================================
FEATURE_COLS = [
    "lag_1", "lag_3", "lag_7", "lag_14", "lag_21",
    "roll_mean_7", "roll_mean_14", "roll_std_7", "roll_std_14",
    "retail_and_recreation_lag7", "retail_and_recreation_roll7",
    "grocery_and_pharmacy_lag7", "grocery_and_pharmacy_roll7",
    "parks_lag7", "parks_roll7",
    "transit_stations_lag7", "transit_stations_roll7",
    "workplaces_lag7", "workplaces_roll7",
    "residential_lag7", "residential_roll7",
    "day_of_week", "month", "week_of_year", "is_weekend",
    "country_enc", "days_since_outbreak", "growth_rate_7d",
]

MOBILITY_COLS = [
    "retail_and_recreation_percent_change_from_baseline",
    "grocery_and_pharmacy_percent_change_from_baseline",
    "parks_percent_change_from_baseline",
    "transit_stations_percent_change_from_baseline",
    "workplaces_percent_change_from_baseline",
    "residential_percent_change_from_baseline",
]

MOBILITY_SHORT = [c.split("_percent")[0] for c in MOBILITY_COLS]

model: lgb.Booster = None
history_df: pd.DataFrame = None
country_enc_map: dict = {}

# =============================================================================
# Startup
# =============================================================================
@asynccontextmanager
async def lifespan(app: FastAPI):
    global model, history_df, country_enc_map

    model = lgb.Booster(model_file="models/model.txt")

    df = pd.read_csv("data/covid_dataset.csv", parse_dates=["date"])
    df = df.sort_values(["country_region", "date"]).reset_index(drop=True)

    df[MOBILITY_COLS] = (
        df.groupby("country_region")[MOBILITY_COLS]
        .transform(lambda x: x.ffill().bfill())
    )

    df["daily_new"] = (
        df.groupby("country_region")["confirmed_cases"]
        .diff().clip(lower=0)
    )
    df = df.dropna(subset=["daily_new"]).reset_index(drop=True)

    countries = sorted(df["country_region"].unique())
    country_enc_map = {c: i for i, c in enumerate(countries)}
    df["country_enc"] = df["country_region"].map(country_enc_map)

    first_case = df[df["daily_new"] > 0].groupby("country_region")["date"].min()
    df["days_since_outbreak"] = (
        df["date"] - df["country_region"].map(first_case)
    ).dt.days.clip(lower=0)

    history_df = df
    print(f"Model loaded  — {model.num_trees()} trees")
    print(f"Dataset loaded — {len(df):,} rows | {len(countries)} regions")
    yield
    model = None
    history_df = None

app = FastAPI(
    title="COVID Forecast API",
    description="Predict daily new COVID cases for a region over the next N days.",
    version="2.0.0",
    lifespan=lifespan,
)

origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# =============================================================================
# Schema
# =============================================================================
class ForecastRequest(BaseModel):
    region: str = Field(..., example="india",
                        description="Country/region name (case-insensitive)")
    horizon: int = Field(..., ge=1, le=90,
                         description="How many days ahead to predict (e.g. 14 or 30)")


class DayForecast(BaseModel):
    date:                date
    predicted_new_cases: int


class ForecastResponse(BaseModel):
    region:           str
    horizon_days:     int
    last_known_date:  date
    last_known_cases: int
    forecast:         list[DayForecast]


# =============================================================================
# Core walk-forward forecast
# =============================================================================
def build_row(history: pd.DataFrame, step: int, next_date: pd.Timestamp) -> dict:
    row = {}

    for lag in [1, 3, 7, 14, 21]:
        row[f"lag_{lag}"] = float(history["daily_new"].iloc[-lag]) if len(history) >= lag else 0.0

    for window in [7, 14]:
        recent = history["daily_new"].iloc[-window:].values
        row[f"roll_mean_{window}"] = float(np.mean(recent))
        row[f"roll_std_{window}"]  = float(np.std(recent)) if len(recent) > 1 else 0.0

    denom = float(history["daily_new"].iloc[-7]) + 1 if len(history) >= 7 else 1.0
    row["growth_rate_7d"] = min(float(history["daily_new"].iloc[-1]) / denom, 20.0)

    for mob_col, short in zip(MOBILITY_COLS, MOBILITY_SHORT):
        row[f"{short}_lag7"]  = float(history[mob_col].iloc[-7]) if len(history) >= 7 else 0.0
        row[f"{short}_roll7"] = float(history[mob_col].iloc[-7:].mean())

    row["day_of_week"]          = next_date.dayofweek
    row["month"]                = next_date.month
    row["week_of_year"]         = next_date.isocalendar().week
    row["is_weekend"]           = int(next_date.dayofweek >= 5)
    row["country_enc"]          = int(history["country_enc"].iloc[-1])
    row["days_since_outbreak"]  = float(history["days_since_outbreak"].iloc[-1]) + step

    return row


# =============================================================================
# Endpoints
# =============================================================================
@app.get("/health")
def health():
    return {
        "status": "ok",
        "model_loaded": model is not None,
        "regions_available": len(country_enc_map),
    }


@app.get("/regions")
def list_regions():
    """List all available region names."""
    return {"regions": sorted(country_enc_map.keys())}


@app.post("/forecast", response_model=ForecastResponse)
def forecast(req: ForecastRequest):
    """
    Walk-forward forecast for a region.
    Pass horizon=14 for two weeks, horizon=30 for one month.
    """
    region = req.region.lower().strip()

    if region not in country_enc_map:
        close = [r for r in country_enc_map if req.region.lower() in r]
        hint  = f" Did you mean: {close[:5]}?" if close else ""
        raise HTTPException(status_code=404, detail=f"Region '{region}' not found.{hint}")

    country_history  = history_df[history_df["country_region"] == region].copy()
    last_date        = country_history["date"].max()
    last_known_cases = int(country_history["daily_new"].iloc[-1])

    preds = []
    for step in range(1, req.horizon + 1):
        next_date = last_date + pd.Timedelta(days=step)
        row       = build_row(country_history, step, next_date)

        X         = pd.DataFrame([row], columns=FEATURE_COLS)
        log1p_val = float(model.predict(X)[0])
        new_cases = max(0, round(float(np.expm1(log1p_val))))

        preds.append(DayForecast(date=next_date.date(), predicted_new_cases=new_cases))

        new_row                        = country_history.iloc[[-1]].copy()
        new_row["date"]                = next_date
        new_row["daily_new"]           = float(new_cases)
        new_row["days_since_outbreak"] = row["days_since_outbreak"]
        country_history = pd.concat([country_history, new_row], ignore_index=True)

    return ForecastResponse(
        region=region,
        horizon_days=req.horizon,
        last_known_date=last_date.date(),
        last_known_cases=last_known_cases,
        forecast=preds,
    )