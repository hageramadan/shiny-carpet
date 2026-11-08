import { localizeMetadata } from "@/lib/i18n/server";
import type { Metadata } from "next";
import AddressEditorPage from "@/components/addresses/AddressEditorPage";

const metadata: Metadata = {
  title: "تعديل العنوان",
  robots: { index: false, follow: false },
};

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <AddressEditorPage id={id} />;
}

export async function generateMetadata(): Promise<Metadata> {
  return localizeMetadata(metadata);
}
