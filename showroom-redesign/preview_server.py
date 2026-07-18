#!/usr/bin/env python3
"""Static preview server with a local maintenance override."""

from __future__ import annotations

import argparse
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlparse


APP_DIR = Path(__file__).resolve().parent


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("--root", required=True)
    parser.add_argument("--port", required=True, type=int)
    parser.add_argument("--project", required=True)
    parser.add_argument("--state-dir", required=True)
    return parser.parse_args()


def handler_factory(root: Path, marker: Path):
    class PreviewHandler(SimpleHTTPRequestHandler):
        def __init__(self, *args, **kwargs):
            super().__init__(*args, directory=str(root), **kwargs)

        def do_GET(self) -> None:
            path = urlparse(self.path).path
            if marker.exists() and path not in {"/__showroom_health"}:
                body = (APP_DIR / "maintenance.html").read_bytes()
                self.send_response(503)
                self.send_header("Content-Type", "text/html; charset=utf-8")
                self.send_header("Content-Length", str(len(body)))
                self.send_header("Cache-Control", "no-store")
                self.end_headers()
                self.wfile.write(body)
                return
            if path == "/__showroom_health":
                body = b'{"ok":true}'
                self.send_response(200)
                self.send_header("Content-Type", "application/json")
                self.send_header("Content-Length", str(len(body)))
                self.end_headers()
                self.wfile.write(body)
                return
            super().do_GET()

        def log_message(self, format_string: str, *args: object) -> None:
            print(f"[preview] {format_string % args}")

    return PreviewHandler


def main() -> None:
    args = parse_args()
    root = Path(args.root).resolve()
    marker = Path(args.state_dir) / f"{args.project}.maintenance"
    server = ThreadingHTTPServer(
        ("127.0.0.1", args.port), handler_factory(root, marker)
    )
    server.serve_forever()


if __name__ == "__main__":
    main()
