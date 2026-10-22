import type { OrderStatus } from "./order-status";
export const products = [
  {
    id: "carpet",
    name: "سجاد يدوي",
    short: "نظافة من الأعماق، ونعومة من أول لمسة.",
    description:
      "عناية متكاملة بسجاد بيتك، تبدأ بإزالة الأتربة ثم الغسيل والتنظيف العميق، وتنتهي بالتجفيف والتغليف. اختر المقاس والكمية وسيب الباقي علينا.",
    price: 25,
    unit: "م²",
    image: "/images/carpet.jpg",
    category: "السجاد",
    tag: "عناية بكل خيط",
  },
  {
    id: "blanket",
    name: "بطانية",
    short: "دفا نضيف، وريحة تفتح النفس.",
    description:
      "غسيل لطيف للبطاطين يساعد على إزالة الأوساخ والروائح مع الحفاظ على ملمسها الناعم. اختر حجم البطانية وحدد العدد لاستعراض السعر ال.",
    price: 75,
    unit: "قطعة",
    image: "/images/blankets.jpg",
    category: "البطاطين",
    tag: "نعومة تستاهليها",
  },
];
export type Product = (typeof products)[number];
export type CartItem = {
  id: string;
  quantity: number;
  size: number;
  sizeLabel?: string;
  dimensions?: { length: number; width: number };
};
export type Address = {
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
export type Profile = { name: string; email: string; phone: string };
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
export const itemPrice = (item: CartItem) =>
  (products.find((p) => p.id === item.id)?.price ?? 0) * item.quantity * item.size;
export const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3001";
