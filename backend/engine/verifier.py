from engine.comparator import compare_execution
from engine.patcher import create_patched_copy
from engine.pytest_runner import run_pytest
from engine.reproducer import run_command
from engine.suspicious_fix import analyze_patch
from engine.verdict import determine_verdict


def verify_patch(
    repository: str,
    patch_file: str,
    reproduction_command: list[str],
) -> object:

    original_result = run_command(
        reproduction_command,
        repository,
    )

    patched_repository = create_patched_copy(
        repository,
        patch_file,
    )

    patched_result = run_command(
        reproduction_command,
        patched_repository,
    )

    test_result = run_pytest(
        patched_repository,
    )

    with open(patch_file, "r", encoding="utf-8") as file:
        patch_content = file.read()

    suspicious_checks = analyze_patch(patch_content)

    comparison = compare_execution(
        original_result,
        patched_result,
    )

    verdict = determine_verdict(
        comparison,
        original_result,
        patched_result,
        test_result,
    )

    verdict.suspicious_checks = suspicious_checks

    return verdict