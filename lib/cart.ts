import { itemPrice, type CartItem } from "./data";
import { cartItemKey, type ResolvedSize } from "./product-options";

export function cartSummary(cart: CartItem[]) {
  const subtotal =
    Math.round(cart.reduce((sum, item) => sum + itemPrice(item), 0) * 100) / 100;
  return { subtotal, delivery: 0, tax: 0, discount: 0, total: subtotal };
}

export function updateCartSize(
  cart: CartItem[],
  key: string,
  size: ResolvedSize,
): CartItem[] | null {
  const index = cart.findIndex((item) => cartItemKey(item) === key);
  if (index < 0) return cart;
  const original = cart[index];
  const replacement: CartItem = {
    ...original,
    ...size,
    dimensions: size.dimensions,
    sizeId: size.sizeId,
    unitPrice: size.unitPrice,
  };
  const replacementKey = cartItemKey(replacement);
  const match = cart.findIndex(
    (item, i) => i !== index && cartItemKey(item) === replacementKey,
  );
  if (match >= 0) {
    if (cart[match].quantity + original.quantity > 99) return null;
    return cart.flatMap((item, i) =>
      i === index
        ? []
        : [
            {
              ...item,
              quantity: i === match ? item.quantity + original.quantity : item.quantity,
            },
          ],
    );
  }
  return cart.map((item, i) => (i === index ? replacement : item));
}
