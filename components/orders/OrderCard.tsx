"use client";
import { useTranslation } from "@/components/i18n/LanguageProvider";
import Link from "next/link";
import type { Order } from "@/lib/data";
import { money, cartProduct, cartCurrency, currencyLabel } from "@/lib/data";
import OrderRating from "./OrderRating";
import {
  canEditOrder,
  orderStages,
  orderFulfillmentStatus,
  isOrderDelivered,
} from "@/lib/order-status";

export default function OrderCard({ order }: { order: Order }) {
  const t = useTranslation();
  const dateFormatter = new Intl.DateTimeFormat(t.locale === "en" ? "en-GB" : "ar-EG", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
  const status =
    (order.status !== "paid" && !isOrderDelivered(order.status) && order.statusLabel) ||
    (orderStages.find((stage) => stage.id === orderFulfillmentStatus(order))?.label ??
      "حالة الطلب غير متاحة");
  const pieces = order.items.reduce((total, item) => total + item.quantity, 0);
  const summary = order.items
    .map((item) => {
      const name = cartProduct(item)?.name ?? "قطعة";
      const size = item.dimensions
        ? `${item.dimensions.length} × ${item.dimensions.width} م`
        : item.sizeLabel;
      return `${name}${size ? ` (${size})` : ""} × ${item.quantity}`;
    })
    .join(" · ");

  return (
    <article className="flex flex-col justify-between gap-5 rounded-xl border border-gray-200 bg-white px-4 py-6 sm:flex-row sm:items-center sm:px-4">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <h3 className="font-bold">
            <bdi>{t(order.id)}</bdi>
          </h3>
          <span className="rounded-full bg-[#e5f6f8] px-2.5 py-0.5 text-xs font-bold text-primary">
            {t(status)}
          </span>
          {t(
            order.paymentStatusLabel && (
              <span className="text-xs font-bold text-primary">
                {t("حالة الدفع: ")}
                {t(order.paymentStatusLabel)}
              </span>
            ),
          )}
        </div>
        <p className="mt-1 text-sm text-muted">
          <time dateTime={order.createdAt}>
            {t(dateFormatter.format(new Date(order.createdAt)))}
          </time>
        </p>
        <p
          hidden={!order.items.length}
          className="mt-0.5 text-sm leading-6 text-muted"
        >
          {pieces} {t(" قطع · ")}
          {t(summary)}
        </p>
      </div>
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 sm:flex-row-reverse">
        <Link
          href={`/tracking?order=${encodeURIComponent(order.id)}`}
          aria-label={t(`عرض تفاصيل الطلب ${order.id}`)}
          className="inline-flex min-h-11 items-center justify-center rounded-lg border border-primary bg-white px-4 py-2 text-sm font-bold text-primary transition-colors hover:bg-primary/5"
        >
          {t("عرض التفاصيل")}
        </Link>
        {canEditOrder(order) && (
          <Link
            href={"/orders/" + order.id + "/edit"}
            aria-label={t("تعديل الطلب") + " " + order.id}
            className="inline-flex min-h-11 items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-bold text-white hover:bg-ink"
          >
            {t("تعديل الطلب")}
          </Link>
        )}
        <OrderRating
          key={order.id}
          order={order}
          compact
        />
        <strong className="whitespace-nowrap text-sm text-primary">
          {t(money(order.total))} {t(currencyLabel(cartCurrency(order.items)))}
        </strong>
      </div>
    </article>
  );
}
