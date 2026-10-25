import { ApiResponseError } from "./client";

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function isPositiveId(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value > 0;
}

export function assertPositiveId(value: number): void {
  if (!isPositiveId(value)) throw new RangeError("Invalid resource ID");
}

export function responseData(body: unknown): unknown {
  if (!isRecord(body) || body.success !== true || !("data" in body)) {
    throw new ApiResponseError("Invalid API response");
  }
  return body.data;
}

export function catalogImage(
  value: unknown,
  directory: "categories" | "products",
): string | null {
  if (typeof value !== "string") return null;
  try {
    const url = new URL(value);
    return url.origin === "https://admin.shinycarpet-sa.com" &&
      !url.username &&
      !url.password &&
      !url.search &&
      url.pathname.startsWith(`/storage/${directory}/`)
      ? url.href
      : null;
  } catch {
    return null;
  }
}
