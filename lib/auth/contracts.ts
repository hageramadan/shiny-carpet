import { isRecord } from "../api/validation";
import { ApiError, ApiResponseError } from "../api/client";
import type { Profile } from "../data";
import { validPhone, type ApiPhone } from "../phone";

export const AUTH_ACTIONS = ["register", "login", "verify", "logout", "resend"] as const;
export type AuthAction = (typeof AUTH_ACTIONS)[number];
export type AuthInput = ApiPhone & { name?: string; code?: string };
export type AuthResult = {
  message: string;
  user?: Profile;
  token?: string;
};

export function authInput(
  action: AuthAction,
  value: unknown,
): AuthInput | Record<string, never> {
  if (action === "logout") return {};
  if (
    !isRecord(value) ||
    typeof value.phone !== "string" ||
    typeof value.country_code !== "string" ||
    !/^\d{4,15}$/.test(value.phone) ||
    !/^\+[1-9]\d{0,3}$/.test(value.country_code) ||
    !validPhone(value.country_code + value.phone)
  ) {
    throw new ApiError(422, { message: "يرجى إدخال رقم هاتف صحيح ورمز الدولة." });
  }
  const input: AuthInput = { phone: value.phone, country_code: value.country_code };
  if (action === "register") {
    if (
      typeof value.name !== "string" ||
      !value.name.trim() ||
      value.name.trim().length > 80
    ) {
      throw new ApiError(422, { message: "يرجى إدخال الاسم، بحد أقصى ٨٠ حرفًا." });
    }
    input.name = value.name.trim();
  }
  if (action === "verify") {
    if (typeof value.code !== "string" || !/^\d{6}$/.test(value.code)) {
      throw new ApiError(422, { message: "أدخل رمز التحقق المكون من ٦ أرقام." });
    }
    input.code = value.code;
  }
  return input;
}

export function authErrorMessage(error: unknown): string {
  if (error instanceof ApiError && isRecord(error.details) && !error.details.exception) {
    const fields = error.details.errors;
    if (isRecord(fields)) {
      const first = Object.values(fields)
        .flat()
        .find((value) => typeof value === "string");
      if (typeof first === "string" && first.length <= 500) return first;
    }
    if (
      typeof error.details.message === "string" &&
      error.details.message.trim() &&
      error.details.message.length <= 500
    ) {
      return error.details.message;
    }
  }
  if (error instanceof ApiError && error.status === 429)
    return "طلبات كثيرة. انتظر قليلًا ثم حاول مرة أخرى.";
  if (error instanceof ApiError && error.status === 401)
    return "انتهت جلسة الدخول. يرجى تسجيل الدخول مرة أخرى.";
  return "تعذر إتمام العملية. حاول مرة أخرى.";
}

export function parseAuthResult(
  action: AuthAction,
  body: unknown,
  fallback?: Profile,
): AuthResult {
  if (!isRecord(body)) throw new ApiResponseError("Invalid authentication response");
  const pending = action === "login" && body.status === "pending_verification";
  if (body.result !== true && !pending) {
    const status =
      typeof body.errNum === "number" && body.errNum >= 400 && body.errNum <= 599
        ? body.errNum
        : 400;
    throw new ApiError(status, body);
  }
  const data = isRecord(body.data) ? body.data : {};
  const result: AuthResult = {
    message: typeof body.message === "string" ? body.message : "تمت العملية بنجاح.",
  };
  const rawUser = data.user ?? body.user;
  if (
    isRecord(rawUser) &&
    typeof rawUser.name === "string" &&
    typeof rawUser.phone === "string" &&
    typeof rawUser.country_code === "string"
  ) {
    result.user = {
      name: rawUser.name,
      phone: rawUser.phone.startsWith("+")
        ? rawUser.phone
        : rawUser.country_code + rawUser.phone,
      email: typeof rawUser.email === "string" ? rawUser.email : "",
    };
  } else if (fallback) result.user = fallback;
  const token = [data.token, isRecord(rawUser) ? rawUser.token : undefined].find(
    (value): value is string =>
      typeof value === "string" &&
      value.length > 0 &&
      value.length <= 3500 &&
      !/\s/.test(value),
  );
  if (token) result.token = token;
  if (action === "verify" && (!result.token || !result.user)) {
    throw new ApiResponseError("Missing verified session in authentication response");
  }
  return result;
}
