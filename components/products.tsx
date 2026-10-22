import Image from "next/image";
import Link from "next/link";
import { FiPlus } from "react-icons/fi";
import {
  money,
  currencyLabel,
  productCurrency,
  productHref,
  type Product,
} from "@/lib/data";

export function ProductCard({ product }: { product: Product }) {
  const currency = currencyLabel(productCurrency(product));
  return (
    <article className="flex min-w-0 flex-col rounded-2xl border border-gray-200 bg-white p-2.5 shadow-sm sm:p-3">
      <Link
        href={productHref(product)}
        className="relative block aspect-[3/2] overflow-hidden rounded-xl bg-white"
      >
        <Image
          src={product.image}
          alt={product.name}
          fill
          sizes="(max-width: 639px) calc(100vw - 56px), (max-width: 1023px) 50vw, 33vw"
          className="object-cover transition-transform duration-300 hover:scale-105"
        />
      </Link>
      <div className="flex flex-1 flex-col px-1 pt-3 sm:pt-4">
        <h2 className="text-base font-bold text-[#17202A]">
          <Link href={productHref(product)}>{product.name}</Link>
        </h2>
        <p className="mt-1.5 text-xs leading-6 sm:mt-2 sm:text-sm text-[#6B7280]">
          {product.category} ·{" "}
          {product.hasSizes ? "اختر المقاس لعرض الإجمالي" : "السعر للقطعة"}
        </p>
        <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-3 sm:gap-4">
          <span className="text-base font-bold text-primary">
            {product.hasSizes && <small className="me-1 text-xs font-normal">من</small>}
            {money(product.price)} <small className="text-xs">{currency}</small>
            {product.originalPrice !== undefined && (
              <del className="ms-2 text-xs font-normal text-muted">
                {money(product.originalPrice)}
              </del>
            )}
          </span>
          <Link
            href={productHref(product)}
            aria-label={"عرض تفاصيل " + product.name}
            className="grid size-11 shrink-0 sm:size-10 place-items-center rounded-full bg-primary text-xl text-white transition-colors hover:bg-ink"
          >
            <FiPlus />
          </Link>
        </div>
      </div>
    </article>
  );
}
