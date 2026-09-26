import React from "react";
import type { ExecutionResult } from "@/lib/demo-data";

type PanelProps = {
  exec: ExecutionResult;
};

function ExecutionPanel({ exec }: PanelProps) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h3 className="text-sm font-semibold text-gray-700">{exec.label}</h3>
        <div className="flex items-center gap-3">
          <span
            className={`text-xs font-mono font-semibold px-2 py-0.5 rounded border ${
              exec.failed
                ? "bg-red-50 text-red-700 border-red-200"
                : "bg-green-50 text-green-700 border-green-200"
            }`}
          >
            exit {exec.exitCode}
          </span>
          <span className="text-xs text-gray-400 font-mono">{exec.durationMs} ms</span>
          <span
            className={`text-xs font-semibold ${
              exec.failed ? "text-red-600" : "text-green-600"
            }`}
          >
            {exec.failed ? "FAILED" : "PASSED"}
          </span>
        </div>
      </div>

      <code className="block text-xs font-mono bg-gray-900 text-green-400 rounded px-3 py-2">
        $ {exec.command}
      </code>

      {exec.stdout && (
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">
            stdout
          </p>
          <pre className="text-xs font-mono bg-gray-50 border border-gray-200 rounded p-3 whitespace-pre-wrap text-gray-700 leading-relaxed">
            {exec.stdout}
          </pre>
        </div>
      )}

      {exec.stderr && (
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">
            stderr
          </p>
          <pre className="text-xs font-mono bg-red-50 border border-red-200 rounded p-3 whitespace-pre-wrap text-red-700 leading-relaxed">
            {exec.stderr}
          </pre>
        </div>
      )}
    </div>
  );
}

type Props = {
  original: ExecutionResult;
  patched: ExecutionResult;
};

export default function ExecutionComparison({ original, patched }: Props) {
  return (
    <section className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
          Execution Comparison
        </h2>
      </div>
      <div className="px-6 py-5 grid md:grid-cols-2 gap-6 divide-y md:divide-y-0 md:divide-x divide-gray-100">
        <ExecutionPanel exec={original} />
        <div className="pt-6 md:pt-0 md:pl-6">
          <ExecutionPanel exec={patched} />
        </div>
      </div>
    </section>
  );
}
