"use client";
import { useTranslation } from "@/components/i18n/LanguageProvider";

import { useEffect, useState } from "react";
import Image from "next/image";
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
import { createTamaraCheckout, fetchTamaraPaymentStatus } from "@/lib/api/tamara";

type PaymentMethod = PaymentBrand | "TAMARA";

const methods: { brand: PaymentMethod; label: string; image?: string }[] = [
  { brand: "MADA", label: "مدى", image: "/images/payment/mada.png" },
  { brand: "TAMARA", label: "تمارا", image: "/images/payment/tamara.png" },
  // { brand: "APPLEPAY", label: "Apple Pay", image: "/images/payment/ApplePay.png" },
  { brand: "VISA", label: "Visa", image: "/images/payment/Visa.png" },
  { brand: "MASTER", label: "Mastercard", image: "/images/payment/Mastercard.png" },
];
export default function OrderPayment({
  order,
  paid = false,
  returnedFromTamara = false,
  onPaid,
}: {
  order: Order;
  paid?: boolean;
  returnedFromTamara?: boolean;
  onPaid: () => void;
}) {
  const t = useTranslation();
  const [brand, setBrand] = useState<PaymentMethod>("MADA");
  const [checkout, setCheckout] = useState<PaymentCheckout | null>(null);
  const { pending, error, setError, run } = useAuthAction();
  const verification = useAuthAction();
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<PaymentStatus | null>(null);
  const [nextCheckAt, setNextCheckAt] = useState(0);
  const [now, setNow] = useState(Date.now);
  const [tamaraReference, setTamaraReference] = useState("");
  const tamaraStorageKey = () =>
    "shiny-tamara:" + (readAuthSession()?.profile.phone ?? "") + ":" + order.id;
  useEffect(() => {
    try {
      const reference = window.sessionStorage.getItem(tamaraStorageKey()) ?? "";
      if (/^[a-zA-Z0-9._-]{1,200}$/.test(reference)) {
        setTamaraReference(reference);
        setBrand("TAMARA");
      }
    } catch {
      /* Manual verification remains available in the current page. */
    }
  }, [order.id]);
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
    if ((!id && !tamaraReference) || verification.pending || Date.now() < nextCheckAt)
      return;
    await verification.run("verify-payment", async (signal) => {
      setNow(Date.now());
      setNextCheckAt(Date.now() + 30_000);
      const token = readAuthSession()?.token;
      const result = tamaraReference
        ? await fetchTamaraPaymentStatus(Number(order.id), tamaraReference, signal)
        : await fetchPaymentStatus(Number(order.id), id, signal);
      if (readAuthSession()?.token !== token) return;
      setStatus(result);
      if (result === "paid") {
        setOpen(false);
        if (tamaraReference) {
          try {
            window.sessionStorage.removeItem(tamaraStorageKey());
          } catch {
            /* Storage may be unavailable. */
          }
          setTamaraReference("");
        }
        onPaid();
      }
    });
  }
  useEffect(() => {
    if (
      (returnedCheckoutId || (returnedFromTamara && tamaraReference)) &&
      !paid &&
      order.status === "arrived_to_customer_again"
    )
      void verify(returnedCheckoutId);
    // A callback query only triggers once; later checks are explicit user actions.
  }, [returnedCheckoutId, returnedFromTamara, tamaraReference]);
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
      {t(
        statusMessage && (
          <p
            role="status"
            className="text-sm leading-6 text-ink"
          >
            {t(statusMessage)}
          </p>
        ),
      )}
      {t(
        verification.error && (
          <p
            role="alert"
            className="text-sm text-red-700"
          >
            {t(verification.error)}
          </p>
        ),
      )}
      {t(
        (tamaraReference || checkoutId) && (
          <button
            type="button"
            disabled={verification.pending || now < nextCheckAt}
            onClick={() => void verify()}
            className="min-h-11 rounded-xl border border-primary px-4 text-sm font-bold text-primary disabled:opacity-50"
          >
            {t(
              verification.pending
                ? "جاري التحقق من الدفع…"
                : now < nextCheckAt
                  ? "إعادة التحقق بعد قليل"
                  : tamaraReference
                    ? "تحقق من دفع تمارا"
                    : "تحقق من حالة الدفع",
            )}
          </button>
        ),
      )}
    </div>
  );
  async function start() {
    if (
      pending ||
      verification.pending ||
      tamaraReference ||
      status === "pending" ||
      status === "unknown"
    )
      return;
    if (checkout && status !== "failed") {
      setOpen(true);
      return;
    }
    const token = readAuthSession()?.token;
    // Open during the click so browsers do not block the tab after the API request.
    const tamaraTab = brand === "TAMARA" ? window.open("about:blank", "_blank") : null;
    if (brand === "TAMARA" && !tamaraTab) {
      setError(
        "تعذر فتح تبويب تمارا. يرجى السماح بفتح النوافذ المنبثقة والمحاولة مجددًا.",
      );
      return;
    }
    if (tamaraTab) tamaraTab.opener = null;
    let tamaraOpened = false;
    await run("payment", async (signal) => {
      if (brand === "TAMARA") {
        const result = await createTamaraCheckout(Number(order.id), signal);
        if (readAuthSession()?.token !== token) return;
        if (!tamaraTab || tamaraTab.closed) throw new Error("Tamara tab was closed");
        try {
          window.sessionStorage.setItem(tamaraStorageKey(), result.orderReferenceId);
        } catch {
          throw new Error(
            "تعذر حفظ مرجع تمارا. يرجى السماح بتخزين بيانات الموقع والمحاولة مجددًا.",
          );
        }
        setTamaraReference(result.orderReferenceId);
        tamaraTab.location.replace(result.checkoutUrl);
        tamaraOpened = true;
        return;
      }
      const result = await createPaymentCheckout(Number(order.id), brand, signal);
      if (readAuthSession()?.token !== token) return;
      setCheckout(result);
      setStatus(null);
      setNextCheckAt(0);
      setOpen(true);
    });
    if (tamaraTab && !tamaraOpened) tamaraTab.close();
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
            {t("دفع قيمة الطلب")}
          </h2>
          <p className="mt-1 text-sm text-muted">{t("اختر طريقة الدفع لإكمال طلبك.")}</p>
        </div>
      </div>
      <fieldset
        disabled={
          pending ||
          verification.pending ||
          Boolean(tamaraReference) ||
          status === "pending" ||
          status === "unknown"
        }
        className="mt-5"
      >
        <legend className="sr-only">{t("طريقة الدفع")}</legend>
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
              <span className="flex min-w-0 flex-1 flex-col items-center gap-1 sm:flex-row sm:gap-2">
                {method.image ? (
                  <Image
                    src={method.image}
                    alt=""
                    width={105}
                    height={72}
                    className="h-9 w-13 shrink-0 object-contain"
                  />
                ) : (
                  <span
                    aria-hidden="true"
                    className="rounded-lg bg-[#f5d9e8] px-2 py-1 text-sm font-bold text-ink"
                  >
                    {t("تمارا")}
                  </span>
                )}
                <span
                  dir={
                    method.brand === "MADA" || method.brand === "TAMARA" ? "rtl" : "ltr"
                  }
                  className="text-sm font-semibold text-ink"
                >
                  {t(method.label)}
                </span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>
      {t(
        tamaraReference && (
          <p
            role="status"
            className="mt-4 text-sm text-muted"
          >
            {t(
              "لديك جلسة دفع تمارا لهذا الطلب. بعد إكمال الدفع، اضغط تحقق من دفع تمارا.",
            )}
          </p>
        ),
      )}
      {t(
        error && (
          <p
            role="alert"
            className="mt-3 text-sm text-red-700"
          >
            {t(error)}
          </p>
        ),
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
            {t("جاري تجهيز الدفع…")}
          </>
        ) : (
          <>
            <FiLock aria-hidden="true" />
            {t("متابعة الدفع")}
          </>
        )}
      </button>
      {t(
        (checkoutId || tamaraReference) && !open && (
          <div className="mt-4">{statusControls}</div>
        ),
      )}
      {checkout && open && brand !== "TAMARA" && (
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
