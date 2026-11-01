import { authenticatedApiRequest } from "../auth/client";
import { ApiResponseError } from "./client";
import { assertPositiveId, isRecord } from "./validation";
import { cartSuccess } from "./cart";

export async function submitRating(orderId: number, rating: number) {
  assertPositiveId(orderId);
  if (!Number.isInteger(rating) || rating < 1 || rating > 5)
    throw new RangeError("Invalid rating");
  const response = await authenticatedApiRequest("/ratings", {
    method: "POST",
    body: { order_id: orderId, rating },
  });
  if (!isRecord(response) || typeof response.success !== "boolean")
    throw new ApiResponseError("Invalid rating response");
  cartSuccess(response);
}
