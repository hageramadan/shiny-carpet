import { validCoordinates, type Coordinates } from "./addresses";

export type Place = Coordinates & {
  label: string;
  city: string;
  region: string;
  street: string;
  building: string;
  country: string;
  postalCode: string;
};

export function photonPlaces(data: unknown): Place[] {
  if (
    !data ||
    typeof data !== "object" ||
    !("features" in data) ||
    !Array.isArray(data.features)
  )
    return [];
  return data.features.flatMap((feature): Place[] => {
    const coordinates = feature?.geometry?.coordinates;
    if (
      !Array.isArray(coordinates) ||
      coordinates.length < 2 ||
      typeof coordinates[0] !== "number" ||
      typeof coordinates[1] !== "number"
    )
      return [];
    const point = { lng: Number(coordinates[0]), lat: Number(coordinates[1]) };
    if (!validCoordinates(point)) return [];
    const properties = feature.properties ?? {};
    const text = (key: string) =>
      typeof properties[key] === "string" ? properties[key] : "";
    const city =
      text("city") ||
      text("town") ||
      text("village") ||
      text("district") ||
      text("county");
    const label = [
      ...new Set(
        [text("name"), text("street"), city, text("state"), text("country")].filter(
          Boolean,
        ),
      ),
    ].join("، ");
    return [
      {
        ...point,
        label: label || `${point.lat.toFixed(5)}, ${point.lng.toFixed(5)}`,
        city,
        region: text("state"),
        street: text("street") || text("name"),
        building: text("housenumber"),
        country: text("country"),
        postalCode: text("postcode"),
      },
    ];
  });
}
