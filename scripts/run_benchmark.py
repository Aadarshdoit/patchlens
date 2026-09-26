"""
PatchLens Benchmark Runner
==========================
Discovers all benchmark cases (CASE-001 through CASE-NNN), runs each one
through the existing PatchLens verification engine, and compares the actual
results against the expectations recorded in expected.json.

Usage (from the project root):
    python scripts/run_benchmark.py
"""
import json
import sys
from pathlib import Path

# ---------------------------------------------------------------------------
# Path setup: the engine lives inside backend/, so add it to sys.path.
# ---------------------------------------------------------------------------
PROJECT_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(PROJECT_ROOT / "backend"))

from engine.verifier import verify_patch  # noqa: E402  (import after path setup)

CASES_DIR = PROJECT_ROOT / "benchmark" / "cases"
DEMO_REPO = PROJECT_ROOT / "demo-repo"


def load_json(path: Path) -> dict:
    with path.open(encoding="utf-8") as fh:
        return json.load(fh)


def resolve_repository(bug: dict, case_dir: Path) -> Path:
    """Return the absolute path to the case repository.

    For CASE-001 the repository field is 'demo-repo' (project-level).
    For new cases the field is a relative path from the project root,
    e.g. 'benchmark/cases/CASE-002/repo'.
    """
    repo_field = bug.get("repository", "")
    candidate = PROJECT_ROOT / repo_field
    if candidate.is_dir():
        return candidate
    # Fallback: treat as a 'repo' subdirectory inside the case directory.
    return case_dir / "repo"


def run_case(case_dir: Path) -> dict:
    """Run both patches for a single benchmark case and return a result dict."""
    bug = load_json(case_dir / "bug.json")
    expected = load_json(case_dir / "expected.json")

    case_id = bug["id"]
    reproduction_command = bug["reproduction_command"]
    repository = resolve_repository(bug, case_dir)

    results = {"id": case_id, "patches": {}}

    for patch_name in ("good_patch", "bad_patch"):
        patch_file = case_dir / f"{patch_name}.diff"
        if not patch_file.exists():
            results["patches"][patch_name] = {"error": f"{patch_file.name} not found"}
            continue

        exp = expected.get(patch_name, {})
        expected_status = exp.get("expected_status", "")
        expected_suspicious = set(exp.get("expected_suspicious", []))

        try:
            verdict = verify_patch(
                repository=str(repository),
                patch_file=str(patch_file),
                reproduction_command=reproduction_command,
            )
        except Exception as exc:
            results["patches"][patch_name] = {
                "error": str(exc),
                "pass": False,
            }
            continue

        actual_status = verdict.status
        detected_suspicious = {
            c.name for c in verdict.suspicious_checks if c.detected
        }

        status_ok = actual_status == expected_status
        suspicious_ok = detected_suspicious == expected_suspicious

        results["patches"][patch_name] = {
            "actual_status": actual_status,
            "expected_status": expected_status,
            "status_ok": status_ok,
            "detected_suspicious": sorted(detected_suspicious),
            "expected_suspicious": sorted(expected_suspicious),
            "suspicious_ok": suspicious_ok,
            "pass": status_ok and suspicious_ok,
        }

    return results


def print_summary(all_results: list[dict]) -> int:
    """Print a concise benchmark summary. Returns exit code (0 = all pass)."""
    print()
    print("PatchLens Benchmark")
    print("=" * 62)
    print(f"{'CASE':<12}{'PATCH':<14}{'STATUS':<16}{'SUSPICIOUS':<20}{'RESULT'}")
    print("-" * 62)

    total = 0
    passed = 0

    for case_result in all_results:
        case_id = case_result["id"]
        for patch_name, pr in case_result["patches"].items():
            total += 1
            label = patch_name.replace("_", " ")
            if "error" in pr:
                print(f"{case_id:<12}{label:<14}{'ERROR':<16}{pr['error']:<20}FAIL")
                continue

            status = pr["actual_status"]
            sus_list = ", ".join(pr["detected_suspicious"]) or "none"
            result_str = "PASS" if pr["pass"] else "FAIL"
            if pr["pass"]:
                passed += 1

            mismatch = ""
            if not pr["status_ok"]:
                mismatch += f" (expected {pr['expected_status']})"
            if not pr["suspicious_ok"]:
                exp_sus = ", ".join(pr["expected_suspicious"]) or "none"
                mismatch += f" (expected suspicious: {exp_sus})"

            print(
                f"{case_id:<12}{label:<14}{status:<16}{sus_list:<20}"
                f"{result_str}{mismatch}"
            )

    print("-" * 62)
    print(f"Result: {passed}/{total} passed")
    print()
    return 0 if passed == total else 1


def main() -> int:
    if not CASES_DIR.is_dir():
        print(f"ERROR: cases directory not found: {CASES_DIR}", file=sys.stderr)
        return 2

    case_dirs = sorted(
        d for d in CASES_DIR.iterdir()
        if d.is_dir() and d.name.startswith("CASE-")
    )

    if not case_dirs:
        print("No benchmark cases found.", file=sys.stderr)
        return 2

    print(f"Discovering {len(case_dirs)} benchmark case(s)...", flush=True)

    all_results = []
    for case_dir in case_dirs:
        print(f"  Running {case_dir.name}...", end=" ", flush=True)
        try:
            result = run_case(case_dir)
            all_results.append(result)
            outcomes = [p["pass"] for p in result["patches"].values() if "pass" in p]
            overall = "OK" if all(outcomes) else "FAIL"
            print(overall)
        except Exception as exc:
            print(f"ERROR: {exc}")
            all_results.append({"id": case_dir.name, "patches": {}, "error": str(exc)})

    return print_summary(all_results)


if __name__ == "__main__":
    sys.exit(main())
