"use client";
import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { FiClock } from "react-icons/fi";
import { useStore } from "@/components/store";
import EmptyCart from "@/components/cart/EmptyCart";
import { earliestPickupDate } from "@/lib/checkout";
import type { OrderPhoto } from "@/lib/data";
import { useCart } from "@/components/cart/CartProvider";
import AddressCard from "./AddressCard";
import { defaultAddress } from "@/lib/addresses";
import { useAddresses } from "@/components/addresses/AddressesProvider";
import PromoCode from "./PromoCode";
import PhotoUpload from "./PhotoUpload";
import CheckoutSummary from "./CheckoutSummary";

export default function CheckoutPage() {
  const { state, ready } = useStore();
  const addressState = useAddresses();
  const { cart, status, reload, error: cartError } = useCart();
  const [selectedId, setSelectedId] = useState("");
  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get("address");
    if (id && /^[1-9]\d*$/.test(id)) setSelectedId(id);
  }, []);
  const [photos, setPhotos] = useState<OrderPhoto[]>([]);
  const [preparingPhotos, setPreparingPhotos] = useState(false);
  const [error, setError] = useState("");
  const address =
    addressState.addresses.find((item) => item.id === selectedId) ||
    defaultAddress(addressState.addresses);
  const pricing = {
    subtotal: cart?.subtotal ?? 0,
    tax: cart?.vat ?? 0,
    total: cart?.total ?? 0,
    delivery: 0,
    discount: 0,
  };
  const minDate = earliestPickupDate();

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("إتمام الطلب غير متاح حاليًا. سلتك محفوظة في حسابك.");
  }

  return (
    <section className="min-h-[70vh] bg-[#f7f9fa] py-5 sm:py-7 lg:pb-16">
      <div className="container mx-auto min-w-0 px-4 sm:px-6 lg:px-8">
        <nav
          aria-label="مسار التصفح"
          className="mb-3 flex sm:mb-5 flex-wrap gap-2 text-xs text-muted"
        >
          <Link href="/">الرئيسية</Link>
          <span>/</span>
          <Link href="/cart">السلة</Link>
          <span>/</span>
          <span>استكمال الطلب</span>
        </nav>
        <h1 className="text-2xl font-extrabold leading-snug text-ink sm:text-3xl sm:leading-relaxed lg:text-4xl">
          استكمال الطلب
        </h1>
        <p className="mb-5 mt-2 text-sm leading-7 sm:mb-8 sm:mt-3 md:text-base  text-[#607779]">
          أكد عنوان الاستلام وأضف التفاصيل اللي تهمك.
        </p>
        {!ready ? (
          <div
            role="status"
            className="rounded-2xl border border-gray-200 bg-white p-10 text-center text-muted"
          >
            جاري تحميل تفاصيل الطلب…
          </div>
        ) : !state.profile ? (
          <Link
            href="/login?next=%2Fcheckout"
            className="inline-flex min-h-11 items-center rounded-xl bg-primary px-6 text-white"
          >
            سجّل الدخول لاستكمال الطلب
          </Link>
        ) : status === "error" ? (
          <div>
            <p role="alert">{cartError}</p>
            <button
              onClick={() => void reload()}
              className="min-h-11 text-primary"
            >
              إعادة المحاولة
            </button>
          </div>
        ) : !cart || status === "loading" ? (
          <p role="status">جاري تحميل تفاصيل الطلب…</p>
        ) : !cart.items.length ? (
          <EmptyCart />
        ) : (
          <div className="grid items-start gap-4 *:min-w-0 sm:gap-6 lg:grid-cols-3">
            <div className="space-y-4 sm:space-y-5 lg:col-span-2">
              <AddressCard
                addresses={addressState.addresses}
                selected={address}
                phone={state.profile?.phone}
                onSelect={setSelectedId}
                loading={
                  addressState.status === "loading" || addressState.status === "idle"
                }
                error={addressState.error}
                onRetry={() => void addressState.reload()}
              />
              <PromoCode />
              <PhotoUpload
                onChange={setPhotos}
                onBusyChange={setPreparingPhotos}
              />
              <section className="rounded-2xl border border-gray-200 bg-white p-4 sm:p-5 lg:p-6">
                <label className="block text-sm font-bold text-ink">
                  ملاحظات{" "}
                  <span className="text-xs font-normal text-muted">(اختياري)</span>
                  <textarea
                    name="notes"
                    form="checkout-form"
                    maxLength={500}
                    placeholder="هل لديك أي ملاحظات عن القطع أو الاستلام؟"
                    className="mt-3 min-h-28 w-full resize-y rounded-xl border border-gray-200 p-3 text-base font-normal sm:text-sm"
                  />
                </label>
              </section>
              <form
                id="checkout-form"
                onSubmit={submit}
                className="rounded-2xl border border-gray-200 bg-white p-4 sm:p-5 lg:p-6"
              >
                <h2 className="flex items-center gap-2 text-base font-bold text-ink">
                  <FiClock className="text-primary" />
                  موعد الاستلام
                </h2>
                <div className="mt-4 grid gap-4 *:min-w-0 sm:grid-cols-2">
                  <label className="text-sm text-ink">
                    اليوم
                    <input
                      name="date"
                      type="date"
                      required
                      min={minDate}
                      className="mt-2 min-h-12 min-w-0 max-w-full w-full rounded-xl border border-gray-200 bg-white px-3 text-base sm:text-sm"
                    />
                  </label>
                  <label className="text-sm text-ink">
                    الفترة
                    <select
                      name="slot"
                      className="mt-2 min-h-12 min-w-0 max-w-full w-full rounded-xl border border-gray-200 bg-white px-3 text-base sm:text-sm"
                    >
                      <option>صباحًا — من ٩ لـ ١٢</option>
                      <option>ظهرًا — من ١٢ لـ ٤</option>
                      <option>مساءً — من ٤ لـ ٨</option>
                    </select>
                  </label>
                </div>

                {error && (
                  <p
                    role="alert"
                    className="mt-4 text-sm leading-7 text-red-600"
                  >
                    {error}
                  </p>
                )}
              </form>
            </div>
            <CheckoutSummary
              items={cart.items}
              pricing={pricing}
              busy={false}
              unavailable
              preparingPhotos={preparingPhotos}
            />
          </div>
        )}
      </div>
    </section>
  );
}
