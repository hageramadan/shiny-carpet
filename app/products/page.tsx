import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Catalog from "@/components/catalog/Catalog";
export const metadata: Metadata = {
  title: "خدمات غسيل السجاد والبطاطين",
  description: "اختر خدمة غسيل السجاد أو البطاطين وحدد المقاس والكمية المناسبة لبيتك.",
  alternates: { canonical: "/products" },
};
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ category?: string | string[] }>;
}) {
  const { category } = await searchParams;
  if (
    category !== undefined &&
    (typeof category !== "string" ||
      !/^[1-9]\d*$/.test(category) ||
      !Number.isSafeInteger(Number(category)))
  )
    notFound();
  return <Catalog categoryId={category === undefined ? undefined : Number(category)} />;
}
