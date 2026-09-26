"use client";

import React, { useRef, useState } from "react";
import Header from "@/components/Header";
import VerificationWorkspace from "@/components/VerificationWorkspace";
import ExecutionComparison from "@/components/ExecutionComparison";
import FailureSignature from "@/components/FailureSignature";
import VerificationTimeline from "@/components/VerificationTimeline";
import HowItWorks from "@/components/HowItWorks";
import ResultBadge from "@/components/ResultBadge";
import { demoJob, type VerificationJob } from "@/lib/demo-data";

const API_URL = "http://127.0.0.1:8000";

export default function Home() {
  const workspaceRef = useRef<HTMLDivElement>(null);
  const [job, setJob] = useState<VerificationJob>(demoJob);
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function scrollToWorkspace() {
    workspaceRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }

  async function verifyFix() {
    setIsVerifying(true);
    setError(null);

    try {
      const response = await fetch(`${API_URL}/api/verify`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          repository:
            "C:/Users/RAJEEV/OneDrive/Desktop/patchlens/demo-repo",
          patch_file:
            "C:/Users/RAJEEV/OneDrive/Desktop/patchlens/benchmark/good_fix.diff",
          reproduction_command: ["python", "reproduce.py"],
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Verification failed.");
      }

      setJob((current) => ({
        ...current,
        status: "complete",
        outcome: data.status,
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
      }));
    } catch (verificationError) {
      setError(
        verificationError instanceof Error
          ? verificationError.message
          : "Unable to connect to PatchLens backend.",
      );
    } finally {
      setIsVerifying(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header onVerifyClick={scrollToWorkspace} />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-10 space-y-8">
        <div className="bg-white border border-gray-200 rounded-lg px-6 py-8 flex flex-col sm:flex-row sm:items-center gap-6">
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight leading-snug">
              AI writes the fix.
              <br />
              <span className="text-gray-500 font-normal">
                PatchLens verifies it.
              </span>
            </h1>

            <p className="mt-3 text-sm text-gray-600 max-w-xl leading-relaxed">
              PatchLens independently reproduces the original failure, applies
              the candidate patch, re-runs the same failure, and compares
              execution evidence to produce a deterministic verdict.
            </p>
          </div>

          <div className="flex-shrink-0 flex flex-col gap-3 sm:items-end">
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <span
                className={`w-2 h-2 rounded-full ${
                  isVerifying ? "bg-amber-500" : "bg-green-500"
                }`}
              />
              {isVerifying ? "Verifying..." : "Backend connected"}
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

        <div ref={workspaceRef}>
          <VerificationWorkspace
            job={job}
            onVerify={verifyFix}
          />
        </div>

        {error && (
          <section className="bg-red-50 border border-red-200 rounded-lg px-6 py-4">
            <p className="text-sm font-semibold text-red-800">
              Verification error
            </p>
            <p className="mt-1 text-sm text-red-700">{error}</p>
          </section>
        )}

        {job.status === "complete" && job.outcome && (
          <section className="bg-white border border-gray-200 rounded-lg px-6 py-6">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
              Verification Result
            </h2>

            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <ResultBadge outcome={job.outcome} large />

              <p className="text-sm text-gray-600 leading-relaxed">
                {job.outcome === "VERIFIED" &&
                  "The original failure no longer occurs after applying the candidate patch."}

                {job.outcome === "NOT_FIXED" &&
                  "The original failure still occurs after applying the candidate patch."}

                {job.outcome === "INCONCLUSIVE" &&
                  "The verification pipeline could not produce a definitive result."}
              </p>
            </div>
          </section>
        )}

        <ExecutionComparison
          original={job.originalExecution}
          patched={job.patchedExecution}
        />

        <FailureSignature sig={job.failureSignature} />

        <div className="grid lg:grid-cols-2 gap-8">
          <VerificationTimeline steps={job.timeline} />
          <HowItWorks />
        </div>
      </main>

      <footer className="mt-12 border-t border-gray-200 py-6 text-center text-xs text-gray-400">
        PatchLens — deterministic AI fix verification
      </footer>
    </div>
  );
}