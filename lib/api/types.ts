export interface ApiCategory {
  id: number;
  name: string;
  image: string | null;
}

export interface ApiProductSize {
  id: number;
  size_type: string;
  is_per_meter: boolean;
  price_before_discount: number | string;
  price_after_discount?: number | string | null;
  length: number | string | null;
  width: number | string | null;
  name?: string;
}

export interface ApiProduct {
  id: number;
  category: ApiCategory;
  name: string;
  description: string;
  min_price_before_discount: number | string;
  min_price_after_discount: number | string | null;
  images: string | null;
  has_discount: boolean;
  price_per_unit: number | string | null;
  price_after_discount: number | string | null;
  has_sizes: 0 | 1 | boolean;
  sizes: ApiProductSize[] | null;
  price?: number | string;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export type CategoriesResponse = ApiResponse<ApiCategory[]>;
export type ProductsResponse = ApiResponse<ApiProduct[]>;
export type ProductDetailsResponse = ApiResponse<ApiProduct>;
