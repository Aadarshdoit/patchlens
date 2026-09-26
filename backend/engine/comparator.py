from engine.reproducer import ExecutionResult
from engine.signature import parse_traceback


def compare_execution(
    original: ExecutionResult,
    patched: ExecutionResult,
) -> str:
    if original.exit_code != 0 and patched.exit_code == 0:
        return "failure_resolved"

    if original.exit_code == 0 and patched.exit_code == 0:
        return "both_succeeded"

    if original.exit_code == 0 and patched.exit_code != 0:
        return "new_failure"

    original_signature = parse_traceback(original.stderr)
    patched_signature = parse_traceback(patched.stderr)

    same_exception = (
        original_signature.exception_type
        == patched_signature.exception_type
    )

    same_message = (
        original_signature.message
        == patched_signature.message
    )

    if same_exception and same_message:
        return "failure_persists"

    return "different_failure"