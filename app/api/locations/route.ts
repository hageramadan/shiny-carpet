import { photonPlaces, type Place } from "@/lib/geocoding";
import { validCoordinates } from "@/lib/addresses";

const cache = new Map<string, { expires: number; places: Place[] }>();
let nextRequestAt = 0;

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const query = params.get("q")?.trim();
  const reverse = params.has("lat") && params.has("lng");
  const point = { lat: Number(params.get("lat")), lng: Number(params.get("lng")) };
  if (
    reverse
      ? !params.get("lat")?.trim() ||
        !params.get("lng")?.trim() ||
        !validCoordinates(point)
      : !query || query.length < 2 || query.length > 200
  ) {
    return Response.json(
      { error: "أدخل اسم مكان صحيح أو إحداثيات صالحة." },
      { status: 400 },
    );
  }
  const upstream = new URL(
    reverse ? "reverse" : "api",
    `${(process.env.GEOCODING_BASE_URL || "https://photon.komoot.io").replace(/\/+$/, "")}/`,
  );
  upstream.searchParams.set("limit", reverse ? "1" : "5");
  if (reverse) {
    upstream.searchParams.set("lat", point.lat.toFixed(6));
    upstream.searchParams.set("lon", point.lng.toFixed(6));
  } else {
    upstream.searchParams.set("q", query!);
  }
  const key = upstream.toString();
  const now = Date.now();
  const cached = cache.get(key);
  if (cached && cached.expires > now) return Response.json({ places: cached.places });
  if (now < nextRequestAt)
    return Response.json(
      { error: "انتظر لحظة ثم أعد المحاولة." },
      { status: 429, headers: { "Retry-After": "1" } },
    );
  nextRequestAt = now + 1100;
  try {
    const response = await fetch(upstream, {
      headers: {
        "User-Agent": "ShinyCarpetDemo/1.0 (address picker)",
        Accept: "application/json",
      },
      signal: AbortSignal.timeout(10_000),
      cache: "no-store",
    });
    if (!response.ok) throw new Error("Geocoder unavailable");
    const places = photonPlaces(await response.json());
    if (cache.size >= 100) cache.delete(cache.keys().next().value!);
    cache.set(key, { places, expires: now + 86_400_000 });
    return Response.json({ places });
  } catch {
    return Response.json(
      {
        error:
          "تعذر البحث عن الموقع الآن. يمكنك تحديد النقطة على الخريطة وإدخال التفاصيل يدويًا.",
      },
      { status: 503 },
    );
  }
}
