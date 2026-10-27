import { ApiError, ApiResponseError, getJson } from "./client";
import { isPositiveId, isRecord } from "./validation";

export type District = { id: number; name: string };
export type Governorate = District & { districts: District[] };
export type Area = District & { governorates: Governorate[] };
export type AreaSelection = {
  areaId?: number;
  governorateId?: number;
  districtId?: number;
};

function named(value: unknown): District {
  if (
    !isRecord(value) ||
    !isPositiveId(value.id) ||
    typeof value.name !== "string" ||
    !value.name.trim()
  )
    throw new ApiResponseError("Invalid location option");
  return { id: value.id, name: value.name };
}
function list<T extends District>(value: unknown, parse: (value: unknown) => T): T[] {
  if (!Array.isArray(value)) throw new ApiResponseError("Missing location options");
  const result = value.map(parse);
  if (new Set(result.map((item) => item.id)).size !== result.length)
    throw new ApiResponseError("Duplicate location IDs");
  return result;
}
export function parseAreas(body: unknown): Area[] {
  if (!isRecord(body)) throw new ApiResponseError("Invalid areas response");
  if (body.result !== true) throw new ApiError(400, body);
  return list(body.data, (area) => ({
    ...named(area),
    governorates: list(isRecord(area) ? area.governorates : null, (governorate) => ({
      ...named(governorate),
      districts: list(isRecord(governorate) ? governorate.districts : null, named),
    })),
  }));
}
export async function fetchAreas(signal?: AbortSignal) {
  return parseAreas(await getJson("/areas", signal));
}
export function selectedLocation(areas: Area[], selection: AreaSelection) {
  const area = areas.find((item) => item.id === selection.areaId);
  const governorate = area?.governorates.find(
    (item) => item.id === selection.governorateId,
  );
  const district = governorate?.districts.find(
    (item) => item.id === selection.districtId,
  );
  if (!area || !governorate || !district) return null;
  return {
    areaId: area.id,
    governorateId: governorate.id,
    districtId: district.id,
    region: governorate.name,
    city: district.name,
  };
}
