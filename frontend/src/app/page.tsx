"use client";

import React, { useRef } from "react";
import Header from "@/components/Header";
import VerificationWorkspace from "@/components/VerificationWorkspace";
import ExecutionComparison from "@/components/ExecutionComparison";
import FailureSignature from "@/components/FailureSignature";
import VerificationTimeline from "@/components/VerificationTimeline";
import HowItWorks from "@/components/HowItWorks";
import ResultBadge from "@/components/ResultBadge";
import { demoJob } from "@/lib/demo-data";

// ---------------------------------------------------------------------------
// When the backend is ready, replace `demoJob` with a real API call, e.g.:
//   const job = await fetch("/api/jobs/" + id).then(r => r.json())
// The component tree below accepts the same VerificationJob shape.
// ---------------------------------------------------------------------------

export default function Home() {
  const workspaceRef = useRef<HTMLDivElement>(null);

  function scrollToWorkspace() {
    workspaceRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  const job = demoJob;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header onVerifyClick={scrollToWorkspace} />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-10 space-y-8">
        {/* ----------------------------------------------------------------
            Hero / intro strip
        ---------------------------------------------------------------- */}
        <div className="bg-white border border-gray-200 rounded-lg px-6 py-8 flex flex-col sm:flex-row sm:items-center gap-6">
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight leading-snug">
              AI writes the fix.
              <br />
              <span className="text-gray-500 font-normal">PatchLens verifies it.</span>
            </h1>
            <p className="mt-3 text-sm text-gray-600 max-w-xl leading-relaxed">
              PatchLens is an independent verification tool for AI-generated code fixes.
              It reproduces the original failure, applies the candidate patch, re-runs the
              same failure, and compares execution evidence — emitting a deterministic verdict
              with no heuristics.
            </p>
          </div>
          <div className="flex-shrink-0 flex flex-col gap-3 sm:items-end">
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <span className="w-2 h-2 rounded-full bg-green-500" />
              Demo mode — static data
            </div>
            {job.outcome && (
              <div className="flex flex-col items-start sm:items-end gap-1">
                <span className="text-xs text-gray-400 uppercase tracking-wide font-semibold">
                  Latest result
                </span>
                <ResultBadge outcome={job.outcome} large />
              </div>
            )}
          </div>
        </div>

        {/* ----------------------------------------------------------------
            Verification workspace
        ---------------------------------------------------------------- */}
        <div ref={workspaceRef}>
          <VerificationWorkspace job={job} onVerify={scrollToWorkspace} />
        </div>

        {/* ----------------------------------------------------------------
            Result — shown only when job is complete
        ---------------------------------------------------------------- */}
        {job.status === "complete" && job.outcome && (
          <section className="bg-white border border-gray-200 rounded-lg px-6 py-6">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
              Verification Result
            </h2>
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <ResultBadge outcome={job.outcome} large />
              <p className="text-sm text-gray-600 leading-relaxed">
                {job.outcome === "VERIFIED" &&
                  "The patch resolves the original failure. Exit code changed from 1 → 0, the exception fingerprint is no longer present, and the full test suite passes."}
                {job.outcome === "NOT_FIXED" &&
                  "The patch did not resolve the original failure. The exception fingerprint is still present after applying the diff."}
                {job.outcome === "INCONCLUSIVE" &&
                  "The verification pipeline could not produce a definitive result. Manual review is required."}
              </p>
            </div>
          </section>
        )}

        {/* ----------------------------------------------------------------
            Execution comparison
        ---------------------------------------------------------------- */}
        <ExecutionComparison
          original={job.originalExecution}
          patched={job.patchedExecution}
        />

        {/* ----------------------------------------------------------------
            Failure signature
        ---------------------------------------------------------------- */}
        <FailureSignature sig={job.failureSignature} />

        {/* ----------------------------------------------------------------
            Timeline + how it works — side by side on large screens
        ---------------------------------------------------------------- */}
        <div className="grid lg:grid-cols-2 gap-8">
          <VerificationTimeline steps={job.timeline} />
          <HowItWorks />
        </div>
      </main>

      <footer className="mt-12 border-t border-gray-200 py-6 text-center text-xs text-gray-400">
        PatchLens — deterministic AI fix verification &nbsp;·&nbsp; demo build
      </footer>
    </div>
  );
}
