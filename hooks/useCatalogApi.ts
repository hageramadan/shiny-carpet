"use client";

import { useCallback } from "react";
import { getCategories } from "@/lib/categories";
import { getApiProduct, getProductsByCategory } from "@/lib/api-products";
import { useApiResource } from "./useApiResource";

export function useCategories() {
  return useApiResource("categories", getCategories);
}

export function useCategoryProducts(categoryId?: number) {
  const load = useCallback(
    (signal: AbortSignal) =>
      categoryId === undefined
        ? Promise.resolve([])
        : getProductsByCategory(categoryId, signal),
    [categoryId],
  );
  return useApiResource(categoryId === undefined ? null : `category:${categoryId}`, load);
}

export function useProduct(id: number) {
  const load = useCallback((signal: AbortSignal) => getApiProduct(id, signal), [id]);
  return useApiResource(`product:${id}`, load);
}
