import { authenticatedApiRequest } from "../auth/client";
import { assertPositiveId } from "./validation";
import { cartSuccess, type AddCartInput } from "./cart";

export type OrderItemUpdate = {
  quantity: number;
  product_size_id?: number;
  length?: number;
  width?: number;
  images?: File[];
};
function quantity(value: number) {
  if (!Number.isInteger(value) || value < 1 || value > 99)
    throw new RangeError("Invalid order quantity");
}
function dimensions(input: { length?: number; width?: number }) {
  if (input.length === undefined && input.width === undefined) return;
  if (
    [input.length, input.width].some(
      (value) =>
        typeof value !== "number" || !Number.isFinite(value) || value < 0.1 || value > 20,
    )
  )
    throw new RangeError("Invalid order dimensions");
}
function images(files: File[]) {
  if (
    files.length > 3 ||
    files.some(
      (file) =>
        !["image/jpeg", "image/png", "image/webp"].includes(file.type) ||
        file.size <= 0 ||
        file.size > 5 * 1024 * 1024,
    )
  )
    throw new RangeError("Invalid order images");
}
export async function addOrderItem(
  orderId: number,
  input: AddCartInput,
  signal?: AbortSignal,
) {
  assertPositiveId(orderId);
  assertPositiveId(input.product_id);
  quantity(input.quantity);
  dimensions(input);
  if (input.product_size_id !== undefined) assertPositiveId(input.product_size_id);
  const body = {
    product_id: input.product_id,
    quantity: input.quantity,
    ...(input.product_size_id !== undefined
      ? { product_size_id: input.product_size_id }
      : {}),
    ...(input.length !== undefined ? { length: input.length, width: input.width } : {}),
  };
  cartSuccess(
    await authenticatedApiRequest(`/orders/${orderId}/items`, {
      method: "PUT",
      body,
      signal,
    }),
  );
}
export async function updateOrderItem(
  orderId: number,
  itemId: number,
  input: OrderItemUpdate,
  signal?: AbortSignal,
) {
  assertPositiveId(orderId);
  assertPositiveId(itemId);
  quantity(input.quantity);
  dimensions(input);
  if (input.product_size_id !== undefined) assertPositiveId(input.product_size_id);
  images(input.images ?? []);
  const body = new FormData();
  body.set("quantity", String(input.quantity));
  if (input.product_size_id !== undefined)
    body.set("product_size_id", String(input.product_size_id));
  if (input.length !== undefined) {
    body.set("length", String(input.length));
    body.set("width", String(input.width));
  }
  input.images?.forEach((file) => body.append("images[]", file));
  cartSuccess(
    await authenticatedApiRequest(`/orders/${orderId}/items/${itemId}`, {
      method: "PUT",
      body,
      signal,
    }),
  );
}
export async function removeOrderItem(
  orderId: number,
  itemId: number,
  signal?: AbortSignal,
) {
  assertPositiveId(orderId);
  assertPositiveId(itemId);
  cartSuccess(
    await authenticatedApiRequest(`/orders/${orderId}/items/${itemId}`, {
      method: "DELETE",
      signal,
    }),
  );
}
export async function updateOrderImages(
  orderId: number,
  input: { images: File[]; note: string },
  signal?: AbortSignal,
) {
  assertPositiveId(orderId);
  images(input.images);
  const body = new FormData();
  body.set("note", input.note);
  input.images.forEach((file) => body.append("images[]", file));
  cartSuccess(
    await authenticatedApiRequest(`/orders/${orderId}/images`, {
      method: "PUT",
      body,
      signal,
    }),
  );
}
export async function updateOrderCoupon(
  orderId: number,
  code: string,
  signal?: AbortSignal,
) {
  assertPositiveId(orderId);
  cartSuccess(
    await authenticatedApiRequest(`/orders/${orderId}/update-coupon`, {
      method: "POST",
      body: { coupon_code: code.trim() },
      signal,
    }),
  );
}
