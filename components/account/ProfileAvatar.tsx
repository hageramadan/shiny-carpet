"use client";
import { useTranslation } from "@/components/i18n/LanguageProvider";

import { useState } from "react";
import Image from "next/image";

export default function ProfileAvatar({
  name,
  image,
  small = false,
}: {
  name?: string;
  image?: string | null;
  small?: boolean;
}) {
  const t = useTranslation();
  const [failedImage, setFailedImage] = useState<string | null>(null);
  const initial = Array.from(name?.trim() || "؟")[0].toLocaleUpperCase("ar");
  const label = name ? `صورة الملف الشخصي لـ ${name}` : "صورة الملف الشخصي";
  const size = small ? "size-12" : "size-18";

  if (!image || image === failedImage) {
    return (
      <span
        role="img"
        aria-label={t(label)}
        className={`inline-flex shrink-0 items-center justify-center rounded-full bg-[#e5f6f8] font-bold text-ink ${size} ${small ? "text-xl" : "text-3xl"}`}
      >
        <span aria-hidden="true">{t(initial)}</span>
      </span>
    );
  }

  return (
    <Image
      src={image}
      alt={t(label)}
      width={72}
      height={72}
      sizes={small ? "48px" : "72px"}
      onError={() => setFailedImage(image)}
      className={`shrink-0 rounded-full bg-[#e5f6f8] object-cover ${size}`}
    />
  );
}
