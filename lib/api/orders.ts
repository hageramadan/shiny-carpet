import { authenticatedApiRequest } from "../auth/client";
import { ApiError, ApiResponseError } from "./client";
import { assertPositiveId, isPositiveId, isRecord } from "./validation";
import { cartSuccess, parseCartItem, parseCartTotals, type CartTotals } from "./cart";
import type { Order } from "../data";
import { isOrderStatus, type OrderStatus } from "../order-status";
import { apiPhone } from "../phone";

function amount(value: unknown): number {
  if (
    (typeof value !== "number" && typeof value !== "string") ||
    (typeof value === "string" && !value.trim()) ||
    !Number.isFinite(Number(value)) ||
    Number(value) < 0
  )
    throw new ApiResponseError("Invalid order amount");
  return Number(value);
}
function storageImage(
  value: unknown,
  directory: "products" | "order_images",
): string | undefined {
  if (typeof value !== "string") return;
  try {
    const url = new URL(value);
    if (["127.0.0.1", "localhost"].includes(url.hostname)) {
      url.protocol = "https:";
      url.hostname = "admin.shinycarpet-sa.com";
      url.port = "";
    }
    if (
      url.origin === "https://admin.shinycarpet-sa.com" &&
      url.pathname.startsWith(`/storage/${directory}/`) &&
      !url.username &&
      !url.password &&
      !url.search
    )
      return url.href;
  } catch {
    /* Ignore unusable image URLs. */
  }
}
export function orderImage(value: unknown) {
  return storageImage(value, "order_images");
}
export function parseOrder(value: unknown, requireItems = false): Order {
  if (
    !isRecord(value) ||
    !isPositiveId(value.id) ||
    !isOrderStatus(value.status) ||
    typeof value.created_at !== "string"
  )
    throw new ApiResponseError("Invalid order");
  const createdAt = value.created_at.replace(" ", "T");
  if (!Number.isFinite(new Date(createdAt).getTime()))
    throw new ApiResponseError("Invalid order date");
  if ((requireItems || value.items != null) && !Array.isArray(value.items))
    throw new ApiResponseError("Missing order items");
  const subtotal = amount(value.subtotal),
    tax = amount(value.vat_amount),
    total = amount(value.total);
  return {
    id: String(value.id),
    status: value.status as OrderStatus,
    createdAt,
    total,
    items: Array.isArray(value.items)
      ? value.items.map((item) => {
          if (
            isRecord(item) &&
            isRecord(item.product) &&
            Array.isArray(item.product.images)
          ) {
            return parseCartItem({
              ...item,
              product: {
                ...item.product,
                images: item.product.images.map((image) =>
                  storageImage(image, "products"),
                ),
              },
            });
          }
          return parseCartItem(item);
        })
      : [],
    phone: typeof value.phone === "string" ? value.phone : undefined,
    notes: typeof value.note === "string" ? value.note : undefined,
    coupon: typeof value.coupon_code === "string" ? value.coupon_code : undefined,
    pricing: {
      subtotal,
      tax,
      total,
      delivery: 0,
      discount: value.discount == null ? 0 : amount(value.discount),
    },
    photos: Array.isArray(value.order_images)
      ? value.order_images.flatMap((image, index) => {
          const preview = orderImage(image);
          return preview
            ? [{ name: "صورة الطلب " + (index + 1), type: "image", size: 0, preview }]
            : [];
        })
      : [],
  };
}
export async function fetchOrders(
  status: OrderStatus | undefined,
  signal?: AbortSignal,
): Promise<Order[]> {
  if (status !== undefined && !isOrderStatus(status))
    throw new RangeError("Invalid order status");
  const data = cartSuccess(
    await authenticatedApiRequest(status ? "/orders?status=" + status : "/orders", {
      signal,
    }),
  ).data;
  if (!Array.isArray(data)) throw new ApiResponseError("Invalid orders list");
  return data
    .map((item) => parseOrder(item))
    .filter((order) => status === undefined || order.status === status);
}
export async function fetchOrder(id: number, signal?: AbortSignal) {
  assertPositiveId(id);
  const order = parseOrder(
    cartSuccess(await authenticatedApiRequest("/orders/" + id, { signal })).data,
    true,
  );
  if (order.id !== String(id)) throw new ApiResponseError("Unexpected order ID");
  return order;
}
export async function cancelOrder(id: number, signal?: AbortSignal) {
  assertPositiveId(id);
  const order = parseOrder(
    cartSuccess(
      await authenticatedApiRequest("/orders/" + id + "/cancel", {
        method: "POST",
        body: {},
        signal,
      }),
    ).data,
  );
  if (order.id !== String(id) || order.status !== "cancelled")
    throw new ApiResponseError("Unexpected cancellation response");
  return order;
}
export function isOrderImageUploadError(error: unknown): boolean {
  if (!(error instanceof ApiError) || error.status !== 422 || !isRecord(error.details))
    return false;
  const fields = error.details.errors;
  return (
    (isRecord(fields) &&
      Object.keys(fields).some((key) => /^images(?:\.\d+)?$/.test(key))) ||
    (typeof error.details.message === "string" &&
      /images(?:\.\d+)?\b.*(?:upload|file|image)/i.test(error.details.message))
  );
}

export type CreateOrderInput = {
  addressId: number;
  phone: string;
  note?: string;
  coupon?: string;
  images: File[];
};
export async function createOrder(input: CreateOrderInput, signal?: AbortSignal) {
  assertPositiveId(input.addressId);
  const phone = apiPhone(input.phone);
  if (
    input.images.length > 3 ||
    input.images.some(
      (file) =>
        !["image/jpeg", "image/png", "image/webp"].includes(file.type) ||
        file.size > 5 * 1024 * 1024,
    )
  )
    throw new RangeError("Invalid order images");
  const body = new FormData();
  body.set("address_id", String(input.addressId));
  body.set("phone", phone.phone);
  body.set("country_code", phone.country_code.replace(/^\+/, ""));
  if (input.note?.trim()) body.set("note", input.note.trim());
  if (input.coupon) body.set("coupon_code", input.coupon);
  input.images.forEach((file) => body.append("images[]", file));
  const data = cartSuccess(
    await authenticatedApiRequest("/orders", {
      method: "POST",
      body,
      signal,
      // Multipart uploads need time on mobile connections, beyond the default 10s.
      timeoutMs: input.images.length ? 120_000 : 30_000,
    }),
  ).data;
  // Creation only needs the ID; the confirmation page fetches full details.
  if (!isRecord(data) || !isPositiveId(data.id))
    throw new ApiResponseError("Missing created order ID");
  return { id: String(data.id) };
}
export type CouponQuote = CartTotals & { discount: number; code: string };
export async function applyCoupon(
  code: string,
  signal?: AbortSignal,
): Promise<CouponQuote> {
  if (!code.trim()) throw new ApiError(422, { message: "أدخل كود الخصم." });
  const body = new FormData();
  body.set("coupon_code", code.trim());
  const data = cartSuccess(
    await authenticatedApiRequest("/cart/apply-coupon", { method: "POST", body, signal }),
  ).data;
  if (!isRecord(data) || typeof data.coupon_code !== "string" || !data.coupon_code.trim())
    throw new ApiResponseError("Invalid coupon response");
  return {
    ...parseCartTotals(data),
    discount: amount(data.discount),
    code: data.coupon_code,
  };
}
