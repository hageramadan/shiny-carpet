import type { Metadata } from "next";
import PolicyPage from "@/components/settings/PolicyPage";
export const metadata: Metadata = { title: "سياسة الخصوصية" };
export default function Page() {
  return <PolicyPage kind="privacy" />;
}
