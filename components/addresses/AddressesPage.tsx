"use client";

import Link from "next/link";
import { useState } from "react";
import { FiMapPin } from "react-icons/fi";
import { useStore } from "@/components/store";
import type { Address } from "@/lib/data";
import { defaultAddress, removeAddress, setDefaultAddress } from "@/lib/addresses";
import AddressesLayout from "./AddressesLayout";
import SavedAddressCard from "./SavedAddressCard";
import DeleteAddressDialog from "./DeleteAddressDialog";

export default function AddressesPage() {
  const { state, update, ready } = useStore();
  const [deleting, setDeleting] = useState<Address | null>(null);
  const [message, setMessage] = useState("");
  const preferred = defaultAddress(state.addresses);
  const count = state.addresses.length;
  const countLabel =
    count === 1
      ? "عنوان محفوظ"
      : count === 2
        ? "عنوانان محفوظان"
        : `${new Intl.NumberFormat("ar-EG").format(count)} من العناوين المحفوظة`;

  function confirmDelete() {
    if (!deleting) return;
    update((current) => ({
      ...current,
      addresses: removeAddress(current.addresses, deleting.id),
    }));
    setMessage(`تم حذف عنوان «${deleting.label}» من المتصفح.`);
    setDeleting(null);
  }

  return (
    <AddressesLayout
      title="العناوين المحفوظة"
      description="احفظ عناوينك لتسهيل الاستلام والتوصيل في طلباتك القادمة."
    >
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-lg font-bold text-[#17202A]">
          {ready ? countLabel : "العناوين المحفوظة"}
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
      ) : count ? (
        <ul className="space-y-4">
          {state.addresses.map((address) => (
            <li key={address.id}>
              <SavedAddressCard
                address={address}
                isDefault={address.id === preferred?.id}
                onDefault={() => {
                  update((current) => ({
                    ...current,
                    addresses: setDefaultAddress(current.addresses, address.id),
                  }));
                  setMessage(`تم تعيين «${address.label}» كعنوان افتراضي.`);
                }}
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
        />
      )}
    </AddressesLayout>
  );
}
