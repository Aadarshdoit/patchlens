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
        borderBottomWidth: 1,
      }}
    >
      <div
        className="mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-0"
        style={{ height: 48, maxWidth: 1200 }}
      >
        {/* Brand */}
        <Link
          href="/"
          className="flex items-center gap-2 flex-shrink-0 mr-6"
          aria-label="PatchLens home"
          style={{ textDecoration: "none" }}
        >
          {/* Lens icon */}
          <svg
            viewBox="0 0 20 20"
            className="w-5 h-5 flex-shrink-0"
            fill="none"
            aria-hidden="true"
          >
            <circle
              cx="9"
              cy="9"
              r="5.5"
              stroke="var(--ibm-blue)"
              strokeWidth="1.5"
            />
            <line
              x1="13"
              y1="13"
              x2="17"
              y2="17"
              stroke="var(--ibm-blue)"
              strokeWidth="1.5"
              strokeLinecap="square"
            />
          </svg>
          <span
            className="font-semibold tracking-tight"
            style={{
              fontSize: 16,
              color: "var(--text-primary)",
              fontFamily: "'IBM Plex Sans', sans-serif",
              letterSpacing: "-0.01em",
            }}
          >
            PatchLens
          </span>
        </Link>

        {/* Vertical divider */}
        <div
          className="hidden sm:block mr-5 flex-shrink-0"
          style={{ width: 1, height: 20, background: "var(--border-strong)" }}
          aria-hidden="true"
        />

        {/* Nav */}
        <nav className="flex items-stretch h-full" aria-label="Main navigation">
          {(
            [
              { id: "overview",   label: "Overview",   href: "/" },
              { id: "verify",     label: "Verify",     href: "/#workspace" },
              { id: "benchmarks", label: "Benchmarks", href: "/benchmarks" },
            ] as const
          ).map((item) => {
            const active = activePage === item.id;
            return (
              <Link
                key={item.id}
                href={item.href}
                className="flex items-center px-4 text-sm font-medium transition-colors duration-100"
                style={{
                  color: active ? "var(--ibm-blue)" : "var(--text-secondary)",
                  borderBottom: active
                    ? "2px solid var(--ibm-blue)"
                    : "2px solid transparent",
                  fontFamily: "'IBM Plex Sans', sans-serif",
                  textDecoration: "none",
                  fontSize: 14,
                }}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Spacer */}
        <div className="flex-1" />

        {/* API status indicator */}
        <div
          className="flex items-center gap-1.5"
          aria-label="API connection status"
          aria-live="polite"
        >
          <span
            className="w-1.5 h-1.5 rounded-full flex-shrink-0"
            style={{
              background:
                apiOnline === null
                  ? "var(--border-strong)"
                  : apiOnline
                  ? "var(--verified-icon)"
                  : "var(--notfixed-icon)",
            }}
            aria-hidden="true"
          />
          <span
            style={{
              fontSize: 12,
              color: "var(--text-muted)",
              fontFamily: "'IBM Plex Mono', monospace",
            }}
          >
            {apiOnline === null ? "—" : apiOnline ? "API online" : "API offline"}
          </span>
        </div>
      </div>
    </header>
  );
}
