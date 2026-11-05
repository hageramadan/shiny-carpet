"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { FiMinus, FiPlus } from "react-icons/fi";
import { useStore } from "@/components/store";
import {
  money,
  productCurrency,
  currencyLabel,
  type Product,
  productHref,
} from "@/lib/data";
import { cartAddInput } from "@/lib/api/cart";
import { useCart } from "@/components/cart/CartProvider";
import { useAuthAction } from "@/hooks/useAuthAction";
import {
  isCarpetProduct,
  productSizeOptions,
  resolveProductSize,
} from "@/lib/product-selection";
import ProductSizePicker from "./ProductSizePicker";
import { useCustomProductPrice } from "@/hooks/useCustomProductPrice";

export default function ProductDetails({ product }: { product: Product }) {
  const { state } = useStore();
  const router = useRouter();
  const cart = useCart();
  const [choice, setChoice] = useState(productSizeOptions(product)[0]?.value ?? "");
  const [length, setLength] = useState("");
  const [width, setWidth] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const { error, setError, run, pending: adding } = useAuthAction();
  const [customTotal, setCustomTotal] = useState<number | null>(null);
  const { calculate, pending: calculating } = useCustomProductPrice(product.apiId);
  const pending = adding || calculating || cart.busy;
  const isApiCustom = product.apiId !== undefined && choice === "custom";
  const resolved = resolveProductSize(product, choice, length, width);
  const total = isApiCustom
    ? customTotal
    : resolved
      ? Math.round(
          (resolved.unitPrice ?? product.price * resolved.size) * quantity * 100,
        ) / 100
      : null;
  const isCarpet = isCarpetProduct(product);
  const alreadyInCart =
    !isCarpet &&
    Boolean(
      cart.cart?.items.some(
        (item) => item.id === product.id && item.sizeId === resolved?.sizeId,
      ),
    );
  const addedToCart = added || alreadyInCart;
  const hideAddControls = !isCarpet && addedToCart;
  const currency = currencyLabel(productCurrency(product));

  function changeChoice(value: string) {
    setChoice(value);
    setAdded(false);
    setError("");
    setCustomTotal(null);
  }

  async function addToCart(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending || hideAddControls) return;
    if (!state.profile) {
      router.push(`/login?next=${encodeURIComponent(productHref(product))}`);
      return;
    }
    setError("");
    setAdded(false);
    if (!resolved) {
      setError("اكتب طول وعرض صحيحين من ٠٫١ إلى ٢٠ متر.");
      return;
    }
    await run("add", async (signal) => {
      if (isApiCustom && resolved.dimensions) {
        const price = await calculate({
          width: resolved.dimensions.width,
          length: resolved.dimensions.length,
          quantity,
        });
        signal.throwIfAborted();
        setCustomTotal(price);
      }
      await cart.add(cartAddInput(product, resolved, quantity));
      signal.throwIfAborted();
      setAdded(true);
      setError("");
    });
  }

  return (
    <section className="mx-auto min-h-[calc(100dvh-4rem)] max-w-7xl bg-white md:min-h-[calc(100dvh-5rem)] lg:grid lg:grid-cols-2 lg:items-start lg:gap-12 lg:px-8 lg:py-10">
      <div className="relative flex h-72 items-center justify-center bg-[#f8f8f8] sm:h-96 lg:sticky lg:top-28 lg:aspect-square lg:h-auto lg:overflow-hidden lg:rounded-2xl">
        <div className="relative size-44 sm:size-60 lg:absolute lg:inset-0 lg:size-full">
          <Image
            src={product.image}
            alt={product.name}
            fill
            preload
            sizes="(min-width: 1280px) 584px, (min-width: 1024px) calc((100vw - 112px) / 2), (min-width: 640px) 240px, 176px"
            className="object-contain lg:object-cover"
          />
        </div>
        <span
          aria-hidden="true"
          className="absolute bottom-7 h-1 w-4 rounded-full bg-primary lg:hidden"
        />
      </div>
      <form
        onSubmit={addToCart}
        className="mx-auto min-w-0 max-w-3xl px-4 pb-7 pt-5 sm:px-6 sm:pt-7 lg:mx-0 lg:max-w-none lg:p-0"
      >
        <h1 className="text-lg font-bold leading-8 text-[#171717] sm:text-2xl">
          {product.name}
        </h1>
        <div className="mt-2 flex min-h-11 items-center justify-between gap-4">
          <div className="text-xl text-primary sm:text-2xl">
            {money(product.price)} <span className="text-sm">{currency}</span>
          </div>
          {!hideAddControls && (
            <div
              role="group"
              aria-label="الكمية"
              dir="ltr"
              className="flex shrink-0 items-center gap-3"
            >
              <button
                type="button"
                aria-label="تقليل الكمية"
                disabled={pending || quantity <= 1}
                onClick={() => {
                  setQuantity(quantity - 1);
                  setAdded(false);
                  setCustomTotal(null);
                  setError("");
                }}
                className="grid size-11 place-items-center rounded-full bg-primary text-lg text-white disabled:opacity-50"
              >
                <FiMinus />
              </button>
              <span className="min-w-4 text-center text-xl text-[#171717]">
                {quantity}
              </span>
              <button
                type="button"
                aria-label="زيادة الكمية"
                disabled={pending || quantity >= 99}
                onClick={() => {
                  setQuantity(quantity + 1);
                  setAdded(false);
                  setCustomTotal(null);
                  setError("");
                }}
                className="grid size-11 place-items-center rounded-full bg-primary text-lg text-white disabled:opacity-50"
              >
                <FiPlus />
              </button>
            </div>
          )}
        </div>
        {product.description && (
          <p className="mt-5 whitespace-pre-line text-sm leading-7 text-[#242424] sm:text-base sm:leading-8">
            {product.description}
          </p>
        )}
        <div className="mt-6 sm:mt-8">
          <ProductSizePicker
            disabled={pending}
            product={product}
            choice={choice}
            length={length}
            width={width}
            onChoice={changeChoice}
            onLength={(value) => {
              setLength(value);
              setAdded(false);
              setCustomTotal(null);
              setError("");
            }}
            onWidth={(value) => {
              setWidth(value);
              setAdded(false);
              setCustomTotal(null);
              setError("");
            }}
          />
        </div>
        <div className="mt-5 border-t border-gray-100 pt-4 sm:mt-6 sm:pt-5">
          {!hideAddControls && (
            <button
              type="submit"
              disabled={pending || (!resolved && choice !== "custom")}
              aria-busy={pending}
              aria-label={
                pending
                  ? "جاري الإضافة…"
                  : added
                    ? "تمت الإضافة — أضف منتج آخر"
                    : isApiCustom
                      ? "احسب السعر وأضف إلى السلة"
                      : "أضف إلى السلة"
              }
              className="flex min-h-14 w-full flex-wrap items-center justify-between gap-x-4 gap-y-1 rounded-2xl bg-primary px-4 py-3 text-base font-bold text-white transition-colors hover:bg-ink disabled:cursor-not-allowed sm:min-h-16 sm:px-5 sm:text-lg"
            >
              <span>
                {pending ? "جاري الإضافة…" : added ? "أضف منتج آخر" : "أضف إلى السلة"}
              </span>
              {total !== null && (
                <span>
                  {money(total)} {currency}
                </span>
              )}
            </button>
          )}
          {error && (
            <p
              role="alert"
              className="mt-3 text-sm text-red-600"
            >
              {error}{" "}
              <Link
                href="/cart"
                className="underline"
              >
                عرض السلة
              </Link>
            </p>
          )}
          {state.profile && cart.status === "error" && (
            <p
              role="alert"
              className="mt-3 text-sm text-red-600"
            >
              {cart.error}{" "}
              <Link
                href="/cart"
                className="underline"
              >
                عرض السلة
              </Link>
            </p>
          )}
          {addedToCart && (
            <p
              role="status"
              className={isCarpet ? "sr-only" : "text-sm text-primary"}
            >
              <span className="sr-only">
                {isCarpet
                  ? "تمت إضافة القطعة بالمقاس المحدد."
                  : "تمت إضافة المنتج. يمكنك زيادة العدد أو تقليله من السلة."}{" "}
              </span>
              <Link
                href="/cart"
                className="font-bold underline underline-offset-4"
              >
                عرض السلة
              </Link>
            </p>
          )}
        </div>
      </form>
    </section>
  );
}
