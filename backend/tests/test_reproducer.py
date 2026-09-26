from pathlib import Path

from engine.reproducer import run_command


def test_run_command():
    demo_repo = Path(__file__).resolve().parents[2] / "demo-repo"

    result = run_command(
        ["python", "reproduce.py"],
        str(demo_repo),
    )

    assert result.exit_code != 0
    assert "KeyError: 999" in result.stderr
    assert result.timed_out is False