"use client";
import { useState, type FormEvent } from "react";
import type { CartItem, Product } from "@/lib/data";
import type { ResolvedSize } from "@/lib/product-options";
import { itemSizeChoice, resolveProductSize } from "@/lib/product-selection";
import ProductSizePicker from "@/components/catalog/ProductSizePicker";

type Props = {
  item: CartItem;
  product: Product;
  onSave: (size: ResolvedSize) => string | null;
  onCancel: () => void;
};
export default function SizeEditor({ item, product, onSave, onCancel }: Props) {
  const [choice, setChoice] = useState(itemSizeChoice(product, item));
  const [length, setLength] = useState(String(item.dimensions?.length ?? ""));
  const [width, setWidth] = useState(String(item.dimensions?.width ?? ""));
  const [error, setError] = useState("");
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const size = resolveProductSize(product, choice, length, width);
    if (!size) {
      setError("اختر مقاسًا صحيحًا أو أدخل الطول والعرض بالمتر.");
      return;
    }
    const message = onSave(size);
    if (message) setError(message);
  }
  return (
    <form
      onSubmit={submit}
      className="mt-5 border-t border-gray-200 pt-5"
    >
      <ProductSizePicker
        product={product}
        choice={choice}
        length={length}
        width={width}
        onChoice={(value) => {
          setChoice(value);
          setError("");
        }}
        onLength={setLength}
        onWidth={setWidth}
      />
      {error && (
        <p
          role="alert"
          className="mt-3 text-sm leading-7 text-red-600"
        >
          {error}
        </p>
      )}
      <div className="mt-4 grid grid-cols-2 gap-3 sm:flex">
        <button
          type="submit"
          className="min-h-11 rounded-xl bg-primary px-5 py-2 text-sm font-bold text-white shadow-button hover:bg-ink"
        >
          حفظ المقاس
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="min-h-11 rounded-xl border border-gray-200 bg-white px-5 py-2 text-sm text-ink hover:bg-slate-50"
        >
          إلغاء
        </button>
      </div>
    </form>
  );
}
