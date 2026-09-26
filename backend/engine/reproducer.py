import subprocess
import time
from dataclasses import dataclass

# ---------------------------------------------------------------------------
# Timeout constants
# ---------------------------------------------------------------------------
REPRODUCTION_TIMEOUT_SECONDS = 10

# ---------------------------------------------------------------------------
# Command allowlist
# ---------------------------------------------------------------------------
# Only the first token of a reproduction command is checked.
# This prevents trivially obvious misuse while keeping the prototype working
# for all current benchmark cases.  It is NOT a full sandbox.
ALLOWED_COMMANDS = {"python", "py", "python3", "pytest"}


def _validate_command(command: list[str]) -> None:
    """Raise ValueError if the command's first token is not on the allowlist."""
    if not command:
        raise ValueError("Reproduction command must not be empty.")
    executable = command[0].lower()
    if executable not in ALLOWED_COMMANDS:
        raise ValueError(
            f"Reproduction command '{command[0]}' is not allowed. "
            f"Permitted executables: {sorted(ALLOWED_COMMANDS)}"
        )


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
    timeout: int = REPRODUCTION_TIMEOUT_SECONDS,
) -> ExecutionResult:
    _validate_command(command)

    start = time.perf_counter()

    try:
        result = subprocess.run(
            command,
            cwd=working_directory,
            capture_output=True,
            text=True,
            timeout=timeout,
            # shell=False is the default; never use shell=True here.
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
