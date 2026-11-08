import { localizeMetadata } from "@/lib/i18n/server";
import type { Metadata } from "next";
import Checkout from "@/components/checkout/CheckoutPage";
const metadata: Metadata = {
  title: "استكمال الطلب",
  robots: { index: false, follow: false },
  alternates: { canonical: "/checkout" },
};
export default function Page() {
  return <Checkout />;
}

export async function generateMetadata(): Promise<Metadata> {
  return localizeMetadata(metadata);
}
