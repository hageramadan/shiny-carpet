import { ApiError, requestJson } from "../api/client";
import type { Profile } from "../data";
import { authInput, parseAuthResult, type AuthAction, type AuthInput } from "./contracts";
import {
  clearAuthSession,
  readAuthSession,
  readPendingAuth,
  saveAuthSession,
  savePendingAuth,
} from "./session";

export type AuthReply = { message: string; profile?: Profile };

export async function authRequest(
  action: AuthAction,
  rawInput: unknown,
  signal?: AbortSignal,
): Promise<AuthReply> {
  const input = authInput(action, rawInput);
  const pending = action === "verify" || action === "resend" ? readPendingAuth() : null;
  if (
    pending &&
    (pending.phone !== input.phone || pending.country_code !== input.country_code)
  ) {
    throw new ApiError(409, {
      message: "ارجع إلى صفحة الدخول لطلب رمز تحقق جديد لهذا الرقم.",
    });
  }
  try {
    const body = await requestJson(`/auth/${action}`, {
      method: "POST",
      body: input,
      signal,
      timeoutMs: 20_000,
      token: action === "logout" ? readAuthSession()?.token : pending?.token,
    });
    signal?.throwIfAborted();
    const result = parseAuthResult(action, body, pending?.profile);
    if (action === "register" || action === "login")
      savePendingAuth(input as AuthInput, result);
    if (action === "resend")
      savePendingAuth(input as AuthInput, {
        ...result,
        user: result.user ?? pending?.profile,
        token: result.token ?? pending?.token,
      });
    if (action === "verify") saveAuthSession(result);
    if (action === "logout") clearAuthSession();
    return {
      message: result.message,
      ...(action === "verify" ? { profile: result.user } : {}),
    };
  } catch (error) {
    if (action === "logout" && error instanceof ApiError && error.status === 401) {
      clearAuthSession();
      return { message: "تم تسجيل الخروج." };
    }
    throw error;
  }
}

export async function fetchSession(signal?: AbortSignal): Promise<Profile | null> {
  signal?.throwIfAborted();
  return readAuthSession()?.profile ?? null;
}

// Protected browser calls use the external API and current session bearer token.
export async function authenticatedApiRequest(
  path: string,
  options: {
    method?: "GET" | "POST" | "PUT" | "DELETE";
    body?: unknown;
    signal?: AbortSignal;
    timeoutMs?: number;
  } = {},
) {
  if (!path.startsWith("/") || path.startsWith("//"))
    throw new RangeError("Expected a relative API path");
  const token = readAuthSession()?.token;
  if (!token) throw new ApiError(401);
  try {
    return await requestJson(path, {
      ...options,
      method: options.method ?? "GET",
      token,
    });
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      clearAuthSession();
      announceSessionChange();
    }
    throw error;
  }
}

export function announceSessionChange() {
  window.dispatchEvent(new Event("shiny-auth-session-change"));
}
