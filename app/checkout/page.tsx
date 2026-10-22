import type { Metadata } from "next";
import Checkout from "@/components/checkout/CheckoutPage";
export const metadata: Metadata = {
  title: "استكمال الطلب",
  robots: { index: false, follow: false },
  alternates: { canonical: "/checkout" },
};
export default function Page() {
  return <Checkout />;
}
