"""Idempotent schema creation for tables that should exist alongside
the Supabase-UI-managed `subscriptions` table.

Run once after creating the Supabase project, or any time you suspect drift:
    .venv/Scripts/python scripts/init_db.py
"""

from __future__ import annotations

import asyncio
import os
from pathlib import Path

import asyncpg
from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parents[1] / ".env")


SCHEMA_SQL = """
CREATE TABLE IF NOT EXISTS sent_log (
    subscription_id uuid NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
    send_date date NOT NULL,
    sent_at timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (subscription_id, send_date)
);

CREATE INDEX IF NOT EXISTS idx_subs_active_hour
    ON subscriptions (active, hour_local);

-- Supabase Table Editor auto-creates per-column UNIQUE constraints when the
-- "Is Unique" box is left checked. We want UNIQUE only on the tokens and on
-- the composite (email, location_id). Drop the rogue ones if they exist.
ALTER TABLE subscriptions DROP CONSTRAINT IF EXISTS subscriptions_email_key;
ALTER TABLE subscriptions DROP CONSTRAINT IF EXISTS subscriptions_location_id_key;

-- Idempotent composite unique. Wrap in DO block because there's no
-- "ADD CONSTRAINT IF NOT EXISTS" in vanilla Postgres.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'uq_subscriptions_email_location'
  ) THEN
    ALTER TABLE subscriptions
      ADD CONSTRAINT uq_subscriptions_email_location
      UNIQUE (email, location_id);
  END IF;
END$$;
"""


async def main() -> None:
    url = os.environ["DATABASE_URL"].replace("postgresql+asyncpg://", "postgresql://")
    conn = await asyncpg.connect(url, statement_cache_size=0)
    try:
        await conn.execute(SCHEMA_SQL)
        # Sanity check.
        for table in ("subscriptions", "sent_log"):
            exists = await conn.fetchval(
                "SELECT to_regclass($1) IS NOT NULL", table
            )
            print(f"  {table}: {'OK' if exists else 'MISSING'}")
        print("Schema OK.")
    finally:
        await conn.close()


if __name__ == "__main__":
    asyncio.run(main())
