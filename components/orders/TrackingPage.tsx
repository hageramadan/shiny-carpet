"use client";
import { useTranslation } from "@/components/i18n/LanguageProvider";

import { useEffect, useState, type FormEvent } from "react";
import toast from "react-hot-toast";
import { useStore } from "@/components/store";
import { readAuthSession } from "@/lib/auth/session";
import OrderDetails from "./OrderDetails";
export default function TrackingPage({ initialId = "" }: { initialId?: string }) {
  const t = useTranslation();
  const { state, ready } = useStore();
  const [input, setInput] = useState(initialId),
    [query, setQuery] = useState(initialId);
  useEffect(() => {
    if (ready && query && !state.profile) {
      toast.error(t("يجب تسجيل الدخول"), { id: "tracking-login-required" });
      setQuery("");
    }
  }, [ready, query, state.profile]);
  function search(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!readAuthSession()) {
      toast.error(t("يجب تسجيل الدخول"), { id: "tracking-login-required" });
      setQuery("");
      return;
    }
    setQuery(input.trim().replace(/^#/, ""));
  }
  return (
    <section className="min-h-[70vh] bg-[#f7f9fa] py-7">
      <div className="container mx-auto space-y-6 px-4 sm:px-8">
        <h1 className="text-3xl font-extrabold">{t("تفاصيل الطلب")}</h1>
        <form
          onSubmit={search}
          className="flex gap-3"
        >
          <label className="flex-1">
            {t("رقم الطلب")}
            <input
              required
              inputMode="numeric"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              className="mt-2 min-h-12 w-full rounded-xl border border-gray-200 bg-white px-3"
            />
          </label>
          <button className="self-end rounded-xl bg-primary px-5 py-3 text-white">
            {t("عرض الطلب")}
          </button>
        </form>
        {t(
          query && ready && state.profile && (
            <OrderDetails
              key={query}
              id={query}
            />
          ),
        )}
      </div>
    </section>
  );
}
