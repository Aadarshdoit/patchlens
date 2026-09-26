"""
PatchLens – /api/upload-verify endpoint.

Accepts a multipart form upload of:
  - project_zip  : the project archive (.zip)
  - patch_file   : the candidate patch (.diff or .patch)
  - repro_script : reproduction script name (e.g. "reproduce.py")

Runs the identical verification engine used by /api/verify.
Cleans up temporary workspaces in all cases (success, failure, exception).

Security:
  - ZIP extraction delegated to engine.workspace (path traversal safe)
  - Patch content validated for extension before writing to temp workspace
  - Patch written inside the temp workspace, never outside it
  - reproduction_command constrained to ALLOWED_COMMANDS
  - No shell=True anywhere
  - No automatic dependency installation
"""

import io
import os
import tempfile
from pathlib import Path

from fastapi import APIRouter, File, Form, HTTPException, UploadFile

from engine.patcher import PatchApplicationError
from engine.reproducer import ALLOWED_COMMANDS
from engine.verifier import verify_patch
from engine.workspace import WorkspaceError, cleanup_workspace, extract_project_zip, validate_python_project
from ai.diff_analyzer import DiffAnalyzer

router = APIRouter(prefix="/api", tags=["upload"])

# Allowed patch extensions
_ALLOWED_PATCH_EXTENSIONS = {".diff", ".patch"}

# Max patch file size: 1 MB (a diff does not need to be larger)
MAX_PATCH_BYTES = 1 * 1024 * 1024


@router.post("/upload-verify")
async def upload_verify(
    project_zip: UploadFile = File(..., description="Project ZIP archive"),
    patch_file: UploadFile = File(..., description="Candidate patch (.diff or .patch)"),
    repro_script: str = Form("reproduce.py", description="Reproduction script filename"),
):
    """
    Upload a Python project ZIP and a candidate patch, then run full verification.

    Returns the same response shape as POST /api/verify.
    Prototype supports Python/pytest projects only.
    """
    # ------------------------------------------------------------------
    # 1. Validate patch extension before reading bytes
    # ------------------------------------------------------------------
    patch_suffix = Path(patch_file.filename or "candidate.diff").suffix.lower()
    if patch_suffix not in _ALLOWED_PATCH_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=(
                f"Patch file must have a .diff or .patch extension. "
                f"Got: '{patch_suffix}'"
            ),
        )

    # ------------------------------------------------------------------
    # 2. Validate reproduction script name (no path separators, .py only)
    # ------------------------------------------------------------------
    repro_script = repro_script.strip()
    if not repro_script:
        repro_script = "reproduce.py"
    if "/" in repro_script or "\\" in repro_script or ".." in repro_script:
        raise HTTPException(
            status_code=400,
            detail="Reproduction script name must not contain path separators.",
        )
    if not repro_script.endswith(".py"):
        raise HTTPException(
            status_code=400,
            detail="Reproduction script must be a .py file.",
        )

    # ------------------------------------------------------------------
    # 3. Read uploaded bytes
    # ------------------------------------------------------------------
    try:
        zip_bytes = await project_zip.read()
    except Exception:
        raise HTTPException(status_code=400, detail="Failed to read project ZIP.")

    try:
        patch_bytes = await patch_file.read()
    except Exception:
        raise HTTPException(status_code=400, detail="Failed to read patch file.")

    if len(patch_bytes) > MAX_PATCH_BYTES:
        raise HTTPException(
            status_code=400,
            detail=f"Patch file too large. Maximum size is {MAX_PATCH_BYTES // 1024} KB.",
        )

    # ------------------------------------------------------------------
    # 4. Extract the uploaded ZIP into a temporary workspace
    # ------------------------------------------------------------------
    try:
        project_dir = extract_project_zip(zip_bytes)
    except WorkspaceError as exc:
        raise HTTPException(status_code=400, detail=str(exc))

    # Write the patch file into the workspace temp dir (sibling of project_dir)
    temp_root = str(Path(project_dir).parent)
    patch_path = Path(temp_root) / f"candidate{patch_suffix}"
    try:
        patch_path.write_bytes(patch_bytes)
    except Exception:
        cleanup_workspace(project_dir)
        raise HTTPException(status_code=500, detail="Failed to write patch file.")

    try:
        # ------------------------------------------------------------------
        # 5. Validate the extracted project
        # ------------------------------------------------------------------
        try:
            validate_python_project(project_dir, repro_script)
        except WorkspaceError as exc:
            raise HTTPException(status_code=422, detail=str(exc))

        # ------------------------------------------------------------------
        # 6. Build the reproduction command
        # ------------------------------------------------------------------
        reproduction_command = ["python", repro_script]
        # The command executor validates the first token against ALLOWED_COMMANDS;
        # "python" is always in the allowlist so this is guaranteed safe.

        # ------------------------------------------------------------------
        # 7. Run verification (same engine as /api/verify)
        # ------------------------------------------------------------------
        try:
            verdict = verify_patch(
                repository=project_dir,
                patch_file=str(patch_path),
                reproduction_command=reproduction_command,
            )
        except PatchApplicationError as error:
            raise HTTPException(
                status_code=422,
                detail=f"Patch could not be applied: {error}",
            )
        except ValueError as error:
            raise HTTPException(status_code=400, detail=str(error))
        except Exception:
            raise HTTPException(
                status_code=500,
                detail="Verification failed due to an internal error.",
            )

        # ------------------------------------------------------------------
        # 8. AI analysis (optional; failure does not block verdict)
        # ------------------------------------------------------------------
        ai_analysis = None
        try:
            analyzer = DiffAnalyzer()
            ai_analysis = analyzer.analyze_diff(
                patch=patch_bytes.decode("utf-8", errors="replace"),
                original_failure=verdict.original_result.stderr,
            )
        except Exception:
            ai_analysis = None

        # ------------------------------------------------------------------
        # 9. Return — same shape as /api/verify
        # ------------------------------------------------------------------
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

    finally:
        # Always clean up the uploaded project workspace.
        cleanup_workspace(project_dir)
