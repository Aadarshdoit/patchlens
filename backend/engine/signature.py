from dataclasses import dataclass
from typing import Any


@dataclass
class FailureSignature:
    exception_type: str
    message: str
    location: str
    input_data: dict[str, Any]

import re


def parse_traceback(traceback: str) -> FailureSignature:
    exception_match = re.search(
        r"(\w+Error):\s*(.*)$",
        traceback,
        re.MULTILINE,
    )

    location_match = re.findall(
        r'File ".*[\\/](.*)", line (\d+),',
        traceback,
    )

    exception_type = exception_match.group(1) if exception_match else "Unknown"
    message = exception_match.group(2) if exception_match else ""

    if location_match:
        filename, line = location_match[-1]
        location = f"{filename}:{line}"
    else:
        location = "Unknown"

    return FailureSignature(
        exception_type=exception_type,
        message=message,
        location=location,
        input_data={},
    )    