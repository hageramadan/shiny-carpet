"use client";
import { useSettings } from "@/components/settings/SettingsProvider";
import Link from "next/link";
import type { ReactNode } from "react";

export const authInputClass =
  "min-h-11 w-full min-w-0 rounded-[9px] border border-gray-200 bg-white px-3 py-2 text-sm font-normal text-ink placeholder:text-muted transition-colors hover:border-primary/50";
export const authButtonClass =
  "inline-flex min-h-11 w-full items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-ink disabled:cursor-not-allowed shadow-button";

export default function AuthLayout({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  const { data: settings } = useSettings();
  return (
    <section
      className="min-h-[65vh] bg-[#f7f9fa] bg-cover bg-center pb-10 pt-6 text-ink"
      style={
        settings?.loginBackground
          ? {
              backgroundImage: `linear-gradient(#f7f9faf0, #f7f9faf0), url("${settings.loginBackground}")`,
            }
          : undefined
      }
    >
      <div className="container mx-auto px-5 sm:px-6 lg:px-8">
        <nav
          aria-label="مسار التصفح"
          className="mb-3 text-xs text-muted"
        >
          <ol className="flex flex-wrap items-center gap-1">
            <li>
              <Link
                href="/"
                className="transition-colors hover:text-primary"
              >
                الرئيسية
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li aria-current="page">{title}</li>
          </ol>
        </nav>
        <h1 className="text-[30px] font-extrabold leading-normal text-[#17202A] sm:text-4xl">
          {title}
        </h1>
        <p className="mt-3 text-sm leading-6 text-muted">{description}</p>
        <div className="mx-auto mt-6 w-full max-w-xl rounded-xl border border-gray-200 bg-white p-4">
          {children}
        </div>
      </div>
    </section>
  );
}
