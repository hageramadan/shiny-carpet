"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { useAddresses } from "./AddressesProvider";
import { useAuthAction } from "@/hooks/useAuthAction";
import { fetchAreas, selectedLocation, type AreaSelection } from "@/lib/api/areas";
import { useApiResource } from "@/hooks/useApiResource";
import AddressLocationFields from "./AddressLocationFields";
import AddressEditorLoading from "./AddressEditorLoading";
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
    street: address?.street ?? "",
    building: address?.building ?? "",
    floor: address?.floor ?? "",
    apartment: address?.apartment ?? "",
    details: address?.details ?? "",
    notes: address?.notes ?? "",
  });
  const areas = useApiResource("address-areas", fetchAreas);
  const [selection, setSelection] = useState<AreaSelection>({
    areaId: address?.areaId,
    governorateId: address?.governorateId,
    districtId: address?.districtId,
  });
  const chosenLocation = selectedLocation(areas.data ?? [], selection);
  const [location, setLocation] = useState(address?.location);
  const [busy, setBusy] = useState(false);
  const { error, setError } = action;
  const pending = action.pending || addresses.busy;

  function placeSelected(place: Place) {
    setFields((current) => ({
      ...current,
      street: place.street,
      building: place.building,
    }));
    setError("");
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy || pending) return;
    if (!chosenLocation) {
      setError("اختر المنطقة والمحافظة والحي من القوائم المتاحة.");
      return;
    }
    if (!location || !validCoordinates(location)) {
      setError("حدد موقع العنوان على الخريطة أو باستخدام البحث أولًا.");
      return;
    }
    if (
      [fields.label, ...(address ? [] : [fields.street, fields.building])].some(
        (value) => !value.trim(),
      )
    ) {
      setError("يرجى استكمال تفاصيل العنوان المطلوبة.");
      return;
    }
    await action.run("save", async (signal) => {
      const draft = { ...fields, location, ...chosenLocation };
      const saved = address
        ? await addresses.edit(address.id, draft)
        : await addresses.create(draft);
      signal.throwIfAborted();
      toast.success(address ? "تم تحديث العنوان بنجاح." : "تمت إضافة العنوان بنجاح.");
      const next = new URLSearchParams(window.location.search).get("next");
      router.push(next === "/checkout" ? `/checkout?address=${saved.id}` : "/addresses");
    });
  }

  if (areas.status === "loading") return <AddressEditorLoading />;
  if (areas.status === "error")
    return (
      <div className="grid min-h-[420px] place-items-center rounded-2xl border border-gray-200 bg-white p-6 text-center">
        <div>
          <p
            role="alert"
            className="text-sm text-red-700"
          >
            تعذر تحميل المناطق والمحافظات والأحياء.
          </p>
          <button
            type="button"
            onClick={areas.reload}
            className="mt-4 min-h-11 rounded-xl bg-primary px-6 text-sm font-bold text-white transition-colors hover:bg-ink"
          >
            إعادة تحميل المناطق
          </button>
        </div>
      </div>
    );

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1.8fr)_minmax(300px,1fr)]">
      <section className="min-w-0 rounded-xl border border-gray-200 bg-white p-4">
        <h2 className="mb-4 text-xl font-bold text-[#17202A]">
          {address ? `تفاصيل عنوان ${address.label}` : "تفاصيل العنوان"}
        </h2>
        <form onSubmit={submit}>
          {areas.status === "success" && !areas.data?.length && (
            <p
              role="status"
              className="mb-4 text-sm text-muted"
            >
              لا توجد مناطق متاحة حاليًا.
            </p>
          )}
          {address && !chosenLocation && areas.status === "success" && (
            <p className="mb-4 text-sm text-muted">
              يرجى اختيار المنطقة والمحافظة والحي لهذا العنوان.
            </p>
          )}
          <fieldset disabled={pending || areas.status !== "success"}>
            <AddressFields
              editing={Boolean(address)}
              value={fields}
              onChange={(value) => {
                setFields(value);
                setError("");
              }}
            >
              <AddressLocationFields
                areas={areas.data ?? []}
                value={selection}
                onChange={(value) => {
                  setSelection(value);
                  setError("");
                }}
              />
            </AddressFields>
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
              disabled={busy || pending || !chosenLocation}
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
