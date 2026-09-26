import os
import shutil
import stat
import subprocess
import tempfile
from pathlib import Path


class PatchApplicationError(Exception):
    """Raised when a patch cannot be applied cleanly."""


def _remove_readonly(func, path, exc_info):
    """Error handler for shutil.rmtree that clears read-only bits.

    On Windows, .git objects are often marked read-only, causing rmtree to
    fail.  This handler strips the read-only flag and retries the removal.
    """
    os.chmod(path, stat.S_IWRITE)
    func(path)


def _rmtree(path: str) -> None:
    """Remove a directory tree, handling read-only files on Windows."""
    shutil.rmtree(path, onerror=_remove_readonly)


def create_patched_copy(
    repository: str,
    patch_file: str,
) -> str:
    """Copy *repository* to a temp directory and apply *patch_file*.

    Returns the path to the patched copy.

    Raises:
        PatchApplicationError: if ``git apply`` fails.  The temporary
            directory is cleaned up before the exception propagates.
    """
    source = Path(repository).resolve()
    patch = Path(patch_file).resolve()

    temporary_directory = tempfile.mkdtemp(prefix="patchlens-")
    destination = Path(temporary_directory) / source.name

    try:
        shutil.copytree(source, destination)

        result = subprocess.run(
            ["git", "apply", str(patch)],
            cwd=destination,
            capture_output=True,
            text=True,
            # shell=False is the default; never use shell=True here.
        )

        if result.returncode != 0:
            raise PatchApplicationError(
                f"Patch could not be applied. "
                f"git apply exited {result.returncode}: {result.stderr.strip()}"
            )

    except PatchApplicationError:
        # Clean up the temp directory before re-raising so the caller does
        # not need to worry about it.
        _rmtree(temporary_directory)
        raise

    return str(destination)


def cleanup_patched_copy(patched_repository: str) -> None:
    """Remove the temporary directory that holds a patched repository copy."""
    temp_root = Path(patched_repository).parent
    if temp_root.exists():
        _rmtree(str(temp_root))
