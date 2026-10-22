import Link from "next/link";
import { FiArrowLeft, FiMapPin, FiFileText, FiClock } from "react-icons/fi";
import { PiRulerBold } from "react-icons/pi";
import { CiCamera } from "react-icons/ci";

const features = [
  {
    icon: FiMapPin,
    title: "اطلب من أي مكان",
    description: "خدمة سهلة توصلك في الوقت والمكان اللي تختاره",
  },
  {
    icon: PiRulerBold,
    title: "مقاسات تناسب احتياجك",
    description: "خيارات واضحة لكل أنواع السجاد والبطاطين",
  },
  {
    icon: CiCamera,
    title: "صور توضح طلبك",
    description: "أضف صور وملاحظات علشان نهتم بأدق التفاصيل",
  },
  {
    icon: FiClock,
    title: "متابعة خطوة بخطوة",
    description: "اعرف حالة طلبك من الاستلام لحد التسليم",
  },
];

export default function WhyUs() {
  return (
    <section
      id="why"
      aria-labelledby="why-title"
      className="py-16 lg:py-24 max-sm:py-9"
    >
      <div className="container mx-auto grid items-center gap-10 px-5 sm:px-6 lg:grid-cols-2 lg:gap-20 lg:px-8 max-sm:gap-6">
        <div>
          <span className="text-sm font-extrabold text-[#087B82] md:text-base max-sm:text-xs">
            ليه Shiny Carpet؟
          </span>
          <h2
            id="why-title"
            className="mt-4 text-3xl font-semibold leading-[60.52px] tracking-[-1.6px] text-ink lg:text-[43.23px] max-sm:mt-3 max-sm:text-2xl max-sm:leading-9 max-sm:tracking-tight"
          >
            لأن راحتك ونظافة بيتك
            <br className="hidden sm:block" /> يهمونا
          </h2>
          <p className="mt-4 text-sm leading-8 text-[#607779] md:text-base max-sm:mt-3 max-sm:text-xs max-sm:leading-6">
            صممنا كل خطوة علشان نوفر لك تجربة مريحة، واضحة، وتستحق ثقتك.
          </p>
          <Link
            href="/products"
            className="mt-7 inline-flex min-h-12 items-center justify-center gap-5 rounded-xl bg-primary px-6 py-3 text-base font-semibold text-white transition-colors hover:bg-ink shadow-button max-sm:mt-4 max-sm:gap-3 max-sm:px-4 max-sm:text-sm"
          >
            ابدأ طلبك <FiArrowLeft />
          </Link>
        </div>
        <div className="grid overflow-hidden rounded-3xl border border-gray-200 sm:grid-cols-2">
          {features.map(({ icon: Icon, title, description }, index) => (
            <article
              key={title}
              className={
                "flex min-h-28 items-center gap-3 px-4 py-4 sm:min-h-44 sm:gap-4 sm:px-6 sm:py-9 lg:min-h-52 lg:px-8 lg:py-12 " +
                (index < 3 ? "border-b border-gray-200 " : "") +
                (index === 0 ? "sm:border-l " : "") +
                (index === 2 ? "sm:border-b-0 sm:border-l " : "")
              }
            >
              <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-primary/10 text-xl text-primary max-sm:text-lg">
                <Icon />
              </span>
              <div>
                <h3 className="text-base font-bold text-ink max-sm:text-sm">{title}</h3>
                <p className="mt-2 text-sm leading-7 text-muted max-sm:text-xs max-sm:leading-6">
                  {description}
                </p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
