"use client";
import { createContext, useContext, useEffect, useMemo, type ReactNode } from "react";
import { LOCALE_COOKIE, getLocale, translateValue, type Locale } from "@/lib/i18n";
const Context = createContext<Locale>("ar");
export function LanguageProvider({
  locale,
  children,
}: {
  locale: Locale;
  children: ReactNode;
}) {
  useEffect(() => {
    const sync = () => {
      if (getLocale() !== locale) window.location.reload();
    };
    window.addEventListener("focus", sync);
    window.addEventListener("pageshow", sync);
    return () => {
      window.removeEventListener("focus", sync);
      window.removeEventListener("pageshow", sync);
    };
  }, [locale]);
  return <Context.Provider value={locale}>{children}</Context.Provider>;
}
export function useTranslation() {
  const locale = useContext(Context);
  return useMemo(
    () =>
      Object.assign(<T,>(value: T): T => translateValue(value, locale), {
        locale,
        dir: locale === "ar" ? ("rtl" as const) : ("ltr" as const),
      }),
    [locale],
  );
}
export function changeLanguage(locale: Locale) {
  document.cookie = `${LOCALE_COOKIE}=${locale};path=/;max-age=31536000;samesite=lax${location.protocol === "https:" ? ";secure" : ""}`;
  // A fresh document refetches every resource in the selected language and clears in-flight UI caches.
  window.location.reload();
}
