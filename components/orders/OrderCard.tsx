import Link from "next/link";
import type { Order } from "@/lib/data";
import { money, cartProduct, cartCurrency, currencyLabel } from "@/lib/data";
import { orderStages } from "@/lib/order-status";

const dateFormatter = new Intl.DateTimeFormat("ar-EG", {
  day: "2-digit",
  month: "long",
  year: "numeric",
});

export default function OrderCard({ order }: { order: Order }) {
  const status =
    orderStages.find((stage) => stage.id === order.status)?.label ?? "بانتظار الاستلام";
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
            <bdi>{order.id}</bdi>
          </h3>
          <span className="rounded-full bg-[#e5f6f8] px-2.5 py-0.5 text-xs font-bold text-primary">
            {status}
          </span>
          <span className="text-xs text-muted"></span>
        </div>
        <p className="mt-1 text-sm text-muted">
          <time dateTime={order.createdAt}>
            {dateFormatter.format(new Date(order.createdAt))}
          </time>
        </p>
        <p className="mt-0.5 text-sm leading-6 text-muted">
          {pieces} قطع · {summary}
        </p>
      </div>
      <div className="flex shrink-0 items-center justify-between gap-4 sm:flex-row-reverse">
        <Link
          href={`/tracking?order=${encodeURIComponent(order.id)}`}
          aria-label={`عرض تفاصيل الطلب ${order.id}`}
          className="inline-flex min-h-11 items-center justify-center rounded-lg border border-primary bg-white px-4 py-2 text-sm font-bold text-primary transition-colors hover:bg-primary/5"
        >
          عرض التفاصيل
        </Link>
        <strong className="whitespace-nowrap text-sm text-primary">
          {money(order.total)} {currencyLabel(cartCurrency(order.items))}
        </strong>
      </div>
    </article>
  );
}
