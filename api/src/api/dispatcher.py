"""Daily-email dispatch logic.

Pure orchestration: looks up due subscriptions for the current UTC time,
runs the forecast, sends the email, records the send in `sent_log` for
idempotency. Called from `POST /internal/tick`.
"""

from __future__ import annotations

import logging
from dataclasses import asdict, dataclass
from datetime import datetime
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from . import email_sender, weather as weather_mod
from .config import LOCATION_NAME_EN, PUBLIC_API_URL, PUBLIC_WEB_URL
from .models import SentLog, Subscription
from .predictor import predict_for_location
from .state import AppState

log = logging.getLogger(__name__)


@dataclass
class DispatchSummary:
    candidates: int = 0
    due: int = 0
    sent: int = 0
    skipped_already_sent: int = 0
    skipped_bad_timezone: int = 0
    failed_predict: int = 0
    failed_send: int = 0
    errors: list[str] | None = None

    def to_dict(self) -> dict:
        d = asdict(self)
        d["errors"] = self.errors or []
        return d


async def send_due_emails(
    state: AppState,
    session: AsyncSession,
    now_utc: datetime,
    *,
    force_send: bool = False,
    only_email: str | None = None,
) -> DispatchSummary:
    """Send daily forecast emails to subscribers whose local hour matches `now_utc`.

    Parameters
    ----------
    force_send : bypass the hour-of-day match (still respects per-day idempotency)
    only_email : limit dispatch to a single recipient (admin smoke test)
    """
    summary = DispatchSummary(errors=[])

    q = select(Subscription).where(
        Subscription.active.is_(True),
        Subscription.confirmed_at.is_not(None),
    )
    if only_email is not None:
        q = q.where(Subscription.email == only_email.lower())

    rows = await session.scalars(q)
    subs = list(rows.all())
    summary.candidates = len(subs)

    # Fetch weather once per tick; same payload for every email this run.
    current_weather = await weather_mod.fetch_current_weather() if subs else None

    for sub in subs:
        try:
            tz = ZoneInfo(sub.timezone)
        except ZoneInfoNotFoundError:
            summary.skipped_bad_timezone += 1
            summary.errors.append(f"{sub.email}: bad timezone {sub.timezone!r}")
            continue

        local_now = now_utc.astimezone(tz)

        if not force_send and local_now.hour != sub.hour_local:
            continue

        summary.due += 1

        already = await session.scalar(
            select(SentLog).where(
                SentLog.subscription_id == sub.id,
                SentLog.send_date == local_now.date(),
            )
        )
        if already is not None:
            summary.skipped_already_sent += 1
            continue

        pred = predict_for_location(state, sub.location_id)
        if pred is None:
            summary.failed_predict += 1
            summary.errors.append(f"{sub.email}: predictor returned None for {sub.location_id}")
            continue

        beach_name = LOCATION_NAME_EN.get(sub.location_id, sub.location_id)
        unsub_url = f"{PUBLIC_API_URL}/subscriptions/unsubscribe/{sub.unsubscribe_token}"

        try:
            await email_sender.send_daily(
                to=sub.email,
                beach_name=beach_name,
                location_id=sub.location_id,
                risk_class=pred.risk_class,
                chlorophyll_ug_l=pred.predicted_chlorophyll_ug_l,
                forecast_start=pred.forecast_window.start.isoformat(),
                forecast_end=pred.forecast_window.end.isoformat(),
                as_of_date=pred.as_of_date.isoformat(),
                web_url=PUBLIC_WEB_URL,
                unsubscribe_url=unsub_url,
                weather=current_weather,
            )
        except email_sender.EmailError as exc:
            log.warning("send_daily failed for %s: %s", sub.email, exc)
            summary.failed_send += 1
            summary.errors.append(f"{sub.email}: send failed: {exc}")
            continue

        # Record send for idempotency. Commit per-row so a later failure
        # does not roll back earlier successful sends.
        session.add(SentLog(subscription_id=sub.id, send_date=local_now.date()))
        try:
            await session.commit()
        except IntegrityError:
            # Concurrent tick wrote the same row. Email already went out; that's
            # the violation of idempotency we want to flag but not propagate.
            await session.rollback()
            log.warning("Duplicate sent_log row for %s on %s", sub.email, local_now.date())

        summary.sent += 1

    return summary
