import Link from "next/link";
import { money } from "@/lib/data";
import type { CartSnapshot } from "@/lib/api/cart";

export default function CartSummary({
  cart,
  disabled = false,
}: {
  cart: CartSnapshot;
  disabled?: boolean;
}) {
  return (
    <aside
      aria-labelledby="cart-summary-title"
      className="rounded-2xl border border-gray-200 bg-white p-4 sm:p-5 lg:sticky lg:top-24 lg:p-6"
    >
      <h2
        id="cart-summary-title"
        className="text-xl font-bold text-ink"
      >
        ملخص الطلب
      </h2>
      <dl className="mt-4 space-y-4 text-sm sm:mt-6 sm:space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
          <dt className="text-muted">السعر</dt>
          <dd className="text-ink">{money(cart.subtotal)} ر.س</dd>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
          <dt className="text-muted">التوصيل</dt>
          <dd className="text-ink">يُحدد عند إتمام الطلب</dd>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
          <dt className="text-muted">الضريبة ({money(cart.vatPercentage)}٪)</dt>
          <dd className="text-ink">{money(cart.vat)} ر.س</dd>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 border-t border-gray-200 pt-5">
          <dt className="text-lg font-bold text-ink">الإجمالي</dt>
          <dd className="text-lg font-bold text-primary sm:text-xl">
            {money(cart.total)} ر.س
          </dd>
        </div>
      </dl>
      <Link
        href="/checkout"
        aria-disabled={disabled}
        onClick={(event) => {
          if (disabled) event.preventDefault();
        }}
        className="mt-5 flex min-h-12 w-full items-center justify-center rounded-xl bg-primary px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-ink shadow-button"
      >
        استكمال الطلب
      </Link>
      <p className="mt-4 text-sm leading-7 text-[#6B7280] font-semibold text-center">
        يمكنك تعديل الكمية أو إضافة مقاس آخر من صفحة المنتج.
      </p>
    </aside>
  );
}
