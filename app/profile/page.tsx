import { localizeMetadata } from "@/lib/i18n/server";
import type { Metadata } from "next";
import ProfilePage from "@/components/account/ProfilePage";
const metadata: Metadata = {
  title: "حسابي",
  robots: { index: false, follow: false },
  alternates: { canonical: "/profile" },
};
export default function Page() {
  return <ProfilePage />;
}

export async function generateMetadata(): Promise<Metadata> {
  return localizeMetadata(metadata);
}
