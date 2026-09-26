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
      label: "Original failure resolved",
      met: patchedPassed,
      detail: patchedPassed
        ? `Exit code ${patched.exitCode}`
        : "Failure still present after patch",
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
      label: "No suspicious patch signals detected",
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

  return (
    <section className="pl-card">
      <div className="pl-card-header">
        <p className="pl-section-label">Evidence Summary</p>
        <p className="mt-0.5" style={{ fontSize: 12, color: "var(--text-muted)" }}>
          Checklist derived from actual execution evidence
        </p>
      </div>

      <ul className="px-6 py-4 space-y-2.5">
        {items.map((item, i) => (
          <li key={i} className="flex items-start gap-3">
            <span
              className="flex-shrink-0 mt-0.5"
              style={{ color: item.met ? "#2F7D4A" : "#B54747" }}
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
            <div className="min-w-0">
              <span
                className="text-sm font-medium"
                style={{ color: "var(--text-primary)" }}
              >
                {item.label}
              </span>
              {item.detail && (
                <span
                  className="ml-2"
                  style={{ fontSize: 12, color: "var(--text-muted)" }}
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
