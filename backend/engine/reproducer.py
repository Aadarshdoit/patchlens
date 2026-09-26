import subprocess
import time
from dataclasses import dataclass


@dataclass
class ExecutionResult:
    stdout: str
    stderr: str
    exit_code: int
    duration: float
    timed_out: bool


def run_command(
    command: list[str],
    working_directory: str,
    timeout: int = 10,
) -> ExecutionResult:
    start = time.perf_counter()

    try:
        result = subprocess.run(
            command,
            cwd=working_directory,
            capture_output=True,
            text=True,
            timeout=timeout,
        )

        duration = time.perf_counter() - start

        return ExecutionResult(
            stdout=result.stdout,
            stderr=result.stderr,
            exit_code=result.returncode,
            duration=duration,
            timed_out=False,
        )

    except subprocess.TimeoutExpired as error:
        duration = time.perf_counter() - start

        return ExecutionResult(
            stdout=error.stdout or "",
            stderr=error.stderr or "",
            exit_code=-1,
            duration=duration,
            timed_out=True,
        )