import type { Metadata } from "next";
import { OrdersPage } from "@/components/orders";
export const metadata: Metadata = {
  title: "طلباتي",
  robots: { index: false, follow: false },
  alternates: { canonical: "/orders" },
};
export default function Page() {
  return <OrdersPage />;
}
