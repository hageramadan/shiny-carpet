import Link from "next/link";
import { money, type CartItem } from "@/lib/data";
import { cartSummary } from "@/lib/cart";

export default function CartSummary({ items }: { items: CartItem[] }) {
  const summary = cartSummary(items);
  return (
    <aside
      aria-labelledby="cart-summary-title"
      className="rounded-2xl border border-gray-200 bg-white p-5 lg:sticky lg:top-6 lg:p-6"
    >
      <h2
        id="cart-summary-title"
        className="text-xl font-bold text-ink"
      >
        ملخص الطلب
      </h2>
      <dl className="mt-6 space-y-5 text-sm">
        <div className="flex items-center justify-between gap-4">
          <dt className="text-muted">السعر</dt>
          <dd className="text-ink">{money(summary.subtotal)} ج.م</dd>
        </div>
        <div className="flex items-center justify-between gap-4">
          <dt className="text-muted">التوصيل</dt>
          <dd className="text-ink">{money(summary.delivery)} ج.م</dd>
        </div>
        <div className="flex items-center justify-between gap-4">
          <dt className="text-muted">الضريبة</dt>
          <dd className="text-ink">{money(summary.tax)} ج.م</dd>
        </div>
        <div className="flex items-center justify-between gap-4">
          <dt className="text-muted">الخصم</dt>
          <dd className="text-primary">{money(summary.discount)} ج.م</dd>
        </div>
        <div className="flex items-center justify-between gap-4 border-t border-gray-200 pt-5">
          <dt className="text-lg font-bold text-ink">الإجمالي</dt>
          <dd className="text-xl font-bold text-primary">{money(summary.total)} ج.م</dd>
        </div>
      </dl>
      <Link
        href="/checkout"
        className="mt-5 flex min-h-12 w-full items-center justify-center rounded-xl bg-primary px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-ink shadow-button"
      >
        استكمال الطلب
      </Link>
      <p className="mt-4 text-sm leading-7 text-[#6B7280] font-semibold text-center">
     يمكنك تعديل المقاسات والكمية قبل المتابعة.
      </p>
    </aside>
  );
}
