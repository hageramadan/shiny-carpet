import { API_BASE_URL, ApiError, ApiResponseError } from "./client";
import { assertPositiveId, isRecord } from "./validation";
import { readAuthSession } from "../auth/session";
import { authenticatedApiRequest } from "../auth/client";

export async function fetchInvoiceDocument(id: number, signal?: AbortSignal) {
  assertPositiveId(id);
  signal?.throwIfAborted();
  const token = readAuthSession()?.token;
  if (!token) throw new ApiError(401);
  const result = await authenticatedApiRequest(`/orders/${id}/view`, { signal });
  if (!isRecord(result) || typeof result.url !== "string")
    throw new ApiResponseError("Missing invoice PDF URL");
  let url: URL;
  try {
    url = new URL(result.url);
  } catch {
    throw new ApiResponseError("Invalid invoice PDF URL");
  }
  if (
    url.origin !== new URL(API_BASE_URL).origin ||
    !/^\/storage\/invoices\/[^/]+\.pdf$/.test(url.pathname) ||
    url.username ||
    url.password ||
    url.hash
  )
    throw new ApiResponseError("Unexpected invoice PDF URL");
  signal?.throwIfAborted();
  if (readAuthSession()?.token !== token) throw new ApiError(401);
  const response = await fetch("/api/invoice-download", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    cache: "no-store",
    signal,
    credentials: "omit",
    body: JSON.stringify({ url: url.href }),
  });
  if (!response.ok) throw new ApiError(response.status);
  const payload: unknown = await response.json();
  if (!isRecord(payload) || typeof payload.data !== "string")
    throw new ApiResponseError("Missing invoice file data");
  let bytes: Uint8Array<ArrayBuffer>;
  try {
    bytes = Uint8Array.from(atob(payload.data), (character) => character.charCodeAt(0));
  } catch {
    throw new ApiResponseError("Invalid invoice file encoding");
  }
  const document = new Blob([bytes], { type: "application/pdf" });
  signal?.throwIfAborted();
  if (readAuthSession()?.token !== token) throw new ApiError(401);
  if ((await document.slice(0, 5).text()) !== "%PDF-")
    throw new ApiResponseError("Invalid invoice PDF response");
  return document;
}
