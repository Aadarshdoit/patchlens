// ---------------------------------------------------------------------------
// PatchLens – centralized API client
// ---------------------------------------------------------------------------

import type { VerifyRequest, VerifyResponse } from "./types";

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000";

export async function verifyPatch(req: VerifyRequest): Promise<VerifyResponse> {
  const response = await fetch(`${API_BASE_URL}/api/verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(req),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      typeof data.detail === "string"
        ? data.detail
        : `Server error ${response.status}`
    );
  }

  return data as VerifyResponse;
}

export async function checkHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/health`, {
      signal: AbortSignal.timeout(3000),
    });
    return response.ok;
  } catch {
    return false;
  }
}
