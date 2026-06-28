from flask import Blueprint, jsonify, request

from .db import VisualizationJob, db

SUPPORTED_MODELS = {"esmfold"}
VALID_AMINO_ACIDS = set("ACDEFGHIKLMNPQRSTVWY")

bp = Blueprint("jobs", __name__)


@bp.get("/visualization_jobs")
def list_jobs():
    jobs = db.session.scalars(
        db.select(VisualizationJob).order_by(
            VisualizationJob.created_at.desc(), VisualizationJob.id.desc()
        )
    ).all()
    return jsonify([job.to_dict() for job in jobs])


@bp.get("/visualization_job/<int:job_id>")
def get_job(job_id: int):
    job = db.session.get(VisualizationJob, job_id)
    if job is None:
        return jsonify({"error": "Job not found"}), 404
    return jsonify(job.to_dict())


@bp.post("/visualization_job")
def create_job():
    payload = request.get_json(silent=True) or {}
    error = validate_job_payload(payload)
    if error:
        return jsonify({"error": error}), 400

    job = VisualizationJob(
        name=payload["name"].strip(),
        model=payload["model"].strip().lower(),
        sequence=payload["sequence"].strip().upper(),
        status="pending",
    )
    db.session.add(job)
    db.session.commit()

    return jsonify(job.to_dict()), 201


def validate_job_payload(payload: dict) -> str | None:
    name = payload.get("name")
    model = payload.get("model")
    sequence = payload.get("sequence")

    if not isinstance(name, str) or not name.strip():
        return "A job name is required"
    if not isinstance(model, str) or model.strip().lower() not in SUPPORTED_MODELS:
        return f"Model must be one of: {', '.join(sorted(SUPPORTED_MODELS))}"
    if not isinstance(sequence, str) or not sequence.strip():
        return "An amino acid sequence is required"

    cleaned = sequence.strip().upper()
    invalid = set(cleaned) - VALID_AMINO_ACIDS
    if invalid:
        return f"Sequence contains invalid amino acids: {', '.join(sorted(invalid))}"

    return None
