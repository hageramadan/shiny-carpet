"use client";

import { useEffect, useState } from "react";
import AddressEditor from "@/components/addresses/AddressEditor";
import type { Address } from "@/lib/data";
import { useAddresses } from "@/components/addresses/AddressesProvider";
import LocationPicker from "@/components/addresses/LocationPicker";
import { validCoordinates } from "@/lib/addresses";
import { authErrorMessage } from "@/lib/auth/contracts";

export default function CheckoutLocation({
  address,
  onPendingChange,
}: {
  address: Address;
  onPendingChange: (pending: boolean) => void;
}) {
  const addresses = useAddresses();
  const [location, setLocation] = useState(address.location);
  const [searching, setSearching] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [completing, setCompleting] = useState(false);
  const changed = Boolean(
    location &&
    (location.lat !== address.location?.lat || location.lng !== address.location?.lng),
  );
  const needsDetails = !address.areaId || !address.governorateId || !address.districtId;
  useEffect(() => {
    onPendingChange(changed || searching || saving);
    return () => onPendingChange(false);
  }, [changed, searching, saving, onPendingChange]);

  async function save() {
    if (!location || !validCoordinates(location) || saving || searching || addresses.busy)
      return;
    setSaving(true);
    setError("");
    try {
      await addresses.edit(address.id, { ...address, location });
      setSaved(true);
    } catch (reason) {
      setError(authErrorMessage(reason));
    } finally {
      setSaving(false);
    }
  }

  if (completing)
    return (
      <div className="mt-5 border-t border-gray-100 pt-5">
        <AddressEditor
          address={{ ...address, location }}
          onSaved={(savedAddress) => {
            setLocation(savedAddress.location);
            setCompleting(false);
            setSaved(true);
          }}
        />
        <button
          type="button"
          disabled={addresses.busy}
          onClick={() => setCompleting(false)}
          className="mt-3 min-h-11 text-sm font-bold text-primary"
        >
          العودة إلى اختيار الموقع
        </button>
      </div>
    );

  return (
    <div className="mt-5 border-t border-gray-100 pt-5">
      <p className="mb-3 text-sm leading-7 text-muted">
        حدد نقطة الاستلام بالضغط على الخريطة أو سحب العلامة. عند حفظ الموقع، سيتم تحديث
        موقع العنوان المختار.
      </p>
      <fieldset disabled={saving || addresses.busy}>
        <div inert={saving || addresses.busy}>
          <LocationPicker
            value={location}
            onChange={(point) => {
              setLocation(point);
              setError("");
              setSaved(false);
            }}
            onPlace={() => {}}
            onBusyChange={setSearching}
          />
        </div>
        {changed && (
          <div className="mt-3 rounded-xl bg-primary/5 p-4">
            <p className="text-xs leading-6 text-ink">
              احفظ الموقع المحدد قبل إتمام الطلب. راجع تفاصيل الشارع والمبنى إذا اخترت
              مكانًا مختلفًا.
            </p>
            {needsDetails ? (
              <button
                type="button"
                onClick={() => setCompleting(true)}
                disabled={searching || saving || addresses.busy}
                className="mt-2 inline-flex min-h-11 items-center text-sm font-bold text-primary"
              >
                استكمال بيانات العنوان لحفظ الموقع
              </button>
            ) : (
              <button
                type="button"
                onClick={() => void save()}
                disabled={saving || searching || addresses.busy}
                aria-busy={saving}
                className="mt-3 min-h-11 rounded-xl bg-primary px-5 py-2 text-sm font-bold text-white transition-colors hover:bg-ink disabled:opacity-50"
              >
                {saving ? "جاري حفظ الموقع…" : "حفظ موقع الاستلام"}
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                setLocation(address.location);
                setError("");
                setSaved(false);
              }}
              disabled={saving || searching || addresses.busy}
              className="ms-3 mt-3 min-h-11 px-2 text-sm font-bold text-muted disabled:opacity-50"
            >
              إلغاء تغيير الموقع
            </button>
          </div>
        )}
      </fieldset>
      {error && (
        <p
          role="alert"
          className="mt-3 text-sm text-red-700"
        >
          {error}
        </p>
      )}
      {saved && !changed && (
        <p
          role="status"
          className="mt-3 text-sm text-primary"
        >
          تم حفظ موقع الاستلام.
        </p>
      )}
    </div>
  );
}
