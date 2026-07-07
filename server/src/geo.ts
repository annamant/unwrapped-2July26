/**
 * Geo helpers: geocoding (OpenStreetMap Nominatim) + haversine distance.
 *
 * Nominatim usage policy requires an identifying User-Agent and ≤1 req/sec —
 * fine for drop creation volume. For high volume, switch to a paid geocoder.
 */

export function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export async function geocodeAddress(parts: {
  address?: string | null;
  postcode?: string | null;
  city?: string | null;
}): Promise<{ latitude: number; longitude: number } | null> {
  const q = [parts.address, parts.postcode, parts.city ?? "London", "UK"]
    .filter(Boolean)
    .join(", ");
  if (!q) return null;

  try {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=1&countrycodes=gb`;
    const resp = await fetch(url, {
      headers: {
        "User-Agent": "Unwrapped/1.0 (hello@shopunwrapped.com)",
        "Accept-Language": "en",
      },
    });
    if (!resp.ok) return null;
    const data = (await resp.json()) as Array<{ lat: string; lon: string }>;
    if (!data[0]) return null;
    const latitude = parseFloat(data[0].lat);
    const longitude = parseFloat(data[0].lon);
    if (Number.isNaN(latitude) || Number.isNaN(longitude)) return null;
    return { latitude, longitude };
  } catch (err) {
    console.error("[geo] geocoding failed:", err);
    return null;
  }
}
