"use client";

import Link from "next/link";
import { useState } from "react";
import { FiMapPin } from "react-icons/fi";
import { useStore } from "@/components/store";
import type { Address } from "@/lib/data";
import { useAddresses } from "./AddressesProvider";
import { useAuthAction } from "@/hooks/useAuthAction";
import toast from "react-hot-toast";
import AddressesLayout from "./AddressesLayout";
import SavedAddressCard from "./SavedAddressCard";
import DeleteAddressDialog from "./DeleteAddressDialog";

export default function AddressesPage() {
  const { state, ready } = useStore();
  const { addresses, status, error, reload, remove, busy } = useAddresses();
  const action = useAuthAction();
  const [deleting, setDeleting] = useState<Address | null>(null);
  const [message, setMessage] = useState("");
  const count = addresses.length;
  const countLabel =
    count === 1
      ? "عنوان محفوظ"
      : count === 2
        ? "عنوانان محفوظان"
        : `${new Intl.NumberFormat("ar-EG").format(count)} من العناوين المحفوظة`;

  async function confirmDelete() {
    if (!deleting) return;
    await action.run("delete", async (signal) => {
      await remove(deleting.id);
      signal.throwIfAborted();
      setMessage(`تم حذف عنوان «${deleting.label}».`);
      toast.success("تم حذف العنوان بنجاح.");
      setDeleting(null);
    });
  }

  return (
    <AddressesLayout
      title="العناوين المحفوظة"
      description="احفظ عناوينك لتسهيل الاستلام والتوصيل في طلباتك القادمة."
    >
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-lg font-bold text-[#17202A]">
          {ready && status === "ready" ? countLabel : "العناوين المحفوظة"}
        </h2>
        <Link
          href="/addresses/new"
          className="inline-flex min-h-11 items-center justify-center rounded-lg bg-primary px-5 py-2 text-sm font-bold text-white transition-colors hover:bg-ink shadow-button"
        >
          إضافة عنوان جديد
        </Link>
      </div>
      {message && (
        <p
          role="status"
          className="mb-4 text-sm text-primary"
        >
          {message}
        </p>
      )}
      {!ready ? (
        <p
          role="status"
          className="rounded-xl border border-gray-200 bg-white p-10 text-center text-muted"
        >
          جاري تحميل العناوين…
        </p>
      ) : !state.profile ? (
        <Link
          href="/login?next=%2Faddresses"
          className="inline-flex min-h-11 items-center rounded-lg bg-primary px-5 text-white"
        >
          سجّل الدخول لعرض عناوينك
        </Link>
      ) : status === "error" ? (
        <div>
          <p role="alert">{error}</p>
          <button
            onClick={() => void reload()}
            className="min-h-11 text-primary"
          >
            إعادة المحاولة
          </button>
        </div>
      ) : status !== "ready" && !busy ? (
        <p role="status">جاري تحميل العناوين…</p>
      ) : count ? (
        <ul className="space-y-4">
          {addresses.map((address) => (
            <li key={address.id}>
              <SavedAddressCard
                address={address}
                isDefault={Boolean(address.isDefault)}
                disabled={busy || action.pending}
                onDelete={() => setDeleting(address)}
              />
            </li>
          ))}
        </ul>
      ) : (
        <div className="rounded-xl border border-gray-200 bg-white px-5 py-12 text-center">
          <FiMapPin
            aria-hidden="true"
            className="mx-auto size-12 text-primary"
          />
          <h3 className="mt-4 text-xl font-bold text-[#17202A]">لا توجد عناوين محفوظة</h3>
          <p className="mt-3 text-sm md:text-base  text-[#607779]">
            أضف عنوانك الأول وحدد موقعه على الخريطة.
          </p>
        </div>
      )}
      {deleting && (
        <DeleteAddressDialog
          address={deleting}
          onCancel={() => setDeleting(null)}
          onConfirm={confirmDelete}
          pending={busy || action.pending}
          error={action.error || error}
        />
      )}
    </AddressesLayout>
  );
}
