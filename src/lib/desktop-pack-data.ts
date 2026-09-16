import { useMemo } from "react";
import { fetchPrograms, type ProgramItem } from "@/lib/programs";
import { API_BASE_URL } from "@/lib/api-client";

export type DesktopPackItem = {
  id: number;
  slug: string;
  title: string;
  date: string;
  duration: string;
  priceIdr: number;
  price: string;
  seats: number;
  totalSeats: number;
  image: string;
  airline?: string;
  hotel?: string;
  category: string;
};

function formatShortDate(raw?: string, locale = "id"): string {
  if (!raw) return "-";
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return "-";
  const day = String(d.getDate()).padStart(2, "0");
  const month = d.toLocaleDateString(locale, { month: "short" });
  const year = d.getFullYear();
  return `${day} ${month} ${year}`;
}

function resolveCoverImage(program: ProgramItem): string {
  if (program.coverImageUrl?.trim()) {
    const url = program.coverImageUrl.trim();
    if (url.startsWith("http://") || url.startsWith("https://")) return url;
    return `${API_BASE_URL}${url.startsWith("/") ? "" : "/"}${url}`;
  }
  try {
    const raw = program.metadata;
    if (!raw) return `https://picsum.photos/seed/program-${program.id}/800/500`;
    const obj = JSON.parse(raw) as { images?: Array<{ url?: string; isCover?: boolean; Url?: string; IsCover?: boolean }> };
    const rows = Array.isArray(obj.images) ? obj.images : [];
    const cover = rows.find((x) => x?.isCover || x?.IsCover) ?? rows[0];
    const coverUrl = String(cover?.url ?? cover?.Url ?? "").trim();
    if (!coverUrl) return `https://picsum.photos/seed/program-${program.id}/800/500`;
    if (coverUrl.startsWith("http://") || coverUrl.startsWith("https://")) return coverUrl;
    return `${API_BASE_URL}${coverUrl.startsWith("/") ? "" : "/"}${coverUrl}`;
  } catch {
    return `https://picsum.photos/seed/program-${program.id}/800/500`;
  }
}

function getLowestPackageTypePrice(program: ProgramItem): number {
  try {
    const cfg = typeof program.displayConfigJson === "string"
      ? JSON.parse(program.displayConfigJson) as { packageTypePricings?: Array<{ priceIdr?: number }>; priceIdr?: number }
      : {};
    const rows = Array.isArray(cfg.packageTypePricings) ? cfg.packageTypePricings : [];
    const prices = rows.map((x) => Number(x?.priceIdr || 0)).filter((v) => v > 0);
    if (prices.length > 0) return Math.min(...prices);
    return Number(cfg.priceIdr || 0);
  } catch {
    return 0;
  }
}

export function useDesktopPackData(
  programs: ProgramItem[],
  formatPrice: (priceIdr: number) => string,
  locale = "id",
) {
  return useMemo(() => {
    if (!programs.length) return [];

    return programs.map((p) => {
      const programMeta = (() => {
        try { return p.metadata ? JSON.parse(p.metadata) as { defaultSeatCapacity?: number; defaultSeatAvailable?: number } : {}; }
        catch { return {}; }
      })();

      const firstPackage = p.packages?.[0];
      const departures = (firstPackage?.departures ?? [])
        .slice()
        .sort((a, b) => new Date(a.departureDate).getTime() - new Date(b.departureDate).getTime());
      const now = Date.now();
      const firstUpcoming =
        departures.find((d) => new Date(d.departureDate).getTime() >= now && Number(d.seatAvailable || 0) > 0)
        ?? departures.find((d) => new Date(d.departureDate).getTime() >= now)
        ?? departures[0];

      const explicitAirline = Number(firstUpcoming?.airlineId || 0) > 0
        ? String(firstUpcoming?.airlineName || "").trim()
        : "";

      const priceIdr = Math.max(0, getLowestPackageTypePrice(p));
      const dateText = formatShortDate(firstUpcoming?.departureDate || p.departurePeriodStart, locale);
      const metaSeatCapacity = Math.max(0, Number(programMeta.defaultSeatCapacity ?? 0));
      const metaSeatAvailableRaw = Number(programMeta.defaultSeatAvailable ?? metaSeatCapacity);
      const metaSeatAvailable = Math.max(0, Math.min(metaSeatAvailableRaw, metaSeatCapacity));
      const seatAvailable = Number(firstUpcoming?.seatAvailable ?? metaSeatAvailable);
      const seatCapacity = Number(firstUpcoming?.seatCapacity ?? metaSeatCapacity);

      const pkgTypeRaw = firstPackage as Record<string, unknown> | undefined;
      const hotelName = String(
        pkgTypeRaw?.MakkahHotelName ?? firstPackage?.makkahHotelName ?? pkgTypeRaw?.HotelName ?? firstPackage?.makkahHotelName ?? "",
      );

      return {
        id: p.id,
        slug: p.slug || String(p.id),
        title: p.title || p.name,
        date: dateText,
        duration: `${p.durationDays} Hari`,
        priceIdr,
        price: formatPrice(priceIdr),
        seats: seatAvailable,
        totalSeats: seatCapacity,
        image: resolveCoverImage(p),
        airline: explicitAirline || p.airlineName || undefined,
        hotel: hotelName || undefined,
        category: "reguler",
      };
    });
  }, [programs, formatPrice, locale]);
}
