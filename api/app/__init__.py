import os

from flask import Flask

from .db import db


def create_app(test_config: dict | None = None) -> Flask:
    app = Flask(__name__, instance_relative_config=True)
    app.config.from_mapping(
        SECRET_KEY=os.environ.get("SECRET_KEY", "dev"),
        SQLALCHEMY_DATABASE_URI=(
            f"sqlite:///{os.path.join(app.instance_path, 'jobs.db')}"
        ),
        GOOGLE_CLIENT_ID=os.environ.get("GOOGLE_CLIENT_ID"),
    )

    if test_config is None:
        app.config.from_pyfile("config.py", silent=True)
    else:
        app.config.from_mapping(test_config)

    os.makedirs(app.instance_path, exist_ok=True)

    db.init_app(app)
    with app.app_context():
        db.create_all()

    from . import auth, jobs

    app.register_blueprint(auth.bp)
    app.register_blueprint(jobs.bp)

    return app
