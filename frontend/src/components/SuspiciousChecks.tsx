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
            Static checks for suspicious patch patterns
          </p>
        </div>
        <span
          className="font-semibold rounded"
          style={{
            fontSize: 11,
            padding: "3px 10px",
            background: detected > 0 ? "#FDF8F0" : "#F0F7F2",
            color: detected > 0 ? "#A66A1F" : "#2F7D4A",
            border: `1px solid ${detected > 0 ? "#EDD9A3" : "#B8D9C4"}`,
          }}
        >
          {detected > 0 ? `${detected} flagged` : "All clear"}
        </span>
      </div>

      <ul className="divide-y" style={{ borderColor: "var(--border)" }}>
        {checks.map((check, i) => (
          <li key={i} className="px-6 py-3 flex items-start gap-3">
            {/* Status icon */}
            <span
              className="flex-shrink-0 mt-0.5"
              aria-hidden="true"
              style={{ color: check.detected ? "#A66A1F" : "#2F7D4A" }}
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
            <div className="min-w-0">
              <p
                className="font-medium text-sm"
                style={{ color: "var(--text-primary)" }}
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
                padding: "2px 7px",
                borderRadius: 4,
                background: check.detected ? "#FDF8F0" : "#F0F7F2",
                color: check.detected ? "#A66A1F" : "#2F7D4A",
                border: `1px solid ${check.detected ? "#EDD9A3" : "#B8D9C4"}`,
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
