import React from "react";
import type { VerificationJob } from "@/lib/types";

type Props = {
  job: VerificationJob;
};

type EvidenceItem = {
  label: string;
  met: boolean;
  detail?: string;
};

function buildEvidenceItems(job: VerificationJob): EvidenceItem[] {
  if (job.status !== "complete") return [];

  const original = job.originalExecution;
  const patched = job.patchedExecution;
  const originalFailed = original.failed;
  const patchedPassed = !patched.failed;

  // Derive the correct patched-execution label from the backend verdict, not
  // just from the raw exit code.  The comparator distinguishes three cases:
  //   failure_resolved  → patched exit 0               → outcome VERIFIED (or INCONCLUSIVE if tests fail)
  //   failure_persists  → patched exit non-0, same err → outcome NOT_FIXED
  //   different_failure → patched exit non-0, diff err → outcome INCONCLUSIVE
  // We use outcome + patchedPassed to pick the right wording so the evidence
  // summary never contradicts the verdict reason.
  let patchedLabel: string;
  let patchedMet: boolean;
  let patchedDetail: string;

  if (patchedPassed) {
    // Exit 0 — original failure resolved regardless of outcome
    patchedLabel = "Original failure resolved";
    patchedMet = true;
    patchedDetail = `Exit code ${patched.exitCode}`;
  } else if (job.outcome === "NOT_FIXED") {
    // Same exception + same message persists
    patchedLabel = "Original failure still occurs after patch";
    patchedMet = false;
    patchedDetail = `Exit code ${patched.exitCode}`;
  } else {
    // INCONCLUSIVE: patched run failed but with a different error
    patchedLabel = "Original failure changed to a different failure";
    patchedMet = false;
    patchedDetail = `Exit code ${patched.exitCode} — different error`;
  }

  const checks: EvidenceItem[] = [
    {
      label: "Original failure reproduced",
      met: originalFailed,
      detail: originalFailed
        ? `Exit code ${original.exitCode}`
        : "Original run did not fail as expected",
    },
    {
      label: "Candidate patch applied",
      met: true,
      detail: "Diff applied to clean working copy",
    },
    {
      label: patchedLabel,
      met: patchedMet,
      detail: patchedDetail,
    },
  ];

  if (job.testResults !== null) {
    const testsPassed = job.testResults.exitCode === 0;
    checks.push({
      label: "Existing tests passed",
      met: testsPassed,
      detail: testsPassed
        ? `${job.testResults.passed} test${job.testResults.passed !== 1 ? "s" : ""} passed`
        : "One or more tests failed",
    });
  }

  if (job.suspiciousChecks.length > 0) {
    const anyDetected = job.suspiciousChecks.some((c) => c.detected);
    checks.push({
      label: "No suspicious patch signals",
      met: !anyDetected,
      detail: anyDetected
        ? `${job.suspiciousChecks.filter((c) => c.detected).length} signal(s) flagged`
        : "All integrity checks clear",
    });
  }

  return checks;
}

export default function EvidenceSummary({ job }: Props) {
  const items = buildEvidenceItems(job);
  if (items.length === 0) return null;

  const metCount = items.filter((i) => i.met).length;

  return (
    <section className="pl-card">
      <div className="pl-card-header flex items-center justify-between">
        <div>
          <p className="pl-section-label">Evidence Summary</p>
          <p className="mt-0.5" style={{ fontSize: 12, color: "var(--text-muted)" }}>
            Derived from execution evidence
          </p>
        </div>
        <span
          className="font-mono"
          style={{
            fontSize: 11,
            color: metCount === items.length ? "var(--verified-text)" : "var(--notfixed-text)",
            background: metCount === items.length ? "var(--verified-bg)" : "var(--notfixed-bg)",
            border: `1px solid ${metCount === items.length ? "var(--verified-border)" : "var(--notfixed-border)"}`,
            padding: "2px 8px",
            fontFamily: "'IBM Plex Mono', monospace",
            letterSpacing: "0.04em",
          }}
        >
          {metCount}/{items.length}
        </span>
      </div>

      <ul className="divide-y" style={{ borderColor: "var(--border)" }}>
        {items.map((item, i) => (
          <li key={i} className="flex items-start gap-3 px-5 py-3">
            <span
              className="flex-shrink-0 mt-0.5"
              style={{ color: item.met ? "var(--verified-icon)" : "var(--notfixed-icon)" }}
              aria-hidden="true"
            >
              {item.met ? (
                <svg viewBox="0 0 14 14" className="w-3.5 h-3.5" fill="none">
                  <circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.4" />
                  <path d="M4.5 7l2 2 3-3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              ) : (
                <svg viewBox="0 0 14 14" className="w-3.5 h-3.5" fill="none">
                  <circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.4" />
                  <path d="M5 5l4 4M9 5l-4 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                </svg>
              )}
            </span>
            <div className="min-w-0 flex-1">
              <span
                className="font-medium"
                style={{ fontSize: 13, color: "var(--text-primary)", fontFamily: "'IBM Plex Sans', sans-serif" }}
              >
                {item.label}
              </span>
              {item.detail && (
                <span
                  className="ml-2"
                  style={{ fontSize: 12, color: "var(--text-muted)", fontFamily: "'IBM Plex Sans', sans-serif" }}
                >
                  — {item.detail}
                </span>
              )}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
