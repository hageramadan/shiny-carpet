"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { FiCrosshair, FiSearch } from "react-icons/fi";
import type { Address } from "@/lib/data";
import type { Coordinates } from "@/lib/addresses";
import type { Place } from "@/lib/geocoding";

const LocationMap = dynamic(() => import("./LocationMap"), {
  ssr: false,
  loading: () => (
    <div
      role="status"
      className="grid h-60 place-items-center rounded-lg bg-gray-100 text-sm text-muted"
    >
      جاري تحميل الخريطة…
    </div>
  ),
});

export default function LocationPicker({
  value,
  onChange,
  onPlace,
  onBusyChange,
}: {
  value?: Address["location"];
  onChange: (value: NonNullable<Address["location"]>) => void;
  onPlace: (place: Place) => void;
  onBusyChange: (busy: boolean) => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Place[]>([]);
  const [busy, setBusy] = useState(false);
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState("");
  const [focusVersion, setFocusVersion] = useState(0);
  const request = useRef<AbortController | null>(null);
  const mounted = useRef(true);
  const selectionVersion = useRef(0);
  useEffect(() => {
    onBusyChange(busy || locating);
  }, [busy, locating, onBusyChange]);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      request.current?.abort();
    };
  }, []);

  async function lookup(params: URLSearchParams) {
    request.current?.abort();
    const controller = new AbortController();
    request.current = controller;
    setBusy(true);

    setError("");
    try {
      const response = await fetch(`/api/locations?${params}`, {
        signal: controller.signal,
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "تعذر البحث عن المكان.");
      if (!mounted.current || request.current !== controller) return null;
      return data.places as Place[];
    } catch (reason) {
      if (mounted.current && !controller.signal.aborted)
        setError(reason instanceof Error ? reason.message : "تعذر البحث عن الموقع.");
      return null;
    } finally {
      if (mounted.current && request.current === controller) {
        setBusy(false);
      }
    }
  }

  async function search(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy || locating) return;
    if (query.trim().length < 2) {
      setError("اكتب اسم المدينة أو الشارع للبحث.");
      return;
    }
    setResults([]);
    const places = await lookup(new URLSearchParams({ q: query.trim() }));
    if (places) {
      setResults(places);
      if (!places.length)
        setError("لا توجد نتائج. جرّب اسمًا آخر أو حدد النقطة على الخريطة.");
    }
  }

  async function choosePoint(point: Coordinates) {
    selectionVersion.current += 1;
    setLocating(false);
    setResults([]);
    onChange(point);
    const places = await lookup(
      new URLSearchParams({ lat: String(point.lat), lng: String(point.lng) }),
    );
    if (places?.[0]) {
      // Keep the exact selected coordinates rather than moving to a nearby search result.
      const selected = { ...places[0], ...point };
      onChange({ lat: selected.lat, lng: selected.lng, label: selected.label });
      onPlace(selected);
    } else if (places) {
      setError("تم تحديد النقطة. أدخل تفاصيل العنوان يدويًا لأن اسم المكان غير متاح.");
    }
  }

  function locate() {
    if (!navigator.geolocation) {
      setError("المتصفح لا يدعم تحديد الموقع. استخدم البحث أو اختر نقطة على الخريطة.");
      return;
    }
    const version = ++selectionVersion.current;
    setResults([]);
    setLocating(true);
    setError("");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        if (!mounted.current || selectionVersion.current !== version) return;
        setLocating(false);
        void choosePoint({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      },
      (reason) => {
        if (!mounted.current || selectionVersion.current !== version) return;
        setLocating(false);
        setError(
          reason.code === 1
            ? "لم يُسمح بالوصول إلى موقعك. يمكنك تفعيل الإذن أو اختيار الموقع يدويًا."
            : "تعذر تحديد موقعك الحالي. استخدم البحث أو الخريطة.",
        );
      },
      { enableHighAccuracy: true, timeout: 12_000, maximumAge: 60_000 },
    );
  }

  return (
    <aside className="min-w-0 rounded-xl border border-gray-200 bg-white p-4">
      <h2 className="text-xl font-bold text-[#17202A]">تحديد الموقع</h2>
      <form
        onSubmit={search}
        className="mt-4"
      >
        <label
          htmlFor="location-search"
          className="block text-sm font-bold text-[#17202A]"
        >
          ابحث عن موقعك
        </label>
        <div className="mt-2 flex gap-2">
          <input
            id="location-search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            maxLength={200}
            placeholder="الرياض، حي العليا"
            className="min-h-11 w-full min-w-0 rounded-lg border border-gray-200 px-3 py-2 text-sm placeholder:text-muted"
          />
          <button
            type="submit"
            disabled={busy || locating}
            aria-label="بحث عن الموقع"
            className="grid size-11 shrink-0 place-items-center rounded-lg bg-primary text-white transition-colors hover:bg-ink"
          >
            <FiSearch aria-hidden="true" />
          </button>
        </div>
      </form>
      <button
        type="button"
        onClick={locate}
        disabled={locating || busy}
        className="my-3 inline-flex min-h-9 items-center gap-2 text-sm font-extrabold text-[#087B82] md:text-base hover:text-ink"
      >
        <FiCrosshair aria-hidden="true" />
        {locating ? "جاري تحديد موقعك…" : "استخدم موقعي الحالي"}
      </button>
      {results.length > 0 && (
        <ul
          aria-label="نتائج البحث عن الموقع"
          className="mb-3 max-h-48 overflow-auto rounded-lg border border-gray-200 divide-y divide-gray-100"
        >
          {results.map((place, index) => (
            <li key={`${place.lat}-${place.lng}-${index}`}>
              <button
                type="button"
                onClick={() => {
                  request.current?.abort();
                  setResults([]);
                  onChange({ lat: place.lat, lng: place.lng, label: place.label });
                  onPlace(place);
                  setQuery(place.label);
                }}
                className="w-full px-3 py-2 text-right text-sm leading-6 transition-colors hover:bg-primary/5"
              >
                {place.label}
              </button>
            </li>
          ))}
        </ul>
      )}
      <LocationMap
        value={value}
        onChange={(point) => {
          void choosePoint(point);
        }}
        focusVersion={focusVersion}
      />
      {busy && (
        <p
          role="status"
          className="mt-2 text-xs text-muted"
        >
          جاري البحث عن تفاصيل الموقع…
        </p>
      )}
      {error && (
        <p
          role="status"
          className="mt-2 text-xs leading-6 text-red-700"
        >
          {error}
        </p>
      )}
      <h3 className="mt-4 text-lg font-bold text-[#17202A]">الموقع المحدد</h3>
      {value ? (
        <>
          <p className="mt-3 text-sm md:text-base  text-[#607779]">
            {value.label || "تم تحديد النقطة؛ راجع تفاصيل العنوان قبل الحفظ."}
          </p>
          <p
            dir="ltr"
            className="mt-2 text-right text-xs tabular-nums text-muted"
          >
            {value.lat.toFixed(6)}, {value.lng.toFixed(6)}
          </p>
        </>
      ) : (
        <p className="mt-3 text-sm md:text-base  text-[#607779]">
          ابحث عن مكان أو اضغط على الخريطة لتحديد موقع الاستلام.
        </p>
      )}
      <button
        type="button"
        onClick={() => setFocusVersion((version) => version + 1)}
        className="mt-4 inline-flex min-h-11 w-full items-center justify-center rounded-lg border border-primary px-4 py-2 text-sm font-extrabold text-[#087B82] md:text-base transition-colors hover:bg-primary/5"
      >
        تغيير الموقع
      </button>
      <p className="mt-3 text-xs leading-6 text-muted">
        حدد الموقع على الخريطة ثم أكمل تفاصيل العنوان. بيانات الأماكن ©{" "}
        <a
          href="https://www.openstreetmap.org/copyright"
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary"
        >
          OpenStreetMap
        </a>
        .
      </p>
    </aside>
  );
}
