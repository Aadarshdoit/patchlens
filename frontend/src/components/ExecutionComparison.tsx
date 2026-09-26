import React from "react";
import type { ExecutionResult } from "@/lib/types";

type PanelProps = {
  exec: ExecutionResult;
};

function ExecutionPanel({ exec }: PanelProps) {
  const passed = !exec.failed;
  return (
    <div className="flex flex-col gap-4">
      {/* Header row */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="min-w-0">
          <p
            className="font-semibold"
            style={{ fontSize: 13, color: "var(--text-primary)", fontFamily: "'IBM Plex Sans', sans-serif" }}
          >
            {exec.label}
          </p>
          <code
            className="mt-0.5 block font-mono"
            style={{ fontSize: 11.5, color: "var(--text-muted)", fontFamily: "'IBM Plex Mono', monospace" }}
          >
            $ {exec.command}
          </code>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
          <span
            className="font-mono font-semibold"
            style={{
              fontSize: 10,
              padding: "2px 7px",
              background: passed ? "var(--verified-bg)" : "var(--notfixed-bg)",
              color: passed ? "var(--verified-text)" : "var(--notfixed-text)",
              border: `1px solid ${passed ? "var(--verified-border)" : "var(--notfixed-border)"}`,
              letterSpacing: "0.04em",
              fontFamily: "'IBM Plex Mono', monospace",
            }}
          >
            {passed ? "PASSED" : "FAILED"}
          </span>
          <span
            className="font-mono"
            style={{
              fontSize: 10,
              padding: "2px 7px",
              background: "var(--bg-secondary)",
              color: "var(--text-secondary)",
              border: "1px solid var(--border)",
              fontFamily: "'IBM Plex Mono', monospace",
            }}
          >
            exit {exec.exitCode}
          </span>
          <span
            className="font-mono"
            style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "'IBM Plex Mono', monospace" }}
          >
            {exec.durationMs}ms
          </span>
        </div>
      </div>

      {/* stdout */}
      {exec.stdout && (
        <div>
          <p className="pl-section-label mb-1.5" style={{ fontSize: 10 }}>stdout</p>
          <pre
            className="pl-code overflow-x-auto max-h-36 overflow-y-auto p-3 leading-relaxed"
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
            style={{ fontSize: 10, color: "var(--notfixed-text)" }}
          >
            stderr
          </p>
          <pre
            className="pl-code overflow-x-auto max-h-36 overflow-y-auto p-3 leading-relaxed"
            style={{
              background: "var(--notfixed-bg)",
              border: "1px solid var(--notfixed-border)",
              color: "#a2191f",
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
          Before and after applying the candidate patch
        </p>
      </div>
      <div
        className="grid md:grid-cols-2 divide-y md:divide-y-0 md:divide-x"
        style={{ borderColor: "var(--border)" }}
      >
        <div className="p-5">
          <ExecutionPanel exec={original} />
        </div>
        <div className="p-5">
          <ExecutionPanel exec={patched} />
        </div>
      </div>
    </section>
  );
}
