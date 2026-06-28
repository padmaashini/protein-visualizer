import os

from flask import Flask

from .db import db


def create_app(test_config: dict | None = None) -> Flask:
    app = Flask(__name__, instance_relative_config=True)
    app.config.from_mapping(
        SQLALCHEMY_DATABASE_URI=(
            f"sqlite:///{os.path.join(app.instance_path, 'jobs.db')}"
        ),
    )

    if test_config is None:
        app.config.from_pyfile("config.py", silent=True)
    else:
        app.config.from_mapping(test_config)

    os.makedirs(app.instance_path, exist_ok=True)

    db.init_app(app)
    with app.app_context():
        db.create_all()

    from . import jobs

    app.register_blueprint(jobs.bp)

    return app
