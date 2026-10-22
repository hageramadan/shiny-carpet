"use client";

import { useState, type FormEvent } from "react";
import type { CartItem, Product } from "@/lib/data";
import {
  cartItemKey,
  resolveSize,
  type ResolvedSize,
  type SizeChoice,
} from "@/lib/product-options";

type Props = {
  item: CartItem;
  product: Product;
  onSave: (size: ResolvedSize) => string | null;
  onCancel: () => void;
};

export default function SizeEditor({ item, product, onSave, onCancel }: Props) {
  const carpet = product.category === "السجاد";
  const presets: SizeChoice[] = ["small", "medium", "large"];
  const matching = presets.find((value) => {
    const size = resolveSize(carpet, value);
    return (
      size &&
      (cartItemKey({ id: item.id, quantity: item.quantity, ...size }) ===
        cartItemKey(item) ||
        (!item.dimensions && item.size === size.size))
    );
  });
  const [choice, setChoice] = useState<SizeChoice>(matching || "custom");
  const [length, setLength] = useState(
    String(item.dimensions?.length ?? (carpet ? item.size : "")),
  );
  const [width, setWidth] = useState(String(item.dimensions?.width ?? (carpet ? 1 : "")));
  const [error, setError] = useState("");

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const size = resolveSize(carpet, choice, length, width);
    if (!size) {
      setError("أدخل طول وعرض صحيحين من ٠٫١ إلى ٢٠ متر.");
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
      <label className="block text-sm font-bold text-ink">
        المقاس
        <select
          value={choice}
          onChange={(event) => {
            setChoice(event.target.value as SizeChoice);
            setError("");
          }}
          className="mt-2 min-h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-base font-normal sm:text-sm"
        >
          {carpet ? (
            <>
              <option value="small">١ × ٢ متر</option>
              <option value="medium">٢ × ٢ متر</option>
              <option value="large">٢ × ٣ متر</option>
            </>
          ) : (
            <>
              <option value="small">شخص</option>
              <option value="medium">شخصين</option>
              <option value="large">كبير</option>
            </>
          )}
          <option value="custom">غير ذلك</option>
        </select>
      </label>
      {choice === "custom" && (
        <div className="mt-4 grid grid-cols-2 gap-3 rounded-xl bg-primary/10 p-3 *:min-w-0 sm:p-4">
          <label className="text-sm text-ink">
            الطول بالمتر
            <input
              type="number"
              min="0.1"
              max="20"
              step="0.1"
              required
              value={length}
              onChange={(event) => setLength(event.target.value)}
              className="mt-2 min-h-11 w-full rounded-lg border border-gray-200 bg-white px-3 text-base sm:text-sm"
            />
          </label>
          <label className="text-sm text-ink">
            العرض بالمتر
            <input
              type="number"
              min="0.1"
              max="20"
              step="0.1"
              required
              value={width}
              onChange={(event) => setWidth(event.target.value)}
              className="mt-2 min-h-11 w-full rounded-lg border border-gray-200 bg-white px-3 text-base sm:text-sm"
            />
          </label>
        </div>
      )}
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
          className="min-h-11 rounded-xl bg-primary px-5 py-2 text-sm font-bold text-white hover:bg-ink shadow-button"
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
