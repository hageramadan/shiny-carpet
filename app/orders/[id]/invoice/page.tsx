import type { Metadata } from "next";
import { notFound } from "next/navigation";
import InvoicePage from "@/components/orders/InvoicePage";

export const metadata: Metadata = {
  title: "الفاتورة",
  robots: { index: false, follow: false },
};
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[1-9]\d*$/.test(id) || !Number.isSafeInteger(Number(id))) notFound();
  return <InvoicePage id={Number(id)} />;
}
