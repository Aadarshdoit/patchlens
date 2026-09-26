from dataclasses import dataclass

from engine.reproducer import ExecutionResult


@dataclass
class VerificationVerdict:
    status: str
    reason: str
    original_result: ExecutionResult
    patched_result: ExecutionResult


def determine_verdict(
    comparison: str,
    original_result: ExecutionResult,
    patched_result: ExecutionResult,
) -> VerificationVerdict:

    if comparison == "failure_resolved":
        return VerificationVerdict(
            status="VERIFIED",
            reason="The original failure no longer occurs after applying the patch.",
            original_result=original_result,
            patched_result=patched_result,
        )

    if comparison == "failure_persists":
        return VerificationVerdict(
            status="NOT_FIXED",
            reason="The original reproduction still fails after applying the patch.",
            original_result=original_result,
            patched_result=patched_result,
        )

    if comparison == "both_succeeded":
        return VerificationVerdict(
            status="INCONCLUSIVE",
            reason="The original reproduction did not fail, so there was no failure to verify.",
            original_result=original_result,
            patched_result=patched_result,
        )

    return VerificationVerdict(
        status="INCONCLUSIVE",
        reason="The verification result could not be determined.",
        original_result=original_result,
        patched_result=patched_result,
    )