"use client";
import { useTranslation } from "@/components/i18n/LanguageProvider";

import { useSettings } from "@/components/settings/SettingsProvider";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { FiPhone, FiMail, FiMapPin } from "react-icons/fi";
import {
  FaFacebookF,
  FaInstagram,
  FaSnapchatGhost,
  FaTiktok,
  FaPinterestP,
  FaWhatsapp,
} from "react-icons/fa";
import Logo from "./Logo";

const quickLinks = [
  { href: "/", label: "الرئيسية" },
  { href: "/#services", label: "خدماتنا" },
  { href: "/orders", label: "طلباتي" },
   { href: "/tracking", label: "تتبع الطلب" },
  { href: "/terms-and-conditions", label: "سياسة الخصوصية والشروط والأحكام" },
 
];
export default function Footer() {
  const t = useTranslation();
  const { data: settings, status, reload } = useSettings();
  const pathname = usePathname();
  if (/^\/products\/[^/]+\/?$/.test(pathname)) return null;
  const phone = settings?.phone;
  const email = settings?.email;
  const whatsappNumber = phone?.replace(/\D/g, "").replace(/^00/, "");
  const socialLinks = [
    {
      name: "واتساب",
      icon: FaWhatsapp,
      href: whatsappNumber ? `https://wa.me/${whatsappNumber}` : undefined,
    },
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
              aria-label={t("Shiny Carpet - الرئيسية")}
              className="inline-flex"
            >
              <Logo />
            </Link>
            <p className="mt-5 max-w-sm text-sm leading-8 text-slate-300">
              {t("تابعونا على مواقع التواصل الاجتماعي")}
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              {socialLinks.map(({ name, icon: Icon, href }) =>
                href ? (
                  <a
                    key={name}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={t(name)}
                    className="grid size-10 place-items-center rounded-full bg-[#e5f7f8] text-primary transition-colors hover:bg-white"
                  >
                    <Icon />
                  </a>
                ) : null,
              )}
            </div>
          </div>
          <nav aria-label={t("روابط سريعة")}>
            <h2 className="mb-5 text-base font-normal text-white">{t("روابط سريعة")}</h2>
            <ul className="space-y-3 text-sm text-slate-300">
              {quickLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="transition-colors hover:text-primary"
                  >
                    {t(link.label)}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <section aria-labelledby="footer-about-title">
            <h2
              id="footer-about-title"
              className="mb-5 text-base font-normal text-white"
            >
              {t("نبذة عنا")}
            </h2>
            <div className="space-y-3 text-sm leading-8 text-slate-300">
              <p>
                {t(
                  "نحن شركة متخصصة في غسيل السجاد، والبطانيات، والزل، والستاير، واللباد.",
                )}
              </p>
              <p>
                {t(
                  "نشاطنا: غسيل عميق، وتعقيم، وتجفيف، وتعطير، ونتعامل مع جميع أنواع السجاد.",
                )}
              </p>
              <p>
                {t(
                  "شايني كاربت منصة إلكترونية متكاملة، تقدر من خلالها تتابع طلبك لحظة بلحظة، من الاستلام، والغسيل، والتسليم، والتقييم، والدفع الإلكتروني من داخل المنصة.",
                )}
              </p>
              <p>{t("ونستلم من باب بيتك، ونرجعها مغسولة في غاية الجمال.")}</p>
            </div>
          </section>
          <div>
            <h2 className="mb-5 text-base font-normal text-white">{t("تواصل معنا")}</h2>
            <div className="space-y-4 text-sm text-slate-300">
              {t(
                phone && (
                  <a
                    href={"tel:" + phone.replace(/[^+0-9]/g, "")}
                    className="flex items-center gap-3"
                  >
                    <FiPhone />
                    <span dir="ltr">{t(phone)}</span>
                  </a>
                ),
              )}
              {t(
                email && (
                  <a
                    href={"mailto:" + email}
                    className="flex items-center gap-3"
                  >
                    <FiMail />
                    <span dir="ltr">{t(email)}</span>
                  </a>
                ),
              )}
              {settings?.address && (
                <p className="flex items-start gap-3">
                  <FiMapPin className="mt-1" />
                  <span dir="auto">{t(settings.address)}</span>
                </p>
              )}
              {status === "error" && (
                <div role="alert">
                  <p>{t("تعذر تحميل بيانات التواصل.")}</p>
                  <button
                    onClick={reload}
                    className="mt-2 min-h-10 text-white underline"
                  >
                    {t("إعادة المحاولة")}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="border-t border-gray-200 pt-6 text-center text-sm leading-7 text-slate-300">
          <p>
            {t("© ")}
            {new Date().getFullYear()} {settings?.name || "Shiny Carpet"}
            {t(" ")}
            {/* <Link
              href="/terms-and-conditions"
              className="hover:text-white"
            >
              {t("الشروط والأحكام")} {t("و")} {t("سياسة الخصوصية")}
            </Link> */}
          </p>
        </div>
      </div>
    </footer>
  );
}
