import type { CartItem, Product } from "./data";
import { resolveSize, type ResolvedSize, type SizeChoice } from "./product-options";

export function productSizeOptions(product: Product): { value: string; label: string }[] {
  if (product.apiId !== undefined) {
    if (!product.hasSizes) return [];
    if (product.sizes?.length)
      return product.sizes.map((size) => ({ value: String(size.id), label: size.label }));
    return product.pricePerUnit !== undefined
      ? [{ value: "custom", label: "مقاس مخصص" }]
      : [];
  }
  return product.category === "السجاد"
    ? [
        { value: "small", label: "١ × ٢" },
        { value: "medium", label: "٢ × ٢" },
        { value: "large", label: "٢ × ٣" },
        { value: "custom", label: "غير ذلك" },
      ]
    : [
        { value: "small", label: "شخص" },
        { value: "medium", label: "شخصين" },
        { value: "large", label: "كبير" },
        { value: "custom", label: "غير ذلك" },
      ];
}

export function resolveProductSize(
  product: Product,
  choice: string,
  length = "",
  width = "",
): ResolvedSize | null {
  if (product.apiId === undefined)
    return resolveSize(
      product.category === "السجاد",
      choice as SizeChoice,
      length,
      width,
    );
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
  if (choice !== "custom" || product.sizes?.length || product.pricePerUnit === undefined)
    return null;
  const dimensions = resolveSize(true, "custom", length, width);
  return dimensions
    ? {
        ...dimensions,
        unitPrice: Math.round(dimensions.size * product.pricePerUnit * 100) / 100,
      }
    : null;
}

export function itemSizeChoice(product: Product, item: CartItem): string {
  if (item.sizeId !== undefined) return String(item.sizeId);
  return (
    productSizeOptions(product).find((option) => {
      const resolved = resolveProductSize(product, option.value);
      return (
        resolved &&
        resolved.size === item.size &&
        resolved.dimensions?.length === item.dimensions?.length &&
        resolved.dimensions?.width === item.dimensions?.width
      );
    })?.value ?? "custom"
  );
}
