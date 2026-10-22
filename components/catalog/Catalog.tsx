import Link from "next/link";
import { FiShoppingBag } from "react-icons/fi";
import { ProductCard } from "@/components/products";
import { products } from "@/lib/data";

export default function Catalog() {
  return (
    <section className="min-h-[70vh] bg-[#f7f9fa] py-7 lg:pb-16">
      <div className="container mx-auto px-5 sm:px-6 lg:px-8">
        <nav
          aria-label="مسار التصفح"
          className="mb-5 text-xs leading-6 text-muted"
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
        <h1 className="text-3xl font-extrabold text-[#17202A] lg:text-4xl">المنتجات</h1>
        <p className="mt-4 text-sm leading-7 text-[#6B7280] md:text-base">
          حدد القطع التي تريد إضافتها إلى طلبك.
        </p>
        <h2 className="mb-6 mt-9 text-xl font-bold text-[#17202A] md:text-[22px]">المنتجات المتوفرة</h2>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
            />
          ))}
        </div>
        <div className="mt-7 flex flex-col items-start justify-between gap-5 rounded-2xl bg-primary/10 p-5 sm:flex-row sm:items-center">
          <div className="flex items-center gap-4">
            <FiShoppingBag className="shrink-0 text-xl text-primary" />
            <p className="text-base font-bold leading-8 text-ink">
              راجع المقاسات والكميات في السلة قبل استكمال الطلب.
            </p>
          </div>
          <Link
            href="/cart"
            className="inline-flex min-h-12 shrink-0 items-center justify-center rounded-xl bg-primary px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-ink shadow-button"
          >
            عرض السلة
          </Link>
        </div>
    
      </div>
    </section>
  );
}
