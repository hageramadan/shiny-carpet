"use client";
import { useState } from "react";
import Image from "next/image";
import { useTranslation } from "@/components/i18n/LanguageProvider";
import { Quantity } from "@/components/ui";
import { type CartItem, type Order, itemPrice, money } from "@/lib/data";
import { ApiError } from "@/lib/api/client";
import { updateOrderItem, removeOrderItem } from "@/lib/api/order-edit";
import type { OrderEditorState } from "@/hooks/useOrderEditor";

export default function OrderEditItem({
  item,
  editor,
  onEdit,
}: {
  item: CartItem;
  editor: OrderEditorState;
  onEdit: () => void;
}) {
  const t = useTranslation();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const id = item.orderItemId;
  const disabled = editor.pending || editor.needsRefresh || id === undefined;
  const find = (fresh: Order) => {
    if (!fresh.items.some((row) => row.orderItemId === id))
      throw new ApiError(409, {
        message: "تغيّرت منتجات الطلب. حدّث البيانات وحاول مرة أخرى.",
      });
  };
  const name = item.product?.name ?? t("قطعة");
  async function changeQuantity(quantity: number) {
    if (id === undefined) return;
    await editor.mutate(async (fresh, signal) => {
      find(fresh);
      await updateOrderItem(Number(fresh.id), id, { quantity }, signal);
    });
  }
  async function remove() {
    if (id === undefined) return;
    const result = await editor.mutate(async (fresh, signal) => {
      find(fresh);
      if (fresh.items.length <= 1)
        throw new ApiError(422, {
          message: "لا يمكن حذف آخر منتج. يمكنك إلغاء الطلب بدلًا من ذلك.",
        });
      await removeOrderItem(Number(fresh.id), id, signal);
    });
    if (result) setConfirmDelete(false);
  }
  return (
    <article className="rounded-2xl border border-gray-200 bg-white p-4 sm:p-5">
      <div className="flex items-start gap-3 sm:items-center sm:gap-4">
        <Image
          src={item.product?.image ?? "/images/logo1.png"}
          alt={name}
          width={80}
          height={88}
          className="h-22 w-18 shrink-0 rounded-xl object-cover"
        />
        <div className="min-w-0 flex-1">
          <h3 className="font-bold text-ink">{name}</h3>
          <p className="mt-1 text-xs text-muted">
            {t("المقاس:")} <bdi>{t(item.sizeLabel ?? "قطعة")}</bdi>
          </p>
          <button
            type="button"
            disabled={disabled}
            onClick={onEdit}
            className="mt-1 min-h-9 text-xs font-bold text-primary disabled:opacity-50"
          >
            {t("تعديل المنتج")}
          </button>
          <p className="text-sm font-bold text-primary">
            {t(money(itemPrice(item)))} {t("ر.س")}
          </p>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 pt-3">
        <div
          role="group"
          aria-label={t("الكمية") + " " + name}
        >
          <Quantity
            disabled={disabled}
            value={item.quantity}
            onChange={(n) => void changeQuantity(n)}
          />
        </div>
        <button
          type="button"
          disabled={disabled || editor.order.items.length <= 1}
          onClick={() => setConfirmDelete(true)}
          className="min-h-11 text-sm text-red-600 disabled:opacity-40"
        >
          {t("حذف")}
        </button>
      </div>
      {confirmDelete && (
        <div
          role="alertdialog"
          aria-label={t("تأكيد حذف المنتج")}
          className="mt-3 rounded-xl border border-red-200 bg-red-50 p-4"
        >
          <p className="text-sm">{t("هل تريد حذف هذا المنتج من الطلب؟")}</p>
          <div className="mt-2 flex gap-4">
            <button
              type="button"
              disabled={disabled}
              onClick={() => void remove()}
              className="min-h-11 font-bold text-red-600"
            >
              {t("تأكيد الحذف")}
            </button>
            <button
              type="button"
              disabled={disabled}
              onClick={() => setConfirmDelete(false)}
              className="min-h-11"
            >
              {t("إلغاء")}
            </button>
          </div>
        </div>
      )}
    </article>
  );
}
