import { authenticatedApiRequest } from "../auth/client";
import { ApiError, ApiResponseError } from "./client";
import { assertPositiveId, isRecord } from "./validation";

export const paymentBrands = ["MADA", "APPLEPAY", "VISA", "MASTER"] as const;
export type PaymentBrand = (typeof paymentBrands)[number];
export type PaymentCheckout = {
  checkoutId: string;
  orderId: number;
  amount: number;
  currency: "SAR";
  paymentUrl: string;
};
export function parsePaymentCheckout(body: unknown, orderId: number): PaymentCheckout {
  if (!isRecord(body)) throw new ApiResponseError("Invalid checkout response");
  if (body.success !== true) throw new ApiError(400, body);
  const data = body.data;
  if (
    !isRecord(data) ||
    data.order_id !== orderId ||
    typeof data.checkout_id !== "string" ||
    !/^[a-zA-Z0-9._-]{1,200}$/.test(data.checkout_id) ||
    typeof data.payment_url !== "string" ||
    data.currency !== "SAR" ||
    (typeof data.amount !== "string" && typeof data.amount !== "number") ||
    (typeof data.amount === "string" && !data.amount.trim()) ||
    !Number.isFinite(Number(data.amount)) ||
    Number(data.amount) <= 0
  )
    throw new ApiResponseError("Invalid checkout data");
  let url: URL;
  try {
    url = new URL(data.payment_url);
  } catch {
    throw new ApiResponseError("Invalid payment widget URL");
  }
  if (
    url.origin !== "https://eu-prod.oppwa.com" ||
    url.pathname !== "/v1/paymentWidgets.js" ||
    url.username ||
    url.password ||
    url.hash ||
    url.searchParams.get("checkoutId") !== data.checkout_id ||
    [...url.searchParams.keys()].length !== 1
  )
    throw new ApiResponseError("Unexpected payment widget URL");
  return {
    checkoutId: data.checkout_id,
    orderId,
    amount: Number(data.amount),
    currency: "SAR",
    paymentUrl: url.href,
  };
}
export async function createPaymentCheckout(
  orderId: number,
  brand: PaymentBrand,
  signal?: AbortSignal,
) {
  assertPositiveId(orderId);
  if (!paymentBrands.includes(brand)) throw new RangeError("Invalid payment brand");
  const body = await authenticatedApiRequest("/payments/checkout", {
    method: "POST",
    body: { order_id: orderId, payment_brand: brand },
    signal,
    timeoutMs: 60_000,
  });
  signal?.throwIfAborted();
  return parsePaymentCheckout(body, orderId);
}

export type PaymentStatus = "paid" | "pending" | "failed" | "unknown";
export function parsePaymentStatus(
  body: unknown,
  orderId: number,
  checkoutId: string,
): PaymentStatus {
  if (
    !isRecord(body) ||
    typeof body.success !== "boolean" ||
    !isRecord(body.data) ||
    typeof body.data.payment_status !== "string"
  )
    throw new ApiResponseError("Invalid payment status response");
  const data = body.data;
  if (
    (data.order_id !== undefined && data.order_id !== orderId) ||
    (data.checkout_id !== undefined && data.checkout_id !== checkoutId)
  )
    throw new ApiResponseError("Unexpected payment status IDs");
  if (typeof data.payment_status !== "string")
    throw new ApiResponseError("Missing payment status");
  const status = data.payment_status.toLowerCase();
  const code = typeof data.result_code === "string" ? data.result_code : "";
  // The backend can label a pending provider result as failed (HTTP 422).
  if (status === "pending" || /^000\.200\./.test(code)) return "pending";
  if (
    body.success === true &&
    ["paid", "success", "successful"].includes(status) &&
    (!code || /^(000\.000\.|000\.100\.1|000\.[36])/.test(code))
  )
    return "paid";
  if (body.success === false && status === "failed") return "failed";
  return "unknown";
}
export async function fetchPaymentStatus(
  orderId: number,
  checkoutId: string,
  signal?: AbortSignal,
): Promise<PaymentStatus> {
  assertPositiveId(orderId);
  if (!/^[a-zA-Z0-9._-]{1,200}$/.test(checkoutId))
    throw new RangeError("Invalid checkout ID");
  let body: unknown;
  try {
    body = await authenticatedApiRequest("/payments/status", {
      method: "POST",
      body: { order_id: orderId, checkout_id: checkoutId },
      signal,
      timeoutMs: 60_000,
    });
  } catch (error) {
    if (
      !(error instanceof ApiError) ||
      error.status !== 422 ||
      !isRecord(error.details) ||
      !isRecord(error.details.data) ||
      typeof error.details.data.payment_status !== "string"
    )
      throw error;
    body = error.details;
    // An HTTP error must never be interpreted as confirmed payment.
    if (isRecord(body) && body.success === true) throw error;
  }
  signal?.throwIfAborted();
  return parsePaymentStatus(body, orderId, checkoutId);
}
