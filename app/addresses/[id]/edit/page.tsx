import type { Metadata } from "next";
import AddressEditorPage from "@/components/addresses/AddressEditorPage";

export const metadata: Metadata = {
  title: "تعديل العنوان",
  robots: { index: false, follow: false },
};

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <AddressEditorPage id={id} />;
}
