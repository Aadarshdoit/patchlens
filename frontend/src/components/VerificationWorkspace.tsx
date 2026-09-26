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
        <p className="pl-section-label">Verification Input</p>
        <p className="mt-0.5 font-mono" style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "'IBM Plex Mono', monospace" }}>
          {job.id}
        </p>
      </div>

      <div className="px-5 py-5 space-y-5">
        {/* Repository */}
        <div>
          <p className="pl-section-label mb-1.5" style={{ fontSize: 10 }}>
            Repository
          </p>
          <div
            className="flex items-center gap-2 px-3 py-2"
            style={{
              background: "var(--bg-secondary)",
              border: "1px solid var(--border)",
            }}
          >
            <svg viewBox="0 0 14 14" className="w-3.5 h-3.5 flex-shrink-0" fill="none" aria-hidden="true">
              <rect x="2" y="2" width="10" height="10" rx="0" stroke="var(--text-muted)" strokeWidth="1.2" />
              <path d="M5 5h4M5 8h2" stroke="var(--text-muted)" strokeWidth="1.1" strokeLinecap="round" />
            </svg>
            <span
              className="font-mono"
              style={{ fontSize: 12, color: "var(--text-secondary)", wordBreak: "break-all", fontFamily: "'IBM Plex Mono', monospace" }}
            >
              demo-repo
            </span>
          </div>
        </div>

        {/* Bug description */}
        <div>
          <p className="pl-section-label mb-1.5" style={{ fontSize: 10 }}>
            Original Failure
          </p>
          <p
            className="px-3 py-2.5 leading-relaxed"
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
          <p className="pl-section-label mb-1.5" style={{ fontSize: 10 }}>
            Candidate Patch
          </p>
          <PatchViewer patch={job.patch} filename="candidate.diff" />
        </div>

        {/* Reproduction command */}
        <div>
          <p className="pl-section-label mb-1.5" style={{ fontSize: 10 }}>
            Reproduction Command
          </p>
          <div
            className="flex items-center gap-2 px-3 py-2.5"
            style={{
              background: "#161616",
              border: "1px solid #3d3d3d",
            }}
          >
            <span
              style={{
                color: "#6f6f6f",
                fontSize: 12,
                fontFamily: "'IBM Plex Mono', monospace",
                userSelect: "none",
              }}
            >
              $
            </span>
            <span
              className="font-mono"
              style={{ fontSize: 12, color: "#a8d5b5", fontFamily: "'IBM Plex Mono', monospace" }}
            >
              {job.reproductionCommand}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div
          className="flex items-center gap-4 pt-3"
          style={{ borderTop: "1px solid var(--border)" }}
        >
          <button
            onClick={onVerify}
            disabled={isVerifying}
            className="pl-btn-primary"
            aria-label={isVerifying ? "Verification in progress" : "Run verification pipeline"}
          >
            {isVerifying ? (
              <>
                <span
                  className="w-3.5 h-3.5 border-2 border-white flex-shrink-0"
                  style={{
                    borderTopColor: "transparent",
                    animation: "spin 0.7s linear infinite",
                    borderRadius: "50%",
                  }}
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
