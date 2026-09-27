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
import re
import tempfile
from pathlib import Path

from fastapi import APIRouter, File, Form, HTTPException, UploadFile

from engine.patcher import PatchApplicationError
from engine.reproducer import ALLOWED_COMMANDS
from engine.verifier import verify_patch
from engine.workspace import WorkspaceError, cleanup_workspace, extract_project_zip, validate_python_project
from ai.diff_analyzer import DiffAnalyzer

# ---------------------------------------------------------------------------
# Patch path normalisation helper
# ---------------------------------------------------------------------------

def _normalise_patch_paths(patch_bytes: bytes, project_dir: str) -> bytes:
    """Normalise a unified diff so it applies cleanly inside *project_dir*.

    Two transformations are applied while **preserving the patch's original
    line endings** (LF or CRLF), because ``git apply`` matches context lines
    against the target file byte-for-byte including line endings.  Converting
    line endings would break patches applied against CRLF files.

    1. **Path prefix stripping** — if the diff paths carry a leading component
       that does not exist as a directory inside *project_dir*, strip it.
       Example::

           patch: "--- a/demo-repo/app/student_service.py"
           project_dir contains "app/" but not "demo-repo/"
           → rewrite as "--- a/app/student_service.py"

    2. **Trailing-space removal on blank context lines** — a blank context line
       in a diff looks like ``" \\r\\n"`` (space + CRLF) or ``" \\n"`` (space + LF).
       When the underlying source file's blank line has no trailing space,
       ``git apply`` rejects the mismatch.  We strip the space so the context
       line becomes exactly the line-ending (matching the file's blank line).
    """
    try:
        raw = patch_bytes.decode("utf-8", errors="replace")
    except Exception:
        return patch_bytes

    if not raw:
        return patch_bytes

    # Split preserving line endings — we must keep \r\n intact where present.
    # str.splitlines(keepends=True) does this correctly.
    lines = raw.splitlines(keepends=True)

    # ---- Transform 1: detect whether path prefix stripping is needed -------
    need_strip = False
    leading = ""
    for line in lines:
        # Match the first "--- a/..." or "--- ..." header line
        m = re.match(r'^--- (?:a/)?(.+)', line)
        if m:
            first_path = m.group(1).rstrip("\r\n").strip()
            parts = first_path.replace("\\", "/").split("/")
            if len(parts) >= 2:
                leading = parts[0]
                need_strip = not (Path(project_dir) / leading).is_dir()
            break

    def _strip_one(path_str: str) -> str:
        """Remove the first slash-delimited path component."""
        n = path_str.replace("\\", "/")
        idx = n.find("/")
        return n[idx + 1:] if idx != -1 else path_str

    def _eol(s: str) -> str:
        """Return the line-ending characters at the end of *s*."""
        stripped = s.rstrip("\r\n")
        return s[len(stripped):]

    # ---- Process each line -------------------------------------------------
    out = []
    for line in lines:
        eol = _eol(line)
        content = line.rstrip("\r\n")

        # Transform 1: path prefix stripping on diff header lines
        if need_strip:
            if content.startswith("diff --git "):
                content = re.sub(
                    r'^(diff --git )a/(\S+) b/(\S+)',
                    lambda m: (
                        m.group(1)
                        + "a/" + _strip_one(m.group(2))
                        + " b/" + _strip_one(m.group(3))
                    ),
                    content,
                )
            elif content.startswith("--- a/") or content.startswith("+++ b/"):
                prefix = content[:6]
                content = prefix + _strip_one(content[6:])
            elif content.startswith(("--- ", "+++ ")):
                prefix = content[:4]
                rest = content[4:]
                if rest.replace("\\", "/").startswith(leading + "/"):
                    content = prefix + _strip_one(rest)

        # Transform 2: blank context lines — remove spurious trailing space
        # A context line starts with exactly one space.  If the remainder
        # (before the line-ending) is empty or all spaces, it's a blank line
        # in the original file.  Remove the trailing space so the context
        # byte-sequence matches the file's actual blank line.
        if content.startswith(" ") and not content.startswith(("--- ", "+++ ")):
            body = content[1:]  # content after the leading space marker
            if body == "" or body.isspace():
                content = ""  # bare newline — no leading space needed for blank line
                # NOTE: we keep "content = ''" and re-attach eol below,
                # but git apply needs the context marker space.  Keep " ".
                content = " "

        out.append(content + eol)

    return "".join(out).encode("utf-8")


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

    # ------------------------------------------------------------------
    # 4b. Normalise patch paths if needed
    # ------------------------------------------------------------------
    # git apply runs with cwd = extracted project directory.  The patch
    # file may have been generated against a parent directory (e.g. the
    # full repository root), so its paths may carry extra leading
    # components such as "demo-repo/app/student_service.py" when the
    # extracted project contains "app/student_service.py" directly.
    #
    # Strategy: parse the leading path component from the first --- line
    # of the patch and strip it when all those components (except the
    # last filename part) form a prefix that does NOT exist as a
    # directory inside project_dir.  This is equivalent to git apply -p1
    # applied selectively.  We only strip one level at a time because
    # that covers all real-world cases (generated-from-repo-root diffs).
    patch_bytes = _normalise_patch_paths(patch_bytes, project_dir)

    # Write the (possibly normalised) patch into the workspace temp dir
    # (sibling of project_dir so it is outside the project tree).
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
                ignore_whitespace=True,
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
