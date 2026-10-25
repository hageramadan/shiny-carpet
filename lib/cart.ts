import { itemPrice, type CartItem } from "./data";

export function cartSummary(cart: CartItem[]) {
  const subtotal =
    Math.round(cart.reduce((sum, item) => sum + itemPrice(item), 0) * 100) / 100;
  return { subtotal, delivery: 0, tax: 0, discount: 0, total: subtotal };
}
