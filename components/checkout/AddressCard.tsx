"use client";
import { useState, type FormEvent } from "react";
import { FiMapPin } from "react-icons/fi";
import type { Address } from "@/lib/data";

type Props = {
  addresses: Address[];
  selected?: Address;
  phone?: string;
  onSelect: (id: string) => void;
  onSave: (address: Address) => void;
};

export default function AddressCard({
  addresses,
  selected,
  phone,
  onSelect,
  onSave,
}: Props) {
  const [choosing, setChoosing] = useState(false);
  const [editing, setEditing] = useState<Address | null | undefined>(undefined);
  const showForm = editing !== undefined || addresses.length === 0;

  function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    onSave({
      ...editing,
      id: editing?.id || crypto.randomUUID(),
      label: String(form.get("label")).trim(),
      city: String(form.get("city")).trim(),
      street: String(form.get("street")).trim(),
      building: String(form.get("building")).trim(),
    });
    setEditing(undefined);
    setChoosing(false);
  }

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-4 sm:p-5 lg:p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2 sm:gap-4">
        <h2 className="flex items-center gap-2 text-base font-bold text-ink">
          <FiMapPin className="text-primary" />
          عنوان الاستلام
        </h2>
        {addresses.length > 0 && (
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
      {selected && !showForm && (
        <div className="rounded-xl bg-[#f7f9fa] p-3 wrap-anywhere sm:p-4 text-sm leading-8 text-ink">
          <strong>{selected.label}</strong>
          <p>
            {selected.street}، {selected.building}
          </p>
          <p className="text-xs text-muted">{selected.city}</p>
        </div>
      )}
      {choosing && !showForm && (
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
          <div className="flex flex-wrap gap-4">
            <button
              type="button"
              onClick={() => setEditing(null)}
              className="inline-flex min-h-11 items-center text-xs font-bold text-primary"
            >
              + إضافة عنوان
            </button>
            {selected && (
              <button
                type="button"
                onClick={() => setEditing(selected)}
                className="inline-flex min-h-11 items-center text-xs font-bold text-primary"
              >
                تعديل العنوان المحدد
              </button>
            )}
          </div>
        </div>
      )}
      {showForm && (
        <form
          key={editing?.id || "new"}
          onSubmit={save}
          className="space-y-4"
        >
          <div className="grid gap-3 *:min-w-0 sm:grid-cols-2">
            <label className="text-sm text-ink">
              اسم العنوان
              <input
                name="label"
                required
                maxLength={50}
                defaultValue={editing?.label}
                placeholder="البيت"
                className="mt-2 min-h-11 w-full rounded-xl border border-gray-200 px-3 text-base sm:text-sm"
              />
            </label>
            <label className="text-sm text-ink">
              المدينة / المنطقة
              <input
                name="city"
                required
                maxLength={100}
                defaultValue={editing?.city}
                placeholder="المدينة والحي"
                className="mt-2 min-h-11 w-full rounded-xl border border-gray-200 px-3 text-base sm:text-sm"
              />
            </label>
          </div>
          <label className="block text-sm text-ink">
            العنوان بالتفصيل
            <input
              name="street"
              required
              maxLength={300}
              defaultValue={editing?.street}
              placeholder="اسم الشارع وأقرب علامة مميزة"
              className="mt-2 min-h-11 w-full rounded-xl border border-gray-200 px-3 text-base sm:text-sm"
            />
          </label>
          <label className="block text-sm text-ink">
            العمارة والشقة
            <input
              name="building"
              required
              maxLength={100}
              defaultValue={editing?.building}
              placeholder="العمارة، الدور، الشقة"
              className="mt-2 min-h-11 w-full rounded-xl border border-gray-200 px-3 text-base sm:text-sm"
            />
          </label>
          <div className="grid grid-cols-2 gap-3 sm:flex">
            <button className="min-h-11 rounded-xl bg-primary px-5 py-2 text-sm font-bold text-white hover:bg-ink shadow-button">
              حفظ العنوان
            </button>
            {addresses.length > 0 && (
              <button
                type="button"
                onClick={() => setEditing(undefined)}
                className="min-h-11 rounded-xl border border-gray-200 px-5 py-2 text-sm"
              >
                إلغاء
              </button>
            )}
          </div>
        </form>
      )}
      <div className="mt-5 border-t border-gray-200 pt-4">
        <label className="block text-sm font-bold text-ink">
          رقم الهاتف
          <input
            form="checkout-form"
            type="tel"
            name="phone"
            required
            pattern="[+0-9 ()-]{8,20}"
            defaultValue={phone}
            autoComplete="tel"
            dir="ltr"
            placeholder="01xxxxxxxxx"
            className="mt-3 min-h-12 w-full rounded-xl border border-gray-200 px-3 text-base font-normal sm:text-sm"
          />
        </label>
        <p className="mt-2 text-xs leading-6 text-muted">
          يمكنك تعديل رقم التواصل لهذا الطلب.
        </p>
      </div>
    </section>
  );
}
