import { IoIosStar } from "react-icons/io";
const avatars = [
  { letter: "ن", color: "bg-[#6b8e8c]" },
  { letter: "ك", color: "bg-[#d2a77b]" },
  { letter: "ش", color: "bg-[#087f89]" },
];

export default function CustomerTrust() {
  return (
    <div className="mt-5.5 flex flex-wrap items-center justify-center gap-x-3 gap-y-2 sm:mt-6.5 sm:justify-start lg:gap-x-4 max-sm:mt-4">
      <div
        aria-hidden="true"
        className="flex shrink-0"
      >
        {avatars.map(({ letter, color }) => (
          <span
            key={letter}
            className={`relative -ms-2 grid size-8 shrink-0 place-items-center rounded-full border-2 border-white text-sm font-bold text-white first:ms-0 lg:size-10 lg:text-base ${color}`}
          >
            {letter}
          </span>
        ))}
      </div>
      <div className="text-right">
        <p className="whitespace-nowrap text-sm font-bold leading-relaxed text-ink lg:text-lg max-sm:text-xs">
          <bdi dir="ltr">2,500+</bdi> بيت سعيد
        </p>
        <p className="mt-0.5 whitespace-nowrap text-xs leading-relaxed text-muted lg:text-sm">
          اختاروا شايني كاربت
        </p>
      </div>
      <div
        aria-hidden="true"
        className="flex shrink-0 items-center gap-1 text-sm text-[#eead2d] lg:text-base max-sm:text-xs"
      >
        {Array.from({ length: 5 }, (_, index) => (
          <IoIosStar key={index} />
        ))}
      </div>
    </div>
  );
}
