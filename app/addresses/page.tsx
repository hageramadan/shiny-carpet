import { localizeMetadata } from "@/lib/i18n/server";
import type { Metadata } from "next";
import AddressesPage from "@/components/addresses/AddressesPage";

const metadata: Metadata = {
  title: "العناوين المحفوظة",
  robots: { index: false, follow: false },
  alternates: { canonical: "/addresses" },
};

export default function Page() {
  return <AddressesPage />;
}

export async function generateMetadata(): Promise<Metadata> {
  return localizeMetadata(metadata);
}
