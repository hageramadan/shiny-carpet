import type {
  CategoriesResponse,
  ProductsResponse,
  ProductDetailsResponse,
} from "./types";

const API_BASE_URL = "https://admin.shinycarpet-sa.com/api";

export class ApiError extends Error {
  constructor(public readonly status: number) {
    super(`HTTP error! status: ${status}`);
    this.name = "ApiError";
  }
}

async function request<T>(path: string, signal?: AbortSignal): Promise<T> {
  const timeout = AbortSignal.timeout(10000);
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: "GET",
    headers: { Accept: "application/json", "Accept-Language": "ar" },
    cache: "no-store",
    signal: signal ? AbortSignal.any([signal, timeout]) : timeout,
  });
  if (!response.ok) throw new ApiError(response.status);
  return response.json();
}

function validId(id: number) {
  if (!Number.isSafeInteger(id) || id <= 0) throw new Error("Invalid ID");
}

export const getCategories = (signal?: AbortSignal): Promise<CategoriesResponse> =>
  request("/categories", signal);

export const getProductsByCategory = (
  categoryId: number,
  signal?: AbortSignal,
): Promise<ProductsResponse> => {
  validId(categoryId);
  return request(`/products/category/${categoryId}`, signal);
};

export const getProductDetails = (
  productId: number,
  signal?: AbortSignal,
): Promise<ProductDetailsResponse> => {
  validId(productId);
  return request(`/products/${productId}`, signal);
};
