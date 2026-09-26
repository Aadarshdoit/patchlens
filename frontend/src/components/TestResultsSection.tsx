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
            Test suite executed after applying the patch
          </p>
        </div>
        <span
          className="font-mono font-semibold"
          style={{
            fontSize: 10,
            padding: "2px 8px",
            background: allPassed ? "var(--verified-bg)" : "var(--notfixed-bg)",
            color: allPassed ? "var(--verified-text)" : "var(--notfixed-text)",
            border: `1px solid ${allPassed ? "var(--verified-border)" : "var(--notfixed-border)"}`,
            letterSpacing: "0.04em",
            fontFamily: "'IBM Plex Mono', monospace",
          }}
        >
          {allPassed ? "PASSED" : "FAILED"}
        </span>
      </div>

      <div className="px-5 py-4 space-y-4">
        {/* Stats row */}
        <div className="flex items-center gap-5 flex-wrap">
          <div className="flex items-baseline gap-1.5">
            <span
              className="font-mono font-bold"
              style={{
                fontSize: 22,
                color: allPassed ? "var(--verified-text)" : "var(--notfixed-text)",
                fontFamily: "'IBM Plex Mono', monospace",
              }}
            >
              {results.passed}
            </span>
            <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
              test{results.passed !== 1 ? "s" : ""} passed
            </span>
          </div>

          <div
            className="flex items-center gap-4"
            style={{ fontSize: 12, color: "var(--text-secondary)", fontFamily: "'IBM Plex Mono', monospace" }}
          >
            <span>
              exit{" "}
              <span className="font-mono font-semibold">{results.exitCode}</span>
            </span>
            <span>
              <span className="font-mono font-semibold">
                {results.durationMs >= 1000
                  ? `${(results.durationMs / 1000).toFixed(2)}s`
                  : `${results.durationMs}ms`}
              </span>
            </span>
            {results.timedOut && (
              <span style={{ color: "var(--inconclusive-text)", fontWeight: 600 }}>
                timed out
              </span>
            )}
          </div>
        </div>

        {/* Output toggle */}
        {(results.stdout || results.stderr) && (
          <div>
            <button
              onClick={() => setExpanded((x) => !x)}
              className="flex items-center gap-1.5 font-medium transition-colors"
              style={{ fontSize: 12, color: "var(--text-secondary)", background: "none", border: "none", cursor: "pointer", padding: 0 }}
              aria-expanded={expanded}
              aria-controls="test-output"
            >
              <svg
                viewBox="0 0 10 10"
                className="w-2.5 h-2.5 flex-shrink-0 transition-transform"
                style={{ transform: expanded ? "rotate(90deg)" : "rotate(0)" }}
                fill="none"
                aria-hidden="true"
              >
                <path d="M3 2l4 3-4 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              {expanded ? "Hide output" : "Show output"}
            </button>

            {expanded && (
              <div id="test-output" className="mt-3 space-y-3">
                {results.stdout && (
                  <pre
                    className="pl-code p-3 overflow-x-auto max-h-52 overflow-y-auto"
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
                    className="pl-code p-3 overflow-x-auto max-h-52 overflow-y-auto"
                    style={{
                      background: "var(--notfixed-bg)",
                      border: "1px solid var(--notfixed-border)",
                      color: "#a2191f",
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
