import Image from "next/image";
import Link from "next/link";
import { FiArrowLeft } from "react-icons/fi";

const services = [
  {
    id: "carpet",
    number: "01",
    title: "غسيل السجاد",
    description: "عناية بسجادك بمختلف أنواعه ومقاساته.",
    image: "/images/carpet1.png",
  },
  {
    id: "blanket",
    number: "02",
    title: "غسيل البطاطين",
    description: "نظافة وانتعاش لبطاطينك مع الحفاظ على نعومتها.",
    image: "/images/blanket1.png",
  },
];

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
        <div
          role="region"
          aria-label="الخدمات، اسحب لعرض الخدمة التالية"
          tabIndex={0}
          className="grid grid-flow-col auto-cols-[85%] snap-x snap-proximity gap-4 overflow-x-auto overscroll-x-contain pb-3 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary md:auto-cols-auto md:grid-flow-row md:grid-cols-2 md:gap-6 md:overflow-visible md:pb-0"
        >
          {services.map((service) => (
            <Link
              key={service.id}
              href={"/products/" + service.id}
              className="group relative isolate block h-[299.9px] min-w-0 snap-start overflow-hidden rounded-3xl md:h-[429.9px]"
            >
              <Image
                src={service.image}
                alt={service.title}
                fill
                sizes="(max-width: 767px) 85vw, 50vw"
                className="object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-linear-to-t from-ink via-ink/25 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-7 text-white lg:p-9 max-sm:p-4">
                <span className="text-lg font-bold text-cyan-200 max-sm:text-base">
                  {service.number}
                </span>
                <h3 className="mt-3 text-2xl font-bold max-sm:text-xl">
                  {service.title}
                </h3>
                <p className="mt-2 text-sm leading-7 text-white/80 max-sm:text-xs max-sm:leading-6">
                  {service.description}
                </p>
              </div>
            </Link>
          ))}
        </div>
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
