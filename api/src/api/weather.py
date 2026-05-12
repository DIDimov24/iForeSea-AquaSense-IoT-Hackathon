"""Open-Meteo current-weather client for Burgas Bay.

Mirrors the existing `web/src/lib/weather.ts` shape so the daily email matches
what users see on the website. Returns plain dict; dispatcher fetches once per
tick and feeds the same value to every email.
"""

from __future__ import annotations

import logging
import os
from dataclasses import dataclass
from typing import Final

import httpx

log = logging.getLogger(__name__)

_BASE_URL: Final[str] = os.getenv(
    "WEATHER_API_URL", "https://api.open-meteo.com/v1/forecast"
)
_LAT: Final[str] = os.getenv("WEATHER_LAT", "42.5048")
_LON: Final[str] = os.getenv("WEATHER_LON", "27.4626")


@dataclass(frozen=True)
class CurrentWeather:
    temperature_c: int
    weather_code: int
    label: str
    emoji: str
    precipitation_probability: int
    as_of_date: str


def _code_to_label_emoji(code: int) -> tuple[str, str]:
    if code == 0:
        return "Clear", "☀"
    if code == 1:
        return "Mainly clear", "🌤"
    if 2 <= code <= 3:
        return "Partly cloudy", "⛅"
    if code in (45, 48):
        return "Fog", "🌫"
    if 51 <= code <= 57:
        return "Drizzle", "🌦"
    if 61 <= code <= 67:
        return "Rain", "🌧"
    if 71 <= code <= 77:
        return "Snow", "🌨"
    if 80 <= code <= 82:
        return "Showers", "🌧"
    if 95 <= code <= 99:
        return "Thunderstorm", "⛈"
    return "Cloudy", "☁"


async def fetch_current_weather() -> CurrentWeather | None:
    """Fetch Burgas current weather. Returns None on any failure.

    The email is still useful without weather, so callers should treat the
    weather block as optional.
    """
    params = {
        "latitude": _LAT,
        "longitude": _LON,
        "current": "temperature_2m,weather_code",
        "daily": "precipitation_probability_max",
        "forecast_days": "1",
        "timezone": "auto",
    }
    try:
        async with httpx.AsyncClient(timeout=8) as client:
            r = await client.get(_BASE_URL, params=params)
        r.raise_for_status()
        data = r.json()
    except (httpx.HTTPError, ValueError) as exc:
        log.warning("Weather fetch failed: %s", exc)
        return None

    current = data.get("current") or {}
    daily = data.get("daily") or {}
    temp = current.get("temperature_2m")
    if not isinstance(temp, (int, float)):
        log.warning("Weather response missing temperature_2m: %s", data)
        return None
    code = int(current.get("weather_code") or 0)
    label, emoji = _code_to_label_emoji(code)
    probs = daily.get("precipitation_probability_max") or []
    prob = int(probs[0]) if probs and isinstance(probs[0], (int, float)) else 0
    as_of = str(current.get("time") or "")[:10]
    return CurrentWeather(
        temperature_c=round(temp),
        weather_code=code,
        label=label,
        emoji=emoji,
        precipitation_probability=prob,
        as_of_date=as_of,
    )
