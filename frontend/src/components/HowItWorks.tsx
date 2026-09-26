import React from "react";

const STEPS = [
  {
    n: "1",
    title: "AI generates a fix",
    body: "An LLM or AI system produces a candidate patch for a reported bug.",
  },
  {
    n: "2",
    title: "Reproduce the original failure",
    body: "PatchLens runs the reproduction command against the unpatched code and captures the failure signature.",
  },
  {
    n: "3",
    title: "Apply the patch",
    body: "The candidate diff is applied to a clean working copy in an isolated environment.",
  },
  {
    n: "4",
    title: "Reproduce again",
    body: "The same reproduction command is executed against the patched code.",
  },
  {
    n: "5",
    title: "Compare evidence",
    body: "Exit codes, exception fingerprints, stdout and stderr are diffed between both runs.",
  },
  {
    n: "6",
    title: "Deterministic verdict",
    body: "PatchLens emits VERIFIED, NOT FIXED, or INCONCLUSIVE — no heuristics, no guessing.",
  },
];

export default function HowItWorks() {
  return (
    <section className="bg-gray-50 border border-gray-200 rounded-lg overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
          How PatchLens Works
        </h2>
      </div>
      <div className="px-6 py-5">
        <ol className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {STEPS.map((step) => (
            <li key={step.n} className="flex gap-3">
              <span className="w-6 h-6 rounded-full bg-gray-200 text-gray-600 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                {step.n}
              </span>
              <div>
                <p className="text-sm font-semibold text-gray-800">{step.title}</p>
                <p className="mt-0.5 text-xs text-gray-500 leading-relaxed">{step.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
