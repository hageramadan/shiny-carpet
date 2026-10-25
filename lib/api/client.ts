export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly details?: unknown,
    public readonly retryAfter?: number,
  ) {
    super(`API request failed with status ${status}`);
    this.name = "ApiError";
  }
}

export class ApiResponseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ApiResponseError";
  }
}

const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "https://admin.shinycarpet-sa.com/api"
).replace(/\/+$/, "");
const REQUEST_TIMEOUT_MS = 10_000;

// Responses stay unknown until the catalog parsers validate the API payload.
export async function requestJson(
  path: string,
  options: {
    method: "GET" | "POST" | "PUT" | "DELETE";
    body?: unknown;
    signal?: AbortSignal;
    token?: string;
    baseUrl?: string;
    timeoutMs?: number;
  },
): Promise<unknown> {
  const { method, body, signal } = options;
  const hasBody = method === "POST" || method === "PUT";
  const multipart = typeof FormData !== "undefined" && body instanceof FormData;
  const timeout = AbortSignal.timeout(options.timeoutMs ?? REQUEST_TIMEOUT_MS);
  const response = await fetch(`${options.baseUrl ?? API_BASE_URL}${path}`, {
    method,
    headers: {
      Accept: "application/json",
      "Accept-Language": "ar",
      ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
      ...(hasBody && !multipart ? { "Content-Type": "application/json" } : {}),
    },
    body: hasBody ? (multipart ? (body as FormData) : JSON.stringify(body)) : undefined,
    cache: "no-store",
    signal: signal ? AbortSignal.any([signal, timeout]) : timeout,
  });

  let result: unknown;
  try {
    result = await response.json();
  } catch (error) {
    if (!response.ok) throw new ApiError(response.status);
    if (error instanceof SyntaxError) {
      throw new ApiResponseError("API response is not valid JSON");
    }
    throw error;
  }
  if (!response.ok) {
    const retryAfter = Number(response.headers.get("Retry-After"));
    throw new ApiError(
      response.status,
      result,
      Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter : undefined,
    );
  }
  return result;
}

export function getJson(path: string, signal?: AbortSignal): Promise<unknown> {
  return requestJson(path, { method: "GET", signal });
}

export function postJson(
  path: string,
  body: unknown,
  signal?: AbortSignal,
): Promise<unknown> {
  return requestJson(path, { method: "POST", body, signal });
}
