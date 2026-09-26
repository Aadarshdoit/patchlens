"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { checkHealth } from "@/lib/api";

type Props = {
  activePage?: "overview" | "verify" | "benchmarks";
};

export default function Header({ activePage = "overview" }: Props) {
  const [apiOnline, setApiOnline] = useState<boolean | null>(null);

  useEffect(() => {
    checkHealth().then(setApiOnline);
    const interval = setInterval(() => checkHealth().then(setApiOnline), 30_000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header
      className="sticky top-0 z-20 border-b"
      style={{
        background: "var(--bg-surface)",
        borderColor: "var(--border)",
      }}
    >
      <div
        className="max-w-content mx-auto px-6 flex items-center gap-6"
        style={{ height: 52 }}
      >
        {/* Brand */}
        <Link href="/" className="flex items-center gap-2.5 flex-shrink-0 group" aria-label="PatchLens home">
          {/* Minimal lens icon */}
          <svg
            viewBox="0 0 20 20"
            className="w-5 h-5 flex-shrink-0"
            fill="none"
            aria-hidden="true"
          >
            <circle cx="9" cy="9" r="6" stroke="currentColor" strokeWidth="1.5" style={{ color: "var(--text-primary)" }} />
            <line x1="13.5" y1="13.5" x2="17" y2="17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" style={{ color: "var(--text-primary)" }} />
            <circle cx="9" cy="9" r="2.5" stroke="currentColor" strokeWidth="1.25" style={{ color: "var(--text-secondary)" }} />
          </svg>
          <div className="leading-none">
            <span
              className="font-semibold tracking-tight"
              style={{ fontSize: 17, color: "var(--text-primary)" }}
            >
              PatchLens
            </span>
            <span
              className="hidden sm:inline ml-2 font-normal"
              style={{ fontSize: 12, color: "var(--text-muted)" }}
            >
              Verification Engine
            </span>
          </div>
        </Link>

        {/* Nav */}
        <nav className="flex items-center gap-1 ml-4" aria-label="Main navigation">
          {(
            [
              { id: "overview", label: "Overview", href: "/" },
              { id: "verify", label: "Verify", href: "/#workspace" },
              { id: "benchmarks", label: "Benchmarks", href: "/benchmarks" },
            ] as const
          ).map((item) => (
            <Link
              key={item.id}
              href={item.href}
              className="px-3 py-1.5 rounded text-sm font-medium transition-colors duration-150"
              style={{
                color: activePage === item.id ? "var(--text-primary)" : "var(--text-secondary)",
                background:
                  activePage === item.id ? "var(--bg-secondary)" : "transparent",
              }}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Spacer */}
        <div className="flex-1" />

        {/* API status */}
        <div className="flex items-center gap-2" aria-label="API connection status">
          <span
            className="w-2 h-2 rounded-full flex-shrink-0"
            style={{
              background:
                apiOnline === null
                  ? "var(--border-strong)"
                  : apiOnline
                  ? "#2F7D4A"
                  : "#B54747",
            }}
            aria-hidden="true"
          />
          <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
            {apiOnline === null
              ? "Checking…"
              : apiOnline
              ? "Connected"
              : "Offline"}
          </span>
        </div>
      </div>
    </header>
  );
}
