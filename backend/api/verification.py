import os
from pathlib import Path

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from engine.patcher import PatchApplicationError
from engine.reproducer import ALLOWED_COMMANDS
from engine.verifier import verify_patch
from ai.diff_analyzer import DiffAnalyzer


router = APIRouter(prefix="/api", tags=["verification"])

# ---------------------------------------------------------------------------
# Path safety
# ---------------------------------------------------------------------------
# All repository and patch paths must resolve inside this root.
# Defaults to the project root (two levels above this file: backend/api/ → root).
# Can be overridden via the PATCHLENS_PROJECT_ROOT environment variable.
_DEFAULT_ROOT = Path(__file__).resolve().parents[2]
_PROJECT_ROOT = Path(os.environ.get("PATCHLENS_PROJECT_ROOT", str(_DEFAULT_ROOT))).resolve()

# Allowed patch file extensions.
_ALLOWED_PATCH_EXTENSIONS = {".diff", ".patch"}


def _check_path_within_root(path: Path, label: str) -> None:
    """Raise HTTP 400 if *path* is outside the configured project root."""
    try:
        path.relative_to(_PROJECT_ROOT)
    except ValueError:
        raise HTTPException(
            status_code=400,
            detail=(
                f"{label} must be located inside the project directory. "
                "Paths outside the project root are not permitted."
            ),
        )


class VerificationRequest(BaseModel):
    repository: str
    patch_file: str
    reproduction_command: list[str]


@router.post("/verify")
def verify(request: VerificationRequest):
    repository = Path(request.repository).resolve()
    patch_file = Path(request.patch_file).resolve()

    # ------------------------------------------------------------------
    # Path validation
    # ------------------------------------------------------------------
    _check_path_within_root(repository, "Repository path")
    _check_path_within_root(patch_file, "Patch file path")

    if not repository.exists():
        raise HTTPException(
            status_code=404,
            detail="Repository not found.",
        )

    if not repository.is_dir():
        raise HTTPException(
            status_code=400,
            detail="Repository path must be a directory.",
        )

    if not patch_file.exists():
        raise HTTPException(
            status_code=404,
            detail="Patch file not found.",
        )

    if patch_file.suffix.lower() not in _ALLOWED_PATCH_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=(
                f"Patch file must have a .diff or .patch extension. "
                f"Got: '{patch_file.suffix}'"
            ),
        )

    # ------------------------------------------------------------------
    # Command validation (first token check)
    # ------------------------------------------------------------------
    if not request.reproduction_command:
        raise HTTPException(
            status_code=400,
            detail="reproduction_command must not be empty.",
        )

    executable = request.reproduction_command[0].lower()
    if executable not in ALLOWED_COMMANDS:
        raise HTTPException(
            status_code=400,
            detail=(
                f"Reproduction command '{request.reproduction_command[0]}' is not "
                f"permitted. Allowed executables: {sorted(ALLOWED_COMMANDS)}"
            ),
        )

    # ------------------------------------------------------------------
    # Verification
    # ------------------------------------------------------------------
    try:
        verdict = verify_patch(
            repository=str(repository),
            patch_file=str(patch_file),
            reproduction_command=request.reproduction_command,
        )

    except PatchApplicationError as error:
        raise HTTPException(
            status_code=422,
            detail=f"Patch could not be applied: {error}",
        )

    except ValueError as error:
        raise HTTPException(
            status_code=400,
            detail=str(error),
        )

    except Exception:
        # Do NOT expose internal details (stack traces, env vars, paths).
        raise HTTPException(
            status_code=500,
            detail="Verification failed due to an internal error.",
        )

    # ------------------------------------------------------------------
    # AI analysis (optional — failure here does not fail the response)
    # ------------------------------------------------------------------
    ai_analysis = None
    try:
        analyzer = DiffAnalyzer()
        with open(patch_file, "r", encoding="utf-8") as file:
            patch_content = file.read()
        ai_analysis = analyzer.analyze_diff(
            patch=patch_content,
            original_failure=verdict.original_result.stderr,
        )
    except Exception:
        # AI analysis is best-effort; do not surface internals.
        ai_analysis = None

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
