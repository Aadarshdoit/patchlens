from engine.reproducer import ExecutionResult


def compare_execution(
    original: ExecutionResult,
    patched: ExecutionResult,
) -> str:
    if original.exit_code != 0 and patched.exit_code == 0:
        return "failure_resolved"

    if original.exit_code != 0 and patched.exit_code != 0:
        return "failure_persists"

    if original.exit_code == 0 and patched.exit_code == 0:
        return "both_succeeded"

    return "unexpected"