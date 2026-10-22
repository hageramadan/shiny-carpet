import type { Metadata } from "next";
import Confirmation from "@/components/orders/ConfirmationPage";
export const metadata: Metadata = {
  title: "تأكيد الطلب",
  robots: { index: false, follow: false },
  alternates: { canonical: "/order-confirmation" },
};
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ order?: string }>;
}) {
  const { order } = await searchParams;
  return <Confirmation id={order} />;
}
