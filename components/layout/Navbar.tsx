"use client";
import Link from "next/link";
import Logo from "@/components/layout/Logo";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { FiShoppingCart, FiUser, FiMenu, FiX, FiArrowUpLeft } from "react-icons/fi";
import { useStore } from "@/components/store";
import { useCart } from "@/components/cart/CartProvider";

const links = [
  ["/#top", "الرئيسية"],
  ["/#services", "خدماتنا"],
  ["/#why", "لماذا Shiny Carpet؟"],
  ["/orders", "طلباتي"],
  // ["/tracking", "تتبع الطلب"],
  ["/#faq", "الأسئلة الشائعة"],
];

export default function Navbar() {
  const path = usePathname();
  const [open, setOpen] = useState(false);
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

  return (
    <header
      ref={navbarRef}
      data-scrolled={scrolled}
      className="fixed inset-x-0 top-0 z-50 h-16 border-b border-gray-200 bg-white shadow-none transition-shadow duration-200 data-[scrolled=true]:shadow-sm data-[scrolled=true]:shadow-black/5 md:h-20"
    >
      <div className="container h-full flex items-center justify-between gap-2.5 mx-auto sm:gap-5 lg:gap-7.5 px-5 sm:px-6 lg:px-8">
        <Link
          href="/#top"
          aria-label="Shiny Carpet الرئيسية"
          onClick={() => setOpen(false)}
          className="mt-1 max-md:mt-0 max-md:flex max-md:items-center max-md:[&_img]:h-12 max-md:[&_img]:object-contain"
        >
          <Logo />
        </Link>

        <nav
          id="primary-navbar"
          aria-label="التنقل الرئيسي"
          className="absolute inset-x-0 top-16 hidden flex-col items-stretch gap-0 border-b border-gray-200 bg-white px-7.5 py-5 text-base font-medium text-[#6B7280] shadow-lg shadow-ink/5 data-[open=true]:flex md:static md:flex md:flex-row md:items-center md:gap-3.75 md:border-0 md:p-0 md:shadow-none lg:gap-5.75"
          data-open={open}
        >
          {links.map(([href, label]) => (
            <Link
              className="relative whitespace-nowrap py-2 transition-colors duration-200 hover:text-primary data-[active=true]:text-primary md:py-0"
              key={href}
              href={href}
              onClick={() => setOpen(false)}
              data-active={isActive(href)}
              aria-current={
                isActive(href) ? (href.startsWith("/#") ? "location" : "page") : undefined
              }
            >
              {label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-1.5 sm:gap-2 lg:gap-3">
          <Link
            href={state.profile ? "/profile" : "/login"}
            className="w-9.25 h-9.25 inline-flex items-center justify-center text-[18px] rounded-[10px] border border-solid border-gray-200 sm:w-10.5 sm:h-10.5 sm:text-[20px]"
            aria-label="حسابي"
          >
            <FiUser />
          </Link>

          <Link
            href="/cart"
            className="w-9.25 h-9.25 inline-flex items-center justify-center text-[18px] relative rounded-[10px] border border-solid border-gray-200 sm:w-10.5 sm:h-10.5 sm:text-[20px]"
            aria-label={`السلة، ${count} قطع`}
          >
            <FiShoppingCart />
            {count > 0 && (
              <span className="absolute -left-1.5 -top-1.75 bg-[#e87869] text-white [font:10px_sans-serif] min-w-4.25 h-4.25 grid place-items-center rounded-full border-2 border-solid border-white">
                {count}
              </span>
            )}
          </Link>

          <Link
            href="/products"
            className="hidden items-center justify-center gap-3.5 min-h-12 font-bold text-base transition-[background,transform] duration-200 text-white bg-primary hover:-translate-y-0.5 hover:bg-[#188e95] px-3.25 py-2.5 rounded-[9px] border border-solid border-transparent sm:inline-flex lg:px-8 shadow-button"
          >
            اطلب الآن
          </Link>

          <button
            className="w-9.25 h-9.25 flex items-center justify-center text-[18px] rounded-[10px] border border-solid border-gray-200 sm:w-10.5 sm:h-10.5 sm:text-[20px] md:hidden"
            aria-label={open ? "إغلاق القائمة" : "فتح القائمة"}
            type="button"
            aria-controls="primary-navbar"
            aria-expanded={open}
            onClick={() => setOpen(!open)}
          >
            {open ? <FiX /> : <FiMenu />}
          </button>
        </div>
      </div>
    </header>
  );
}
