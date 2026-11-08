import { localizeMetadata } from "@/lib/i18n/server";
import type { Metadata } from "next";
import PolicyPage from "@/components/settings/PolicyPage";
const metadata: Metadata = { title: "الشروط والأحكام" };
export default function Page() {
  return <PolicyPage kind="terms" />;
}

export async function generateMetadata(): Promise<Metadata> {
  return localizeMetadata(metadata);
}
