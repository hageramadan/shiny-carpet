"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { useAddresses } from "./AddressesProvider";
import { useAuthAction } from "@/hooks/useAuthAction";
import { TEMPORARY_ADDRESS_LOCATION_IDS } from "@/lib/api/addresses";
import toast from "react-hot-toast";
import type { Address } from "@/lib/data";
import type { Place } from "@/lib/geocoding";
import { validCoordinates } from "@/lib/addresses";
import AddressFields, { type AddressFieldsValue } from "./AddressFields";
import LocationPicker from "./LocationPicker";

export default function AddressEditor({ address }: { address?: Address }) {
  const router = useRouter();
  const addresses = useAddresses();
  const action = useAuthAction();
  const [fields, setFields] = useState<AddressFieldsValue>({
    label: address?.label ?? "",
    region: address?.region ?? "",
    city: address?.city ?? "",
    street: address?.street ?? "",
    building: address?.building ?? "",
    floor: address?.floor ?? "",
    apartment: address?.apartment ?? "",
    details: address?.details ?? "",
    notes: address?.notes ?? "",
  });
  const [location, setLocation] = useState(address?.location);
  const [busy, setBusy] = useState(false);
  const { error, setError } = action;
  const pending = action.pending || addresses.busy;

  function placeSelected(place: Place) {
    setFields((current) => ({
      ...current,
      region: place.region,
      city: place.city,
      street: place.street,
      building: place.building,
    }));
    setError("");
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy || pending) return;
    if (!location || !validCoordinates(location)) {
      setError("حدد موقع العنوان على الخريطة أو باستخدام البحث أولًا.");
      return;
    }
    if (
      [
        fields.label,
        fields.region,
        fields.city,
        ...(address ? [] : [fields.street, fields.building]),
      ].some((value) => !value.trim())
    ) {
      setError("يرجى استكمال تفاصيل العنوان المطلوبة.");
      return;
    }
    await action.run("save", async (signal) => {
      const draft = { ...fields, location, ...TEMPORARY_ADDRESS_LOCATION_IDS };
      const saved = address
        ? await addresses.edit(address.id, draft)
        : await addresses.create(draft);
      signal.throwIfAborted();
      toast.success(address ? "تم تحديث العنوان بنجاح." : "تمت إضافة العنوان بنجاح.");
      const next = new URLSearchParams(window.location.search).get("next");
      router.push(next === "/checkout" ? `/checkout?address=${saved.id}` : "/addresses");
    });
  }

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1.8fr)_minmax(300px,1fr)]">
      <section className="min-w-0 rounded-xl border border-gray-200 bg-white p-4">
        <h2 className="mb-4 text-xl font-bold text-[#17202A]">
          {address ? `تفاصيل عنوان ${address.label}` : "تفاصيل العنوان"}
        </h2>
        <form onSubmit={submit}>
          <fieldset disabled={pending}>
            <AddressFields
              editing={Boolean(address)}
              value={fields}
              onChange={(value) => {
                setFields(value);
                setError("");
              }}
            />
          </fieldset>
          <p className="mt-3 text-xs leading-6 text-muted">
            {address?.isDefault
              ? "هذا هو عنوانك الافتراضي للاستلام والتوصيل."
              : "سيُحفظ هذا العنوان في حسابك لاستخدامه عند الاستلام والتوصيل."}
          </p>
          {error && (
            <p
              role="alert"
              className="mt-3 text-sm text-red-700"
            >
              {error}
            </p>
          )}
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="submit"
              disabled={busy || pending}
              aria-busy={pending}
              className="min-h-11 rounded-lg bg-primary px-5 py-2 text-sm font-bold text-white transition-colors hover:bg-ink shadow-button"
            >
              {pending ? "جاري الحفظ…" : address ? "حفظ التغييرات" : "حفظ العنوان"}
            </button>
            <Link
              href="/addresses"
              className="inline-flex min-h-11 items-center justify-center rounded-lg border border-primary px-5 py-2 text-sm font-extrabold text-[#087B82] md:text-base transition-colors hover:bg-primary/5"
            >
              إلغاء
            </Link>
          </div>
        </form>
      </section>
      <LocationPicker
        value={location}
        onChange={(value) => {
          setLocation(value);
          setError("");
        }}
        onPlace={placeSelected}
        onBusyChange={setBusy}
      />
    </div>
  );
}
