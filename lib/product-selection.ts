import type { Product } from "./data";
import { resolveCustomSize, type ResolvedSize } from "./product-options";

export function productSizeOptions(product: Product): { value: string; label: string }[] {
  if (product.apiId !== undefined) {
    if (!product.hasSizes) return [];
    return [
      ...(product.sizes ?? []).map((size) => ({
        value: String(size.id),
        label: size.label,
      })),
      { value: "custom", label: "مقاس مخصص" },
    ];
  }
  return [];
}

export function resolveProductSize(
  product: Product,
  choice: string,
  length = "",
  width = "",
): ResolvedSize | null {
  if (product.apiId === undefined) return null;
  if (!product.hasSizes) return { size: 1, sizeLabel: "قطعة", unitPrice: product.price };
  const size = product.sizes?.find((size) => String(size.id) === choice);
  if (size)
    return {
      size: size.dimensions ? size.dimensions.length * size.dimensions.width : 1,
      sizeLabel: size.label,
      sizeId: size.id,
      unitPrice: size.price,
      dimensions: size.dimensions,
    };
  if (choice !== "custom") return null;
  const dimensions = resolveCustomSize(length, width);
  return dimensions
    ? {
        ...dimensions,
        unitPrice:
          product.pricePerUnit === undefined
            ? undefined
            : Math.round(dimensions.size * product.pricePerUnit * 100) / 100,
      }
    : null;
}
