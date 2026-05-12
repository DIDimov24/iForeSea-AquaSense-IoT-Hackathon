"""Verify /internal/test-email gates and (if RESEND_API_KEY is set) live send.

Run while uvicorn is up on :8765 and api/.env loaded:
    .venv/Scripts/python scripts/verify_email.py [recipient@example.com]
"""

from __future__ import annotations

import json
import os
import sys
import urllib.error
import urllib.request
from pathlib import Path

from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parents[1] / ".env")

BASE = "http://127.0.0.1:8765"

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


def main() -> int:
    recipient = sys.argv[1] if len(sys.argv) > 1 else "verify@example.com"
    tick = os.getenv("TICK_SECRET", "")
    key = os.getenv("RESEND_API_KEY", "")

    # 1. No secret header -> 401
    status, body = http("POST", "/internal/test-email", {"to": recipient})
    record(
        "POST /internal/test-email without header -> 401",
        status == 401,
        f"status={status} body={body[:120]}",
    )

    # 2. Wrong secret -> 401
    status, body = http(
        "POST",
        "/internal/test-email",
        {"to": recipient},
        headers={"X-Tick-Secret": "definitely-wrong"},
    )
    record(
        "POST with wrong secret -> 401",
        status == 401,
        f"status={status}",
    )

    if not tick:
        record(
            "TICK_SECRET configured",
            False,
            "set TICK_SECRET in api/.env to test the success path",
        )
        return _summary()
    record("TICK_SECRET configured", True, "")

    # 3. Invalid email payload -> 422 (still requires valid secret to reach validation)
    status, body = http(
        "POST",
        "/internal/test-email",
        {"to": "not-an-email"},
        headers={"X-Tick-Secret": tick},
    )
    record("Bad email payload -> 422", status == 422, f"status={status}")

    if not key:
        # With correct secret but missing RESEND_API_KEY, expect 503.
        status, body = http(
            "POST",
            "/internal/test-email",
            {"to": recipient},
            headers={"X-Tick-Secret": tick},
        )
        record(
            "Correct secret + missing RESEND_API_KEY -> 503",
            status == 503,
            f"status={status} body={body[:160]}",
        )
        record(
            "RESEND_API_KEY configured",
            False,
            "set RESEND_API_KEY to send a live test email",
        )
        return _summary()
    record("RESEND_API_KEY configured", True, "")

    if len(sys.argv) < 2:
        print(
            "\nLive send skipped. Re-run with a recipient address:\n"
            "  .venv/Scripts/python scripts/verify_email.py you@example.com\n"
            "Sandbox sender 'onboarding@resend.dev' only delivers to your Resend "
            "account email.\n"
        )
        return _summary()

    # 4. Live send
    status, body = http(
        "POST",
        "/internal/test-email",
        {"to": recipient},
        headers={"X-Tick-Secret": tick},
    )
    parsed = json.loads(body) if status < 500 else {}
    record(
        f"Live send to {recipient} -> 200 sent",
        status == 200 and parsed.get("sent") is True and bool(parsed.get("id")),
        f"status={status} body={body[:200]}",
    )

    return _summary()


def _summary() -> int:
    total = len(results)
    passed = sum(1 for _, ok, _ in results if ok)
    print(f"\n{passed}/{total} checks passed")
    return 0 if passed == total else 1


if __name__ == "__main__":
    sys.exit(main())
