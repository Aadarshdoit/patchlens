// ---------------------------------------------------------------------------
// PatchLens – static demo data
// Replace these with real API responses once the backend is wired up.
// ---------------------------------------------------------------------------

export type VerificationOutcome = "VERIFIED" | "NOT_FIXED" | "INCONCLUSIVE";

export type TimelineStep = {
  id: string;
  label: string;
  description: string;
  status: "done" | "running" | "pending" | "failed";
  durationMs?: number;
};

export type ExecutionResult = {
  label: string;
  command: string;
  exitCode: number;
  durationMs: number;
  stdout: string;
  stderr: string;
  failed: boolean;
};

export type FailureSignature = {
  exceptionType: string;
  message: string;
  sourceLocation: string;
  reproductionInput: string;
};

export type VerificationJob = {
  id: string;
  status: "idle" | "running" | "complete";
  outcome: VerificationOutcome | null;
  bugDescription: string;
  reproductionCommand: string;
  patch: string;
  originalExecution: ExecutionResult;
  patchedExecution: ExecutionResult;
  failureSignature: FailureSignature;
  timeline: TimelineStep[];
};

// ---------------------------------------------------------------------------
// Demo fixture
// ---------------------------------------------------------------------------
export const demoJob: VerificationJob = {
  id: "plj-20240612-001",
  status: "complete",
  outcome: "VERIFIED",

  bugDescription:
  "KeyError when looking up attendance for an unknown student. " +
  "The application crashes instead of handling a missing student record.",

  reproductionCommand: "python reproduce.py",

  patch: `--- a/app/student_service.py
+++ b/app/student_service.py
@@
 def get_student(student_id):
-    return STUDENTS[student_id]
+    return STUDENTS.get(student_id)

 def get_attendance(student_id):
     student = get_student(student_id)
+
+    if student is None:
+        return None
+
     return student["attendance"]`,

  originalExecution: {
    label: "Original (before patch)",
    command: "python reproduce.py",
    exitCode: 1,
    durationMs: 312,
    stdout: "collected 1 item\n\nFAILED tests/test_pricing.py::test_null_discount",
    stderr:
      "TypeError: unsupported operand type(s) for *: 'float' and 'NoneType'\n" +
      "  File \"src/pricing.py\", line 17, in calculate_discount\n" +
      "    return price * (1 - discount_rate)",
    failed: true,
  },

  patchedExecution: {
    label: "Patched (after fix)",
    command: "python reproduce.py",
    exitCode: 0,
    durationMs: 289,
    stdout: "collected 1 item\n\nPASSED tests/test_pricing.py::test_null_discount\n\n1 passed in 0.29s",
    stderr: "",
    failed: false,
  },

  failureSignature: {
  exceptionType: "KeyError",
  message: "999",
  sourceLocation: "app/student_service.py:10 in get_student()",
  reproductionInput: "student_id=999",
},

  timeline: [
    {
      id: "reproduce",
      label: "Reproduce original failure",
      description: "Run the reproduction command against the unpatched codebase.",
      status: "done",
      durationMs: 312,
    },
    {
      id: "apply",
      label: "Apply candidate patch",
      description: "Apply the diff to a clean working copy.",
      status: "done",
      durationMs: 18,
    },
    {
      id: "rerun",
      label: "Re-run original failure",
      description: "Execute the same command against the patched codebase.",
      status: "done",
      durationMs: 289,
    },
    {
      id: "compare",
      label: "Compare evidence",
      description: "Diff exit codes, exception fingerprints, and stdout/stderr.",
      status: "done",
      durationMs: 4,
    },
    {
      id: "tests",
      label: "Run tests",
      description: "Execute the full test suite to check for regressions.",
      status: "done",
      durationMs: 1840,
    },
    {
      id: "verdict",
      label: "Final verdict",
      description: "Emit a deterministic VERIFIED / NOT_FIXED / INCONCLUSIVE result.",
      status: "done",
      durationMs: 2,
    },
  ],
};
