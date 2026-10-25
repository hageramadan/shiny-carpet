"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { calculateCustomProductPrice } from "@/lib/api-products";
import type { CustomProductInput } from "@/lib/api/shiny-carpet";
import { ApiError } from "@/lib/api/client";

export function customPriceErrorMessage(error: unknown): string {
  if (error instanceof ApiError && error.status === 404) {
    return "المنتج غير متاح حاليًا. ارجع إلى قائمة المنتجات وحاول مرة أخرى.";
  }
  if (error instanceof ApiError && error.status === 422) {
    return "المقاس أو الكمية غير مقبولين. راجع القيم وحاول مرة أخرى.";
  }
  return "تعذر حساب سعر المقاس المخصص. حاول مرة أخرى.";
}

export function useCustomProductPrice(productId?: number) {
  const controller = useRef<AbortController | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => () => controller.current?.abort(), [productId]);

  const calculate = useCallback(
    async (input: CustomProductInput) => {
      if (productId === undefined) throw new RangeError("Missing API product ID");
      if (controller.current && !controller.current.signal.aborted) {
        throw new Error("A custom price request is already in progress");
      }
      const request = new AbortController();
      controller.current = request;
      setPending(true);
      try {
        const price = await calculateCustomProductPrice(productId, input, request.signal);
        request.signal.throwIfAborted();
        return price;
      } catch (error) {
        request.signal.throwIfAborted();
        throw error;
      } finally {
        if (!request.signal.aborted) setPending(false);
        if (controller.current === request) controller.current = null;
      }
    },
    [productId],
  );

  return { calculate, pending };
}
