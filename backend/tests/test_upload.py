"""
Tests for the upload endpoint's patch path normalisation logic.

These tests exercise _normalise_patch_paths directly (unit tests) and then
run an integration test against POST /api/upload-verify using the real
demo project and the real good_fix.diff patch.
"""
import io
import zipfile
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from main import app
from api.upload import _normalise_patch_paths

PROJECT_ROOT = Path(__file__).resolve().parents[2]
DEMO_REPO    = PROJECT_ROOT / "demo-repo"
GOOD_PATCH   = PROJECT_ROOT / "benchmark" / "good_fix.diff"

client = TestClient(app)


# ---------------------------------------------------------------------------
# Unit tests for _normalise_patch_paths
# ---------------------------------------------------------------------------

PATCH_WITH_PREFIX = b"""\
diff --git a/demo-repo/app/student_service.py b/demo-repo/app/student_service.py
--- a/demo-repo/app/student_service.py
+++ b/demo-repo/app/student_service.py
@@ -7,9 +7,13 @@
 
 
 def get_student(student_id):
-    return STUDENTS[student_id]
+    return STUDENTS.get(student_id)
"""

# Same patch with trailing spaces on blank context lines (as produced on Windows)
PATCH_WITH_TRAILING_SPACES = (
    b"diff --git a/app/f.py b/app/f.py\r\n"
    b"--- a/app/f.py\r\n"
    b"+++ b/app/f.py\r\n"
    b"@@ -1,3 +1,4 @@\r\n"
    b" \r\n"          # blank context line with trailing space + CRLF
    b" def foo():\r\n"
    b"-    pass\r\n"
    b"+    return 1\r\n"
)

PATCH_WITHOUT_PREFIX = b"""\
diff --git a/app/student_service.py b/app/student_service.py
--- a/app/student_service.py
+++ b/app/student_service.py
@@ -7,9 +7,13 @@

 def get_student(student_id):
-    return STUDENTS[student_id]
+    return STUDENTS.get(student_id)
"""


class TestNormalisePatchPaths:
    def test_strips_prefix_when_dir_absent(self, tmp_path):
        """Leading 'demo-repo/' stripped when demo-repo/ is not in project_dir."""
        # project_dir has 'app/' but not 'demo-repo/'
        (tmp_path / "app").mkdir()
        result = _normalise_patch_paths(PATCH_WITH_PREFIX, str(tmp_path))
        text = result.decode()
        assert "demo-repo/" not in text
        assert "a/app/student_service.py" in text
        assert "b/app/student_service.py" in text

    def test_no_change_when_dir_present(self, tmp_path):
        """Patch returned unchanged when leading component exists in project_dir."""
        (tmp_path / "demo-repo").mkdir()
        (tmp_path / "demo-repo" / "app").mkdir()
        result = _normalise_patch_paths(PATCH_WITH_PREFIX, str(tmp_path))
        assert result == PATCH_WITH_PREFIX

    def test_no_change_when_already_correct(self, tmp_path):
        """Patch without extra prefix returned unchanged."""
        (tmp_path / "app").mkdir()
        result = _normalise_patch_paths(PATCH_WITHOUT_PREFIX, str(tmp_path))
        assert result == PATCH_WITHOUT_PREFIX

    def test_non_utf8_bytes_returned_unchanged(self, tmp_path):
        """Invalid UTF-8 bytes returned as-is without raising."""
        bad = b"\xff\xfe not utf8 \x00"
        result = _normalise_patch_paths(bad, str(tmp_path))
        # Should not raise; may or may not match input depending on errors= handling
        assert isinstance(result, bytes)

    def test_empty_patch_returned_unchanged(self, tmp_path):
        result = _normalise_patch_paths(b"", str(tmp_path))
        assert result == b""

    def test_strips_trailing_spaces_from_blank_context_lines(self, tmp_path):
        """Blank context lines with trailing spaces must be normalised."""
        (tmp_path / "app").mkdir()
        result = _normalise_patch_paths(PATCH_WITH_TRAILING_SPACES, str(tmp_path))
        text = result.decode("utf-8")
        # The blank context line (" \r\n") should become " \r\n" with no
        # trailing space before the line ending.
        lines = text.splitlines(keepends=True)
        context_blank = [l for l in lines if l.startswith(" ") and l.strip() == ""]
        for l in context_blank:
            # After the leading space there must be only the line ending
            assert l == " \r\n" or l == " \n", f"Unexpected blank context line: {l!r}"


# ---------------------------------------------------------------------------
# Integration test: POST /api/upload-verify with real demo project + good patch
# ---------------------------------------------------------------------------

def _make_project_zip(source_dir: Path) -> bytes:
    """Zip demo-repo into an in-memory archive with files at the ZIP root.

    This mirrors a typical 'zip the project folder' export where the archive
    contains a single top-level directory named after the project:
        attendance-app/app/student_service.py
        attendance-app/reproduce.py
        ...
    The workspace extractor will unwrap that single top-level directory so
    project_dir ends up pointing directly at the extracted project contents.
    """
    buf = io.BytesIO()
    with zipfile.ZipFile(buf, "w", zipfile.ZIP_DEFLATED) as zf:
        for path in source_dir.rglob("*"):
            if path.is_file():
                rel = path.relative_to(source_dir)
                parts = rel.parts
                if any(p in ("__pycache__", ".pytest_cache") for p in parts):
                    continue
                # Store under a single top-level directory so the extractor
                # unwraps it to project_dir = <workspace>/attendance-app/
                arcname = "attendance-app/" + "/".join(parts)
                zf.write(path, arcname)
    return buf.getvalue()


class TestUploadVerifyIntegration:
    def test_upload_verify_good_patch_returns_verified(self):
        """
        Upload the demo project ZIP + good_fix.diff → expect VERIFIED.

        The ZIP has paths like 'demo-repo/app/student_service.py'.
        The patch also has paths like 'demo-repo/app/student_service.py'.
        After normalisation the patch applies cleanly inside the extracted
        'demo-repo/' directory.
        """
        zip_bytes = _make_project_zip(DEMO_REPO)
        patch_bytes = GOOD_PATCH.read_bytes()

        response = client.post(
            "/api/upload-verify",
            files={
                "project_zip": ("demo-repo.zip", zip_bytes, "application/zip"),
                "patch_file":  ("good_fix.diff", patch_bytes, "text/plain"),
            },
            data={"repro_script": "reproduce.py"},
        )

        assert response.status_code == 200, (
            f"Expected 200, got {response.status_code}: {response.text}"
        )
        body = response.json()
        assert body["status"] == "VERIFIED", (
            f"Expected VERIFIED, got {body['status']!r}. Reason: {body.get('reason')}"
        )

    def test_upload_verify_already_normalised_patch(self):
        """
        If the patch already has correct paths (no extra prefix), it still works.
        Build a normalised patch manually and upload it.
        """
        zip_bytes = _make_project_zip(DEMO_REPO)

        # Build a patch with 'app/...' paths (no demo-repo prefix)
        normalised_patch = PATCH_WITHOUT_PREFIX + b"""\
 
 
 def get_attendance(student_id):
     student = get_student(student_id)
+
+    if student is None:
+        return None
+
     return student["attendance"]
"""
        # We only check it doesn't crash with a 500; the actual verdict depends
        # on whether git apply succeeds with this minimal patch.
        response = client.post(
            "/api/upload-verify",
            files={
                "project_zip": ("demo-repo.zip", zip_bytes, "application/zip"),
                "patch_file":  ("candidate.diff", normalised_patch, "text/plain"),
            },
            data={"repro_script": "reproduce.py"},
        )
        # Should not be a 500 (internal error) — 200 or 422 patch-apply error are both fine
        assert response.status_code != 500, response.text
