import type { Address } from "./data";

export type Coordinates = { lat: number; lng: number };

export function validCoordinates(point: Coordinates) {
  return (
    Number.isFinite(point.lat) &&
    Number.isFinite(point.lng) &&
    Math.abs(point.lat) <= 90 &&
    Math.abs(point.lng) <= 180
  );
}

export function defaultAddress(addresses: Address[]) {
  return addresses.find((address) => address.isDefault) ?? addresses[0];
}

export function addressLines(address: Address) {
  return [
    [address.building, address.street].filter(Boolean).join("، "),
    [address.city, address.region, address.postalCode, address.country]
      .filter(Boolean)
      .join("، "),
    [
      address.floor && `الدور ${address.floor}`,
      address.apartment && `الشقة ${address.apartment}`,
      address.details,
      address.notes,
    ]
      .filter(Boolean)
      .join(" · "),
  ].filter(Boolean);
}
