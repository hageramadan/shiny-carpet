import type { Metadata } from "next";
import AuthForm from "@/components/auth/AuthForm";
import { authDestination } from "@/lib/auth-flow";

export const metadata: Metadata = {
  title: "إنشاء حساب",
  robots: { index: false, follow: false },
  alternates: { canonical: "/register" },
};

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ next?: string | string[] }>;
}) {
  const { next } = await searchParams;
  return (
    <AuthForm
      register
      destination={authDestination(typeof next === "string" ? next : undefined)}
    />
  );
}
