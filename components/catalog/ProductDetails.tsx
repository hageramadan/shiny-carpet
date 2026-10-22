"use client";

import { useState, type FormEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { FiCheck, FiLayers, FiShoppingBag } from "react-icons/fi";
import { useStore } from "@/components/store";
import { Quantity } from "@/components/ui";
import { ProductCard } from "@/components/products";
import {
  money,
  cartCurrency,
  productCurrency,
  currencyLabel,
  type Product,
  type CartItem,
} from "@/lib/data";
import { cartItemKey } from "@/lib/product-options";
import { productSizeOptions, resolveProductSize } from "@/lib/product-selection";
import ProductSizePicker from "./ProductSizePicker";

export default function ProductDetails({
  product,
  related = [],
}: {
  product: Product;
  related?: Product[];
}) {
  const { state, update } = useStore();
  const [choice, setChoice] = useState(productSizeOptions(product)[0]?.value ?? "");
  const [length, setLength] = useState("");
  const [width, setWidth] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState(product.image);
  const [added, setAdded] = useState(false);
  const [error, setError] = useState("");
  const resolved = resolveProductSize(product, choice, length, width);
  const total = resolved
    ? Math.round((resolved.unitPrice ?? product.price * resolved.size) * quantity * 100) /
      100
    : null;
  const photos = [product.image];
  const currency = currencyLabel(productCurrency(product));

  function changeChoice(value: string) {
    setChoice(value);
    setAdded(false);
    setError("");
  }

  function addToCart(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!resolved) {
      setError("اكتب طول وعرض صحيحين من ٠٫١ إلى ٢٠ متر.");
      return;
    }
    if (state.cart.length && cartCurrency(state.cart) !== productCurrency(product)) {
      setError(
        "السلة تحتوي على منتجات من النسخة السابقة بعملة مختلفة. احذفها من السلة قبل إضافة المنتج الجديد.",
      );
      return;
    }
    const item: CartItem = { id: product.id, quantity, ...resolved, product };
    const currentItem = state.cart.find((i) => cartItemKey(i) === cartItemKey(item));
    if (currentItem && currentItem.quantity + quantity > 99) {
      setError("الحد الأقصى ٩٩ قطعة من نفس المقاس. راجع الكمية في السلة.");
      return;
    }
    update((state) => {
      const key = cartItemKey(item);
      const existing = state.cart.find((i) => cartItemKey(i) === key);
      return {
        ...state,
        cart: existing
          ? state.cart.map((i) =>
              cartItemKey(i) === key ? { ...i, quantity: i.quantity + quantity } : i,
            )
          : [...state.cart, item],
      };
    });
    setAdded(true);
    setError("");
  }

  return (
    <section className="min-h-[70vh] bg-[#f7f9fa] py-5 sm:py-7 lg:pb-16">
      <div className="container mx-auto min-w-0 px-4 sm:px-6 lg:px-8">
        <nav
          aria-label="مسار التصفح"
          className="mb-4 flex flex-wrap sm:mb-6 items-center gap-2 text-xs leading-6 text-muted"
        >
          <Link
            href="/"
            className="hover:text-primary"
          >
            الرئيسية
          </Link>
          <span>/</span>
          <Link
            href={
              product.categoryId
                ? `/products?category=${product.categoryId}`
                : "/products"
            }
            className="hover:text-primary"
          >
            الخدمات والمنتجات
          </Link>
          <span>/</span>
          <span>{product.name}</span>
        </nav>
        <div className="grid items-start gap-5 *:min-w-0 sm:gap-9 lg:grid-cols-2 lg:gap-14">
          <div>
            <div className="relative aspect-[4/3] overflow-hidden sm:aspect-square rounded-2xl border border-gray-200 bg-white">
              <Image
                src={activeImage}
                alt={product.name}
                fill
                priority
                sizes="(max-width: 639px) calc(100vw - 32px), (max-width: 1023px) calc(100vw - 48px), 50vw"
                className="object-cover"
              />
            </div>
            <div
              className="mt-3 flex flex-wrap gap-3 sm:mt-4"
              aria-label="صور المنتج"
            >
              {photos.map((photo, index) => (
                <button
                  key={photo}
                  type="button"
                  aria-label={"عرض الصورة " + (index + 1)}
                  aria-pressed={activeImage === photo}
                  onClick={() => setActiveImage(photo)}
                  className={
                    "relative size-12 shrink-0 overflow-hidden sm:size-16 rounded-xl border border-gray-200 bg-white " +
                    (activeImage === photo ? "ring-2 ring-primary ring-offset-2" : "")
                  }
                >
                  <Image
                    src={photo}
                    alt=""
                    fill
                    sizes="(min-width: 640px) 64px, 48px"
                    className="object-cover"
                  />
                </button>
              ))}
            </div>
            <p className="mt-3 text-xs leading-6 text-muted">
              {product.name} · {product.category}
            </p>
          </div>
          <div>
            <span className="text-xs font-bold text-primary">{product.category}</span>
            <h1 className="mt-2 text-2xl font-extrabold leading-snug text-[#17202A] sm:mt-3 sm:text-3xl sm:leading-relaxed lg:text-4xl">
              {product.name}
            </h1>
            <div className="mt-3 text-xl font-bold text-primary sm:mt-4 sm:text-2xl">
              {product.hasSizes && (
                <span className="me-2 text-sm font-normal text-muted">يبدأ من</span>
              )}
              {money(product.price)} <span className="text-base">{currency}</span>
              {product.originalPrice !== undefined && (
                <del className="ms-2 text-sm font-normal text-muted">
                  {money(product.originalPrice)} {currency}
                </del>
              )}
            </div>
            <p className="mt-3 text-sm leading-7 text-muted sm:mt-5 sm:leading-8">
              {product.description}
            </p>
            <form
              onSubmit={addToCart}
              className="mt-4 border-t border-gray-200 pt-4 sm:mt-6 sm:pt-5"
            >
              <ProductSizePicker
                product={product}
                choice={choice}
                length={length}
                width={width}
                onChoice={changeChoice}
                onLength={(value) => {
                  setLength(value);
                  setAdded(false);
                }}
                onWidth={(value) => {
                  setWidth(value);
                  setAdded(false);
                }}
              />
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 sm:mt-5 sm:gap-4">
                <span className="text-sm font-bold text-ink">الكمية</span>
                <Quantity
                  value={quantity}
                  onChange={(n) => {
                    setQuantity(n);
                    setAdded(false);
                  }}
                />
              </div>
              <div className="my-4 flex flex-wrap items-center justify-between gap-3 sm:my-5 sm:gap-4 text-sm text-ink">
                <span>الإجمالي</span>
                <strong className="text-lg text-primary sm:text-xl">
                  {total === null ? "حدد المقاس" : money(total) + " " + currency}
                </strong>
              </div>
              <button
                type="submit"
                disabled={!resolved && choice !== "custom"}
                className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary sm:gap-3 px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-ink shadow-button disabled:cursor-not-allowed"
              >
                {added ? (
                  <>
                    <FiCheck /> تمت الإضافة — أضف مرة أخرى
                  </>
                ) : (
                  <>
                    <FiShoppingBag /> أضف إلى السلة
                  </>
                )}
              </button>
              {error && (
                <p
                  role="alert"
                  className="mt-3 text-sm text-red-600"
                >
                  {error}{" "}
                  <Link
                    href="/cart"
                    className="font-bold underline"
                  >
                    عرض السلة
                  </Link>
                </p>
              )}
              {added && (
                <p
                  role="status"
                  className="mt-3 text-sm leading-7 text-primary"
                >
                  تمت إضافة القطعة بالمقاس المحدد.{" "}
                  <Link
                    href="/cart"
                    className="font-bold underline underline-offset-4"
                  >
                    عرض السلة
                  </Link>
                </p>
              )}
            
            </form>
          </div>
        </div>
        {related.length > 0 && (
          <section
            aria-labelledby="related-title"
            className="mt-7 border-t border-gray-200 pt-6 sm:mt-10 sm:pt-8 lg:mt-14"
          >
            <FiLayers className="text-lg text-primary sm:text-xl" />
            <h2
              id="related-title"
              className="mt-3 text-xl font-bold leading-8 text-[#17202A] sm:text-2xl"
            >
              منتجات من نفس الخدمة
            </h2>
            <p className="mt-3 text-sm md:text-base  text-[#607779]">
              كمّل طلبك وأضف القطع اللي محتاجة غسيل.
            </p>
            <div className="mt-4 grid gap-4 *:min-w-0 sm:mt-6 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
              {related.map((p) => (
                <ProductCard
                  key={p.id}
                  product={p}
                />
              ))}
            </div>
          </section>
        )}
      </div>
    </section>
  );
}
