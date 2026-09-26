from pathlib import Path

from engine.verifier import verify_patch


def test_case_001_good_patch():
    project_root = Path(__file__).resolve().parents[2]

    demo_repo = project_root / "demo-repo"
    patch_file = project_root / "benchmark" / "cases" / "CASE-001" / "good_patch.diff"

    verdict = verify_patch(
        repository=str(demo_repo),
        patch_file=str(patch_file),
        reproduction_command=["py", "reproduce.py"],
    )

    assert verdict.status == "VERIFIED"
    assert verdict.original_result.exit_code != 0
    assert verdict.patched_result.exit_code == 0


def test_case_001_bad_patch():
    project_root = Path(__file__).resolve().parents[2]

    demo_repo = project_root / "demo-repo"
    patch_file = project_root / "benchmark" / "cases" / "CASE-001" / "bad_patch.diff"

    verdict = verify_patch(
        repository=str(demo_repo),
        patch_file=str(patch_file),
        reproduction_command=["python", "reproduce.py"],
    )

    assert verdict.status == "NOT_FIXED"
    assert verdict.original_result.exit_code != 0
    assert verdict.patched_result.exit_code != 0
    assert "TypeError" in verdict.patched_result.stderr