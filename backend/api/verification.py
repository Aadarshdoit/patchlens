from pathlib import Path

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from engine.verifier import verify_patch
from ai.diff_analyzer import DiffAnalyzer


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

        analyzer = DiffAnalyzer()

        with open(patch_file, "r", encoding="utf-8") as file:
            patch_content = file.read()

        ai_analysis = analyzer.analyze_diff(
            patch=patch_content,
            original_failure=verdict.original_result.stderr,
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
            "tests": {
                "passed": verdict.test_result.passed,
                "exit_code": verdict.test_result.exit_code,
                "duration": verdict.test_result.duration,
                "stdout": verdict.test_result.stdout,
                "stderr": verdict.test_result.stderr,
                "timed_out": verdict.test_result.timed_out,
            },
            "suspicious_checks": [
                {
                    "name": check.name,
                    "detected": check.detected,
                    "reason": check.reason,
                }
                for check in verdict.suspicious_checks
            ],
            "ai_analysis": ai_analysis,
        }

    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=str(error),
        )