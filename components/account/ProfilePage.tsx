"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getProfile } from "@/lib/profile";
import { authErrorMessage } from "@/lib/auth/contracts";
import { useStore } from "@/components/store";
import AccountSidebar from "./AccountSidebar";
import ProfileDetails from "./ProfileDetails";
import ProfileAddress from "./ProfileAddress";
import { defaultAddress } from "@/lib/addresses";
import { useAddresses } from "@/components/addresses/AddressesProvider";

export default function ProfilePage() {
  const { state, ready, update } = useStore();
  const addressState = useAddresses();
  const profile = state.profile;
  const hasProfile = Boolean(profile);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imageDisabled, setImageDisabled] = useState(true);
  useEffect(() => {
    if (!ready || !hasProfile) return;
    const controller = new AbortController();
    setLoaded(false);
    setError("");
    getProfile(controller.signal)
      .then((next) => {
        if (!controller.signal.aborted)
          update((current) => ({ ...current, profile: next }));
      })
      .catch((error) => {
        if (!controller.signal.aborted) setError(authErrorMessage(error));
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoaded(true);
      });
    return () => controller.abort();
  }, [ready, hasProfile, attempt, update]);

  const contentLoading =
    !ready ||
    !loaded ||
    addressState.status === "loading" ||
    addressState.status === "idle";
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
        {ready && !profile ? (
          <div className="mt-6 rounded-xl border border-gray-200 bg-white px-5 py-12 text-center">
            <h2 className="text-xl font-bold text-[#17202A]">مرحبًا بك في حسابك</h2>
            <p className="mt-3 text-sm text-muted">سجّل الدخول لعرض بيانات حسابك.</p>
            <Link
              href="/login?next=%2Fprofile"
              className="mt-5 inline-flex min-h-11 items-center justify-center rounded-lg bg-primary px-6 py-2 text-sm font-bold text-white transition-colors hover:bg-ink shadow-button"
            >
              تسجيل الدخول
            </Link>
          </div>
        ) : (
          <div className="mt-6 grid items-start gap-5 md:grid-cols-[232px_minmax(0,1fr)] lg:gap-6">
            <div className="md:sticky md:top-24">
              <AccountSidebar
                active="/profile"
                selectedImage={selectedImage}
                onImageChange={setSelectedImage}
                imageDisabled={contentLoading || Boolean(error) || imageDisabled}
              />
            </div>
            <div
              className="min-w-0 space-y-4"
              aria-busy={contentLoading}
            >
              {contentLoading ? (
                <div
                  role="status"
                  aria-label="جاري تحميل بيانات الحساب"
                  className="grid min-h-[420px] place-items-center rounded-xl border border-gray-200 bg-white"
                >
                  <span
                    aria-hidden="true"
                    className="size-10 animate-spin rounded-full border-4 border-primary/20 border-t-primary motion-reduce:animate-none"
                  />
                  <span className="sr-only">جاري تحميل بيانات الحساب…</span>
                </div>
              ) : (
                <>
                  {error ? (
                    <div className="rounded-xl border border-gray-200 bg-white p-4">
                      <p
                        role="alert"
                        className="text-sm text-red-700"
                      >
                        {error}
                      </p>
                      <button
                        type="button"
                        onClick={() => setAttempt((value) => value + 1)}
                        className="mt-3 text-sm text-primary"
                      >
                        إعادة المحاولة
                      </button>
                    </div>
                  ) : (
                    <ProfileDetails
                      key={profile?.phone}
                      profile={profile!}
                      selectedImage={selectedImage}
                      onImageSaved={() => setSelectedImage(null)}
                      onEditingChange={setImageDisabled}
                    />
                  )}
                  <ProfileAddress
                    address={defaultAddress(addressState.addresses)}
                    count={addressState.addresses.length}
                    loading={
                      addressState.status === "loading" || addressState.status === "idle"
                    }
                    error={addressState.error}
                    onRetry={() => void addressState.reload()}
                  />
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
