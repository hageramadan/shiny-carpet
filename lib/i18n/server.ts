import type { Metadata } from "next";
import { cookies } from "next/headers";
import { LOCALE_COOKIE, normalizeLocale, translateText } from "./index";
export async function getServerLocale() {
  return normalizeLocale((await cookies()).get(LOCALE_COOKIE)?.value);
}
export async function localizeMetadata(metadata: Metadata): Promise<Metadata> {
  const locale = await getServerLocale();
  function visit(value: unknown): unknown {
    if (typeof value === "string") return translateText(value, locale);
    if (Array.isArray(value)) return value.map(visit);
    if (value && Object.getPrototypeOf(value) === Object.prototype)
      return Object.fromEntries(
        Object.entries(value).map(([key, item]) => [key, visit(item)]),
      );
    return value;
  }
  const localized = visit(metadata) as Metadata;
  if (localized.openGraph && "locale" in localized.openGraph)
    localized.openGraph.locale = locale === "en" ? "en_GB" : "ar_EG";
  return localized;
}
