// ---------------------------------------------------------------------------
// PatchLens – canonical types
// ---------------------------------------------------------------------------

export type VerificationOutcome = "VERIFIED" | "NOT_FIXED" | "INCONCLUSIVE";

// ---------------------------------------------------------------------------
// API request / response types (matches backend POST /api/verify contract)
// ---------------------------------------------------------------------------

export interface VerifyRequest {
  repository: string;
  patch_file: string;
  reproduction_command: string[];
}

export interface ApiExecutionResult {
  stdout: string;
  stderr: string;
  exit_code: number;
  duration: number;
  timed_out: boolean;
}

export interface ApiTestResult {
  passed: number;
  exit_code: number;
  duration: number;
  stdout: string;
  stderr: string;
  timed_out: boolean;
}

export interface ApiSuspiciousCheck {
  name: string;
  detected: boolean;
  reason: string;
}

export interface VerifyResponse {
  status: VerificationOutcome;
  reason: string;
  original: ApiExecutionResult;
  patched: ApiExecutionResult;
  tests: ApiTestResult;
  suspicious_checks: ApiSuspiciousCheck[];
  ai_analysis: string;
}

// ---------------------------------------------------------------------------
// UI-layer types (derived from / mapped from the API response)
// ---------------------------------------------------------------------------

export type TimelineStepStatus = "done" | "running" | "pending" | "failed";

export interface TimelineStep {
  id: string;
  label: string;
  description: string;
  status: TimelineStepStatus;
  durationMs?: number;
}

export interface ExecutionResult {
  label: string;
  command: string;
  exitCode: number;
  durationMs: number;
  stdout: string;
  stderr: string;
  failed: boolean;
}

export interface FailureSignature {
  exceptionType: string;
  message: string;
  sourceLocation: string;
  reproductionInput: string;
}

export interface TestResults {
  passed: number;
  exitCode: number;
  durationMs: number;
  stdout: string;
  stderr: string;
  timedOut: boolean;
}

export interface SuspiciousCheck {
  name: string;
  detected: boolean;
  reason: string;
}

export interface VerificationJob {
  id: string;
  status: "idle" | "running" | "complete";
  outcome: VerificationOutcome | null;
  reason: string | null;
  // Display info
  bugDescription: string;
  reproductionCommand: string;
  // Paths sent to the API
  repository: string;
  patchFile: string;
  // Patch content for display
  patch: string;
  // Mapped from API response
  originalExecution: ExecutionResult;
  patchedExecution: ExecutionResult;
  failureSignature: FailureSignature;
  timeline: TimelineStep[];
  testResults: TestResults | null;
  suspiciousChecks: SuspiciousCheck[];
  aiAnalysis: string | null;
}
