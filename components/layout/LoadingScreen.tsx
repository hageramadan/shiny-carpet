"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

export default function LoadingScreen() {
  const [isLoading, setIsLoading] = useState(true);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const finishLoading = () => setIsLoading(false);

    if (document.readyState === "complete") {
      finishLoading();
      return;
    }

    window.addEventListener("load", finishLoading, { once: true });
    return () => window.removeEventListener("load", finishLoading);
  }, []);

  useEffect(() => {
    if (isLoading) return;

    const timer = window.setTimeout(() => setIsVisible(false), 300);
    return () => window.clearTimeout(timer);
  }, [isLoading]);

  useEffect(() => {
    if (!isVisible) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isVisible]);

  if (!isVisible) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="جاري تحميل الموقع"
      aria-hidden={!isLoading}
      className={`fixed inset-0 z-9999 flex flex-col items-center justify-center gap-6 bg-white transition-opacity duration-300 ease-out motion-reduce:transition-none ${isLoading ? "opacity-100" : "pointer-events-none opacity-0"}`}
    >
      <Image
        src="/images/logo1.png"
        alt="Shiny Carpet"
        width={432}
        height={328}
        loading="eager"
        sizes="(min-width: 640px) 176px, 144px"
        className="h-auto w-36 object-contain sm:w-44"
      />
      <span
        aria-hidden="true"
        className="size-8 animate-spin rounded-full border-3 border-primary/15 border-t-primary motion-reduce:animate-none sm:size-9"
      />
      <span className="sr-only">جاري تحميل الموقع…</span>
    </div>
  );
}
