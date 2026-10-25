"use client";
import { useState } from "react";
import Link from "next/link";
import { FiMapPin } from "react-icons/fi";
import type { Address } from "@/lib/data";
import { addressLines } from "@/lib/addresses";
import PhoneInput from "@/components/forms/PhoneInput";

type Props = {
  addresses: Address[];
  selected?: Address;
  phone?: string;
  onSelect: (id: string) => void;
  loading?: boolean;
  error?: string;
  onRetry?: () => void;
};
export default function AddressCard({
  addresses,
  selected,
  phone,
  onSelect,
  loading = false,
  error = "",
  onRetry,
}: Props) {
  const [choosing, setChoosing] = useState(false);
  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-4 sm:p-5 lg:p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2 sm:gap-4">
        <h2 className="flex items-center gap-2 text-base font-bold text-ink">
          <FiMapPin className="text-primary" />
          عنوان الاستلام
        </h2>
        {!loading && !error && addresses.length > 0 && (
          <button
            type="button"
            onClick={() => setChoosing(!choosing)}
            aria-expanded={choosing}
            className="inline-flex min-h-11 items-center text-xs font-bold text-primary"
          >
            تغيير / تعديل
          </button>
        )}
      </div>
      {loading ? (
        <p
          role="status"
          className="text-sm text-muted"
        >
          جاري تحميل العناوين…
        </p>
      ) : error ? (
        <div>
          <p
            role="alert"
            className="text-sm text-red-700"
          >
            {error}
          </p>
          <button
            type="button"
            onClick={onRetry}
            className="min-h-11 text-sm text-primary"
          >
            إعادة المحاولة
          </button>
        </div>
      ) : (
        <>
          {selected ? (
            <div className="rounded-xl bg-[#f7f9fa] p-3 wrap-anywhere sm:p-4 text-sm leading-8 text-ink">
              <strong>{selected.label}</strong>
              {addressLines(selected).map((line, index) => (
                <p key={index}>{line}</p>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted">لا توجد عناوين محفوظة بعد.</p>
          )}
          {choosing && (
            <div className="mt-4 space-y-3">
              {addresses.map((address) => (
                <label
                  key={address.id}
                  className="flex cursor-pointer items-start gap-3 rounded-xl border border-gray-200 p-3 text-sm"
                >
                  <input
                    type="radio"
                    name="pickup-address"
                    checked={selected?.id === address.id}
                    onChange={() => onSelect(address.id)}
                    className="mt-1 accent-primary"
                  />
                  <span className="min-w-0 wrap-anywhere">
                    <strong className="block">{address.label}</strong>
                    <span className="text-xs leading-6 text-muted">
                      {address.city}، {address.street}
                    </span>
                  </span>
                </label>
              ))}
            </div>
          )}
          <div className="mt-3 flex flex-wrap gap-4">
            <Link
              href="/addresses/new?next=%2Fcheckout"
              className="inline-flex min-h-11 items-center text-xs font-bold text-primary"
            >
              + إضافة عنوان
            </Link>
            {selected && (
              <Link
                href={`/addresses/${selected.id}/edit?next=%2Fcheckout`}
                className="inline-flex min-h-11 items-center text-xs font-bold text-primary"
              >
                تعديل العنوان المحدد
              </Link>
            )}
          </div>
        </>
      )}
      <div className="mt-5 border-t border-gray-200 pt-4">
        <PhoneInput
          form="checkout-form"
          name="phone"
          required
          defaultValue={phone}
        />
        <p className="mt-2 text-xs leading-6 text-muted">
          يمكنك تعديل رقم التواصل لهذا الطلب.
        </p>
      </div>
    </section>
  );
}
