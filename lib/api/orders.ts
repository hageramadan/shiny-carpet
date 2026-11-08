import { authenticatedApiRequest } from "../auth/client";
import { ApiError, ApiResponseError } from "./client";
import { assertPositiveId, isPositiveId, isRecord } from "./validation";
import { cartSuccess, parseCartItem, parseCartTotals, type CartTotals } from "./cart";
import type { Order, Address } from "../data";
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
function orderFlag(value: unknown): boolean | undefined {
  if (value === true || value === 1 || value === "1") return true;
  if (value === false || value === 0 || value === "0") return false;
}
function orderAddress(value: unknown, addressId: unknown): Address | undefined {
  if (!isRecord(value)) return;
  const text = (field: unknown) => (typeof field === "string" ? field : "");
  const label = (field: unknown) => (isRecord(field) ? text(field.name) : text(field));
  const street = text(value.street) || text(value.full_address);
  if (!street && !text(value.title)) return;
  return {
    id: isPositiveId(value.id)
      ? String(value.id)
      : isPositiveId(addressId)
        ? String(addressId)
        : "",
    label: text(value.title),
    street,
    building: text(value.building_number),
    floor: text(value.floor),
    apartment: text(value.apartment),
    details: text(value.details),
    city: label(value.city) || text(value.city_name),
    region: label(value.governorate) || text(value.governorate_name),
  };
}
export function parseOrder(value: unknown, requireItems = false): Order {
  if (
    !isRecord(value) ||
    !isPositiveId(value.id) ||
    typeof value.status !== "string" ||
    !value.status.trim() ||
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
    status: isOrderStatus(value.status) ? value.status : "unknown",
    rawStatus: value.status,
    statusLabel:
      typeof value.status_label === "string" && value.status_label.trim()
        ? value.status_label.trim()
        : undefined,
    driverTask:
      typeof value.driver_task === "string" && value.driver_task.trim()
        ? isOrderStatus(value.driver_task)
          ? value.driver_task
          : "unknown"
        : undefined,
    paymentStatusLabel:
      value.status === "paid" || orderFlag(value.user_paid) === true
        ? typeof value.status_label === "string" && value.status_label.trim()
          ? value.status_label
          : "تم الدفع"
        : undefined,
    userPaid: orderFlag(value.user_paid),
    isRated: orderFlag(value.is_rated),
    canEdit: orderFlag(value.can_edit),
    isReceived: orderFlag(value.is_received),
    createdAt,
    total,
    items: Array.isArray(value.items)
      ? value.items.map((item) => {
          if (
            isRecord(item) &&
            isRecord(item.product) &&
            Array.isArray(item.product.images)
          ) {
            return {
              ...parseCartItem({
                ...item,
                product: {
                  ...item.product,
                  images: item.product.images.map((image) =>
                    storageImage(image, "products"),
                  ),
                },
              }),
              orderItemId: isPositiveId(item.id) ? item.id : undefined,
            };
          }
          return {
            ...parseCartItem(item),
            orderItemId: isRecord(item) && isPositiveId(item.id) ? item.id : undefined,
          };
        })
      : [],
    address: orderAddress(value.address, value.address_id),
    phone: typeof value.phone === "string" ? value.phone : undefined,
    notes: typeof value.note === "string" ? value.note : undefined,
    coupon: typeof value.coupon_code === "string" ? value.coupon_code : undefined,
    pricing: {
      subtotal,
      tax,
      total,
      delivery: value.delivery_fee == null ? 0 : amount(value.delivery_fee),
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
  try {
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
  } catch (error) {
    if (
      error instanceof ApiError &&
      isRecord(error.details) &&
      error.details.message === 'Only orders in "confirmed" status can be cancelled.'
    )
      throw new ApiError(
        error.status,
        {
          ...error.details,
          message: "يمكن إلغاء الطلب فقط عندما تكون حالته «تم تأكيد الطلب».",
        },
        error.retryAfter,
      );
    throw error;
  }
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
    input.images.length === 0 ||
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
