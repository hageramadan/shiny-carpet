"use client";
import { changeLanguage, useTranslation } from "@/components/i18n/LanguageProvider";

import Link from "next/link";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import Logo from "@/components/layout/Logo";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { FiShoppingCart, FiUser, FiMenu, FiX, FiGlobe, FiCheck } from "react-icons/fi";
import { useStore } from "@/components/store";
import { useCart } from "@/components/cart/CartProvider";
import { useCategories } from "@/hooks/useCatalogApi";

const links = [
  ["/#top", "الرئيسية"],
  ["/#services", "خدماتنا"],
  ["/orders", "طلباتي"],
  // ["/tracking", "تتبع الطلب"],
  ["/#faq", "الأسئلة الشائعة"],
];

export default function Navbar() {
  const t = useTranslation();
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const [servicesStarted, setServicesStarted] = useState(false);
  const categoriesRequest = useCategories(servicesStarted);
  const [scrolled, setScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState("top");
  const navbarRef = useRef<HTMLElement>(null);

  useEffect(() => {
    let frame: number | null = null;

    function updateNavigation() {
      frame = null;
      setScrolled(window.scrollY > 0);
      if (path !== "/") return;

      const navbarHeight = navbarRef.current?.getBoundingClientRect().height ?? 0;
      const scrollPadding =
        parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 0;
      const activationLine = Math.max(navbarHeight + 16, scrollPadding) + 1;
      let current = "top";

      for (const [href] of links) {
        if (!href.startsWith("/#") || href === "/#top") continue;
        const id = href.slice(2);
        const section = document.getElementById(id);
        if (section && section.getBoundingClientRect().top <= activationLine)
          current = id;
      }
      setActiveSection(current);
    }

    function scheduleUpdate() {
      if (frame === null) frame = window.requestAnimationFrame(updateNavigation);
    }

    updateNavigation();
    window.addEventListener("scroll", scheduleUpdate, { passive: true });
    window.addEventListener("resize", scheduleUpdate);
    window.addEventListener("hashchange", scheduleUpdate);
    const observer = new ResizeObserver(scheduleUpdate);
    const main = document.getElementById("main");
    if (main) observer.observe(main);
    if (navbarRef.current) observer.observe(navbarRef.current);

    return () => {
      window.removeEventListener("scroll", scheduleUpdate);
      window.removeEventListener("resize", scheduleUpdate);
      window.removeEventListener("hashchange", scheduleUpdate);
      observer.disconnect();
      if (frame !== null) window.cancelAnimationFrame(frame);
    };
  }, [path]);

  useEffect(() => {
    setOpen(false);
  }, [path]);

  useEffect(() => {
    if (!open) return;

    function handleClickOutside(event: MouseEvent | TouchEvent) {
      const navbar = navbarRef.current;
      const nav = document.getElementById("primary-navbar");
      const target = event.target as Node;

      if (navbar && navbar.contains(target)) return;

      if (nav && nav.contains(target)) return;

      setOpen(false);
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [open]);

  // إغلاق المنيو بزر Escape
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  function isActive(href: string) {
    return href.startsWith("/#")
      ? path === "/" && href === `/#${activeSection}`
      : path === href;
  }

  const { state } = useStore();
  const { cart } = useCart();
  const count = cart?.count ?? 0;

  const languageToggle = (
    <DropdownMenu.Root
      modal={false}
      dir={t.dir}
      onOpenChange={(isOpen) => {
        if (isOpen) setOpen(false);
      }}
    >
      <DropdownMenu.Trigger asChild>
        <button
          type="button"
          dir="rtl"
          aria-label={t("اختيار اللغة")}
          className="inline-flex size-11 shrink-0 items-center justify-center rounded-xl bg-transparent text-ink outline-none hover:bg-primary/5 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        >
          <FiGlobe
            aria-hidden="true"
            className="size-5"
          />
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={8}
          collisionPadding={12}
          aria-label={t("اختيار اللغة")}
          className="z-100 min-w-36 rounded-xl border border-gray-200 bg-white p-1.5 text-sm text-ink shadow-lg"
        >
          <DropdownMenu.RadioGroup
            value={t.locale}
            onValueChange={(locale) => {
              if ((locale === "ar" || locale === "en") && locale !== t.locale)
                changeLanguage(locale);
            }}
          >
            <DropdownMenu.RadioItem
              value="ar"
              className="flex min-h-11 cursor-pointer items-center gap-4 rounded-lg px-3 outline-none data-[highlighted]:bg-primary/10 data-[state=checked]:font-bold data-[state=checked]:text-primary"
            >
              <span lang="ar">العربية</span>
              <DropdownMenu.ItemIndicator className="ms-auto">
                <FiCheck aria-hidden="true" />
              </DropdownMenu.ItemIndicator>
            </DropdownMenu.RadioItem>
            <DropdownMenu.RadioItem
              value="en"
              className="flex min-h-11 cursor-pointer items-center gap-4 rounded-lg px-3 outline-none data-[highlighted]:bg-primary/10 data-[state=checked]:font-bold data-[state=checked]:text-primary"
            >
              <span lang="en">English</span>
              <DropdownMenu.ItemIndicator className="ms-auto">
                <FiCheck aria-hidden="true" />
              </DropdownMenu.ItemIndicator>
            </DropdownMenu.RadioItem>
          </DropdownMenu.RadioGroup>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
  return (
    <header
      ref={navbarRef}
      data-scrolled={scrolled}
      className="fixed inset-x-0 top-0 z-50 h-16 border-b border-gray-200 bg-white transition-shadow data-[scrolled=true]:shadow-sm lg:h-20"
    >
      <div
        dir="rtl"
        className="container relative mx-auto grid h-full grid-cols-[1fr_auto_1fr] items-center gap-2 px-4 sm:px-6 lg:flex lg:justify-between lg:gap-4 lg:px-8"
      >
        <div className="col-start-1 row-start-1 flex items-center gap-1.5 lg:hidden">
          <button
            type="button"
            aria-label={t(open ? "إغلاق القائمة" : "فتح القائمة")}
            aria-controls="primary-navbar"
            aria-expanded={open}
            onClick={() => {
              setServicesStarted(true);
              setOpen(!open);
            }}
            className="grid size-9 shrink-0 place-items-center text-xl focus-visible:outline-2 focus-visible:outline-primary"
          >
            {open ? <FiX /> : <FiMenu />}
          </button>
          {languageToggle}
        </div>
        <Link
          href="/#top"
          aria-label={t("Shiny Carpet الرئيسية")}
          onClick={() => setOpen(false)}
          className="col-start-2 row-start-1 justify-self-center [&_img]:h-12 [&_img]:w-16 [&_img]:object-contain lg:[&_img]:h-16 lg:[&_img]:w-20"
        >
          <Logo />
        </Link>
        <nav
          id="primary-navbar"
          dir={t.dir}
          aria-label={t("التنقل الرئيسي")}
          data-open={open}
          className="absolute inset-x-0 top-16 hidden max-lg:max-h-[calc(100dvh-4rem)] max-lg:overflow-y-auto flex-col gap-1 border-b border-gray-200 bg-white px-6 py-4 text-sm text-muted shadow-lg data-[open=true]:flex lg:static lg:flex lg:flex-row lg:items-center lg:gap-4 lg:border-0 lg:p-0 lg:shadow-none lg:gap-6"
        >
          <div className="hidden lg:contents">
            {links.map(([href, label]) => (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                data-active={isActive(href)}
                aria-current={
                  isActive(href)
                    ? href.startsWith("/#")
                      ? "location"
                      : "page"
                    : undefined
                }
                className="whitespace-nowrap py-2 hover:text-primary data-[active=true]:text-primary lg:py-0"
              >
                {t(label)}
              </Link>
            ))}
          </div>
          <div className="flex flex-col lg:hidden">
            <Link
              href="/#top"
              onClick={() => setOpen(false)}
              className="flex min-h-11 items-center border-b border-gray-200 py-2 text-ink hover:text-primary"
            >
              {t("الرئيسية")}
            </Link>
            <h2 className="pb-1 pt-4 text-sm font-bold text-primary">
              {t("مجموعة الخدمات المقدمة")}
            </h2>
            {categoriesRequest.status === "error" ? (
              <div
                role="alert"
                className="py-2 text-sm"
              >
                <p>{t("تعذر تحميل الخدمات الآن. حاول مرة أخرى.")}</p>
                <button
                  type="button"
                  onClick={categoriesRequest.reload}
                  className="min-h-11 font-bold text-primary"
                >
                  {t("إعادة المحاولة")}
                </button>
              </div>
            ) : categoriesRequest.status !== "success" ? (
              <p
                role="status"
                className="py-3 text-sm"
              >
                {t("جاري تحميل الخدمات…")}
              </p>
            ) : categoriesRequest.data?.length ? (
              categoriesRequest.data.map((category) => (
                <Link
                  key={category.id}
                  href={"/products?category=" + category.id}
                  onClick={() => setOpen(false)}
                  className="flex min-h-11 items-center py-2 text-ink hover:text-primary"
                >
                  {category.name}
                </Link>
              ))
            ) : (
              <p className="py-3 text-sm">{t("لا توجد خدمات متاحة حاليًا.")}</p>
            )}
            <Link
              href="/orders"
              onClick={() => setOpen(false)}
              className="mt-2 flex min-h-11 items-center border-t border-gray-200 py-3 font-bold text-ink hover:text-primary"
            >
              {t("طلباتي")}
            </Link>
          </div>
        </nav>
        <div className="col-start-3 row-start-1 flex items-center justify-self-end gap-1.5 lg:gap-2">
          <span className="hidden lg:inline-flex">{languageToggle}</span>
          <Link
            href="/cart"
            aria-label={t("السلة، " + count + " قطع")}
            className="relative grid size-10 shrink-0 place-items-center rounded-xl border border-gray-200 text-xl"
          >
            <FiShoppingCart />
            {count > 0 && (
              <span className="absolute -left-1 -top-1 grid min-w-4 place-items-center rounded-full border border-white bg-[#e87869] px-0.5 text-[10px] leading-4 text-white">
                {count}
              </span>
            )}
          </Link>
          <Link
            href={state.profile ? "/profile" : "/login"}
            aria-label={t("حسابي")}
            className="grid size-10 shrink-0 place-items-center rounded-xl border border-gray-200 text-xl"
          >
            <FiUser />
          </Link>
          <Link
            href="/products"
            className="hidden min-h-11 items-center justify-center rounded-xl bg-primary px-4 py-2 text-sm font-bold text-white shadow-button hover:bg-ink lg:inline-flex"
          >
            {t("اطلب الآن")}
          </Link>
        </div>
      </div>
    </header>
  );
}
