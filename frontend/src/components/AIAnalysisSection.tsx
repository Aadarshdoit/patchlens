import React from "react";

type Props = {
  analysis: string;
};

export default function AIAnalysisSection({ analysis }: Props) {
  return (
    <section className="pl-card">
      <div className="pl-card-header flex items-center gap-2">
        <div className="flex-1">
          <p className="pl-section-label">AI Analysis</p>
          <p className="mt-0.5" style={{ fontSize: 12, color: "var(--text-muted)" }}>
            Advisory — does not determine the verdict
          </p>
        </div>
        <span
          className="font-mono flex-shrink-0"
          style={{
            fontSize: 10,
            padding: "2px 7px",
            background: "var(--ibm-blue-light)",
            color: "var(--ibm-blue)",
            border: "1px solid var(--ibm-blue-border)",
            letterSpacing: "0.04em",
            fontFamily: "'IBM Plex Mono', monospace",
          }}
        >
          ADVISORY
        </span>
      </div>

      <div className="px-5 py-5">
        <p
          className="leading-relaxed whitespace-pre-wrap"
          style={{
            fontSize: 13.5,
            color: "var(--text-primary)",
            lineHeight: 1.7,
            fontFamily: "'IBM Plex Sans', sans-serif",
          }}
        >
          {analysis}
        </p>

        <p
          className="mt-4 pt-4 leading-relaxed"
          style={{
            fontSize: 11.5,
            color: "var(--text-muted)",
            borderTop: "1px solid var(--border)",
          }}
        >
          AI analysis is advisory. The final verdict is determined solely by PatchLens
          execution evidence.
        </p>
      </div>
    </section>
  );
}
