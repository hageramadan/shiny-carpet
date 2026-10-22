import type { Metadata } from "next";
import AddressEditorPage from "@/components/addresses/AddressEditorPage";

export const metadata: Metadata = {
  title: "إضافة عنوان جديد",
  robots: { index: false, follow: false },
};

export default function Page() {
  return <AddressEditorPage />;
}
