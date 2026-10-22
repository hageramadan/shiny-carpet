"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { FiMinus, FiPlus, FiTrash2 } from "react-icons/fi";
import { itemPrice, money, type CartItem, type Product } from "@/lib/data";
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
      <div className="flex flex-wrap items-center gap-4 sm:flex-nowrap">
        <Link
          href={"/products/" + product.id}
          className="relative block h-28 w-22 shrink-0 overflow-hidden rounded-xl bg-white"
        >
          <Image
            src={product.image}
            alt={product.name}
            fill
            sizes="88px"
            className="object-cover"
          />
        </Link>
        <div className="min-w-0 flex-1">
          <h3 className="text-lg font-bold text-ink">
            <Link href={"/products/" + product.id}>{product.name}</Link>
          </h3>
          <p className="mt-2 text-xs leading-6 text-muted">المقاس: {label}</p>
          <button
            type="button"
            aria-expanded={editing}
            onClick={() => setEditing(!editing)}
            className="mt-1 text-xs font-bold text-primary hover:underline"
          >
            {editing ? "إغلاق تعديل المقاس" : "تعديل المقاس"}
          </button>
          <p className="mt-2 text-sm text-primary">{money(itemPrice(item))} ج.م</p>
        </div>
        <div className="flex w-full items-center justify-end gap-4 sm:w-auto">
          <div
            dir="ltr"
            className="inline-flex h-10 items-center gap-3 rounded-xl border border-gray-200 bg-white px-2"
          >
            <button
              type="button"
              disabled={item.quantity <= 1}
              aria-label={"تقليل كمية " + product.name}
              onClick={() => onQuantity(Math.max(1, item.quantity - 1))}
              className="grid size-7 place-items-center text-primary disabled:opacity-40"
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
              className="grid size-7 place-items-center text-primary disabled:opacity-40"
            >
              <FiPlus />
            </button>
          </div>
          <button
            type="button"
            onClick={onRemove}
            aria-label={"حذف " + product.name + " من السلة"}
            className="inline-flex min-h-10 items-center gap-2 text-xs text-red-500 hover:text-red-700"
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
