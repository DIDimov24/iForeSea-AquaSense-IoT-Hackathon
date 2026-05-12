"""End-to-end verification of subscription endpoints.

Cleans up test rows, exercises POST/confirm/unsubscribe flows, validates DB
state at each step, prints PASS/FAIL.

Run while uvicorn is up on :8765:
    .venv/Scripts/python scripts/verify_subscriptions.py
"""

from __future__ import annotations

import asyncio
import json
import os
import sys
import urllib.parse
import urllib.request
from pathlib import Path

import asyncpg
from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parents[1] / ".env")

BASE = "http://127.0.0.1:8765"
TEST_EMAIL = "verify_chunk2@example.com"
TEST_LOC = "sarafovo"

results: list[tuple[str, bool, str]] = []


def record(name: str, ok: bool, detail: str = "") -> None:
    results.append((name, ok, detail))
    marker = "PASS" if ok else "FAIL"
    print(f"[{marker}] {name}" + (f" — {detail}" if detail else ""))


def http(method: str, path: str, body: dict | None = None) -> tuple[int, str, dict]:
    url = BASE + path
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(url, data=data, method=method)
    if body is not None:
        req.add_header("Content-Type", "application/json")
    try:
        with urllib.request.urlopen(req) as r:  # noqa: S310
            return r.status, r.read().decode(), dict(r.headers)
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode(), dict(e.headers)


def http_no_redirect(method: str, path: str) -> tuple[int, str]:
    # urllib auto-follows 303; use a custom opener that doesn't.
    class NoRedirect(urllib.request.HTTPRedirectHandler):
        def redirect_request(self, *a, **kw):
            return None

    opener = urllib.request.build_opener(NoRedirect())
    req = urllib.request.Request(BASE + path, method=method)
    try:
        with opener.open(req) as r:
            return r.status, r.headers.get("Location", "")
    except urllib.error.HTTPError as e:
        return e.code, e.headers.get("Location", "")


def _db_url() -> str:
    url = os.environ["DATABASE_URL"]
    # asyncpg wants the bare postgres URL, no +asyncpg suffix
    return url.replace("postgresql+asyncpg://", "postgresql://")


async def db_conn() -> asyncpg.Connection:
    return await asyncpg.connect(_db_url(), statement_cache_size=0)


async def cleanup() -> None:
    conn = await db_conn()
    try:
        await conn.execute(
            "DELETE FROM subscriptions WHERE email = $1", TEST_EMAIL
        )
    finally:
        await conn.close()


async def fetch_sub() -> asyncpg.Record | None:
    conn = await db_conn()
    try:
        return await conn.fetchrow(
            "SELECT * FROM subscriptions WHERE email = $1 AND location_id = $2",
            TEST_EMAIL,
            TEST_LOC,
        )
    finally:
        await conn.close()


async def main() -> int:
    print(f"Cleaning up any prior {TEST_EMAIL} rows...")
    await cleanup()

    # 1. POST new subscription
    status, body, _ = http(
        "POST",
        "/subscriptions",
        {"email": TEST_EMAIL, "location_id": TEST_LOC, "hour_local": 9},
    )
    payload = json.loads(body) if status < 500 else {}
    record(
        "POST new subscription returns 202 pending_confirmation",
        status == 202 and payload.get("status") == "pending_confirmation",
        f"status={status} body={body[:120]}",
    )

    # 2. DB row created correctly
    row = await fetch_sub()
    record(
        "DB row exists with confirm_token set and confirmed_at NULL",
        row is not None
        and row["confirm_token"] is not None
        and row["confirmed_at"] is None
        and row["active"] is True
        and row["hour_local"] == 9,
        f"row={dict(row) if row else None}",
    )
    first_token = row["confirm_token"] if row else None

    # 3. POST same (unconfirmed) -> still pending, token reissued
    status, body, _ = http(
        "POST",
        "/subscriptions",
        {"email": TEST_EMAIL, "location_id": TEST_LOC, "hour_local": 10},
    )
    payload = json.loads(body)
    row2 = await fetch_sub()
    record(
        "Re-POST while unconfirmed reissues token + updates hour",
        status == 202
        and payload["status"] == "pending_confirmation"
        and row2["confirm_token"] != first_token
        and row2["hour_local"] == 10,
        f"status={status} hour={row2['hour_local']}",
    )
    fresh_token = row2["confirm_token"]

    # 4. Invalid email rejected
    status, body, _ = http(
        "POST",
        "/subscriptions",
        {"email": "not-an-email", "location_id": TEST_LOC},
    )
    record("Invalid email -> 422", status == 422, f"status={status}")

    # 5. Invalid location rejected
    status, body, _ = http(
        "POST",
        "/subscriptions",
        {"email": TEST_EMAIL, "location_id": "atlantis"},
    )
    record("Invalid location -> 422", status == 422, f"status={status}")

    # 6. Invalid hour rejected
    status, body, _ = http(
        "POST",
        "/subscriptions",
        {"email": TEST_EMAIL, "location_id": TEST_LOC, "hour_local": 24},
    )
    record("Invalid hour -> 422", status == 422, f"status={status}")

    # 7. Confirm endpoint
    status, location = http_no_redirect("GET", f"/subscriptions/confirm/{fresh_token}")
    row3 = await fetch_sub()
    record(
        "GET /confirm/{token} -> 303 redirect to /subscribe?confirmed=1",
        status == 303 and "confirmed=1" in location,
        f"status={status} location={location}",
    )
    record(
        "After confirm: confirmed_at set, confirm_token cleared",
        row3["confirmed_at"] is not None and row3["confirm_token"] is None,
        f"confirmed_at={row3['confirmed_at']}",
    )

    # 8. POST same now -> already_active (subscribed)
    status, body, _ = http(
        "POST",
        "/subscriptions",
        {"email": TEST_EMAIL, "location_id": TEST_LOC, "hour_local": 11},
    )
    payload = json.loads(body)
    record(
        "Re-POST after confirm -> already_active",
        status == 202 and payload["status"] == "already_active",
        f"msg={payload.get('message')}",
    )

    # 9. Unsubscribe endpoint
    unsub_token = row3["unsubscribe_token"]
    status, location = http_no_redirect(
        "GET", f"/subscriptions/unsubscribe/{unsub_token}"
    )
    row4 = await fetch_sub()
    record(
        "GET /unsubscribe/{token} -> 303 redirect to /subscribe?unsubscribed=1",
        status == 303 and "unsubscribed=1" in location,
        f"status={status} location={location}",
    )
    record(
        "After unsubscribe: active=false (row preserved)",
        row4["active"] is False,
        f"active={row4['active']}",
    )

    # 10. POST same -> reactivate (already confirmed, no re-verification)
    status, body, _ = http(
        "POST",
        "/subscriptions",
        {"email": TEST_EMAIL, "location_id": TEST_LOC, "hour_local": 12},
    )
    payload = json.loads(body)
    row5 = await fetch_sub()
    record(
        "Re-POST after unsubscribe -> already_active (reactivated), active=true, hour updated",
        status == 202
        and payload["status"] == "already_active"
        and row5["active"] is True
        and row5["hour_local"] == 12,
        f"msg={payload.get('message')} active={row5['active']} hour={row5['hour_local']}",
    )

    # 11. Invalid confirm token -> 303 redirect to error
    status, location = http_no_redirect(
        "GET", "/subscriptions/confirm/this-token-does-not-exist"
    )
    record(
        "Bad confirm token -> 303 redirect with error param",
        status == 303 and "error=invalid_token" in location,
        f"status={status} location={location}",
    )

    # 12. healthz still works
    status, body, _ = http("GET", "/subscriptions/healthz")
    record(
        "GET /subscriptions/healthz still returns db=ok",
        status == 200 and json.loads(body)["db"] == "ok",
        f"body={body}",
    )

    print("\nCleaning up test row...")
    await cleanup()

    total = len(results)
    passed = sum(1 for _, ok, _ in results if ok)
    print(f"\n{passed}/{total} checks passed")
    return 0 if passed == total else 1


if __name__ == "__main__":
    sys.exit(asyncio.run(main()))
