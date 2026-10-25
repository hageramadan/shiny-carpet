import type { OrderStatus } from "./order-status";
export type Currency = "SAR" | "EGP";
export type ProductSize = {
  id: number;
  label: string;
  price: number;
  originalPrice?: number;
  dimensions?: { length: number; width: number };
};
export type Product = {
  id: string;
  name: string;
  description: string;
  image: string;
  category: string;
  price: number;
  unit: string;
  short?: string;
  tag?: string;
  apiId?: number;
  categoryId?: number;
  currency?: Currency;
  hasSizes?: boolean;
  sizes?: ProductSize[];
  pricePerUnit?: number;
  originalPrice?: number;
};
export type CartItem = {
  cartItemId?: number;
  lineTotal?: number;
  id: string;
  quantity: number;
  size: number;
  sizeLabel?: string;
  sizeId?: number;
  unitPrice?: number;
  product?: Product;
  dimensions?: { length: number; width: number };
};
export type Address = {
  governorateId?: number;
  areaId?: number;
  districtId?: number;
  notes?: string;
  id: string;
  label: string;
  city: string;
  street: string;
  building: string;
  region?: string;
  floor?: string;
  apartment?: string;
  details?: string;
  postalCode?: string;
  country?: string;
  isDefault?: boolean;
  location?: { lat: number; lng: number; label?: string };
};
export type Profile = {
  name: string;
  email: string;
  phone: string;
  image?: string | null;
};
export type OrderPricing = {
  subtotal: number;
  delivery: number;
  tax: number;
  discount: number;
  total: number;
};
export type OrderPhoto = { name: string; type: string; size: number; preview?: string };
export type Order = {
  id: string;
  items: CartItem[];
  total: number;
  address: Address;
  date: string;
  slot: string;
  phone?: string;
  notes?: string;
  photos?: OrderPhoto[];
  coupon?: string;
  pricing?: OrderPricing;
  status?: OrderStatus;
  createdAt: string;
};
export const money = (value: number) =>
  new Intl.NumberFormat("ar-EG", { maximumFractionDigits: 2 }).format(value);
export const cartProduct = (item: CartItem) => item.product;
export const productCurrency = (product?: Product): Currency =>
  product?.currency ?? "EGP";
export const cartCurrency = (items: CartItem[]): Currency =>
  items.length ? productCurrency(cartProduct(items[0])) : "SAR";
export const currencyLabel = (currency: Currency) => (currency === "SAR" ? "ر.س" : "ج.م");
export const productHref = (product: Product) =>
  product.apiId !== undefined ? `/products/${product.apiId}` : `/products/${product.id}`;
export const itemPrice = (item: CartItem) => {
  if (item.lineTotal !== undefined) return item.lineTotal;
  const price =
    item.unitPrice !== undefined
      ? item.unitPrice * item.quantity
      : (cartProduct(item)?.price ?? 0) * item.quantity * item.size;
  return Math.round(price * 100) / 100;
};
export const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
