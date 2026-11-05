"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useProduct } from "@/hooks/useCatalogApi";
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

  useEffect(() => {
    if (product) document.title = product.name + " | Shiny Carpet";
  }, [product]);

  if (request.status !== "success" && request.status !== "error")
    return <ProductsLoading />;
  if (
    request.status === "error" ||
    !product ||
    (categoryId !== undefined && product.categoryId !== categoryId)
  ) {
    return (
      <section className="min-h-[60vh] bg-soft py-7">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          {request.status === "error" && <CatalogFeedback onRetry={request.reload} />}
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
    />
  );
}
