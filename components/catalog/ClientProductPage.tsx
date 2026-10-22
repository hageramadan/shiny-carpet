"use client";

import Link from "next/link";
import { useCallback, useEffect } from "react";
import { useApiResource } from "@/hooks/useApiResource";
import { getApiProduct, getProductsByCategory } from "@/lib/api-products";
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
  const loadProduct = useCallback(
    (signal: AbortSignal) => getApiProduct(id, signal),
    [id],
  );
  const request = useApiResource(`product:${id}`, loadProduct);
  const product = request.data;
  const productCategoryId = product?.categoryId;
  const loadRelated = useCallback(
    (signal: AbortSignal) => getProductsByCategory(productCategoryId!, signal),
    [productCategoryId],
  );
  const relatedRequest = useApiResource(
    productCategoryId === undefined ? null : `related:${productCategoryId}`,
    loadRelated,
  );
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
