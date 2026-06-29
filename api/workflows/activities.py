from temporalio import activity

import requests
from flask import current_app

from app.db import VisualizationJob, db
from workflows.nvidia_auth import NvidiaAuth

ESMFOLD_URL = "https://health.api.nvidia.com/v1/biology/nvidia/esmfold"


class ProteinActivities:
    @activity.defn
    async def visualize_protein(self, job_id: int) -> str:
        # Fresh session per activity invocation (the worker keeps one long-lived
        # app context, so the scoped session would otherwise reuse cached state).
        db.session.remove()
        job = db.session.get(VisualizationJob, job_id)
        if job is None:
            return f"no job found for id: #{job_id}"

        job.status = "running"
        db.session.commit()

        try:
            token = current_app.config.get("NVIDIA_TOKEN")
            if not token:
                raise RuntimeError("NVIDIA_TOKEN is not configured")

            response = requests.post(
                ESMFOLD_URL,
                json={"sequence": job.sequence},
                auth=NvidiaAuth(token),
                headers={"Accept": "application/json"},
                timeout=60,
            )
            response.raise_for_status()
            body = response.json()

            pdbs = body.get("pdbs")
            if not pdbs:
                raise RuntimeError("ESMFold response did not contain a structure")

            job.pdb_data = pdbs[0]
            job.status = "completed"
            db.session.commit()
            return f"completed job #{job_id}"

        except Exception as exc:
            db.session.rollback()
            job = db.session.get(VisualizationJob, job_id)
            if job is not None:
                job.status = "failed"
                job.error = str(exc)
                db.session.commit()
            return f"failed job #{job_id}: {exc}"
