import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { products } from "@/lib/data";
import ProductDetails from "@/components/catalog/ProductDetails";
export function generateStaticParams() {
  return products.map((p) => ({ id: p.id }));
}
export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const p = products.find((p) => p.id === id);
  return {
    title: p?.name ?? "خدمة غير موجودة",
    description: p?.description,
    alternates: { canonical: `/products/${id}` },
  };
}
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const p = products.find((p) => p.id === id);
  if (!p) notFound();
  return (
    <ProductDetails
      key={p.id}
      product={p}
    />
  );
}
