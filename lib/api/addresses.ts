import { authenticatedApiRequest } from "../auth/client";
import { ApiError, ApiResponseError } from "./client";
import { isRecord, isPositiveId } from "./validation";
import { validCoordinates } from "../addresses";
import type { Address } from "../data";

export type AddressDraft = Omit<Address, "id" | "isDefault" | "country" | "postalCode">;

function success(body: unknown): Record<string, unknown> {
  if (!isRecord(body)) throw new ApiResponseError("Invalid address response");
  if (body.result !== true)
    throw new ApiError(
      typeof body.errNum === "number" && body.errNum >= 400 && body.errNum <= 599
        ? body.errNum
        : 400,
      body,
    );
  return body;
}
function text(value: unknown): string {
  if (value == null) return "";
  if (typeof value !== "string") throw new ApiResponseError("Invalid address field");
  return value;
}
function coordinate(value: unknown): number {
  if (
    (typeof value !== "string" && typeof value !== "number") ||
    (typeof value === "string" && !value.trim())
  )
    throw new ApiResponseError("Invalid address coordinate");
  const number = Number(value);
  if (!Number.isFinite(number)) throw new ApiResponseError("Invalid address coordinate");
  return number;
}
export function parseAddress(value: unknown): Address {
  if (
    !isRecord(value) ||
    !isPositiveId(value.id) ||
    typeof value.title !== "string" ||
    !value.title.trim()
  )
    throw new ApiResponseError("Invalid address");
  const location =
    value.lat == null && value.lng == null
      ? undefined
      : { lat: coordinate(value.lat), lng: coordinate(value.lng) };
  if (location && !validCoordinates(location))
    throw new ApiResponseError("Invalid address location");
  return {
    id: String(value.id),
    label: value.title,
    street: text(value.street),
    building: text(value.building_number),
    floor: text(value.floor),
    apartment: text(value.apartment),
    details: text(value.details),
    region: text(value.governorate_name),
    city: text(value.city_name),
    notes: text(value.notes),
    location,
    isDefault: value.is_default === true || value.is_default === 1,
    governorateId: isPositiveId(value.governorate_id) ? value.governorate_id : undefined,
    areaId: isPositiveId(value.area_id) ? value.area_id : undefined,
    districtId: isPositiveId(value.district_id) ? value.district_id : undefined,
  };
}
export function parseAddresses(body: unknown): Address[] {
  const data = success(body).data;
  if (!isRecord(data) || !Array.isArray(data.addresses))
    throw new ApiResponseError("Missing addresses");
  const addresses = data.addresses.map(parseAddress);
  if (new Set(addresses.map((address) => address.id)).size !== addresses.length)
    throw new ApiResponseError("Duplicate address IDs");
  return addresses;
}
function savedAddress(body: unknown): Address {
  const data = success(body).data;
  if (!isRecord(data)) throw new ApiResponseError("Missing saved address");
  return parseAddress(data.address);
}
function addressId(value: string): number {
  if (!/^[1-9]\d*$/.test(value) || !isPositiveId(Number(value)))
    throw new RangeError("Invalid address ID");
  return Number(value);
}
export function addressInput(draft: AddressDraft, creating: boolean) {
  if (!draft.location || !validCoordinates(draft.location))
    throw new ApiError(422, { message: "حدد موقع العنوان على الخريطة أولًا." });
  const limits = {
    label: 50,
    street: 300,
    building: 100,
    floor: 30,
    apartment: 30,
    details: 300,
    region: 100,
    city: 100,
    notes: 500,
  } as const;
  for (const [key, max] of Object.entries(limits)) {
    const value = draft[key as keyof typeof limits];
    if (value !== undefined && (typeof value !== "string" || value.trim().length > max))
      throw new ApiError(422, { message: "يرجى مراجعة تفاصيل العنوان." });
  }
  if (
    !draft.label.trim() ||
    (creating && (!draft.street.trim() || !draft.building.trim()))
  )
    throw new ApiError(422, { message: "يرجى استكمال تفاصيل العنوان المطلوبة." });
  const common = {
    title: draft.label.trim(),
    street: draft.street.trim(),
    building_number: draft.building.trim(),
    floor: draft.floor?.trim() ?? "",
    apartment: draft.apartment?.trim() ?? "",
    details: draft.details?.trim() ?? "",
    lat: draft.location.lat,
    lng: draft.location.lng,
    notes: draft.notes?.trim() || null,
  };
  if (
    !isPositiveId(draft.governorateId) ||
    !isPositiveId(draft.areaId) ||
    !isPositiveId(draft.districtId)
  )
    throw new ApiError(422, {
      message: "اختر المحافظة والمنطقة والحي من القوائم المتاحة.",
    });
  return {
    ...common,
    governorate_id: draft.governorateId,
    area_id: draft.areaId,
    district_id: draft.districtId,
  };
}
export async function fetchAddresses(signal?: AbortSignal) {
  return parseAddresses(await authenticatedApiRequest("/addresses", { signal }));
}
export async function createAddress(draft: AddressDraft, signal?: AbortSignal) {
  return savedAddress(
    await authenticatedApiRequest("/addresses", {
      method: "POST",
      body: addressInput(draft, true),
      signal,
    }),
  );
}
export async function updateAddress(
  id: string,
  draft: AddressDraft,
  signal?: AbortSignal,
) {
  const parsed = savedAddress(
    await authenticatedApiRequest(`/addresses/${addressId(id)}`, {
      method: "PUT",
      body: addressInput(draft, false),
      signal,
    }),
  );
  if (parsed.id !== id) throw new ApiResponseError("Unexpected updated address ID");
  return parsed;
}
export async function deleteAddress(id: string, signal?: AbortSignal) {
  success(
    await authenticatedApiRequest(`/addresses/${addressId(id)}`, {
      method: "DELETE",
      signal,
    }),
  );
}
