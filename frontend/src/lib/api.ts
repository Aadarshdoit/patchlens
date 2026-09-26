// ---------------------------------------------------------------------------
// PatchLens – centralized API client
// ---------------------------------------------------------------------------

import type { UploadVerifyParams, VerifyRequest, VerifyResponse } from "./types";

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

export async function uploadAndVerify(
  params: UploadVerifyParams
): Promise<VerifyResponse> {
  const form = new FormData();
  form.append("project_zip", params.projectZip);
  form.append("patch_file", params.patchFile);
  form.append("repro_script", params.reproScript);

  const response = await fetch(`${API_BASE_URL}/api/upload-verify`, {
    method: "POST",
    body: form,
    // Do NOT set Content-Type — the browser sets it with the correct boundary.
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
  const controller = new AbortController();
  const timerId = setTimeout(() => controller.abort(), 3000);
  try {
    const response = await fetch(`${API_BASE_URL}/health`, {
      signal: controller.signal,
    });
    return response.ok;
  } catch {
    return false;
  } finally {
    clearTimeout(timerId);
  }
}
