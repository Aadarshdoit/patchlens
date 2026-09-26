import React from "react";
import Header from "@/components/Header";
import type { VerificationOutcome } from "@/lib/types";

type PatchEval = {
  label: "Good patch" | "Bad patch";
  verdict: VerificationOutcome;
  suspicious: string | null;
};

type BenchmarkCase = {
  id: string;
  title: string;
  description: string;
  evaluations: [PatchEval, PatchEval];
};

// ─── Benchmark data: CASE-001 through CASE-006 ─────────────────────────────
// Source: benchmark/cases/  |  12 evaluations total  |  12/12 passed
const CASES: BenchmarkCase[] = [
  {
    id: "CASE-001",
    title: "Unknown student crashes attendance lookup",
    description:
      "Looking up attendance for an unknown student crashes instead of handling the missing student.",
    evaluations: [
      { label: "Good patch", verdict: "VERIFIED",     suspicious: null },
      { label: "Bad patch",  verdict: "INCONCLUSIVE", suspicious: null },
    ],
  },
  {
    id: "CASE-002",
    title: "Unknown student crashes grade lookup",
    description:
      "Looking up the grade for an unknown student raises KeyError instead of returning None.",
    evaluations: [
      { label: "Good patch", verdict: "VERIFIED",  suspicious: null },
      { label: "Bad patch",  verdict: "NOT_FIXED", suspicious: null },
    ],
  },
  {
    id: "CASE-003",
    title: "Unknown student rank lookup crashes with KeyError",
    description:
      "Calling get_rank for an unknown student raises KeyError. A naive patch swaps KeyError for TypeError, which the comparator identifies as a different failure.",
    evaluations: [
      { label: "Good patch", verdict: "VERIFIED",     suspicious: null },
      { label: "Bad patch",  verdict: "INCONCLUSIVE", suspicious: null },
    ],
  },
  {
    id: "CASE-004",
    title: "Unknown student crashes enrollment lookup",
    description:
      "Calling get_course for an unknown student raises KeyError. The bad patch swallows the exception silently, masking the bug instead of fixing it properly.",
    evaluations: [
      { label: "Good patch", verdict: "VERIFIED", suspicious: null },
      { label: "Bad patch",  verdict: "VERIFIED", suspicious: "Exception swallowing" },
    ],
  },
  {
    id: "CASE-005",
    title: "Unknown student crashes library borrowed-count lookup",
    description:
      "Calling get_borrowed_count for an unknown student raises KeyError. The bad patch hard-codes a return value for student_id 999 instead of handling the general case.",
    evaluations: [
      { label: "Good patch", verdict: "VERIFIED", suspicious: null },
      { label: "Bad patch",  verdict: "VERIFIED", suspicious: "Hardcoded failing input" },
    ],
  },
  {
    id: "CASE-006",
    title: "Unknown student crashes fee lookup",
    description:
      "Calling get_fee for an unknown student raises KeyError. The bad patch silences the failure by weakening the test assertion instead of fixing the underlying service.",
    evaluations: [
      { label: "Good patch", verdict: "VERIFIED", suspicious: null },
      { label: "Bad patch",  verdict: "VERIFIED", suspicious: "Test modification" },
    ],
  },
];

// ─── Style maps ────────────────────────────────────────────────────────────
const VERDICT_STYLES: Record<
  VerificationOutcome,
  { text: string; bg: string; border: string }
> = {
  VERIFIED:     { text: "#2F7D4A", bg: "#F0F7F2", border: "#B8D9C4" },
  NOT_FIXED:    { text: "#B54747", bg: "#FDF2F2", border: "#F0C0C0" },
  INCONCLUSIVE: { text: "#A66A1F", bg: "#FDF8F0", border: "#EDD9A3" },
};

// ─── Sub-components ────────────────────────────────────────────────────────
function VerdictBadge({ verdict }: { verdict: VerificationOutcome }) {
  const vs = VERDICT_STYLES[verdict];
  return (
    <span
      className="font-mono font-semibold rounded"
      style={{
        fontSize: 10,
        padding: "2px 8px",
        background: vs.bg,
        color: vs.text,
        border: `1px solid ${vs.border}`,
        whiteSpace: "nowrap",
      }}
    >
      {verdict.replace("_", " ")}
    </span>
  );
}

function SuspiciousBadge({ label }: { label: string }) {
  return (
    <span
      className="font-mono rounded"
      style={{
        fontSize: 10,
        padding: "2px 7px",
        background: "#FFF8EC",
        color: "#A66A1F",
        border: "1px solid #EDD9A3",
        whiteSpace: "nowrap",
      }}
    >
      ⚠ {label}
    </span>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────
export default function BenchmarksPage() {
  const totalEvaluations = CASES.length * 2; // 12
  const allEvals = CASES.flatMap((c) => c.evaluations);
  const totalVerified     = allEvals.filter((e) => e.verdict === "VERIFIED").length;
  const totalNotFixed     = allEvals.filter((e) => e.verdict === "NOT_FIXED").length;
  const totalInconclusive = allEvals.filter((e) => e.verdict === "INCONCLUSIVE").length;
  const passed            = totalEvaluations; // all 12 match expected

  return (
    <div className="min-h-screen" style={{ background: "var(--bg-page)" }}>
      <Header activePage="benchmarks" />

      <main
        className="max-w-content mx-auto px-4 sm:px-6 py-8 space-y-6"
        style={{ maxWidth: 1200 }}
      >
        {/* ── Page header ─────────────────────────────────────────────── */}
        <div className="pl-card px-6 py-6">
          <p className="pl-section-label mb-2" style={{ fontSize: 10 }}>
            Testing &amp; Validation
          </p>
          <h1
            className="font-semibold tracking-tight"
            style={{ fontSize: 22, color: "var(--text-primary)" }}
          >
            Benchmarks
          </h1>
          <p
            className="mt-2 leading-relaxed"
            style={{ fontSize: 13, color: "var(--text-secondary)", maxWidth: 600 }}
          >
            PatchLens is tested against six benchmark cases covering verified fixes,
            incorrect fixes, and suspicious-patch edge cases. Each case evaluates both a
            good patch and a bad patch through the full deterministic verification pipeline.
          </p>

          {/* Summary stats */}
          <div className="mt-5 flex flex-wrap gap-6">
            {[
              { label: "Cases",        value: CASES.length,        color: "var(--text-primary)" },
              { label: "Evaluations",  value: totalEvaluations,    color: "var(--text-primary)" },
              { label: "Passed",       value: `${passed}/${totalEvaluations}`, color: "#2F7D4A" },
              { label: "Verified",     value: totalVerified,       color: "#2F7D4A" },
              { label: "Not fixed",    value: totalNotFixed,       color: "#B54747" },
              { label: "Inconclusive", value: totalInconclusive,   color: "#A66A1F" },
            ].map((stat) => (
              <div key={stat.label} className="flex items-baseline gap-1.5">
                <span
                  className="font-mono font-semibold"
                  style={{ fontSize: 22, color: stat.color }}
                >
                  {stat.value}
                </span>
                <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
                  {stat.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Cases table ─────────────────────────────────────────────── */}
        <section className="pl-card overflow-hidden">
          <div className="pl-card-header">
            <p className="pl-section-label">Benchmark Cases</p>
          </div>

          <div className="overflow-x-auto">
            <table
              className="w-full border-collapse"
              aria-label="Benchmark cases"
            >
              <thead>
                <tr
                  style={{
                    borderBottom: "1px solid var(--border)",
                    background: "var(--bg-secondary)",
                  }}
                >
                  {["Case", "Description", "Patch", "Verdict", "Suspicious finding"].map((h) => (
                    <th
                      key={h}
                      className="text-left px-5 py-3 pl-section-label"
                      style={{ fontSize: 10, fontWeight: 600 }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {CASES.map((c) =>
                  c.evaluations.map((ev, ei) => {
                    const isFirst = ei === 0;
                    const isLastInCase = ei === c.evaluations.length - 1;
                    return (
                      <tr
                        key={`${c.id}-${ev.label}`}
                        style={{
                          borderBottom: isLastInCase
                            ? "2px solid var(--border)"
                            : "1px dashed var(--border)",
                        }}
                      >
                        {/* Case ID — only shown on first row of the case */}
                        <td
                          className="px-5 py-3 font-mono font-semibold"
                          style={{
                            fontSize: 12,
                            color: "var(--text-primary)",
                            whiteSpace: "nowrap",
                            verticalAlign: "top",
                            paddingTop: isFirst ? 14 : 6,
                            opacity: isFirst ? 1 : 0,
                          }}
                        >
                          {c.id}
                        </td>

                        {/* Description — only shown on first row */}
                        <td
                          className="px-5 py-3"
                          style={{
                            fontSize: 13,
                            color: "var(--text-secondary)",
                            verticalAlign: "top",
                            maxWidth: 320,
                            paddingTop: isFirst ? 14 : 6,
                            opacity: isFirst ? 1 : 0,
                          }}
                        >
                          {c.description}
                        </td>

                        {/* Patch label */}
                        <td
                          className="px-5 py-3 whitespace-nowrap"
                          style={{
                            fontSize: 12,
                            color: "var(--text-muted)",
                            verticalAlign: "middle",
                          }}
                        >
                          {ev.label}
                        </td>

                        {/* Verdict badge */}
                        <td className="px-5 py-3 whitespace-nowrap" style={{ verticalAlign: "middle" }}>
                          <VerdictBadge verdict={ev.verdict} />
                        </td>

                        {/* Suspicious */}
                        <td className="px-5 py-3" style={{ verticalAlign: "middle" }}>
                          {ev.suspicious ? (
                            <SuspiciousBadge label={ev.suspicious} />
                          ) : (
                            <span style={{ fontSize: 12, color: "var(--text-muted)" }}>—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* ── Footer note ──────────────────────────────────────────────── */}
        <p
          className="text-center"
          style={{ fontSize: 12, color: "var(--text-muted)" }}
        >
          Benchmark cases are located in{" "}
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
        className="mt-12 border-t py-5 text-center"
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
