import React from "react";
import type { TimelineStep } from "@/lib/types";

const STEP_ICONS: Record<TimelineStep["status"], React.ReactNode> = {
  done: (
    <svg viewBox="0 0 12 12" className="w-3 h-3" fill="none" aria-hidden="true">
      <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  running: (
    <span
      className="w-2 h-2 rounded-full block animate-pulse"
      style={{ background: "currentColor" }}
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
    <svg viewBox="0 0 12 12" className="w-3 h-3" fill="none" aria-hidden="true">
      <path d="M3 3l6 6M9 3l-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),
};

const STEP_COLORS: Record<
  TimelineStep["status"],
  { circle: string; text: string; meta: string }
> = {
  done: { circle: "#2F7D4A", text: "var(--text-primary)", meta: "#2F7D4A" },
  running: { circle: "#A66A1F", text: "var(--text-primary)", meta: "#A66A1F" },
  pending: { circle: "var(--border-strong)", text: "var(--text-muted)", meta: "var(--text-muted)" },
  failed: { circle: "#B54747", text: "var(--text-primary)", meta: "#B54747" },
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
        <div>
          <p className="pl-section-label">Verification Timeline</p>
          <p className="mt-0.5" style={{ fontSize: 12, color: "var(--text-muted)" }}>
            Step-by-step pipeline execution
          </p>
        </div>
        {totalMs > 0 && (
          <span className="font-mono" style={{ fontSize: 12, color: "var(--text-muted)" }}>
            {fmt(totalMs)} total
          </span>
        )}
      </div>

      <ol className="px-6 py-4 space-y-0" aria-label="Verification steps">
        {steps.map((step, idx) => {
          const c = STEP_COLORS[step.status];
          const isLast = idx === steps.length - 1;
          return (
            <li key={step.id} className="flex gap-3.5">
              {/* Track */}
              <div className="flex flex-col items-center flex-shrink-0">
                <div
                  className="w-6 h-6 rounded-full border flex items-center justify-center flex-shrink-0"
                  style={{
                    background: step.status === "pending" ? "transparent" : c.circle,
                    borderColor: step.status === "pending" ? "var(--border)" : c.circle,
                    color:
                      step.status === "pending"
                        ? "var(--border-strong)"
                        : "#fff",
                  }}
                  aria-hidden="true"
                >
                  {STEP_ICONS[step.status]}
                </div>
                {!isLast && (
                  <div
                    className="w-px flex-1 my-1"
                    style={{ background: "var(--border)", minHeight: 20 }}
                    aria-hidden="true"
                  />
                )}
              </div>

              {/* Content */}
              <div className={`${isLast ? "pb-0" : "pb-4"} min-w-0 flex-1 pt-0.5`}>
                <div className="flex items-baseline gap-2 flex-wrap">
                  <span
                    className="text-sm font-medium"
                    style={{ color: c.text }}
                  >
                    {step.label}
                  </span>
                  {step.durationMs !== undefined && (
                    <span
                      className="font-mono"
                      style={{ fontSize: 11, color: c.meta }}
                    >
                      {fmt(step.durationMs)}
                    </span>
                  )}
                </div>
                <p
                  className="mt-0.5 leading-relaxed"
                  style={{ fontSize: 12, color: "var(--text-muted)" }}
                >
                  {step.description}
                </p>
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
