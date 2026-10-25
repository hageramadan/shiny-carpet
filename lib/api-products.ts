import {
  getProductsByCategory as fetchCategoryProducts,
  getProductDetails,
  getCustomProductPrice,
  type CustomProductInput,
} from "./api/shiny-carpet";
import { ApiError, ApiResponseError } from "./api/client";
import { catalogImage, isPositiveId, isRecord, responseData } from "./api/validation";
import type { Product, ProductSize } from "./data";

function amount(value: unknown): number | undefined {
  if (typeof value !== "number" && typeof value !== "string") return undefined;
  if (typeof value === "string" && !value.trim()) return undefined;
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? number : undefined;
}

// The custom endpoint returns a total for all pieces, not a per-piece price.
export async function calculateCustomProductPrice(
  productId: number,
  input: CustomProductInput,
  signal?: AbortSignal,
): Promise<number> {
  const data = responseData(await getCustomProductPrice(productId, input, signal));
  const price = isRecord(data) ? amount(data.price) : undefined;
  if (price === undefined) throw new ApiResponseError("Invalid custom product price");
  return price;
}

export function parseProducts(body: unknown, categoryId: number): Product[] {
  const data = responseData(body);
  if (!Array.isArray(data)) {
    throw new ApiResponseError("Invalid products response");
  }
  return data.map((item: unknown) => mapProduct(item, categoryId));
}

function mapProduct(item: unknown, expectedCategoryId?: number): Product {
  if (
    !isRecord(item) ||
    !isPositiveId(item.id) ||
    typeof item.name !== "string" ||
    !item.name.trim() ||
    !isRecord(item.category) ||
    !isPositiveId(item.category.id) ||
    (expectedCategoryId !== undefined && item.category.id !== expectedCategoryId) ||
    typeof item.category.name !== "string" ||
    !item.category.name.trim() ||
    ![0, 1, false, true].includes(item.has_sizes as number | boolean)
  ) {
    throw new ApiResponseError("Invalid product");
  }
  const hasSizes = Boolean(item.has_sizes);
  const hasDiscount = item.has_discount === true || item.has_discount === 1;
  const before =
    amount(hasSizes ? item.min_price_before_discount : item.price) ??
    amount(item.min_price_before_discount);
  if (before === undefined) throw new ApiResponseError("Missing product price");
  const discounted = hasDiscount
    ? (amount(item.min_price_after_discount) ??
      (!hasSizes ? amount(item.price_after_discount) : undefined))
    : undefined;
  const price = discounted !== undefined && discounted <= before ? discounted : before;
  const rawSizes = item.sizes ?? [];
  if (!Array.isArray(rawSizes)) throw new ApiResponseError("Invalid product sizes");
  const sizes = rawSizes.map((size: unknown) => mapProductSize(size, hasDiscount));
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
    categoryId: item.category.id,
    name: item.name.trim(),
    description: typeof item.description === "string" ? item.description : "",
    image: catalogImage(item.images, "products") ?? "/images/logo1.png",
    category: item.category.name.trim(),
    currency: "SAR",
    price,
    originalPrice: price < before ? before : undefined,
    unit: hasSizes ? "م²" : "قطعة",
    hasSizes,
    sizes,
    pricePerUnit,
  };
}

function mapProductSize(size: unknown, hasDiscount: boolean): ProductSize {
  if (!isRecord(size) || !isPositiveId(size.id)) {
    throw new ApiResponseError("Invalid size");
  }
  const before = amount(size.price_before_discount);
  if (before === undefined) throw new ApiResponseError("Missing size price");
  const after = hasDiscount ? amount(size.price_after_discount) : undefined;
  const price = after !== undefined && after <= before ? after : before;
  const length = amount(size.length);
  const width = amount(size.width);
  const dimensions = length && width ? { length, width } : undefined;
  const label = dimensions
    ? `${length} × ${width} متر`
    : typeof size.name === "string" && size.name.trim()
      ? size.name.trim()
      : typeof size.size_type === "string" && size.size_type.trim()
        ? size.size_type.trim()
        : undefined;
  if (!label) throw new ApiResponseError("Missing size label");
  return {
    id: size.id,
    label,
    price,
    originalPrice: price < before ? before : undefined,
    dimensions,
  };
}

export async function getProductsByCategory(
  categoryId: number,
  signal?: AbortSignal,
): Promise<Product[]> {
  const body = await fetchCategoryProducts(categoryId, signal);
  return parseProducts(body, categoryId);
}

export function parseProduct(body: unknown, expectedId: number): Product {
  const product = mapProduct(responseData(body));
  if (product.apiId !== expectedId) {
    throw new ApiResponseError("Product ID does not match the requested product");
  }
  return product;
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
