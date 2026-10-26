"use client";
import { useCallback, useRef, useState } from "react";
import Link from "next/link";
import { useOrdersApi } from "@/hooks/useOrdersApi";
import { fetchOrder, cancelOrder } from "@/lib/api/orders";
import { readAuthSession } from "@/lib/auth/session";
import { authErrorMessage } from "@/lib/auth/contracts";
import { OrderItems, PriceBreakdown } from "./OrderSummary";
import OrderTimeline from "./OrderTimeline";
import OrderPhotos from "./OrderPhotos";
export default function OrderDetails({
  id,
  confirmation = false,
}: {
  id: string;
  confirmation?: boolean;
}) {
  const valid = /^[1-9]\d*$/.test(id) && Number.isSafeInteger(Number(id));
  const load = useCallback((signal: AbortSignal) => fetchOrder(Number(id), signal), [id]);
  const { data: order, loading, error, signedIn, reload } = useOrdersApi(load, valid);
  const [cancelling, setCancelling] = useState(false),
    [cancelError, setCancelError] = useState("");
  const lock = useRef(false);
  const [cancelledId, setCancelledId] = useState("");
  async function cancel() {
    if (!order || order.status !== "confirmed" || lock.current) return;
    lock.current = true;
    setCancelling(true);
    setCancelError("");
    const token = readAuthSession()?.token;
    try {
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
        aria-label="جاري تحميل تفاصيل الطلب"
        className="grid min-h-78 place-items-center rounded-xl border border-gray-200 bg-white p-8"
      >
        <span
          aria-hidden="true"
          className="size-10 animate-spin rounded-full border-4 border-primary/20 border-t-primary motion-reduce:animate-none"
        />
        <span className="sr-only">جاري تحميل الطلب…</span>
      </div>
    );
  if (!signedIn)
    return (
      <Link
        href={"/login?next=" + encodeURIComponent("/tracking?order=" + id)}
        className="text-primary"
      >
        سجّل الدخول لعرض الطلب
      </Link>
    );
  if (!valid) return <p role="alert">أدخل رقم طلب صحيح.</p>;
  if (error)
    return (
      <div role="alert">
        {error}
        <button
          className="m-3 text-primary"
          onClick={reload}
        >
          إعادة المحاولة
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
          تم استلام طلبك بنجاح
        </p>
      )}
      <p>
        رقم الطلب: <bdi>{order.id}</bdi> ·{" "}
        {new Date(order.createdAt).toLocaleDateString("ar-EG")}
      </p>
      <OrderTimeline order={order} />
      <div className="grid items-start gap-5 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          <section className="rounded-2xl border border-gray-200 bg-white p-5">
            <h2 className="mb-5 font-bold">منتجات الطلب</h2>
            <OrderItems items={order.items} />
          </section>
          <OrderPhotos photos={order.photos} />
          {order.phone && (
            <section className="rounded-2xl border border-gray-200 bg-white p-5">
              <h2 className="font-bold">رقم الهاتف</h2>
              <p
                dir="ltr"
                className="mt-3 text-right"
              >
                {order.phone}
              </p>
            </section>
          )}
          <section className="rounded-2xl border border-gray-200 bg-white p-5">
            <h2 className="font-bold">ملاحظات الطلب</h2>
            <p className="mt-3 whitespace-pre-wrap">
              {order.notes || "لم تتم إضافة ملاحظات."}
            </p>
          </section>
        </div>
        <aside className="space-y-5 rounded-2xl border border-gray-200 bg-white p-5">
          <h2 className="font-bold">قيمة الطلب</h2>
          <PriceBreakdown
            pricing={order.pricing!}
            currency="SAR"
            orderTotals
          />
          {order.coupon && <p>كود الخصم: {order.coupon}</p>}
          {order.status === "confirmed" && cancelledId !== order.id && (
            <button
              disabled={cancelling}
              onClick={() => void cancel()}
              className="min-h-11 w-full rounded-xl border border-red-500 px-5 text-red-600 disabled:opacity-50"
            >
              {cancelling ? "جاري الإلغاء…" : "إلغاء الطلب"}
            </button>
          )}
          {cancelError && (
            <p
              role="alert"
              className="text-red-600"
            >
              {cancelError}
            </p>
          )}
        </aside>
      </div>
    </div>
  );
}
