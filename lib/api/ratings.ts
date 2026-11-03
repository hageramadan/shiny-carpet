import { authenticatedApiRequest } from "../auth/client";
import { ApiError, ApiResponseError } from "./client";
import { assertPositiveId, isRecord } from "./validation";

export async function submitRating(orderId: number, rating: number) {
  assertPositiveId(orderId);
  if (!Number.isInteger(rating) || rating < 1 || rating > 5)
    throw new RangeError("Invalid rating");
  const response = await authenticatedApiRequest("/ratings", {
    method: "POST",
    body: { order_id: orderId, rating },
  });
  if (
    !isRecord(response) ||
    (typeof response.result !== "boolean" && typeof response.success !== "boolean")
  )
    throw new ApiResponseError("Invalid rating response");
  if (
    response.result === false ||
    response.success === false ||
    (response.errNum !== undefined && response.errNum !== 200)
  )
    throw new ApiError(400, response);
}
