"use client";
import { useState, type FormEvent } from "react";

export default function PromoCode() {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");

  function apply(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("تفعيل أكواد الخصم غير متاح حاليًا.");
  }

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-4 sm:p-5 lg:p-6">
      <h2 className="text-base font-bold text-ink">هل لديك كود خصم؟</h2>
      <form
        onSubmit={apply}
        className="mt-4"
      >
        <label
          htmlFor="promo-code"
          className="text-sm font-bold text-ink"
        >
          كود الخصم
        </label>
        <div className="mt-2 flex gap-2 sm:gap-3">
          <input
            id="promo-code"
            name="coupon"
            value={code}
            onChange={(event) => setCode(event.target.value)}
            required
            maxLength={30}
            placeholder="أدخل الكود"
            className="min-h-12 min-w-0 flex-1 rounded-xl border border-gray-200 px-3 text-base sm:text-sm"
          />
          <button className="min-h-12 shrink-0 rounded-xl bg-primary px-5 py-2 text-sm font-bold text-white hover:bg-ink shadow-button">
            تفعيل
          </button>
        </div>
      </form>
      {error && (
        <p
          role="alert"
          className="mt-3 text-xs leading-6 text-red-600"
        >
          {error}
        </p>
      )}
      <p className="mt-3 text-xs leading-6 text-muted">
        تفعيل أكواد الخصم غير متاح حاليًا.
      </p>
    </section>
  );
}
