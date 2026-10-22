"use client";

import Link from "next/link";
import { FiMapPin } from "react-icons/fi";
import { products, money } from "@/lib/data";
import { cartItemKey, type ResolvedSize } from "@/lib/product-options";
import { updateCartSize } from "@/lib/cart";
import { useStore } from "@/components/store";
import CartItemRow from "./CartItemRow";
import CartSummary from "./CartSummary";
import EmptyCart from "./EmptyCart";

export default function CartPage() {
  const { state, update, ready } = useStore();

  function resize(key: string, size: ResolvedSize): string | null {
    const cart = updateCartSize(state.cart, key, size);
    if (!cart)
      return "المقاس ده موجود في السلة، ودمج الكميات هيتجاوز الحد الأقصى ٩٩ قطعة.";
    update((current) => ({ ...current, cart }));
    return null;
  }

  return (
    <section className="min-h-[70vh] bg-[#f7f9fa] pb-12 pt-7 lg:pb-16">
      <div className="container mx-auto px-5 sm:px-6 lg:px-8">
        <nav
          aria-label="مسار التصفح"
          className="mb-5 text-xs leading-6 text-muted"
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
        <h1 className="text-3xl font-extrabold leading-relaxed text-ink lg:text-4xl">
          السلة
        </h1>
        <p className="my-4 text-sm leading-8 text-muted">
          {ready && state.cart.length
            ? "راجع قطعك والمقاسات والكميات قبل استكمال الطلب."
            : "أضف القطع اللي محتاجة عناية، وبعدها كمّل تفاصيل الاستلام."}
        </p>
        {!ready ? (
          <div
            role="status"
            className="rounded-2xl border border-gray-200 bg-white p-10 text-center text-muted"
          >
            جاري تحميل السلة…
          </div>
        ) : state.cart.length === 0 ? (
          <EmptyCart />
        ) : (
          <div className="grid items-start gap-7 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <div className="mb-5 flex items-center justify-between gap-4">
                <h2 className="text-xl font-bold text-ink">القطع المضافة</h2>
                <span className="text-sm text-[#6B7280] font-semibold">
                  {money(state.cart.length)} منتجات
                </span>
              </div>
              <div className="space-y-4">
                {state.cart.map((item) => {
                  const product = products.find((product) => product.id === item.id);
                  if (!product) return null;
                  const key = cartItemKey(item);
                  return (
                    <CartItemRow
                      key={key}
                      item={item}
                      product={product}
                      onQuantity={(quantity) =>
                        update((current) => ({
                          ...current,
                          cart: current.cart.map((row) =>
                            cartItemKey(row) === key ? { ...row, quantity } : row,
                          ),
                        }))
                      }
                      onRemove={() =>
                        update((current) => ({
                          ...current,
                          cart: current.cart.filter((row) => cartItemKey(row) !== key),
                        }))
                      }
                      onResize={(size) => resize(key, size)}
                    />
                  );
                })}
              </div>
              <Link
                href="/products"
                className="mt-4 inline-flex min-h-12 items-center justify-center rounded-xl border border-gray-200 bg-white px-7 py-3 text-sm font-extrabold text-[#087B82] md:text-base transition-colors hover:bg-primary/5"
              >
                إضافة منتج
              </Link>
              <div className="mt-6 flex items-center gap-4 rounded-2xl bg-[#E6F6F7] px-5 py-4">
                <FiMapPin className="shrink-0 text-xl text-primary" />
                <p className="text-sm leading-7 text-[#17202A] font-semibold">
                  في الخطوة التالية، أضف صور القطع وملاحظاتك إن رغبت وعنوان الاستلام.
                </p>
              </div>
            </div>
            <CartSummary items={state.cart} />
          </div>
        )}
      </div>
    </section>
  );
}
