"use client";
import { useState, type FormEvent } from "react";
import Link from "next/link";
import { FiSearch } from "react-icons/fi";
import { useStore } from "@/components/store";
import { cartSummary } from "@/lib/cart";
import { money, cartCurrency } from "@/lib/data";
import { OrderItems, PriceBreakdown } from "./OrderSummary";
import OrderTimeline from "./OrderTimeline";
import OrderPhotos from "./OrderPhotos";

export default function TrackingPage({ initialId = "" }: { initialId?: string }) {
  const { state, ready } = useStore();
  const [input, setInput] = useState(initialId);
  const [query, setQuery] = useState(initialId);
  const [showSearch, setShowSearch] = useState(!initialId);
  const normalized = query.trim().replace(/^#/, "").toUpperCase();
  const order = state.orders.find((order) => order.id.toUpperCase() === normalized);
  const phone = process.env.NEXT_PUBLIC_CONTACT_PHONE;
  const email = process.env.NEXT_PUBLIC_CONTACT_EMAIL;

  function search(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setQuery(input);
  }

  return (
    <section className="min-h-[70vh] bg-[#f7f9fa] py-5 sm:py-7 lg:pb-16">
      <div className="container mx-auto min-w-0 px-4 sm:px-6 lg:px-8">
        <nav
          aria-label="مسار التصفح"
          className="mb-3 flex flex-wrap sm:mb-5 gap-2 text-xs text-muted"
        >
          <Link href="/">الرئيسية</Link>
          <span>/</span>
          <span>تتبع الطلب</span>
        </nav>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-2xl font-extrabold leading-snug text-ink sm:text-3xl sm:leading-relaxed lg:text-4xl">
            تتبع الطلب
          </h1>
          {order && (
            <button
              type="button"
              onClick={() => setShowSearch(!showSearch)}
              aria-expanded={showSearch}
              className="text-xs font-bold text-primary"
            >
              تتبع طلب آخر
            </button>
          )}
        </div>
        {order ? (
          <p className="mb-5 mt-2 wrap-anywhere text-xs leading-7 sm:mb-6 sm:mt-3 text-muted">
            الطلب: <bdi>{order.id}</bdi>
            <span className="mx-2">·</span>
            {new Date(order.createdAt).toLocaleDateString("ar-EG")}
            <span className="mx-2">·</span>موعد الاستلام:{" "}
            {new Date(order.date + "T12:00:00").toLocaleDateString("ar-EG")}، {order.slot}
          </p>
        ) : (
          <p className="mb-6 mt-3 text-sm md:text-base  text-[#607779]">
            اكتب رقم الطلب واطمئن على تفاصيله خطوة بخطوة.
          </p>
        )}
        {(showSearch || (ready && !order)) && (
          <form
            onSubmit={search}
            className="mb-5 flex flex-col items-stretch gap-3 rounded-2xl border border-gray-200 bg-white p-4 sm:mb-6 sm:flex-row sm:items-end sm:p-5"
          >
            <label className="min-w-0 w-full flex-1 text-sm text-ink">
              رقم الطلب
              <input
                required
                maxLength={50}
                dir="ltr"
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder="SC-12345678"
                className="mt-2 min-h-12 w-full rounded-xl border border-gray-200 px-3 text-base sm:text-sm"
              />
            </label>
            <button className="inline-flex min-h-12 w-full items-center justify-center gap-3 sm:w-auto rounded-xl bg-primary px-5 py-3 text-sm font-bold text-white hover:bg-ink shadow-button">
              <FiSearch />
              تتبع الطلب
            </button>
          </form>
        )}
        {!ready ? (
          <p
            role="status"
            className="rounded-2xl border border-gray-200 bg-white p-8 text-center text-muted"
          >
            جاري تحميل تفاصيل الطلب…
          </p>
        ) : !order ? (
          <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center">
            <h2 className="text-xl font-bold text-ink">
              {query ? "مش لاقيين الطلب ده على المتصفح" : "كل تفاصيل طلبك هنا"}
            </h2>
            <p className="mt-3 text-sm md:text-base  text-[#607779]">
              هتلاقي رقم الطلب في صفحة التأكيد أو صفحة طلباتي.
            </p>
            <Link
              href="/orders"
              className="mt-5 inline-flex min-h-11 items-center rounded-xl border border-gray-200 px-5 py-2 text-sm font-extrabold text-[#087B82] md:text-base"
            >
              عرض طلباتي
            </Link>
          </div>
        ) : (
          <>
            <OrderTimeline order={order} />
            <div className="mt-6 grid items-start gap-4 *:min-w-0 sm:gap-6 lg:grid-cols-3">
              <div className="space-y-4 sm:space-y-5 lg:col-span-2">
                <section className="rounded-2xl border border-gray-200 bg-white p-4 sm:p-5 lg:p-6">
                  <h2 className="mb-5 text-lg font-bold text-ink">
                    المنتجات ·{" "}
                    {money(order.items.reduce((sum, item) => sum + item.quantity, 0))} قطع
                  </h2>
                  <OrderItems items={order.items} />
                </section>
                <OrderPhotos photos={order.photos} />
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
                </section>
                <section className="rounded-2xl border border-gray-200 bg-white p-4 sm:p-5 lg:p-6">
                  <h2 className="text-lg font-bold text-ink">ملاحظات الطلب</h2>
                  <p className="mt-3 whitespace-pre-wrap wrap-anywhere text-sm leading-8 text-muted">
                    {order.notes || "لم تتم إضافة ملاحظات لهذا الطلب."}
                  </p>
                </section>
              </div>
              <aside className="min-w-0 space-y-4 sm:space-y-5 lg:sticky lg:top-24">
                <section className="rounded-2xl border border-gray-200 bg-white p-4 sm:p-5 lg:p-6">
                  <h2 className="mb-6 text-lg font-bold text-ink">تفاصيل الدفع</h2>
                  <PriceBreakdown
                    currency={cartCurrency(order.items)}
                    pricing={
                      order.pricing || { ...cartSummary(order.items), total: order.total }
                    }
                  />
                </section>
                <section className="rounded-2xl border border-gray-200 bg-primary/10 p-5 text-center">
                  <h2 className="text-base font-bold text-ink">هل تحتاج إلى مساعدة؟</h2>
                  <p className="mt-3 text-xs leading-7 text-muted">
                    راجع إجابات الأسئلة الشائعة أو تواصل مع الدعم عند توفر بيانات التواصل.
                  </p>
                  {(phone || email) && (
                    <p
                      dir="ltr"
                      className="mt-3 break-all text-xs leading-7 text-muted"
                    >
                      {phone}
                      {phone && email ? " · " : ""}
                      {email}
                    </p>
                  )}
                  <a
                    href={
                      phone
                        ? "tel:" + phone.replace(/[^+0-9]/g, "")
                        : email
                          ? "mailto:" + email
                          : "/#faq"
                    }
                    className="mt-4 inline-flex min-h-10 items-center justify-center rounded-xl border border-gray-200 bg-white px-4 py-2 text-xs font-bold text-primary"
                  >
                    {phone || email ? "تواصل مع الدعم" : "الأسئلة الشائعة"}
                  </a>
                </section>
              </aside>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
