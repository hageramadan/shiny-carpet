import type { Metadata } from "next";
import ProfilePage from "@/components/account/ProfilePage";
export const metadata: Metadata = {
  title: "حسابي",
  robots: { index: false, follow: false },
  alternates: { canonical: "/profile" },
};
export default function Page() {
  return <ProfilePage />;
}
