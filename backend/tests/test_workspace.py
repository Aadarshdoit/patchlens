"""
Tests for engine.workspace — ZIP extraction and project validation.
"""
import io
import zipfile
from pathlib import Path

import pytest

from engine.workspace import (
    MAX_ZIP_BYTES,
    WorkspaceError,
    cleanup_workspace,
    extract_project_zip,
    validate_python_project,
)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _make_zip(files: dict) -> bytes:
    """Return a ZIP archive bytes containing the given {name: content} dict."""
    buf = io.BytesIO()
    with zipfile.ZipFile(buf, "w") as zf:
        for name, content in files.items():
            zf.writestr(name, content)
    return buf.getvalue()


# ---------------------------------------------------------------------------
# extract_project_zip
# ---------------------------------------------------------------------------

class TestExtractProjectZip:
    def test_valid_zip_extracts(self):
        zb = _make_zip({"myproject/reproduce.py": "print('hello')"})
        project_dir = extract_project_zip(zb)
        try:
            assert Path(project_dir).exists()
            assert (Path(project_dir) / "reproduce.py").exists()
        finally:
            cleanup_workspace(project_dir)

    def test_not_a_zip_raises(self):
        with pytest.raises(WorkspaceError, match="Invalid ZIP"):
            extract_project_zip(b"this is not a zip")

    def test_oversized_zip_raises(self):
        oversized = b"x" * (MAX_ZIP_BYTES + 1)
        with pytest.raises(WorkspaceError, match="too large"):
            extract_project_zip(oversized)

    def test_path_traversal_rejected(self):
        buf = io.BytesIO()
        with zipfile.ZipFile(buf, "w") as zf:
            # Manually write a member with traversal path
            info = zipfile.ZipInfo("../evil.py")
            zf.writestr(info, "malicious content")
        with pytest.raises(WorkspaceError, match="unsafe paths"):
            extract_project_zip(buf.getvalue())

    def test_absolute_path_rejected(self):
        buf = io.BytesIO()
        with zipfile.ZipFile(buf, "w") as zf:
            info = zipfile.ZipInfo("/etc/passwd")
            zf.writestr(info, "root:x:0:0::")
        with pytest.raises(WorkspaceError, match="unsafe paths"):
            extract_project_zip(buf.getvalue())

    def test_cleanup_on_traversal_error(self, tmp_path):
        """After a traversal error, no patchlens-upload- dir should remain."""
        import glob, os, tempfile
        tmpdir = tempfile.gettempdir()
        before = set(glob.glob(os.path.join(tmpdir, "patchlens-upload-*")))

        buf = io.BytesIO()
        with zipfile.ZipFile(buf, "w") as zf:
            info = zipfile.ZipInfo("../evil.py")
            zf.writestr(info, "bad")

        with pytest.raises(WorkspaceError):
            extract_project_zip(buf.getvalue())

        after = set(glob.glob(os.path.join(tmpdir, "patchlens-upload-*")))
        leaked = after - before
        assert not leaked, f"Temp dirs leaked: {leaked}"

    def test_single_top_level_dir_unwrapped(self):
        """If the ZIP has a single top-level directory, return that as project_dir."""
        zb = _make_zip({
            "myapp/reproduce.py": "print('hi')",
            "myapp/app/code.py": "x = 1",
        })
        project_dir = extract_project_zip(zb)
        try:
            assert Path(project_dir).name == "myapp"
        finally:
            cleanup_workspace(project_dir)


# ---------------------------------------------------------------------------
# validate_python_project
# ---------------------------------------------------------------------------

class TestValidatePythonProject:
    def test_valid_project_passes(self):
        zb = _make_zip({"myproject/reproduce.py": "print('hello')"})
        project_dir = extract_project_zip(zb)
        try:
            # Should not raise
            validate_python_project(project_dir, "reproduce.py")
        finally:
            cleanup_workspace(project_dir)

    def test_no_python_files_raises(self):
        zb = _make_zip({"myproject/README.txt": "just a readme"})
        project_dir = extract_project_zip(zb)
        try:
            with pytest.raises(WorkspaceError, match="No Python project files"):
                validate_python_project(project_dir, "reproduce.py")
        finally:
            cleanup_workspace(project_dir)

    def test_missing_repro_script_raises(self):
        zb = _make_zip({"myproject/app.py": "print('hello')"})
        project_dir = extract_project_zip(zb)
        try:
            with pytest.raises(WorkspaceError, match="not found"):
                validate_python_project(project_dir, "reproduce.py")
        finally:
            cleanup_workspace(project_dir)


# ---------------------------------------------------------------------------
# cleanup_workspace
# ---------------------------------------------------------------------------

class TestCleanupWorkspace:
    def test_cleanup_removes_dir(self):
        zb = _make_zip({"myproject/reproduce.py": "print('hi')"})
        project_dir = extract_project_zip(zb)
        workspace_root = str(Path(project_dir).parent)
        assert Path(workspace_root).exists()
        cleanup_workspace(project_dir)
        assert not Path(workspace_root).exists()

    def test_cleanup_idempotent(self):
        """Calling cleanup_workspace twice must not raise."""
        zb = _make_zip({"myproject/reproduce.py": "print('hi')"})
        project_dir = extract_project_zip(zb)
        cleanup_workspace(project_dir)
        cleanup_workspace(project_dir)  # second call — must not raise
