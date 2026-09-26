import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PatchLens — Patch Verification Engine",
  description:
    "Independently verify whether an AI-generated code fix actually resolves the original software failure.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased" style={{ background: "var(--bg-page)" }}>
        {children}
      </body>
    </html>
  );
}
