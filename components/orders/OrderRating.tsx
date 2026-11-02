"use client";

import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import Image from "next/image";
import { FiCheckCircle, FiStar, FiX } from "react-icons/fi";
import type { Order } from "@/lib/data";
import { canRateOrder } from "@/lib/order-rating";
import { submitRating } from "@/lib/api/ratings";
import { authErrorMessage } from "@/lib/auth/contracts";
import { readAuthSession } from "@/lib/auth/session";

const ratingLabels = ["", "سيئ", "مقبول", "جيد", "جيد جدًا", "ممتاز"];

export default function OrderRating({
  order,
  compact = false,
}: {
  order: Order;
  compact?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  if (submitted || order.isRated === true)
    return (
      <p
        role="status"
        className="flex items-center gap-2 text-sm font-semibold text-primary"
      >
        <FiCheckCircle aria-hidden="true" />{" "}
        {submitted ? "شكرًا لك! تم إرسال تقييمك بنجاح." : "تم تقييم الطلب"}
      </p>
    );
  if (!canRateOrder(order)) return null;
  return (
    <>
      {compact ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-primary bg-white px-4 py-2 text-sm font-bold text-primary transition-colors hover:bg-primary/10"
        >
          <FiStar aria-hidden="true" /> تقييم الطلب
        </button>
      ) : (
        <section className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-primary/20 bg-white p-5">
          <div>
            <h2 className="font-bold text-ink">كيف كانت تجربتك مع شايني كاربت؟</h2>
            <p className="mt-2 text-sm leading-7 text-muted">
              رأيك يهمنا ويساعدنا على تقديم خدمة أفضل.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-ink"
          >
            <FiStar aria-hidden="true" /> قيّم تجربتك
          </button>
        </section>
      )}
      {open && (
        <RatingDialog
          order={order}
          onClose={() => setOpen(false)}
          onSuccess={() => {
            setSubmitted(true);
            setOpen(false);
          }}
        />
      )}
    </>
  );
}

function RatingDialog({
  order,
  onClose,
  onSuccess,
}: {
  order: Order;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const stars = useRef<HTMLFieldSetElement>(null);
  const lock = useRef(false);
  const mounted = useRef(true);
  const [rating, setRating] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [missing, setMissing] = useState(false);
  const titleId = useId();
  const errorId = useId();
  const descriptionId = useId();
  useEffect(() => {
    mounted.current = true;
    const element = dialog.current;
    const previousFocus =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    element?.showModal();
    return () => {
      mounted.current = false;
      element?.close();
      document.body.style.overflow = previousOverflow;
      if (previousFocus?.isConnected) previousFocus.focus({ preventScroll: true });
    };
  }, []);

  async function send(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (lock.current) return;
    if (!rating) {
      setMissing(true);
      stars.current?.querySelector("input")?.focus();
      return;
    }
    if (!canRateOrder(order)) return;
    const token = readAuthSession()?.token;
    lock.current = true;
    setBusy(true);
    setError("");
    try {
      await submitRating(Number(order.id), rating);
      if (mounted.current && readAuthSession()?.token === token) onSuccess();
    } catch (failure) {
      if (mounted.current && readAuthSession()?.token === token)
        setError(authErrorMessage(failure));
    } finally {
      lock.current = false;
      if (mounted.current) setBusy(false);
    }
  }
  const image = order.items[0]?.product?.image;
  const pieces = order.items.reduce((sum, item) => sum + item.quantity, 0);
  return (
    <dialog
      ref={dialog}
      dir="rtl"
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      onCancel={(event) => {
        event.preventDefault();
        if (!lock.current) onClose();
      }}
      onClick={(event) => {
        if (event.target !== event.currentTarget || lock.current) return;
        const box = event.currentTarget.getBoundingClientRect();
        if (
          event.clientX < box.left ||
          event.clientX > box.right ||
          event.clientY < box.top ||
          event.clientY > box.bottom
        )
          onClose();
      }}
      className="fixed inset-0 m-auto max-h-[calc(100dvh_-_2rem)] w-[calc(100%_-_2rem)] max-w-xl overflow-y-auto rounded-2xl border-0 bg-white p-5 text-ink shadow-2xl backdrop:bg-black/60 sm:p-7"
    >
      <button
        type="button"
        onClick={onClose}
        disabled={busy}
        aria-label="إغلاق نافذة التقييم"
        className="mr-auto mb-3 grid size-9 place-items-center rounded-full bg-gray-50 text-muted transition-colors hover:bg-primary/10 disabled:opacity-50"
      >
        <FiX
          aria-hidden="true"
          className="size-5"
        />
      </button>
      <div className="flex items-center gap-3 rounded-xl bg-[#f7f9fa] p-3 sm:p-4">
        {image && (
          <Image
            src={image}
            alt={order.items[0]?.product?.name ?? "صورة المنتج"}
            width={44}
            height={44}
            className="size-11 shrink-0 rounded-lg object-cover"
          />
        )}
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold">
            طلب <bdi>{order.id}</bdi>
          </p>
          <p className="mt-1 text-xs leading-6 text-muted">
            {new Date(order.createdAt).toLocaleDateString("ar-EG")}{" "}
            {pieces > 0 && <> · {new Intl.NumberFormat("ar-EG").format(pieces)} قطع</>}
          </p>
        </div>
        <span className="shrink-0 rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
          تم التسليم
        </span>
      </div>
      <h2
        id={titleId}
        className="mt-7 text-center text-lg font-extrabold sm:text-2xl"
      >
        كيف كانت تجربتك مع شايني كاربت؟
      </h2>
      <p
        id={descriptionId}
        className="mt-3 text-center text-xs leading-7 text-muted sm:text-sm"
      >
        قيّم خدمة التنظيف والتوصيل لطلبك. رأيك يساعدنا على تقديم تجربة أفضل.
      </p>
      <form
        onSubmit={send}
        aria-busy={busy}
        className="mt-5"
      >
        <fieldset
          ref={stars}
          disabled={busy}
          aria-invalid={missing}
          aria-describedby={missing ? errorId : undefined}
          className="min-w-0"
        >
          <legend className="sr-only">تقييم الخدمة من ١ إلى ٥ نجوم</legend>
          <div className="flex justify-center gap-1 sm:gap-2">
            {[1, 2, 3, 4, 5].map((value) => (
              <label
                key={value}
                className="relative cursor-pointer rounded-lg p-1"
              >
                <input
                  type="radio"
                  name="rating"
                  value={value}
                  checked={rating === value}
                  onChange={() => {
                    setRating(value);
                    setMissing(false);
                    setError("");
                  }}
                  aria-label={value + " من 5 نجوم"}
                  className="peer sr-only"
                />
                <FiStar
                  aria-hidden="true"
                  className={
                    "size-9 rounded-md stroke-1 transition-colors peer-focus-visible:outline-2 peer-focus-visible:outline-offset-4 peer-focus-visible:outline-primary sm:size-10 " +
                    (value <= rating
                      ? "fill-primary text-primary"
                      : "fill-gray-200 text-gray-200")
                  }
                />
              </label>
            ))}
          </div>
          <p
            aria-live="polite"
            className="mt-3 min-h-7 text-center text-sm font-bold text-primary"
          >
            {rating ? ratingLabels[rating] : "اختر تقييمك"}
          </p>
          <p className="mt-1 text-center text-xs leading-6 text-muted">
            اضغط على النجوم لاختيار تقييمك (من ١ إلى ٥)
          </p>
        </fieldset>
        {missing && (
          <p
            id={errorId}
            role="alert"
            className="mt-4 rounded-xl bg-red-50 p-3 text-center text-sm text-red-700"
          >
            اختر عدد النجوم أولًا علشان نقدر نسجل تقييمك.
          </p>
        )}
        {error && (
          <p
            role="alert"
            className="mt-4 rounded-xl bg-red-50 p-3 text-sm leading-7 text-red-700"
          >
            {error}
          </p>
        )}
        <div className="mt-6 border-t border-gray-100 pt-5">
          <button
            type="submit"
            disabled={busy}
            className="min-h-12 w-full rounded-xl bg-primary px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-ink disabled:cursor-wait disabled:opacity-60"
          >
            {busy ? "جاري إرسال التقييم…" : "إرسال التقييم"}
          </button>
        </div>
      </form>
    </dialog>
  );
}
