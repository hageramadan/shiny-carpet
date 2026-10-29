"use client";
import { useEffect, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createOrder, isOrderImageUploadError, type CouponQuote } from "@/lib/api/orders";
import { ApiError, ApiResponseError } from "@/lib/api/client";
import { authErrorMessage } from "@/lib/auth/contracts";
import { readAuthSession } from "@/lib/auth/session";
import { useStore } from "@/components/store";
import EmptyCart from "@/components/cart/EmptyCart";
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
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [couponBusy, setCouponBusy] = useState(false);
  const lock = useRef(false);
  const [coupon, setCoupon] = useState<{ cart: typeof cart; quote: CouponQuote } | null>(
    null,
  );
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
  const [uploadRejected, setUploadRejected] = useState(false);
  const address =
    addressState.addresses.find((item) => item.id === selectedId) ||
    defaultAddress(addressState.addresses);
  const quote = coupon?.cart === cart ? coupon?.quote : null;
  const pricing = {
    subtotal: quote?.subtotal ?? cart?.subtotal ?? 0,
    tax: quote?.vat ?? cart?.vat ?? 0,
    total: quote?.total ?? cart?.total ?? 0,
    delivery: 0,
    discount: quote?.discount ?? 0,
  };
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (lock.current || couponBusy || preparingPhotos || addressState.busy) return;
    if (!address || addressState.status !== "ready") {
      setError("اختر عنوان استلام محفوظًا أولًا.");
      return;
    }
    if (!cart?.items.length || status !== "ready") return;
    const submitter = (event.nativeEvent as SubmitEvent).submitter;
    const withoutImages =
      uploadRejected &&
      submitter instanceof HTMLButtonElement &&
      submitter.value === "without-images";
    const form = new FormData(event.currentTarget);
    const token = readAuthSession()?.token;
    lock.current = true;
    setBusy(true);
    setError("");
    try {
      const order = await createOrder({
        addressId: Number(address.id),
        phone: state.profile?.phone ?? "",
        note: String(form.get("notes") ?? ""),
        coupon: quote?.code,
        images: withoutImages
          ? []
          : photos.flatMap((photo) => (photo.file ? [photo.file] : [])),
      });
      if (token !== readAuthSession()?.token) return;
      router.replace("/order-confirmation?order=" + encodeURIComponent(order.id));
      void reload();
    } catch (error) {
      const rejected =
        !withoutImages && photos.length > 0 && isOrderImageUploadError(error);
      setUploadRejected(rejected);
      setError(
        rejected
          ? "تعذر رفع صور الطلب. يمكنك حذف الصور أو اختيار صور أصغر، أو إتمام الطلب بدون صور."
          : error instanceof ApiResponseError
            ? "تعذر قراءة تأكيد الطلب. راجع طلباتي قبل إعادة الإرسال لتجنب تكرار الطلب."
            : error instanceof ApiError && error.status >= 500
              ? "حدث خطأ في خادم الطلبات. راجع طلباتي للتحقق من إنشاء الطلب قبل المحاولة مرة أخرى."
              : authErrorMessage(error),
      );
      lock.current = false;
      setBusy(false);
    }
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
            <fieldset
              disabled={busy}
              className="min-w-0 space-y-4 sm:space-y-5 lg:col-span-2"
            >
              <AddressCard
                addresses={addressState.addresses}
                selected={address}
                phone={state.profile?.phone}
                onSelect={setSelectedId}
                loading={
                  !addressState.loaded &&
                  (addressState.status === "loading" || addressState.status === "idle")
                }
                error={addressState.status === "error" ? addressState.error : ""}
                onRetry={() => void addressState.reload()}
              />
              <PromoCode
                key={cart ? JSON.stringify(cart) : "empty"}
                onApplied={(quote) => setCoupon({ cart, quote })}
                onBusyChange={setCouponBusy}
              />
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
                className={
                  error ? "rounded-2xl border border-gray-200 bg-white p-4" : "contents"
                }
              >
                {error && (
                  <p
                    role="alert"
                    className="mt-4 text-sm leading-7 text-red-600"
                  >
                    {error}
                  </p>
                )}
                {uploadRejected && (
                  <button
                    type="submit"
                    name="image-mode"
                    value="without-images"
                    disabled={busy || couponBusy || preparingPhotos || addressState.busy}
                    className="mt-3 min-h-11 rounded-xl bg-primary px-5 py-2 text-sm font-bold text-white disabled:opacity-50"
                  >
                    إتمام الطلب بدون صور
                  </button>
                )}
              </form>
            </fieldset>
            <CheckoutSummary
              items={cart.items}
              pricing={pricing}
              busy={busy || couponBusy}
              unavailable={
                !address || addressState.status !== "ready" || addressState.busy
              }
              preparingPhotos={preparingPhotos}
            />
          </div>
        )}
      </div>
    </section>
  );
}
