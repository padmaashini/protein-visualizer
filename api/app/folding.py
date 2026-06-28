"""ESMFold structure prediction client.

This is intended to be driven by a Temporal worker that picks up `pending`
jobs and folds their sequences asynchronously. It is intentionally decoupled
from the request path so the API can return immediately on submission.
"""

import json
import os
import urllib.request

ESMFOLD_URL = "https://health.api.nvidia.com/v1/biology/nvidia/esmfold"


class FoldingError(RuntimeError):
    pass


def fold_sequence(sequence: str) -> str:
    """Fold an amino acid sequence into PDB text using NVIDIA's ESMFold NIM.

    Returns the predicted structure as a PDB-formatted string.
    """
    api_key = os.environ.get("NVIDIA_API_KEY")
    if not api_key:
        raise FoldingError("NVIDIA_API_KEY is not set")

    payload = json.dumps({"sequence": sequence}).encode("utf-8")
    request = urllib.request.Request(
        ESMFOLD_URL,
        data=payload,
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
            "Accept": "application/json",
        },
        method="POST",
    )

    try:
        with urllib.request.urlopen(request) as response:
            body = json.loads(response.read().decode("utf-8"))
    except Exception as exc:  # noqa: BLE001 - surfaced to the caller as a job error
        raise FoldingError(f"ESMFold request failed: {exc}") from exc

    pdbs = body.get("pdbs")
    if not pdbs:
        raise FoldingError("ESMFold response did not contain a structure")
    return pdbs[0]
