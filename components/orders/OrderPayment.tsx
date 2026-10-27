"use client";

import { useEffect, useState } from "react";
import { FiCreditCard, FiLock } from "react-icons/fi";
import {
  createPaymentCheckout,
  fetchPaymentStatus,
  type PaymentStatus,
  type PaymentBrand,
  type PaymentCheckout,
} from "@/lib/api/payments";
import { useAuthAction } from "@/hooks/useAuthAction";
import { readAuthSession } from "@/lib/auth/session";
import type { Order } from "@/lib/data";
import PaymentDialog from "./PaymentDialog";

const methods: { brand: PaymentBrand; label: string; style: string }[] = [
  { brand: "MADA", label: "مدى", style: "font-bold text-[#087B82]" },
  { brand: "APPLEPAY", label: "Apple Pay", style: "font-semibold text-black" },
  { brand: "VISA", label: "Visa", style: "font-extrabold italic text-[#1A1F71]" },
  { brand: "MASTER", label: "Mastercard", style: "font-bold text-[#B44918]" },
];
export default function OrderPayment({
  order,
  paid = false,
  onPaid,
}: {
  order: Order;
  paid?: boolean;
  onPaid: () => void;
}) {
  const [brand, setBrand] = useState<PaymentBrand>("MADA");
  const [checkout, setCheckout] = useState<PaymentCheckout | null>(null);
  const { pending, error, setError, run } = useAuthAction();
  const verification = useAuthAction();
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<PaymentStatus | null>(null);
  const [nextCheckAt, setNextCheckAt] = useState(0);
  const [now, setNow] = useState(Date.now);
  const [returnedCheckoutId, setReturnedCheckoutId] = useState("");
  useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    const checkoutId = query.get("checkout_id") ?? "";
    if (query.get("order") === order.id && /^[a-zA-Z0-9._-]{1,200}$/.test(checkoutId))
      setReturnedCheckoutId(checkoutId);
  }, [order.id]);
  useEffect(() => {
    if (nextCheckAt <= now) return;
    const timer = setTimeout(() => setNow(Date.now()), nextCheckAt - now);
    return () => clearTimeout(timer);
  }, [nextCheckAt, now]);
  const checkoutId = checkout?.checkoutId ?? returnedCheckoutId;
  async function verify(id = checkoutId) {
    if (!id || verification.pending || Date.now() < nextCheckAt) return;
    await verification.run("verify-payment", async (signal) => {
      setNow(Date.now());
      setNextCheckAt(Date.now() + 30_000);
      const token = readAuthSession()?.token;
      const result = await fetchPaymentStatus(Number(order.id), id, signal);
      if (readAuthSession()?.token !== token) return;
      setStatus(result);
      if (result === "paid") {
        setOpen(false);
        onPaid();
      }
    });
  }
  useEffect(() => {
    if (returnedCheckoutId && !paid && order.status === "arrived_to_customer_again")
      void verify(returnedCheckoutId);
    // A callback query only triggers once; later checks are explicit user actions.
  }, [returnedCheckoutId]);
  if (order.status !== "arrived_to_customer_again" || paid) return null;
  const statusMessage =
    status === "pending"
      ? "الدفع قيد المعالجة. انتظر قليلًا ثم تحقق مرة أخرى قبل إعادة الدفع."
      : status === "failed"
        ? "لم تتم عملية الدفع. يمكنك المحاولة مرة أخرى."
        : status === "unknown"
          ? "لم يتم تأكيد نتيجة الدفع بعد. تحقق مرة أخرى قبل إعادة الدفع."
          : "";
  const statusControls = (
    <div className="space-y-3">
      {statusMessage && (
        <p
          role="status"
          className="text-sm leading-6 text-ink"
        >
          {statusMessage}
        </p>
      )}
      {verification.error && (
        <p
          role="alert"
          className="text-sm text-red-700"
        >
          {verification.error}
        </p>
      )}
      <button
        type="button"
        disabled={verification.pending || now < nextCheckAt}
        onClick={() => void verify()}
        className="min-h-11 rounded-xl border border-primary px-4 text-sm font-bold text-primary disabled:opacity-50"
      >
        {verification.pending
          ? "جاري التحقق من الدفع…"
          : now < nextCheckAt
            ? "إعادة التحقق بعد قليل"
            : "تحقق من حالة الدفع"}
      </button>
    </div>
  );
  async function start() {
    if (pending || verification.pending || status === "pending" || status === "unknown")
      return;
    if (checkout && status !== "failed") {
      setOpen(true);
      return;
    }
    const token = readAuthSession()?.token;
    await run("payment", async (signal) => {
      const result = await createPaymentCheckout(Number(order.id), brand, signal);
      if (readAuthSession()?.token !== token) return;
      setCheckout(result);
      setStatus(null);
      setNextCheckAt(0);
      setOpen(true);
    });
  }
  return (
    <section
      aria-labelledby={"order-payment-" + order.id}
      className="rounded-2xl border border-primary/20 bg-white p-5"
    >
      <div className="flex items-center gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
          <FiCreditCard
            aria-hidden="true"
            className="size-5"
          />
        </span>
        <div>
          <h2
            id={"order-payment-" + order.id}
            className="font-bold"
          >
            دفع قيمة الطلب
          </h2>
          <p className="mt-1 text-sm text-muted">اختر طريقة الدفع لإكمال طلبك.</p>
        </div>
      </div>
      <fieldset
        disabled={
          pending || verification.pending || status === "pending" || status === "unknown"
        }
        className="mt-5"
      >
        <legend className="sr-only">طريقة الدفع</legend>
        <div className="grid grid-cols-2 gap-3">
          {methods.map((method) => (
            <label
              key={method.brand}
              className={
                "flex min-h-16 cursor-pointer items-center gap-3 rounded-xl border px-3 py-3 transition-colors focus-within:ring-4 focus-within:ring-primary/10 " +
                (brand === method.brand
                  ? "border-primary bg-primary/5"
                  : "border-gray-200 hover:border-primary/60")
              }
            >
              <input
                type="radio"
                name={"payment-brand-" + order.id}
                value={method.brand}
                checked={brand === method.brand}
                onChange={() => {
                  setBrand(method.brand);
                  setCheckout(null);
                  setStatus(null);
                  setError("");
                }}
                className="size-4 shrink-0 accent-[#20A9B0]"
              />
              <span
                dir={method.brand === "MADA" ? "rtl" : "ltr"}
                className={"min-w-0 text-sm " + method.style}
              >
                {method.label}
              </span>
            </label>
          ))}
        </div>
      </fieldset>
      {error && (
        <p
          role="alert"
          className="mt-3 text-sm text-red-700"
        >
          {error}
        </p>
      )}
      <button
        type="button"
        onClick={() => void start()}
        disabled={
          pending || verification.pending || status === "pending" || status === "unknown"
        }
        aria-busy={pending}
        className="mt-4 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-ink disabled:cursor-wait disabled:opacity-60"
      >
        {pending ? (
          <>
            <span
              aria-hidden="true"
              className="size-4 animate-spin rounded-full border-2 border-white/30 border-t-white motion-reduce:animate-none"
            />
            جاري تجهيز الدفع…
          </>
        ) : (
          <>
            <FiLock aria-hidden="true" />
            متابعة الدفع
          </>
        )}
      </button>
      {checkoutId && !open && <div className="mt-4">{statusControls}</div>}
      {checkout && open && (
        <PaymentDialog
          checkout={checkout}
          brand={brand}
          onClose={() => setOpen(false)}
          onReturn={() => {
            setOpen(false);
            void verify();
          }}
          verification={statusControls}
        />
      )}
    </section>
  );
}
