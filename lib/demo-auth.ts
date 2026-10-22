export const DEMO_OTP = "246815";
export const RESEND_DELAY = 60_000;
export const CODE_LIFETIME = 300_000;
const DRAFT_KEY = "shiny-carpet-demo-auth";
const destinations = ["/profile", "/checkout", "/cart", "/orders", "/products"];

export type AuthDraft = {
  mode: "login" | "register";
  name: string;
  phone: string;
  destination: string;
  issuedAt: number;
};

let memoryDraft: AuthDraft | null = null;

export function authDestination(value?: string) {
  return value && destinations.includes(value) ? value : "/profile";
}

export function normalizeDigits(value: string) {
  return value.replace(/[٠-٩۰-۹]/g, (digit) =>
    String(digit.charCodeAt(0) - (digit <= "٩" ? 0x660 : 0x6f0)),
  );
}

export function normalizePhone(value: string) {
  return normalizeDigits(value).replace(/[\s()-]/g, "");
}

export function validPhone(value: string) {
  return /^\+?\d{8,15}$/.test(normalizePhone(value));
}

export function authHref(path: "/login" | "/register", destination: string) {
  return `${path}?next=${encodeURIComponent(authDestination(destination))}`;
}

export function saveAuthDraft(draft: AuthDraft) {
  memoryDraft = draft;
  try {
    sessionStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
  } catch {
    // Keep the demo usable when browser storage is unavailable.
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
    // Fall back to the draft held in memory.
  }
  return memoryDraft;
}

export function clearAuthDraft() {
  memoryDraft = null;
  try {
    sessionStorage.removeItem(DRAFT_KEY);
  } catch {
    // Clearing the in-memory draft is sufficient without browser storage.
  }
}
