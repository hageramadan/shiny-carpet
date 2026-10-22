"use client";

import { useEffect, useRef, useState } from "react";
import { FaApple } from "react-icons/fa";

function GooglePlayIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 26"
      className="size-6 shrink-0 sm:size-7"
    >
      <path
        fill="#35c9ff"
        d="M2 1.5v23L14 13Z"
      />
      <path
        fill="#32d184"
        d="m2 1.5 15.5 9L14 13Z"
      />
      <path
        fill="#ffcf46"
        d="m17.5 10.5 4 2.3a.3.3 0 0 1 0 .5l-4 2.2L14 13Z"
      />
      <path
        fill="#ff5265"
        d="M2 24.5 17.5 15.5 14 13Z"
      />
    </svg>
  );
}

const stores = [
  { name: "App Store", caption: "Download on the", icon: FaApple },
  { name: "Google Play", caption: "GET IT ON", icon: GooglePlayIcon },
];

export default function AppStoreBadges() {
  const container = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const element = container.current;
    if (!element) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15 },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  return (
    <div
      ref={container}
      className="flex flex-wrap items-center gap-3"
    >
      {stores.map(({ name, caption, icon: Icon }) => (
        <button
          key={name}
          type="button"
          data-visible={visible}
          disabled
          dir="ltr"
          aria-label={`تحميل من ${name} — قريبًا`}
          className="inline-flex cursor-pointer h-11 items-center gap-2 rounded-lg bg-black px-3 py-1 text-white transition duration-200 hover:bg-black/85 motion-safe:hover:-translate-y-0.5 motion-safe:data-[visible=true]:animate-store-reveal disabled:cursor-default disabled:opacity-100 sm:h-12 sm:px-3.5"
        >
          <Icon
            aria-hidden="true"
            className="size-6 shrink-0 sm:size-7"
          />
          <span className="text-left font-sans text-xs leading-tight">
            {caption}
            <strong className="block whitespace-nowrap text-base font-semibold leading-tight max-sm:text-sm">
              {name}
            </strong>
          </span>
        </button>
      ))}
    </div>
  );
}
