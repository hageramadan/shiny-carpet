import type { Metadata } from "next";
import Catalog from "@/components/catalog/Catalog";
export const metadata: Metadata = {
  title: "خدمات غسيل السجاد والبطاطين",
  description: "اختر خدمة غسيل السجاد أو البطاطين وحدد المقاس والكمية المناسبة لبيتك.",
  alternates: { canonical: "/products" },
};
export default function Page() {
  return <Catalog />;
}
