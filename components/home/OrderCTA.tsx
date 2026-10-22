import Image from "next/image";
import Link from "next/link";
import { FiArrowLeft } from "react-icons/fi";

export default function OrderCTA() {
  return (
    <section
      aria-labelledby="order-cta-title"
      className="py-16 lg:py-20 max-sm:py-9"
    >
      <div className="container mx-auto px-5 sm:px-6 lg:px-8">
        <div className="relative isolate overflow-hidden rounded-3xl bg-[#095d63] text-white md:flex md:items-center">
          <div className="relative z-10 min-w-0 flex-1 px-6 py-8 sm:px-8 md:py-6 lg:py-8 max-sm:px-4 max-sm:py-6">
            <span className="text-sm font-extrabold md:text-base text-[#C6F4F5] max-sm:text-xs">
              ابدأ دلوقتي
            </span>
            <h2
              id="order-cta-title"
              className="mt-4 text-3xl font-semibold leading-relaxed lg:text-[43.23px] max-sm:mt-3 max-sm:text-2xl max-sm:leading-snug"
            >
              جاهز تدي سجادك
              <br />
              العناية اللي يستحقها؟
            </h2>
            <div className="mt-7 flex flex-wrap gap-3 max-sm:mt-4">
              <Link
                href="#download"
                className="inline-flex min-h-12 items-center justify-center rounded-xl border border-gray-200 px-5 py-3 text-sm font-bold transition-colors hover:bg-white/10 max-sm:text-xs"
              >
                حمل التطبيق
              </Link>
              <Link
                href="/products"
                className="inline-flex min-h-12 items-center justify-center gap-5 rounded-xl bg-white px-5 py-3 text-sm font-extrabold text-[#087B82] md:text-base transition-colors hover:bg-slate-100 max-sm:gap-3 max-sm:text-xs"
              >
                اطلب الآن <FiArrowLeft />
              </Link>
            </div>
          </div>
          <div className="relative aspect-157/74 w-full shrink-0 overflow-hidden rounded-tr-[100px] md:aspect-auto md:h-92.5 md:w-1/2 md:rounded-tr-[160px] xl:w-196.25">
            <Image
              src="/images/cover-living.png"
              alt="سجاد نظيف يضيف الدفء والراحة لبيتك"
              width={785}
              height={370}
              quality={100}
              sizes="(min-width: 1280px) 785px, (min-width: 768px) 50vw, 100vw"
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-linear-to-l from-[#095d63]/35 to-transparent" />
          </div>
        </div>
      </div>
    </section>
  );
}
