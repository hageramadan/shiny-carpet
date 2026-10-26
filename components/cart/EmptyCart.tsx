"use client";
import Image from "next/image";
import { useSettings } from "@/components/settings/SettingsProvider";
import Link from "next/link";
import { FiShoppingBag } from "react-icons/fi";

export default function EmptyCart() {
  const { data: settings } = useSettings();
  return (
    <div className="rounded-2xl border border-gray-200 bg-white px-6 py-14 text-center lg:py-16">
      <span className="mx-auto grid size-24 place-items-center rounded-full bg-primary/10 text-4xl text-primary">
        {settings?.noDataIcon ? (
          <Image
            src={settings.noDataIcon}
            alt=""
            width={64}
            height={64}
            className="size-16 object-contain"
          />
        ) : (
          <FiShoppingBag />
        )}
      </span>
      <h2 className="mt-7 text-2xl font-bold text-ink">سلتك فارغة</h2>
      <p className="mt-5 text-sm leading-8 text-muted">
        لسه مضافش أي قطع. استعرض خدمات الغسيل واختر السجاد أو البطاطين لبدء طلبك.
      </p>
      <Link
        href="/products"
        className="mt-6 inline-flex min-h-13 items-center justify-center rounded-xl bg-primary px-7 py-3 text-base font-bold text-white transition-colors hover:bg-ink shadow-button"
      >
        العودة إلى الخدمات
      </Link>
      <p className="mt-6 text-sm leading-7 text-muted">
        غسيل السجاد والبطاطين · استلام وتوصيل من عنوانك.
      </p>
    </div>
  );
}
