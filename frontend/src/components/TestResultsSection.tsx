"use client";

import React, { useState } from "react";
import type { TestResults } from "@/lib/types";

type Props = {
  results: TestResults;
};

export default function TestResultsSection({ results }: Props) {
  const [expanded, setExpanded] = useState(false);
  const allPassed = results.exitCode === 0;

  return (
    <section className="pl-card">
      <div className="pl-card-header flex items-center justify-between">
        <div>
          <p className="pl-section-label">Existing Tests</p>
          <p className="mt-0.5" style={{ fontSize: 12, color: "var(--text-muted)" }}>
            Full test suite executed after applying the patch
          </p>
        </div>
        {/* Summary badge */}
        <span
          className="font-semibold rounded"
          style={{
            fontSize: 11,
            padding: "3px 10px",
            background: allPassed ? "#F0F7F2" : "#FDF2F2",
            color: allPassed ? "#2F7D4A" : "#B54747",
            border: `1px solid ${allPassed ? "#B8D9C4" : "#F0C0C0"}`,
          }}
        >
          {allPassed ? "Passed" : "Failed"}
        </span>
      </div>

      <div className="px-6 py-5 space-y-4">
        {/* Stats row */}
        <div className="flex items-center gap-5 flex-wrap">
          <div className="flex items-baseline gap-1.5">
            <span
              className="font-mono font-semibold"
              style={{ fontSize: 20, color: allPassed ? "#2F7D4A" : "#B54747" }}
            >
              {results.passed}
            </span>
            <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
              test{results.passed !== 1 ? "s" : ""} passed
            </span>
          </div>

          <div className="flex items-center gap-4 text-sm" style={{ color: "var(--text-secondary)" }}>
            <span>
              Exit code{" "}
              <span className="font-mono font-semibold">{results.exitCode}</span>
            </span>
            <span>
              <span className="font-mono font-semibold">
                {results.durationMs >= 1000
                  ? `${(results.durationMs / 1000).toFixed(2)}s`
                  : `${results.durationMs}ms`}
              </span>{" "}
              duration
            </span>
            {results.timedOut && (
              <span style={{ color: "#A66A1F", fontWeight: 600 }}>
                Timed out
              </span>
            )}
          </div>
        </div>

        {/* Output toggle */}
        {(results.stdout || results.stderr) && (
          <div>
            <button
              onClick={() => setExpanded((x) => !x)}
              className="flex items-center gap-1.5 text-sm font-medium transition-colors"
              style={{ color: "var(--text-secondary)" }}
              aria-expanded={expanded}
              aria-controls="test-output"
            >
              <svg
                viewBox="0 0 12 12"
                className="w-3 h-3 flex-shrink-0 transition-transform"
                style={{ transform: expanded ? "rotate(90deg)" : "rotate(0)" }}
                fill="none"
                aria-hidden="true"
              >
                <path d="M4 2l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              {expanded ? "Hide" : "Show"} output
            </button>

            {expanded && (
              <div id="test-output" className="mt-3 space-y-3">
                {results.stdout && (
                  <pre
                    className="pl-code rounded p-3 overflow-x-auto max-h-56 overflow-y-auto"
                    style={{
                      background: "var(--bg-secondary)",
                      border: "1px solid var(--border)",
                      color: "var(--text-secondary)",
                    }}
                  >
                    {results.stdout}
                  </pre>
                )}
                {results.stderr && (
                  <pre
                    className="pl-code rounded p-3 overflow-x-auto max-h-56 overflow-y-auto"
                    style={{
                      background: "#FDF2F2",
                      border: "1px solid #F0C0C0",
                      color: "#8B3535",
                    }}
                  >
                    {results.stderr}
                  </pre>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
