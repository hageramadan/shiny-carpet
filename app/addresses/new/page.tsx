import { localizeMetadata } from "@/lib/i18n/server";
import type { Metadata } from "next";
import AddressEditorPage from "@/components/addresses/AddressEditorPage";

const metadata: Metadata = {
  title: "إضافة عنوان جديد",
  robots: { index: false, follow: false },
};

export default function Page() {
  return <AddressEditorPage />;
}

export async function generateMetadata(): Promise<Metadata> {
  return localizeMetadata(metadata);
}
