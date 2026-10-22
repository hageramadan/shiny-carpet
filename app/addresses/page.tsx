import type { Metadata } from "next";
import AddressesPage from "@/components/addresses/AddressesPage";

export const metadata: Metadata = {
  title: "العناوين المحفوظة",
  robots: { index: false, follow: false },
  alternates: { canonical: "/addresses" },
};

export default function Page() {
  return <AddressesPage />;
}
