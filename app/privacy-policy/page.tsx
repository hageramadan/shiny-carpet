import { localizeMetadata } from "@/lib/i18n/server";
import type { Metadata } from "next";
import PolicyPage from "@/components/settings/PolicyPage";
const metadata: Metadata = { title: "سياسة الخصوصية" };
export default function Page() {
  return <PolicyPage kind="privacy" />;
}

export async function generateMetadata(): Promise<Metadata> {
  return localizeMetadata(metadata);
}
