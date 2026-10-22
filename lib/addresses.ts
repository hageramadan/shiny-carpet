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

export function setDefaultAddress(addresses: Address[], id: string) {
  if (!addresses.some((address) => address.id === id)) return addresses;
  return addresses.map((address) => ({ ...address, isDefault: address.id === id }));
}

export function saveAddress(addresses: Address[], address: Address) {
  const next = addresses.some((item) => item.id === address.id)
    ? addresses.map((item) => (item.id === address.id ? address : item))
    : [...addresses, address];
  return setDefaultAddress(
    next,
    address.isDefault ? address.id : defaultAddress(next)!.id,
  );
}

export function removeAddress(addresses: Address[], id: string) {
  const remaining = addresses.filter((address) => address.id !== id);
  return remaining.length
    ? setDefaultAddress(remaining, defaultAddress(remaining)!.id)
    : remaining;
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
    ]
      .filter(Boolean)
      .join(" · "),
  ].filter(Boolean);
}
