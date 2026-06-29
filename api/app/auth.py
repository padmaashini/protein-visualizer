from datetime import datetime, timedelta, timezone
from functools import wraps

import jwt
from flask import Blueprint, current_app, g, jsonify, request
from google.auth.transport import requests as google_requests
from google.oauth2 import id_token

from app.db import User, db

bp = Blueprint("auth", __name__, url_prefix="/auth")

SESSION_TTL = timedelta(days=7)


def _issue_session_token(user: User) -> str:
    now = datetime.now(timezone.utc)
    payload = {
        "sub": str(user.id),
        "iat": now,
        "exp": now + SESSION_TTL,
    }
    return jwt.encode(payload, current_app.config["SECRET_KEY"], algorithm="HS256")


def current_user_optional() -> User | None:
    header = request.headers.get("Authorization", "")
    if not header.startswith("Bearer "):
        return None
    token = header[len("Bearer ") :]
    try:
        payload = jwt.decode(
            token, current_app.config["SECRET_KEY"], algorithms=["HS256"]
        )
    except jwt.PyJWTError:
        return None
    return db.session.get(User, int(payload["sub"]))


def login_required(view):
    @wraps(view)
    def wrapped(*args, **kwargs):
        user = current_user_optional()
        if user is None:
            return jsonify({"error": "Authentication required"}), 401
        g.user = user
        return view(*args, **kwargs)

    return wrapped


@bp.post("/google")
def google_sign_in():
    payload = request.get_json(silent=True) or {}
    credential = payload.get("credential")
    if not isinstance(credential, str) or not credential:
        return jsonify({"error": "A Google credential is required"}), 400

    client_id = current_app.config.get("GOOGLE_CLIENT_ID")
    if not client_id:
        return jsonify({"error": "Google sign-in is not configured"}), 500

    try:
        claims = id_token.verify_oauth2_token(
            credential, google_requests.Request(), client_id
        )
    except ValueError:
        return jsonify({"error": "Invalid Google credential"}), 401

    google_sub = claims["sub"]
    user = db.session.scalar(db.select(User).where(User.google_sub == google_sub))
    if user is None:
        user = User(google_sub=google_sub, email=claims.get("email", ""))
        db.session.add(user)

    user.email = claims.get("email", user.email)
    user.name = claims.get("name")
    user.picture = claims.get("picture")
    db.session.commit()

    token = _issue_session_token(user)
    return jsonify({"token": token, "user": user.to_dict()})


@bp.get("/me")
@login_required
def me():
    return jsonify(g.user.to_dict())
