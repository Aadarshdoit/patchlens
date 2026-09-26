"use client";

import React, { useRef } from "react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type InputMode = "demo" | "upload";

export interface UploadInputs {
  projectZip: File | null;
  patchFile: File | null;
  reproScript: string;
}

interface Props {
  mode: InputMode;
  onModeChange: (m: InputMode) => void;
  uploadInputs: UploadInputs;
  onUploadInputsChange: (inputs: UploadInputs) => void;
  onRunDemo: () => void;
  onRunUpload: () => void;
  isVerifying: boolean;
}

// ---------------------------------------------------------------------------
// Small helpers
// ---------------------------------------------------------------------------

function FilePicker({
  label,
  accept,
  hint,
  file,
  onChange,
  disabled,
}: {
  label: string;
  accept: string;
  hint: string;
  file: File | null;
  onChange: (f: File | null) => void;
  disabled: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div>
      <p className="pl-section-label mb-1.5" style={{ fontSize: 10 }}>
        {label}
      </p>
      <div
        className="flex items-center gap-2"
        style={{
          border: "1px solid var(--border)",
          background: "var(--bg-secondary)",
        }}
      >
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={disabled}
          className="pl-btn-secondary"
          style={{
            borderRadius: 0,
            border: "none",
            borderRight: "1px solid var(--border)",
            fontSize: 12,
            padding: "8px 14px",
            flexShrink: 0,
          }}
        >
          Choose file
        </button>
        <span
          style={{
            fontSize: 12,
            color: file ? "var(--text-primary)" : "var(--text-muted)",
            fontFamily: "'IBM Plex Mono', monospace",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            flex: 1,
            padding: "0 10px",
          }}
        >
          {file ? file.name : hint}
        </span>
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          style={{ display: "none" }}
          disabled={disabled}
          onChange={(e) => onChange(e.target.files?.[0] ?? null)}
        />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function VerificationInput({
  mode,
  onModeChange,
  uploadInputs,
  onUploadInputsChange,
  onRunDemo,
  onRunUpload,
  isVerifying,
}: Props) {
  const canSubmitUpload =
    uploadInputs.projectZip !== null &&
    uploadInputs.patchFile !== null &&
    uploadInputs.reproScript.trim() !== "";

  return (
    <section className="pl-card" aria-label="Verification input">
      {/* ── Card header with mode tabs ── */}
      <div
        className="pl-card-header flex items-center gap-0"
        style={{ padding: 0 }}
      >
        {(["demo", "upload"] as InputMode[]).map((m) => {
          const active = mode === m;
          return (
            <button
              key={m}
              type="button"
              onClick={() => onModeChange(m)}
              disabled={isVerifying}
              style={{
                padding: "11px 20px",
                fontSize: 12,
                fontWeight: active ? 600 : 400,
                fontFamily: "'IBM Plex Sans', sans-serif",
                color: active ? "var(--ibm-blue)" : "var(--text-secondary)",
                background: active ? "var(--bg-surface)" : "var(--bg-secondary)",
                borderTop: "none",
                borderLeft: "none",
                borderRight: "1px solid var(--border)",
                borderBottom: active ? "2px solid var(--ibm-blue)" : "2px solid transparent",
                cursor: isVerifying ? "not-allowed" : "pointer",
                letterSpacing: "0.02em",
              }}
            >
              {m === "demo" ? "Try Demo" : "Upload Project"}
            </button>
          );
        })}
        <div
          style={{
            flex: 1,
            height: "100%",
            background: "var(--bg-secondary)",
            borderBottom: "2px solid transparent",
          }}
        />
      </div>

      <div className="px-5 py-5 space-y-5">
        {mode === "demo" ? (
          /* ─────────────── DEMO MODE ─────────────── */
          <>
            <div>
              <p className="pl-section-label mb-1" style={{ fontSize: 10 }}>
                Demo Project
              </p>
              <p
                className="px-3 py-2.5 leading-relaxed"
                style={{
                  fontSize: 13,
                  background: "var(--bg-secondary)",
                  border: "1px solid var(--border)",
                  color: "var(--text-primary)",
                  fontFamily: "'IBM Plex Sans', sans-serif",
                }}
              >
                Student attendance application — KeyError on unknown student lookup.
              </p>
            </div>

            <div>
              <p className="pl-section-label mb-1" style={{ fontSize: 10 }}>
                Candidate Patch
              </p>
              <p
                style={{
                  fontSize: 12,
                  color: "var(--text-muted)",
                  fontFamily: "'IBM Plex Mono', monospace",
                  background: "var(--bg-secondary)",
                  border: "1px solid var(--border)",
                  padding: "8px 12px",
                }}
              >
                benchmark/good_fix.diff
              </p>
            </div>

            <div>
              <p className="pl-section-label mb-1" style={{ fontSize: 10 }}>
                Reproduction Command
              </p>
              <div
                className="flex items-center gap-2 px-3 py-2.5"
                style={{ background: "#161616", border: "1px solid #3d3d3d" }}
              >
                <span
                  style={{
                    color: "#6f6f6f",
                    fontSize: 12,
                    fontFamily: "'IBM Plex Mono', monospace",
                    userSelect: "none",
                  }}
                >
                  $
                </span>
                <span
                  style={{
                    fontSize: 12,
                    color: "#a8d5b5",
                    fontFamily: "'IBM Plex Mono', monospace",
                  }}
                >
                  python reproduce.py
                </span>
              </div>
            </div>

            <div
              className="flex items-center gap-4 pt-3"
              style={{ borderTop: "1px solid var(--border)" }}
            >
              <button
                type="button"
                onClick={onRunDemo}
                disabled={isVerifying}
                className="pl-btn-primary"
              >
                {isVerifying ? (
                  <>
                    <span
                      className="w-3.5 h-3.5 border-2 border-white flex-shrink-0"
                      style={{
                        borderTopColor: "transparent",
                        animation: "spin 0.7s linear infinite",
                        borderRadius: "50%",
                      }}
                      aria-hidden="true"
                    />
                    Verifying…
                  </>
                ) : (
                  <>
                    <svg
                      viewBox="0 0 14 14"
                      className="w-3.5 h-3.5 flex-shrink-0"
                      fill="none"
                      aria-hidden="true"
                    >
                      <path d="M3 2l9 5-9 5V2z" fill="currentColor" />
                    </svg>
                    Run Demo Verification
                  </>
                )}
              </button>
              <p style={{ fontSize: 12, color: "var(--text-muted)" }}>
                Uses the bundled demo project
              </p>
            </div>
          </>
        ) : (
          /* ─────────────── UPLOAD MODE ─────────────── */
          <>
            {/* Prototype scope notice */}
            <div
              className="flex items-start gap-2 px-3 py-2.5"
              style={{
                background: "var(--ibm-blue-light)",
                border: "1px solid var(--ibm-blue-border)",
              }}
            >
              <svg
                viewBox="0 0 14 14"
                className="w-3.5 h-3.5 flex-shrink-0 mt-0.5"
                fill="none"
                aria-hidden="true"
                style={{ color: "var(--ibm-blue)" }}
              >
                <circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.4" />
                <path
                  d="M7 5v2.5M7 9v.5"
                  stroke="currentColor"
                  strokeWidth="1.4"
                  strokeLinecap="round"
                />
              </svg>
              <p style={{ fontSize: 12, color: "var(--ibm-blue)", fontFamily: "'IBM Plex Sans', sans-serif" }}>
                Prototype supports <strong>Python / pytest projects</strong> with a
                reproduction script. No automatic dependency installation.
              </p>
            </div>

            <FilePicker
              label="Project ZIP"
              accept=".zip"
              hint="project.zip — your Python project"
              file={uploadInputs.projectZip}
              onChange={(f) =>
                onUploadInputsChange({ ...uploadInputs, projectZip: f })
              }
              disabled={isVerifying}
            />

            <FilePicker
              label="Candidate Patch"
              accept=".diff,.patch"
              hint="candidate.diff or candidate.patch"
              file={uploadInputs.patchFile}
              onChange={(f) =>
                onUploadInputsChange({ ...uploadInputs, patchFile: f })
              }
              disabled={isVerifying}
            />

            <div>
              <p className="pl-section-label mb-1.5" style={{ fontSize: 10 }}>
                Reproduction Script
              </p>
              <div
                className="flex items-center gap-2"
                style={{
                  background: "#161616",
                  border: "1px solid #3d3d3d",
                }}
              >
                <span
                  style={{
                    color: "#6f6f6f",
                    fontSize: 12,
                    fontFamily: "'IBM Plex Mono', monospace",
                    userSelect: "none",
                    padding: "10px 8px 10px 12px",
                    flexShrink: 0,
                  }}
                >
                  python
                </span>
                <input
                  type="text"
                  value={uploadInputs.reproScript}
                  onChange={(e) =>
                    onUploadInputsChange({
                      ...uploadInputs,
                      reproScript: e.target.value,
                    })
                  }
                  disabled={isVerifying}
                  placeholder="reproduce.py"
                  style={{
                    flex: 1,
                    background: "transparent",
                    border: "none",
                    outline: "none",
                    fontSize: 12,
                    color: "#a8d5b5",
                    fontFamily: "'IBM Plex Mono', monospace",
                    padding: "10px 12px 10px 0",
                  }}
                  aria-label="Reproduction script filename"
                />
              </div>
              <p style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>
                Must be a .py file inside your project. No path separators.
              </p>
            </div>

            <div
              className="flex items-center gap-4 pt-3"
              style={{ borderTop: "1px solid var(--border)" }}
            >
              <button
                type="button"
                onClick={onRunUpload}
                disabled={isVerifying || !canSubmitUpload}
                className="pl-btn-primary"
              >
                {isVerifying ? (
                  <>
                    <span
                      className="w-3.5 h-3.5 border-2 border-white flex-shrink-0"
                      style={{
                        borderTopColor: "transparent",
                        animation: "spin 0.7s linear infinite",
                        borderRadius: "50%",
                      }}
                      aria-hidden="true"
                    />
                    Verifying…
                  </>
                ) : (
                  <>
                    <svg
                      viewBox="0 0 14 14"
                      className="w-3.5 h-3.5 flex-shrink-0"
                      fill="none"
                      aria-hidden="true"
                    >
                      <path d="M3 2l9 5-9 5V2z" fill="currentColor" />
                    </svg>
                    Verify Patch
                  </>
                )}
              </button>
              {!canSubmitUpload && !isVerifying && (
                <p style={{ fontSize: 12, color: "var(--text-muted)" }}>
                  Upload a project ZIP and patch to continue
                </p>
              )}
            </div>
          </>
        )}
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </section>
  );
}
