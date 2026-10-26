import { getJson, ApiError, ApiResponseError } from "./client";
import { isRecord } from "./validation";
export type SiteSettings = {
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
  facebook?: string;
  instagram?: string;
  snapchat?: string;
  tikTok?: string;
  pinterest?: string;
  favicon?: string;
  lightLogo?: string;
  darkLogo?: string;
  noDataIcon?: string;
  defaultUser?: string;
  loginBackground?: string;
  privacyPolicy?: string;
  termsAndConditions?: string;
};
const text = (value: unknown) =>
  typeof value === "string" && value.trim() ? value.trim() : undefined;
function webUrl(value: unknown) {
  const raw = text(value);
  if (!raw) return;
  try {
    const url = new URL(raw);
    if (["https:", "http:"].includes(url.protocol) && !url.username && !url.password)
      return url.href;
  } catch {
    /* Unusable URL. */
  }
}
function image(value: unknown) {
  const raw = text(value);
  if (!raw) return;
  try {
    const url = new URL(
      raw,
      "https://admin.shinycarpet-sa.com/storage/images/upload/settings/",
    );
    if (
      url.origin === "https://admin.shinycarpet-sa.com" &&
      url.pathname.startsWith("/storage/images/upload/settings/") &&
      !url.username &&
      !url.password &&
      !url.search &&
      !url.hash
    )
      return url.href;
  } catch {
    /* Unusable image. */
  }
}
export function parseSettings(body: unknown): SiteSettings {
  if (!isRecord(body)) throw new ApiResponseError("Invalid settings response");
  if (body.result !== true) throw new ApiError(400, body);
  const data = body.data;
  if (!isRecord(data)) throw new ApiResponseError("Missing settings");
  const email = text(data.email),
    phone = text(data.phone);
  return {
    name: text(data.name),
    email:
      email && /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email)
        ? email
        : undefined,
    phone: phone && /^\+?[0-9 ()-]{5,25}$/.test(phone) ? phone : undefined,
    address: text(data.address),
    facebook: webUrl(data.facebook),
    instagram: webUrl(data.instagram),
    snapchat: webUrl(data.snapchat),
    tikTok: webUrl(data.tik_tok),
    pinterest: webUrl(data.pinterest),
    favicon: image(data.fav_icon),
    lightLogo: image(data.light_logo),
    darkLogo: image(data.dark_logo),
    noDataIcon: image(data.no_data_icon),
    defaultUser: image(data.default_user),
    loginBackground: image(data.login_background),
    privacyPolicy: text(data.privacy_policy),
    termsAndConditions: text(data.terms_and_conditions),
  };
}
export async function fetchSettings(signal?: AbortSignal) {
  return parseSettings(await getJson("/settings", signal));
}
