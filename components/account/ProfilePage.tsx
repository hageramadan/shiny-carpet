"use client";

import Link from "next/link";
import { useStore } from "@/components/store";
import AccountSidebar from "./AccountSidebar";
import ProfileDetails from "./ProfileDetails";
import ProfileAddress from "./ProfileAddress";
import { defaultAddress } from "@/lib/addresses";

export default function ProfilePage() {
  const { state, ready } = useStore();
  const profile = state.profile;

  return (
    <section className="min-h-[65vh] bg-[#f7f9fa] pb-10 pt-6 text-ink">
      <div className="container mx-auto px-5 sm:px-6 lg:px-8">
        <nav
          aria-label="مسار التصفح"
          className="mb-3 text-xs text-muted"
        >
          <ol className="flex items-center gap-1">
            <li>
              <Link
                href="/"
                className="transition-colors hover:text-primary"
              >
                الرئيسية
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li aria-current="page">حسابي</li>
          </ol>
        </nav>
        <h1 className="text-[30px] font-extrabold leading-normal text-[#17202A] sm:text-4xl">
          حسابي
        </h1>
        <p className="mt-3 text-sm md:text-base  text-[#607779]">
          {profile
            ? `أهلًا ${profile.name}، يمكنك تحديث بياناتك وإدارة طلباتك وعناوينك من هنا.`
            : "يمكنك تحديث بياناتك وإدارة طلباتك وعناوينك من هنا."}
        </p>
        {!ready ? (
          <div
            role="status"
            className="mt-6 rounded-xl border border-gray-200 bg-white p-10 text-center text-sm text-muted"
          >
            جاري تحميل بيانات الحساب…
          </div>
        ) : !profile ? (
          <div className="mt-6 rounded-xl border border-gray-200 bg-white px-5 py-12 text-center">
            <h2 className="text-xl font-bold text-[#17202A]">مرحبًا بك في حسابك</h2>
            <p className="mt-3 text-sm text-muted">
              سجّل الدخول ال لعرض بياناتك وتعديلها.
            </p>
            <Link
              href="/login?next=%2Fprofile"
              className="mt-5 inline-flex min-h-11 items-center justify-center rounded-lg bg-primary px-6 py-2 text-sm font-bold text-white transition-colors hover:bg-ink shadow-button"
            >
              تسجيل الدخول
            </Link>
          </div>
        ) : (
          <div className="mt-6 grid items-start gap-5 md:grid-cols-[232px_minmax(0,1fr)] lg:gap-6">
            <AccountSidebar active="/profile" />
            <div className="min-w-0 space-y-4">
              <ProfileDetails profile={profile} />
              <ProfileAddress
                address={defaultAddress(state.addresses)}
                count={state.addresses.length}
              />
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
