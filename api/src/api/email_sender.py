"""Resend transactional-email client.

Uses the REST API directly via httpx so we stay fully async without pulling
in the resend SDK (which is sync).
"""

from __future__ import annotations

import logging
import os
from typing import Final

import httpx

log = logging.getLogger(__name__)

_RESEND_ENDPOINT: Final[str] = "https://api.resend.com/emails"


def api_key() -> str | None:
    return os.getenv("RESEND_API_KEY")


def from_address() -> str:
    return os.getenv("RESEND_FROM", "onboarding@resend.dev")


def is_configured() -> bool:
    return bool(api_key())


class EmailError(RuntimeError):
    pass


async def send_email(
    to: str,
    subject: str,
    html: str,
    *,
    text: str | None = None,
) -> str:
    key = api_key()
    if not key:
        raise EmailError("RESEND_API_KEY not set")

    payload: dict[str, object] = {
        "from": from_address(),
        "to": [to],
        "subject": subject,
        "html": html,
    }
    if text is not None:
        payload["text"] = text

    async with httpx.AsyncClient(timeout=15) as client:
        r = await client.post(
            _RESEND_ENDPOINT,
            headers={
                "Authorization": f"Bearer {key}",
                "Content-Type": "application/json",
            },
            json=payload,
        )
    if r.status_code >= 400:
        log.error("Resend error %s: %s", r.status_code, r.text)
        raise EmailError(f"Resend HTTP {r.status_code}: {r.text[:200]}")

    body = r.json()
    message_id = body.get("id", "")
    log.info("Resend accepted message id=%s to=%s", message_id, to)
    return message_id


async def send_test(to: str) -> str:
    """Send a smoke-test email to verify Resend credentials + sender."""
    subject = "iForeSea test email"
    html = (
        "<div style=\"font-family:system-ui,sans-serif;max-width:520px;padding:24px\">"
        "<h2 style=\"margin:0 0 12px 0\">iForeSea email pipeline OK</h2>"
        "<p style=\"color:#555;margin:0 0 8px 0\">"
        "If you received this, Resend credentials and sender are configured correctly."
        "</p>"
        "<p style=\"color:#888;font-size:12px;margin-top:24px\">Safe to delete.</p>"
        "</div>"
    )
    text = "iForeSea test email. Resend credentials work. Safe to delete."
    return await send_email(to, subject, html, text=text)


_RISK_COLOR = {"green": "#2e8540", "yellow": "#d4a017", "red": "#b91c1c"}
_RISK_EMOJI = {"green": "✓", "yellow": "!", "red": "✕"}
_RISK_LABEL = {
    "green": "Low risk",
    "yellow": "Moderate risk",
    "red": "High risk",
}
_RISK_HEADLINE = {
    "green": "Conditions look safe.",
    "yellow": "Conditions worth watching.",
    "red": "Bloom risk elevated.",
}


def _weather_block(weather: "object | None") -> str:
    if weather is None:
        return ""
    # Lazy import to avoid hard coupling at module load.
    from .weather import CurrentWeather

    if not isinstance(weather, CurrentWeather):
        return ""
    return f"""\
  <div style="margin-top:20px;padding:14px 16px;border:1px solid #e5e7eb;border-radius:12px;background:#fafafa">
    <div style="font-size:11px;letter-spacing:0.16em;text-transform:uppercase;color:#888;margin-bottom:6px">Burgas weather now</div>
    <div style="font-size:15px;color:#222">
      <span style="font-size:20px;vertical-align:-2px">{weather.emoji}</span>
      &nbsp;<strong>{weather.temperature_c}&deg;C</strong>
      &middot; {weather.label}
      &middot; rain {weather.precipitation_probability}%
    </div>
  </div>
"""


def render_daily_html(
    *,
    beach_name: str,
    location_id: str,
    risk_class: str,
    chlorophyll_ug_l: float,
    forecast_start: str,
    forecast_end: str,
    as_of_date: str,
    web_url: str,
    unsubscribe_url: str,
    weather: "object | None" = None,
) -> tuple[str, str]:
    """Return (subject, html) for the daily forecast email."""
    color = _RISK_COLOR.get(risk_class, "#555")
    emoji = _RISK_EMOJI.get(risk_class, "")
    label = _RISK_LABEL.get(risk_class, risk_class)
    headline = _RISK_HEADLINE.get(risk_class, "")
    subject = f"iForeSea - {beach_name} - {emoji} {label}"
    beach_url = f"{web_url}/beaches/{location_id}"
    weather_html = _weather_block(weather)
    html = f"""\
<!doctype html>
<html><body style="margin:0;padding:0;background:#f4f4f5">
<div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;max-width:560px;margin:0 auto;padding:28px 24px;color:#1f2937;background:#ffffff">
  <div style="font-size:11px;letter-spacing:0.2em;text-transform:uppercase;color:#9ca3af">iForeSea &middot; Daily forecast</div>
  <h2 style="margin:8px 0 2px 0;font-size:24px;letter-spacing:-0.01em">{beach_name}</h2>
  <div style="margin:2px 0 20px 0;color:#6b7280;font-size:13px">Window {forecast_start} &rarr; {forecast_end}</div>

  <div style="display:inline-block;padding:9px 16px;border-radius:999px;background:{color};color:#ffffff;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;font-size:12px">
    {emoji} {label}
  </div>
  <div style="margin-top:14px;font-size:16px;color:#111827">{headline}</div>

  <table style="margin-top:18px;border-collapse:collapse;font-size:14px;width:100%">
    <tr>
      <td style="padding:8px 12px 8px 0;color:#6b7280;width:160px">Predicted chl-a</td>
      <td style="padding:8px 0"><strong>{chlorophyll_ug_l:.1f} &micro;g/L</strong></td>
    </tr>
    <tr>
      <td style="padding:8px 12px 8px 0;color:#6b7280">Latest reading</td>
      <td style="padding:8px 0">{as_of_date}</td>
    </tr>
  </table>

{weather_html}
  <div style="margin-top:26px">
    <a href="{beach_url}" style="display:inline-block;padding:11px 20px;border-radius:10px;background:#0f172a;color:#ffffff;text-decoration:none;font-size:14px;font-weight:500">Open beach dashboard</a>
  </div>

  <hr style="border:none;border-top:1px solid #e5e7eb;margin:30px 0 12px 0"/>
  <p style="font-size:12px;color:#9ca3af;margin:0;line-height:1.5">
    You subscribed for daily HAB forecasts at iForeSea. Beach risk is a 3&ndash;5-day prediction; check the dashboard before going out.<br/>
    <a href="{unsubscribe_url}" style="color:#9ca3af;text-decoration:underline">Unsubscribe</a>
  </p>
</div>
</body></html>
"""
    return subject, html


async def send_daily(
    *,
    to: str,
    beach_name: str,
    location_id: str,
    risk_class: str,
    chlorophyll_ug_l: float,
    forecast_start: str,
    forecast_end: str,
    as_of_date: str,
    web_url: str,
    unsubscribe_url: str,
    weather: "object | None" = None,
) -> str:
    subject, html = render_daily_html(
        beach_name=beach_name,
        location_id=location_id,
        risk_class=risk_class,
        chlorophyll_ug_l=chlorophyll_ug_l,
        forecast_start=forecast_start,
        forecast_end=forecast_end,
        as_of_date=as_of_date,
        web_url=web_url,
        unsubscribe_url=unsubscribe_url,
        weather=weather,
    )
    from .weather import CurrentWeather

    weather_line = ""
    if isinstance(weather, CurrentWeather):
        weather_line = (
            f"Burgas: {weather.temperature_c}C, {weather.label}, "
            f"rain {weather.precipitation_probability}%\n"
        )
    text = (
        f"{beach_name} - {risk_class.upper()}\n"
        f"Predicted chl-a: {chlorophyll_ug_l:.1f} ug/L\n"
        f"Window: {forecast_start} to {forecast_end} (as of {as_of_date})\n"
        f"{weather_line}"
        f"Details: {web_url}/beaches/{location_id}\n"
        f"Unsubscribe: {unsubscribe_url}\n"
    )
    return await send_email(to, subject, html, text=text)
