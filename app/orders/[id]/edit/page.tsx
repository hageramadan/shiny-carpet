import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { localizeMetadata } from "@/lib/i18n/server";
import OrderEditPage from "@/components/orders/OrderEditPage";
export async function generateMetadata(): Promise<Metadata> {
  return localizeMetadata({
    title: "تعديل الطلب",
    robots: { index: false, follow: false },
  });
}
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[1-9]\d*$/.test(id) || !Number.isSafeInteger(Number(id))) notFound();
  return <OrderEditPage id={Number(id)} />;
}
