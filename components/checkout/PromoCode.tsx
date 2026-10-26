"use client";
import { useRef, useState, type FormEvent } from "react";
import { applyCoupon, type CouponQuote } from "@/lib/api/orders";
import { authErrorMessage } from "@/lib/auth/contracts";
export default function PromoCode({
  onApplied,
  onBusyChange,
}: {
  onApplied: (quote: CouponQuote) => void;
  onBusyChange: (busy: boolean) => void;
}) {
  const [code, setCode] = useState(""),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [applied, setApplied] = useState("");
  const lock = useRef(false);
  async function apply(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    onBusyChange(true);
    setError("");
    try {
      const quote = await applyCoupon(code);
      onApplied(quote);
      setApplied(quote.code);
      setCode(quote.code);
    } catch (error) {
      setError(authErrorMessage(error));
    } finally {
      lock.current = false;
      setBusy(false);
      onBusyChange(false);
    }
  }
  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5">
      <h2 className="font-bold">هل لديك كود خصم؟</h2>
      <form
        onSubmit={apply}
        className="mt-4 flex gap-3"
      >
        <label className="min-w-0 flex-1">
          كود الخصم
          <input
            required
            maxLength={30}
            value={code}
            onChange={(event) => setCode(event.target.value)}
            disabled={busy}
            className="mt-2 min-h-12 w-full rounded-xl border border-gray-200 px-3"
          />
        </label>
        <button
          disabled={busy}
          className="self-end rounded-xl bg-primary px-5 py-3 text-white"
        >
          {busy ? "جاري التفعيل…" : "تفعيل"}
        </button>
      </form>
      {applied && (
        <p
          role="status"
          className="mt-3 text-primary"
        >
          تم تطبيق الكود: {applied}
        </p>
      )}
      {error && (
        <p
          role="alert"
          className="mt-3 text-red-600"
        >
          {error}
        </p>
      )}
    </section>
  );
}
