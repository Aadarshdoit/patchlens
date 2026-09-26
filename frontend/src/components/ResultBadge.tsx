import React from "react";
import type { VerificationOutcome } from "@/lib/demo-data";

const CONFIG: Record<
  VerificationOutcome,
  { label: string; bg: string; text: string; border: string; dot: string; ring: string }
> = {
  VERIFIED: {
    label: "VERIFIED",
    bg: "bg-green-50",
    text: "text-green-800",
    border: "border-green-300",
    dot: "bg-green-500",
    ring: "ring-green-100",
  },
  NOT_FIXED: {
    label: "NOT FIXED",
    bg: "bg-red-50",
    text: "text-red-800",
    border: "border-red-300",
    dot: "bg-red-500",
    ring: "ring-red-100",
  },
  INCONCLUSIVE: {
    label: "INCONCLUSIVE",
    bg: "bg-amber-50",
    text: "text-amber-800",
    border: "border-amber-300",
    dot: "bg-amber-400",
    ring: "ring-amber-100",
  },
};

type Props = {
  outcome: VerificationOutcome;
  large?: boolean;
};

export default function ResultBadge({ outcome, large = false }: Props) {
  const c = CONFIG[outcome];
  if (large) {
    return (
      <span
        className={`inline-flex items-center gap-2.5 rounded-lg border-2 font-mono font-bold tracking-widest ${c.bg} ${c.text} ${c.border} px-6 py-2.5 text-lg ring-4 ${c.ring}`}
      >
        <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${c.dot}`} />
        {c.label}
      </span>
    );
  }
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded border font-mono font-semibold tracking-wider ${c.bg} ${c.text} ${c.border} px-2.5 py-0.5 text-xs`}
    >
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${c.dot}`} />
      {c.label}
    </span>
  );
}
