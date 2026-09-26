import React from "react";
import type { VerificationOutcome } from "@/lib/demo-data";

const CONFIG: Record<
  VerificationOutcome,
  { label: string; bg: string; text: string; border: string; dot: string }
> = {
  VERIFIED: {
    label: "VERIFIED",
    bg: "bg-green-50",
    text: "text-green-800",
    border: "border-green-300",
    dot: "bg-green-500",
  },
  NOT_FIXED: {
    label: "NOT FIXED",
    bg: "bg-red-50",
    text: "text-red-800",
    border: "border-red-300",
    dot: "bg-red-500",
  },
  INCONCLUSIVE: {
    label: "INCONCLUSIVE",
    bg: "bg-amber-50",
    text: "text-amber-800",
    border: "border-amber-300",
    dot: "bg-amber-500",
  },
};

type Props = {
  outcome: VerificationOutcome;
  large?: boolean;
};

export default function ResultBadge({ outcome, large = false }: Props) {
  const c = CONFIG[outcome];
  return (
    <span
      className={`inline-flex items-center gap-2 rounded border font-mono font-semibold tracking-widest ${c.bg} ${c.text} ${c.border} ${large ? "px-5 py-2 text-base" : "px-3 py-1 text-xs"}`}
    >
      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${c.dot}`} />
      {c.label}
    </span>
  );
}
