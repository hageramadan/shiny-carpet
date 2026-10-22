import type { Metadata } from "next";
import Cart from "@/components/cart/CartPage";
export const metadata: Metadata = {
  title: "سلة الغسيل",
  robots: { index: false, follow: false },
  alternates: { canonical: "/cart" },
};
export default function Page() {
  return <Cart />;
}
