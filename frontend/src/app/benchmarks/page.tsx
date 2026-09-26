import React from "react";
import Header from "@/components/Header";
import type { VerificationOutcome } from "@/lib/types";

type BenchmarkCase = {
  id: string;
  description: string;
  verdict: VerificationOutcome;
  durationS: number;
  repository: string;
  patchFile: string;
};

// Static benchmark table — populated from benchmark/cases/
const CASES: BenchmarkCase[] = [
  {
    id: "CASE-001",
    description: "Unknown student lookup — KeyError on missing dict key",
    verdict: "VERIFIED",
    durationS: 2.46,
    repository: "demo-repo",
    patchFile: "benchmark/good_fix.diff",
  },
];

const VERDICT_STYLES: Record<
  VerificationOutcome,
  { text: string; bg: string; border: string }
> = {
  VERIFIED: { text: "#2F7D4A", bg: "#F0F7F2", border: "#B8D9C4" },
  NOT_FIXED: { text: "#B54747", bg: "#FDF2F2", border: "#F0C0C0" },
  INCONCLUSIVE: { text: "#A66A1F", bg: "#FDF8F0", border: "#EDD9A3" },
};

export default function BenchmarksPage() {
  const totalVerified = CASES.filter((c) => c.verdict === "VERIFIED").length;
  const totalNotFixed = CASES.filter((c) => c.verdict === "NOT_FIXED").length;
  const totalInconclusive = CASES.filter((c) => c.verdict === "INCONCLUSIVE").length;

  return (
    <div className="min-h-screen" style={{ background: "var(--bg-page)" }}>
      <Header activePage="benchmarks" />

      <main
        className="max-w-content mx-auto px-4 sm:px-6 py-8 space-y-6"
        style={{ maxWidth: 1200 }}
      >
        {/* Page header */}
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
            style={{ fontSize: 13, color: "var(--text-secondary)", maxWidth: 560 }}
          >
            PatchLens is tested against a set of benchmark cases covering verified fixes,
            incorrect fixes, and edge cases. Each case runs the full deterministic
            verification pipeline.
          </p>

          {/* Summary stats */}
          <div className="mt-5 flex flex-wrap gap-5">
            {[
              { label: "Total cases", value: CASES.length, color: "var(--text-primary)" },
              { label: "Verified", value: totalVerified, color: "#2F7D4A" },
              { label: "Not fixed", value: totalNotFixed, color: "#B54747" },
              { label: "Inconclusive", value: totalInconclusive, color: "#A66A1F" },
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

        {/* Cases table */}
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
                <tr style={{ borderBottom: "1px solid var(--border)", background: "var(--bg-secondary)" }}>
                  {["Case", "Description", "Verdict", "Duration", "Patch file"].map((h) => (
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
                {CASES.map((c, i) => {
                  const vs = VERDICT_STYLES[c.verdict];
                  return (
                    <tr
                      key={c.id}
                      style={{
                        borderBottom: i < CASES.length - 1 ? `1px solid var(--border)` : "none",
                      }}
                    >
                      <td
                        className="px-5 py-3.5 font-mono font-semibold"
                        style={{ fontSize: 12, color: "var(--text-primary)", whiteSpace: "nowrap" }}
                      >
                        {c.id}
                      </td>
                      <td
                        className="px-5 py-3.5"
                        style={{ fontSize: 13, color: "var(--text-secondary)" }}
                      >
                        {c.description}
                      </td>
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <span
                          className="font-mono font-semibold rounded"
                          style={{
                            fontSize: 10,
                            padding: "2px 8px",
                            background: vs.bg,
                            color: vs.text,
                            border: `1px solid ${vs.border}`,
                          }}
                        >
                          {c.verdict.replace("_", " ")}
                        </span>
                      </td>
                      <td
                        className="px-5 py-3.5 font-mono whitespace-nowrap"
                        style={{ fontSize: 12, color: "var(--text-muted)" }}
                      >
                        {c.durationS.toFixed(2)}s
                      </td>
                      <td
                        className="px-5 py-3.5 font-mono"
                        style={{ fontSize: 11, color: "var(--text-muted)" }}
                      >
                        {c.patchFile}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        {/* Note */}
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
