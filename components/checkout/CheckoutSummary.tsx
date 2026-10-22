import type { CartItem, OrderPricing } from "@/lib/data";
import { OrderItems, PriceBreakdown } from "@/components/orders/OrderSummary";

export default function CheckoutSummary({
  items,
  pricing,
  busy,
  preparingPhotos = false,
}: {
  items: CartItem[];
  pricing: OrderPricing;
  busy: boolean;
  preparingPhotos?: boolean;
}) {
  return (
    <aside className="rounded-2xl border border-gray-200 bg-white p-5 lg:sticky lg:top-6 lg:p-6">
      <h2 className="mb-5 text-lg font-bold text-ink">ملخص الطلب</h2>
      <OrderItems items={items} />
      <div className="mt-6 border-t border-gray-200 pt-5">
        <PriceBreakdown pricing={pricing} />
      </div>
      <button
        type="submit"
        form="checkout-form"
        disabled={busy || preparingPhotos}
        className="mt-5 flex min-h-12 w-full items-center justify-center rounded-xl bg-primary px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-ink shadow-button"
      >
        {preparingPhotos
          ? "جاري تجهيز الصور…"
          : busy
            ? "جاري إتمام الطلب…"
            : "إتمام الطلب"}
      </button>
      <p className="mt-4 text-sm leading-7 text-[#6B7280] font-semibold text-center">
        راجع تفاصيل الطلب قبل الإتمام.
      </p>
    </aside>
  );
}
