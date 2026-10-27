"use client";

import { useEffect, useId, useRef } from "react";
import { FiX } from "react-icons/fi";
import type { PaymentBrand, PaymentCheckout } from "@/lib/api/payments";
import { money } from "@/lib/data";

function escapeHtml(value: string) {
  return value.replace(
    /[&<>"']/g,
    (character) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        character
      ]!,
  );
}
export default function PaymentDialog({
  checkout,
  brand,
  onClose,
  onReturn,
  verification,
}: {
  checkout: PaymentCheckout;
  brand: PaymentBrand;
  onClose: () => void;
  onReturn: () => void;
  verification: React.ReactNode;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const frame = useRef<HTMLIFrameElement>(null);
  useEffect(() => {
    function returned(event: MessageEvent) {
      if (
        event.origin !== window.location.origin ||
        event.source !== frame.current?.contentWindow
      )
        return;
      const data = event.data;
      if (
        data?.type === "shiny-payment-return" &&
        data.orderId === checkout.orderId &&
        data.checkoutId === checkout.checkoutId
      )
        onReturn();
    }
    window.addEventListener("message", returned);
    return () => window.removeEventListener("message", returned);
  }, [checkout.orderId, checkout.checkoutId, onReturn]);
  useEffect(() => {
    const element = dialog.current;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    element?.showModal();
    return () => {
      element?.close();
      document.body.style.overflow = previousOverflow;
    };
  }, []);
  const returnUrl = new URL("/payment-result", window.location.origin);
  returnUrl.searchParams.set("order", String(checkout.orderId));
  returnUrl.searchParams.set("checkout_id", checkout.checkoutId);
  const html = `<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{margin:0;padding:16px;font-family:Tahoma,Arial,sans-serif;color:#14383B;background:#fff}.wpwl-form{max-width:100%;box-shadow:none}#widget-status{text-align:center;font-size:14px;color:#607779}button{cursor:pointer}</style></head><body><p id="widget-status" role="status">جاري تحميل نموذج الدفع…</p><form action="${escapeHtml(returnUrl.href)}" target="_self" class="paymentWidgets" data-brands="${brand}"></form><script>var wpwlOptions={locale:"ar",style:"card",paymentTarget:"_self"};</script><script src="${escapeHtml(checkout.paymentUrl)}" onload="document.getElementById('widget-status').hidden=true" onerror="document.getElementById('widget-status').textContent='تعذر تحميل نموذج الدفع. أغلق النافذة وحاول مرة أخرى.'"></script></body></html>`;
  return (
    <dialog
      ref={dialog}
      aria-labelledby={titleId}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          const box = event.currentTarget.getBoundingClientRect();
          if (
            event.clientX < box.left ||
            event.clientX > box.right ||
            event.clientY < box.top ||
            event.clientY > box.bottom
          )
            onClose();
        }
      }}
      className="fixed inset-0 m-auto max-h-[calc(100dvh_-_2rem)] w-[calc(100%_-_2rem)] max-w-xl overflow-y-auto rounded-2xl border-0 bg-white p-0 text-ink shadow-2xl backdrop:bg-[#14383B]/60 backdrop:backdrop-blur-sm"
    >
      <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-gray-100 bg-white p-4 sm:px-6">
        <div>
          <h2
            id={titleId}
            className="text-lg font-bold"
          >
            دفع قيمة الطلب
          </h2>
          <p className="mt-1 text-sm text-muted">
            الطلب {checkout.orderId} · {money(checkout.amount)} ر.س
          </p>
        </div>
        <button
          type="button"
          autoFocus
          onClick={onClose}
          aria-label="إغلاق نافذة الدفع"
          className="grid size-11 shrink-0 place-items-center rounded-xl bg-gray-50 text-muted transition-colors hover:bg-primary/10 hover:text-primary focus-visible:outline-2 focus-visible:outline-primary"
        >
          <FiX
            aria-hidden="true"
            className="size-5"
          />
        </button>
      </div>
      <iframe
        ref={frame}
        title="نموذج بوابة الدفع"
        srcDoc={html}
        allow="payment *"
        sandbox="allow-scripts allow-forms allow-same-origin allow-popups allow-top-navigation"
        className="block min-h-[540px] w-full border-0 bg-white"
      />
      {/* <div className="border-t border-gray-100 p-4 sm:px-6">{verification}</div> */}
    </dialog>
  );
}
