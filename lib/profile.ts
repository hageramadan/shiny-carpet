import { ApiError, ApiResponseError } from "./api/client";
import { isRecord } from "./api/validation";
import { authenticatedApiRequest, announceSessionChange } from "./auth/client";
import {
  clearAuthSession,
  PROFILE_PHONE_KEY,
  readAuthSession,
  updateSessionProfile,
} from "./auth/session";
import { clearAuthDraft } from "./auth-flow";
import { apiPhone, normalizeDigits, type ApiPhone } from "./phone";
import type { Profile } from "./data";

function successful(body: unknown): Record<string, unknown> {
  if (!isRecord(body)) throw new ApiResponseError("Invalid profile response");
  if (body.result !== true && body.status !== "success") throw new ApiError(400, body);
  return body;
}

export function parseProfile(body: unknown): Profile {
  const result = successful(body);
  const data = isRecord(result.data) ? result.data : null;
  const user = data && isRecord(data.user) ? data.user : data;
  if (
    !user ||
    typeof user.name !== "string" ||
    typeof user.phone !== "string" ||
    typeof user.country_code !== "string"
  )
    throw new ApiResponseError("Missing profile data");
  let image: string | null = null;
  if (typeof user.image === "string") {
    try {
      const url = new URL(user.image);
      if (
        url.origin === "https://admin.shinycarpet-sa.com" &&
        url.pathname.startsWith("/storage/profile/")
      )
        image = url.href;
    } catch {
      /* Ignore malformed image URLs. */
    }
  }
  return {
    name: user.name,
    phone: user.phone.startsWith("+") ? user.phone : user.country_code + user.phone,
    email: typeof user.email === "string" ? user.email : "",
    image,
  };
}

function commit(profile: Profile) {
  updateSessionProfile(profile);
  announceSessionChange();
  return profile;
}

export function pendingProfilePhone(): ApiPhone | null {
  try {
    const value: unknown = JSON.parse(
      sessionStorage.getItem(PROFILE_PHONE_KEY) ?? "null",
    );
    const session = readAuthSession();
    return session &&
      isRecord(value) &&
      value.original === session.profile.phone &&
      typeof value.phone === "string" &&
      typeof value.country_code === "string"
      ? { phone: value.phone, country_code: value.country_code }
      : null;
  } catch {
    return null;
  }
}

export async function getProfile(signal?: AbortSignal) {
  const body = await authenticatedApiRequest("/profile", { signal });
  signal?.throwIfAborted();
  const profile = parseProfile(body);
  // A requested phone remains unconfirmed until /profile/verify succeeds.
  const previous = readAuthSession()?.profile;
  if (previous && pendingProfilePhone()) profile.phone = previous.phone;
  return commit(profile);
}

export async function updateProfile(
  name: string,
  phone: string,
  image?: File,
  signal?: AbortSignal,
) {
  if (!name.trim() || name.trim().length > 80)
    throw new ApiError(422, { message: "يرجى إدخال الاسم، بحد أقصى ٨٠ حرفًا." });
  const input = apiPhone(phone);
  const previous = readAuthSession()?.profile;
  if (!previous) throw new ApiError(401);
  const form = new FormData();
  form.set("name", name.trim());
  form.set("phone", input.phone);
  form.set("country_code", input.country_code);
  if (image) {
    if (
      !["image/jpeg", "image/png", "image/webp"].includes(image.type) ||
      image.size > 5 * 1024 * 1024
    )
      throw new ApiError(422, {
        message: "اختر صورة JPG أو PNG أو WebP بحجم لا يتجاوز ٥ ميجابايت.",
      });
    form.set("image", image);
  }
  const body = await authenticatedApiRequest("/profile", {
    method: "POST",
    body: form,
    signal,
    // Profile uploads and server-side image processing can exceed the default timeout.
    timeoutMs: 60_000,
  });
  signal?.throwIfAborted();
  const profile = parseProfile(body);
  const needsVerification = previous.phone !== input.country_code + input.phone;
  if (needsVerification) {
    sessionStorage.setItem(
      PROFILE_PHONE_KEY,
      JSON.stringify({ ...input, original: previous.phone }),
    );
    profile.phone = previous.phone;
  }
  return {
    profile: commit(profile),
    pending: pendingProfilePhone(),
    message: needsVerification
      ? "تم حفظ البيانات وإرسال رمز تحقق إلى الرقم الجديد."
      : "تم حفظ المعلومات بنجاح.",
  };
}

export async function verifyProfilePhone(code: string, signal?: AbortSignal) {
  const pending = pendingProfilePhone();
  const normalized = normalizeDigits(code);
  if (!pending || !/^\d{6}$/.test(normalized))
    throw new ApiError(422, { message: "أدخل رمز التحقق المكون من ٦ أرقام." });
  const body = await authenticatedApiRequest("/profile/verify", {
    method: "POST",
    body: { ...pending, code: normalized },
    signal,
  });
  signal?.throwIfAborted();
  const profile = parseProfile(body);
  if (profile.phone !== pending.country_code + pending.phone)
    throw new ApiResponseError("Unexpected verified phone");
  sessionStorage.removeItem(PROFILE_PHONE_KEY);
  return commit(profile);
}

export async function deleteProfile(signal?: AbortSignal) {
  const body = await authenticatedApiRequest("/profile", { method: "DELETE", signal });
  signal?.throwIfAborted();
  successful(body);
  clearAuthSession();
  clearAuthDraft();
  announceSessionChange();
}
