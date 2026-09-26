"""
Security-focused tests for PatchLens.

These tests verify the prototype-level hardening measures:
  1. Disallowed reproduction commands are rejected before subprocess creation.
  2. subprocess is never invoked with shell=True.
  3. Timeout is handled and returned as a structured result (not a crash).
  4. A malformed patch is handled with a controlled PatchApplicationError.
  5. Temporary verification directories are cleaned up after verify_patch.
  6. Valid benchmark commands (python, py) continue working.
  7. API rejects commands outside the allowlist with HTTP 400.
  8. API rejects paths outside the project root with HTTP 400.
"""
import subprocess
import tempfile
import textwrap
from pathlib import Path
from unittest.mock import MagicMock, patch

import pytest
from fastapi.testclient import TestClient

from engine.patcher import PatchApplicationError, create_patched_copy
from engine.reproducer import ALLOWED_COMMANDS, run_command
from main import app


PROJECT_ROOT = Path(__file__).resolve().parents[2]
DEMO_REPO = PROJECT_ROOT / "demo-repo"
GOOD_PATCH = PROJECT_ROOT / "benchmark" / "cases" / "CASE-001" / "good_patch.diff"

client = TestClient(app)


# ---------------------------------------------------------------------------
# 1. Disallowed reproduction command is rejected
# ---------------------------------------------------------------------------

class TestCommandAllowlist:
    def test_disallowed_command_raises_before_subprocess(self):
        """run_command must raise ValueError for non-allowlisted executables."""
        with pytest.raises(ValueError, match="not allowed"):
            run_command(["bash", "-c", "echo hi"], str(DEMO_REPO))

    def test_disallowed_cmd_raises(self):
        with pytest.raises(ValueError, match="not allowed"):
            run_command(["cmd", "/c", "echo hi"], str(DEMO_REPO))

    def test_disallowed_powershell_raises(self):
        with pytest.raises(ValueError, match="not allowed"):
            run_command(["powershell", "-Command", "echo hi"], str(DEMO_REPO))

    def test_empty_command_raises(self):
        with pytest.raises(ValueError, match="must not be empty"):
            run_command([], str(DEMO_REPO))

    def test_allowed_commands_present(self):
        """The expected set of allowed executables must be registered."""
        for cmd in ("python", "py", "python3", "pytest"):
            assert cmd in ALLOWED_COMMANDS, f"Expected '{cmd}' in ALLOWED_COMMANDS"


# ---------------------------------------------------------------------------
# 2. shell=True is never used in the engine
# ---------------------------------------------------------------------------

class TestNoShellExecution:
    """Verify that subprocess.run is never called with shell=True from the engine."""

    def _collect_subprocess_calls(self, fn, *args, **kwargs):
        """Call *fn* while patching subprocess.run and return all call kwargs."""
        calls = []
        original_run = subprocess.run

        def spy(*a, **kw):
            calls.append(kw)
            return original_run(*a, **kw)

        with patch("subprocess.run", side_effect=spy):
            try:
                fn(*args, **kwargs)
            except Exception:
                pass  # We only care about the captured call kwargs

        return calls

    def test_run_command_no_shell(self):
        """run_command must not pass shell=True to subprocess.run."""
        calls = []
        original_run = subprocess.run

        def spy(*a, **kw):
            calls.append(kw)
            return original_run(*a, **kw)

        with patch("engine.reproducer.subprocess.run", side_effect=spy):
            run_command(["python", "--version"], str(DEMO_REPO))

        assert calls, "subprocess.run was not called"
        for kw in calls:
            assert kw.get("shell") is not True, "shell=True found in run_command"

    def test_patcher_no_shell(self, tmp_path):
        """create_patched_copy must not pass shell=True to subprocess.run."""
        calls = []
        original_run = subprocess.run

        def spy(*a, **kw):
            calls.append(kw)
            return original_run(*a, **kw)

        # Use a real valid repo + patch so the subprocess actually runs.
        with patch("engine.patcher.subprocess.run", side_effect=spy):
            try:
                create_patched_copy(str(DEMO_REPO), str(GOOD_PATCH))
            except Exception:
                pass

        for kw in calls:
            assert kw.get("shell") is not True, "shell=True found in create_patched_copy"


# ---------------------------------------------------------------------------
# 3. Timeout is handled without crashing
# ---------------------------------------------------------------------------

class TestTimeoutHandling:
    def test_timeout_returns_timed_out_result(self):
        """A command that exceeds the timeout should return timed_out=True."""
        result = run_command(
            ["python", "-c", "import time; time.sleep(60)"],
            str(DEMO_REPO),
            timeout=1,
        )
        assert result.timed_out is True
        assert result.exit_code == -1


# ---------------------------------------------------------------------------
# 4. Malformed patch produces controlled PatchApplicationError
# ---------------------------------------------------------------------------

class TestMalformedPatch:
    def test_bad_patch_raises_patch_application_error(self, tmp_path):
        """A nonsense patch must raise PatchApplicationError, not CalledProcessError."""
        bad_patch = tmp_path / "bad.diff"
        bad_patch.write_text("this is not a valid patch\n", encoding="utf-8")

        with pytest.raises(PatchApplicationError, match="Patch could not be applied"):
            create_patched_copy(str(DEMO_REPO), str(bad_patch))

    def test_bad_patch_no_temp_dir_leak(self, tmp_path):
        """After a failed patch application, no patchlens- temp dir should remain."""
        import glob as glob_mod
        import os

        bad_patch = tmp_path / "bad.diff"
        bad_patch.write_text("garbage patch content\n", encoding="utf-8")

        tmpdir = tempfile.gettempdir()
        before = set(glob_mod.glob(os.path.join(tmpdir, "patchlens-*")))

        with pytest.raises(PatchApplicationError):
            create_patched_copy(str(DEMO_REPO), str(bad_patch))

        after = set(glob_mod.glob(os.path.join(tmpdir, "patchlens-*")))
        leaked = after - before
        assert not leaked, f"Temp directories leaked after failed patch: {leaked}"


# ---------------------------------------------------------------------------
# 5. Temporary directory is cleaned up after successful verify_patch
# ---------------------------------------------------------------------------

class TestTempDirCleanup:
    def test_temp_dir_cleaned_up_after_verify(self):
        """After verify_patch completes, the patchlens- temp directory must be gone."""
        import glob as glob_mod
        import os
        from engine.verifier import verify_patch

        tmpdir = tempfile.gettempdir()
        before = set(glob_mod.glob(os.path.join(tmpdir, "patchlens-*")))

        verify_patch(
            repository=str(DEMO_REPO),
            patch_file=str(GOOD_PATCH),
            reproduction_command=["python", "reproduce.py"],
        )

        after = set(glob_mod.glob(os.path.join(tmpdir, "patchlens-*")))
        leaked = after - before
        assert not leaked, f"Temp directories were not cleaned up: {leaked}"


# ---------------------------------------------------------------------------
# 6. Valid benchmark commands continue working
# ---------------------------------------------------------------------------

class TestAllowedCommandsWork:
    def test_python_command_works(self):
        result = run_command(["python", "--version"], str(DEMO_REPO))
        assert result.timed_out is False
        assert result.exit_code == 0

    @pytest.mark.parametrize("cmd", ["python", "py"])
    def test_benchmark_reproduce_command(self, cmd):
        """Both 'python' and 'py' reproduce commands must run without rejection."""
        result = run_command([cmd, "reproduce.py"], str(DEMO_REPO))
        # The script exits non-zero (that is the expected failure under test),
        # but it must not raise a ValueError (command rejection).
        assert result.timed_out is False


# ---------------------------------------------------------------------------
# 7. API rejects commands outside the allowlist with HTTP 400
# ---------------------------------------------------------------------------

class TestAPICommandValidation:
    def _verify_request(self, command: list[str]) -> dict:
        return client.post(
            "/api/verify",
            json={
                "repository": str(DEMO_REPO),
                "patch_file": str(GOOD_PATCH),
                "reproduction_command": command,
            },
        )

    def test_api_rejects_bash(self):
        response = self._verify_request(["bash", "-c", "echo hi"])
        assert response.status_code == 400
        assert "not permitted" in response.json()["detail"]

    def test_api_rejects_empty_command(self):
        response = self._verify_request([])
        assert response.status_code == 400

    def test_api_accepts_python(self):
        response = self._verify_request(["python", "reproduce.py"])
        # Should proceed to verification (not rejected at command validation).
        # Status code will be 200 (verified/not_fixed/inconclusive), not 400.
        assert response.status_code == 200


# ---------------------------------------------------------------------------
# 8. API rejects paths outside the project root with HTTP 400
# ---------------------------------------------------------------------------

class TestAPIPathValidation:
    def test_api_rejects_repository_outside_root(self):
        response = client.post(
            "/api/verify",
            json={
                "repository": "C:\\Windows\\System32",
                "patch_file": str(GOOD_PATCH),
                "reproduction_command": ["python", "reproduce.py"],
            },
        )
        assert response.status_code == 400
        assert "project directory" in response.json()["detail"]

    def test_api_rejects_patch_outside_root(self):
        response = client.post(
            "/api/verify",
            json={
                "repository": str(DEMO_REPO),
                "patch_file": "C:\\Windows\\System32\\drivers\\etc\\hosts",
                "reproduction_command": ["python", "reproduce.py"],
            },
        )
        assert response.status_code == 400
        assert "project directory" in response.json()["detail"]

    def test_api_rejects_path_traversal(self):
        traversal = str(DEMO_REPO / ".." / ".." / ".." / "etc" / "passwd")
        response = client.post(
            "/api/verify",
            json={
                "repository": traversal,
                "patch_file": str(GOOD_PATCH),
                "reproduction_command": ["python", "reproduce.py"],
            },
        )
        # Resolves outside project root → 400 or 404 (resolved path DNE).
        assert response.status_code in (400, 404)
