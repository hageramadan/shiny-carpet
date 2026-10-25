"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useCategoryProducts, useProduct } from "@/hooks/useCatalogApi";
import ProductDetails from "./ProductDetails";
import ProductsLoading from "./ProductsLoading";
import CatalogFeedback from "./CatalogFeedback";

export default function ClientProductPage({
  id,
  categoryId,
}: {
  id: number;
  categoryId?: number;
}) {
  const request = useProduct(id);
  const product = request.data;
  const relatedRequest = useCategoryProducts(product?.categoryId);
  const related = (relatedRequest.data ?? [])
    .filter((item) => item.id !== String(id))
    .slice(0, 3);

  useEffect(() => {
    if (product) document.title = product.name + " | Shiny Carpet";
  }, [product]);

  if (request.status === "loading") return <ProductsLoading />;
  if (
    request.status === "error" ||
    !product ||
    (categoryId !== undefined && product.categoryId !== categoryId)
  ) {
    return (
      <section className="min-h-[60vh] bg-soft py-7">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <CatalogFeedback
            error={request.status === "error"}
            onRetry={request.reload}
            message={request.status === "error" ? undefined : "المنتج غير موجود حاليًا."}
          />
          <Link
            href="/products"
            className="mt-4 inline-flex min-h-11 items-center text-sm font-bold text-primary"
          >
            العودة للمنتجات
          </Link>
        </div>
      </section>
    );
  }
  return (
    <ProductDetails
      key={product.id}
      product={product}
      related={related}
    />
  );
}
