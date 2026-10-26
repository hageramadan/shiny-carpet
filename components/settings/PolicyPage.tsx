"use client";
import { useSettings } from "./SettingsProvider";
export default function PolicyPage({ kind }: { kind: "privacy" | "terms" }) {
  const { data, status, reload } = useSettings();
  const title = kind === "privacy" ? "سياسة الخصوصية" : "الشروط والأحكام";
  const content = kind === "privacy" ? data?.privacyPolicy : data?.termsAndConditions;
  return (
    <section className="min-h-[60vh] bg-[#f7f9fa] py-8">
      <div className="container mx-auto px-5">
        <h1 className="mb-6 text-3xl font-extrabold">{title}</h1>
        <div className="rounded-2xl border border-gray-200 bg-white p-6">
          {status === "loading" ? (
            <p role="status">جاري تحميل المحتوى…</p>
          ) : status === "error" ? (
            <div role="alert">
              تعذر تحميل المحتوى.
              <button
                onClick={reload}
                className="m-3 text-primary"
              >
                إعادة المحاولة
              </button>
            </div>
          ) : (
            <p
              dir="auto"
              className="whitespace-pre-wrap break-words text-start leading-8"
            >
              {content || "المحتوى غير متاح حاليًا."}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
