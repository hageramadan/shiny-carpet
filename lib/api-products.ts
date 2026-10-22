import {
  ApiError,
  getProductsByCategory as fetchCategoryProducts,
  getProductDetails,
} from "./api/shiny-carpet";
import type { Product, ProductSize } from "./data";

type RecordValue = Record<string, unknown>;
const record = (value: unknown): value is RecordValue =>
  typeof value === "object" && value !== null && !Array.isArray(value);

function amount(value: unknown): number | undefined {
  if (typeof value !== "number" && typeof value !== "string") return undefined;
  if (typeof value === "string" && !value.trim()) return undefined;
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? number : undefined;
}

function identifier(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value > 0;
}

function imageUrl(value: unknown): string {
  if (typeof value === "string") {
    try {
      const url = new URL(value);
      if (
        url.protocol === "https:" &&
        url.hostname === "admin.shinycarpet-sa.com" &&
        !url.port &&
        !url.username &&
        !url.password &&
        !url.search &&
        url.pathname.startsWith("/storage/products/")
      )
        return url.href;
    } catch {
      /* A missing image uses the site's logo. */
    }
  }
  return "/images/logo1.png";
}

export function parseProducts(body: unknown, categoryId: number): Product[] {
  if (!record(body) || body.success !== true || !Array.isArray(body.data)) {
    throw new Error("Invalid products response");
  }
  return body.data.map((item: unknown) => {
    if (
      !record(item) ||
      !identifier(item.id) ||
      typeof item.name !== "string" ||
      !item.name.trim() ||
      !record(item.category) ||
      item.category.id !== categoryId ||
      typeof item.category.name !== "string" ||
      ![0, 1, false, true].includes(item.has_sizes as number | boolean)
    ) {
      throw new Error("Invalid product");
    }
    const hasSizes = Boolean(item.has_sizes);
    const hasDiscount = item.has_discount === true || item.has_discount === 1;
    const before =
      amount(hasSizes ? item.min_price_before_discount : item.price) ??
      amount(item.min_price_before_discount);
    if (before === undefined) throw new Error("Missing product price");
    const discounted = hasDiscount
      ? (amount(item.min_price_after_discount) ??
        (!hasSizes ? amount(item.price_after_discount) : undefined))
      : undefined;
    const price = discounted !== undefined && discounted <= before ? discounted : before;
    const rawSizes = item.sizes ?? [];
    if (!Array.isArray(rawSizes)) throw new Error("Invalid product sizes");
    const sizes: ProductSize[] = rawSizes.map((size: unknown) => {
      if (!record(size) || !identifier(size.id)) throw new Error("Invalid size");
      const sizePrice = amount(size.price_before_discount);
      if (sizePrice === undefined) throw new Error("Missing size price");
      const after = hasDiscount ? amount(size.price_after_discount) : undefined;
      const final = after !== undefined && after <= sizePrice ? after : sizePrice;
      const length = amount(size.length),
        width = amount(size.width);
      const dimensions = length && width ? { length, width } : undefined;
      const label = dimensions
        ? `${length} × ${width} متر`
        : typeof size.name === "string" && size.name.trim()
          ? size.name
          : typeof size.size_type === "string" && size.size_type.trim()
            ? size.size_type
            : undefined;
      if (!label) throw new Error("Missing size label");
      return {
        id: size.id,
        label,
        price: final,
        originalPrice: final < sizePrice ? sizePrice : undefined,
        dimensions,
      };
    });
    const unitBefore = amount(item.price_per_unit);
    const unitAfter = hasDiscount ? amount(item.price_after_discount) : undefined;
    const pricePerUnit =
      unitBefore !== undefined && unitBefore > 0
        ? unitAfter !== undefined && unitAfter <= unitBefore
          ? unitAfter
          : unitBefore
        : undefined;
    return {
      id: String(item.id),
      apiId: item.id,
      categoryId,
      name: item.name.trim(),
      description: typeof item.description === "string" ? item.description : "",
      image: imageUrl(item.images),
      category: item.category.name,
      currency: "SAR",
      price,
      originalPrice: price < before ? before : undefined,
      unit: hasSizes ? "م²" : "قطعة",
      hasSizes,
      sizes,
      pricePerUnit,
    };
  });
}

export async function getProductsByCategory(
  categoryId: number,
  signal?: AbortSignal,
): Promise<Product[]> {
  const body = await fetchCategoryProducts(categoryId, signal);
  return parseProducts(body, categoryId);
}

export function parseProduct(body: unknown, expectedId: number): Product {
  if (
    !record(body) ||
    body.success !== true ||
    !record(body.data) ||
    body.data.id !== expectedId ||
    !record(body.data.category) ||
    !identifier(body.data.category.id)
  ) {
    throw new Error("Invalid product response");
  }
  return parseProducts({ success: true, data: [body.data] }, body.data.category.id)[0];
}

export async function getApiProduct(
  id: number,
  signal?: AbortSignal,
): Promise<Product | undefined> {
  try {
    const body = await getProductDetails(id, signal);
    return parseProduct(body, id);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return undefined;
    throw error;
  }
}
