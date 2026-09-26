from pathlib import Path

from engine.patcher import create_patched_copy


def test_create_patched_copy():
    project_root = Path(__file__).resolve().parents[2]
    demo_repo = project_root / "demo-repo"
    patch_file = project_root / "benchmark" / "good_fix.diff"

    patched_repo = create_patched_copy(
        str(demo_repo),
        str(patch_file),
    )

    patched_file = Path(patched_repo) / "app" / "student_service.py"

    content = patched_file.read_text()

    assert "STUDENTS.get(student_id)" in content
    assert "STUDENTS[student_id]" not in content