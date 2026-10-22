"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { useStore } from "@/components/store";
import type { Address } from "@/lib/data";
import type { Place } from "@/lib/geocoding";
import { saveAddress, validCoordinates } from "@/lib/addresses";
import AddressFields, { type AddressFieldsValue } from "./AddressFields";
import LocationPicker from "./LocationPicker";

export default function AddressEditor({ address }: { address?: Address }) {
  const router = useRouter();
  const { update } = useStore();
  const [fields, setFields] = useState<AddressFieldsValue>({
    label: address?.label ?? "",
    region: address?.region ?? "",
    city: address?.city ?? "",
    street: address?.street ?? "",
    building: address?.building ?? "",
    floor: address?.floor ?? "",
    apartment: address?.apartment ?? "",
    details: address?.details ?? "",
  });
  const [location, setLocation] = useState(address?.location);
  const [country, setCountry] = useState(address?.country ?? "");
  const [postalCode, setPostalCode] = useState(address?.postalCode ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  function placeSelected(place: Place) {
    setFields((current) => ({
      ...current,
      region: place.region,
      city: place.city,
      street: place.street,
      building: place.building,
    }));
    setCountry(place.country);
    setPostalCode(place.postalCode);
    setError("");
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    if (!location || !validCoordinates(location)) {
      setError("حدد موقع العنوان على الخريطة أو باستخدام البحث أولًا.");
      return;
    }
    if (
      [fields.label, fields.region, fields.city, fields.street, fields.building].some(
        (value) => !value.trim(),
      )
    ) {
      setError("يرجى استكمال تفاصيل العنوان المطلوبة.");
      return;
    }
    const value: Address = {
      ...address,
      ...Object.fromEntries(
        Object.entries(fields).map(([key, text]) => [key, text.trim()]),
      ),
      id: address?.id || crypto.randomUUID(),
      label: fields.label.trim(),
      region: fields.region.trim(),
      city: fields.city.trim(),
      street: fields.street.trim(),
      building: fields.building.trim(),
      country,
      postalCode,
      location,
    };
    update((current) => ({
      ...current,
      addresses: saveAddress(current.addresses, value),
    }));
    router.push("/addresses");
  }

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1.8fr)_minmax(300px,1fr)]">
      <section className="min-w-0 rounded-xl border border-gray-200 bg-white p-4">
        <h2 className="mb-4 text-xl font-bold text-[#17202A]">
          {address ? `تفاصيل عنوان ${address.label}` : "تفاصيل العنوان"}
        </h2>
        <form onSubmit={submit}>
          <AddressFields
            value={fields}
            onChange={(value) => {
              setFields(value);
              setError("");
            }}
          />
          <p className="mt-3 text-xs leading-6 text-muted">
            {address?.isDefault
              ? "هذا هو عنوانك الافتراضي للاستلام والتوصيل."
              : "سيُحفظ هذا العنوان في المتصفح لاستخدامه في طلبات المعاينة القادمة."}
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
              disabled={busy}
              className="min-h-11 rounded-lg bg-primary px-5 py-2 text-sm font-bold text-white transition-colors hover:bg-ink shadow-button"
            >
              {address ? "حفظ التغييرات" : "حفظ العنوان"}
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
