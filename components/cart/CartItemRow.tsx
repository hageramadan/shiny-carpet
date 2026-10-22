"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { FiMinus, FiPlus, FiTrash2 } from "react-icons/fi";
import {
  itemPrice,
  money,
  currencyLabel,
  productCurrency,
  productHref,
  type CartItem,
  type Product,
} from "@/lib/data";
import type { ResolvedSize } from "@/lib/product-options";
import SizeEditor from "./SizeEditor";

type Props = {
  item: CartItem;
  product: Product;
  onQuantity: (quantity: number) => void;
  onRemove: () => void;
  onResize: (size: ResolvedSize) => string | null;
};

export default function CartItemRow({
  item,
  product,
  onQuantity,
  onRemove,
  onResize,
}: Props) {
  const [editing, setEditing] = useState(false);
  const label =
    item.sizeLabel ||
    (product.category === "السجاد"
      ? money(item.size) + " متر مربع"
      : item.size === 1
        ? "شخص"
        : item.size === 1.5
          ? "شخصين"
          : "كبير");

  function save(size: ResolvedSize) {
    const error = onResize(size);
    if (!error) setEditing(false);
    return error;
  }

  return (
    <article className="rounded-2xl border border-gray-200 bg-white p-4 lg:p-5">
      <div className="grid grid-cols-[4.5rem_minmax(0,1fr)] items-start gap-3 sm:flex sm:items-center sm:gap-4">
        <Link
          href={productHref(product)}
          className="relative block h-24 w-18 shrink-0 sm:h-28 sm:w-22 overflow-hidden rounded-xl bg-white"
        >
          <Image
            src={product.image}
            alt={product.name}
            fill
            sizes="(min-width: 640px) 88px, 72px"
            className="object-cover"
          />
        </Link>
        <div className="min-w-0 flex-1">
          <h3 className="text-base font-bold leading-7 text-ink sm:text-lg">
            <Link href={productHref(product)}>{product.name}</Link>
          </h3>
          <p className="mt-2 text-xs leading-6 text-muted">المقاس: {label}</p>
          {(product.apiId === undefined || product.hasSizes) && (
            <button
              type="button"
              aria-expanded={editing}
              onClick={() => setEditing(!editing)}
              className="mt-1 inline-flex min-h-9 items-center text-xs font-bold text-primary hover:underline"
            >
              {editing ? "إغلاق تعديل المقاس" : "تعديل المقاس"}
            </button>
          )}
          <p className="mt-2 text-sm text-primary">
            {money(itemPrice(item))} {currencyLabel(productCurrency(product))}
          </p>
        </div>
        <div className="col-span-2 flex w-full items-center justify-between gap-3 border-t border-gray-100 pt-3 sm:w-auto sm:justify-end sm:gap-4 sm:border-0 sm:pt-0">
          <div
            dir="ltr"
            className="inline-flex min-h-11 items-center gap-2 sm:gap-3 rounded-xl border border-gray-200 bg-white px-2"
          >
            <button
              type="button"
              disabled={item.quantity <= 1}
              aria-label={"تقليل كمية " + product.name}
              onClick={() => onQuantity(Math.max(1, item.quantity - 1))}
              className="grid size-9 place-items-center sm:size-7 text-primary disabled:opacity-40"
            >
              <FiMinus />
            </button>
            <span
              aria-live="polite"
              className="min-w-4 text-center text-sm font-bold text-ink"
            >
              {item.quantity}
            </span>
            <button
              type="button"
              disabled={item.quantity >= 99}
              aria-label={"زيادة كمية " + product.name}
              onClick={() => onQuantity(Math.min(99, item.quantity + 1))}
              className="grid size-9 place-items-center sm:size-7 text-primary disabled:opacity-40"
            >
              <FiPlus />
            </button>
          </div>
          <button
            type="button"
            onClick={onRemove}
            aria-label={"حذف " + product.name + " من السلة"}
            className="inline-flex min-h-11 items-center gap-2 px-2 sm:px-0 text-xs text-red-500 hover:text-red-700"
          >
            <FiTrash2 className="text-lg" />
            حذف
          </button>
        </div>
      </div>
      {editing && (
        <SizeEditor
          item={item}
          product={product}
          onSave={save}
          onCancel={() => setEditing(false)}
        />
      )}
    </article>
  );
}
