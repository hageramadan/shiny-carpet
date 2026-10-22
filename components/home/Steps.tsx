import { FiGrid, FiFileText, FiTruck } from "react-icons/fi";
import { PiRulerBold } from "react-icons/pi";

const steps = [
  { number: "01", icon: FiGrid, title: "اختر الخدمة", description: "سجاد أو بطاطين" },
  {
    number: "02",
    icon: PiRulerBold,
    title: "حدد المقاس والكمية",
    description: "اللي يناسب احتياجك",
  },
  {
    number: "03",
    icon: FiFileText,
    title: "أكد تفاصيل طلبك",
    description: "اختر عنوانك وموعد الاستلام",
  },
  {
    number: "04",
    icon: FiTruck,
    title: "تابع طلبك",
    description: "من أول خطوة لحد الاستلام",
  },
];

export default function Steps() {
  return (
    <section
      id="how"
      aria-labelledby="steps-title"
      className="bg-slate-50 py-16 lg:py-20 max-sm:py-9"
    >
      <div className="container mx-auto px-5 sm:px-6 lg:px-8">
        <div className="text-center">
          <span className="text-sm font-extrabold text-[#087B82] md:text-base max-sm:text-xs">
            خطوات بسيطة
          </span>
          <h2
            id="steps-title"
            className="mt-3 text-3xl font-semibold leading-relaxed text-ink lg:text-[43.23px] max-sm:text-2xl max-sm:leading-snug"
          >
            من أول طلبك لحد باب بيتك
          </h2>
          <p className="mt-3 text-sm md:text-base text-[#607779] max-sm:text-xs">
            أربع خطوات بس، وإحنا نهتم بكل اللي بعد كده.
          </p>
        </div>
        <div className="relative mt-12 max-sm:mt-6">
          <div
            aria-hidden="true"
            className="absolute inset-x-[12.5%] top-9 hidden border-t border-dashed border-gray-200 lg:block"
          />
          <ol
            aria-label="خطوات الطلب، اسحب لعرض باقي الخطوات"
            tabIndex={0}
            className="relative grid grid-flow-col auto-cols-[calc((100%_-_2rem)/2.5)] snap-x snap-proximity gap-4 overflow-x-auto overscroll-x-contain pb-3 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary lg:auto-cols-auto lg:grid-flow-row lg:grid-cols-4 lg:gap-8 lg:overflow-visible lg:pb-0"
          >
            {steps.map(({ number, icon: Icon, title, description }) => (
              <li
                key={number}
                className="relative min-w-0 snap-start text-center"
              >
                <div className="relative mx-auto grid size-18 place-items-center rounded-full border border-gray-200 bg-white text-2xl text-primary shadow-sm max-sm:text-xl">
                  <Icon />
                  <span className="absolute -right-1 top-0 grid size-5 place-items-center rounded-full bg-primary text-[10px] font-bold text-white">
                    {number}
                  </span>
                </div>
                <h3 className="mt-5 text-base font-bold text-ink max-sm:mt-3 max-sm:text-sm">
                  {title}
                </h3>
                <p className="mt-2 text-sm leading-7 text-muted max-sm:text-xs max-sm:leading-6">
                  {description}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
