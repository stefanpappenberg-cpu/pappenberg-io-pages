#!/usr/bin/env python3
"""Lokaler Entwicklungsserver für Website, JSON-API und internen Bereich."""

from __future__ import annotations

import base64
import json
import os
import re
import secrets
from datetime import datetime
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, urlparse

ROOT = Path(__file__).resolve().parent.parent
STORE = ROOT / "storage" / "bookings.json"
USER = os.environ.get("STUDIO_ADMIN_USER", "studio-johanna")
PASSWORD = os.environ.get("STUDIO_ADMIN_PASSWORD", "")
PORT = int(os.environ.get("STUDIO_PORT", "8765"))
STATUSES = {"neu", "in_pruefung", "option", "bestaetigt", "abgelehnt", "storniert"}


def load_items() -> list[dict]:
    try:
        return json.loads(STORE.read_text(encoding="utf-8"))
    except (FileNotFoundError, json.JSONDecodeError):
        return []


def save_items(items: list[dict]) -> None:
    STORE.parent.mkdir(parents=True, exist_ok=True)
    temporary = STORE.with_suffix(".tmp")
    temporary.write_text(json.dumps(items, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    temporary.replace(STORE)


class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def send_json(self, status: int, payload: dict) -> None:
        data = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Cache-Control", "no-store")
        self.send_header("X-Content-Type-Options", "nosniff")
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def is_admin(self) -> bool:
        expected = "Basic " + base64.b64encode(f"{USER}:{PASSWORD}".encode()).decode()
        return bool(PASSWORD) and secrets.compare_digest(self.headers.get("Authorization", ""), expected)

    def require_admin(self) -> bool:
        if self.is_admin():
            return True
        self.send_response(401)
        self.send_header("WWW-Authenticate", 'Basic realm="Studio Johanna Verwaltung", charset="UTF-8"')
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.end_headers()
        self.wfile.write(b'{"success":false,"message":"Anmeldung erforderlich."}')
        return False

    def do_GET(self) -> None:
        parsed = urlparse(self.path)
        query = parse_qs(parsed.query)
        if parsed.path == "/intern" or parsed.path.startswith("/intern/"):
            if not self.require_admin():
                return
        if parsed.path == "/api/bookings.php":
            action = query.get("action", [""])[0]
            if action == "availability":
                ranges = [
                    {key: item.get(key, "") for key in ("date", "endDate", "start", "duration", "status")}
                    for item in load_items()
                    if item.get("status") in {"option", "bestaetigt"}
                ]
                return self.send_json(200, {"success": True, "ranges": ranges})
            if action == "list":
                if not self.require_admin():
                    return
                items = sorted(load_items(), key=lambda item: item.get("createdAt", ""), reverse=True)
                return self.send_json(200, {"success": True, "items": items})
            return self.send_json(404, {"success": False, "message": "Aktion nicht gefunden."})

        if parsed.path.startswith("/storage/"):
            return self.send_error(403)
        super().do_GET()

    def read_json(self) -> dict:
        length = int(self.headers.get("Content-Length", "0"))
        return json.loads(self.rfile.read(length) or b"{}")

    def do_POST(self) -> None:
        if urlparse(self.path).path != "/api/bookings.php":
            return self.send_json(404, {"success": False, "message": "Nicht gefunden."})
        try:
            payload = self.read_json()
        except json.JSONDecodeError:
            return self.send_json(400, {"success": False, "message": "Ungültige Anfrage."})
        if str(payload.get("company", "")).strip():
            return self.send_json(200, {"success": True, "reference": "SJ-OK"})
        email = str(payload.get("email", "")).strip()
        if not payload.get("name") or not re.fullmatch(r"[^@\s]+@[^@\s]+\.[^@\s]+", email) or not payload.get("privacyAccepted"):
            return self.send_json(422, {"success": False, "message": "Bitte prüfen Sie Name, E-Mail und Datenschutzbestätigung."})
        now = datetime.now().astimezone().isoformat(timespec="seconds")
        identifier = secrets.token_hex(16)
        reference = f"SJ-{datetime.now():%y%m%d}-{identifier[:6].upper()}"
        item = {
            "schemaVersion": 1, "id": identifier, "reference": reference, "status": "neu",
            "createdAt": now, "updatedAt": now, "internalNote": "",
            **{key: payload.get(key, "") for key in (
                "type", "typeLabel", "date", "endDate", "isMultiDay", "dayCount", "start", "duration",
                "guests", "seating", "addons", "lodging", "priceNet", "priceLabel", "name", "email",
                "phone", "notes", "privacyVersion"
            )}
        }
        items = load_items()
        items.append(item)
        save_items(items)
        self.send_json(201, {"success": True, "reference": reference})

    def do_PATCH(self) -> None:
        if urlparse(self.path).path != "/api/bookings.php":
            return self.send_json(404, {"success": False, "message": "Nicht gefunden."})
        if not self.require_admin():
            return
        try:
            payload = self.read_json()
        except json.JSONDecodeError:
            return self.send_json(400, {"success": False, "message": "Ungültige Anfrage."})
        if payload.get("status") not in STATUSES:
            return self.send_json(422, {"success": False, "message": "Ungültiger Status."})
        items = load_items()
        for item in items:
            if item.get("id") != payload.get("id"):
                continue
            item["status"] = payload["status"]
            item["internalNote"] = str(payload.get("internalNote", ""))[:2000]
            item["updatedAt"] = datetime.now().astimezone().isoformat(timespec="seconds")
            save_items(items)
            return self.send_json(200, {"success": True, "item": item})
        self.send_json(404, {"success": False, "message": "Terminkarte nicht gefunden."})


if __name__ == "__main__":
    if not PASSWORD:
        raise SystemExit("STUDIO_ADMIN_PASSWORD muss gesetzt sein.")
    server = ThreadingHTTPServer(("127.0.0.1", PORT), Handler)
    print(f"Studio Johanna lokal: http://127.0.0.1:{PORT}/")
    print(f"Interner Bereich:     http://127.0.0.1:{PORT}/intern/")
    server.serve_forever()
