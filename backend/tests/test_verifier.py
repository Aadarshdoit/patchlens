from pathlib import Path

from engine.verifier import verify_patch


def test_verify_good_patch():
    project_root = Path(__file__).resolve().parents[2]

    demo_repo = project_root / "demo-repo"
    patch_file = project_root / "benchmark" / "good_fix.diff"

    verdict = verify_patch(
        repository=str(demo_repo),
        patch_file=str(patch_file),
        reproduction_command=["python", "reproduce.py"],
        ignore_whitespace=True,
    )

    assert verdict.status == "VERIFIED"
    assert verdict.original_result.exit_code != 0
    assert verdict.patched_result.exit_code == 0
    assert "KeyError: 999" in verdict.original_result.stderr
    assert verdict.patched_result.stderr == ""