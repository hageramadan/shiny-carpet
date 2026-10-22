"use client";

import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import type { Coordinates } from "@/lib/addresses";

export default function LocationMap({
  value,
  onChange,
  focusVersion,
}: {
  value?: Coordinates;
  onChange: (point: Coordinates) => void;
  focusVersion: number;
}) {
  const host = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const marker = useRef<L.Marker | null>(null);
  const change = useRef(onChange);
  const [tileError, setTileError] = useState(false);
  useEffect(() => {
    change.current = onChange;
  }, [onChange]);

  useEffect(() => {
    if (!host.current) return;
    const instance = L.map(host.current, {
      center: [24.7136, 46.6753],
      zoom: 12,
      scrollWheelZoom: false,
    });
    map.current = instance;
    const tiles = L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a>',
    }).addTo(instance);
    tiles.on("tileerror", () => setTileError(true));
    instance.on("click", (event: L.LeafletMouseEvent) =>
      change.current({ lat: event.latlng.lat, lng: event.latlng.lng }),
    );
    const observer = new ResizeObserver(() => instance.invalidateSize());
    observer.observe(host.current);
    return () => {
      observer.disconnect();
      instance.remove();
      map.current = null;
      marker.current = null;
    };
  }, []);

  useEffect(() => {
    const instance = map.current;
    if (!instance || !value) return;
    const point: L.LatLngExpression = [value.lat, value.lng];
    if (!marker.current) {
      marker.current = L.marker(point, {
        draggable: true,
        title: "الموقع المحدد، اسحب العلامة لتغييره",
        alt: "علامة الموقع المحدد",
        icon: L.divIcon({
          className: "",
          html: '<span class="block size-6 -rotate-45 rounded-t-full rounded-br-full border-2 border-white bg-primary shadow-md"></span>',
          iconSize: [24, 24],
          iconAnchor: [12, 24],
        }),
      }).addTo(instance);
      marker.current.on("dragend", () => {
        const selected = marker.current!.getLatLng();
        change.current({ lat: selected.lat, lng: selected.lng });
      });
    } else {
      marker.current.setLatLng(point);
    }
    instance.setView(point, Math.max(instance.getZoom(), 15), { animate: false });
  }, [value]);

  useEffect(() => {
    if (focusVersion > 0) {
      host.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      host.current?.focus({ preventScroll: true });
    }
  }, [focusVersion]);

  return (
    <div>
      <div
        ref={host}
        tabIndex={0}
        aria-label="خريطة اختيار الموقع. اضغط لتحديد نقطة، أو حرّك الخريطة ثم اختر مركزها."
        dir="ltr"
        className="relative z-0 h-60 w-full overflow-hidden rounded-lg bg-gray-100"
      />
      <button
        type="button"
        onClick={() => {
          const center = map.current?.getCenter();
          if (center) change.current({ lat: center.lat, lng: center.lng });
        }}
        className="mt-2 min-h-9 text-xs text-primary hover:underline"
      >
        اختيار مركز الخريطة
      </button>
      {tileError && (
        <p
          role="status"
          className="mt-2 text-xs leading-6 text-muted"
        >
          تعذر تحميل بعض أجزاء الخريطة. تحقق من الاتصال أو استخدم البحث.
        </p>
      )}
    </div>
  );
}
