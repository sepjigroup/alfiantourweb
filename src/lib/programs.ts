import { API_BASE_URL } from '@/lib/api-client';

export type ProgramPackage = {
  id: number;
  packageClassMasterId: number;
  packageClassName: string;
  priceQuad: number;
  priceTripleAdditional: number;
  priceDoubleAdditional: number;
  makkahHotelId: number;
  makkahHotelName: string;
  makkahNights: number;
  madinahHotelId: number;
  madinahHotelName: string;
  madinahNights: number;
  departures?: ProgramPackageDeparture[];
};

export type ProgramPackageDeparture = {
  id: number;
  departureDate: string;
  returnDate?: string | null;
  seatCapacity: number;
  seatAvailable: number;
  packageTypeId?: number | null;
  packageTypeName?: string | null;
  airlineId?: number | null;
  airlineName?: string | null;
  departureAirportId?: number | null;
  departureAirportName?: string | null;
  makkahHotelId?: number | null;
  makkahHotelName?: string | null;
  madinahHotelId?: number | null;
  madinahHotelName?: string | null;
  priceQuad?: number | null;
  priceTripleAdditional?: number | null;
  priceDoubleAdditional?: number | null;
  customAdditionalPrice?: number | null;
};

export type ProgramItem = {
  id: number;
  name: string;
  title: string;
  slug?: string;
  metadata?: string;
  coverImageUrl?: string;
  displayConfigJson?: string;
  durationDays: number;
  departurePeriodStart: string;
  departurePeriodEnd: string;
  downPayment: number;
  isActive: boolean;
  airlineName?: string;
  packages: ProgramPackage[];
  includedItems?: string[];
  excludedItems?: string[];
};

type ProgramListResponse = {
  items?: ProgramItem[];
  data?: { items?: ProgramItem[] };
};

const PROGRAM_CACHE_TTL_MS = 90_000;
const inMemoryProgramCache = new Map<string, { expiresAt: number; value: ProgramItem | null }>();

function extractItems(payload: ProgramListResponse): ProgramItem[] {
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.data?.items)) return payload.data.items;
  return [];
}

function isProgramPublicAvailable(x: ProgramItem): boolean {
  if (!x.isActive) return false;
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const periodEnd = new Date(x.departurePeriodEnd);
  const hasFutureDeparture = (x.packages ?? []).some((p) => (p.departures ?? []).some((d) => new Date(d.departureDate) >= today && d.seatAvailable > 0));
  if (hasFutureDeparture) return true;
  return !Number.isNaN(periodEnd.getTime()) && periodEnd >= today;
}

export async function fetchPrograms(): Promise<ProgramItem[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/v1/master/programs?page=1&pageSize=50&publicMode=true&orderBy=createdAt desc`);
    if (!res.ok) return [];
    const json = (await res.json()) as ProgramListResponse;
    return extractItems(json).filter(isProgramPublicAvailable);
  } catch {
    return [];
  }
}

export async function fetchProgramByCode(code: string): Promise<ProgramItem | null> {
  const rawDecoded = decodeURIComponent(String(code || '')).trim();
  const atIndex = rawDecoded.lastIndexOf('@');
  const normalizedCode = atIndex > 0 ? rawDecoded.slice(0, atIndex).trim() : rawDecoded;
  const key = normalizedCode.toLowerCase();
  if (!key) return null;
  const now = Date.now();
  const cached = inMemoryProgramCache.get(key);
  if (cached && cached.expiresAt > now) return cached.value;

  const setCache = (value: ProgramItem | null) => {
    inMemoryProgramCache.set(key, { value, expiresAt: Date.now() + PROGRAM_CACHE_TTL_MS });
    return value;
  };

  try {
    const resolved = await fetch(`${API_BASE_URL}/api/v1/master/programs/resolve/${encodeURIComponent(key)}`);
    if (resolved.ok) {
      const row = (await resolved.json()) as ProgramItem;
      return setCache(isProgramPublicAvailable(row) ? row : null);
    }
  } catch {
    // ignore resolver failure and continue fallback
  }

  if (/^\d+$/.test(key)) {
    const byId = await fetch(`${API_BASE_URL}/api/v1/master/programs/${key}`);
    if (byId.ok) {
      const row = (await byId.json()) as ProgramItem;
      if (isProgramPublicAvailable(row)) return setCache(row);
    }
  }

  const list = await fetchPrograms();
  const found = list.find((x) => String(x.id) === key || (x.slug ?? '').toLowerCase() === key);
  if (found) return setCache(found);

  // Fallback: targeted lookup by searchTerm with larger window.
  // This prevents false redirect when program is not in first public page.
  try {
    const searchRes = await fetch(
      `${API_BASE_URL}/api/v1/master/programs?page=1&pageSize=300&publicMode=true&searchTerm=${encodeURIComponent(key)}`
    );
    if (searchRes.ok) {
      const json = (await searchRes.json()) as ProgramListResponse;
      const rows = extractItems(json).filter(isProgramPublicAvailable);
      const exact = rows.find((x) => String(x.id) === key || (x.slug ?? '').toLowerCase() === key);
      if (exact) return setCache(exact);
    }
  } catch {
    // ignore fallback failure
  }

  // Last fallback: lookup without publicMode filter, then exact-match by slug/id.
  // This keeps detail URL accessible even when program is filtered out from public listing.
  try {
    const rawRes = await fetch(
      `${API_BASE_URL}/api/v1/master/programs?page=1&pageSize=300&searchTerm=${encodeURIComponent(key)}`
    );
    if (rawRes.ok) {
      const json = (await rawRes.json()) as ProgramListResponse;
      const rows = extractItems(json);
      const exact = rows.find((x) => String(x.id) === key || (x.slug ?? '').toLowerCase() === key);
      if (exact) return setCache(exact);
    }
  } catch {
    // ignore fallback failure
  }
  return setCache(null);
}
