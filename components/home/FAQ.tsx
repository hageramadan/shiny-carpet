import Link from "next/link";
import { FiArrowLeft, FiChevronDown, FiShoppingBag } from "react-icons/fi";
import { SlPhone } from "react-icons/sl";
const questions = [
  {
    question: "إزاي أطلب خدمة غسيل؟",
    answer:
      "اختر الخدمة والمقاس والكمية، أضف عنوانك وحدد موعد الاستلام. بعد مراجعة التفاصيل تقدر تأكد طلبك من الموقع بكل سهولة.",
  },
  {
    question: "لو مقاس السجادة مش موجود، أعمل إيه؟",
    answer:
      "المقاسات المتاحة موجودة في تفاصيل خدمة غسيل السجاد. لو مش لاقي المقاس المناسب، انتظر اعتماد خيارات المقاسات ومناطق الخدمة قبل إرسال طلب فعلي.",
  },
  {
    question: "السعر بيتحسب إزاي؟",
    answer:
      "السجاد بيتحسب بالمتر المربع، والبطاطين حسب الحجم وعدد القطع. السعر بيظهر قبل التأكيد، وكل الأسعار الموجودة حاليًا ة لحين الربط.",
  },
  {
    question: "إزاي أتابع حالة طلبي؟",
    answer:
      "من صفحة طلباتي افتح الطلب واضغط على التتبع، أو اكتب رقم الطلب في صفحة تتبع الطلب. الحالات الحالية توضيحية للتصميم.",
  },
  {
    question: "هل ينفع أطلب من الموقع مباشرة؟",
    answer:
      "أيوه، رحلة الطلب متاحة من الموقع. النسخة الحالية للمعاينة فقط، والطلبات بتتحفظ على نفس المتصفح من غير تنفيذ خدمة فعلية.",
  },
];

export default function FAQ() {
  return (
    <section
      id="faq"
      aria-labelledby="faq-title"
      className="bg-[#e9f7f7] py-16 lg:py-20 max-sm:py-9"
    >
      <div className="container mx-auto grid items-start gap-10 px-5 sm:px-6 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20 lg:px-8 max-sm:gap-6">
        <div>
          <span className="text-sm font-extrabold text-[#087B82] md:text-base max-sm:text-xs">
            الأسئلة الشائعة
          </span>
          <h2
            id="faq-title"
            className="mt-4 text-3xl font-bold leading-relaxed text-ink lg:text-4xl max-sm:mt-3 max-sm:text-2xl max-sm:leading-snug"
          >
            عندك سؤال؟ إحنا هنا
            <br className="hidden sm:block" /> نساعدك
          </h2>
          <p className="mt-4 text-sm leading-8 text-muted max-sm:mt-3 max-sm:text-xs max-sm:leading-6">
            جمعنالك أهم الأسئلة اللي ممكن تحتاج إجابتها قبل ما تبدأ طلبك.
          </p>
          <Link
            href="/"
            className="mt-7 flex items-center gap-4 rounded-2xl border border-gray-200 bg-white p-5 text-ink max-sm:mt-4 max-sm:p-4"
          >
            <span className="grid size-11 shrink-0 place-items-center rounded-full bg-primary/10 text-xl text-primary max-sm:text-lg">
              <SlPhone />
            </span>
            <span className="flex-1">
              <small className="block text-xs text-[#607779] md:text-[10px]">
                محتاج مساعدة أكتر؟
              </small>
              <strong className="text-sm text-ink max-sm:text-xs">
                تواصل مع فريق خدمة العملاء
              </strong>
            </span>
            <FiArrowLeft />
          </Link>
        </div>
        <div className="border-t border-gray-200">
          {questions.map((item, index) => (
            <details
              key={item.question}
              open={index === 0}
              className="group border-b border-gray-200"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-5 py-6 text-sm font-bold leading-7 text-ink [&::-webkit-details-marker]:hidden max-sm:gap-3 max-sm:text-xs max-sm:leading-6">
                {item.question}
                <span className="grid size-7 shrink-0 place-items-center rounded-full bg-primary text-white">
                  <FiChevronDown className="transition-transform group-open:rotate-180" />
                </span>
              </summary>
              <p className="pb-6 text-sm leading-8 text-muted max-sm:text-xs max-sm:leading-6">
                {item.answer}
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
