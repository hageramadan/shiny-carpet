import { isRecord } from "../api/validation";
import type { Profile } from "../data";
import type { AuthInput, AuthResult } from "./contracts";

export const AUTH_SESSION_KEY = "shiny-carpet-auth-session";
const PENDING_KEY = "shiny-carpet-auth-pending";
export const PROFILE_PHONE_KEY = "shiny-carpet-profile-phone";
type Session = { token: string; profile: Profile };
type Pending = { phone: string; country_code: string; profile: Profile; token?: string };
let memorySession: Session | null = null;
let memoryPending: Pending | null = null;

function stored(key: string): unknown {
  if (typeof window === "undefined") return null;
  try {
    const storage =
      key === AUTH_SESSION_KEY ? window.localStorage : window.sessionStorage;
    const value = storage.getItem(key);
    return value ? JSON.parse(value) : null;
  } catch {
    return undefined;
  }
}

function write(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  try {
    const storage =
      key === AUTH_SESSION_KEY ? window.localStorage : window.sessionStorage;
    if (value === null) storage.removeItem(key);
    else storage.setItem(key, JSON.stringify(value));
    if (key === AUTH_SESSION_KEY) window.sessionStorage.removeItem(key);
  } catch {
    /* Keep the current tab usable in memory when storage is unavailable. */
  }
}

function isProfile(value: unknown): value is Profile {
  return (
    isRecord(value) &&
    typeof value.name === "string" &&
    typeof value.phone === "string" &&
    typeof value.email === "string"
  );
}

function validToken(value: unknown): value is string {
  return (
    typeof value === "string" &&
    value.length > 0 &&
    value.length <= 3500 &&
    !/\s/.test(value)
  );
}

export function readAuthSession(): Session | null {
  if (typeof window === "undefined") return null;
  const value = stored(AUTH_SESSION_KEY);
  if (value !== undefined)
    memorySession =
      isRecord(value) && validToken(value.token) && isProfile(value.profile)
        ? { token: value.token, profile: value.profile }
        : null;
  return memorySession;
}

export function saveAuthSession(result: AuthResult) {
  if (!validToken(result.token) || !isProfile(result.user))
    throw new Error("Missing verified session");
  memorySession = { token: result.token, profile: result.user };
  write(AUTH_SESSION_KEY, memorySession);
  memoryPending = null;
  write(PENDING_KEY, null);
}

export function readPendingAuth(): Pending | null {
  if (typeof window === "undefined") return null;
  const value = stored(PENDING_KEY);
  if (value !== undefined)
    memoryPending =
      isRecord(value) &&
      typeof value.phone === "string" &&
      typeof value.country_code === "string" &&
      isProfile(value.profile)
        ? {
            phone: value.phone,
            country_code: value.country_code,
            profile: value.profile,
            token: validToken(value.token) ? value.token : undefined,
          }
        : null;
  return memoryPending;
}

export function savePendingAuth(input: AuthInput, result: AuthResult) {
  memoryPending = {
    phone: input.phone,
    country_code: input.country_code,
    profile: result.user ?? {
      name: input.name ?? "",
      phone: input.country_code + input.phone,
      email: "",
    },
    token: result.token,
  };
  write(PENDING_KEY, memoryPending);
}

export function clearAuthSession() {
  memorySession = null;
  memoryPending = null;
  write(AUTH_SESSION_KEY, null);
  write(PENDING_KEY, null);
  write(PROFILE_PHONE_KEY, null);
}

export function updateSessionProfile(profile: Profile) {
  const session = readAuthSession();
  if (!session) throw new Error("Missing session");
  memorySession = { ...session, profile };
  write(AUTH_SESSION_KEY, memorySession);
}
