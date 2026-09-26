from pathlib import Path

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from engine.verifier import verify_patch


router = APIRouter(prefix="/api", tags=["verification"])


class VerificationRequest(BaseModel):
    repository: str
    patch_file: str
    reproduction_command: list[str]


@router.post("/verify")
def verify(request: VerificationRequest):
    repository = Path(request.repository).resolve()
    patch_file = Path(request.patch_file).resolve()

    if not repository.exists():
        raise HTTPException(
            status_code=404,
            detail="Repository not found",
        )

    if not patch_file.exists():
        raise HTTPException(
            status_code=404,
            detail="Patch file not found",
        )

    try:
        verdict = verify_patch(
            repository=str(repository),
            patch_file=str(patch_file),
            reproduction_command=request.reproduction_command,
        )

        return {
            "status": verdict.status,
            "reason": verdict.reason,
            "original": {
                "stdout": verdict.original_result.stdout,
                "stderr": verdict.original_result.stderr,
                "exit_code": verdict.original_result.exit_code,
                "duration": verdict.original_result.duration,
                "timed_out": verdict.original_result.timed_out,
            },
            "patched": {
                "stdout": verdict.patched_result.stdout,
                "stderr": verdict.patched_result.stderr,
                "exit_code": verdict.patched_result.exit_code,
                "duration": verdict.patched_result.duration,
                "timed_out": verdict.patched_result.timed_out,
            },
        }

    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=str(error),
        )