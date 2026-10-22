"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FiLogOut, FiMapPin, FiShoppingBag, FiUser } from "react-icons/fi";
import { useStore } from "@/components/store";
import { clearAuthDraft } from "@/lib/demo-auth";
import ProfileAvatar from "./ProfileAvatar";

const accountLinks = [
  { href: "/profile", label: "الملف الشخصي", icon: FiUser },
  { href: "/orders", label: "طلباتي", icon: FiShoppingBag },
  { href: "/addresses", label: "العناوين المحفوظة", icon: FiMapPin },
];

export default function AccountSidebar({ active }: { active: string }) {
  const { state, update } = useStore();
  const router = useRouter();

  function signOut() {
    clearAuthDraft();
    update((current) => ({ ...current, profile: null }));
    router.push("/login");
  }

  return (
    <aside className="rounded-xl border border-gray-200 bg-white px-4 pb-6 pt-7">
      <div className="flex flex-col items-center gap-3 text-center">
        <ProfileAvatar name={state.profile?.name} />
        <p className="max-w-full break-words text-lg font-bold text-[#17202A]">
          {state.profile?.name || "حساب "}
        </p>
      </div>
      <nav
        aria-label="قائمة الحساب"
        className="mt-4"
      >
        <ul className="divide-y divide-gray-100">
          {accountLinks.map(({ href, label, icon: Icon }) => (
            <li key={href}>
              <Link
                href={href}
                aria-current={active === href ? "page" : undefined}
                className="flex min-h-11 items-center gap-2 py-3 text-sm text-muted transition-colors hover:text-primary aria-[current=page]:font-bold aria-[current=page]:text-[#17202A]"
              >
                <Icon
                  aria-hidden="true"
                  className="size-4 text-[#ff4d58]"
                />
                {label}
              </Link>
            </li>
          ))}
          <li>
            <button
              type="button"
              onClick={signOut}
              className="flex min-h-11 w-full items-center gap-2 py-3 text-right text-sm text-muted transition-colors hover:text-red-600"
            >
              <FiLogOut
                aria-hidden="true"
                className="size-4 text-[#ff4d58]"
              />
              تسجيل الخروج
            </button>
          </li>
        </ul>
      </nav>
    </aside>
  );
}
