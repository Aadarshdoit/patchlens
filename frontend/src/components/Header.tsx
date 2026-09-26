import React from "react";

type Props = {
  onVerifyClick: () => void;
};

export default function Header({ onVerifyClick }: Props) {
  return (
    <header className="border-b border-gray-200 bg-white sticky top-0 z-10">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {/* Logo mark */}
          <div className="w-8 h-8 rounded bg-gray-900 flex items-center justify-center flex-shrink-0">
            <svg viewBox="0 0 24 24" className="w-4 h-4 text-white fill-current">
              <path d="M12 2L2 7v10l10 5 10-5V7L12 2zm0 2.18L20 8.5v7l-8 4-8-4v-7l8-4.32z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          </div>
          <div>
            <span className="font-semibold text-gray-900 text-lg leading-none tracking-tight">
              PatchLens
            </span>
            <p className="text-xs text-gray-500 mt-0.5 leading-none">
              AI writes the fix. PatchLens verifies it.
            </p>
          </div>
        </div>

        <button
          onClick={onVerifyClick}
          className="px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2"
        >
          Verify a Fix
        </button>
      </div>
    </header>
  );
}
