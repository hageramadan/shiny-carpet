"use client";

import { useEffect, useId, useRef, useState } from "react";
import { FiCheckCircle, FiX } from "react-icons/fi";
import type { Order } from "@/lib/data";
import { isOrderDelivered } from "@/lib/order-status";
import OrderRating from "./OrderRating";
import { OrderItems, PriceBreakdown } from "./OrderSummary";

export default function OrderCompletion({ order }: { order: Order }) {
  const [invoiceOpen, setInvoiceOpen] = useState(false);
  if (
    !isOrderDelivered(order.status) ||
    (order.status !== "paid" && order.userPaid !== true)
  )
    return null;
  return (
    <section
      aria-label="اكتمال الطلب"
      className="flex flex-col gap-5 rounded-xl border border-gray-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5"
    >
      <div className="flex min-w-0 items-start gap-3 sm:items-center">
        <span className="grid size-11 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
          <FiCheckCircle
            aria-hidden="true"
            className="size-6"
          />
        </span>
        <div>
          <h2 className="text-base font-extrabold text-ink sm:text-lg">
            تم إكمال طلبك بنجاح
          </h2>
          <p className="mt-1 text-xs leading-7 text-muted sm:text-sm">
            يمكنك الآن عرض الفاتورة ومراجعة تفاصيل طلبك، ومشاركتنا تقييمك لتجربة الخدمة.
          </p>
        </div>
      </div>
      <div className="flex shrink-0 flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setInvoiceOpen(true)}
          className="min-h-11 rounded-lg bg-primary px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-ink"
        >
          عرض الفاتورة
        </button>
        <OrderRating
          key={order.id}
          order={order}
          compact
        />
      </div>
      {invoiceOpen && (
        <InvoiceDialog
          order={order}
          onClose={() => setInvoiceOpen(false)}
        />
      )}
    </section>
  );
}

function InvoiceDialog({ order, onClose }: { order: Order; onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  useEffect(() => {
    const element = dialog.current;
    const previousFocus =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    element?.showModal();
    return () => {
      element?.close();
      document.body.style.overflow = previousOverflow;
      if (previousFocus?.isConnected) previousFocus.focus({ preventScroll: true });
    };
  }, []);
  return (
    <dialog
      ref={dialog}
      dir="rtl"
      aria-labelledby={titleId}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        if (event.target !== event.currentTarget) return;
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
      <div className="flex items-center justify-between gap-3">
        <h2
          id={titleId}
          className="text-xl font-extrabold"
        >
          فاتورة الطلب
        </h2>
        <button
          type="button"
          onClick={onClose}
          aria-label="إغلاق الفاتورة"
          className="grid size-10 place-items-center rounded-full bg-gray-50 text-muted"
        >
          <FiX aria-hidden="true" />
        </button>
      </div>
      <p className="mt-3 text-sm text-muted">
        رقم الطلب: <bdi>{order.id}</bdi> ·{" "}
        {new Date(order.createdAt).toLocaleDateString("ar-EG")}
      </p>
      <div className="mt-5 rounded-xl bg-primary/10 px-4 py-3 text-sm font-bold text-primary">
        تم الدفع · تم التسليم
      </div>
      <section className="mt-6">
        <h3 className="mb-4 font-bold">منتجات الطلب</h3>
        <OrderItems items={order.items} />
      </section>
      {order.pricing && (
        <div className="mt-6 border-t border-gray-100 pt-5">
          <PriceBreakdown
            pricing={order.pricing}
            currency="SAR"
            orderTotals
          />
        </div>
      )}
      {order.coupon && (
        <p className="mt-3 text-xs text-muted">كود الخصم: {order.coupon}</p>
      )}
    </dialog>
  );
}
