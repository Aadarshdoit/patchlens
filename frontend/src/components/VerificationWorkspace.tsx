import React from "react";
import type { VerificationJob } from "@/lib/demo-data";
import ResultBadge from "./ResultBadge";

type Props = {
  job: VerificationJob;
  onVerify: () => void;
};

export default function VerificationWorkspace({ job, onVerify }: Props) {
  return (
    <section className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
            Verification Workspace
          </h2>
          <p className="mt-1 text-xs text-gray-400 font-mono">Job ID: {job.id}</p>
        </div>
        {job.outcome && (
          <ResultBadge outcome={job.outcome} large />
        )}
      </div>

      <div className="px-6 py-5 grid gap-6">
        {/* Bug description */}
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
            Original Bug / Failure Evidence
          </label>
          <p className="text-sm text-gray-800 leading-relaxed bg-gray-50 border border-gray-200 rounded p-4">
            {job.bugDescription}
          </p>
        </div>

        {/* Reproduction command */}
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
            Reproduction Command
          </label>
          <code className="block text-sm font-mono bg-gray-900 text-green-400 rounded px-4 py-3 whitespace-pre-wrap break-all">
            $ {job.reproductionCommand}
          </code>
        </div>

        {/* Patch */}
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
            Candidate Patch (diff)
          </label>
          <pre className="text-xs font-mono bg-gray-950 text-gray-100 rounded p-4 overflow-x-auto leading-relaxed">
            {job.patch.split("\n").map((line, i) => (
              <span
                key={i}
                className={
                  line.startsWith("+")
                    ? "text-green-400 block"
                    : line.startsWith("-")
                    ? "text-red-400 block"
                    : line.startsWith("@")
                    ? "text-blue-400 block"
                    : "text-gray-300 block"
                }
              >
                {line}
              </span>
            ))}
          </pre>
        </div>

        {/* CTA */}
        <div className="flex items-center gap-4 pt-2">
          <button
            onClick={onVerify}
            className="px-6 py-2.5 bg-gray-900 text-white text-sm font-semibold rounded hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2"
          >
            Verify Fix
          </button>
          <span className="text-xs text-gray-400">
            Runs a deterministic end-to-end verification pipeline
          </span>
        </div>
      </div>
    </section>
  );
}
