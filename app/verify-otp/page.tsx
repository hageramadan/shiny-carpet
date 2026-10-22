import type { Metadata } from "next";
import VerifyOtp from "@/components/auth/VerifyOtp";

export const metadata: Metadata = {
  title: "التحقق من الهاتف",
  robots: { index: false, follow: false },
  alternates: { canonical: "/verify-otp" },
};

export default function Page() {
  return <VerifyOtp />;
}
