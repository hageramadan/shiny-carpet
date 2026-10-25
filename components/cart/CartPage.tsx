"use client";

import Link from "next/link";
import { FiMapPin } from "react-icons/fi";
import { useCart } from "./CartProvider";
import { useAuthAction } from "@/hooks/useAuthAction";
import { cartProduct, money } from "@/lib/data";
import { useStore } from "@/components/store";
import CartItemRow from "./CartItemRow";
import CartSummary from "./CartSummary";
import EmptyCart from "./EmptyCart";

export default function CartPage() {
  const { state, ready } = useStore();
  const { cart, status, busy, error, reload, setQuantity, remove, clear } = useCart();
  const action = useAuthAction();
  const disabled = busy || action.pending || status !== "ready";

  return (
    <section className="min-h-[70vh] bg-[#f7f9fa] pb-8 pt-5 sm:pb-12 sm:pt-7 lg:pb-16">
      <div className="container mx-auto min-w-0 px-4 sm:px-6 lg:px-8">
        <nav
          aria-label="مسار التصفح"
          className="mb-3 text-xs leading-6 sm:mb-5 text-muted"
        >
          <Link
            href="/"
            className="hover:text-primary"
          >
            الرئيسية
          </Link>
          <span className="mx-2">/</span>
          <span>السلة</span>
        </nav>
        <h1 className="text-2xl font-extrabold leading-snug text-ink sm:text-3xl sm:leading-relaxed lg:text-4xl">
          السلة
        </h1>
        <p className="my-3 text-sm leading-7 sm:my-4 sm:leading-8 text-muted">
          {ready && cart?.items.length
            ? "راجع قطعك والمقاسات والكميات قبل استكمال الطلب."
            : "أضف القطع اللي محتاجة عناية، وبعدها كمّل تفاصيل الاستلام."}
        </p>
        {(error || action.error) && status !== "error" && (
          <p
            role="alert"
            className="mb-4 text-sm text-red-700"
          >
            {error || action.error}
          </p>
        )}
        {!ready ? (
          <div
            role="status"
            className="rounded-2xl border border-gray-200 bg-white p-10 text-center text-muted"
          >
            جاري تحميل السلة…
          </div>
        ) : !state.profile ? (
          <div className="rounded-2xl border border-gray-200 bg-white p-10 text-center">
            <p className="text-ink">سجّل الدخول لعرض سلتك وإضافة المنتجات.</p>
            <Link
              href="/login?next=%2Fcart"
              className="mt-4 inline-flex min-h-11 items-center rounded-xl bg-primary px-6 font-bold text-white"
            >
              تسجيل الدخول
            </Link>
          </div>
        ) : status === "error" ? (
          <div className="rounded-2xl border border-gray-200 bg-white p-10 text-center">
            <p
              role="alert"
              className="text-red-700"
            >
              {error}
            </p>
            <button
              type="button"
              onClick={() => void reload()}
              className="mt-4 min-h-11 font-bold text-primary"
            >
              إعادة المحاولة
            </button>
          </div>
        ) : !cart || status === "loading" ? (
          <p
            role="status"
            className="rounded-2xl border border-gray-200 bg-white p-10 text-center text-muted"
          >
            جاري تحميل السلة…
          </p>
        ) : cart.items.length === 0 ? (
          <EmptyCart />
        ) : (
          <div className="grid items-start gap-5 *:min-w-0 sm:gap-7 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-2 sm:mb-5 sm:gap-4">
                <h2 className="text-lg font-bold text-ink sm:text-xl">القطع المضافة</h2>
                <span className="text-sm text-[#6B7280] font-semibold">
                  {money(cart.count)} منتجات
                </span>
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() =>
                    void action.run("clear", async () => {
                      await clear();
                    })
                  }
                  className="min-h-11 text-sm font-bold text-red-600 disabled:opacity-50"
                >
                  إفراغ السلة
                </button>
              </div>
              <div className="space-y-4">
                {cart.items.map((item) => {
                  const product = cartProduct(item);
                  if (!product) return null;
                  return (
                    <CartItemRow
                      key={item.cartItemId}
                      item={item}
                      product={product}
                      disabled={disabled}
                      onQuantity={(quantity) =>
                        void action.run("quantity", async () => {
                          await setQuantity(item.cartItemId!, quantity);
                        })
                      }
                      onRemove={() =>
                        void action.run("remove", async () => {
                          await remove(item.cartItemId!);
                        })
                      }
                    />
                  );
                })}
              </div>
              <Link
                href="/products"
                className="mt-4 inline-flex min-h-12 w-full sm:w-auto items-center justify-center rounded-xl border border-gray-200 bg-white px-7 py-3 text-sm font-extrabold text-[#087B82] md:text-base transition-colors hover:bg-primary/5"
              >
                إضافة منتج
              </Link>
              <div className="mt-4 flex items-start gap-3 rounded-2xl bg-[#E6F6F7] p-4 sm:mt-6 sm:items-center sm:gap-4 sm:px-5">
                <FiMapPin className="shrink-0 text-xl text-primary" />
                <p className="text-sm leading-7 text-[#17202A] font-semibold">
                  في الخطوة التالية، أضف صور القطع وملاحظاتك إن رغبت وعنوان الاستلام.
                </p>
              </div>
            </div>
            <CartSummary
              cart={cart}
              disabled={disabled}
            />
          </div>
        )}
      </div>
    </section>
  );
}
