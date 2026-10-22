import Image from "next/image";
import servicesPreview from "@/public/images/PhoneMockup1.png";
import detailsPreview from "@/public/images/PhoneMockup2.png";
import ordersPreview from "@/public/images/PhoneMockup3.png";

const screens = {
  services: {
    image: servicesPreview,
    alt: "معاينة شاشة خدمات الغسيل في تطبيق شايني كاربت",
  },
  orders: { image: ordersPreview, alt: "معاينة سجل الطلبات ومتابعتها في التطبيق" },
  details: { image: detailsPreview, alt: "معاينة تفاصيل الطلب والعنوان والصور المرفقة" },
  checkout: { image: detailsPreview, alt: "معاينة تفاصيل استكمال الطلب في التطبيق" },
};

type PhoneMockupProps = {
  screen?: keyof typeof screens;
  className?: string;
};

export default function PhoneMockup({
  screen = "services",
  className = "",
}: PhoneMockupProps) {
  const { image, alt } = screens[screen];

  return (
    <div className={`relative w-72 max-w-full shrink-0 sm:w-80 ${className}`}>
      <Image
        src={image}
        alt={alt}
        width={image.width}
        height={image.height}
        quality={100}
        sizes="(min-width: 1024px) 320px, (min-width: 640px) 320px, 288px"
        className="h-100.5 w-full object-cover object-top lg:h-112.5 lg:object-contain lg:object-bottom"
      />
    </div>
  );
}
