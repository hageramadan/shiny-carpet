import { authenticatedApiRequest } from "../auth/client";
import { ApiError, ApiResponseError } from "./client";
import { assertPositiveId, catalogImage, isPositiveId, isRecord } from "./validation";
import type { CartItem, Product } from "../data";
import type { ResolvedSize } from "../product-options";

export type CartTotals = {
  subtotal: number;
  vatPercentage: number;
  vat: number;
  total: number;
};
export type CartSnapshot = CartTotals & { items: CartItem[]; count: number };
export type AddCartInput = {
  product_id: number;
  product_size_id?: number;
  length?: number;
  width?: number;
  quantity: number;
};

function number(value: unknown): number {
  if (
    (typeof value !== "number" && typeof value !== "string") ||
    (typeof value === "string" && !value.trim())
  )
    throw new ApiResponseError("Missing cart number");
  const result = Number(value);
  if (!Number.isFinite(result) || result < 0)
    throw new ApiResponseError("Invalid cart number");
  return result;
}

function integer(value: unknown): number {
  const result = number(value);
  if (!Number.isSafeInteger(result)) throw new ApiResponseError("Invalid cart integer");
  return result;
}

export function cartSuccess(body: unknown): Record<string, unknown> {
  if (!isRecord(body)) throw new ApiResponseError("Invalid cart response");
  if (body.success !== true) throw new ApiError(400, body);
  return body;
}

export function parseCartTotals(data: Record<string, unknown>): CartTotals {
  return {
    subtotal: number(data.cart_subtotal),
    vatPercentage: number(data.vat_percentage),
    vat: number(data.vat_amount),
    total: number(data.cart_total),
  };
}

export function parseCartItem(value: unknown): CartItem {
  if (
    !isRecord(value) ||
    !isPositiveId(value.id) ||
    !isRecord(value.product) ||
    !isPositiveId(value.product.id) ||
    typeof value.product.name !== "string" ||
    !value.product.name.trim()
  )
    throw new ApiResponseError("Invalid cart item");
  const quantity = integer(value.quantity);
  if (quantity < 1) throw new ApiResponseError("Invalid cart quantity");
  const lineTotal = number(value.price);
  const length = value.length == null ? undefined : number(value.length);
  const width = value.width == null ? undefined : number(value.width);
  if ((length === undefined) !== (width === undefined) || length === 0 || width === 0)
    throw new ApiResponseError("Invalid cart dimensions");
  const dimensions = length && width ? { length, width } : undefined;
  const size = value.product_size;
  if (size != null && (!isRecord(size) || !isPositiveId(size.id)))
    throw new ApiResponseError("Invalid cart size");
  const persons =
    value.number_of_person == null ? undefined : integer(value.number_of_person);
  const rawImages = value.product.images;
  const images = Array.isArray(rawImages) ? rawImages : [rawImages];
  const image =
    images
      .map((image) =>
        catalogImage(isRecord(image) ? (image.image ?? image.url) : image, "products"),
      )
      .find(Boolean) ?? "/images/logo1.png";
  const product: Product = {
    id: String(value.product.id),
    apiId: value.product.id,
    name: value.product.name,
    description:
      typeof value.product.description === "string" ? value.product.description : "",
    image,
    category: "",
    currency: "SAR",
    price: lineTotal / quantity,
    unit: dimensions ? "م²" : "قطعة",
  };
  return {
    id: product.id,
    cartItemId: value.id,
    product,
    quantity,
    lineTotal,
    unitPrice: lineTotal / quantity,
    size: dimensions ? dimensions.length * dimensions.width : 1,
    sizeId: isRecord(size) ? (size.id as number) : undefined,
    dimensions,
    sizeLabel: dimensions
      ? `${length} × ${width} متر`
      : persons
        ? `${persons} أشخاص`
        : "قطعة",
  };
}

export function parseCart(body: unknown): Omit<CartSnapshot, "count"> {
  const data = cartSuccess(body).data;
  if (!isRecord(data) || !Array.isArray(data.cart_items))
    throw new ApiResponseError("Missing cart items");
  const items = data.cart_items.map(parseCartItem);
  if (new Set(items.map((item) => item.cartItemId)).size !== items.length)
    throw new ApiResponseError("Duplicate cart item IDs");
  return { ...parseCartTotals(data), items };
}

export function parseCartCount(body: unknown): number {
  const data = cartSuccess(body).data;
  if (!isRecord(data)) throw new ApiResponseError("Missing cart count");
  return integer(data.item_count);
}

export function cartAddInput(
  product: Product,
  size: ResolvedSize,
  quantity: number,
): AddCartInput {
  if (!product.apiId) throw new RangeError("Missing product ID");
  const input: AddCartInput = { product_id: product.apiId, quantity };
  if (size.sizeId !== undefined) input.product_size_id = size.sizeId;
  if (size.dimensions) Object.assign(input, size.dimensions);
  validateAdd(input);
  return input;
}

function validateQuantity(quantity: number) {
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 99)
    throw new RangeError("Invalid cart quantity");
}

function validateAdd(input: AddCartInput) {
  assertPositiveId(input.product_id);
  validateQuantity(input.quantity);
  if (input.product_size_id !== undefined) assertPositiveId(input.product_size_id);
  if (input.length !== undefined || input.width !== undefined) {
    for (const dimension of [input.length, input.width])
      if (
        typeof dimension !== "number" ||
        !Number.isFinite(dimension) ||
        dimension < 0.1 ||
        dimension > 20
      )
        throw new RangeError("Invalid cart dimensions");
  }
}

export async function fetchCart(signal?: AbortSignal): Promise<CartSnapshot> {
  const [body, count] = await Promise.all([
    authenticatedApiRequest("/cart", { signal }),
    authenticatedApiRequest("/count", { signal }),
  ]);
  return { ...parseCart(body), count: parseCartCount(count) };
}

export async function addCartItem(input: AddCartInput, signal?: AbortSignal) {
  validateAdd(input);
  const body: AddCartInput = { product_id: input.product_id, quantity: input.quantity };
  if (input.product_size_id !== undefined) body.product_size_id = input.product_size_id;
  if (input.length !== undefined) {
    body.length = input.length;
    body.width = input.width;
  }
  cartSuccess(
    await authenticatedApiRequest("/cart/add", { method: "POST", body, signal }),
  );
}

export async function setCartQuantity(
  id: number,
  quantity: number,
  signal?: AbortSignal,
) {
  assertPositiveId(id);
  validateQuantity(quantity);
  const body = new FormData();
  body.set("quantity", String(quantity));
  cartSuccess(
    await authenticatedApiRequest(`/cart/item/${id}`, { method: "POST", body, signal }),
  );
}

export async function removeCartItem(id: number, signal?: AbortSignal) {
  assertPositiveId(id);
  cartSuccess(await authenticatedApiRequest(`/cart/${id}`, { method: "DELETE", signal }));
}

export async function clearRemoteCart(signal?: AbortSignal) {
  cartSuccess(await authenticatedApiRequest("/cart", { method: "DELETE", signal }));
}
