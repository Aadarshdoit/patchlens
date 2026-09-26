import subprocess
import sys
import time
from dataclasses import dataclass

# ---------------------------------------------------------------------------
# Timeout constant
# ---------------------------------------------------------------------------
TEST_TIMEOUT_SECONDS = 30


@dataclass
class TestSuiteResult:
    passed: bool
    exit_code: int
    duration: float
    stdout: str
    stderr: str
    timed_out: bool


def run_pytest(
    repository: str,
    timeout: int = TEST_TIMEOUT_SECONDS,
) -> TestSuiteResult:
    start = time.perf_counter()

    try:
        result = subprocess.run(
            [sys.executable, "-m", "pytest", "-q"],
            cwd=repository,
            capture_output=True,
            text=True,
            timeout=timeout,
            # shell=False is the default; never use shell=True here.
        )

        duration = time.perf_counter() - start

        return TestSuiteResult(
            passed=result.returncode == 0,
            exit_code=result.returncode,
            duration=duration,
            stdout=result.stdout,
            stderr=result.stderr,
            timed_out=False,
        )

    except subprocess.TimeoutExpired as error:
        duration = time.perf_counter() - start

        return TestSuiteResult(
            passed=False,
            exit_code=-1,
            duration=duration,
            stdout=error.stdout or "",
            stderr=error.stderr or "",
            timed_out=True,
        )
