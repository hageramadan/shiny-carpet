import { localizeMetadata } from "@/lib/i18n/server";
import type { Metadata } from "next";
import { OrdersPage } from "@/components/orders";
const metadata: Metadata = {
  title: "طلباتي",
  robots: { index: false, follow: false },
  alternates: { canonical: "/orders" },
};
export default function Page() {
  return <OrdersPage />;
}

export async function generateMetadata(): Promise<Metadata> {
  return localizeMetadata(metadata);
}
