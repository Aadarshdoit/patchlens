// ---------------------------------------------------------------------------
// PatchLens – static demo fixture
// ---------------------------------------------------------------------------

export type {
  VerificationOutcome,
  VerificationJob,
  TimelineStep,
  ExecutionResult,
  FailureSignature,
  TestResults,
  SuspiciousCheck,
} from "./types";

// Re-export AIAnalysis as a type alias for backwards compat with any remaining imports
export type AIAnalysis = string;

import type { VerificationJob } from "./types";

export const demoJob: VerificationJob = {
  id: "plj-20240612-001",
  status: "idle",
  outcome: null,
  reason: null,

  bugDescription:
    "KeyError when looking up attendance for an unknown student. " +
    "The application crashes instead of handling a missing student record gracefully.",

  reproductionCommand: "python reproduce.py",
  repository: "C:/Users/RAJEEV/OneDrive/Desktop/patchlens/demo-repo",
  patchFile: "C:/Users/RAJEEV/OneDrive/Desktop/patchlens/benchmark/good_fix.diff",

  patch: `--- a/app/student_service.py
+++ b/app/student_service.py
@@ -7,7 +7,12 @@
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
    stdout: "Running attendance lookup for student_id=999\n\nFAILED",
    stderr:
      'KeyError: 999\n' +
      '  File "app/student_service.py", line 10, in get_student\n' +
      '    return STUDENTS[student_id]',
    failed: true,
  },

  patchedExecution: {
    label: "Patched (after fix)",
    command: "python reproduce.py",
    exitCode: 0,
    durationMs: 289,
    stdout:
      "Running attendance lookup for student_id=999\n" +
      "Result: None (student not found)\n\n" +
      "OK — no exception raised",
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
      status: "pending",
    },
    {
      id: "apply",
      label: "Apply candidate patch",
      description: "Apply the diff to a clean working copy.",
      status: "pending",
    },
    {
      id: "rerun",
      label: "Re-run original failure",
      description: "Execute the same command against the patched codebase.",
      status: "pending",
    },
    {
      id: "tests",
      label: "Run test suite",
      description: "Execute the full test suite to check for regressions.",
      status: "pending",
    },
    {
      id: "inspect",
      label: "Inspect patch integrity",
      description: "Static checks for suspicious patch patterns.",
      status: "pending",
    },
    {
      id: "verdict",
      label: "Produce verdict",
      description: "Emit VERIFIED, NOT FIXED, or INCONCLUSIVE.",
      status: "pending",
    },
  ],

  testResults: null,

  suspiciousChecks: [],

  aiAnalysis: null,
};
