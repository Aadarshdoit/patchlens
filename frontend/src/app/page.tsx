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

  function scrollToWorkspace() {
    workspaceRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  async function runVerification() {
    setIsVerifying(true);
    setError(null);

    // Mark all timeline steps as pending while running
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
        repository: job.repository,
        patch_file: job.patchFile,
        reproduction_command: job.reproductionCommand.split(" "),
      });

      // Map API response to UI state
      setJob((current) => ({
        ...current,
        status: "complete",
        outcome: data.status,
        reason: data.reason ?? null,

        originalExecution: {
          ...current.originalExecution,
          exitCode: data.original.exit_code,
          durationMs: Math.round(data.original.duration * 1000),
          stdout: data.original.stdout,
          stderr: data.original.stderr,
          failed: data.original.exit_code !== 0,
        },

        patchedExecution: {
          ...current.patchedExecution,
          exitCode: data.patched.exit_code,
          durationMs: Math.round(data.patched.duration * 1000),
          stdout: data.patched.stdout,
          stderr: data.patched.stderr,
          failed: data.patched.exit_code !== 0,
        },

        // Backend tests shape: { passed, exit_code, duration, stdout, stderr, timed_out }
        testResults: data.tests
          ? {
              passed: data.tests.passed ?? 0,
              exitCode: data.tests.exit_code,
              durationMs: Math.round((data.tests.duration ?? 0) * 1000),
              stdout: data.tests.stdout ?? "",
              stderr: data.tests.stderr ?? "",
              timedOut: data.tests.timed_out ?? false,
            }
          : null,

        // Backend suspicious_checks: { name, detected, reason }[]
        suspiciousChecks: Array.isArray(data.suspicious_checks)
          ? data.suspicious_checks
          : current.suspiciousChecks,

        // Backend ai_analysis: plain string
        aiAnalysis:
          typeof data.ai_analysis === "string" ? data.ai_analysis : null,

        // Mark all timeline steps as done
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
        timeline: prev.timeline.map((step) => ({ ...step, status: "pending" as const, durationMs: undefined })),
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
        className="max-w-content mx-auto px-4 sm:px-6 py-8 space-y-6"
        style={{ maxWidth: 1200 }}
      >
        {/* ── Intro header ─────────────────────────────────────── */}
        <div
          className="pl-card px-6 py-7 flex flex-col sm:flex-row sm:items-start gap-6"
        >
          <div className="flex-1 min-w-0">
            <p
              className="pl-section-label mb-2"
              style={{ fontSize: 10 }}
            >
              Patch Verification
            </p>
            <h1
              className="font-semibold tracking-tight leading-snug"
              style={{ fontSize: 26, color: "var(--text-primary)" }}
            >
              AI writes the fix.
              <br />
              <span style={{ color: "var(--text-muted)", fontWeight: 400 }}>
                PatchLens verifies it.
              </span>
            </h1>
            <p
              className="mt-3 leading-relaxed"
              style={{ fontSize: 13.5, color: "var(--text-secondary)", maxWidth: 540 }}
            >
              Independently reproduce the original failure, apply the candidate patch,
              and verify the result using execution evidence.
            </p>

            {/* Pipeline breadcrumb */}
            <div
              className="mt-5 flex flex-wrap items-center gap-1 font-mono"
              style={{ fontSize: 11, color: "var(--text-muted)" }}
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
                    className="rounded px-2 py-0.5"
                    style={{
                      background: "var(--bg-secondary)",
                      border: "1px solid var(--border)",
                      color: "var(--text-secondary)",
                    }}
                  >
                    {step}
                  </span>
                  {i < arr.length - 1 && (
                    <span style={{ color: "var(--border-strong)" }} aria-hidden="true">
                      →
                    </span>
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>

          {/* Status / Latest result */}
          <div className="flex-shrink-0 sm:text-right space-y-3">
            <div className="flex items-center gap-2 sm:justify-end">
              <span
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{
                  background: isVerifying ? "#A66A1F" : "#2F7D4A",
                  animation: isVerifying ? "pulse 1.5s ease-in-out infinite" : "none",
                }}
                aria-hidden="true"
              />
              <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
                {isVerifying ? "Verifying…" : "Ready"}
              </span>
            </div>

            <div className="flex flex-col gap-2 sm:items-end">
              <button
                onClick={scrollToWorkspace}
                className="pl-btn-primary"
              >
                Verify a patch
              </button>
            </div>
          </div>
        </div>

        {/* ── Error banner ─────────────────────────────────────── */}
        {error && (
          <section
            className="rounded-lg px-5 py-4 flex items-start gap-3"
            style={{
              background: "#FDF2F2",
              border: "1px solid #F0C0C0",
            }}
            role="alert"
            aria-live="assertive"
          >
            <svg
              viewBox="0 0 14 14"
              className="w-4 h-4 flex-shrink-0 mt-0.5"
              fill="none"
              style={{ color: "#B54747" }}
              aria-hidden="true"
            >
              <circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.4" />
              <path d="M7 4v3.5M7 9.5v.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
            </svg>
            <div>
              <p
                className="font-semibold"
                style={{ fontSize: 13, color: "#B54747" }}
              >
                Verification engine unavailable
              </p>
              <p
                className="mt-1 leading-relaxed"
                style={{ fontSize: 12, color: "#8B3535" }}
              >
                {error}
              </p>
              <p
                className="mt-1"
                style={{ fontSize: 12, color: "#8B3535", opacity: 0.8 }}
              >
                Make sure the PatchLens API is running on port 8000.
              </p>
            </div>
          </section>
        )}

        {/* ── Workspace + Timeline (two columns on desktop) ────── */}
        <div ref={workspaceRef} className="grid lg:grid-cols-[1fr_320px] gap-6 items-start">
          <VerificationWorkspace
            job={job}
            onVerify={runVerification}
            isVerifying={isVerifying}
          />
          <VerificationTimeline steps={job.timeline} />
        </div>

        {/* ── Verdict ──────────────────────────────────────────── */}
        {showResults && job.outcome && (
          <VerdictCard outcome={job.outcome} reason={job.reason} />
        )}

        {/* ── Evidence summary ─────────────────────────────────── */}
        {showResults && (
          <EvidenceSummary job={job} />
        )}

        {/* ── Execution comparison ─────────────────────────────── */}
        {showResults && (
          <ExecutionComparison
            original={job.originalExecution}
            patched={job.patchedExecution}
          />
        )}

        {/* ── Failure signature + Tests (two columns) ──────────── */}
        {showResults && (
          <div className="grid md:grid-cols-2 gap-6">
            <FailureSignature sig={job.failureSignature} />
            {job.testResults && (
              <TestResultsSection results={job.testResults} />
            )}
          </div>
        )}

        {/* ── Patch Integrity + AI Analysis (two columns) ──────── */}
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
        }}
      >
        PatchLens — deterministic AI fix verification
      </footer>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  );
}
