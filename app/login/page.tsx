import type { Metadata } from "next";
import AuthForm from "@/components/auth/AuthForm";
import { authDestination } from "@/lib/demo-auth";

export const metadata: Metadata = {
  title: "تسجيل الدخول",
  robots: { index: false, follow: false },
  alternates: { canonical: "/login" },
};

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ next?: string | string[] }>;
}) {
  const { next } = await searchParams;
  return (
    <AuthForm
      destination={authDestination(typeof next === "string" ? next : undefined)}
    />
  );
}
