"""
PatchLens – safe ZIP extraction and project workspace management.

This module handles untrusted user-supplied ZIP archives.  Every extraction
goes into a temporary directory that is isolated from the PatchLens source
tree.  The caller is responsible for calling cleanup_workspace() in a
finally block after verification completes.

Security measures:
  - Path traversal prevention (../, absolute paths, drive letters)
  - Symlink rejection
  - ZIP size limit (50 MB compressed)
  - Extracted size limit (200 MB)
  - No execution of setup.py / requirements.txt
  - No automatic dependency installation
  - Output never placed inside the PatchLens source directory
"""

import os
import shutil
import stat
import tempfile
import zipfile
from pathlib import Path, PurePosixPath

# ---------------------------------------------------------------------------
# Limits
# ---------------------------------------------------------------------------
MAX_ZIP_BYTES = 50 * 1024 * 1024       # 50 MB compressed
MAX_EXTRACTED_BYTES = 200 * 1024 * 1024  # 200 MB extracted
MAX_MEMBERS = 5_000                    # reject archives with too many entries


# ---------------------------------------------------------------------------
# Errors
# ---------------------------------------------------------------------------

class WorkspaceError(Exception):
    """Raised for any workspace / extraction problem.

    The message is user-visible (no internal paths, no secrets).
    """


# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------

def _is_safe_member(member_name: str) -> bool:
    """Return True only if the ZIP member name is safe to extract."""
    # Normalise separators
    norm = member_name.replace("\\", "/")
    parts = PurePosixPath(norm).parts

    for part in parts:
        # Reject traversal components
        if part in ("..", "."):
            return False
        # Reject absolute paths (Unix / Windows drive letters)
        if part.startswith("/") or (len(part) == 2 and part[1] == ":"):
            return False

    # Reject absolute paths detected by PurePosixPath
    if PurePosixPath(norm).is_absolute():
        return False

    return True


def _remove_readonly(func, path, exc_info):  # noqa: ANN001
    """Allow rmtree to remove read-only files on Windows."""
    os.chmod(path, stat.S_IWRITE)
    func(path)


def _rmtree(path: str) -> None:
    shutil.rmtree(path, onerror=_remove_readonly)


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def extract_project_zip(zip_bytes: bytes, project_name: str = "project") -> str:
    """Extract *zip_bytes* into a fresh temporary directory.

    Returns the path to the extracted project root (the top-level directory
    inside the temp workspace).

    Raises WorkspaceError for any safety or validation violation.
    The caller receives a sanitised message; no internal paths are included.
    """
    if len(zip_bytes) > MAX_ZIP_BYTES:
        raise WorkspaceError(
            f"ZIP archive is too large. Maximum allowed size is "
            f"{MAX_ZIP_BYTES // (1024 * 1024)} MB."
        )

    # Validate that it is actually a ZIP
    if not zipfile.is_zipfile(__import__("io").BytesIO(zip_bytes)):
        raise WorkspaceError("Invalid ZIP archive.")

    workspace_dir = tempfile.mkdtemp(prefix="patchlens-upload-")
    try:
        with zipfile.ZipFile(__import__("io").BytesIO(zip_bytes)) as zf:
            members = zf.infolist()

            if len(members) > MAX_MEMBERS:
                raise WorkspaceError(
                    f"ZIP archive contains too many entries (limit: {MAX_MEMBERS})."
                )

            # First pass: safety + size checks
            total_extracted = 0
            for info in members:
                if not _is_safe_member(info.filename):
                    raise WorkspaceError(
                        "ZIP archive contains unsafe paths. "
                        "Archives with path traversal sequences or absolute "
                        "paths are not permitted."
                    )
                # Reject symlinks (external_attr encodes Unix file type in upper 16 bits)
                if (info.external_attr >> 16) & 0xFFFF == 0xA1ED:
                    raise WorkspaceError(
                        "ZIP archive contains symbolic links, which are not permitted."
                    )
                total_extracted += info.file_size

            if total_extracted > MAX_EXTRACTED_BYTES:
                raise WorkspaceError(
                    f"ZIP archive would extract to more than "
                    f"{MAX_EXTRACTED_BYTES // (1024 * 1024)} MB."
                )

            # Second pass: extract
            zf.extractall(workspace_dir)

        # Determine the project root: if there is a single top-level directory,
        # use it; otherwise use the workspace dir directly.
        entries = [
            e for e in os.listdir(workspace_dir)
            if not e.startswith("__MACOSX")  # strip macOS noise
        ]
        if len(entries) == 1:
            candidate = Path(workspace_dir) / entries[0]
            if candidate.is_dir():
                return str(candidate)

        return workspace_dir

    except WorkspaceError:
        _rmtree(workspace_dir)
        raise
    except zipfile.BadZipFile:
        _rmtree(workspace_dir)
        raise WorkspaceError("Invalid or corrupt ZIP archive.")
    except Exception:
        _rmtree(workspace_dir)
        raise WorkspaceError("Failed to extract ZIP archive.")


def validate_python_project(project_dir: str, reproduction_script: str) -> None:
    """Validate that *project_dir* looks like a supported Python project.

    Checks:
      - Directory exists
      - Contains at least one .py file
      - The reproduction script exists inside the project directory

    Raises WorkspaceError with a user-visible message on any failure.
    """
    root = Path(project_dir)

    if not root.exists() or not root.is_dir():
        raise WorkspaceError("Extracted project directory not found.")

    # Must contain at least one Python source file
    py_files = list(root.rglob("*.py"))
    if not py_files:
        raise WorkspaceError(
            "No Python project files found. "
            "PatchLens prototype supports Python/pytest projects."
        )

    # Reproduction script must exist inside the project
    repro_path = root / reproduction_script
    if not repro_path.exists():
        raise WorkspaceError(
            f"Reproduction script '{reproduction_script}' was not found "
            f"in the uploaded project."
        )


def cleanup_workspace(project_dir: str) -> None:
    """Remove the temporary workspace that contains *project_dir*.

    Safe to call even if the directory no longer exists.
    Walks up to the patchlens-upload- prefixed temp directory.
    """
    path = Path(project_dir)

    # Walk up until we find the patchlens-upload- root
    candidate = path
    while True:
        if candidate.name.startswith("patchlens-upload-"):
            if candidate.exists():
                _rmtree(str(candidate))
            return
        parent = candidate.parent
        if parent == candidate:
            # Reached filesystem root without finding our prefix; just remove
            # the given path if it still exists and is a temp-like directory.
            if path.exists() and "patchlens" in str(path):
                _rmtree(str(path))
            return
        candidate = parent
