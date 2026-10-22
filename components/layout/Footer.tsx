import Link from "next/link";
import { FiPhone, FiMail } from "react-icons/fi";
import { FaFacebookF, FaInstagram, FaLinkedinIn, FaWhatsapp } from "react-icons/fa";
import Logo from "./Logo";

const quickLinks = [
  { href: "/", label: "الرئيسية" },
  { href: "/#services", label: "خدماتنا" },
  { href: "/orders", label: "طلباتي" },
  { href: "/tracking", label: "تتبع الطلب" },
];
const serviceLinks = [
  { href: "/products/carpet", label: "غسيل السجاد" },
  { href: "/products/blanket", label: "غسيل البطاطين" },
  { href: "/products", label: "المقاسات والأسعار" },
  { href: "/#download", label: "حمل التطبيق" },
];
const socialLinks = [
  { name: "Facebook", icon: FaFacebookF, href: process.env.NEXT_PUBLIC_FACEBOOK_URL },
  { name: "LinkedIn", icon: FaLinkedinIn, href: process.env.NEXT_PUBLIC_LINKEDIN_URL },
  { name: "Instagram", icon: FaInstagram, href: process.env.NEXT_PUBLIC_INSTAGRAM_URL },
  { name: "WhatsApp", icon: FaWhatsapp, href: process.env.NEXT_PUBLIC_WHATSAPP_URL },
];

export default function Footer() {
  const phone = process.env.NEXT_PUBLIC_CONTACT_PHONE;
  const email = process.env.NEXT_PUBLIC_CONTACT_EMAIL;
  const hours = process.env.NEXT_PUBLIC_BUSINESS_HOURS;

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
                ) : (
                  <button
                    key={name}
                    type="button"
                    disabled
                    aria-label={name + " — قريبًا"}
                    title={name + " — قريبًا"}
                    className="grid size-10 place-items-center rounded-full bg-[#e5f7f8] text-primary disabled:cursor-default disabled:opacity-100"
                  >
                    <Icon />
                  </button>
                ),
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
              {phone ? (
                <a
                  href={"tel:" + phone.replace(/[^+0-9]/g, "")}
                  className="flex items-center gap-3"
                >
                  <FiPhone />
                  <span dir="ltr">{phone}</span>
                </a>
              ) : (
                <p className="flex items-center gap-3">
                  <FiPhone />
                  <span>+20 000 000 0000</span>
                </p>
              )}
              {email ? (
                <a
                  href={"mailto:" + email}
                  className="flex items-center gap-3"
                >
                  <FiMail />
                  <span dir="ltr">{email}</span>
                </a>
              ) : (
                <p className="flex items-center gap-3">
                  <FiMail />
                  <span>hello@shinycarpet.com</span>
                </p>
              )}
              <p className="leading-7">{hours || "يوميًا من 9 صباحًا إلى 10 مساءً"}</p>
            </div>
          </div>
        </div>
        <div className="border-t border-gray-200 pt-6 text-center text-sm leading-7 text-slate-300">
          <p>
       © 2026 Shiny Carpet · الشروط والأحكام · سياسة الخصوصية
          </p>
         
        </div>
      </div>
    </footer>
  );
}
