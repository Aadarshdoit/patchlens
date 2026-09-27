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
    *,
    ignore_whitespace: bool = False,
) -> str:
    """Copy *repository* to a temp directory and apply *patch_file*.

    Returns the path to the patched copy.

    Args:
        repository: path to the source repository directory.
        patch_file: path to the ``.diff`` or ``.patch`` file to apply.
        ignore_whitespace: when ``True``, pass ``--ignore-whitespace`` to
            ``git apply``.  This is needed when the patch was generated with
            one line-ending convention (e.g. LF) and the target files use
            another (e.g. CRLF).  Defaults to ``False`` so existing callers
            are unaffected.

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

        cmd = ["git", "apply"]
        if ignore_whitespace:
            cmd.append("--ignore-whitespace")
        cmd.append(str(patch))

        result = subprocess.run(
            cmd,
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
