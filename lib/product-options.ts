import type { CartItem } from "./data";

export type ResolvedSize = {
  size: number;
  sizeLabel: string;
  sizeId?: number;
  unitPrice?: number;
  dimensions?: { length: number; width: number };
};

export function resolveCustomSize(length = "", width = ""): ResolvedSize | null {
  const l = Number(length);
  const w = Number(width);
  if (
    !Number.isFinite(l) ||
    !Number.isFinite(w) ||
    l < 0.1 ||
    w < 0.1 ||
    l > 20 ||
    w > 20
  )
    return null;
  return {
    size: Math.round(l * w * 100) / 100,
    sizeLabel: l + " × " + w + " متر",
    dimensions: { length: l, width: w },
  };
}

export function cartItemKey(item: CartItem): string {
  if (item.cartItemId !== undefined) return `cart:${item.cartItemId}`;
  return [
    item.id,
    item.sizeId ?? "",
    item.size,
    item.dimensions?.length ?? "",
    item.dimensions?.width ?? "",
  ].join(":");
}
