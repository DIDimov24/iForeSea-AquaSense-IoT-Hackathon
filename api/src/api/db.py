"""Async SQLAlchemy engine + session for Supabase Postgres."""

from __future__ import annotations

import os
from collections.abc import AsyncIterator

from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    pass


def _normalize_url(url: str) -> str:
    # SQLAlchemy needs an explicit async driver. Supabase copy-paste gives
    # the bare scheme; coerce it.
    if url.startswith("postgresql://"):
        return "postgresql+asyncpg://" + url[len("postgresql://") :]
    if url.startswith("postgres://"):
        return "postgresql+asyncpg://" + url[len("postgres://") :]
    return url


def _build_engine():
    url = os.getenv("DATABASE_URL")
    if not url:
        return None
    # statement_cache_size=0 keeps asyncpg compatible with Supabase's
    # transaction-mode pgbouncer pooler. Harmless on session pooler.
    return create_async_engine(
        _normalize_url(url),
        pool_pre_ping=True,
        connect_args={"statement_cache_size": 0},
    )


engine = _build_engine()
SessionLocal = (
    async_sessionmaker(engine, expire_on_commit=False, class_=AsyncSession)
    if engine is not None
    else None
)


async def get_session() -> AsyncIterator[AsyncSession]:
    if SessionLocal is None:
        raise RuntimeError("DATABASE_URL is not configured")
    async with SessionLocal() as session:
        yield session


def is_configured() -> bool:
    return engine is not None
