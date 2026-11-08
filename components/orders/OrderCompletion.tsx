"use client";
import { useTranslation } from "@/components/i18n/LanguageProvider";

import { FiCheckCircle } from "react-icons/fi";
import type { Order } from "@/lib/data";
import { isOrderDelivered, orderFulfillmentStatus } from "@/lib/order-status";
import OrderRating from "./OrderRating";
import OrderInvoice from "./OrderInvoice";

export default function OrderCompletion({ order }: { order: Order }) {
  const t = useTranslation();
  if (
    !isOrderDelivered(orderFulfillmentStatus(order)) ||
    (order.status !== "paid" && order.userPaid !== true)
  )
    return null;
  return (
    <section
      aria-label={t("اكتمال الطلب")}
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
            {t("تم إكمال طلبك بنجاح")}
          </h2>
        </div>
      </div>
      <div className="flex shrink-0 flex-wrap items-center gap-2">
        <OrderInvoice id={Number(order.id)} />
        <OrderRating
          key={order.id}
          order={order}
          compact
        />
      </div>
    </section>
  );
}
