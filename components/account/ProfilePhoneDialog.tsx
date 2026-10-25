"use client";

import { useEffect, useRef, type FormEvent } from "react";
import { FiX } from "react-icons/fi";
import type { ApiPhone } from "@/lib/phone";
import OtpInput from "@/components/auth/OtpInput";

export default function ProfilePhoneDialog({
  phone,
  digits,
  onDigitsChange,
  onSubmit,
  onClose,
  pending,
  error,
}: {
  phone: ApiPhone;
  digits: string[];
  onDigitsChange: (digits: string[]) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onClose: () => void;
  pending: boolean;
  error: string;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    dialog?.showModal();
    return () => dialog?.close();
  }, []);
  useEffect(() => {
    if (!pending) ref.current?.querySelector<HTMLInputElement>("input")?.focus();
  }, [pending]);

  return (
    <dialog
      ref={ref}
      aria-labelledby="profile-phone-title"
      aria-describedby="profile-phone-description"
      onCancel={(event) => {
        event.preventDefault();
        if (!pending) onClose();
      }}
      className="fixed inset-0 m-auto max-h-[90dvh] w-[calc(100%_-_2rem)] max-w-md overflow-y-auto rounded-2xl border border-gray-200 bg-white p-5 text-ink shadow-xl backdrop:bg-black/45 sm:p-7"
      dir="rtl"
    >
      <div className="flex items-center justify-between gap-3">
        <h2
          id="profile-phone-title"
          className="text-xl font-bold"
        >
          تأكيد رقم الهاتف الجديد
        </h2>
        <button
          type="button"
          onClick={onClose}
          disabled={pending}
          aria-label="إغلاق نافذة التحقق"
          className="flex size-10 shrink-0 items-center justify-center rounded-full text-muted hover:bg-gray-100 disabled:opacity-50"
        >
          <FiX
            aria-hidden="true"
            className="size-5"
          />
        </button>
      </div>
      <p
        id="profile-phone-description"
        className="mt-3 text-sm leading-7 text-muted"
      >
        أدخل رمز التحقق المرسل إلى{" "}
        <bdi>
          {phone.country_code}
          {phone.phone}
        </bdi>{" "}
        لتأكيد رقم الهاتف الجديد.
      </p>
      <form
        onSubmit={onSubmit}
        className="mt-4"
      >
        <OtpInput
          value={digits}
          onChange={onDigitsChange}
          invalid={Boolean(error)}
          disabled={pending}
        />
        {error && (
          <p
            id="otp-error"
            role="alert"
            className="mt-3 text-sm text-red-700"
          >
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={pending || digits.some((digit) => !digit)}
          aria-busy={pending}
          className="mt-5 min-h-11 w-full rounded-lg bg-primary px-6 py-2 text-sm font-bold text-white transition-colors hover:bg-ink disabled:opacity-50"
        >
          {pending ? "جاري التحقق…" : "تأكيد رقم الهاتف"}
        </button>
      </form>
    </dialog>
  );
}
