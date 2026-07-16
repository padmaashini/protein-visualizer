import json
import queue
import threading
import time
from datetime import datetime, timedelta, timezone
from typing import Any

import jwt
from flask import (
    Blueprint,
    Response,
    current_app,
    jsonify,
    request,
    stream_with_context,
)

from app.db import User, VisualizationJob, db


bp = Blueprint("sse", __name__)


_subscribers: dict[str, queue.Queue[str]] = {}
_sub_lock = threading.Lock()


BASE_RETAIN_WINDOW = timedelta(seconds=30)


def _user_from_token(token: str) -> User | None:
    if not token:
        return None
    try:
        payload = jwt.decode(
            token, current_app.config["JWT_SECRET"], algorithms=["HS256"]
        )
    except jwt.PyJWTError:
        return None
    return db.session.get(User, int(payload["sub"]))


def _scope_query(user_id: int | None, session_id: str | None):
    q = db.select(VisualizationJob)
    if user_id is not None:
        q = q.where(VisualizationJob.owner_id == user_id)
    elif session_id:
        q = q.where(VisualizationJob.session_id == session_id)
    return q


def _key_for(user_id: int | None, session_id: str | None) -> str | None:
    if user_id is not None:
        return f"user:{user_id}"
    if session_id:
        return f"anon:{session_id}"
    return None


def _subscriber_key() -> str | None:
    # Browser EventSource cannot send custom headers, so the polling client
    # forwards the bearer token (signed-in users) or anonymous id (signed-out
    # users) as query parameters. Headers are still honored for non-browser
    # callers.
    token = request.args.get("token") or ""
    if token:
        user = _user_from_token(token)
        if user is not None:
            return f"user:{user.id}"

    session_id = (
        request.args.get("anon")
        or request.headers.get("X-Anonymous-Id", "")
    )
    if session_id:
        return f"anon:{session_id}"
    return None


def _publish(key: str, job_dict: dict[str, Any]) -> None:
    payload = json.dumps(job_dict)
    with _sub_lock:
        q = _subscribers.get(key)
        if q is None:
            return
        try:
            q.put_nowait(payload)
        except queue.Full:
            current_app.logger.warning("Dropping SSE event for %s (queue full)", key)


def _start_poller(app) -> None:
    """Tail VisualizationJob for status changes and broadcast to subscribers.

    Polling the DB keeps SSE self-contained in the Flask process -- no Redis or
    callback wiring into the Temporal worker is required.
    """
    last_seen: dict[str, datetime] = {}
    stop = threading.Event()

    def loop() -> None:
        while not stop.is_set():
            try:
                with app.app_context():
                    now = datetime.now(timezone.utc)
                    base = now - BASE_RETAIN_WINDOW

                    with _sub_lock:
                        for key in list(_subscribers.keys()):
                            last_seen.setdefault(key, base)

                    for key in list(_subscribers.keys()):
                        watermark = last_seen[key]
                        if key.startswith("user:"):
                            user_id = int(key[len("user:"):])
                            session_id = None
                        else:
                            user_id = None
                            session_id = key[len("anon:"):]

                        stmt = _scope_query(user_id, session_id).where(
                            VisualizationJob.updated_at > watermark
                        )
                        # Cap how many we publish per tick so the SSE queue can't
                        # be flooded by a worker that just finished a batch.
                        rows = db.session.scalars(
                            stmt.order_by(VisualizationJob.updated_at).limit(50)
                        ).all()

                        latest = watermark
                        for job in rows:
                            if (
                                (user_id is None or job.owner_id == user_id)
                                and (session_id is None or job.session_id == session_id)
                            ):
                                _publish(key, job.to_dict())
                            if job.updated_at and job.updated_at > latest:
                                latest = job.updated_at
                        last_seen[key] = latest
            except Exception:  # noqa: BLE001 - keep the poller alive
                current_app.logger.exception("SSE poller iteration failed")

            stop.wait(2.0)

    thread = threading.Thread(target=loop, daemon=True, name="sse-poller")
    thread.start()


@bp.get("/jobs/events")
def jobs_events():
    key = _subscriber_key()
    if key is None:
        return jsonify({"error": "Missing session identifier"}), 400

    sub_queue: queue.Queue[str] = queue.Queue(maxsize=128)
    with _sub_lock:
        _subscribers[key] = sub_queue

    def generate():
        try:
            # Open with a hello event so the client EventSource flips to OPEN.
            yield "event: hello\ndata: {}\n\n"
            while True:
                try:
                    payload = sub_queue.get(timeout=15)
                    yield f"event: job.updated\ndata: {payload}\n\n"
                except queue.Empty:
                    # Comment line keeps proxies from closing the idle stream.
                    yield ": heartbeat\n\n"
        finally:
            with _sub_lock:
                _subscribers.pop(key, None)

    response = Response(
        stream_with_context(generate()),
        mimetype="text/event-stream",
    )
    response.headers["Cache-Control"] = "no-cache, no-transform"
    response.headers["X-Accel-Buffering"] = "no"
    response.headers["Connection"] = "keep-alive"
    return response
