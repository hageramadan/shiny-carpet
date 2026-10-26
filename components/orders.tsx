"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { useOrdersApi } from "@/hooks/useOrdersApi";
import { isOrderDelivered } from "@/lib/order-status";
import { fetchOrders } from "@/lib/api/orders";
import OrderCard from "./orders/OrderCard";
import EmptyOrders from "./orders/EmptyOrders";
import OrdersSupport from "./orders/OrdersSupport";

const tabs = [
  { id: "ordered", label: "الطلبات الحالية" },
  { id: "delivered_to_customer", label: "الطلبات السابقة" },
  { id: "cancelled", label: "الطلبات الملغاة" },
] as const;

type OrdersTab = (typeof tabs)[number]["id"];

export function OrdersPage() {
  const [activeTab, setActiveTab] = useState<OrdersTab>("ordered");
  const load = useCallback(
    async (signal: AbortSignal) => {
      const orders = await fetchOrders(
        activeTab === "ordered" ? undefined : activeTab,
        signal,
      );
      return activeTab === "ordered"
        ? orders.filter(
            (order) => !isOrderDelivered(order.status) && order.status !== "cancelled",
          )
        : orders;
    },
    [activeTab],
  );
  const {
    data: visibleOrders = [],
    loading,
    error,
    signedIn,
    reload,
  } = useOrdersApi(load);

  return (
    <section className="min-h-[65vh] bg-[#f7f9fa]  pb-12 pt-6 text-ink sm:pb-14">
      <div className="container mx-auto w-full  px-5 sm:px-8 lg:px-14">
        <nav
          aria-label="مسار التصفح"
          className="mb-3 text-sm text-muted"
        >
          <ol className="flex items-center gap-1">
            <li>
              <Link
                href="/"
                className="transition-colors hover:text-primary"
              >
                الرئيسية
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li aria-current="page">طلباتي</li>
          </ol>
        </nav>
        <h1 className="text-[32px] font-extrabold leading-normal sm:text-4xl">طلباتي</h1>
        <p className="mt-3 text-sm leading-6 text-muted sm:text-base">
          تابع طلباتك الحالية من الاستلام حتى وصولها إليك.
        </p>

        <div
          role="group"
          aria-label="تصفية الطلبات"
          className="mb-6 mt-6 flex flex-wrap gap-2.5"
        >
          {tabs.map(({ id, label }) => (
            <button
              key={id}
              type="button"
              aria-pressed={activeTab === id}
              aria-controls="orders-content"
              onClick={() => setActiveTab(id)}
              className="min-h-9 rounded-[9px] border border-gray-200 bg-white px-4 py-1.5 text-sm transition-colors hover:border-primary aria-pressed:border-primary aria-pressed:bg-[#e5f6f8] aria-pressed:text-primary"
            >
              {label}
            </button>
          ))}
        </div>

        <div
          id="orders-content"
          aria-live="polite"
          aria-busy={loading}
        >
          {loading ? (
            <div
              role="status"
              className="grid min-h-78 place-items-center rounded-xl border border-gray-200 bg-white p-6 text-sm text-muted"
            >
              <span
                aria-hidden="true"
                className="size-10 animate-spin rounded-full border-4 border-primary/20 border-t-primary motion-reduce:animate-none"
              />
              <span className="sr-only">جاري تحميل الطلبات…</span>
            </div>
          ) : !signedIn ? (
            <Link
              href="/login?next=%2Forders"
              className="text-primary"
            >
              سجّل الدخول لعرض طلباتك
            </Link>
          ) : error ? (
            <div role="alert">
              {error}
              <button
                onClick={reload}
                className="m-3 text-primary"
              >
                إعادة المحاولة
              </button>
            </div>
          ) : visibleOrders.length === 0 ? (
            <EmptyOrders status={activeTab} />
          ) : (
            <section aria-labelledby="orders-list-heading">
              <h2
                id="orders-list-heading"
                className="mb-6 text-lg font-bold"
              >
                {tabs.find((tab) => tab.id === activeTab)?.label}
                <span className="font-normal">
                  {" "}
                  · {new Intl.NumberFormat("ar-EG").format(visibleOrders.length)} طلب
                </span>
              </h2>
              <ul className="space-y-4">
                {visibleOrders.map((order) => (
                  <li key={order.id}>
                    <OrderCard order={order} />
                  </li>
                ))}
              </ul>
              <OrdersSupport />
            </section>
          )}
        </div>
      </div>
    </section>
  );
}
