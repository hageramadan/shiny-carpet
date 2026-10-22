import Link from "next/link";
import type { ReactNode } from "react";

export default function AddressesLayout({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className="min-h-[65vh] bg-[#f7f9fa] pb-10 pt-6 text-ink">
      <div className="container mx-auto px-5 sm:px-6 lg:px-8">
        <nav
          aria-label="مسار التصفح"
          className="mb-3 text-xs text-muted"
        >
          <ol className="flex flex-wrap items-center gap-1">
            <li>
              <Link
                href="/"
                className="hover:text-primary"
              >
                الرئيسية
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            {title !== "العناوين المحفوظة" && (
              <>
                <li>
                  <Link
                    href="/addresses"
                    className="hover:text-primary"
                  >
                    العناوين المحفوظة
                  </Link>
                </li>
                <li aria-hidden="true">/</li>
              </>
            )}
            <li aria-current="page">{title}</li>
          </ol>
        </nav>
        <h1 className="text-[30px] font-extrabold leading-normal text-[#17202A] sm:text-4xl">
          {title}
        </h1>
        <p className="mt-3 text-sm md:text-base  text-[#607779]">{description}</p>
        <div className="mt-6">{children}</div>
      </div>
    </section>
  );
}
