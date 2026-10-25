import {
  isPossiblePhoneNumber,
  getCountryCallingCode,
  parsePhoneNumberFromString as parsePhoneNumber,
  type CountryCode as Country,
} from "libphonenumber-js/min";

export const DEFAULT_PHONE_COUNTRY: Country = "SA";
export const PHONE_COUNTRIES: Country[] = ["SA", "EG", "AE", "KW", "QA"];

export function normalizeDigits(value: string): string {
  return value.replace(/[٠-٩۰-۹]/g, (digit) =>
    String(digit.charCodeAt(0) - (digit <= "٩" ? 0x660 : 0x6f0)),
  );
}

export function normalizePhone(value: string): string {
  return normalizeDigits(value).replace(/[\s()-]/g, "");
}

export function internationalPhone(
  value: string,
  country: Country = DEFAULT_PHONE_COUNTRY,
): string {
  const normalized = normalizePhone(value);
  if (!normalized || normalized.startsWith("+")) return normalized;
  return parsePhoneNumber(normalized, country)?.number ?? normalized;
}

export function validPhone(value: string, country?: Country): boolean {
  const phone = internationalPhone(value, country);
  return (
    /^\+\d{8,15}$/.test(phone) &&
    isPossiblePhoneNumber(phone) &&
    (!country ||
      parsePhoneNumber(phone)?.countryCallingCode === getCountryCallingCode(country))
  );
}

export type ApiPhone = { phone: string; country_code: string };

export function apiPhone(value: string): ApiPhone {
  const parsed = parsePhoneNumber(internationalPhone(value));
  if (!parsed || !parsed.isPossible()) throw new RangeError("يرجى إدخال رقم هاتف صحيح.");
  return { phone: parsed.nationalNumber, country_code: `+${parsed.countryCallingCode}` };
}
