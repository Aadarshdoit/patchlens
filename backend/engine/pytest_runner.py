import subprocess
import time
from dataclasses import dataclass


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
    timeout: int = 30,
) -> TestSuiteResult:
    start = time.perf_counter()

    try:
        result = subprocess.run(
            [__import__("sys").executable, "-m", "pytest", "-q"],
            cwd=repository,
            capture_output=True,
            text=True,
            timeout=timeout,
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