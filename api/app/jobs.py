import asyncio

from flask import Blueprint, current_app, jsonify, request
from sqlalchemy import ColumnElement
from temporalio.client import Client

from app.auth import current_user_optional
from app.db import User, VisualizationJob, db
from workflows.workflows import ProteinWorkflow

SUPPORTED_MODELS = {"esmfold"}
VALID_AMINO_ACIDS = set("ACDEFGHIKLMNPQRSTVWY")

TEMPORAL_ADDRESS = "localhost:7233"
TASK_QUEUE = "protein-fold-queue"

bp = Blueprint("jobs", __name__)


def _identity() -> tuple[User | None, str | None]:
    """Resolve who owns the request: a signed-in user or an anonymous browser."""
    user = current_user_optional()
    if user is not None:
        return user, None
    return None, request.headers.get("X-Anonymous-Id")


def _scope_filter(user: User | None, session_id: str | None) -> ColumnElement | None:
    if user is not None:
        return VisualizationJob.owner_id == user.id
    if session_id:
        return VisualizationJob.session_id == session_id
    return None


async def _temporal_client() -> Client:
    return await Client.connect(TEMPORAL_ADDRESS)


async def _start_fold_workflow(job_id: int) -> None:
    client = await _temporal_client()
    await client.start_workflow(
        ProteinWorkflow.run,
        job_id,
        id=f"protein-fold-{job_id}",
        task_queue=TASK_QUEUE,
    )


async def _cancel_fold_workflow(job_id: int) -> None:
    """Best-effort cancel of the in-flight folding workflow for a job.

    A missing workflow is fine (it already finished), so any lookup/connection
    error is logged and swallowed -- the row delete is the source of truth.
    """
    client = await _temporal_client()
    handle = client.get_workflow_handle(f"protein-fold-{job_id}")
    await handle.cancel()


@bp.get("/visualization_jobs")
def list_jobs():
    user, session_id = _identity()
    scope = _scope_filter(user, session_id)
    if scope is None:
        return jsonify([])

    jobs = db.session.scalars(
        db.select(VisualizationJob)
        .where(scope)
        .order_by(VisualizationJob.created_at.desc(), VisualizationJob.id.desc())
    ).all()
    return jsonify([job.to_dict() for job in jobs])


@bp.get("/visualization_job/<int:job_id>")
def get_job(job_id: int):
    user, session_id = _identity()
    job = db.session.get(VisualizationJob, job_id)
    if job is None or not _owns(job, user, session_id):
        return jsonify({"error": "Job not found"}), 404
    return jsonify(job.to_dict())


@bp.post("/visualization_job")
def create_job():
    payload = request.get_json(silent=True) or {}
    error = validate_job_payload(payload)
    if error:
        return jsonify({"error": error}), 400

    user, session_id = _identity()
    if user is None and not session_id:
        return jsonify({"error": "Missing session identifier"}), 400

    job = VisualizationJob(
        owner_id=user.id if user else None,
        session_id=None if user else session_id,
        name=payload["name"].strip(),
        model=payload["model"].strip().lower(),
        sequence=payload["sequence"].strip().upper(),
        status="pending",
    )
    db.session.add(job)
    db.session.commit()

    try:
        asyncio.run(_start_fold_workflow(job.id))
    except Exception:
        current_app.logger.exception(
            "Failed to start folding workflow for job %s", job.id
        )

    return jsonify(job.to_dict()), 201


@bp.delete("/visualization_job/<int:job_id>")
def delete_job(job_id: int):
    user, session_id = _identity()
    job = db.session.get(VisualizationJob, job_id)
    if job is None or not _owns(job, user, session_id):
        return jsonify({"error": "Job not found"}), 404

    if job.status in {"pending", "running"}:
        try:
            asyncio.run(_cancel_fold_workflow(job.id))
        except Exception:
            current_app.logger.exception(
                "Failed to cancel folding workflow for job %s", job.id
            )

    db.session.delete(job)
    db.session.commit()
    return "", 204


def _owns(job: VisualizationJob, user: User | None, session_id: str | None) -> bool:
    if user is not None:
        return job.owner_id == user.id
    return bool(session_id) and job.session_id == session_id


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
