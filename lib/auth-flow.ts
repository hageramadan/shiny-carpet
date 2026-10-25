import { validPhone } from "./phone";
export { normalizeDigits, normalizePhone, validPhone } from "./phone";

export const RESEND_DELAY = 60_000;
const DRAFT_KEY = "shiny-carpet-auth-challenge";
const destinations = [
  "/profile",
  "/checkout",
  "/cart",
  "/orders",
  "/products",
  "/addresses",
  "/addresses/new",
];

export type AuthDraft = {
  mode: "login" | "register";
  name: string;
  phone: string;
  destination: string;
  issuedAt: number;
};

let memoryDraft: AuthDraft | null = null;

export function authDestination(value?: string) {
  return value &&
    (destinations.includes(value) ||
      /^\/products\/[1-9]\d*$/.test(value) ||
      /^\/addresses\/[1-9]\d*\/edit$/.test(value))
    ? value
    : "/profile";
}

export function authHref(path: "/login" | "/register", destination: string) {
  return `${path}?next=${encodeURIComponent(authDestination(destination))}`;
}

export function saveAuthDraft(draft: AuthDraft) {
  memoryDraft = draft;
  try {
    sessionStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
  } catch {
    /* Keep the current tab usable without storage. */
  }
}

export function readAuthDraft(): AuthDraft | null {
  try {
    const raw = sessionStorage.getItem(DRAFT_KEY);
    if (raw) {
      const value = JSON.parse(raw);
      if (
        (value.mode === "login" || value.mode === "register") &&
        typeof value.name === "string" &&
        typeof value.phone === "string" &&
        validPhone(value.phone) &&
        typeof value.issuedAt === "number" &&
        Number.isFinite(value.issuedAt)
      ) {
        memoryDraft = { ...value, destination: authDestination(value.destination) };
      }
    }
  } catch {
    /* The in-memory draft contains no token. */
  }
  return memoryDraft;
}

export function clearAuthDraft() {
  memoryDraft = null;
  try {
    sessionStorage.removeItem(DRAFT_KEY);
    sessionStorage.removeItem("shiny-carpet-demo-auth");
  } catch {
    /* Storage is optional. */
  }
}
