import shutil
import subprocess
import tempfile
from pathlib import Path


def create_patched_copy(
    repository: str,
    patch_file: str,
) -> str:
    source = Path(repository).resolve()
    patch = Path(patch_file).resolve()

    temporary_directory = tempfile.mkdtemp(prefix="patchlens-")
    destination = Path(temporary_directory) / source.name

    shutil.copytree(source, destination)

    subprocess.run(
        ["git", "apply", str(patch)],
        cwd=destination,
        check=True,
    )

    return str(destination)