import React from "react";
import type { FailureSignature as FailureSignatureType } from "@/lib/types";

type Props = {
  sig: FailureSignatureType;
};

type RowProps = {
  label: string;
  value: string;
  mono?: boolean;
  warn?: boolean;
};

function Row({ label, value, mono = false, warn = false }: RowProps) {
  return (
    <div
      className="grid gap-1 py-2.5"
      style={{
        gridTemplateColumns: "140px 1fr",
        borderBottom: "1px solid var(--border)",
      }}
    >
      <dt
        className="pl-section-label self-start pt-0.5"
        style={{ fontSize: 10 }}
      >
        {label}
      </dt>
      <dd
        className={mono ? "font-mono" : ""}
        style={{
          fontSize: 13,
          color: warn ? "var(--notfixed-text)" : "var(--text-primary)",
          fontWeight: warn ? 600 : 400,
          wordBreak: "break-all",
          lineHeight: 1.5,
          fontFamily: mono ? "'IBM Plex Mono', monospace" : "'IBM Plex Sans', sans-serif",
        }}
      >
        {value}
      </dd>
    </div>
  );
}

export default function FailureSignature({ sig }: Props) {
  return (
    <section className="pl-card">
      <div className="pl-card-header">
        <p className="pl-section-label">Failure Signature</p>
        <p className="mt-0.5" style={{ fontSize: 12, color: "var(--text-muted)" }}>
          Used to confirm the original failure was reproduced and resolved
        </p>
      </div>
      <dl className="px-5 py-1" style={{ borderBottom: "1px solid var(--border)" }}>
        <Row label="Exception" value={sig.exceptionType} mono warn />
        <Row label="Message"   value={sig.message} />
        <Row label="Source"    value={sig.sourceLocation} mono />
        <Row label="Input"     value={sig.reproductionInput} mono />
      </dl>
    </section>
  );
}
