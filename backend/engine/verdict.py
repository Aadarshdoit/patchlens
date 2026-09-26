from dataclasses import dataclass

from engine.pytest_runner import TestSuiteResult
from engine.reproducer import ExecutionResult


@dataclass
class VerificationVerdict:
    status: str
    reason: str
    original_result: ExecutionResult
    patched_result: ExecutionResult
    test_result: TestSuiteResult


def determine_verdict(
    comparison: str,
    original_result: ExecutionResult,
    patched_result: ExecutionResult,
    test_result: TestSuiteResult,
) -> VerificationVerdict:

    if comparison == "failure_resolved":
        if test_result.passed:
            return VerificationVerdict(
                status="VERIFIED",
                reason=(
                    "The original failure was resolved and the existing "
                    "test suite passed after the patch."
                ),
                original_result=original_result,
                patched_result=patched_result,
                test_result=test_result,
            )

        return VerificationVerdict(
            status="INCONCLUSIVE",
            reason=(
                "The original failure was resolved, but the patched "
                "code introduced a regression in the existing test suite."
            ),
            original_result=original_result,
            patched_result=patched_result,
            test_result=test_result,
        )

    if comparison == "failure_persists":
        return VerificationVerdict(
            status="NOT_FIXED",
            reason="The original failure still occurs after applying the patch.",
            original_result=original_result,
            patched_result=patched_result,
            test_result=test_result,
        )

    if comparison == "different_failure":
        return VerificationVerdict(
            status="INCONCLUSIVE",
            reason=(
                "The original failure disappeared, but the patched code "
                "produced a different failure."
            ),
            original_result=original_result,
            patched_result=patched_result,
            test_result=test_result,
        )

    if comparison == "new_failure":
        return VerificationVerdict(
            status="INCONCLUSIVE",
            reason=(
                "The original reproduction succeeded, but the patched "
                "code introduced a failure."
            ),
            original_result=original_result,
            patched_result=patched_result,
            test_result=test_result,
        )

    if comparison == "both_succeeded":
        return VerificationVerdict(
            status="INCONCLUSIVE",
            reason=(
                "The original reproduction did not fail, so there was "
                "no failure to verify."
            ),
            original_result=original_result,
            patched_result=patched_result,
            test_result=test_result,
        )

    return VerificationVerdict(
        status="INCONCLUSIVE",
        reason="The verification result could not be determined.",
        original_result=original_result,
        patched_result=patched_result,
        test_result=test_result,
    )