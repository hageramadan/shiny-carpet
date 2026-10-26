"use client";
import Image from "next/image";
import { useSettings } from "@/components/settings/SettingsProvider";
import Link from "next/link";
import type { OrderStatus } from "@/lib/order-status";
import { FiPackage } from "react-icons/fi";

export default function EmptyOrders({ status }: { status: OrderStatus }) {
  const previous = status === "delivered_to_customer" || status === "delivered";
  const cancelled = status === "cancelled";
  const { data: settings } = useSettings();
  return (
    <div className="flex min-h-78 flex-col items-center rounded-xl border border-gray-200 bg-white px-5 py-10 text-center">
      <span className="grid size-16 place-items-center rounded-full bg-[#e5f6f8] text-[27px] text-primary">
        
          <FiPackage
            aria-hidden="true"
            strokeWidth={1.3}
          />
      
      </span>
      <h2 className="mt-4 text-lg font-bold sm:text-xl">
        {cancelled
          ? "لا توجد طلبات ملغاة"
          : previous
            ? "لا توجد طلبات سابقة"
            : "لا توجد طلبات حالية"}
      </h2>
      <p className="mt-4 max-w-xl text-sm leading-7 text-muted sm:text-base">
        {cancelled
          ? "ستظهر هنا الطلبات التي تم إلغاؤها."
          : previous
            ? "ستظهر هنا طلباتك بعد اكتمالها. يمكنك استعراض الخدمات وبدء طلب جديد."
            : "ليس لديك طلب قيد التنفيذ الآن. اختر خدمة الغسيل أو التعطير، وسنتولى استلام قطعك وتوصيلها."}
      </p>
      <Link
        href="/products"
        className="mt-3 inline-flex min-h-10 items-center justify-center rounded-lg bg-primary px-5 py-2 text-sm font-bold text-white transition-colors hover:bg-ink shadow-button"
      >
        استعرض الخدمات وابدأ طلبك
      </Link>
      <p className="mt-4 text-xs leading-6 text-muted">
        غسيل وتعطير السجاد والبطاطين · استلام وتوصيل من عنوانك
      </p>
    </div>
  );
}
