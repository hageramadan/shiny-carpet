import Link from "next/link";
export default function NotFound() {
  return (
    <div className="container pt-6 pb-12.5 min-h-[65vh] mx-auto sm:pt-8.75 sm:pb-21.25 px-5 sm:px-6 lg:px-8">
      <div className="text-center bg-[#f7faf9] px-5.5 py-11.25 rounded-[14px] border border-dashed border-gray-200 sm:px-7.5 sm:py-16.25">
        <span className="text-[54px] text-primary block mb-3.75 mx-auto">404</span>
        <h1 className="leading-[1.6]">الصفحة دي مش موجودة</h1>
        <p className="mt-2.5 mb-5.5 text-muted text-[14px]">
          ممكن ترجعي للرئيسية أو تتصفحي خدماتنا.
        </p>
        <Link
          className="inline-flex items-center justify-center gap-5 min-h-13 font-bold text-[15px] transition-[background,transform] duration-200 text-white bg-primary hover:-translate-y-0.5 hover:bg-[#188e95] px-6 py-3.25 rounded-[9px] border border-solid border-transparent shadow-button"
          href="/"
        >
          الرجوع للرئيسية
        </Link>
      </div>
    </div>
  );
}
