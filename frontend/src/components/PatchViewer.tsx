import React from "react";

type Props = {
  patch: string;
  filename?: string;
};

function classifyLine(line: string): { color: string; bg: string; prefix?: string } {
  if (line.startsWith("+") && !line.startsWith("+++"))
    return { color: "#1a7a40", bg: "rgba(36,161,72,0.08)", prefix: "+" };
  if (line.startsWith("-") && !line.startsWith("---"))
    return { color: "#a2191f", bg: "rgba(218,30,40,0.08)", prefix: "-" };
  if (line.startsWith("@@"))
    return { color: "#0043ce", bg: "rgba(15,98,254,0.06)" };
  if (line.startsWith("+++") || line.startsWith("---"))
    return { color: "#6f6f6f", bg: "transparent" };
  return { color: "#8d8d8d", bg: "transparent" };
}

export default function PatchViewer({ patch, filename = "diff" }: Props) {
  const lines = patch.split("\n");

  return (
    <div
      className="overflow-hidden"
      style={{ border: "1px solid #2d2d2d" }}
      role="region"
      aria-label="Patch diff viewer"
    >
      {/* Title bar */}
      <div
        className="flex items-center gap-3 px-4 py-2"
        style={{ background: "#262626", borderBottom: "1px solid #3d3d3d" }}
      >
        <svg
          viewBox="0 0 14 14"
          className="w-3.5 h-3.5 flex-shrink-0"
          fill="none"
          aria-hidden="true"
        >
          <path d="M2 4h10M2 7h10M2 10h6" stroke="#8d8d8d" strokeWidth="1.2" strokeLinecap="round" />
        </svg>
        <span
          className="font-mono"
          style={{ fontSize: 11, color: "#8d8d8d", fontFamily: "'IBM Plex Mono', monospace" }}
        >
          {filename}
        </span>
      </div>

      {/* Diff lines */}
      <div
        className="overflow-x-auto"
        style={{ background: "#1c1c1c", maxHeight: 340, overflowY: "auto" }}
      >
        <table
          className="w-full border-collapse"
          aria-label="Diff lines"
          style={{ tableLayout: "fixed", minWidth: "100%" }}
        >
          <colgroup>
            <col style={{ width: 36 }} />
            <col style={{ width: "100%" }} />
          </colgroup>
          <tbody>
            {lines.map((line, i) => {
              const { color, bg } = classifyLine(line);
              return (
                <tr key={i} style={{ background: bg }}>
                  <td
                    className="select-none font-mono text-right pr-3 pl-3"
                    style={{
                      fontSize: 11,
                      color: "#5a5a5a",
                      paddingTop: 1,
                      paddingBottom: 1,
                      borderRight: "1px solid #2d2d2d",
                      userSelect: "none",
                      verticalAlign: "top",
                      fontFamily: "'IBM Plex Mono', monospace",
                    }}
                    aria-hidden="true"
                  >
                    {i + 1}
                  </td>
                  <td
                    className="font-mono px-3"
                    style={{
                      fontSize: 12.5,
                      color,
                      paddingTop: 2,
                      paddingBottom: 2,
                      whiteSpace: "pre",
                      lineHeight: 1.6,
                      fontFamily: "'IBM Plex Mono', monospace",
                    }}
                  >
                    {line || " "}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
