"use client";
import { useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FiClock } from "react-icons/fi";
import { useStore } from "@/components/store";
import EmptyCart from "@/components/cart/EmptyCart";
import { checkoutPricing, earliestPickupDate } from "@/lib/checkout";
import type { Address, Order, OrderPhoto } from "@/lib/data";
import AddressCard from "./AddressCard";
import { defaultAddress, saveAddress as upsertAddress } from "@/lib/addresses";
import PromoCode from "./PromoCode";
import PhotoUpload from "./PhotoUpload";
import CheckoutSummary from "./CheckoutSummary";

export default function CheckoutPage() {
  const { state, update, ready } = useStore();
  const router = useRouter();
  const [selectedId, setSelectedId] = useState("");
  const [coupon, setCoupon] = useState("");
  const [photos, setPhotos] = useState<OrderPhoto[]>([]);
  const [preparingPhotos, setPreparingPhotos] = useState(false);
  const [error, setError] = useState("");
  const [orderId, setOrderId] = useState("");
  const submitting = useRef(false);
  const address =
    state.addresses.find((item) => item.id === selectedId) ||
    defaultAddress(state.addresses);
  const pricing = checkoutPricing(state.cart, coupon);
  const minDate = earliestPickupDate();

  function saveAddress(value: Address) {
    update((current) => ({
      ...current,
      addresses: upsertAddress(current.addresses, value),
    }));
    setSelectedId(value.id);
    setError("");
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting.current) return;
    if (preparingPhotos) {
      setError("انتظر لحظات لحد ما تجهز معاينة الصور.");
      return;
    }
    if (!address) {
      setError("أضف عنوان الاستلام واحفظه الأول.");
      return;
    }
    if (!state.cart.length) {
      setError("السلة فارغة. أضف القطع الأول.");
      return;
    }
    const form = new FormData(event.currentTarget);
    const date = String(form.get("date") || "");
    if (date < minDate) {
      setError("اختر موعد استلام من بكرة أو بعده.");
      return;
    }
    const id = "SC-" + crypto.randomUUID().slice(0, 8).toUpperCase();
    const order: Order = {
      id,
      items: state.cart.map((item) => ({ ...item })),
      total: pricing.total,
      pricing,
      status: "received",
      coupon: coupon || undefined,
      address: { ...address },
      phone: String(form.get("phone") || "").trim(),
      date,
      slot: String(form.get("slot") || ""),
      notes: String(form.get("notes") || "").trim(),
      photos,
      createdAt: new Date().toISOString(),
    };
    submitting.current = true;
    setOrderId(id);
    update((current) => ({ ...current, orders: [order, ...current.orders], cart: [] }));
    router.push("/order-confirmation?order=" + id);
  }

  return (
    <section className="min-h-[70vh] bg-[#f7f9fa] py-7 lg:pb-16">
      <div className="container mx-auto px-5 sm:px-6 lg:px-8">
        <nav
          aria-label="مسار التصفح"
          className="mb-5 flex flex-wrap gap-2 text-xs text-muted"
        >
          <Link href="/">الرئيسية</Link>
          <span>/</span>
          <Link href="/cart">السلة</Link>
          <span>/</span>
          <span>استكمال الطلب</span>
        </nav>
        <h1 className="text-3xl font-extrabold leading-relaxed text-ink lg:text-4xl">
          استكمال الطلب
        </h1>
        <p className="mb-8 mt-3 text-sm md:text-base  text-[#607779]">
          أكد عنوان الاستلام وأضف التفاصيل اللي تهمك.
        </p>
        {!ready ? (
          <div
            role="status"
            className="rounded-2xl border border-gray-200 bg-white p-10 text-center text-muted"
          >
            جاري تحميل تفاصيل الطلب…
          </div>
        ) : orderId ? (
          <div
            role="status"
            className="rounded-2xl border border-gray-200 bg-white p-10 text-center"
          >
            <p className="text-ink">تم حفظ طلبك ال، جاري فتح التأكيد…</p>
            <Link
              href={"/order-confirmation?order=" + orderId}
              className="mt-4 inline-block text-primary underline"
            >
              عرض تأكيد الطلب
            </Link>
          </div>
        ) : !state.cart.length ? (
          <EmptyCart />
        ) : (
          <div className="grid items-start gap-6 lg:grid-cols-3">
            <div className="space-y-5 lg:col-span-2">
              <AddressCard
                addresses={state.addresses}
                selected={address}
                phone={state.profile?.phone}
                onSelect={setSelectedId}
                onSave={saveAddress}
              />
              <PromoCode
                applied={coupon}
                onApply={setCoupon}
              />
              <PhotoUpload
                onChange={setPhotos}
                onBusyChange={setPreparingPhotos}
              />
              <section className="rounded-2xl border border-gray-200 bg-white p-5 lg:p-6">
                <label className="block text-sm font-bold text-ink">
                  ملاحظات{" "}
                  <span className="text-xs font-normal text-muted">(اختياري)</span>
                  <textarea
                    name="notes"
                    form="checkout-form"
                    maxLength={500}
                    placeholder="هل لديكي أي ملاحظات عن القطع أو الاستلام؟"
                    className="mt-3 min-h-28 w-full resize-y rounded-xl border border-gray-200 p-3 text-sm font-normal"
                  />
                </label>
              </section>
              <form
                id="checkout-form"
                onSubmit={submit}
                className="rounded-2xl border border-gray-200 bg-white p-5 lg:p-6"
              >
                <h2 className="flex items-center gap-2 text-base font-bold text-ink">
                  <FiClock className="text-primary" />
                  موعد الاستلام
                </h2>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <label className="text-sm text-ink">
                    اليوم
                    <input
                      name="date"
                      type="date"
                      required
                      min={minDate}
                      className="mt-2 min-h-12 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm"
                    />
                  </label>
                  <label className="text-sm text-ink">
                    الفترة
                    <select
                      name="slot"
                      className="mt-2 min-h-12 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm"
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
              items={state.cart}
              pricing={pricing}
              busy={Boolean(orderId)}
              preparingPhotos={preparingPhotos}
            />
          </div>
        )}
      </div>
    </section>
  );
}
