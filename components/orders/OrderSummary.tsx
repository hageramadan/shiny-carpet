"use client";
import { useTranslation } from "@/components/i18n/LanguageProvider";
import Image from "next/image";
import {
  itemPrice,
  money,
  cartProduct,
  currencyLabel,
  productCurrency,
  type Currency,
  type CartItem,
  type OrderPricing,
} from "@/lib/data";
import { cartItemKey } from "@/lib/product-options";

export function OrderItems({ items }: { items: CartItem[] }) {
  const t = useTranslation();
  return (
    <ul className="space-y-4 sm:space-y-5">
      {items.map((item) => {
        const product = cartProduct(item);
        if (!product) return null;
        return (
          <li
            key={cartItemKey(item)}
            className="flex items-start gap-3"
          >
            <Image
              src={product.image}
              alt={product.name}
              width={64}
              height={64}
              className="size-14 shrink-0 rounded-lg object-cover"
            />
            <div className="min-w-0 flex-1 wrap-anywhere">
              <h3 className="text-sm font-bold text-ink">{product.name}</h3>
              <p className="mt-1 text-xs leading-6 text-muted">
                {t("المقاس:")}
                {t(" ")}
                {t(
                  item.sizeLabel ||
                    (product.category === "السجاد"
                      ? money(item.size) + " م²"
                      : item.size === 1
                        ? "شخص"
                        : item.size === 1.5
                          ? "شخصين"
                          : "كبير"),
                )}
                {t(" ")}
                {t("· الكمية: ")}
                {t(money(item.quantity))}
              </p>
              <p className="mt-1 text-xs font-bold text-primary">
                {t(money(itemPrice(item)))} {t(currencyLabel(productCurrency(product)))}
              </p>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

export function PriceBreakdown({
  pricing,
  currency = "EGP",
  deliveryPending = false,
  orderTotals = false,
}: {
  pricing: OrderPricing;
  currency?: Currency;
  deliveryPending?: boolean;
  orderTotals?: boolean;
}) {
  const t = useTranslation();
  return (
    <dl className="space-y-3 text-sm sm:space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
        <dt className="text-muted">{t("السعر")}</dt>
        <dd className="text-ink">
          {t(money(pricing.subtotal))} {t(currencyLabel(currency))}
        </dd>
      </div>
      {!orderTotals && (
        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
          <dt className="text-muted">{t("التوصيل")}</dt>
          <dd className="text-ink">
            {t(
              deliveryPending
                ? "يُحدد عند إتمام الطلب"
                : `${money(pricing.delivery)} ${currencyLabel(currency)}`,
            )}
          </dd>
        </div>
      )}
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
        <dt className="text-muted">{t("الضريبة")}</dt>
        <dd className="text-ink">
          {t(money(pricing.tax))} {t(currencyLabel(currency))}
        </dd>
      </div>
      {((!deliveryPending && !orderTotals) || pricing.discount > 0) && (
        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
          <dt className="text-muted">{t("الخصم")}</dt>
          <dd className={pricing.discount ? "text-red-500" : "text-muted"}>
            {t(pricing.discount > 0 ? "−" : "")}
            {t(money(pricing.discount))} {t(currencyLabel(currency))}
          </dd>
        </div>
      )}
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 border-t border-gray-200 pt-5">
        <dt className="text-base font-bold text-ink">{t("الإجمالي")}</dt>
        <dd className="text-lg font-bold text-primary sm:text-xl">
          {t(money(pricing.total))} {t(currencyLabel(currency))}
        </dd>
      </div>
    </dl>
  );
}
