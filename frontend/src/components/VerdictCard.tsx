import React from "react";
import type { VerificationOutcome } from "@/lib/types";

const VERDICT: Record<
  VerificationOutcome,
  {
    bg: string;
    text: string;
    border: string;
    label: string;
    icon: React.ReactNode;
    description: string;
  }
> = {
  VERIFIED: {
    bg: "var(--verified-bg, #F0F7F2)",
    text: "#2F7D4A",
    border: "#B8D9C4",
    label: "VERIFIED",
    icon: (
      <svg viewBox="0 0 16 16" className="w-5 h-5 flex-shrink-0" fill="none" aria-hidden="true">
        <circle cx="8" cy="8" r="7" stroke="#2F7D4A" strokeWidth="1.5" />
        <path d="M5 8l2 2 4-4" stroke="#2F7D4A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    description: "Original failure resolved",
  },
  NOT_FIXED: {
    bg: "#FDF2F2",
    text: "#B54747",
    border: "#F0C0C0",
    label: "NOT FIXED",
    icon: (
      <svg viewBox="0 0 16 16" className="w-5 h-5 flex-shrink-0" fill="none" aria-hidden="true">
        <circle cx="8" cy="8" r="7" stroke="#B54747" strokeWidth="1.5" />
        <path d="M5.5 5.5l5 5M10.5 5.5l-5 5" stroke="#B54747" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
    description: "Original failure persists",
  },
  INCONCLUSIVE: {
    bg: "#FDF8F0",
    text: "#A66A1F",
    border: "#EDD9A3",
    label: "INCONCLUSIVE",
    icon: (
      <svg viewBox="0 0 16 16" className="w-5 h-5 flex-shrink-0" fill="none" aria-hidden="true">
        <circle cx="8" cy="8" r="7" stroke="#A66A1F" strokeWidth="1.5" />
        <path d="M8 5v4M8 11v.5" stroke="#A66A1F" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
    description: "Evidence was insufficient to establish a verified fix",
  },
};

type Props = {
  outcome: VerificationOutcome;
  reason: string | null;
};

export default function VerdictCard({ outcome, reason }: Props) {
  const v = VERDICT[outcome];

  return (
    <section
      className="rounded-lg border overflow-hidden"
      style={{ background: v.bg, borderColor: v.border }}
      aria-label={`Verification verdict: ${v.label}`}
    >
      <div className="px-6 py-5 flex items-start gap-4">
        {/* Icon */}
        <div className="flex-shrink-0 mt-0.5">{v.icon}</div>

        {/* Content */}
        <div className="min-w-0">
          <div className="flex items-baseline gap-3 flex-wrap">
            <span
              className="font-mono font-bold tracking-widest"
              style={{ fontSize: 15, color: v.text }}
            >
              {v.label}
            </span>
            <span style={{ fontSize: 13, color: v.text, opacity: 0.8 }}>
              {v.description}
            </span>
          </div>

          {reason && (
            <p
              className="mt-2 font-mono leading-relaxed"
              style={{ fontSize: 12, color: v.text, opacity: 0.75 }}
            >
              {reason}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
