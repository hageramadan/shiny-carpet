"use client";

import { useEffect, useRef } from "react";
import type { Address } from "@/lib/data";

export default function DeleteAddressDialog({
  address,
  onCancel,
  onConfirm,
  pending = false,
  error = "",
}: {
  address: Address;
  onCancel: () => void;
  onConfirm: () => void;
  pending?: boolean;
  error?: string;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    dialog?.showModal();
    return () => dialog?.close();
  }, []);

  return (
    <dialog
      ref={ref}
      aria-labelledby="delete-address-heading"
      aria-describedby="delete-address-description"
      onCancel={(event) => {
        event.preventDefault();
        if (!pending) onCancel();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          const box = event.currentTarget.getBoundingClientRect();
          if (
            event.clientX < box.left ||
            event.clientX > box.right ||
            event.clientY < box.top ||
            event.clientY > box.bottom
          )
            if (!pending) onCancel();
        }
      }}
      className="fixed inset-0 m-auto w-[calc(100%_-_2rem)] max-w-96 rounded-xl border border-gray-200 bg-white px-6 py-10 text-center text-ink backdrop:bg-black/60"
    >
      <h2
        id="delete-address-heading"
        className="text-xl font-bold text-[#17202A]"
      >
        تأكيد حذف عنوان {address.label}
      </h2>
      <p
        id="delete-address-description"
        className="mt-4 text-sm leading-7 text-muted"
      >
        هل تريد حذف عنوان «{address.label}»؟
        <br />
        لن يؤثر ذلك على العناوين المسجلة في طلباتك السابقة.
      </p>
      <div className="mt-4 grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={onConfirm}
          disabled={pending}
          className="min-h-11 rounded-lg bg-[#f44e51] px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-red-600"
        >
          {pending ? "جاري الحذف…" : "تأكيد الحذف"}
        </button>
        <button
          type="button"
          autoFocus
          onClick={onCancel}
          disabled={pending}
          className="min-h-11 rounded-lg border border-[#f44e51] px-4 py-2 text-sm font-bold text-[#f44e51] transition-colors hover:bg-red-50"
        >
          إلغاء
        </button>
      </div>
      {error && (
        <p
          role="alert"
          className="mt-3 text-sm text-red-700"
        >
          {error}
        </p>
      )}
    </dialog>
  );
}
