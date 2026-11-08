import { localizeMetadata } from "@/lib/i18n/server";
import type { Metadata } from "next";
import VerifyOtp from "@/components/auth/VerifyOtp";

const metadata: Metadata = {
  title: "التحقق من الهاتف",
  robots: { index: false, follow: false },
  alternates: { canonical: "/verify-otp" },
};

export default function Page() {
  return <VerifyOtp />;
}

export async function generateMetadata(): Promise<Metadata> {
  return localizeMetadata(metadata);
}
