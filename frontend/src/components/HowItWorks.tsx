import React from "react";

const STEPS = [
  {
    n: "1",
    title: "Bug evidence",
    body: "A bug report and reproduction command describe the failure to be verified.",
  },
  {
    n: "2",
    title: "Reproduce original failure",
    body: "PatchLens runs the reproduction command against the unpatched code and captures the failure signature.",
  },
  {
    n: "3",
    title: "Apply candidate patch",
    body: "The candidate diff is applied to a clean working copy in an isolated environment.",
  },
  {
    n: "4",
    title: "Re-run original failure",
    body: "The same reproduction command is executed against the patched codebase.",
  },
  {
    n: "5",
    title: "Compare evidence",
    body: "Exit codes, exception fingerprints, stdout and stderr are diffed between both runs.",
  },
  {
    n: "6",
    title: "Run tests",
    body: "The full test suite is executed to detect regressions introduced by the patch.",
  },
  {
    n: "7",
    title: "Deterministic verdict",
    body: "PatchLens emits VERIFIED, NOT FIXED, or INCONCLUSIVE — no heuristics, no guessing.",
  },
];

export default function HowItWorks() {
  return (
    <section className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
          How PatchLens Works
        </h2>
        <p className="mt-0.5 text-xs text-gray-400">
          End-to-end deterministic verification pipeline.
        </p>
      </div>
      <div className="px-6 py-5">
        <ol className="space-y-4">
          {STEPS.map((step) => (
            <li key={step.n} className="flex gap-3">
              <span className="w-6 h-6 rounded-full bg-gray-900 text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
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
