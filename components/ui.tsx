import Link from "next/link";
import { FiChevronLeft, FiMinus, FiPlus } from "react-icons/fi";
export function PageHeading({ title, text }: { title: string; text: string }) {
  return (
    <div className="mb-6.5 sm:mb-8.75">
      <div className="flex gap-2.25 items-center text-[12px] text-muted mb-4.5 sm:mb-6">
        <Link href="/">الرئيسية</Link>
        <FiChevronLeft className="text-[14px]" />
        <span>{title}</span>
      </div>
      <h1 className="leading-[1.6] text-[31px] font-extrabold sm:text-[38px]">{title}</h1>
      <p className="mt-1.5 text-muted text-[13px] sm:text-[15px]">{text}</p>
    </div>
  );
}
export function Quantity({
  value,
  onChange,
  disabled = false,
}: {
  value: number;
  onChange: (n: number) => void;
  disabled?: boolean;
}) {
  return (
    <div className="inline-flex shrink-0 items-center gap-2 [direction:ltr] h-13 p-1 rounded-lg border border-solid border-gray-200 sm:gap-3.75 sm:h-10.5 sm:p-1.25">
      <button
        className="size-11 bg-soft grid place-items-center text-sm rounded-sm sm:size-7"
        type="button"
        aria-label="زيادة الكمية"
        disabled={disabled || value >= 99}
        onClick={() => onChange(Math.min(99, value + 1))}
      >
        <FiPlus />
      </button>
      <span className="min-w-4.5 text-center text-[13px] sm:text-[14px]">{value}</span>
      <button
        className="size-11 bg-soft grid place-items-center text-sm rounded-sm sm:size-7"
        type="button"
        aria-label="تقليل الكمية"
        disabled={disabled || value <= 1}
        onClick={() => onChange(Math.max(1, value - 1))}
      >
        <FiMinus />
      </button>
    </div>
  );
}
export function Empty({
  title,
  text,
  href = "/products",
  label = "تصفحي الخدمات",
}: {
  title: string;
  text: string;
  href?: string;
  label?: string;
}) {
  return (
    <div className="text-center bg-[#f7faf9] px-5.5 py-11.25 rounded-[14px] border border-dashed border-gray-200 sm:px-7.5 sm:py-16.25">
      <span className="text-[54px] text-primary block mb-3.75 mx-auto">✧</span>
      <h2 className="leading-[1.6] text-[24px] font-bold tracking-[-0.8px] sm:text-[27px]">
        {title}
      </h2>
      <p className="mt-2.5 mb-5.5 text-muted text-[14px]">{text}</p>
      <Link
        href={href}
        className="inline-flex items-center justify-center gap-5 min-h-13 font-bold text-[15px] transition-[background,transform] duration-200 text-white bg-primary hover:-translate-y-0.5 hover:bg-[#188e95] px-6 py-3.25 rounded-[9px] border border-solid border-transparent shadow-button"
      >
        {label}
      </Link>
    </div>
  );
}
