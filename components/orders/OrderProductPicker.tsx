"use client";
import { useState, type FormEvent } from "react";
import Image from "next/image";
import { useTranslation } from "@/components/i18n/LanguageProvider";
import { useCategories, useCategoryProducts, useProduct } from "@/hooks/useCatalogApi";
import type { OrderEditorState } from "@/hooks/useOrderEditor";
import { cartAddInput } from "@/lib/api/cart";
import { addOrderItem, updateOrderItem } from "@/lib/api/order-edit";
import { ApiError } from "@/lib/api/client";
import { type CartItem, type Product, money } from "@/lib/data";
import {
  productSizeOptions,
  resolveProductSize,
  isCarpetProduct,
} from "@/lib/product-selection";
import ProductSizePicker from "@/components/catalog/ProductSizePicker";
import { Quantity } from "@/components/ui";

export default function OrderProductPicker({
  editor,
  target,
  onClose,
}: {
  editor: OrderEditorState;
  target?: CartItem;
  onClose: () => void;
}) {
  const t = useTranslation();
  const [categoryId, setCategoryId] = useState<number>();
  const [selectedId, setSelectedId] = useState<number | undefined>(
    target?.product?.apiId,
  );
  const categories = useCategories();
  const activeCategory = categoryId ?? categories.data?.[0]?.id;
  const products = useCategoryProducts(activeCategory);
  if (selectedId)
    return (
      <ProductLoader
        id={selectedId}
        target={target}
        editor={editor}
        onBack={() => (target ? onClose() : setSelectedId(undefined))}
        onSaved={onClose}
      />
    );
  return (
    <section className="space-y-5 rounded-2xl border border-gray-200 bg-white p-4 sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-bold">{t("إضافة منتج إلى الطلب")}</h2>
        <button
          type="button"
          onClick={onClose}
          className="min-h-11 text-primary"
        >
          {t("إلغاء")}
        </button>
      </div>
      {categories.status === "loading" ? (
        <p role="status">{t("جاري تحميل الخدمات…")}</p>
      ) : categories.status === "error" ? (
        <div role="alert">
          {t("تعذر تحميل الخدمات الآن. حاول مرة أخرى.")}{" "}
          <button
            type="button"
            onClick={categories.reload}
            className="min-h-11 text-primary"
          >
            {t("إعادة المحاولة")}
          </button>
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          {categories.data?.map((category) => (
            <button
              type="button"
              key={category.id}
              onClick={() => setCategoryId(category.id)}
              aria-pressed={activeCategory === category.id}
              className="min-h-11 rounded-xl border border-gray-200 px-3 py-2 aria-pressed:border-primary aria-pressed:bg-primary/10 aria-pressed:text-primary"
            >
              {category.name}
            </button>
          ))}
        </div>
      )}
      {products.status === "loading" ? (
        <p role="status">{t("جاري تحميل المنتجات")}</p>
      ) : products.status === "error" ? (
        <div role="alert">
          {t("تعذر تحميل المنتجات. حاول مرة أخرى.")}{" "}
          <button
            type="button"
            onClick={products.reload}
            className="min-h-11 text-primary"
          >
            {t("إعادة المحاولة")}
          </button>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {products.data?.map((product) => (
            <button
              type="button"
              key={product.id}
              onClick={() => setSelectedId(product.apiId)}
              className="flex min-w-0 items-center gap-3 rounded-xl border border-gray-200 p-3 text-start hover:border-primary"
            >
              <Image
                src={product.image}
                alt={product.name}
                width={72}
                height={80}
                className="h-20 w-18 rounded-lg object-cover"
              />
              <span className="min-w-0">
                <span className="block font-bold">{product.name}</span>
                <span className="mt-2 block text-primary">
                  {t(money(product.price))} {t("ر.س")}
                </span>
              </span>
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
function ProductLoader({
  id,
  target,
  editor,
  onBack,
  onSaved,
}: {
  id: number;
  target?: CartItem;
  editor: OrderEditorState;
  onBack: () => void;
  onSaved: () => void;
}) {
  const t = useTranslation();
  const request = useProduct(id);
  if (request.status === "loading")
    return <p role="status">{t("جاري تحميل المنتجات")}</p>;
  if (request.status === "error" || !request.data)
    return (
      <div role="alert">
        {t("المنتج غير متاح حاليًا. ارجع إلى قائمة المنتجات وحاول مرة أخرى.")}{" "}
        <button
          type="button"
          onClick={request.reload}
          className="min-h-11 text-primary"
        >
          {t("إعادة المحاولة")}
        </button>
        <button
          type="button"
          onClick={onBack}
          className="ms-4 min-h-11"
        >
          {t("إلغاء")}
        </button>
      </div>
    );
  return (
    <ProductSelection
      key={id}
      product={request.data}
      target={target}
      editor={editor}
      onBack={onBack}
      onSaved={onSaved}
    />
  );
}
function ProductSelection({
  product,
  target,
  editor,
  onBack,
  onSaved,
}: {
  product: Product;
  target?: CartItem;
  editor: OrderEditorState;
  onBack: () => void;
  onSaved: () => void;
}) {
  const t = useTranslation();
  const options = productSizeOptions(product);
  const initialChoice =
    target?.sizeId && options.some((option) => option.value === String(target.sizeId))
      ? String(target.sizeId)
      : target?.dimensions && isCarpetProduct(product)
        ? "custom"
        : (options[0]?.value ?? "");
  const [choice, setChoice] = useState(initialChoice),
    [length, setLength] = useState(
      target?.dimensions ? String(target.dimensions.length) : "",
    ),
    [width, setWidth] = useState(
      target?.dimensions ? String(target.dimensions.width) : "",
    );
  const [quantity, setQuantity] = useState(target?.quantity ?? 1),
    [error, setError] = useState("");
  const resolved = resolveProductSize(product, choice, length, width);
  const disabled = editor.pending || editor.needsRefresh;
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (disabled) return;
    if (!resolved) {
      setError(t("اكتب طول وعرض صحيحين من ٠٫١ إلى ٢٠ متر."));
      return;
    }
    setError("");
    const result = await editor.mutate(async (fresh, signal) => {
      if (target) {
        const itemId = target.orderItemId;
        if (
          itemId === undefined ||
          !fresh.items.some((item) => item.orderItemId === itemId)
        )
          throw new ApiError(409, {
            message: "تغيّرت منتجات الطلب. حدّث البيانات وحاول مرة أخرى.",
          });
        await updateOrderItem(
          Number(fresh.id),
          itemId,
          {
            quantity,
            ...(resolved.sizeId !== undefined
              ? { product_size_id: resolved.sizeId }
              : resolved.dimensions),
          },
          signal,
        );
      } else
        await addOrderItem(
          Number(fresh.id),
          cartAddInput(product, resolved, quantity),
          signal,
        );
    });
    if (result) onSaved();
  }
  return (
    <form
      onSubmit={submit}
      className="rounded-2xl border border-gray-200 bg-white p-4 sm:p-6"
    >
      <button
        type="button"
        disabled={disabled}
        onClick={onBack}
        className="mb-4 min-h-11 text-primary"
      >
        {t("العودة إلى المنتجات")}
      </button>
      <div className="grid gap-5 sm:grid-cols-[160px_1fr]">
        <Image
          src={product.image}
          alt={product.name}
          width={180}
          height={200}
          className="mx-auto h-44 w-40 rounded-xl object-contain"
        />
        <div>
          <h2 className="text-lg font-bold">{product.name}</h2>
          <p className="mt-2 text-sm leading-7 text-muted">{product.description}</p>
          <p className="mt-2 font-bold text-primary">
            {t(money(product.price))} {t("ر.س")}
          </p>
        </div>
      </div>
      <fieldset
        disabled={disabled}
        className="mt-5 space-y-5"
      >
        <ProductSizePicker
          product={product}
          choice={choice}
          length={length}
          width={width}
          onChoice={setChoice}
          onLength={setLength}
          onWidth={setWidth}
          disabled={disabled}
        />
        <div className="flex items-center justify-between gap-3">
          <span>{t("الكمية")}</span>
          <Quantity
            value={quantity}
            onChange={setQuantity}
            disabled={disabled}
          />
        </div>
        <button
          disabled={disabled || (!resolved && choice !== "custom")}
          className="min-h-12 w-full rounded-xl bg-primary px-4 py-3 font-bold text-white disabled:opacity-50"
        >
          {t(
            editor.pending
              ? "جاري الحفظ…"
              : target
                ? "حفظ تعديل المنتج"
                : "إضافة إلى الطلب",
          )}
        </button>
      </fieldset>
      {error && (
        <p
          role="alert"
          className="mt-3 text-red-600"
        >
          {error}
        </p>
      )}
    </form>
  );
}
