import { authenticatedApiRequest } from "../auth/client";
import { ApiError, ApiResponseError } from "./client";
import { assertPositiveId, isRecord } from "./validation";

export type TamaraCheckout = {
  orderId: number;
  orderReferenceId: string;
  checkoutId: string;
  checkoutUrl: string;
};

export function isTamaraApprovedReturn(search: string, orderId: string): boolean {
  const query = new URLSearchParams(search);
  return (
    /^[1-9]\d*$/.test(orderId) &&
    Number.isSafeInteger(Number(orderId)) &&
    query.getAll("order").length === 1 &&
    query.get("order") === orderId &&
    query.getAll("payment_status").length === 1 &&
    query.get("payment_status") === "approved"
  );
}

export function parseTamaraCheckout(body: unknown, orderId: number): TamaraCheckout {
  if (!isRecord(body)) throw new ApiResponseError("Invalid Tamara response");
  if (body.result !== true) throw new ApiError(400, body);
  const data = body.data;
  const validId = (value: unknown): value is string =>
    typeof value === "string" && /^[a-zA-Z0-9._-]{1,200}$/.test(value);
  if (
    !isRecord(data) ||
    data.order_id !== orderId ||
    !validId(data.order_reference_id) ||
    !isRecord(data.checkout_response) ||
    !validId(data.checkout_response.checkout_id) ||
    data.checkout_response.order_id !== data.order_reference_id ||
    typeof data.checkout_url !== "string" ||
    data.checkout_response.checkout_url !== data.checkout_url
  )
    throw new ApiResponseError("Invalid Tamara checkout data");
  let url: URL;
  try {
    url = new URL(data.checkout_url);
  } catch {
    throw new ApiResponseError("Invalid Tamara checkout URL");
  }
  if (
    !["https://checkout.tamara.co", "https://checkout-sandbox.tamara.co"].includes(
      url.origin,
    ) ||
    url.username ||
    url.password ||
    url.hash ||
    url.pathname !== "/checkout/" + data.checkout_response.checkout_id
  )
    throw new ApiResponseError("Unexpected Tamara checkout URL");
  return {
    orderId,
    orderReferenceId: data.order_reference_id,
    checkoutId: data.checkout_response.checkout_id,
    checkoutUrl: url.href,
  };
}

export async function createTamaraCheckout(orderId: number, signal?: AbortSignal) {
  assertPositiveId(orderId);
  const body = await authenticatedApiRequest("/payments/tamara/checkout", {
    method: "POST",
    body: {
      order_id: orderId,
      redirect_url: "https://shiny-carpet.vercel.app/tracking",
    },
    signal,
  });
  signal?.throwIfAborted();
  return parseTamaraCheckout(body, orderId);
}

// Only the backend confirmation for the expected order can mark Tamara as paid.
export function parseTamaraPaymentStatus(
  body: unknown,
  orderId: number,
): "paid" | "unknown" {
  if (!isRecord(body)) throw new ApiResponseError("Invalid Tamara payment response");
  if (body.result !== true) throw new ApiError(400, body);
  if (!isRecord(body.data) || body.data.order_id !== orderId)
    throw new ApiResponseError("Unexpected Tamara payment order");
  return body.errNum === 200 && body.message === "Payment successful"
    ? "paid"
    : "unknown";
}

export async function fetchTamaraPaymentStatus(
  orderId: number,
  orderReferenceId: string,
  signal?: AbortSignal,
) {
  assertPositiveId(orderId);
  if (!/^[a-zA-Z0-9._-]{1,200}$/.test(orderReferenceId))
    throw new RangeError("Invalid Tamara reference");
  const body = await authenticatedApiRequest(
    "/payment/tamara/success?order_reference_id=" + encodeURIComponent(orderReferenceId),
    { method: "GET", signal },
  );
  signal?.throwIfAborted();
  return parseTamaraPaymentStatus(body, orderId);
}
