#!/usr/bin/env python3
"""Showroom – lokale Projektzentrale für Vorschau und kontrolliertes Publishing."""

from __future__ import annotations

import hashlib
import json
import os
import re
import shutil
import signal
import socket
import subprocess
import sys
import threading
import time
import webbrowser
from dataclasses import dataclass
from http import HTTPStatus
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from typing import Any, Iterable
from urllib.parse import unquote, urlparse


APP_DIR = Path(__file__).resolve().parent
STATIC_DIR = APP_DIR / "web"
STATE_DIR = APP_DIR / ".runtime"
CONFIG_FILE = APP_DIR / "projects.json"
HOST = "127.0.0.1"
APP_PORT = int(os.environ.get("SHOWROOM_PORT", "4310"))
CODEX_BIN = Path("/Applications/ChatGPT.app/Contents/Resources/codex")
PUBLISH_EXCLUDES = {
    ".git", ".DS_Store", ".vscode", "node_modules", "__pycache__",
    "api", "intern", "storage", "scripts", "components :ui",
    "README.md", "BUCHUNGSSYSTEM.md",
}


def load_config() -> dict[str, Any]:
    with CONFIG_FILE.open(encoding="utf-8") as handle:
        return json.load(handle)


def save_config(config: dict[str, Any]) -> None:
    temporary = CONFIG_FILE.with_suffix(".json.tmp")
    temporary.write_text(json.dumps(config, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    temporary.replace(CONFIG_FILE)


def save_runtime_state(state: dict[str, Any]) -> None:
    STATE_DIR.mkdir(exist_ok=True)
    (STATE_DIR / "state.json").write_text(
        json.dumps(state, ensure_ascii=False, indent=2), encoding="utf-8"
    )


def git_result(project_path: Path, *args: str, timeout: int = 12) -> subprocess.CompletedProcess[str] | None:
    try:
        return subprocess.run(
            ["git", "-C", str(project_path), *args],
            check=False,
            capture_output=True,
            text=True,
            timeout=timeout,
        )
    except (OSError, subprocess.TimeoutExpired):
        return None


def git_value(project_path: Path, *args: str) -> str:
    result = git_result(project_path, *args)
    return result.stdout.strip() if result and result.returncode == 0 else ""


def free_port(preferred: int) -> int:
    for port in range(preferred, preferred + 80):
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
            try:
                sock.bind((HOST, port))
                return port
            except OSError:
                continue
    raise RuntimeError("Kein freier lokaler Vorschau-Port verfügbar.")


def slugify(value: str) -> str:
    normalized = value.lower().strip()
    normalized = normalized.replace("ä", "ae").replace("ö", "oe").replace("ü", "ue").replace("ß", "ss")
    normalized = re.sub(r"[^a-z0-9]+", "-", normalized).strip("-")
    return normalized or "projekt"


def deployable_files(root: Path) -> Iterable[Path]:
    for item in root.rglob("*"):
        relative = item.relative_to(root)
        if any(part in PUBLISH_EXCLUDES or part.startswith(".env") for part in relative.parts):
            continue
        if item.is_file():
            yield item


def deploy_content(source_file: Path, relative: Path, publish: dict[str, Any]) -> bytes:
    content = source_file.read_bytes()
    if publish.get("mode") != "static-email-test":
        return content
    if relative.as_posix() == "js/main.js":
        content = content.replace(
            b'backendEndpoint: "api/bookings.php"',
            b'backendEndpoint: ""',
        )
    if relative.as_posix() == "index.html":
        content = content.replace(
            "Nach dem Absenden erhalten Sie eine Referenznummer. Katja prüft den Termin und meldet sich persönlich mit der Bestätigung oder einer Alternative.".encode(),
            "Die Anfrage wird noch nicht gespeichert. Beim Absenden öffnet sich eine vorbereitete E-Mail an Katja.".encode(),
        ).replace(b"<strong>So geht es weiter</strong>", b"<strong>Testversion</strong>")
    return content


def files_match(source: Path, target: Path, publish: dict[str, Any]) -> bool:
    if not target.exists():
        return False
    for source_file in deployable_files(source):
        relative = source_file.relative_to(source)
        target_file = target / relative
        expected = deploy_content(source_file, relative, publish)
        if not target_file.is_file() or len(expected) != target_file.stat().st_size:
            return False
        if hashlib.sha256(expected).digest() != hashlib.sha256(target_file.read_bytes()).digest():
            return False
    return True


def copy_deployable(source: Path, target: Path, publish: dict[str, Any]) -> int:
    copied = 0
    target.mkdir(parents=True, exist_ok=True)
    for source_file in deployable_files(source):
        relative = source_file.relative_to(source)
        target_file = target / relative
        target_file.parent.mkdir(parents=True, exist_ok=True)
        expected = deploy_content(source_file, relative, publish)
        if (
            target_file.exists()
            and len(expected) == target_file.stat().st_size
            and hashlib.sha256(expected).digest()
            == hashlib.sha256(target_file.read_bytes()).digest()
        ):
            continue
        target_file.write_bytes(expected)
        shutil.copystat(source_file, target_file)
        copied += 1
    return copied


@dataclass
class RunningPreview:
    process: subprocess.Popen[bytes]
    port: int
    root: Path


class ProjectManager:
    def __init__(self) -> None:
        self.lock = threading.RLock()
        self.previews: dict[str, RunningPreview] = {}
        self.config = load_config()

    @property
    def allowed_root(self) -> Path:
        return Path(self.config["allowed_root"]).expanduser().resolve()

    def reload(self) -> None:
        self.config = load_config()

    def get_definition(self, project_id: str) -> dict[str, Any]:
        for item in self.config.get("projects", []):
            if item["id"] == project_id:
                return item
        raise KeyError(project_id)

    def safe_path(self, raw_path: str, label: str) -> Path:
        path = Path(raw_path).expanduser().resolve()
        if not path.is_relative_to(self.allowed_root):
            raise PermissionError(f"{label} liegt außerhalb von {self.allowed_root}.")
        return path

    def project_path(self, definition: dict[str, Any]) -> Path:
        return self.safe_path(definition["path"], "Projekt")

    def preview_root(self, definition: dict[str, Any], require_index: bool = True) -> Path:
        project = self.project_path(definition)
        root = (project / definition.get("preview_root", ".")).resolve()
        if not root.is_relative_to(project):
            raise PermissionError("Ungültiger Vorschauordner.")
        if require_index and not (root / "index.html").exists():
            raise FileNotFoundError(f"Keine index.html in {root}")
        return root

    def publish_info(self, definition: dict[str, Any]) -> dict[str, Any]:
        publish = definition.get("publish") or {}
        repo_raw = str(publish.get("repository_path") or "").strip()
        subdir = str(publish.get("target_subdir") or "").strip()
        production_url = str(publish.get("production_url") or "").strip()
        target_type = publish.get("target_type", "pappenberg")

        repository = self.safe_path(repo_raw, "Repository") if repo_raw else None
        target = None
        if repository and subdir:
            target = (repository / subdir).resolve()
            if not target.is_relative_to(repository):
                raise PermissionError("Der Zielordner verlässt das Repository.")

        return {
            "target_type": target_type,
            "repository_path": str(repository) if repository else "",
            "target_subdir": subdir,
            "target_path": str(target) if target else "",
            "production_url": production_url,
        }

    def project_payload(self, definition: dict[str, Any]) -> dict[str, Any]:
        project_id = definition["id"]
        path = self.project_path(definition)
        preview_root = self.preview_root(definition, require_index=False)
        preview = self.previews.get(project_id)
        if preview and preview.process.poll() is not None:
            self.previews.pop(project_id, None)
            preview = None

        source_exists = path.is_dir()
        preview_ready = (preview_root / "index.html").is_file()
        publish = self.publish_info(definition)
        repository = Path(publish["repository_path"]) if publish["repository_path"] else None
        target = Path(publish["target_path"]) if publish["target_path"] else None
        repository_ready = bool(repository and repository.is_dir() and (repository / ".git").exists())
        mapping_ready = bool(repository_ready and target and publish["production_url"])
        target_exists = bool(target and target.is_dir())
        in_sync = bool(preview_ready and target and files_match(preview_root, target, definition.get("publish") or {}))
        open_steps = sum(not item for item in [source_exists, preview_ready, repository_ready, mapping_ready])

        git_path = repository if repository_ready else path
        status_lines = git_value(git_path, "status", "--porcelain").splitlines()
        ahead_text = git_value(git_path, "rev-list", "--count", "@{upstream}..HEAD")

        return {
            **definition,
            "path": str(path),
            "preview_path": str(preview_root),
            "publish": publish,
            "git": {
                "branch": git_value(git_path, "branch", "--show-current") or "–",
                "clean": not status_lines,
                "changes": len(status_lines),
                "remote": git_value(git_path, "remote", "get-url", "origin"),
                "last_commit": git_value(git_path, "log", "-1", "--pretty=%h · %s") or "Noch kein Commit",
                "ahead": int(ahead_text) if ahead_text.isdigit() else 0,
            },
            "setup": {
                "source_exists": source_exists,
                "preview_ready": preview_ready,
                "repository_ready": repository_ready,
                "mapping_ready": mapping_ready,
                "open_steps": open_steps,
                "ready_to_publish": open_steps == 0,
            },
            "sync": {"target_exists": target_exists, "in_sync": in_sync},
            "running": preview is not None,
            "preview_url": f"http://{HOST}:{preview.port}/" if preview else None,
        }

    def list_projects(self) -> list[dict[str, Any]]:
        with self.lock:
            self.reload()
            return [self.project_payload(item) for item in self.config.get("projects", [])]

    def import_project(self, data: dict[str, Any]) -> dict[str, Any]:
        with self.lock:
            name = str(data.get("name") or "").strip()
            if not name:
                raise ValueError("Bitte einen Projektnamen angeben.")
            project_path = self.safe_path(str(data.get("path") or ""), "Projekt")
            if not project_path.is_dir():
                raise FileNotFoundError("Der lokale Projektordner wurde nicht gefunden.")

            preview_relative = str(data.get("preview_root") or ".").strip()
            preview = (project_path / preview_relative).resolve()
            if not preview.is_relative_to(project_path) or not (preview / "index.html").is_file():
                raise FileNotFoundError("Im Vorschau-Ordner wurde keine index.html gefunden.")

            target_type = str(data.get("target_type") or "pappenberg")
            repository_raw = str(data.get("repository_path") or "").strip()
            if not repository_raw and target_type == "pappenberg":
                repository_raw = str(self.config.get("defaults", {}).get("pappenberg_repository") or "")
            repository = self.safe_path(repository_raw, "Repository")
            if not (repository / ".git").exists():
                raise FileNotFoundError("Der Zielordner ist kein lokaler Git-Klon.")

            target_subdir = str(data.get("target_subdir") or "").strip()
            if not target_subdir:
                target_subdir = slugify(name) if target_type == "pappenberg" else "."
            target = (repository / target_subdir).resolve()
            if not target.is_relative_to(repository):
                raise PermissionError("Der Ziel-Unterordner ist ungültig.")

            production_url = str(data.get("production_url") or "").strip()
            if not production_url:
                if target_type == "pappenberg":
                    production_url = f"https://pappenberg.io/{target_subdir.strip('/')}/"
                else:
                    raise ValueError("Für eine externe Domain ist die öffentliche URL erforderlich.")

            base_id = slugify(name)
            existing_ids = {item["id"] for item in self.config.get("projects", [])}
            project_id = base_id
            suffix = 2
            while project_id in existing_ids:
                project_id = f"{base_id}-{suffix}"
                suffix += 1

            definition = {
                "id": project_id,
                "name": name,
                "description": "Über den Showroom eingerichtetes Website-Projekt.",
                "path": str(project_path),
                "preview_root": preview_relative,
                "port": int(self.config.get("defaults", {}).get("next_preview_port", 4450)) + len(existing_ids),
                "color": "#8f2d91",
                "publish": {
                    "target_type": target_type,
                    "repository_path": str(repository),
                    "target_subdir": target_subdir,
                    "production_url": production_url,
                },
            }
            self.config.setdefault("projects", []).append(definition)
            save_config(self.config)
            return self.project_payload(definition)

    def start(self, project_id: str) -> dict[str, Any]:
        with self.lock:
            definition = self.get_definition(project_id)
            running = self.previews.get(project_id)
            if running and running.process.poll() is None:
                return self.project_payload(definition)
            root = self.preview_root(definition)
            port = free_port(int(definition.get("port", 4400)))
            STATE_DIR.mkdir(exist_ok=True)
            log_handle = (STATE_DIR / f"{project_id}.log").open("ab")
            process = subprocess.Popen(
                [
                    sys.executable, str(APP_DIR / "preview_server.py"),
                    "--root", str(root), "--port", str(port),
                    "--project", project_id, "--state-dir", str(STATE_DIR),
                ],
                cwd=APP_DIR,
                stdout=log_handle,
                stderr=subprocess.STDOUT,
                start_new_session=True,
            )
            self.previews[project_id] = RunningPreview(process, port, root)
            time.sleep(0.15)
            return self.project_payload(definition)

    def stop(self, project_id: str) -> dict[str, Any]:
        with self.lock:
            definition = self.get_definition(project_id)
            running = self.previews.pop(project_id, None)
            if running and running.process.poll() is None:
                os.killpg(running.process.pid, signal.SIGTERM)
            return self.project_payload(definition)

    def open_preview(self, project_id: str) -> dict[str, Any]:
        payload = self.start(project_id)
        webbrowser.open(payload["preview_url"])
        return payload

    def open_codex(self, project_id: str) -> dict[str, Any]:
        definition = self.get_definition(project_id)
        project = self.project_path(definition)
        if not CODEX_BIN.exists():
            raise FileNotFoundError("Codex Desktop wurde nicht gefunden.")
        subprocess.Popen(
            [str(CODEX_BIN), "app", str(project)],
            stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, start_new_session=True,
        )
        return self.project_payload(definition)

    def open_desktop(self, project_id: str) -> dict[str, Any]:
        definition = self.get_definition(project_id)
        publish = self.publish_info(definition)
        repository = Path(publish["repository_path"])
        subprocess.Popen(
            ["open", "-a", "GitHub Desktop", str(repository)],
            stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
        )
        return self.project_payload(definition)

    def prepare_publish(self, project_id: str, confirmed: bool) -> tuple[dict[str, Any], str]:
        if not confirmed:
            raise PermissionError("Die Veröffentlichung wurde nicht bestätigt.")
        with self.lock:
            definition = self.get_definition(project_id)
            before = self.project_payload(definition)
            if not before["setup"]["ready_to_publish"]:
                raise RuntimeError("Die Einrichtung ist noch nicht vollständig.")

            source = Path(before["preview_path"])
            repository = Path(before["publish"]["repository_path"])
            target = Path(before["publish"]["target_path"])
            copied = copy_deployable(source, target, definition.get("publish") or {})
            target_arg = os.path.relpath(target, repository)

            add_result = git_result(repository, "add", "--all", "--", target_arg, timeout=30)
            if not add_result or add_result.returncode != 0:
                raise RuntimeError(add_result.stderr.strip() if add_result else "Git konnte das Ziel nicht vorbereiten.")

            staged = git_value(repository, "diff", "--cached", "--name-only", "--", target_arg)
            message = "Ziel war bereits aktuell. Es wurde kein neuer Commit erstellt."
            if staged:
                commit_message = f"Publish {definition['name']} via Showroom"
                commit_result = git_result(repository, "commit", "-m", commit_message, "--", target_arg, timeout=45)
                if not commit_result or commit_result.returncode != 0:
                    raise RuntimeError(commit_result.stderr.strip() if commit_result else "Git-Commit fehlgeschlagen.")
                message = (
                    f"{copied} Dateien synchronisiert und Git-Commit erstellt. "
                    "Jetzt in GitHub Desktop „Push origin“ wählen."
                )
            return self.project_payload(definition), message

    def shutdown(self) -> None:
        with self.lock:
            for running in self.previews.values():
                if running.process.poll() is None:
                    os.killpg(running.process.pid, signal.SIGTERM)
            self.previews.clear()


MANAGER = ProjectManager()


class Handler(BaseHTTPRequestHandler):
    server_version = "Showroom/1.0"

    def log_message(self, format_string: str, *args: object) -> None:
        print(f"[showroom] {format_string % args}")

    def json_response(self, payload: Any, status: int = 200) -> None:
        body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(body)

    def read_json(self) -> dict[str, Any]:
        length = int(self.headers.get("Content-Length", "0"))
        return json.loads(self.rfile.read(length).decode("utf-8")) if length else {}

    def do_GET(self) -> None:
        parsed = urlparse(self.path)
        if parsed.path == "/api/projects":
            self.json_response({"projects": MANAGER.list_projects()})
            return
        if parsed.path == "/api/health":
            self.json_response({"ok": True, "version": "1.0.0"})
            return
        self.serve_static(parsed.path)

    def do_POST(self) -> None:
        parsed = urlparse(self.path)
        if parsed.path == "/api/projects/import":
            try:
                self.json_response({"project": MANAGER.import_project(self.read_json())}, HTTPStatus.CREATED)
            except Exception as error:
                self.json_response({"error": str(error)}, HTTPStatus.BAD_REQUEST)
            return

        parts = [unquote(part) for part in parsed.path.split("/") if part]
        if len(parts) != 4 or parts[:2] != ["api", "projects"]:
            self.json_response({"error": "Unbekannte Aktion."}, HTTPStatus.NOT_FOUND)
            return

        project_id, action = parts[2], parts[3]
        try:
            if action == "start":
                payload = MANAGER.start(project_id)
                response = {"project": payload}
            elif action == "stop":
                response = {"project": MANAGER.stop(project_id)}
            elif action == "open":
                response = {"project": MANAGER.open_preview(project_id)}
            elif action == "codex":
                response = {"project": MANAGER.open_codex(project_id)}
            elif action == "desktop":
                response = {"project": MANAGER.open_desktop(project_id)}
            elif action == "prepare-publish":
                data = self.read_json()
                payload, message = MANAGER.prepare_publish(project_id, bool(data.get("confirmed")))
                response = {"project": payload, "message": message}
            else:
                self.json_response({"error": "Unbekannte Aktion."}, HTTPStatus.NOT_FOUND)
                return
            self.json_response(response)
        except KeyError:
            self.json_response({"error": "Projekt nicht gefunden."}, HTTPStatus.NOT_FOUND)
        except Exception as error:
            self.json_response({"error": str(error)}, HTTPStatus.BAD_REQUEST)

    def serve_static(self, request_path: str) -> None:
        relative = request_path.lstrip("/") or "index.html"
        target = (STATIC_DIR / relative).resolve()
        if not target.is_relative_to(STATIC_DIR) or not target.is_file():
            target = STATIC_DIR / "index.html"
        mime = {
            ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8",
            ".js": "text/javascript; charset=utf-8", ".svg": "image/svg+xml",
            ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg",
        }.get(target.suffix.lower(), "application/octet-stream")
        body = target.read_bytes()
        self.send_response(HTTPStatus.OK)
        self.send_header("Content-Type", mime)
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-cache")
        self.end_headers()
        self.wfile.write(body)


def main() -> None:
    STATE_DIR.mkdir(exist_ok=True)
    save_runtime_state({"pid": os.getpid(), "url": f"http://{HOST}:{APP_PORT}/"})
    server = ThreadingHTTPServer((HOST, APP_PORT), Handler)

    def stop_server(*_: object) -> None:
        threading.Thread(target=server.shutdown, daemon=True).start()

    signal.signal(signal.SIGTERM, stop_server)
    signal.signal(signal.SIGINT, stop_server)
    print(f"Showroom läuft auf http://{HOST}:{APP_PORT}/")
    try:
        server.serve_forever()
    finally:
        MANAGER.shutdown()
        server.server_close()


if __name__ == "__main__":
    main()
