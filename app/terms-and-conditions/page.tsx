import type { Metadata } from "next";
import PolicyPage from "@/components/settings/PolicyPage";
export const metadata: Metadata = { title: "الشروط والأحكام" };
export default function Page() {
  return <PolicyPage kind="terms" />;
}
