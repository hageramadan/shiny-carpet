import { localizeMetadata } from "@/lib/i18n/server";
import type { Metadata } from "next";
import Tracking from "@/components/orders/TrackingPage";
const metadata: Metadata = {
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

export async function generateMetadata(): Promise<Metadata> {
  return localizeMetadata(metadata);
}
