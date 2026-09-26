import React from "react";
import type { VerificationJob } from "@/lib/types";
import PatchViewer from "./PatchViewer";

type Props = {
  job: VerificationJob;
  onVerify: () => void;
  isVerifying?: boolean;
};

export default function VerificationWorkspace({ job, onVerify, isVerifying = false }: Props) {
  return (
    <section className="pl-card" id="workspace" aria-label="Verification workspace">
      <div className="pl-card-header">
        <p className="pl-section-label">New Verification</p>
        <p className="mt-0.5" style={{ fontSize: 12, color: "var(--text-muted)" }}>
          Job {job.id}
        </p>
      </div>

      <div className="px-6 py-6 space-y-6">
        {/* Repository */}
        <div>
          <label
            className="pl-section-label block mb-2"
            style={{ fontSize: 10 }}
          >
            Repository
          </label>
          <div
            className="rounded px-3 py-2.5 font-mono"
            style={{
              fontSize: 12,
              background: "var(--bg-secondary)",
              border: "1px solid var(--border)",
              color: "var(--text-secondary)",
              wordBreak: "break-all",
            }}
          >
            demo-repo
          </div>
        </div>

        {/* Bug description */}
        <div>
          <label
            className="pl-section-label block mb-2"
            style={{ fontSize: 10 }}
          >
            Original Failure
          </label>
          <p
            className="rounded px-3 py-2.5 leading-relaxed"
            style={{
              fontSize: 13,
              background: "var(--bg-secondary)",
              border: "1px solid var(--border)",
              color: "var(--text-primary)",
            }}
          >
            {job.bugDescription}
          </p>
        </div>

        {/* Candidate patch */}
        <div>
          <label
            className="pl-section-label block mb-2"
            style={{ fontSize: 10 }}
          >
            Candidate Patch
          </label>
          <PatchViewer patch={job.patch} filename="candidate.diff" />
        </div>

        {/* Reproduction command */}
        <div>
          <label
            className="pl-section-label block mb-2"
            style={{ fontSize: 10 }}
          >
            Reproduction Command
          </label>
          <div
            className="flex items-center gap-2 rounded px-3 py-2.5"
            style={{
              background: "#111827",
              border: "1px solid #374151",
            }}
          >
            <span style={{ color: "#4B5563", fontSize: 12, fontFamily: "monospace" }}>
              $
            </span>
            <span
              className="font-mono"
              style={{ fontSize: 12, color: "#D1FAE5" }}
            >
              {job.reproductionCommand}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div
          className="flex items-center gap-4 pt-2"
          style={{ borderTop: "1px solid var(--border)" }}
        >
          <button
            onClick={onVerify}
            disabled={isVerifying}
            className="pl-btn-primary"
            aria-label={isVerifying ? "Verification in progress" : "Run verification"}
          >
            {isVerifying ? (
              <>
                <span
                  className="w-3.5 h-3.5 rounded-full border-2 border-white"
                  style={{ borderTopColor: "transparent", animation: "spin 0.7s linear infinite" }}
                  aria-hidden="true"
                />
                Verifying…
              </>
            ) : (
              <>
                <svg viewBox="0 0 14 14" className="w-3.5 h-3.5 flex-shrink-0" fill="none" aria-hidden="true">
                  <path d="M3 2l9 5-9 5V2z" fill="currentColor" />
                </svg>
                Verify Fix
              </>
            )}
          </button>

          <p style={{ fontSize: 12, color: "var(--text-muted)" }}>
            Runs end-to-end deterministic verification
          </p>
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </section>
  );
}
