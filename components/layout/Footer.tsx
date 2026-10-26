"use client";
import { useSettings } from "@/components/settings/SettingsProvider";
import Link from "next/link";
import { FiPhone, FiMail, FiMapPin } from "react-icons/fi";
import {
  FaFacebookF,
  FaInstagram,
  FaSnapchatGhost,
  FaTiktok,
  FaPinterestP,
} from "react-icons/fa";
import Logo from "./Logo";

const quickLinks = [
  { href: "/", label: "الرئيسية" },
  { href: "/#services", label: "خدماتنا" },
  { href: "/orders", label: "طلباتي" },
  { href: "/tracking", label: "تتبع الطلب" },
];
const serviceLinks = [
  { href: "/products?category=16", label: "غسيل السجاد" },
  { href: "/products?category=18", label: "غسيل البطاطين" },
  { href: "/products", label: "المقاسات والأسعار" },
  { href: "/#download", label: "حمل التطبيق" },
];
export default function Footer() {
  const { data: settings, status, reload } = useSettings();
  const phone = settings?.phone;
  const email = settings?.email;
  const socialLinks = [
    { name: "Facebook", icon: FaFacebookF, href: settings?.facebook },
    { name: "Instagram", icon: FaInstagram, href: settings?.instagram },
    { name: "Snapchat", icon: FaSnapchatGhost, href: settings?.snapchat },
    { name: "TikTok", icon: FaTiktok, href: settings?.tikTok },
    { name: "Pinterest", icon: FaPinterestP, href: settings?.pinterest },
  ];

  return (
    <footer className="bg-[#17212a] pb-7 pt-12 text-slate-200 lg:pt-16">
      <div className="container mx-auto px-5 sm:px-6 lg:px-8">
        <div className="grid gap-10 pb-12 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr] lg:gap-16 lg:pb-20">
          <div>
            <Link
              href="/"
              aria-label="Shiny Carpet - الرئيسية"
              className="inline-flex"
            >
              <Logo />
            </Link>
            <p className="mt-5 max-w-sm text-sm leading-8 text-slate-300">
              بنخلي نظافة سجادك وبطاطينك أسهل، بعناية متخصصة وخدمة توصلك لحد باب البيت.
            </p>
            <div className="mt-5 flex gap-3">
              {socialLinks.map(({ name, icon: Icon, href }) =>
                href ? (
                  <a
                    key={name}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={name}
                    className="grid size-10 place-items-center rounded-full bg-[#e5f7f8] text-primary transition-colors hover:bg-white"
                  >
                    <Icon />
                  </a>
                ) : null,
              )}
            </div>
          </div>
          <nav aria-label="روابط سريعة">
            <h2 className="mb-5 text-base font-normal text-white">روابط سريعة</h2>
            <ul className="space-y-3 text-sm text-slate-300">
              {quickLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="transition-colors hover:text-primary"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <nav aria-label="خدمات Shiny Carpet">
            <h2 className="mb-5 text-base font-normal text-white">خدماتنا</h2>
            <ul className="space-y-3 text-sm text-slate-300">
              {serviceLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="transition-colors hover:text-primary"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <div>
            <h2 className="mb-5 text-base font-normal text-white">تواصل معنا</h2>
            <div className="space-y-4 text-sm text-slate-300">
              {phone && (
                <a
                  href={"tel:" + phone.replace(/[^+0-9]/g, "")}
                  className="flex items-center gap-3"
                >
                  <FiPhone />
                  <span dir="ltr">{phone}</span>
                </a>
              )}
              {email && (
                <a
                  href={"mailto:" + email}
                  className="flex items-center gap-3"
                >
                  <FiMail />
                  <span dir="ltr">{email}</span>
                </a>
              )}
              {settings?.address && (
                <p className="flex items-start gap-3">
                  <FiMapPin className="mt-1" />
                  <span dir="auto">{settings.address}</span>
                </p>
              )}
              {status === "error" && (
                <div role="alert">
                  <p>تعذر تحميل بيانات التواصل.</p>
                  <button
                    onClick={reload}
                    className="mt-2 min-h-10 text-white underline"
                  >
                    إعادة المحاولة
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="border-t border-gray-200 pt-6 text-center text-sm leading-7 text-slate-300">
          <p>
            © {new Date().getFullYear()} {settings?.name || "Shiny Carpet"} ·{" "}
            <Link
              href="/terms-and-conditions"
              className="hover:text-white"
            >
              الشروط والأحكام
            </Link>{" "}
            ·{" "}
            <Link
              href="/privacy-policy"
              className="hover:text-white"
            >
              سياسة الخصوصية
            </Link>
          </p>
        </div>
      </div>
    </footer>
  );
}
