import Link from "next/link";
import { FiShoppingBag } from "react-icons/fi";
import { ProductCard } from "@/components/products";
import { products } from "@/lib/data";

export default function Catalog() {
  return (
    <section className="min-h-[70vh] bg-[#f7f9fa] py-5 sm:py-7 lg:pb-16">
      <div className="container mx-auto min-w-0 px-4 sm:px-6 lg:px-8">
        <nav
          aria-label="مسار التصفح"
          className="mb-3 text-xs leading-6 sm:mb-5 text-muted"
        >
          <Link
            href="/"
            className="hover:text-primary"
          >
            الرئيسية
          </Link>
          <span className="mx-2">/</span>
          <span>الخدمات والمنتجات</span>
        </nav>
        <h1 className="text-2xl font-extrabold leading-snug text-[#17202A] sm:text-3xl lg:text-4xl">
          المنتجات
        </h1>
        <p className="mt-2 text-sm leading-7 sm:mt-4 text-[#6B7280] md:text-base">
          حدد القطع التي تريد إضافتها إلى طلبك.
        </p>
        <h2 className="mb-4 mt-6 text-lg sm:mb-6 sm:mt-9 sm:text-xl font-bold text-[#17202A] md:text-[22px]">
          المنتجات المتوفرة
        </h2>
        <div className="grid gap-4 *:min-w-0 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
            />
          ))}
        </div>
        <div className="mt-5 flex flex-col items-stretch justify-between gap-4 rounded-2xl bg-primary/10 p-4 sm:mt-7 sm:gap-5 sm:p-5 sm:flex-row sm:items-center">
          <div className="flex items-start gap-3 sm:items-center sm:gap-4">
            <FiShoppingBag className="shrink-0 text-xl text-primary" />
            <p className="text-sm font-bold leading-7 sm:text-base sm:leading-8 text-ink">
              راجع المقاسات والكميات في السلة قبل استكمال الطلب.
            </p>
          </div>
          <Link
            href="/cart"
            className="inline-flex min-h-12 w-full shrink-0 sm:w-auto items-center justify-center rounded-xl bg-primary px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-ink shadow-button"
          >
            عرض السلة
          </Link>
        </div>
      </div>
    </section>
  );
}
