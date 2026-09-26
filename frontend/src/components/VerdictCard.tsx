import React from "react";
import type { VerificationOutcome } from "@/lib/types";

const VERDICT: Record<
  VerificationOutcome,
  {
    bg: string;
    text: string;
    border: string;
    accentBar: string;
    label: string;
    icon: React.ReactNode;
    description: string;
  }
> = {
  VERIFIED: {
    bg: "var(--verified-bg)",
    text: "var(--verified-text)",
    border: "var(--verified-border)",
    accentBar: "var(--verified-icon)",
    label: "VERIFIED",
    icon: (
      <svg viewBox="0 0 16 16" className="w-5 h-5 flex-shrink-0" fill="none" aria-hidden="true">
        <circle cx="8" cy="8" r="7" stroke="var(--verified-icon)" strokeWidth="1.5" />
        <path d="M5 8l2 2 4-4" stroke="var(--verified-icon)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    description: "Original failure resolved. Patch confirmed effective.",
  },
  NOT_FIXED: {
    bg: "var(--notfixed-bg)",
    text: "var(--notfixed-text)",
    border: "var(--notfixed-border)",
    accentBar: "var(--notfixed-icon)",
    label: "NOT FIXED",
    icon: (
      <svg viewBox="0 0 16 16" className="w-5 h-5 flex-shrink-0" fill="none" aria-hidden="true">
        <circle cx="8" cy="8" r="7" stroke="var(--notfixed-icon)" strokeWidth="1.5" />
        <path d="M5.5 5.5l5 5M10.5 5.5l-5 5" stroke="var(--notfixed-icon)" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
    description: "Original failure still present after applying the patch.",
  },
  INCONCLUSIVE: {
    bg: "var(--inconclusive-bg)",
    text: "var(--inconclusive-text)",
    border: "var(--inconclusive-border)",
    accentBar: "var(--inconclusive-icon)",
    label: "INCONCLUSIVE",
    icon: (
      <svg viewBox="0 0 16 16" className="w-5 h-5 flex-shrink-0" fill="none" aria-hidden="true">
        <circle cx="8" cy="8" r="7" stroke="var(--inconclusive-icon)" strokeWidth="1.5" />
        <path d="M8 5v4M8 11v.5" stroke="var(--inconclusive-icon)" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
    description: "Evidence was insufficient to confirm the fix.",
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
      className="border overflow-hidden"
      style={{
        background: v.bg,
        borderColor: v.border,
        borderLeft: `4px solid ${v.accentBar}`,
      }}
      aria-label={`Verification verdict: ${v.label}`}
    >
      <div className="px-6 py-5 flex items-start gap-4">
        {/* Icon */}
        <div className="flex-shrink-0 mt-0.5">{v.icon}</div>

        {/* Content */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <span
              className="font-mono font-bold tracking-widest"
              style={{
                fontSize: 14,
                color: v.text,
                fontFamily: "'IBM Plex Mono', monospace",
                letterSpacing: "0.1em",
              }}
            >
              {v.label}
            </span>
            <span
              style={{
                fontSize: 14,
                color: v.text,
                opacity: 0.85,
                fontFamily: "'IBM Plex Sans', sans-serif",
              }}
            >
              {v.description}
            </span>
          </div>

          {reason && (
            <p
              className="mt-2 font-mono leading-relaxed"
              style={{
                fontSize: 12,
                color: v.text,
                opacity: 0.7,
                fontFamily: "'IBM Plex Mono', monospace",
              }}
            >
              {reason}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
