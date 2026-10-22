import type { Metadata } from "next";
import Tracking from "@/components/orders/TrackingPage";
export const metadata: Metadata = {
  title: "تتبع الطلب",
  robots: { index: false, follow: false },
  alternates: { canonical: "/tracking" },
};
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ order?: string }>;
}) {
  const { order } = await searchParams;
  return (
    <Tracking
      key={order || "search"}
      initialId={order}
    />
  );
}
