import Image from "next/image";

export default function HeroPhone() {
  return (
    <div
      aria-hidden="true"
      className="absolute bottom-0 right-0.5 z-4 h-86 w-39 rotate-[8deg] overflow-hidden rounded-[29px] border-6 border-[#143e41] bg-white shadow-[0_22px_32px_#14383b30] sm:-bottom-0.5 sm:-right-2.5 sm:h-84 sm:w-37.5 md:-bottom-4.75 md:-right-3.75 md:h-92 md:w-41.5 md:border-7 lg:-right-5.5 lg:h-100 lg:w-46 xl:-bottom-2.5 xl:-right-5 xl:h-106 xl:w-50"
    >
      <div className="relative h-full w-full overflow-hidden rounded-[22px]">
        <Image
          src="/images/mobile.jpg"
          alt=""
          fill
          sizes="(min-width: 1280px) 186px, (min-width: 1024px) 170px, (min-width: 768px) 152px, 144px"
          className="object-contain"
        />
      </div>
      <div className="pointer-events-none absolute -top-px left-1/2 z-10 h-3.25 w-16 -translate-x-1/2 rounded-b-xl bg-[#143e41]" />
    </div>
  );
}
