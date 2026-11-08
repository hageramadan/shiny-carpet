import { localizeMetadata } from "@/lib/i18n/server";
import type { Metadata } from "next";
import Cart from "@/components/cart/CartPage";
const metadata: Metadata = {
  title: "سلة الغسيل",
  robots: { index: false, follow: false },
  alternates: { canonical: "/cart" },
};
export default function Page() {
  return <Cart />;
}

export async function generateMetadata(): Promise<Metadata> {
  return localizeMetadata(metadata);
}
