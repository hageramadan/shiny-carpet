import type { CartItem } from "./data";

export type SizeChoice = "small" | "medium" | "large" | "custom";
export type ResolvedSize = {
  size: number;
  sizeLabel: string;
  dimensions?: { length: number; width: number };
};

export function resolveSize(
  carpet: boolean,
  choice: SizeChoice,
  length = "",
  width = "",
): ResolvedSize | null {
  if (choice === "custom") {
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
      size: carpet ? Math.round(l * w * 100) / 100 : 1,
      sizeLabel: l + " × " + w + " متر",
      dimensions: { length: l, width: w },
    };
  }
  if (carpet) {
    const measures = { small: [1, 2], medium: [2, 2], large: [2, 3] };
    const [l, w] = measures[choice];
    return {
      size: l * w,
      sizeLabel: l + " × " + w + " متر",
      dimensions: { length: l, width: w },
    };
  }
  const options = {
    small: { size: 1, sizeLabel: "شخص" },
    medium: { size: 1.5, sizeLabel: "شخصين" },
    large: { size: 2, sizeLabel: "كبير" },
  };
  return options[choice];
}

export function cartItemKey(item: CartItem): string {
  return [
    item.id,
    item.size,
    item.dimensions?.length ?? "",
    item.dimensions?.width ?? "",
  ].join(":");
}
