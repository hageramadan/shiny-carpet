import english from "./en.json";
export type Locale = "ar" | "en";
export const LOCALE_COOKIE = "shiny-carpet-language";
export const normalizeLocale = (value: unknown): Locale => (value === "en" ? "en" : "ar");
export function getLocale(): Locale {
  if (typeof document === "undefined") return "ar";
  const saved = (document.cookie ?? "")
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(LOCALE_COOKIE + "="))
    ?.split("=")[1];
  return normalizeLocale(saved || document.documentElement?.lang);
}
const dictionary: Record<string, string> = english;
let phrases: RegExp | undefined;
export function translateText(value: string, locale: Locale): string {
  if (locale === "ar" || !/[\u0600-\u06ff]/.test(value)) return value;
  const normalized = value.trim().replace(/\s+/g, " ");
  let result = Object.hasOwn(dictionary, normalized) ? dictionary[normalized] : undefined;
  if (result === undefined) {
    result = value;
    if (!phrases) {
      const keys = Object.keys(dictionary)
        .filter((key) => key.length > 1 || key === "م")
        .sort((a, b) => b.length - a.length);
      phrases ??= new RegExp(
        "(?<![\\p{L}])(?:" +
          keys.map((key) => key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|") +
          ")(?![\\p{L}])",
        "gu",
      );
    }
    // Known phrases in dynamic labels are translated in one pass; user values are preserved.
    result = value.replace(phrases, (source) => dictionary[source] ?? source);
  } else {
    result =
      value.slice(0, value.length - value.trimStart().length) +
      result +
      value.slice(value.trimEnd().length);
  }
  return result
    .replace(/[٠-٩]/g, (digit) => String("٠١٢٣٤٥٦٧٨٩".indexOf(digit)))
    .replace(/٬/g, ",")
    .replace(/٫/g, ".")
    .replace(/٪/g, "%")
    .replace(/،/g, ",")
    .replace(/؟/g, "?")
    .replace(/«|»/g, '"');
}
export function translateValue<T>(value: T, locale: Locale): T {
  if (typeof value === "string") return translateText(value, locale) as T;
  if (Array.isArray(value)) return value.map((item) => translateValue(item, locale)) as T;
  return value;
}
