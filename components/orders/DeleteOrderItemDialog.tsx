"use client";
import { useEffect, useId, useRef } from "react";
import { FiTrash2 } from "react-icons/fi";
import { useTranslation } from "@/components/i18n/LanguageProvider";

export default function DeleteOrderItemDialog({
  pending,
  disabled,
  error,
  onConfirm,
  onCancel,
}: {
  pending: boolean;
  disabled: boolean;
  error: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const t = useTranslation();
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  useEffect(() => {
    const dialog = ref.current;
    dialog?.showModal();
    return () => dialog?.close();
  }, []);

  return (
    <dialog
      ref={ref}
      role="alertdialog"
      aria-label={t("تأكيد حذف المنتج")}
      aria-describedby={titleId}
      dir={t.dir}
      onCancel={(event) => {
        event.preventDefault();
        if (!pending) onCancel();
      }}
      className="fixed inset-0 m-auto w-[calc(100%_-_2rem)] max-w-sm rounded-2xl border border-gray-200 bg-white p-6 text-center text-ink shadow-xl backdrop:bg-black/45"
    >
      <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-red-50 text-red-600">
        <FiTrash2
          aria-hidden="true"
          className="size-6"
        />
      </div>
      <h2
        id={titleId}
        className="text-xl font-bold"
      >
        {t("هل تريد الحذف؟")}
      </h2>
      {error && (
        <p
          role="alert"
          className="mt-3 text-sm text-red-700"
        >
          {t(error)}
        </p>
      )}
      <div className="mt-5 grid grid-cols-2 gap-3">
        <button
          type="button"
          disabled={disabled}
          aria-busy={pending}
          onClick={onConfirm}
          className="min-h-11 rounded-lg bg-red-600 px-3 py-2 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-50"
        >
          {t(pending ? "جاري الحذف…" : "تأكيد الحذف")}
        </button>
        <button
          type="button"
          autoFocus
          disabled={pending}
          onClick={onCancel}
          className="min-h-11 rounded-lg border border-gray-200 px-3 py-2 text-sm font-bold hover:bg-gray-50 disabled:opacity-50"
        >
          {t("إلغاء")}
        </button>
      </div>
    </dialog>
  );
}
