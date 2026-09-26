"use client";

import React, { useRef, useState } from "react";
import Header from "@/components/Header";
import VerificationWorkspace from "@/components/VerificationWorkspace";
import VerificationTimeline from "@/components/VerificationTimeline";
import VerdictCard from "@/components/VerdictCard";
import EvidenceSummary from "@/components/EvidenceSummary";
import ExecutionComparison from "@/components/ExecutionComparison";
import FailureSignature from "@/components/FailureSignature";
import TestResultsSection from "@/components/TestResultsSection";
import SuspiciousChecks from "@/components/SuspiciousChecks";
import AIAnalysisSection from "@/components/AIAnalysisSection";
import { demoJob } from "@/lib/demo-data";
import { verifyPatch } from "@/lib/api";
import type { VerificationJob } from "@/lib/types";

export default function Home() {
  const workspaceRef = useRef<HTMLDivElement>(null);
  const [job, setJob] = useState<VerificationJob>(demoJob);
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Keep a stable ref to the current job params so runVerification always
  // reads the latest values regardless of when React schedules a re-render.
  const jobRef = useRef(job);
  jobRef.current = job;

  function scrollToWorkspace() {
    workspaceRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  async function runVerification() {
    // Prevent duplicate submissions while a verification is already running.
    if (isVerifying) return;

    setIsVerifying(true);
    setError(null);

    // Read request params from ref so we always use the current job values,
    // not a stale closure snapshot.
    const { repository, patchFile, reproductionCommand } = jobRef.current;

    setJob((prev) => ({
      ...prev,
      status: "running",
      outcome: null,
      timeline: prev.timeline.map((step, i) =>
        i === 0
          ? { ...step, status: "running" }
          : { ...step, status: "pending", durationMs: undefined }
      ),
    }));

    try {
      const data = await verifyPatch({
        repository,
        patch_file: patchFile,
        reproduction_command: reproductionCommand.split(" "),
      });

      // Guard: ensure the response has the required execution fields before mapping.
      if (!data || typeof data !== "object" || !data.original || !data.patched) {
        throw new Error("Unexpected response from verification engine.");
      }

      setJob((current) => ({
        ...current,
        status: "complete",
        outcome: data.status ?? "INCONCLUSIVE",
        reason: typeof data.reason === "string" ? data.reason : null,

        originalExecution: {
          ...current.originalExecution,
          exitCode: data.original.exit_code ?? 1,
          durationMs: Math.round((data.original.duration ?? 0) * 1000),
          stdout: data.original.stdout ?? "",
          stderr: data.original.stderr ?? "",
          failed: (data.original.exit_code ?? 1) !== 0,
        },

        patchedExecution: {
          ...current.patchedExecution,
          exitCode: data.patched.exit_code ?? 0,
          durationMs: Math.round((data.patched.duration ?? 0) * 1000),
          stdout: data.patched.stdout ?? "",
          stderr: data.patched.stderr ?? "",
          failed: (data.patched.exit_code ?? 0) !== 0,
        },

        testResults: data.tests
          ? {
              passed: data.tests.passed ?? 0,
              exitCode: data.tests.exit_code ?? 0,
              durationMs: Math.round((data.tests.duration ?? 0) * 1000),
              stdout: data.tests.stdout ?? "",
              stderr: data.tests.stderr ?? "",
              timedOut: data.tests.timed_out ?? false,
            }
          : null,

        suspiciousChecks: Array.isArray(data.suspicious_checks)
          ? data.suspicious_checks
          : current.suspiciousChecks,

        aiAnalysis:
          typeof data.ai_analysis === "string" ? data.ai_analysis : null,

        timeline: current.timeline.map((step) => ({
          ...step,
          status: "done" as const,
        })),
      }));
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Unknown error occurred.";

      setError(msg);
      setJob((prev) => ({
        ...prev,
        status: "idle",
        timeline: prev.timeline.map((step) => ({
          ...step,
          status: "pending" as const,
          durationMs: undefined,
        })),
      }));
    } finally {
      setIsVerifying(false);
    }
  }

  const showResults = job.status === "complete" && job.outcome !== null;

  return (
    <div className="min-h-screen" style={{ background: "var(--bg-page)" }}>
      <Header activePage="overview" />

      <main
        className="mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6"
        style={{ maxWidth: 1200 }}
      >
        {/* ── Hero strip ──────────────────────────────────────────── */}
        <div
          className="pl-card px-6 py-6"
          style={{ borderLeft: "4px solid var(--ibm-blue)" }}
        >
          <div className="flex flex-col sm:flex-row sm:items-start gap-6">
            <div className="flex-1 min-w-0">
              <p className="pl-section-label mb-1.5" style={{ fontSize: 10 }}>
                Patch Verification Engine
              </p>
              <h1
                className="font-semibold tracking-tight leading-snug"
                style={{
                  fontSize: 28,
                  color: "var(--text-primary)",
                  fontFamily: "'IBM Plex Sans', sans-serif",
                }}
              >
                AI writes the fix.
                <br />
                <span style={{ color: "var(--text-muted)", fontWeight: 400 }}>
                  PatchLens verifies it.
                </span>
              </h1>
              <p
                className="mt-3 leading-relaxed"
                style={{
                  fontSize: 14,
                  color: "var(--text-secondary)",
                  maxWidth: 520,
                  fontFamily: "'IBM Plex Sans', sans-serif",
                }}
              >
                Independently reproduce the original failure, apply the candidate
                patch, and confirm the result using deterministic execution evidence.
              </p>

              {/* Pipeline steps */}
              <div
                className="mt-4 flex flex-wrap items-center gap-1"
                style={{ fontFamily: "'IBM Plex Mono', monospace" }}
                aria-label="Verification pipeline"
              >
                {[
                  "Reproduce",
                  "Apply patch",
                  "Re-run failure",
                  "Run tests",
                  "Inspect",
                  "Verdict",
                ].map((step, i, arr) => (
                  <React.Fragment key={step}>
                    <span
                      className="px-2 py-0.5"
                      style={{
                        fontSize: 11,
                        background: "var(--bg-secondary)",
                        border: "1px solid var(--border)",
                        color: "var(--text-secondary)",
                      }}
                    >
                      {step}
                    </span>
                    {i < arr.length - 1 && (
                      <span
                        style={{ color: "var(--border-strong)", fontSize: 11 }}
                        aria-hidden="true"
                      >
                        →
                      </span>
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>

            {/* Right side: status + CTA */}
            <div className="flex-shrink-0 sm:text-right space-y-3 sm:pt-1">
              <div className="flex items-center gap-2 sm:justify-end">
                <span
                  className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                  style={{
                    background: isVerifying ? "var(--inconclusive-icon)" : "var(--verified-icon)",
                    animation: isVerifying ? "statusPulse 1.5s ease-in-out infinite" : "none",
                  }}
                  aria-hidden="true"
                />
                <span
                  style={{
                    fontSize: 12,
                    color: "var(--text-muted)",
                    fontFamily: "'IBM Plex Mono', monospace",
                  }}
                >
                  {isVerifying ? "Verifying…" : "Ready"}
                </span>
              </div>

              <button
                onClick={() => { scrollToWorkspace(); runVerification(); }}
                disabled={isVerifying}
                className="pl-btn-primary"
                aria-label={isVerifying ? "Verification in progress" : "Run verification pipeline"}
              >
                {isVerifying ? "Verifying…" : "Verify a patch"}
              </button>
            </div>
          </div>
        </div>

        {/* ── Error banner ─────────────────────────────────────────── */}
        {error && (
          <section
            className="px-5 py-4 flex items-start gap-3"
            style={{
              background: "var(--notfixed-bg)",
              border: "1px solid var(--notfixed-border)",
              borderLeft: "4px solid var(--notfixed-icon)",
            }}
            role="alert"
            aria-live="assertive"
          >
            <svg
              viewBox="0 0 14 14"
              className="w-4 h-4 flex-shrink-0 mt-0.5"
              fill="none"
              style={{ color: "var(--notfixed-icon)" }}
              aria-hidden="true"
            >
              <circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.4" />
              <path d="M7 4v3.5M7 9.5v.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
            </svg>
            <div>
              <p
                className="font-semibold"
                style={{ fontSize: 13, color: "var(--notfixed-text)", fontFamily: "'IBM Plex Sans', sans-serif" }}
              >
                Verification engine unavailable
              </p>
              <p
                className="mt-1 leading-relaxed"
                style={{ fontSize: 12, color: "var(--notfixed-text)", opacity: 0.8 }}
              >
                {error}
              </p>
              <p
                className="mt-1"
                style={{ fontSize: 12, color: "var(--notfixed-text)", opacity: 0.65 }}
              >
                Make sure the PatchLens API is running on port 8000.
              </p>
            </div>
          </section>
        )}

        {/* ── Workspace + Timeline ─────────────────────────────────── */}
        <div ref={workspaceRef} className="grid lg:grid-cols-[1fr_300px] gap-6 items-start">
          <VerificationWorkspace
            job={job}
            onVerify={runVerification}
            isVerifying={isVerifying}
          />
          <VerificationTimeline steps={job.timeline} />
        </div>

        {/* ── Verdict ──────────────────────────────────────────────── */}
        {showResults && job.outcome && (
          <VerdictCard outcome={job.outcome} reason={job.reason} />
        )}

        {/* ── Evidence summary ─────────────────────────────────────── */}
        {showResults && (
          <EvidenceSummary job={job} />
        )}

        {/* ── Execution comparison ─────────────────────────────────── */}
        {showResults && (
          <ExecutionComparison
            original={job.originalExecution}
            patched={job.patchedExecution}
          />
        )}

        {/* ── Failure signature + Tests ────────────────────────────── */}
        {showResults && (
          <div className="grid md:grid-cols-2 gap-6">
            <FailureSignature sig={job.failureSignature} />
            {job.testResults && (
              <TestResultsSection results={job.testResults} />
            )}
          </div>
        )}

        {/* ── Patch Integrity + AI Analysis ────────────────────────── */}
        {showResults && (
          <div className="grid md:grid-cols-2 gap-6">
            {job.suspiciousChecks.length > 0 && (
              <SuspiciousChecks checks={job.suspiciousChecks} />
            )}
            {job.aiAnalysis && (
              <AIAnalysisSection analysis={job.aiAnalysis} />
            )}
          </div>
        )}
      </main>

      <footer
        className="mt-12 border-t py-5 text-center"
        style={{
          borderColor: "var(--border)",
          fontSize: 12,
          color: "var(--text-muted)",
          fontFamily: "'IBM Plex Sans', sans-serif",
        }}
      >
        PatchLens — deterministic AI fix verification
      </footer>

      <style>{`
        @keyframes statusPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
      `}</style>
    </div>
  );
}
