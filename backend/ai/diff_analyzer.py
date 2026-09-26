from ai.provider import AIProvider
from ai.prompts import (
    DIFF_ANALYSIS_SYSTEM_PROMPT,
    EXPLANATION_SYSTEM_PROMPT,
    REGRESSION_SYSTEM_PROMPT,
)


class DiffAnalyzer:
    def __init__(self):
        self.ai = AIProvider()

    def analyze_diff(
        self,
        patch: str,
        original_failure: str,
    ) -> str:

        prompt = f"""
Original failure:

{original_failure}

Candidate patch:

{patch}

Analyze the candidate patch.
"""

        return self.ai.chat(
            DIFF_ANALYSIS_SYSTEM_PROMPT,
            prompt,
        )

    def generate_regression_test(
        self,
        failure_evidence: str,
        code_context: str,
    ) -> str:

        prompt = f"""
Original failure evidence:

{failure_evidence}

Relevant code:

{code_context}

Generate a focused pytest regression test.
"""

        return self.ai.chat(
            REGRESSION_SYSTEM_PROMPT,
            prompt,
        )

    def explain_result(
        self,
        verdict: str,
        reason: str,
        original_execution: str,
        patched_execution: str,
        tests: str,
        suspicious_checks: str,
    ) -> str:

        prompt = f"""
Deterministic verdict:

{verdict}

Deterministic reason:

{reason}

Original execution:

{original_execution}

Patched execution:

{patched_execution}

Existing test results:

{tests}

Suspicious checks:

{suspicious_checks}

Explain what the evidence means for a developer.
Do not change or reinterpret the verdict.
"""

        return self.ai.chat(
            EXPLANATION_SYSTEM_PROMPT,
            prompt,
        )