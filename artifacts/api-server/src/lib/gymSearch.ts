import { logger } from "./logger";

const NOMINATIM_BASE = "https://nominatim.openstreetmap.org";
const USER_AGENT = "GymLink/1.0 (https://gymlink.fit; contact@gymlink.fit)";

export interface GymCandidate {
  osmType: string;
  osmId: number;
  name: string;
  address: string;
  city: string;
  lat: string;
  lon: string;
}

interface NominatimAddress {
  road?: string;
  house_number?: string;
  neighbourhood?: string;
  suburb?: string;
  city?: string;
  town?: string;
  village?: string;
  state?: string;
  postcode?: string;
  country?: string;
}

interface NominatimResult {
  osm_type?: string;
  osm_id?: number;
  lat?: string;
  lon?: string;
  display_name?: string;
  category?: string;
  type?: string;
  address?: NominatimAddress;
  namedetails?: { name?: string } | null;
  extratags?: Record<string, string> | null;
}

/**
 * Only treat real fitness venues as valid gyms. This is what keeps users from
 * adding arbitrary made-up places: a result must be tagged as a gym / fitness
 * centre in the OpenStreetMap database to count.
 */
function isFitnessVenue(r: NominatimResult): boolean {
  const cat = r.category;
  const type = r.type;
  const extra = r.extratags ?? {};

  if (cat === "leisure" && (type === "fitness_centre" || type === "sports_centre")) {
    return true;
  }
  if (cat === "amenity" && type === "gym") {
    return true;
  }
  if (type === "fitness_centre") return true;
  if (extra["leisure"] === "fitness_centre") return true;
  if (extra["sport"] === "fitness") return true;
  return false;
}

function formatAddress(r: NominatimResult): { address: string; city: string } {
  const a = r.address ?? {};
  const city = a.city || a.town || a.village || "";
  const parts = [
    [a.house_number, a.road].filter(Boolean).join(" "),
    a.suburb || a.neighbourhood,
    city,
    a.state,
  ].filter((p): p is string => Boolean(p && p.trim()));
  const address = parts.length > 0 ? parts.join(", ") : (r.display_name ?? "");
  return { address, city };
}

function toCandidate(r: NominatimResult): GymCandidate | null {
  if (!r.osm_type || r.osm_id == null || !r.lat || !r.lon) return null;
  const name = r.namedetails?.name || r.display_name?.split(",")[0]?.trim() || "";
  if (!name) return null;
  const { address, city } = formatAddress(r);
  return {
    osmType: r.osm_type,
    osmId: r.osm_id,
    name,
    address,
    city,
    lat: r.lat,
    lon: r.lon,
  };
}

const REQUEST_TIMEOUT_MS = 8000;

async function nominatimFetch(path: string): Promise<NominatimResult[]> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  let res: Response;
  try {
    res = await fetch(`${NOMINATIM_BASE}${path}`, {
      headers: { "User-Agent": USER_AGENT, Accept: "application/json" },
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timer);
  }
  if (!res.ok) {
    throw new Error(`Nominatim returned ${res.status}`);
  }
  const data = (await res.json()) as NominatimResult[];
  return Array.isArray(data) ? data : [];
}

/** Search OpenStreetMap for real gyms matching the query text. */
export async function searchGyms(query: string): Promise<GymCandidate[]> {
  const q = query.trim();
  if (q.length < 2) return [];

  const params = new URLSearchParams({
    q,
    format: "jsonv2",
    addressdetails: "1",
    namedetails: "1",
    extratags: "1",
    limit: "25",
  });

  let results: NominatimResult[];
  try {
    results = await nominatimFetch(`/search?${params.toString()}`);
  } catch (err) {
    logger.error({ err, q }, "Gym search failed");
    throw err;
  }

  const seen = new Set<string>();
  const candidates: GymCandidate[] = [];
  for (const r of results) {
    if (!isFitnessVenue(r)) continue;
    const c = toCandidate(r);
    if (!c) continue;
    const key = `${c.osmType}:${c.osmId}`;
    if (seen.has(key)) continue;
    seen.add(key);
    candidates.push(c);
  }
  return candidates;
}

/**
 * Re-verify a chosen gym directly against OpenStreetMap before persisting it.
 * Prevents a client from POSTing arbitrary unverified text as a "gym".
 */
export async function validateGym(
  osmType: string,
  osmId: number,
): Promise<GymCandidate | null> {
  const prefix = { node: "N", way: "W", relation: "R" }[osmType.toLowerCase()];
  if (!prefix) return null;

  const params = new URLSearchParams({
    osm_ids: `${prefix}${osmId}`,
    format: "jsonv2",
    addressdetails: "1",
    namedetails: "1",
    extratags: "1",
  });

  let results: NominatimResult[];
  try {
    results = await nominatimFetch(`/lookup?${params.toString()}`);
  } catch (err) {
    logger.error({ err, osmType, osmId }, "Gym validation lookup failed");
    throw err;
  }

  const match = results[0];
  if (!match || !isFitnessVenue(match)) return null;
  return toCandidate(match);
}

/** Deterministic gym id derived from its OSM identity (used for dedupe). */
export function gymIdFor(osmType: string, osmId: number): string {
  return `osm-${osmType.toLowerCase()}-${osmId}`;
}
