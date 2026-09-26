import React from "react";

type Props = {
  patch: string;
  filename?: string;
};

function classifyLine(line: string): { color: string; bg: string } {
  if (line.startsWith("+") && !line.startsWith("+++"))
    return { color: "#2F7D4A", bg: "rgba(47,125,74,0.07)" };
  if (line.startsWith("-") && !line.startsWith("---"))
    return { color: "#B54747", bg: "rgba(181,71,71,0.07)" };
  if (line.startsWith("@@"))
    return { color: "#4A6FA5", bg: "rgba(74,111,165,0.06)" };
  if (line.startsWith("+++") || line.startsWith("---"))
    return { color: "#6B7280", bg: "transparent" };
  return { color: "#9CA3AF", bg: "transparent" };
}

export default function PatchViewer({ patch, filename = "diff" }: Props) {
  const lines = patch.split("\n");

  return (
    <div
      className="rounded-lg overflow-hidden"
      style={{ border: "1px solid #374151" }}
    >
      {/* Title bar */}
      <div
        className="flex items-center gap-2 px-4 py-2"
        style={{ background: "#1F2937", borderBottom: "1px solid #374151" }}
      >
        <span
          className="w-2.5 h-2.5 rounded-full flex-shrink-0"
          style={{ background: "#EF4444" }}
          aria-hidden="true"
        />
        <span
          className="w-2.5 h-2.5 rounded-full flex-shrink-0"
          style={{ background: "#F59E0B" }}
          aria-hidden="true"
        />
        <span
          className="w-2.5 h-2.5 rounded-full flex-shrink-0"
          style={{ background: "#10B981" }}
          aria-hidden="true"
        />
        <span
          className="ml-3 font-mono"
          style={{ fontSize: 11, color: "#9CA3AF" }}
        >
          {filename}
        </span>
      </div>

      {/* Diff lines */}
      <div
        className="overflow-x-auto"
        style={{ background: "#111827", maxHeight: 320, overflowY: "auto" }}
        role="region"
        aria-label="Patch diff viewer"
      >
        <table className="w-full border-collapse" aria-label="Diff lines">
          <tbody>
            {lines.map((line, i) => {
              const { color, bg } = classifyLine(line);
              return (
                <tr key={i} style={{ background: bg }}>
                  <td
                    className="select-none font-mono text-right pr-3 pl-3"
                    style={{
                      fontSize: 11,
                      color: "#4B5563",
                      width: 40,
                      paddingTop: 1,
                      paddingBottom: 1,
                      borderRight: "1px solid #1F2937",
                      userSelect: "none",
                    }}
                    aria-hidden="true"
                  >
                    {i + 1}
                  </td>
                  <td
                    className="font-mono px-3"
                    style={{
                      fontSize: 12,
                      color,
                      paddingTop: 2,
                      paddingBottom: 2,
                      whiteSpace: "pre",
                      lineHeight: 1.6,
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
