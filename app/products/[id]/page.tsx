import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import ClientProductPage from "@/components/catalog/ClientProductPage";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ category?: string | string[] }>;
};
function positiveId(value: unknown): number | undefined {
  return typeof value === "string" &&
    /^[1-9]\d*$/.test(value) &&
    Number.isSafeInteger(Number(value))
    ? Number(value)
    : undefined;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  return { title: "تفاصيل المنتج", alternates: { canonical: `/products/${id}` } };
}

export default async function Page({ params, searchParams }: Props) {
  const { id } = await params;
  if (id === "carpet") redirect("/products?category=16");
  if (id === "blanket") redirect("/products?category=18");
  const { category } = await searchParams;
  const productId = positiveId(id),
    categoryId = positiveId(category);
  if (!productId || (category !== undefined && !categoryId)) notFound();
  return (
    <ClientProductPage
      id={productId}
      categoryId={categoryId}
    />
  );
}
