# PatchLens Benchmark

A reproducible evaluation suite for the PatchLens patch-verification engine.

---

## What PatchLens benchmarks

PatchLens decides whether a candidate patch genuinely fixes a reported bug.  
For each benchmark case the engine:

1. Runs the reproduction script against the **unpatched** repository and confirms the expected failure.
2. Applies the patch to a temporary copy of the repository.
3. Runs the reproduction script again against the **patched** copy.
4. Runs the repository's **pytest suite** against the patched copy.
5. Analyses the diff for **suspicious patterns**.
6. Compares original and patched failure signatures to produce a **verdict**.

---

## Benchmark cases

| Case | Purpose | Bad-patch expected verdict |
|------|---------|---------------------------|
| CASE-001 | Baseline happy-path | `INCONCLUSIVE` (different failure) |
| CASE-002 | `NOT_FIXED` — original failure persists after the patch | `NOT_FIXED` |
| CASE-003 | `INCONCLUSIVE` — original failure disappears but a new, different failure appears | `INCONCLUSIVE` |
| CASE-004 | Suspicious: **Exception swallowing** detected | `VERIFIED` + flag |
| CASE-005 | Suspicious: **Hardcoded failing input** detected | `VERIFIED` + flag |
| CASE-006 | Suspicious: **Test modification** detected | `VERIFIED` + flag |

Each case lives in `benchmark/cases/CASE-NNN/` and contains:

```
bug.json          — case metadata and original failure description
bad_patch.diff    — a patch that does NOT properly fix the bug
good_patch.diff   — a patch that genuinely fixes the bug
expected.json     — expected verdict and suspicious checks for each patch
repo/             — minimal self-contained Python repository with the bug
```

---

## Verdicts

### VERIFIED
The reproduction script exits cleanly after the patch **and** the pytest suite passes.  
The patch provably resolves the original failure without introducing regressions.

### NOT_FIXED
The reproduction script still exits with a non-zero code after the patch, and the
failure signature (exception type + message) matches the original.  
The patch made no effective change to the bug path.

### INCONCLUSIVE
One of several conditions:

- **Different failure** — the original exception is gone but a new exception has appeared.
  The comparator sees a different exception type or message.
- **Test regression** — the reproduction succeeds but the pytest suite now fails.
- **New failure** — the original reproduction passed, but the patched code introduced a crash.
- **No baseline failure** — the original reproduction also succeeded, so there is nothing to verify.

---

## Suspicious patch checks

These checks are performed by `backend/engine/suspicious_fix.py` on the raw diff text.  
They do **not** alter the deterministic verdict; they are advisory flags only.

| Check name | What triggers it |
|------------|-----------------|
| **Exception swallowing** | Diff adds `except Exception: pass` (or bare `except: pass`), silently discarding errors. |
| **Hardcoded failing input** | Diff adds `if student_id == 999:` (or equivalent `== 999:` pattern), special-casing the known failing input. |
| **Test modification** | Diff adds or removes lines containing `test_`, `assert `, or `pytest`, suggesting the fix weakens an existing test. |

---

## How to run the benchmark

From the **project root**:

```
python scripts\run_benchmark.py
```

The runner discovers every `CASE-*` directory under `benchmark/cases/`, runs both
patches through the verification engine, and prints a summary table:

```
PatchLens Benchmark
==============================================================
CASE        PATCH         STATUS          SUSPICIOUS          RESULT
--------------------------------------------------------------
CASE-001    good patch    VERIFIED        none                PASS
CASE-001    bad patch     INCONCLUSIVE    none                PASS
...
--------------------------------------------------------------
Result: 12/12 passed
```

A line marked `FAIL` means the actual verdict or suspicious flags did not match
what `expected.json` recorded.

### Prerequisites

- Python 3.11+ in `PATH` (the `py` launcher on Windows or `python` on Linux/macOS).
- Git available in `PATH` (used by the patcher to apply diffs).
- The backend virtual environment is **not** required; the runner adds `backend/` to
  `sys.path` directly.
