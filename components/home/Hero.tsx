import Link from "next/link";
import Image from "next/image";
import { FiArrowLeft, FiArrowUpLeft, FiCheck } from "react-icons/fi";
import { PiSparkle } from "react-icons/pi";
import CustomerTrust from "./CustomerTrust";
import HeroPhone from "./HeroPhone";

export default function Hero() {
  return (
    <section className="overflow-hidden bg-linear-to-bl from-[#F3FBFB] via-white to-[#F9F6F0]">
      <div className="container grid grid-cols-1 gap-11.25 items-center min-h-0 pt-9 pb-11 mx-auto sm:grid-cols-[1fr_1.06fr] sm:gap-7.5 sm:min-h-150 sm:pt-13.75 sm:pb-17.5 md:gap-10 md:min-h-165 lg:gap-16.25 xl:gap-25 xl:min-h-180 px-5 sm:px-6 lg:px-8 max-sm:gap-7 max-sm:pt-6 max-sm:pb-8">
        <div className="text-center sm:[text-align:inherit]">
          <span className="text-[13px] font-extrabold text-[#087B82] inline-flex items-center gap-2.25 sm:text-[14px] max-sm:text-xs">
            شايني كاربت | عناية تستحقها تفاصيل بيتك <PiSparkle className="text-[19px]" />
          </span>
          <h1 className="mt-4.25 mb-3.75 leading-[1.4] text-[32px] font-extrabold tracking-[-1.7px] min-[361px]:text-4xl sm:mt-5.75 sm:mb-4.5 sm:text-[49px] md:text-[55px] lg:text-[65px] xl:text-[71px] max-sm:mt-3 max-sm:mb-3 max-sm:leading-snug max-sm:tracking-tight">
            <span className="max-sm:whitespace-nowrap">
              سجادك <br className="hidden sm:block" />
              وبطاطينك…
            </span>
            <br />
            <span className="text-primary whitespace-nowrap min-[361px]:[white-space:inherit]">
              نظافتهم علينا!
            </span>
          </h1>
          <p className="text-[#607779] text-[14px] max-w-82.5 mx-auto sm:max-w-129.75 sm:mx-0 md:text-[17px] max-sm:text-xs">
            اطلب خدمة الغسيل بكل سهولة، اختار المقاس والكمية، وحدد عنوانك، وسيب الباقي
            علينا. مع شايني كاربت، النظافة بقت أسهل وأقرب ليك.
          </p>
          <div className="flex gap-2.5 mt-5.75 justify-center sm:gap-2 sm:mt-7 sm:[justify-content:initial] md:gap-3 max-sm:mt-4">
            <Link
              href="/products"
              className="inline-flex items-center justify-center gap-2 min-h-13 font-bold text-[12px] transition-[background,transform] duration-200 text-white bg-primary hover:-translate-y-0.5 hover:bg-[#188e95] px-4 py-3 rounded-[9px] border border-solid border-transparent min-[361px]:gap-2.5 min-[361px]:text-[14px] min-[361px]:px-5 sm:text-[13px] sm:px-4.25 md:gap-5 md:text-[15px] md:px-6 md:py-3.25 shadow-button"
            >
              اطلب الخدمة الآن <FiArrowLeft />
            </Link>
            <Link
              href="#download"
              className="inline-flex items-center justify-center gap-2 min-h-13 font-bold text-[12px] transition-[background,transform] duration-200 bg-white text-ink hover:-translate-y-0.5 hover:bg-soft px-4 py-3 rounded-[9px] border border-solid border-gray-200 min-[361px]:gap-2.5 min-[361px]:text-[14px] min-[361px]:px-5 sm:text-[13px] sm:px-4.25 md:gap-5 md:text-[15px] md:px-6 md:py-3.25"
            >
              حمل التطبيق
            </Link>
          </div>
          <CustomerTrust />
        </div>
        <div className="relative min-w-0 h-112.5 pl-4 pr-3 max-w-110 w-full mx-auto sm:h-115 sm:pl-3 sm:pr-3 sm:max-w-none sm:w-auto sm:mx-0 md:h-126 lg:h-135 lg:pl-5 xl:h-145">
          <div className="h-102.5 w-full relative overflow-hidden rounded-tl-[65px] rounded-tr-[18px] rounded-br-[18px] rounded-bl-[18px] sm:h-106 sm:rounded-tl-[90px] md:h-119 lg:h-127 xl:h-138">
            <Image
              src="/images/living-room.jpg"
              alt="غرفة معيشة هادئة بأريكة مريحة وسجاد نظيف"
              fill
              priority
              sizes="(max-width: 767px) 90vw, 48vw"
              className="object-[48%_center]"
            />
            <div className="absolute bottom-5.5 right-4 left-4 flex justify-between items-center text-white [text-shadow:0_1px_12px_#0008] text-[11px] sm:right-6 sm:left-6 sm:text-[14px]">
              <span>تفاصيل صغيرة، فرق كبير</span>
              <PiSparkle className="text-[27px]" />
            </div>
          </div>
          <div className="absolute left-0 top-6.75 bg-white shadow-[0_12px_35px_#14383b12] flex items-center gap-2.5 z-3 [direction:rtl] p-3 rounded-[13px] sm:-left-1 sm:top-6.25 sm:p-2.5 md:left-2 md:top-10 md:px-4.5 md:py-3.25">
            <span className="w-7 h-7 grid place-items-center text-white bg-primary rounded-full">
              <FiCheck />
            </span>
            <div>
              <strong className="text-[12px] block sm:text-[11px] md:text-[13px]">
                عناية بكل تفصيلة
              </strong>
              <small className="text-[8px] text-muted block sm:text-[7px] md:text-[8px]">
                من أول خيط لآخر لمسة
              </small>
            </div>
          </div>
          <HeroPhone />
          <span className="absolute text-[#46aeb1] text-[35px] -top-6.75 right-px sm:-top-4.5 sm:right-1">
            ✧
          </span>
          <span className="absolute text-[#b5a371] text-[24px] bottom-2 left-1.75 sm:bottom-0 sm:left-0">
            ✳
          </span>
        </div>
      </div>
    </section>
  );
}
