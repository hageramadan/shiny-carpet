"use client";
import Link from "next/link";
import { FiCheckCircle } from "react-icons/fi";
import { useStore } from "@/components/store";
import { cartSummary } from "@/lib/cart";
import { money, cartCurrency } from "@/lib/data";
import { OrderItems, PriceBreakdown } from "./OrderSummary";

export default function ConfirmationPage({ id }: { id?: string }) {
  const { state, ready } = useStore();
  const order = id ? state.orders.find((order) => order.id === id) : state.orders[0];

  return (
    <section className="min-h-[70vh] bg-[#f7f9fa] py-5 sm:py-7 lg:pb-16">
      <div className="container mx-auto min-w-0 px-4 sm:px-6 lg:px-8">
        <nav
          aria-label="مسار التصفح"
          className="mb-3 flex flex-wrap sm:mb-5 gap-2 text-xs text-muted"
        >
          <Link href="/">الرئيسية</Link>
          <span>/</span>
          <span>تم تأكيد طلبك</span>
        </nav>
        <h1 className="text-2xl font-extrabold leading-snug text-ink sm:text-3xl sm:leading-relaxed lg:text-4xl">
          تم تأكيد طلبك
        </h1>
        <p className="mb-5 mt-2 text-sm leading-7 sm:mb-8 sm:mt-3 md:text-base  text-[#607779]">
          شكرًا لك! تم استلام طلبك بنجاح، وسنتواصل معك لتنسيق استلام القطع.
        </p>
        {!ready ? (
          <div
            role="status"
            className="rounded-2xl border border-gray-200 bg-white p-10 text-center text-muted"
          >
            جاري تحميل الطلب…
          </div>
        ) : !order ? (
          <div className="rounded-2xl border border-gray-200 bg-white p-10 text-center">
            <h2 className="text-xl font-bold text-ink">مفيش طلب لعرضه</h2>
            <p className="mt-3 text-sm text-muted">راجع رقم الطلب أو ابدأ طلب جديد.</p>
            <Link
              href="/products"
              className="mt-5 inline-flex min-h-12 items-center rounded-xl bg-primary px-6 py-3 text-sm font-bold text-white shadow-button"
            >
              تصفح الخدمات
            </Link>
          </div>
        ) : (
          <>
            <div className="rounded-2xl border border-gray-200 bg-white px-4 py-6 text-center sm:px-5 sm:py-8">
              <span className="mx-auto grid size-14 sm:size-18 place-items-center rounded-full bg-primary/10 text-3xl text-primary">
                <FiCheckCircle />
              </span>
              <h2 className="mt-4 text-xl font-extrabold leading-8 sm:mt-5 sm:text-2xl text-ink lg:text-3xl">
                تم استلام طلبك بنجاح
              </h2>
              <p className="mt-3 wrap-anywhere text-xs leading-7 sm:mt-4 text-muted">
                رقم الطلب: <bdi>{order.id}</bdi>
                <span className="mx-2">·</span>
                {new Date(order.createdAt).toLocaleDateString("ar-EG")}
                <span className="mx-2">·</span>
                {money(order.items.reduce((count, item) => count + item.quantity, 0))} قطع
              </p>
              <div className="mt-4 flex flex-col justify-center gap-3 sm:mt-5 sm:flex-row sm:flex-wrap">
                <Link
                  href={"/tracking?order=" + order.id}
                  className="inline-flex min-h-11 items-center justify-center rounded-xl bg-primary px-5 py-2 text-sm font-bold text-white hover:bg-ink shadow-button"
                >
                  تتبع الطلب
                </Link>
                <Link
                  href="/"
                  className="inline-flex min-h-11 items-center justify-center rounded-xl border border-gray-200 px-5 py-2 text-sm font-extrabold text-[#087B82] md:text-base hover:bg-primary/5"
                >
                  العودة للرئيسية
                </Link>
              </div>
            </div>
            <div className="mt-6 grid items-start gap-4 *:min-w-0 sm:gap-6 lg:grid-cols-3">
              <div className="space-y-4 sm:space-y-5 lg:col-span-2">
                <section className="rounded-2xl border border-gray-200 bg-white p-4 sm:p-5 lg:p-6">
                  <h2 className="mb-5 text-lg font-bold text-ink">ملخص الطلب</h2>
                  <OrderItems items={order.items} />
                </section>
                <section className="rounded-2xl border border-gray-200 bg-white p-4 sm:p-5 lg:p-6">
                  <h2 className="text-lg font-bold text-ink">عنوان الاستلام والتوصيل</h2>
                  <h3 className="mt-5 text-base font-bold text-ink">
                    {order.address.label}
                  </h3>
                  <p className="mt-3 wrap-anywhere text-sm leading-7 text-muted sm:leading-8">
                    {order.address.street}، {order.address.building}
                  </p>
                  <p className="wrap-anywhere text-sm leading-7 text-muted sm:leading-8">
                    {order.address.city}
                  </p>
                  {order.phone && (
                    <div className="mt-4 border-t border-gray-200 pt-4">
                      <h3 className="text-xs text-muted">رقم الهاتف</h3>
                      <p
                        dir="ltr"
                        className="mt-2 text-right text-sm text-primary"
                      >
                        {order.phone}
                      </p>
                    </div>
                  )}
                  <div className="mt-4 border-t border-gray-200 pt-4">
                    <h3 className="text-xs text-muted">موعد الاستلام</h3>
                    <p className="mt-2 text-sm leading-7 text-ink">
                      {new Date(order.date + "T12:00:00").toLocaleDateString("ar-EG")} ·{" "}
                      {order.slot}
                    </p>
                  </div>
                </section>
                {Boolean(order.notes || order.photos?.length) && (
                  <section className="rounded-2xl border border-gray-200 bg-white p-4 sm:p-5 lg:p-6">
                    <h2 className="text-lg font-bold text-ink">تفاصيل إضافية</h2>
                    {order.notes && (
                      <p className="mt-3 whitespace-pre-wrap wrap-anywhere text-sm leading-8 text-muted">
                        {order.notes}
                      </p>
                    )}
                    {Boolean(order.photos?.length) && (
                      <p className="mt-3 text-xs leading-7 text-muted">
                        {money(order.photos!.length)} صور تم اختيارها للمعاينة المحلية. لم
                        يتم رفع ملفات فعلية في النسخة التجريبية.
                      </p>
                    )}
                  </section>
                )}
              </div>
              <aside className="rounded-2xl border border-gray-200 bg-white p-4 sm:p-5 lg:sticky lg:top-24 lg:p-6">
                <h2 className="mb-6 text-lg font-bold text-ink">تفاصيل الدفع</h2>
                <PriceBreakdown
                  currency={cartCurrency(order.items)}
                  pricing={
                    order.pricing || { ...cartSummary(order.items), total: order.total }
                  }
                />
              </aside>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
