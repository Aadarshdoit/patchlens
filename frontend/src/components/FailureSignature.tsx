import React from "react";
import type { FailureSignature as FailureSignatureType } from "@/lib/demo-data";

type Props = {
  sig: FailureSignatureType;
};

type RowProps = {
  label: string;
  value: string;
  mono?: boolean;
};

function Row({ label, value, mono = false }: RowProps) {
  return (
    <div className="grid sm:grid-cols-[180px,1fr] gap-1 sm:gap-4 py-3 border-b border-gray-100 last:border-0">
      <dt className="text-xs font-semibold text-gray-500 uppercase tracking-wide self-start pt-0.5">
        {label}
      </dt>
      <dd className={`text-sm text-gray-800 break-all ${mono ? "font-mono" : ""}`}>
        {value}
      </dd>
    </div>
  );
}

export default function FailureSignature({ sig }: Props) {
  return (
    <section className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
          Failure Signature
        </h2>
        <p className="mt-1 text-xs text-gray-400">
          Fingerprint used to confirm the original failure was reproduced and then resolved.
        </p>
      </div>
      <dl className="px-6 py-2">
        <Row label="Exception Type" value={sig.exceptionType} mono />
        <Row label="Message" value={sig.message} />
        <Row label="Source Location" value={sig.sourceLocation} mono />
        <Row label="Reproduction Input" value={sig.reproductionInput} mono />
      </dl>
    </section>
  );
}
