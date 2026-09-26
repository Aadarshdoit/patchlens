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
    <div className="grid gap-1 py-2.5 border-b" style={{ gridTemplateColumns: "160px 1fr", borderColor: "var(--border)" }}>
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
          color: warn ? "#B54747" : "var(--text-primary)",
          fontWeight: warn ? 600 : 400,
          wordBreak: "break-all",
          lineHeight: 1.5,
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
          Fingerprint used to confirm the original failure was reproduced and subsequently resolved
        </p>
      </div>
      <dl className="px-6 py-1">
        <Row label="Exception" value={sig.exceptionType} mono warn />
        <Row label="Message" value={sig.message} />
        <Row label="Source" value={sig.sourceLocation} mono />
        <Row label="Input" value={sig.reproductionInput} mono />
      </dl>
    </section>
  );
}
