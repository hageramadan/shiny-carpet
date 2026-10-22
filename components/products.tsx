import Image from "next/image";
import Link from "next/link";
import { FiPlus } from "react-icons/fi";
import { money, type Product } from "@/lib/data";

export function ProductCard({ product }: { product: Product }) {
  const carpet = product.category === "السجاد";
  return (
    <article className="flex min-w-0 flex-col rounded-2xl border border-gray-200 bg-white p-3 shadow-sm">
      <Link
        href={"/products/" + product.id}
        className="relative block aspect-[3/2] overflow-hidden rounded-xl bg-white"
      >
        <Image
          src={product.image}
          alt={product.name}
          fill
          sizes="(max-width: 639px) 100vw, (max-width: 1023px) 50vw, 33vw"
          className="object-cover transition-transform duration-300 hover:scale-105"
        />
      </Link>
      <div className="flex flex-1 flex-col px-1 pt-4">
        <h2 className="text-base font-bold text-[#17202A]">
          <Link href={"/products/" + product.id}>{product.name}</Link>
        </h2>
        <p className="mt-2 text-sm leading-6 text-[#6B7280]">
          {carpet ? "١ × ٢ · ٢ × ٢ · ٢ × ٣ · غير ذلك" : "شخص · شخصين · غير ذلك"}
        </p>
        <div className="mt-auto flex items-center justify-between gap-4 pt-3">
          <span className="text-base font-bold text-primary">
            {money(product.price)}{" "}
            <small className="text-xs">ج.م</small>
          </span>
          <Link
            href={"/products/" + product.id}
            aria-label={"اختيار مقاس " + product.name + " وإضافته للسلة"}
            className="grid size-10 shrink-0 place-items-center rounded-full bg-primary text-xl text-white transition-colors hover:bg-ink"
          >
            <FiPlus />
          </Link>
        </div>
      </div>
    </article>
  );
}
