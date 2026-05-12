"""Subscription endpoints: signup, confirm, unsubscribe, healthz."""

from __future__ import annotations

import logging
import secrets
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import RedirectResponse
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from .. import email_sender
from ..config import LOCATION_NAME_EN, PUBLIC_API_URL, PUBLIC_WEB_URL
from ..db import get_session, is_configured
from ..models import Subscription
from ..schemas import SubscribeIn, SubscribeOut

log = logging.getLogger(__name__)

router = APIRouter(prefix="/subscriptions", tags=["subscriptions"])


def _new_token() -> str:
    return secrets.token_urlsafe(32)


async def _send_confirmation_safe(email: str, location_id: str, token: str) -> None:
    """Send confirmation email; log but swallow errors so a Resend hiccup
    does not roll back the DB row (user can retry by re-POSTing)."""
    if not email_sender.is_configured():
        log.warning("Skipping confirmation email: RESEND_API_KEY not set")
        return
    confirm_url = f"{PUBLIC_API_URL}/subscriptions/confirm/{token}"
    beach_name = LOCATION_NAME_EN.get(location_id, location_id)
    try:
        await email_sender.send_confirmation(
            to=email, beach_name=beach_name, confirm_url=confirm_url
        )
    except email_sender.EmailError as exc:
        log.warning("Confirmation email failed for %s: %s", email, exc)


@router.get("/healthz")
async def healthz(session: AsyncSession = Depends(get_session)) -> dict:
    if not is_configured():
        raise HTTPException(status_code=503, detail="DATABASE_URL not set")
    result = await session.execute(select(func.count()).select_from(Subscription))
    return {"db": "ok", "subscriptions_count": result.scalar_one()}


@router.post("", response_model=SubscribeOut, status_code=202)
async def subscribe(
    payload: SubscribeIn,
    session: AsyncSession = Depends(get_session),
) -> SubscribeOut:
    email = payload.email.lower()
    existing = await session.scalar(
        select(Subscription).where(
            Subscription.email == email,
            Subscription.location_id == payload.location_id,
        )
    )

    if existing is None:
        token = _new_token()
        sub = Subscription(
            email=email,
            location_id=payload.location_id,
            hour_local=payload.hour_local,
            timezone=payload.timezone,
            confirm_token=token,
            unsubscribe_token=_new_token(),
            active=True,
        )
        session.add(sub)
        await session.commit()
        await _send_confirmation_safe(email, payload.location_id, token)
        return SubscribeOut(
            status="pending_confirmation",
            message="Check your inbox for a confirmation link.",
        )

    existing.hour_local = payload.hour_local
    existing.timezone = payload.timezone

    if existing.confirmed_at is not None:
        # Email previously verified. Silently reactivate (covers re-subscribe
        # after unsubscribe) and report already_active so the form shows a
        # confirmation-not-needed success state.
        was_inactive = not existing.active
        existing.active = True
        await session.commit()
        return SubscribeOut(
            status="already_active",
            message=(
                "Subscription reactivated."
                if was_inactive
                else "This email is already subscribed for this beach."
            ),
        )

    # Existing but unconfirmed: re-issue confirmation token + email.
    existing.active = True
    new_token = _new_token()
    existing.confirm_token = new_token
    await session.commit()
    await _send_confirmation_safe(email, existing.location_id, new_token)
    return SubscribeOut(
        status="pending_confirmation",
        message="Check your inbox for a confirmation link.",
    )


@router.get("/confirm/{token}")
async def confirm(
    token: str,
    session: AsyncSession = Depends(get_session),
) -> RedirectResponse:
    sub = await session.scalar(
        select(Subscription).where(Subscription.confirm_token == token)
    )
    if sub is None:
        return RedirectResponse(
            url=f"{PUBLIC_WEB_URL}/subscribe?error=invalid_token", status_code=303
        )
    sub.confirmed_at = datetime.now(timezone.utc)
    sub.confirm_token = None
    await session.commit()
    return RedirectResponse(url=f"{PUBLIC_WEB_URL}/subscribe?confirmed=1", status_code=303)


@router.get("/unsubscribe/{token}")
async def unsubscribe(
    token: str,
    session: AsyncSession = Depends(get_session),
) -> RedirectResponse:
    sub = await session.scalar(
        select(Subscription).where(Subscription.unsubscribe_token == token)
    )
    if sub is None:
        return RedirectResponse(
            url=f"{PUBLIC_WEB_URL}/subscribe?error=invalid_token", status_code=303
        )
    sub.active = False
    await session.commit()
    return RedirectResponse(url=f"{PUBLIC_WEB_URL}/subscribe?unsubscribed=1", status_code=303)
