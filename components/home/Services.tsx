"use client";

import Image from "next/image";
import Link from "next/link";
import { useApiResource } from "@/hooks/useApiResource";
import { FiArrowLeft, FiGrid } from "react-icons/fi";
import { getCategories } from "@/lib/categories";
import ServicesFeedback from "./ServicesFeedback";

const servicesGridClassName =
  "grid grid-flow-col auto-cols-[85%] snap-x snap-proximity gap-4 overflow-x-auto overscroll-x-contain pb-3 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary md:auto-cols-auto md:grid-flow-row md:grid-cols-3 md:gap-6 md:overflow-visible md:pb-0";

function ServicesLoading() {
  return (
    <div
      role="status"
      aria-label="جاري تحميل الخدمات"
      className={servicesGridClassName}
    >
      {[0, 1].map((index) => (
        <div
          key={index}
          aria-hidden="true"
          className="h-[299.9px] min-w-0 animate-pulse rounded-3xl bg-primary/10 motion-reduce:animate-none md:h-[429.9px]"
        />
      ))}
      <span className="sr-only">جاري تحميل الخدمات…</span>
    </div>
  );
}

function ServiceCards() {
  const request = useApiResource("categories", getCategories);
  if (request.status === "loading") return <ServicesLoading />;
  if (request.status === "error")
    return (
      <ServicesFeedback
        error
        onRetry={request.reload}
      />
    );
  const categories = request.data ?? [];
  if (!categories.length) return <ServicesFeedback />;

  return (
    <div
      role="region"
      aria-label="الخدمات، اسحب لعرض الخدمة التالية"
      tabIndex={0}
      className={servicesGridClassName}
    >
      {categories.map((category, index) => (
        <Link
          key={category.id}
          href={`/products?category=${category.id}`}
          aria-label={"عرض منتجات " + category.name}
          className="group relative isolate block h-[299.9px] min-w-0 snap-start overflow-hidden rounded-3xl bg-soft md:h-[429.9px]"
        >
          {category.image ? (
            <Image
              src={category.image}
              alt={category.name}
              fill
              sizes="(max-width: 767px) 85vw, 50vw"
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <FiGrid
              aria-hidden="true"
              className="absolute inset-0 m-auto size-16 text-primary"
            />
          )}
          <div className="absolute inset-0 bg-linear-to-t from-ink via-ink/25 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 p-7 text-white lg:p-9 max-sm:p-4">
            <span className="text-lg font-bold text-cyan-200 max-sm:text-base">
              {String(index + 1).padStart(2, "0")}
            </span>
            <h3 className="mt-3 text-2xl font-bold max-sm:text-xl">{category.name}</h3>
          </div>
        </Link>
      ))}
    </div>
  );
}

export default function Services() {
  return (
    <section
      id="services"
      aria-labelledby="services-title"
      className="py-16 lg:py-20 max-sm:py-9"
    >
      <div className="container mx-auto px-5 sm:px-6 lg:px-8">
        <div className="mb-10 text-center max-sm:mb-6">
          <span className="text-sm font-extrabold text-[#087B82] md:text-base max-sm:text-xs">
            خدماتنا
          </span>
          <h2
            id="services-title"
            className="mt-3 text-3xl font-semibold leading-relaxed text-ink lg:text-[43.23px] max-sm:text-2xl max-sm:leading-snug"
          >
            كل اللي محتاجه لنظافة بيتك
          </h2>
          <p className="mt-3 text-sm md:text-base text-[#607779] max-sm:text-xs">
            خدمات متخصصة بعناية حقيقية لكل قطعة في بيتك.
          </p>
        </div>
        <ServiceCards />
        <div className="mt-8 flex justify-center max-sm:mt-5">
          <Link
            href="/products"
            className="inline-flex min-h-12 items-center justify-center gap-5 rounded-xl bg-[#1CA6AD] px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-ink max-sm:gap-3 max-sm:px-4 max-sm:text-xs"
          >
            استعرض المقاسات والأسعار <FiArrowLeft />
          </Link>
        </div>
      </div>
    </section>
  );
}
