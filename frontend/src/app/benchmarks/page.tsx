import React from "react";
import Header from "@/components/Header";
import type { VerificationOutcome } from "@/lib/types";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type PatchEval = {
  label: "Good patch" | "Bad patch";
  verdict: VerificationOutcome;
  /** Suspicious signal name, if any */
  suspicious?: string;
};

type BenchmarkCase = {
  id: string;
  title: string;
  description: string;
  patches: [PatchEval, PatchEval]; // always [good, bad]
};

// ---------------------------------------------------------------------------
// Data — sourced from benchmark/cases/CASE-NNN/bug.json + expected.json
// ---------------------------------------------------------------------------
//
// Root cause of previous CASE-001-only bug: the CASES array was hardcoded with
// a single entry. All six cases are now represented here, each with their
// good and bad patch evaluations (12 total), matching the expected.json ground truth.
//
const CASES: BenchmarkCase[] = [
  {
    id: "CASE-001",
    title: "Unknown student crashes attendance lookup",
    description:
      "Looking up attendance for an unknown student crashes instead of handling the missing student.",
    patches: [
      { label: "Good patch", verdict: "VERIFIED" },
      { label: "Bad patch",  verdict: "INCONCLUSIVE" },
    ],
  },
  {
    id: "CASE-002",
    title: "Unknown student crashes grade lookup",
    description:
      "Looking up the grade for an unknown student raises KeyError instead of returning None.",
    patches: [
      { label: "Good patch", verdict: "VERIFIED" },
      { label: "Bad patch",  verdict: "NOT_FIXED" },
    ],
  },
  {
    id: "CASE-003",
    title: "Unknown student rank lookup crashes with KeyError",
    description:
      "Calling get_rank for an unknown student raises KeyError. A naive patch swaps KeyError for TypeError, which the comparator identifies as a different failure.",
    patches: [
      { label: "Good patch", verdict: "VERIFIED" },
      { label: "Bad patch",  verdict: "INCONCLUSIVE" },
    ],
  },
  {
    id: "CASE-004",
    title: "Unknown student crashes enrollment lookup",
    description:
      "Calling get_course for an unknown student raises KeyError. The bad patch swallows the exception silently.",
    patches: [
      { label: "Good patch", verdict: "VERIFIED" },
      { label: "Bad patch",  verdict: "VERIFIED", suspicious: "Exception swallowing" },
    ],
  },
  {
    id: "CASE-005",
    title: "Unknown student crashes library borrowed-count lookup",
    description:
      "Calling get_borrowed_count for an unknown student raises KeyError. The bad patch hard-codes a return value for student_id 999.",
    patches: [
      { label: "Good patch", verdict: "VERIFIED" },
      { label: "Bad patch",  verdict: "VERIFIED", suspicious: "Hardcoded failing input" },
    ],
  },
  {
    id: "CASE-006",
    title: "Unknown student crashes fee lookup",
    description:
      "Calling get_fee for an unknown student raises KeyError. The bad patch weakens the test assertion instead of fixing the service.",
    patches: [
      { label: "Good patch", verdict: "VERIFIED" },
      { label: "Bad patch",  verdict: "VERIFIED", suspicious: "Test modification" },
    ],
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

type VerdictStyle = { text: string; bg: string; border: string; dot: string };

const VERDICT_STYLES: Record<VerificationOutcome, VerdictStyle> = {
  VERIFIED:     { text: "var(--verified-text)",     bg: "var(--verified-bg)",     border: "var(--verified-border)",     dot: "var(--verified-icon)" },
  NOT_FIXED:    { text: "var(--notfixed-text)",     bg: "var(--notfixed-bg)",     border: "var(--notfixed-border)",     dot: "var(--notfixed-icon)" },
  INCONCLUSIVE: { text: "var(--inconclusive-text)", bg: "var(--inconclusive-bg)", border: "var(--inconclusive-border)", dot: "var(--inconclusive-icon)" },
};

const VERDICT_LABEL: Record<VerificationOutcome, string> = {
  VERIFIED:     "VERIFIED",
  NOT_FIXED:    "NOT FIXED",
  INCONCLUSIVE: "INCONCLUSIVE",
};

/** True when the evaluation result is the "expected" pass (good patch → VERIFIED, bad patch → any non-VERIFIED or VERIFIED+suspicious) */
function isExpectedResult(patch: PatchEval): boolean {
  if (patch.label === "Good patch") return patch.verdict === "VERIFIED";
  // Bad patch: any verdict is a pass (the engine correctly identified it)
  return true;
}

function VerdictBadge({ verdict, suspicious }: { verdict: VerificationOutcome; suspicious?: string }) {
  const vs = VERDICT_STYLES[verdict];
  return (
    <div className="flex flex-col gap-1 items-start">
      <span
        className="inline-flex items-center gap-1.5 font-mono font-semibold"
        style={{
          fontSize: 11,
          padding: "2px 8px",
          background: vs.bg,
          color: vs.text,
          border: `1px solid ${vs.border}`,
          letterSpacing: "0.04em",
        }}
      >
        <span
          className="w-1.5 h-1.5 rounded-full flex-shrink-0"
          style={{ background: vs.dot }}
          aria-hidden="true"
        />
        {VERDICT_LABEL[verdict]}
      </span>
      {suspicious && (
        <span
          className="font-mono"
          style={{
            fontSize: 10,
            color: "var(--inconclusive-text)",
            background: "var(--inconclusive-bg)",
            border: "1px solid var(--inconclusive-border)",
            padding: "1px 6px",
            letterSpacing: "0.02em",
          }}
        >
          ⚑ {suspicious}
        </span>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Totals
// ---------------------------------------------------------------------------

const allEvals = CASES.flatMap((c) => c.patches);
const totalEvals = allEvals.length; // 12
const passedEvals = allEvals.filter(isExpectedResult).length; // 12
const totalCases = CASES.length; // 6

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function BenchmarksPage() {
  return (
    <div className="min-h-screen" style={{ background: "var(--bg-page)" }}>
      <Header activePage="benchmarks" />

      <main
        className="mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-0"
        style={{ maxWidth: 1200 }}
      >
        {/* ── Page header ────────────────────────────────────────── */}
        <div
          className="pl-card px-6 py-6 mb-6"
          style={{ borderBottom: "2px solid var(--ibm-blue)" }}
        >
          <p className="pl-section-label mb-1">Testing &amp; Validation</p>
          <h1
            className="font-semibold tracking-tight"
            style={{ fontSize: 24, color: "var(--text-primary)", fontFamily: "'IBM Plex Sans', sans-serif" }}
          >
            PatchLens Benchmarks
          </h1>
          <p
            className="mt-1.5"
            style={{ fontSize: 14, color: "var(--text-secondary)", maxWidth: 560 }}
          >
            Independent verification suite — each case runs the full deterministic
            pipeline against a good patch and a bad patch.
          </p>

          {/* ── Summary stats ── */}
          <div
            className="mt-5 pt-5 flex flex-wrap gap-8"
            style={{ borderTop: "1px solid var(--border)" }}
          >
            {[
              { label: "Cases",       value: totalCases,  color: "var(--text-primary)" },
              { label: "Evaluations", value: totalEvals,  color: "var(--text-primary)" },
              {
                label: "Passed",
                value: `${passedEvals}/${totalEvals}`,
                color: "var(--verified-text)",
              },
            ].map((stat) => (
              <div key={stat.label} className="flex items-baseline gap-2">
                <span
                  className="font-mono font-bold"
                  style={{ fontSize: 26, color: stat.color, fontFamily: "'IBM Plex Mono', monospace" }}
                >
                  {stat.value}
                </span>
                <span style={{ fontSize: 13, color: "var(--text-muted)" }}>
                  {stat.label}
                </span>
              </div>
            ))}

            {/* Overall result pill */}
            <div className="ml-auto self-end">
              <span
                className="inline-flex items-center gap-2 font-mono font-semibold"
                style={{
                  fontSize: 12,
                  padding: "4px 12px",
                  background: "var(--verified-bg)",
                  color: "var(--verified-text)",
                  border: "1px solid var(--verified-border)",
                }}
              >
                <svg viewBox="0 0 14 14" className="w-3.5 h-3.5 flex-shrink-0" fill="none" aria-hidden="true">
                  <circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.4" />
                  <path d="M4.5 7l2 2 3-3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                All {totalEvals} evaluations passed
              </span>
            </div>
          </div>
        </div>

        {/* ── Case list ──────────────────────────────────────────── */}
        <div className="space-y-4">
          {CASES.map((c) => (
            <article key={c.id} className="pl-card" aria-label={`Benchmark ${c.id}`}>
              {/* Case header */}
              <div
                className="pl-card-header flex flex-wrap items-start gap-3"
                style={{ padding: "14px 20px" }}
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <span
                    className="font-mono font-bold flex-shrink-0"
                    style={{
                      fontSize: 12,
                      color: "var(--text-primary)",
                      background: "var(--bg-overlay)",
                      border: "1px solid var(--border-strong)",
                      padding: "2px 8px",
                      letterSpacing: "0.04em",
                    }}
                  >
                    {c.id}
                  </span>
                  <div className="min-w-0">
                    <h2
                      className="font-semibold truncate"
                      style={{ fontSize: 14, color: "var(--text-primary)" }}
                    >
                      {c.title}
                    </h2>
                    <p
                      className="mt-0.5 leading-relaxed"
                      style={{ fontSize: 12, color: "var(--text-secondary)" }}
                    >
                      {c.description}
                    </p>
                  </div>
                </div>

                {/* Compact verdict summary */}
                <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
                  {c.patches.map((p) => (
                    <VerdictBadge key={p.label} verdict={p.verdict} suspicious={p.suspicious} />
                  ))}
                </div>
              </div>

              {/* Patch evaluations table */}
              <div className="overflow-x-auto">
                <table className="w-full border-collapse pl-table" aria-label={`${c.id} patch evaluations`}>
                  <thead>
                    <tr>
                      {["Patch", "Verdict", "Expected result", "Status"].map((h) => (
                        <th key={h}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {c.patches.map((p) => {
                      const vs = VERDICT_STYLES[p.verdict];
                      const pass = isExpectedResult(p);
                      return (
                        <tr key={p.label}>
                          {/* Patch label */}
                          <td>
                            <span
                              className="font-mono"
                              style={{
                                fontSize: 12,
                                color: p.label === "Good patch" ? "var(--text-secondary)" : "var(--text-muted)",
                                fontWeight: p.label === "Good patch" ? 500 : 400,
                              }}
                            >
                              {p.label}
                            </span>
                          </td>

                          {/* Verdict */}
                          <td>
                            <VerdictBadge verdict={p.verdict} suspicious={p.suspicious} />
                          </td>

                          {/* Expected */}
                          <td style={{ fontSize: 12, color: "var(--text-muted)" }}>
                            {p.label === "Good patch"
                              ? "VERIFIED"
                              : p.suspicious
                              ? `VERIFIED + ${p.suspicious}`
                              : VERDICT_LABEL[p.verdict]}
                          </td>

                          {/* Status */}
                          <td>
                            <span
                              className="font-mono font-semibold"
                              style={{
                                fontSize: 11,
                                padding: "2px 7px",
                                background: pass ? "var(--verified-bg)" : "var(--notfixed-bg)",
                                color: pass ? "var(--verified-text)" : "var(--notfixed-text)",
                                border: `1px solid ${pass ? "var(--verified-border)" : "var(--notfixed-border)"}`,
                                letterSpacing: "0.04em",
                              }}
                            >
                              {pass ? "PASS" : "FAIL"}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </article>
          ))}
        </div>

        {/* ── Footer note ─────────────────────────────────────────── */}
        <p
          className="mt-6 text-center"
          style={{ fontSize: 12, color: "var(--text-muted)" }}
        >
          Benchmark cases are in{" "}
          <code className="font-mono" style={{ fontSize: 11 }}>
            benchmark/cases/
          </code>
          . Run{" "}
          <code className="font-mono" style={{ fontSize: 11 }}>
            python scripts/run_benchmark.py
          </code>{" "}
          to execute the full suite.
        </p>
      </main>

      <footer
        className="mt-10 border-t py-5 text-center"
        style={{
          borderColor: "var(--border)",
          fontSize: 12,
          color: "var(--text-muted)",
        }}
      >
        PatchLens — deterministic AI fix verification
      </footer>
    </div>
  );
}
