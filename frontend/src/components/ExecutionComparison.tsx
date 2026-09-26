import React from "react";
import type { ExecutionResult } from "@/lib/types";

type PanelProps = {
  exec: ExecutionResult;
};

function ExecutionPanel({ exec }: PanelProps) {
  const statusColor = exec.failed ? "#B54747" : "#2F7D4A";
  const statusBg = exec.failed ? "#FDF2F2" : "#F0F7F2";
  const statusBorder = exec.failed ? "#F0C0C0" : "#B8D9C4";

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="min-w-0">
          <p
            className="font-semibold text-sm"
            style={{ color: "var(--text-primary)" }}
          >
            {exec.label}
          </p>
          <code
            className="mt-0.5 block font-mono"
            style={{ fontSize: 12, color: "var(--text-muted)" }}
          >
            $ {exec.command}
          </code>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Status pill */}
          <span
            className="font-semibold font-mono rounded"
            style={{
              fontSize: 11,
              padding: "2px 8px",
              background: statusBg,
              color: statusColor,
              border: `1px solid ${statusBorder}`,
            }}
          >
            {exec.failed ? "FAILED" : "PASSED"}
          </span>
          {/* Exit code */}
          <span
            className="font-mono rounded"
            style={{
              fontSize: 11,
              padding: "2px 7px",
              background: "var(--bg-secondary)",
              color: "var(--text-secondary)",
              border: "1px solid var(--border)",
            }}
          >
            exit {exec.exitCode}
          </span>
          {/* Duration */}
          <span
            className="font-mono"
            style={{ fontSize: 11, color: "var(--text-muted)" }}
          >
            {exec.durationMs}ms
          </span>
        </div>
      </div>

      {/* stdout */}
      {exec.stdout && (
        <div>
          <p
            className="pl-section-label mb-1.5"
            style={{ fontSize: 10 }}
          >
            stdout
          </p>
          <pre
            className="pl-code rounded overflow-x-auto max-h-40 overflow-y-auto p-3 leading-relaxed"
            style={{
              background: "var(--bg-secondary)",
              border: "1px solid var(--border)",
              color: "var(--text-secondary)",
            }}
          >
            {exec.stdout}
          </pre>
        </div>
      )}

      {/* stderr */}
      {exec.stderr && (
        <div>
          <p
            className="pl-section-label mb-1.5"
            style={{ fontSize: 10, color: "#B54747" }}
          >
            stderr
          </p>
          <pre
            className="pl-code rounded overflow-x-auto max-h-40 overflow-y-auto p-3 leading-relaxed"
            style={{
              background: "#FDF2F2",
              border: "1px solid #F0C0C0",
              color: "#8B3535",
            }}
          >
            {exec.stderr}
          </pre>
        </div>
      )}

      {!exec.stdout && !exec.stderr && (
        <p style={{ fontSize: 12, color: "var(--text-muted)", fontStyle: "italic" }}>
          No output captured.
        </p>
      )}
    </div>
  );
}

type Props = {
  original: ExecutionResult;
  patched: ExecutionResult;
};

export default function ExecutionComparison({ original, patched }: Props) {
  return (
    <section className="pl-card">
      <div className="pl-card-header">
        <p className="pl-section-label">Execution Evidence</p>
        <p className="mt-0.5" style={{ fontSize: 12, color: "var(--text-muted)" }}>
          Side-by-side comparison of original and patched runs
        </p>
      </div>
      <div
        className="grid md:grid-cols-2 divide-y md:divide-y-0 md:divide-x"
        style={{ borderColor: "var(--border)" }}
      >
        <div className="p-6">
          <ExecutionPanel exec={original} />
        </div>
        <div className="p-6">
          <ExecutionPanel exec={patched} />
        </div>
      </div>
    </section>
  );
}
