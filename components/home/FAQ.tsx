"use client";
import { useTranslation } from "@/components/i18n/LanguageProvider";

import { useSettings } from "@/components/settings/SettingsProvider";
import { FiArrowLeft, FiChevronDown, FiShoppingBag } from "react-icons/fi";
import { SlPhone } from "react-icons/sl";
const questions = [
  {
    question: "كيف أطلب خدماتكم؟",
    answer:
      "من قائمة المنتجات اختر الخدمة المطلوبة، وأضف المقاس للسجاد أو الحجم للبطانيات، والكمية وصور المنتج، وبعدها تقدر تأكد الطلب بكل سهولة.",
  },
  {
    question: "ما أعرف مقاس السجادة أو نوعها، وش أختار؟ وإذا اخترت غلط وش يصير؟",
    answer:
      "اختر الأقرب لك ولا تشيل هم، تقدر تعدل طلبك بأي وقت قبل ما يستلم المندوب الطلب.\n\nومندوبنا لما يوصلك يشيك معاك على المقاسات والأنواع والكميات والأحجام ويعدلها معك حسب الواقع، وبعد الاستلام يتم تأكيد الطلب النهائي.",
  },
  {
    question: "متى أدفع؟ وكيف طريقة الدفع؟",
    answer:
      "تقدر تدفع من داخل المنصة سواء دفع إلكتروني عبر جميع وسائل الدفع، أو تدفع كاش للمندوب بعد الانتهاء من عملية الغسيل وقبل استلام المنتجات من المندوب. وبتظهر لك أيقونة الدفع عند وصول المندوب لموقعك لتسليم طلبك.",
  },
  {
    question: "في حال وجود أي شكوى على المندوب أو على الخدمة، كيف يتم تقديمها؟",
    answer: "يتم التواصل مع خدمة العملاء عبر الواتساب أو الإيميل:",
    contact: true,
  },
  {
    question: "ما هو ضمان الخدمة؟",
    answer:
      "نضمن لك جودة الغسيل، نظافة تامة، وتعقيم، وتعطير، وإذا كانت النتيجة مو مرضية، نعيد غسيلها لك مجاناً.",
    note: "ملاحظة: البقع غير القابلة للإزالة نجتهد ونحاول نزيلها بكل الطرق الآمنة وبالمنظفات الآمنة اللي نستخدمها، أما البقع اللي تحتاج منظفات قوية ممكن تشيل طبقة السجاد العلوية أو تسبب ضرر للسجاد، فلا نستخدمها حفاظاً على سجادك، وبالتالي هذه البقع غير شاملة الضمان",
  },
];

export default function FAQ() {
  const t = useTranslation();
  const {
    data: settings,
    status: settingsStatus,
    reload: reloadSettings,
  } = useSettings();
  const whatsappNumber = settings?.phone?.replace(/\D/g, "").replace(/^00/, "");
  const whatsappHref = whatsappNumber ? `https://wa.me/${whatsappNumber}` : undefined;
  return (
    <section
      id="faq"
      aria-labelledby="faq-title"
      className="bg-[#e9f7f7] py-16 lg:py-20 max-sm:py-9"
    >
      <div className="container mx-auto grid items-start gap-10 px-5 sm:px-6 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20 lg:px-8 max-sm:gap-6">
        <div>
          <span className="text-sm font-extrabold text-[#087B82] md:text-base max-sm:text-xs">
            {t("الأسئلة الشائعة")}
          </span>
          <h2
            id="faq-title"
            className="mt-4 text-3xl font-bold leading-relaxed text-ink lg:text-4xl max-sm:mt-3 max-sm:text-2xl max-sm:leading-snug"
          >
            {t("عندك سؤال؟ إحنا هنا")}
            <br className="hidden sm:block" /> {t(" نساعدك")}
          </h2>
          <p className="mt-4 text-sm leading-8 text-muted max-sm:mt-3 max-sm:text-xs max-sm:leading-6">
            {t("جمعنالك أهم الأسئلة اللي ممكن تحتاج إجابتها قبل ما تبدأ طلبك.")}
          </p>
          <a
            href={whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            aria-disabled={!whatsappHref}
            className="mt-7 flex items-center gap-4 rounded-2xl border border-gray-200 bg-white p-5 text-ink max-sm:mt-4 max-sm:p-4"
          >
            <span className="grid size-11 shrink-0 place-items-center rounded-full bg-primary/10 text-xl text-primary max-sm:text-lg">
              <SlPhone />
            </span>
            <span className="flex-1">
              <small className="block text-xs text-[#607779] md:text-[10px]">
                {t("محتاج مساعدة أكتر؟")}
              </small>
              <strong className="text-sm text-ink max-sm:text-xs">
                {t("تواصل مع فريق خدمة العملاء")}
              </strong>
            </span>
            <FiArrowLeft
              aria-hidden="true"
              className="ltr:rotate-180"
            />
          </a>
        </div>
        <div className="border-t border-gray-200">
          {questions.map((item, index) => (
            <details
              key={item.question}
              open={index === 0}
              className="group border-b border-gray-200"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-5 py-6 text-sm font-bold leading-7 text-ink [&::-webkit-details-marker]:hidden max-sm:gap-3 max-sm:text-xs max-sm:leading-6">
                {t(item.question)}
                <span className="grid size-7 shrink-0 place-items-center rounded-full bg-primary text-white">
                  <FiChevronDown className="transition-transform group-open:rotate-180" />
                </span>
              </summary>
              <div className="pb-6 text-sm leading-8 text-muted max-sm:text-xs max-sm:leading-6">
                <p className="whitespace-pre-line">{t(item.answer)}</p>
                {item.contact && (
                  <div className="mt-3 space-y-2">
                    {settings?.phone && whatsappHref && (
                      <p>
                        {t("واتساب")}:{" "}
                        <a
                          href={whatsappHref}
                          target="_blank"
                          rel="noopener noreferrer"
                          dir="ltr"
                          className="inline-block font-bold text-primary underline underline-offset-4"
                        >
                          {settings.phone}
                        </a>
                      </p>
                    )}
                    {settings?.email && (
                      <p>
                        {t("البريد الإلكتروني")}:{" "}
                        <a
                          href={"mailto:" + settings.email}
                          dir="ltr"
                          className="inline-block break-all font-bold text-primary underline underline-offset-4"
                        >
                          {settings.email}
                        </a>
                      </p>
                    )}
                    {!settings?.phone && !settings?.email && (
                      <p role={settingsStatus === "error" ? "alert" : "status"}>
                        {t(
                          settingsStatus === "loading"
                            ? "جاري تحميل بيانات التواصل…"
                            : "بيانات التواصل غير متاحة حاليًا.",
                        )}
                      </p>
                    )}
                    {settingsStatus === "error" && (
                      <button
                        type="button"
                        onClick={reloadSettings}
                        className="min-h-11 font-bold text-primary underline"
                      >
                        {t("إعادة المحاولة")}
                      </button>
                    )}
                  </div>
                )}
                {item.note && <p className="mt-3">{t(item.note)}</p>}
              </div>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
