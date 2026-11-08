"use client";
import { useCallback, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslation } from "@/components/i18n/LanguageProvider";
import { useOrdersApi } from "@/hooks/useOrdersApi";
import { useOrderEditor } from "@/hooks/useOrderEditor";
import { fetchOrder, cancelOrder } from "@/lib/api/orders";
import { canEditOrder, canCancelOrder } from "@/lib/order-status";
import { ApiError } from "@/lib/api/client";
import type { Order, CartItem } from "@/lib/data";
import { PriceBreakdown } from "./OrderSummary";
import OrderEditItem from "./OrderEditItem";
import OrderProductPicker from "./OrderProductPicker";
import OrderEditReview from "./OrderEditReview";

export default function OrderEditPage({ id }: { id: number }) {
  const t = useTranslation();
  const load = useCallback((signal: AbortSignal) => fetchOrder(id, signal), [id]);
  const request = useOrdersApi(load);
  return (
    <section className="min-h-[70vh] bg-[#f7f9fa] py-6 sm:py-9">
      <div className="container mx-auto min-w-0 px-4 sm:px-6 lg:px-8">
        <Link
          href={"/tracking?order=" + id}
          className="inline-flex min-h-11 items-center text-sm font-bold text-primary"
        >
          {t("العودة إلى تفاصيل الطلب")}
        </Link>
        <h1 className="mt-3 text-2xl font-extrabold sm:text-3xl">{t("تعديل الطلب")}</h1>
        <p className="mb-6 mt-3 text-sm text-muted">
          {t("يمكنك تعديل الطلب قبل استلامه من المندوب.")}
        </p>
        {request.loading ? (
          <p
            role="status"
            className="rounded-xl bg-white p-6"
          >
            {t("جاري تحميل تفاصيل الطلب…")}
          </p>
        ) : !request.signedIn ? (
          <Link
            href={"/login?next=" + encodeURIComponent("/orders/" + id + "/edit")}
            className="font-bold text-primary underline"
          >
            {t("سجّل الدخول لتعديل الطلب")}
          </Link>
        ) : request.error ? (
          <div
            role="alert"
            className="rounded-xl bg-white p-6"
          >
            {t(request.error)}{" "}
            <button
              type="button"
              onClick={request.reload}
              className="min-h-11 text-primary"
            >
              {t("إعادة المحاولة")}
            </button>
          </div>
        ) : request.data ? (
          <Editor
            key={id}
            initialOrder={request.data}
          />
        ) : null}
      </div>
    </section>
  );
}
function Editor({ initialOrder }: { initialOrder: Order }) {
  const t = useTranslation(),
    router = useRouter(),
    editor = useOrderEditor(initialOrder);
  const [step, setStep] = useState<"items" | "review">("items"),
    [picker, setPicker] = useState<CartItem | null | undefined>(undefined),
    [confirmCancel, setConfirmCancel] = useState(false);
  const disabled = editor.pending || editor.needsRefresh;
  async function cancel() {
    const result = await editor.mutate(async (fresh, signal) => {
      if (!canCancelOrder(fresh))
        throw new ApiError(409, {
          message: "يمكن إلغاء الطلب فقط عندما تكون حالته «تم تأكيد الطلب».",
        });
      await cancelOrder(Number(fresh.id), signal);
    });
    if (result) router.push("/tracking?order=" + editor.order.id);
  }
  if (!canEditOrder(editor.order))
    return (
      <div
        role="alert"
        className="rounded-2xl border border-gray-200 bg-white p-6"
      >
        <p className="font-bold">
          {t(
            editor.order.status === "cancelled"
              ? "تم إلغاء الطلب."
              : "لم يعد تعديل هذا الطلب متاحًا. راجع حالته من صفحة التفاصيل.",
          )}
        </p>
        <Link
          href={"/tracking?order=" + editor.order.id}
          className="mt-3 inline-flex min-h-11 font-bold text-primary"
        >
          {t("عرض الطلب")}
        </Link>
      </div>
    );
  return (
    <div className="space-y-5">
      {editor.error && (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
        >
          <p>{t(editor.error)}</p>
          {editor.needsRefresh && (
            <button
              type="button"
              disabled={editor.pending}
              onClick={() => void editor.refresh()}
              className="mt-2 min-h-11 font-bold underline"
            >
              {t("إعادة تحميل بيانات الطلب")}
            </button>
          )}
        </div>
      )}
      <ol
        aria-label={t("خطوات تعديل الطلب")}
        className="flex gap-3 text-sm font-bold"
      >
        <li
          aria-current={step === "items" ? "step" : undefined}
          className="rounded-full bg-primary/10 px-4 py-2 aria-[current=step]:bg-primary aria-[current=step]:text-white"
        >
          {t("١. تعديل المنتجات")}
        </li>
        <li
          aria-current={step === "review" ? "step" : undefined}
          className="rounded-full bg-primary/10 px-4 py-2 aria-[current=step]:bg-primary aria-[current=step]:text-white"
        >
          {t("٢. مراجعة وحفظ")}
        </li>
      </ol>
      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0">
          {picker !== undefined && (
            <OrderProductPicker
              editor={editor}
              target={picker ?? undefined}
              onClose={() => setPicker(undefined)}
            />
          )}
          {picker === undefined && step === "items" && (
            <section className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-lg font-bold">{t("القطع المضافة")}</h2>
                <span className="text-sm text-muted">
                  {editor.order.items.length} {t("منتجات")}
                </span>
              </div>
              {editor.order.items.map((item) => (
                <OrderEditItem
                  key={item.orderItemId ?? item.cartItemId}
                  item={item}
                  editor={editor}
                  onEdit={() => setPicker(item)}
                />
              ))}
              <button
                type="button"
                disabled={disabled}
                onClick={() => setPicker(null)}
                className="min-h-12 w-full rounded-xl border border-primary bg-white px-4 py-3 font-bold text-primary disabled:opacity-50"
              >
                {t("إضافة منتج")}
              </button>
              <p className="text-xs leading-6 text-muted">
                {t("تُحفظ تعديلات المنتجات مباشرةً، ثم يمكنك مراجعة باقي تفاصيل الطلب.")}
              </p>
            </section>
          )}
          <div hidden={picker !== undefined || step !== "review"}>
            <OrderEditReview
              editor={editor}
              onBack={() => setStep("items")}
            />
          </div>
        </div>
        <aside className="space-y-5 rounded-2xl border border-gray-200 bg-white p-5 lg:sticky lg:top-24">
          <h2 className="font-bold">{t("ملخص الطلب")}</h2>
          <PriceBreakdown
            pricing={editor.order.pricing!}
            currency="SAR"
          />
          {step === "items" && picker === undefined && (
            <button
              type="button"
              disabled={disabled || !editor.order.items.length}
              onClick={() => {
                editor.clearError();
                setStep("review");
                window.scrollTo({ top: 0, behavior: "instant" });
              }}
              className="min-h-12 w-full rounded-xl bg-primary px-4 py-3 font-bold text-white disabled:opacity-50"
            >
              {t("التالي")}
            </button>
          )}
          {canCancelOrder(editor.order) && (
            <button
              type="button"
              disabled={disabled}
              onClick={() => setConfirmCancel(true)}
              className="min-h-11 w-full rounded-xl border border-red-200 px-4 py-2 text-red-600 disabled:opacity-50"
            >
              {t("إلغاء الطلب")}
            </button>
          )}
          {confirmCancel && canCancelOrder(editor.order) && (
            <div
              role="alertdialog"
              aria-label={t("تأكيد إلغاء الطلب")}
              className="rounded-xl bg-red-50 p-3 text-sm"
            >
              <p>{t("هل تريد إلغاء الطلب؟")}</p>
              <button
                type="button"
                disabled={disabled}
                onClick={() => void cancel()}
                className="mt-2 min-h-11 font-bold text-red-600"
              >
                {t("تأكيد إلغاء الطلب")}
              </button>
              <button
                type="button"
                disabled={disabled}
                onClick={() => setConfirmCancel(false)}
                className="ms-4 min-h-11"
              >
                {t("رجوع")}
              </button>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
