# PatchLens

### AI writes the fix. PatchLens verifies it.

PatchLens is a verification layer for AI-generated software fixes.

Instead of trusting that a patch is correct because tests pass, PatchLens
reproduces the original failure, applies the candidate patch, reruns the
original failure, compares the failure evidence, and evaluates regression
tests.

## Core workflow

Bug Evidence
→ Failure Signature
→ Reproduce Original Bug
→ Apply Candidate Patch
→ Re-run Original Failure
→ Compare Evidence
→ Run Tests
→ Verdict

## Verdicts

- VERIFIED
- INCONCLUSIVE
- NOT FIXED

## Team

Veda