"use client";
import { useTranslation } from "@/components/i18n/LanguageProvider";

import { useEffect, useRef } from "react";
import { FiLogOut } from "react-icons/fi";

export default function LogoutDialog({
  pending,
  error,
  onConfirm,
  onCancel,
}: {
  pending: boolean;
  error: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const t = useTranslation();
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    dialog?.showModal();
    return () => dialog?.close();
  }, []);

  return (
    <dialog
      ref={ref}
      aria-labelledby="logout-title"
      aria-describedby="logout-description"
      dir={t.dir}
      onCancel={(event) => {
        event.preventDefault();
        if (!pending) onCancel();
      }}
      className="fixed inset-0 m-auto w-[calc(100%_-_2rem)] max-w-sm rounded-2xl border border-gray-200 bg-white p-6 text-center text-ink shadow-xl backdrop:bg-black/45"
    >
      <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary">
        <FiLogOut
          aria-hidden="true"
          className="size-6"
        />
      </div>
      <h2
        id="logout-title"
        className="text-xl font-bold"
      >
        {t("تسجيل الخروج")}
      </h2>
      <p
        id="logout-description"
        className="mt-3 text-sm leading-7 text-muted"
      >
        {t("هل تود تسجيل الخروج من حسابك؟")}
      </p>
      {t(
        error && (
          <p
            role="alert"
            className="mt-3 text-sm text-red-700"
          >
            {t(error)}
          </p>
        ),
      )}
      <div className="mt-5 grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={onConfirm}
          disabled={pending}
          aria-busy={pending}
          className="min-h-11 rounded-lg bg-primary px-3 py-2 text-sm font-bold text-white transition-colors hover:bg-ink disabled:opacity-50"
        >
          {t(pending ? "جاري تسجيل الخروج…" : "نعم، تسجيل الخروج")}
        </button>
        <button
          type="button"
          autoFocus
          onClick={onCancel}
          disabled={pending}
          className="min-h-11 rounded-lg border border-gray-200 px-3 py-2 text-sm font-bold transition-colors hover:bg-gray-50 disabled:opacity-50"
        >
          {t("لا، البقاء في الحساب")}
        </button>
      </div>
    </dialog>
  );
}
