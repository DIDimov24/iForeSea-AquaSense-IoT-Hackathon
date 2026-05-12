"""End-to-end verification of /internal/tick dispatch.

Plants a confirmed test subscription, hits /internal/tick with force_send,
asserts an email was sent + sent_log row written, then asserts re-tick is a no-op.

Run while uvicorn is up on :8765 and api/.env loaded:
    .venv/Scripts/python scripts/verify_dispatch.py <recipient>
"""

from __future__ import annotations

import asyncio
import json
import os
import sys
import urllib.error
import urllib.request
import uuid
from pathlib import Path

import asyncpg
from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parents[1] / ".env")

BASE = "http://127.0.0.1:8765"
TEST_LOC = "sarafovo"

results: list[tuple[str, bool, str]] = []


def record(name: str, ok: bool, detail: str = "") -> None:
    results.append((name, ok, detail))
    marker = "PASS" if ok else "FAIL"
    print(f"[{marker}] {name}" + (f" -- {detail}" if detail else ""))


def http(
    method: str,
    path: str,
    body: dict | None = None,
    headers: dict[str, str] | None = None,
) -> tuple[int, str]:
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(BASE + path, data=data, method=method)
    if body is not None:
        req.add_header("Content-Type", "application/json")
    for k, v in (headers or {}).items():
        req.add_header(k, v)
    try:
        with urllib.request.urlopen(req) as r:  # noqa: S310
            return r.status, r.read().decode()
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode()


def _db_url() -> str:
    return os.environ["DATABASE_URL"].replace("postgresql+asyncpg://", "postgresql://")


async def db_conn() -> asyncpg.Connection:
    return await asyncpg.connect(_db_url(), statement_cache_size=0)


async def cleanup(email: str) -> None:
    conn = await db_conn()
    try:
        await conn.execute(
            "DELETE FROM sent_log WHERE subscription_id IN ("
            "  SELECT id FROM subscriptions WHERE email = $1)",
            email,
        )
        await conn.execute("DELETE FROM subscriptions WHERE email = $1", email)
    finally:
        await conn.close()


async def plant_confirmed_sub(email: str) -> uuid.UUID:
    conn = await db_conn()
    try:
        row = await conn.fetchrow(
            """
            INSERT INTO subscriptions
              (email, location_id, hour_local, timezone,
               unsubscribe_token, confirmed_at, active)
            VALUES ($1, $2, 8, 'Europe/Sofia', $3, now(), true)
            RETURNING id
            """,
            email,
            TEST_LOC,
            f"verify-unsub-{uuid.uuid4()}",
        )
        return row["id"]
    finally:
        await conn.close()


async def sent_log_count(sub_id: uuid.UUID) -> int:
    conn = await db_conn()
    try:
        return await conn.fetchval(
            "SELECT count(*) FROM sent_log WHERE subscription_id = $1", sub_id
        )
    finally:
        await conn.close()


async def main() -> int:
    if len(sys.argv) < 2:
        print("Usage: verify_dispatch.py <recipient>")
        return 2
    recipient = sys.argv[1].lower()
    tick = os.environ["TICK_SECRET"]

    print(f"Cleaning prior rows for {recipient}...")
    await cleanup(recipient)
    sub_id = await plant_confirmed_sub(recipient)
    record("Planted confirmed subscription", True, f"id={sub_id}")

    # 1. Missing secret -> 401
    status, body = http("POST", "/internal/tick")
    record("POST /internal/tick without header -> 401", status == 401, f"status={status}")

    # 2. Force send for our recipient
    status, body = http(
        "POST",
        f"/internal/tick?force_send=true&only_email={recipient}",
        headers={"X-Tick-Secret": tick},
    )
    payload = json.loads(body) if status < 500 else {}
    record(
        f"Force-tick sends 1 email to {recipient}",
        status == 200
        and payload.get("candidates") == 1
        and payload.get("due") == 1
        and payload.get("sent") == 1
        and payload.get("failed_send") == 0
        and payload.get("failed_predict") == 0,
        f"status={status} summary={payload}",
    )

    # 3. sent_log row written
    count = await sent_log_count(sub_id)
    record("sent_log row inserted", count == 1, f"count={count}")

    # 4. Re-tick same hour -> skipped (idempotent)
    status, body = http(
        "POST",
        f"/internal/tick?force_send=true&only_email={recipient}",
        headers={"X-Tick-Secret": tick},
    )
    payload = json.loads(body)
    record(
        "Re-tick same day -> skipped_already_sent=1, sent=0",
        status == 200
        and payload.get("due") == 1
        and payload.get("skipped_already_sent") == 1
        and payload.get("sent") == 0,
        f"summary={payload}",
    )

    # 5. Hour mismatch + no force -> not due
    status, body = http(
        "POST",
        f"/internal/tick?only_email={recipient}",
        headers={"X-Tick-Secret": tick},
    )
    payload = json.loads(body)
    record(
        "Plain tick (no force) for hour-mismatched sub -> due=0 OR skipped (depending on real hour)",
        status == 200 and (payload.get("due") == 0 or payload.get("skipped_already_sent") >= 1),
        f"summary={payload}",
    )

    # 6. Unknown timezone is caught
    conn = await db_conn()
    try:
        await conn.execute(
            "UPDATE subscriptions SET timezone='Not/A_Real_Zone' WHERE email=$1",
            recipient,
        )
    finally:
        await conn.close()
    status, body = http(
        "POST",
        f"/internal/tick?force_send=true&only_email={recipient}",
        headers={"X-Tick-Secret": tick},
    )
    payload = json.loads(body)
    record(
        "Bad timezone counted in skipped_bad_timezone",
        status == 200 and payload.get("skipped_bad_timezone") == 1,
        f"summary={payload}",
    )

    print("\nCleaning up...")
    await cleanup(recipient)

    total = len(results)
    passed = sum(1 for _, ok, _ in results if ok)
    print(f"\n{passed}/{total} checks passed")
    return 0 if passed == total else 1


if __name__ == "__main__":
    sys.exit(asyncio.run(main()))
