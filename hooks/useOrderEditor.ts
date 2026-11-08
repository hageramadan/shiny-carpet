"use client";
import { useEffect, useRef, useState } from "react";
import { fetchOrder } from "@/lib/api/orders";
import { canEditOrder } from "@/lib/order-status";
import { ApiError } from "@/lib/api/client";
import { authErrorMessage } from "@/lib/auth/contracts";
import { readAuthSession } from "@/lib/auth/session";
import type { Order } from "@/lib/data";

export function useOrderEditor(initialOrder: Order) {
  const [order, setOrder] = useState(initialOrder);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [needsRefresh, setNeedsRefresh] = useState(false);
  const active = useRef<AbortController | null>(null);
  useEffect(() => () => active.current?.abort(), []);
  async function refresh() {
    if (active.current) return;
    const controller = new AbortController();
    active.current = controller;
    setPending(true);
    setError("");
    const token = readAuthSession()?.token;
    try {
      const fresh = await fetchOrder(Number(order.id), controller.signal);
      controller.signal.throwIfAborted();
      if (readAuthSession()?.token === token) {
        setOrder(fresh);
        setNeedsRefresh(false);
      }
    } catch (reason) {
      if (!controller.signal.aborted) setError(authErrorMessage(reason));
    } finally {
      if (active.current === controller) {
        active.current = null;
        setPending(false);
      }
    }
  }
  async function mutate(
    task: (fresh: Order, signal: AbortSignal) => Promise<void>,
  ): Promise<"saved" | "refresh-needed" | null> {
    if (active.current || needsRefresh) return null;
    const controller = new AbortController();
    active.current = controller;
    setPending(true);
    setError("");
    const token = readAuthSession()?.token;
    const guard = () => {
      controller.signal.throwIfAborted();
      if (!token || readAuthSession()?.token !== token) throw new ApiError(401);
    };
    try {
      const fresh = await fetchOrder(Number(order.id), controller.signal);
      guard();
      setOrder(fresh);
      if (!canEditOrder(fresh))
        throw new ApiError(409, {
          message: "لم يعد تعديل هذا الطلب متاحًا. راجع حالته من صفحة التفاصيل.",
        });
      await task(fresh, controller.signal);
      guard();
      try {
        const updated = await fetchOrder(Number(order.id), controller.signal);
        guard();
        setOrder(updated);
        return "saved";
      } catch (reason) {
        guard();
        setNeedsRefresh(true);
        setError(
          "تم حفظ التعديل، لكن تعذر تحديث عرض الطلب. أعد تحميل بيانات الطلب دون تكرار التعديل.",
        );
        return "refresh-needed";
      }
    } catch (reason) {
      if (!controller.signal.aborted && readAuthSession()?.token === token) {
        setError(authErrorMessage(reason));
        if (reason instanceof ApiError && [403, 409].includes(reason.status)) {
          try {
            const latest = await fetchOrder(Number(order.id), controller.signal);
            guard();
            setOrder(latest);
          } catch {
            if (!controller.signal.aborted) setNeedsRefresh(true);
          }
        } else if (!(reason instanceof ApiError)) setNeedsRefresh(true);
      }
      return null;
    } finally {
      if (active.current === controller) {
        active.current = null;
        setPending(false);
      }
    }
  }
  return {
    order,
    pending,
    error,
    needsRefresh,
    refresh,
    mutate,
    clearError: () => setError(""),
  };
}
export type OrderEditorState = ReturnType<typeof useOrderEditor>;
