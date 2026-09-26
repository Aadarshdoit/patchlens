import React from "react";
import type { SuspiciousCheck } from "@/lib/types";

type Props = {
  checks: SuspiciousCheck[];
};

export default function SuspiciousChecks({ checks }: Props) {
  const detected = checks.filter((c) => c.detected).length;

  return (
    <section className="pl-card">
      <div className="pl-card-header flex items-center justify-between">
        <div>
          <p className="pl-section-label">Patch Integrity</p>
          <p className="mt-0.5" style={{ fontSize: 12, color: "var(--text-muted)" }}>
            Static analysis for suspicious patterns
          </p>
        </div>
        <span
          className="font-mono font-semibold"
          style={{
            fontSize: 10,
            padding: "2px 8px",
            background: detected > 0 ? "var(--inconclusive-bg)" : "var(--verified-bg)",
            color: detected > 0 ? "var(--inconclusive-text)" : "var(--verified-text)",
            border: `1px solid ${detected > 0 ? "var(--inconclusive-border)" : "var(--verified-border)"}`,
            letterSpacing: "0.04em",
            fontFamily: "'IBM Plex Mono', monospace",
          }}
        >
          {detected > 0 ? `${detected} flagged` : "All clear"}
        </span>
      </div>

      <ul className="divide-y" style={{ borderColor: "var(--border)" }}>
        {checks.map((check, i) => (
          <li key={i} className="px-5 py-3 flex items-start gap-3">
            {/* Icon */}
            <span
              className="flex-shrink-0 mt-0.5"
              aria-hidden="true"
              style={{ color: check.detected ? "var(--inconclusive-icon)" : "var(--verified-icon)" }}
            >
              {check.detected ? (
                <svg viewBox="0 0 14 14" className="w-3.5 h-3.5" fill="none">
                  <circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.4" />
                  <path d="M7 4v3.5M7 9.5v.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                </svg>
              ) : (
                <svg viewBox="0 0 14 14" className="w-3.5 h-3.5" fill="none">
                  <circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.4" />
                  <path d="M4.5 7l2 2 3-3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </span>

            {/* Content */}
            <div className="min-w-0 flex-1">
              <p
                className="font-medium"
                style={{ fontSize: 13, color: "var(--text-primary)", fontFamily: "'IBM Plex Sans', sans-serif" }}
              >
                {check.name}
              </p>
              <p
                className="mt-0.5 leading-relaxed"
                style={{ fontSize: 12, color: "var(--text-muted)" }}
              >
                {check.reason}
              </p>
            </div>

            {/* Label */}
            <span
              className="ml-auto flex-shrink-0 font-mono font-semibold"
              style={{
                fontSize: 10,
                padding: "2px 6px",
                background: check.detected ? "var(--inconclusive-bg)" : "var(--verified-bg)",
                color: check.detected ? "var(--inconclusive-text)" : "var(--verified-text)",
                border: `1px solid ${check.detected ? "var(--inconclusive-border)" : "var(--verified-border)"}`,
                letterSpacing: "0.04em",
                fontFamily: "'IBM Plex Mono', monospace",
              }}
            >
              {check.detected ? "DETECTED" : "CLEAR"}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
