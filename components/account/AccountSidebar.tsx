"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { FiEdit2, FiLogOut, FiMapPin, FiShoppingBag, FiUser } from "react-icons/fi";
import { useStore } from "@/components/store";
import { clearAuthDraft } from "@/lib/auth-flow";
import { useAuthAction } from "@/hooks/useAuthAction";
import { announceSessionChange, authRequest } from "@/lib/auth/client";
import ProfileAvatar from "./ProfileAvatar";
import LogoutDialog from "./LogoutDialog";
import toast from "react-hot-toast";

const accountLinks = [
  { href: "/profile", label: "الملف الشخصي", icon: FiUser },
  { href: "/orders", label: "طلباتي", icon: FiShoppingBag },
  { href: "/addresses", label: "العناوين المحفوظة", icon: FiMapPin },
];

export default function AccountSidebar({
  active,
  selectedImage,
  onImageChange,
  imageDisabled = false,
}: {
  active: string;
  selectedImage?: File | null;
  onImageChange?: (image: File) => void;
  imageDisabled?: boolean;
}) {
  const { state, update } = useStore();
  const router = useRouter();
  const { error, setError, pending, run } = useAuthAction();
  const [confirmLogout, setConfirmLogout] = useState(false);
  const imageInput = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string>();
  const [imageError, setImageError] = useState("");
  useEffect(() => {
    if (!selectedImage) {
      setPreview(undefined);
      return;
    }
    const url = URL.createObjectURL(selectedImage);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [selectedImage]);

  async function signOut() {
    if (!confirmLogout) return;
    await run("logout", async (signal) => {
      await authRequest("logout", {}, signal);
      signal.throwIfAborted();
      clearAuthDraft();
      update((current) => ({ ...current, profile: null }));
      announceSessionChange();
      toast.success("تم تسجيل الخروج بنجاح.", { id: "auth-success" });
      router.replace("/");
    });
  }

  return (
    <aside className="rounded-xl border border-gray-200 bg-white px-4 pb-6 pt-7">
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="relative">
          <ProfileAvatar
            name={state.profile?.name}
            image={preview ?? state.profile?.image}
          />
          {onImageChange && (
            <>
              <button
                type="button"
                aria-label="تغيير صورة الملف الشخصي"
                title="تغيير الصورة"
                onClick={() => imageInput.current?.click()}
                disabled={pending || imageDisabled}
                className="absolute -bottom-1 -right-1 flex size-8 items-center justify-center rounded-full border-2 border-white bg-primary text-white shadow-sm transition-colors hover:bg-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-50"
              >
                <FiEdit2
                  aria-hidden="true"
                  className="size-4"
                />
              </button>
              <input
                ref={imageInput}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                aria-label="اختيار صورة الملف الشخصي"
                className="hidden"
                disabled={pending || imageDisabled}
                onChange={(event) => {
                  const file = event.currentTarget.files?.[0];
                  event.currentTarget.value = "";
                  if (!file) return;
                  if (
                    !["image/jpeg", "image/png", "image/webp"].includes(file.type) ||
                    file.size > 5 * 1024 * 1024
                  ) {
                    setImageError(
                      "اختر صورة JPG أو PNG أو WebP بحجم لا يتجاوز ٥ ميجابايت.",
                    );
                    return;
                  }
                  setImageError("");
                  onImageChange(file);
                }}
              />
            </>
          )}
        </div>
        {imageError && (
          <p
            role="alert"
            className="text-xs text-red-700"
          >
            {imageError}
          </p>
        )}
        {selectedImage && (
          <p
            role="status"
            className="text-xs text-muted"
          >
            اضغط «حفظ المعلومات» لحفظ الصورة.
          </p>
        )}
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
              onClick={() => {
                setError("");
                setConfirmLogout(true);
              }}
              disabled={pending}
              className="flex min-h-11 w-full items-center gap-2 py-3 text-right text-sm text-muted transition-colors hover:text-red-600"
            >
              <FiLogOut
                aria-hidden="true"
                className="size-4 text-[#ff4d58]"
              />
              {pending ? "جاري تسجيل الخروج…" : "تسجيل الخروج"}
            </button>
          </li>
        </ul>
      </nav>
      {confirmLogout && (
        <LogoutDialog
          pending={pending}
          error={error}
          onConfirm={signOut}
          onCancel={() => {
            setConfirmLogout(false);
            setError("");
          }}
        />
      )}
    </aside>
  );
}
