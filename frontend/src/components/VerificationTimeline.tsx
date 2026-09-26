import React from "react";
import type { TimelineStep } from "@/lib/types";

const STEP_ICON: Record<TimelineStep["status"], React.ReactNode> = {
  done: (
    <svg viewBox="0 0 10 10" className="w-2.5 h-2.5" fill="none" aria-hidden="true">
      <path d="M2 5l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  running: (
    <span
      className="w-2 h-2 rounded-full block"
      style={{ background: "currentColor", animation: "pulse 1.2s ease-in-out infinite" }}
      aria-label="Running"
    />
  ),
  pending: (
    <span
      className="w-1.5 h-1.5 rounded-full block"
      style={{ background: "var(--border-strong)" }}
      aria-hidden="true"
    />
  ),
  failed: (
    <svg viewBox="0 0 10 10" className="w-2.5 h-2.5" fill="none" aria-hidden="true">
      <path d="M2 2l6 6M8 2l-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),
};

const STEP_COLORS: Record<
  TimelineStep["status"],
  { bg: string; border: string; fg: string; text: string }
> = {
  done:    { bg: "var(--verified-icon)", border: "var(--verified-icon)", fg: "#fff", text: "var(--text-primary)" },
  running: { bg: "var(--inconclusive-icon)", border: "var(--inconclusive-icon)", fg: "#fff", text: "var(--text-primary)" },
  pending: { bg: "transparent", border: "var(--border-strong)", fg: "var(--border-strong)", text: "var(--text-muted)" },
  failed:  { bg: "var(--notfixed-icon)", border: "var(--notfixed-icon)", fg: "#fff", text: "var(--text-primary)" },
};

function fmt(ms: number): string {
  return ms >= 1000 ? `${(ms / 1000).toFixed(2)}s` : `${ms}ms`;
}

type Props = {
  steps: TimelineStep[];
};

export default function VerificationTimeline({ steps }: Props) {
  const totalMs = steps.reduce((s, step) => s + (step.durationMs ?? 0), 0);

  return (
    <section className="pl-card">
      <div className="pl-card-header flex items-center justify-between">
        <p className="pl-section-label">Pipeline</p>
        {totalMs > 0 && (
          <span
            className="font-mono"
            style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "'IBM Plex Mono', monospace" }}
          >
            {fmt(totalMs)}
          </span>
        )}
      </div>

      <ol className="px-5 py-4 space-y-0" aria-label="Verification steps">
        {steps.map((step, idx) => {
          const c = STEP_COLORS[step.status];
          const isLast = idx === steps.length - 1;
          return (
            <li key={step.id} className="flex gap-3">
              {/* Track */}
              <div className="flex flex-col items-center flex-shrink-0" style={{ width: 22 }}>
                <div
                  className="w-5 h-5 border flex items-center justify-center flex-shrink-0"
                  style={{
                    background: c.bg,
                    borderColor: c.border,
                    color: c.fg,
                    borderRadius: 0,
                  }}
                  aria-hidden="true"
                >
                  {STEP_ICON[step.status]}
                </div>
                {!isLast && (
                  <div
                    className="w-px flex-1 my-1"
                    style={{ background: "var(--border)", minHeight: 16 }}
                    aria-hidden="true"
                  />
                )}
              </div>

              {/* Content */}
              <div className={`${isLast ? "pb-0" : "pb-3.5"} min-w-0 flex-1 pt-0.5`}>
                <div className="flex items-baseline gap-2 flex-wrap">
                  <span
                    className="text-sm font-medium"
                    style={{ fontSize: 13, color: c.text, fontFamily: "'IBM Plex Sans', sans-serif" }}
                  >
                    {step.label}
                  </span>
                  {step.durationMs !== undefined && (
                    <span
                      className="font-mono"
                      style={{ fontSize: 10, color: "var(--verified-text)", fontFamily: "'IBM Plex Mono', monospace" }}
                    >
                      {fmt(step.durationMs)}
                    </span>
                  )}
                </div>
                <p
                  className="mt-0.5 leading-relaxed"
                  style={{ fontSize: 11.5, color: "var(--text-muted)" }}
                >
                  {step.description}
                </p>
              </div>
            </li>
          );
        })}
      </ol>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
      `}</style>
    </section>
  );
}
