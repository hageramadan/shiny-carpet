"use client";

import Link from "next/link";
import { FiShoppingBag } from "react-icons/fi";
import { ProductCard } from "@/components/products";
import { useCategories, useCategoryProducts } from "@/hooks/useCatalogApi";
import CatalogFeedback from "./CatalogFeedback";

export default function Catalog({ categoryId }: { categoryId?: number }) {
  const categoriesRequest = useCategories();
  const categories = categoriesRequest.data ?? [];
  const selected =
    categoryId === undefined
      ? categories[0]
      : categories.find((category) => category.id === categoryId);
  const productsRequest = useCategoryProducts(selected?.id);
  const products = productsRequest.data ?? [];
  const failed =
    categoriesRequest.status === "error" || productsRequest.status === "error";
  const loading =
    categoriesRequest.status === "loading" || productsRequest.status === "loading";
  const retry =
    categoriesRequest.status === "error"
      ? categoriesRequest.reload
      : productsRequest.reload;
  return (
    <section className="min-h-[70vh] bg-[#f7f9fa] py-5 sm:py-7 lg:pb-16">
      <div className="container mx-auto min-w-0 px-4 sm:px-6 lg:px-8">
        <nav
          aria-label="مسار التصفح"
          className="mb-3 text-xs leading-6 sm:mb-5 text-muted"
        >
          <Link
            href="/"
            className="hover:text-primary"
          >
            الرئيسية
          </Link>
          <span className="mx-2">/</span>
          <span>الخدمات والمنتجات</span>
        </nav>
        <h1 className="text-2xl font-extrabold leading-snug text-[#17202A] sm:text-3xl lg:text-4xl">
          المنتجات
        </h1>
        <p className="mt-2 text-sm leading-7 sm:mt-4 text-[#6B7280] md:text-base">
          حدد القطع التي تريد إضافتها إلى طلبك.
        </p>
        {categories.length > 0 && (
          <nav
            aria-label="تصنيفات المنتجات"
            className="mt-5 flex flex-wrap gap-2"
          >
            {categories.map((category) => (
              <Link
                key={category.id}
                href={`/products?category=${category.id}`}
                aria-current={selected?.id === category.id ? "page" : undefined}
                className="inline-flex min-h-11 items-center justify-center rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-ink transition-colors hover:border-primary aria-[current=page]:border-primary aria-[current=page]:bg-primary/10 aria-[current=page]:text-primary sm:px-4"
              >
                {category.name}
              </Link>
            ))}
          </nav>
        )}
        <h2 className="mb-4 mt-6 text-lg sm:mb-6 sm:mt-9 sm:text-xl font-bold text-[#17202A] md:text-[22px]">
          {selected?.name ?? "المنتجات المتوفرة"}
        </h2>
        {loading ? (
          <div
            role="status"
            aria-label="جاري تحميل المنتجات"
            className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
          >
            {[0, 1, 2].map((index) => (
              <div
                key={index}
                aria-hidden="true"
                className="h-80 animate-pulse rounded-2xl bg-primary/10 motion-reduce:animate-none"
              />
            ))}
            <span className="sr-only">جاري تحميل المنتجات…</span>
          </div>
        ) : failed ? (
          <CatalogFeedback
            error
            onRetry={retry}
          />
        ) : !products.length ? (
          <CatalogFeedback />
        ) : (
          <div className="grid gap-4 *:min-w-0 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
            {products.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
              />
            ))}
          </div>
        )}
        <div className="mt-5 flex flex-col items-stretch justify-between gap-4 rounded-2xl bg-primary/10 p-4 sm:mt-7 sm:gap-5 sm:p-5 sm:flex-row sm:items-center">
          <div className="flex items-start gap-3 sm:items-center sm:gap-4">
            <FiShoppingBag className="shrink-0 text-xl text-primary" />
            <p className="text-sm font-bold leading-7 sm:text-base sm:leading-8 text-ink">
              راجع المقاسات والكميات في السلة قبل استكمال الطلب.
            </p>
          </div>
          <Link
            href="/cart"
            className="inline-flex min-h-12 w-full shrink-0 sm:w-auto items-center justify-center rounded-xl bg-primary px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-ink shadow-button"
          >
            عرض السلة
          </Link>
        </div>
      </div>
    </section>
  );
}
