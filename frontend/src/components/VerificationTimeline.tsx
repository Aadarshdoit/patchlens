import React from "react";
import type { TimelineStep } from "@/lib/demo-data";

type Props = {
  steps: TimelineStep[];
};

const STATUS_STYLES: Record<TimelineStep["status"], { circle: string; label: string }> = {
  done: {
    circle: "bg-green-500 border-green-500 text-white",
    label: "text-gray-800",
  },
  running: {
    circle: "bg-blue-500 border-blue-500 text-white",
    label: "text-gray-800",
  },
  pending: {
    circle: "bg-white border-gray-300 text-gray-400",
    label: "text-gray-400",
  },
  failed: {
    circle: "bg-red-500 border-red-500 text-white",
    label: "text-gray-800",
  },
};

const STATUS_ICON: Record<TimelineStep["status"], string> = {
  done: "✓",
  running: "…",
  pending: "○",
  failed: "✕",
};

export default function VerificationTimeline({ steps }: Props) {
  return (
    <section className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
          Verification Timeline
        </h2>
      </div>
      <ol className="px-6 py-5 space-y-0">
        {steps.map((step, idx) => {
          const s = STATUS_STYLES[step.status];
          const isLast = idx === steps.length - 1;
          return (
            <li key={step.id} className="flex gap-4">
              {/* Connector column */}
              <div className="flex flex-col items-center">
                <div
                  className={`w-7 h-7 rounded-full border-2 flex items-center justify-center text-xs font-bold flex-shrink-0 ${s.circle}`}
                >
                  {STATUS_ICON[step.status]}
                </div>
                {!isLast && (
                  <div className="w-px flex-1 bg-gray-200 my-1" style={{ minHeight: 20 }} />
                )}
              </div>

              {/* Content column */}
              <div className={`pb-5 ${isLast ? "pb-0" : ""} min-w-0`}>
                <div className="flex items-baseline gap-3 flex-wrap">
                  <span className={`text-sm font-semibold ${s.label}`}>{step.label}</span>
                  {step.durationMs !== undefined && (
                    <span className="text-xs text-gray-400 font-mono">
                      {step.durationMs} ms
                    </span>
                  )}
                </div>
                <p className="mt-0.5 text-xs text-gray-500 leading-relaxed">
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
