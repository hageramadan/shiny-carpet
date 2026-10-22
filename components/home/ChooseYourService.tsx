import { FiCheckCircle } from "react-icons/fi";
import PhoneMockup from "./PhoneMockup";

const choices = [
  {
    number: "01",
    title: "اختار اللي يناسبك",
    description:
      "تصفح خدمات الغسيل، اختار المقاس والكمية، وشوف السعر بكل وضوح قبل ما تأكد طلبك.",
    points: ["خيارات سهلة وواضحة", "أسعار قدامك من البداية"],
    screen: "services" as const,
    background: "from-[#e1f5f4] to-[#f2fbfa]",
  },
  {
    number: "02",
    title: "متابعة من البداية للنهاية",
    description:
      "اطمّن على طلبك في كل مرحلة، واستقبل تحديثات واضحة لحد ما يرجع لباب بيتك نظيف ومنتعش.",
    points: ["تحديثات لحظية", "سجل كامل لطلباتك"],
    screen: "orders" as const,
    background: "from-[#f7eedf] to-[#fffcf6]",
  },
  {
    number: "03",
    title: "كل التفاصيل اللي تهمك",
    description:
      "أضف عنوانك، صور القطع، وأي ملاحظات خاصة. كل حاجة بتوصل لفريقنا زي ما كتبتها بالضبط.",
    points: ["ارفع صور بسهولة", "أضف ملاحظاتك الخاصة"],
    screen: "details" as const,
    background: "from-[#dcebed] to-[#f2f8f8]",
  },
];

export default function ChooseYourService() {
  return (
    <section
      aria-labelledby="choose-title"
      className="bg-slate-50/50 py-16 lg:py-20 max-sm:py-9"
    >
      <div className="container mx-auto px-5 sm:px-6 lg:px-8">
        <div className="mb-10 text-center max-sm:mb-6">
          <span className="text-sm font-extrabold text-[#087B82] md:text-base max-sm:text-xs">
            كل حاجة في مكان واحد
          </span>
          <h2
            id="choose-title"
            className="mt-3 text-3xl font-semibold leading-relaxed text-ink lg:text-[43.23px] max-sm:text-2xl max-sm:leading-snug"
          >
            تطبيق واحد… وتحكم أسهل في طلباتك
          </h2>
        </div>
        <div
          role="region"
          aria-label="مميزات التطبيق، اسحب لعرض الكارت التالي"
          tabIndex={0}
          className="grid grid-flow-col auto-cols-[85%] snap-x snap-proximity gap-4 overflow-x-auto overscroll-x-contain pb-3 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary lg:auto-cols-auto lg:grid-flow-row lg:grid-cols-3 lg:gap-8 lg:overflow-visible lg:pb-0"
        >
          {choices.map((choice) => (
            <article
              key={choice.number}
              className={
                "flex h-[571.85px] min-w-0 snap-start flex-col lg:h-auto lg:min-h-184 items-center overflow-hidden rounded-3xl bg-linear-to-br px-4 pt-4 text-center lg:px-6 lg:pt-7 " +
                choice.background
              }
            >
              <span className="border-b border-primary pb-1 text-sm font-extrabold leading-5 text-[#087B82] md:text-base lg:leading-[1.9] max-sm:text-xs">
                {choice.number}
              </span>
              <h3 className="mt-3 text-xl font-bold leading-7 text-ink lg:mt-6 lg:leading-[1.9] max-sm:text-lg max-sm:leading-6">
                {choice.title}
              </h3>
              <p className="mt-2 text-sm leading-6 text-[#607779] md:text-base lg:mt-3 lg:leading-[1.9] max-sm:text-xs">
                {choice.description}
              </p>
              <ul className="mt-3 space-y-2 text-sm leading-6 text-ink md:text-base lg:mt-5 lg:leading-[1.9] max-sm:text-xs">
                {choice.points.map((point) => (
                  <li
                    key={point}
                    className="flex items-center justify-center gap-2"
                  >
                    <FiCheckCircle className="text-primary" />
                    {point}
                  </li>
                ))}
              </ul>
              <PhoneMockup
                screen={choice.screen}
                className="mt-auto pt-3 lg:pt-7"
              />
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
