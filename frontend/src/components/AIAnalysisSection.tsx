import React from "react";

type Props = {
  analysis: string;
};

export default function AIAnalysisSection({ analysis }: Props) {
  return (
    <section className="pl-card">
      <div className="pl-card-header">
        <p className="pl-section-label">AI Analysis</p>
        <p className="mt-0.5" style={{ fontSize: 12, color: "var(--text-muted)" }}>
          GPT model · Advisory
        </p>
      </div>

      <div className="px-6 py-5 space-y-4">
        <p
          className="leading-relaxed whitespace-pre-wrap"
          style={{ fontSize: 13.5, color: "var(--text-primary)", lineHeight: 1.65 }}
        >
          {analysis}
        </p>

        <p
          className="pt-3 leading-relaxed"
          style={{
            fontSize: 11.5,
            color: "var(--text-muted)",
            borderTop: "1px solid var(--border)",
          }}
        >
          AI analysis is advisory. The final verdict is determined by PatchLens execution evidence.
        </p>
      </div>
    </section>
  );
}
