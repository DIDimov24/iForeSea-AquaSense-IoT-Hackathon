"""Internal endpoints gated by X-Tick-Secret. Cron and admin use only."""

from __future__ import annotations

import hmac
import os
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, Header, HTTPException, Request
from pydantic import BaseModel, EmailStr
from sqlalchemy.ext.asyncio import AsyncSession

from .. import dispatcher, email_sender
from ..db import get_session
from ..state import AppState

router = APIRouter(prefix="/internal", tags=["internal"])


def _check_secret(provided: str | None) -> None:
    expected = os.getenv("TICK_SECRET")
    if not expected:
        raise HTTPException(status_code=503, detail="TICK_SECRET not configured")
    if provided is None or not hmac.compare_digest(provided, expected):
        raise HTTPException(status_code=401, detail="Bad or missing X-Tick-Secret")


class TestEmailIn(BaseModel):
    to: EmailStr


@router.post("/test-email")
async def test_email(
    payload: TestEmailIn,
    x_tick_secret: str | None = Header(default=None, alias="X-Tick-Secret"),
) -> dict:
    _check_secret(x_tick_secret)
    if not email_sender.is_configured():
        raise HTTPException(status_code=503, detail="RESEND_API_KEY not set")
    try:
        message_id = await email_sender.send_test(payload.to)
    except email_sender.EmailError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc
    return {"sent": True, "to": payload.to, "id": message_id}


@router.post("/tick")
async def tick(
    request: Request,
    force_send: bool = False,
    only_email: str | None = None,
    x_tick_secret: str | None = Header(default=None, alias="X-Tick-Secret"),
    session: AsyncSession = Depends(get_session),
) -> dict:
    _check_secret(x_tick_secret)
    state: AppState = request.app.state.bloom
    summary = await dispatcher.send_due_emails(
        state,
        session,
        datetime.now(timezone.utc),
        force_send=force_send,
        only_email=only_email,
    )
    return summary.to_dict()
