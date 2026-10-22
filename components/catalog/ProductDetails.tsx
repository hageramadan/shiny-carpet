"use client";

import { useState, type FormEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { FiCheck, FiLayers, FiShoppingBag } from "react-icons/fi";
import { useStore } from "@/components/store";
import { Quantity } from "@/components/ui";
import { ProductCard } from "@/components/products";
import { products, money, type Product, type CartItem } from "@/lib/data";
import { cartItemKey, resolveSize, type SizeChoice } from "@/lib/product-options";

export default function ProductDetails({ product }: { product: Product }) {
  const { state, update } = useStore();
  const carpet = product.category === "السجاد";
  const [choice, setChoice] = useState<SizeChoice>("small");
  const [length, setLength] = useState("");
  const [width, setWidth] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState(product.image);
  const [added, setAdded] = useState(false);
  const [error, setError] = useState("");
  const resolved = resolveSize(carpet, choice, length, width);
  const total = resolved ? product.price * resolved.size * quantity : null;
  const photos = [
    product.image,
    carpet ? "/images/living-room.jpg" : "/images/blanket1.png",
  ];
  const related = products.filter((p) => p.category !== product.category);
  const options: { value: SizeChoice; label: string }[] = carpet
    ? [
        { value: "small", label: "١ × ٢" },
        { value: "medium", label: "٢ × ٢" },
        { value: "large", label: "٢ × ٣" },
        { value: "custom", label: "غير ذلك" },
      ]
    : [
        { value: "small", label: "شخص" },
        { value: "medium", label: "شخصين" },
        { value: "custom", label: "غير ذلك" },
      ];

  function changeChoice(value: SizeChoice) {
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
    const item: CartItem = { id: product.id, quantity, ...resolved };
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
    <section className="min-h-[70vh] bg-[#f7f9fa] py-7 lg:pb-16">
      <div className="container mx-auto px-5 sm:px-6 lg:px-8">
        <nav
          aria-label="مسار التصفح"
          className="mb-6 flex flex-wrap items-center gap-2 text-xs leading-6 text-muted"
        >
          <Link
            href="/"
            className="hover:text-primary"
          >
            الرئيسية
          </Link>
          <span>/</span>
          <Link
            href="/products"
            className="hover:text-primary"
          >
            الخدمات والمنتجات
          </Link>
          <span>/</span>
          <span>{product.name}</span>
        </nav>
        <div className="grid items-start gap-9 lg:grid-cols-2 lg:gap-14">
          <div>
            <div className="relative aspect-square overflow-hidden rounded-2xl border border-gray-200 bg-white">
              <Image
                src={activeImage}
                alt={product.name}
                fill
                priority
                sizes="(max-width: 1023px) 100vw, 50vw"
                className="object-cover"
              />
            </div>
            <div
              className="mt-4 flex gap-3"
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
                    "relative size-16 overflow-hidden rounded-xl border border-gray-200 bg-white " +
                    (activeImage === photo ? "ring-2 ring-primary ring-offset-2" : "")
                  }
                >
                  <Image
                    src={photo}
                    alt=""
                    fill
                    sizes="64px"
                    className="object-cover"
                  />
                </button>
              ))}
            </div>
            <p className="mt-3 text-xs leading-6 text-muted">
              {product.name} · خدمة {carpet ? "غسيل السجاد" : "غسيل البطاطين"}
            </p>
          </div>
          <div>
            <span className="text-xs font-bold text-primary">
              {carpet ? "غسيل السجاد" : "غسيل البطاطين"}
            </span>
            <h1 className="mt-3 text-3xl font-extrabold leading-relaxed text-ink lg:text-4xl">
              {product.name}
            </h1>
            <div className="mt-4 text-2xl font-bold text-primary">
              {money(product.price)}{" "}
              <span className="text-base">
                ج.م{" "}
                
              </span>
            </div>
            <p className="mt-5 text-sm leading-8 text-muted">{product.description}</p>
            <form
              onSubmit={addToCart}
              className="mt-6 border-t border-gray-200 pt-5"
            >
              <fieldset>
                <legend className="mb-4 text-sm font-bold text-ink">
                  {carpet ? "المقاس" : "حجم البطانية"}
                </legend>
                <div className="flex flex-wrap gap-2">
                  {options.map((option) => (
                    <label
                      key={option.value}
                      className="cursor-pointer"
                    >
                      <input
                        type="radio"
                        name="size"
                        value={option.value}
                        checked={choice === option.value}
                        onChange={() => changeChoice(option.value)}
                        className="peer sr-only"
                      />
                      <span className="inline-flex min-h-11 min-w-16 items-center justify-center rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm text-ink peer-checked:bg-primary/10 peer-checked:text-primary peer-checked:ring-1 peer-checked:ring-primary peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-primary">
                        {option.label}
                      </span>
                    </label>
                  ))}
                </div>
              </fieldset>
              {choice === "custom" && (
                <fieldset className="mt-4 rounded-2xl bg-primary/10 p-4">
                  <legend className="float-right mb-3 w-full text-sm font-smeibold text-[#17202A]">
                  أدخل المقاس الخاص بك
                  </legend>
                  <div className="clear-both grid grid-cols-2 gap-3">
                    <label className="text-sm text-ink">
                      الطول
                      <input
                        type="number"
                        name="length"
                        min="0.1"
                        max="20"
                        step="0.1"
                        required
                        value={length}
                        onChange={(e) => {
                          setLength(e.target.value);
                          setAdded(false);
                        }}
                        placeholder="أدخلي الطول"
                        className="mt-2 min-h-12 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm"
                      />
                    </label>
                    <label className="text-sm text-ink">
                      العرض
                      <input
                        type="number"
                        name="width"
                        min="0.1"
                        max="20"
                        step="0.1"
                        required
                        value={width}
                        onChange={(e) => {
                          setWidth(e.target.value);
                          setAdded(false);
                        }}
                        placeholder="أدخلي العرض"
                        className="mt-2 min-h-12 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm"
                      />
                    </label>
                  </div>
                  {!carpet && (
                    <p className="mt-3 text-xs leading-6 text-muted">
                      السعر المعروض للمقاس المخصص  لحين تأكيد التسعير.
                    </p>
                  )}
                </fieldset>
              )}
              <div className="mt-5 flex items-center justify-between gap-4">
                <span className="text-sm font-bold text-ink">الكمية</span>
                <Quantity
                  value={quantity}
                  onChange={(n) => {
                    setQuantity(n);
                    setAdded(false);
                  }}
                />
              </div>
              <div className="my-5 flex items-center justify-between gap-4 text-sm text-ink">
                <span>الإجمالي</span>
                <strong className="text-xl text-primary">
                  {total === null ? "حدد المقاس" : money(total) + " ج.م"}
                </strong>
              </div>
              <button
                type="submit"
                className="flex min-h-12 w-full items-center justify-center gap-3 rounded-xl bg-primary px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-ink shadow-button"
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
                  {error}
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
              <p className="mt-4 text-xs leading-6 text-muted">
                يمكنك إضافة المنتجات إلى السلة لاستكمال الطلب. الأسعار ة.
              </p>
            </form>
          </div>
        </div>
        <section
          aria-labelledby="related-title"
          className="mt-10 border-t border-gray-200 pt-8 lg:mt-14"
        >
          <FiLayers className="text-xl text-primary" />
          <h2
            id="related-title"
            className="mt-3 text-2xl font-bold text-ink"
          >
            {carpet ? "هل عندك بطانية أيضًا؟" : "عندك سجادة محتاجة عناية؟"}
          </h2>
          <p className="mt-3 text-sm md:text-base  text-[#607779]">
            كمّل طلبك وأضف القطع اللي محتاجة غسيل.
          </p>
          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((p) => (
              <ProductCard
                key={p.id}
                product={p}
              />
            ))}
          </div>
        </section>
      </div>
    </section>
  );
}
