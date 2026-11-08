"use client";
import { useTranslation } from "@/components/i18n/LanguageProvider";
import Image from "next/image";
import AppStoreBadges from "./AppStoreBadges";

export default function DownloadApp() {
  const t = useTranslation();
  return (
    <section
      id="download"
      aria-labelledby="download-title"
      className="overflow-hidden bg-linear-to-l from-[#1ca6ad] to-[#087d85] text-white md:h-136.25"
    >
      <div className="container mx-auto grid items-center px-5 sm:px-6 md:h-full md:grid-cols-2 md:gap-8 lg:gap-16 lg:px-8">
        <div className="py-10 md:py-12 max-sm:py-7">
          <span className="text-xs font-bold text-white/80">
            {t("تطبيق شايني كاربت")}
          </span>
          <h2
            id="download-title"
            className="mt-3 text-4xl font-semibold leading-normal lg:text-[43.23px] max-sm:text-3xl max-sm:leading-snug"
          >
            {t("نظافة بيتك…")}
            <br />
            {t("في إيدك!")}
          </h2>
          <p className="mt-3 max-w-110 text-sm leading-7 text-white/80 max-sm:text-xs max-sm:leading-6">
            {t(
              "حمّل تطبيق شايني كاربت واطلب خدمة الغسيل في خطوات بسيطة، تابع طلباتك، وخلّي كل التفاصيل قدامك في مكان واحد.",
            )}
          </p>
          <div className="mt-5 max-sm:mt-3">
            <AppStoreBadges />
          </div>
        </div>
        <div className="relative mx-auto flex h-80 w-full max-w-140 items-end justify-center sm:h-96 md:h-full md:min-w-0 md:max-w-none">
          <Image
            src="/images/download.png"
            alt={t(
              "معاينة تطبيق شايني كاربت على هاتفين تعرض تفاصيل الخدمة واستكمال الطلب",
            )}
            width={2069}
            height={1635}
            quality={100}
            sizes="(min-width: 1536px) 704px, (min-width: 1280px) 660px, (min-width: 1024px) 520px, (min-width: 768px) 400px, (min-width: 640px) 560px, 100vw"
            className="h-auto w-full max-w-none shrink-0 object-contain object-bottom md:w-100 lg:w-130 xl:w-165 2xl:w-176"
          />
        </div>
      </div>
    </section>
  );
}
