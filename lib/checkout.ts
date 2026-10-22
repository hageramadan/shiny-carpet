import type { CartItem, OrderPricing } from "./data";
import { cartSummary } from "./cart";

export function checkoutPricing(items: CartItem[], code = ""): OrderPricing {
  const base = cartSummary(items);
  const discount =
    code.trim().toUpperCase() === "DEMO10"
      ? Math.round(base.subtotal * 0.1 * 100) / 100
      : 0;
  return { ...base, discount, total: Math.round((base.subtotal - discount) * 100) / 100 };
}

export function earliestPickupDate(now = new Date()) {
  const next = new Date(now);
  next.setDate(next.getDate() + 1);
  return [
    next.getFullYear(),
    String(next.getMonth() + 1).padStart(2, "0"),
    String(next.getDate()).padStart(2, "0"),
  ].join("-");
}
