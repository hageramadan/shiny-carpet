"use client";

import { useState } from "react";
import Link from "next/link";
import { useStore } from "./store";
import OrderCard from "./orders/OrderCard";
import EmptyOrders from "./orders/EmptyOrders";
import OrdersSupport from "./orders/OrdersSupport";

const tabs = [
  { id: "current", label: "الطلبات الحالية" },
  { id: "previous", label: "الطلبات السابقة" },
] as const;

type OrdersTab = (typeof tabs)[number]["id"];

export function OrdersPage() {
  const { state, ready } = useStore();
  const [activeTab, setActiveTab] = useState<OrdersTab>("current");
  const visibleOrders = state.orders.filter((order) =>
    activeTab === "previous"
      ? order.status === "delivered"
      : order.status !== "delivered",
  );

  return (
    <section className="min-h-[65vh] bg-[#f7f9fa] pb-12 pt-6 text-ink sm:pb-14">
      <div className="mx-auto w-full max-w-7xl px-5 sm:px-8 lg:px-14">
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
        <h1 className="text-[32px] font-extrabold leading-normal sm:text-4xl">
          طلباتي
        </h1>
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
          aria-busy={!ready}
        >
          {!ready ? (
            <div
              role="status"
              className="grid min-h-78 place-items-center rounded-xl border border-gray-200 bg-white p-6 text-sm text-muted"
            >
              جاري تحميل الطلبات…
            </div>
          ) : visibleOrders.length === 0 ? (
            <EmptyOrders previous={activeTab === "previous"} />
          ) : (
            <section aria-labelledby="orders-list-heading">
              <h2
                id="orders-list-heading"
                className="mb-6 text-lg font-bold"
              >
                {activeTab === "current" ? "الطلبات الحالية" : "الطلبات السابقة"}
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
