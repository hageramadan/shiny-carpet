"use client";
import { canEditOrder } from "@/lib/order-status";
import { useTranslation } from "@/components/i18n/LanguageProvider";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useOrdersApi } from "@/hooks/useOrdersApi";
import { fetchOrder, cancelOrder } from "@/lib/api/orders";
import { isTamaraApprovedReturn } from "@/lib/api/tamara";
import { readAuthSession } from "@/lib/auth/session";
import { authErrorMessage } from "@/lib/auth/contracts";
import { OrderItems, PriceBreakdown } from "./OrderSummary";
import OrderTimeline from "./OrderTimeline";
import OrderPhotos from "./OrderPhotos";
import OrderPayment from "./OrderPayment";
import OrderCompletion from "./OrderCompletion";
export default function OrderDetails({
  id,
  confirmation = false,
}: {
  id: string;
  confirmation?: boolean;
}) {
  const t = useTranslation();
  const valid = /^[1-9]\d*$/.test(id) && Number.isSafeInteger(Number(id));
  const load = useCallback((signal: AbortSignal) => fetchOrder(Number(id), signal), [id]);
  const { data: order, loading, error, signedIn, reload } = useOrdersApi(load, valid);
  const [cancelling, setCancelling] = useState(false),
    [cancelError, setCancelError] = useState("");
  const lock = useRef(false);
  const [verifiedPaidId, setVerifiedPaidId] = useState("");
  const [tamaraReturnId, setTamaraReturnId] = useState("");
  useEffect(() => {
    setTamaraReturnId(isTamaraApprovedReturn(window.location.search, id) ? id : "");
  }, [id]);
  const [cancelledId, setCancelledId] = useState("");
  async function cancel() {
    if (!order || !canEditOrder(order) || lock.current) return;
    lock.current = true;
    setCancelling(true);
    setCancelError("");
    const token = readAuthSession()?.token;
    try {
      const latest = await fetchOrder(Number(order.id));
      if (!token || token !== readAuthSession()?.token) return;
      if (!canEditOrder(latest)) {
        reload();
        return;
      }
      await cancelOrder(Number(order.id));
      if (token === readAuthSession()?.token) {
        setCancelledId(order.id);
        reload();
      }
    } catch (error) {
      if (token === readAuthSession()?.token) setCancelError(authErrorMessage(error));
    } finally {
      lock.current = false;
      setCancelling(false);
    }
  }
  if (loading)
    return (
      <div
        role="status"
        aria-label={t("جاري تحميل تفاصيل الطلب")}
        className="grid min-h-78 place-items-center rounded-xl border border-gray-200 bg-white p-8"
      >
        <span
          aria-hidden="true"
          className="size-10 animate-spin rounded-full border-4 border-primary/20 border-t-primary motion-reduce:animate-none"
        />
        <span className="sr-only">{t("جاري تحميل الطلب…")}</span>
      </div>
    );
  if (!signedIn)
    return (
      <Link
        href={"/login?next=" + encodeURIComponent("/tracking?order=" + id)}
        className="text-primary"
      >
        {t("سجّل الدخول لعرض الطلب")}
      </Link>
    );
  if (!valid) return <p role="alert">{t("أدخل رقم طلب صحيح.")}</p>;
  if (error)
    return (
      <div role="alert">
        {t(error)}
        <button
          className="m-3 text-primary"
          onClick={reload}
        >
          {t("إعادة المحاولة")}
        </button>
      </div>
    );
  if (!order) return null;
  return (
    <div className="space-y-5">
      {confirmation && order.status === "ordered" && (
        <p
          role="status"
          className="rounded-xl bg-primary/10 p-5 font-bold text-primary"
        >
          {t("تم استلام طلبك بنجاح")}
        </p>
      )}
      <p>
        {t("رقم الطلب: ")}
        <bdi>{t(order.id)}</bdi> {t(" ·")}
        {t(" ")}
        {t(
          new Date(order.createdAt).toLocaleDateString(
            t.locale === "en" ? "en-GB" : "ar-EG",
          ),
        )}
      </p>
      {tamaraReturnId === order.id &&
        verifiedPaidId !== order.id &&
        order.userPaid !== true &&
        order.status !== "paid" && (
          <div className="rounded-xl bg-primary/10 p-5 text-ink">
            <p role="status">
              {t(
                "تمت العودة من تمارا. في انتظار تأكيد الدفع. يمكنك تحديث حالة الطلب للتحقق من النتيجة.",
              )}
            </p>
            <button
              type="button"
              className="mt-3 min-h-11 font-bold text-primary"
              onClick={reload}
            >
              {t("تحديث حالة الطلب")}
            </button>
          </div>
        )}
      <div className="flex flex-wrap gap-3">
        {canEditOrder(order) && cancelledId !== order.id && (
          <Link
            href={"/orders/" + order.id + "/edit"}
            className="inline-flex min-h-11 items-center rounded-xl border border-primary bg-white px-5 py-2 font-bold text-primary"
          >
            {t("تعديل الطلب")}
          </Link>
        )}
        {confirmation && (
          <Link
            href={"/tracking?order=" + order.id}
            className="inline-flex min-h-11 items-center rounded-xl bg-primary px-5 py-2 font-bold text-white"
          >
            {t("تتبع الطلب")}
          </Link>
        )}
      </div>
      <OrderCompletion
        key={order.id}
        order={order}
      />
      <OrderTimeline order={order} />
      {t(
        (order.paymentStatusLabel || verifiedPaidId === order.id) && (
          <section
            aria-label={t("حالة الدفع")}
            className="rounded-xl border border-primary/20 bg-primary/5 p-5"
          >
            <h2 className="font-bold text-ink">{t("حالة الدفع")}</h2>
            <p
              role="status"
              className="mt-2 font-bold text-primary"
            >
              {t(order.paymentStatusLabel ?? "تم الدفع")}
            </p>
          </section>
        ),
      )}
      <div className="grid items-start gap-5 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          <section className="rounded-2xl border border-gray-200 bg-white p-5">
            <h2 className="mb-5 font-bold">{t("منتجات الطلب")}</h2>
            <OrderItems items={order.items} />
          </section>
          {verifiedPaidId === order.id && (
            <p
              role="status"
              className="rounded-xl bg-primary/10 p-4 font-bold text-primary"
            >
              {t("تم تأكيد الدفع بنجاح.")}
            </p>
          )}
          <OrderPayment
            key={order.id + order.status}
            order={order}
            returnedFromTamara={tamaraReturnId === order.id}
            paid={
              verifiedPaidId === order.id ||
              order.userPaid === true ||
              order.status === "paid"
            }
            onPaid={() => {
              setVerifiedPaidId(order.id);
              reload();
            }}
          />
          <OrderPhotos photos={order.photos} />
          {t(
            order.phone && (
              <section className="rounded-2xl border border-gray-200 bg-white p-5">
                <h2 className="font-bold">{t("رقم الهاتف")}</h2>
                <p
                  dir="ltr"
                  className="mt-3 text-start"
                >
                  {t(order.phone)}
                </p>
              </section>
            ),
          )}
          <section className="rounded-2xl border border-gray-200 bg-white p-5">
            <h2 className="font-bold">{t("ملاحظات الطلب")}</h2>
            <p className="mt-3 whitespace-pre-wrap">
              {t(order.notes || "لم تتم إضافة ملاحظات.")}
            </p>
          </section>
        </div>
        <aside className="space-y-5 rounded-2xl border border-gray-200 bg-white p-5">
          <h2 className="font-bold">{t("قيمة الطلب")}</h2>
          <PriceBreakdown
            pricing={order.pricing!}
            currency="SAR"
            orderTotals
          />
          {t(
            order.coupon && (
              <p>
                {t("كود الخصم: ")}
                {t(order.coupon)}
              </p>
            ),
          )}
          {canEditOrder(order) && cancelledId !== order.id && (
            <button
              disabled={cancelling}
              onClick={() => void cancel()}
              className="min-h-11 w-full rounded-xl border border-red-500 px-5 text-red-600 disabled:opacity-50"
            >
              {t(cancelling ? "جاري الإلغاء…" : "إلغاء الطلب")}
            </button>
          )}
          {t(
            cancelError && (
              <p
                role="alert"
                className="text-red-600"
              >
                {t(cancelError)}
              </p>
            ),
          )}
        </aside>
      </div>
    </div>
  );
}
