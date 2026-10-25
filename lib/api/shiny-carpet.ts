import { getJson, postJson } from "./client";
import { assertPositiveId } from "./validation";

export type CustomProductInput = { width: number; length: number; quantity: number };

export function getCustomProductPrice(
  productId: number,
  input: CustomProductInput,
  signal?: AbortSignal,
): Promise<unknown> {
  assertPositiveId(productId);
  if (
    !Number.isFinite(input.width) ||
    input.width < 0.1 ||
    input.width > 20 ||
    !Number.isFinite(input.length) ||
    input.length < 0.1 ||
    input.length > 20 ||
    !Number.isSafeInteger(input.quantity) ||
    input.quantity < 1 ||
    input.quantity > 99
  ) {
    throw new RangeError("Invalid custom product dimensions or quantity");
  }
  return postJson(
    `/products/${productId}/custom`,
    {
      width: input.width,
      length: input.length,
      quantity: input.quantity,
    },
    signal,
  );
}

export const getCategories = (signal?: AbortSignal): Promise<unknown> =>
  getJson("/categories", signal);

export const getProductsByCategory = (
  categoryId: number,
  signal?: AbortSignal,
): Promise<unknown> => {
  assertPositiveId(categoryId);
  return getJson(`/products/category/${categoryId}`, signal);
};

export const getProductDetails = (
  productId: number,
  signal?: AbortSignal,
): Promise<unknown> => {
  assertPositiveId(productId);
  return getJson(`/products/${productId}`, signal);
};
