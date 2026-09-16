import type { Metadata } from "next";
import { getLocalizedAlternates } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}): Promise<Metadata> {
  const { locale, id } = await params;
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5054";
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const cleaned = decodeURIComponent(id || "").split("@")[0].trim();
  let canonicalKey = cleaned;
  let alternates = getLocalizedAlternates(locale, `/pack/${canonicalKey}`);

  const titleByLocale: Record<string, string> = {
    id: "Detail Paket",
    en: "Package Detail",
    ar: "تفاصيل الباقة",
  };

  let programTitle = "";
  let description = "";
  let image = "";
  let minPrice = 0;

  const toAbsoluteImage = (raw: string): string => {
    const val = String(raw || "").trim();
    if (!val) return "";
    if (val.startsWith("http://") || val.startsWith("https://")) return val;
    return `${apiUrl}${val.startsWith("/") ? "" : "/"}${val}`;
  };

  const extractMinPrice = (payload: any): number => {
    try {
      const cfg = payload?.displayConfigJson ? JSON.parse(payload.displayConfigJson) : {};
      const rows = Array.isArray(cfg?.packageTypePricings) ? cfg.packageTypePricings : [];
      const prices = rows.map((x: any) => Number(x?.priceIdr || 0)).filter((x: number) => x > 0);
      if (prices.length > 0) return Math.min(...prices);
      const cfgPrice = Number(cfg?.priceIdr || 0);
      if (cfgPrice > 0) return cfgPrice;
    } catch {}
    const pkgRows = Array.isArray(payload?.packages) ? payload.packages : [];
    const packagePrices = pkgRows.map((x: any) => Number(x?.priceQuad || 0)).filter((x: number) => x > 0);
    if (packagePrices.length > 0) return Math.min(...packagePrices);
    return 0;
  };

  const extractMainImage = (payload: any): string => {
    const cover = String(payload?.coverImageUrl || "").trim();
    if (cover) return toAbsoluteImage(cover);
    try {
      const md = payload?.metadata ? JSON.parse(payload.metadata) : {};
      const rows = Array.isArray(md?.images) ? md.images : [];
      const main = rows.find((x: any) => x?.IsCover || x?.isCover) ?? rows[0];
      const raw = String(main?.Url ?? main?.url ?? "").trim();
      if (raw) return toAbsoluteImage(raw);
    } catch {}
    return `${siteUrl}/newlogo2.png`;
  };

  try {
    if (cleaned) {
      const byId = /^\d+$/.test(cleaned)
        ? await fetch(`${apiUrl}/api/v1/master/programs/${cleaned}`, { cache: "no-store" })
        : null;
      let payload: any = null;
      if (byId?.ok) {
        payload = await byId.json();
      } else {
        const listRes = await fetch(`${apiUrl}/api/v1/master/programs?page=1&pageSize=100&publicMode=true`, { cache: "no-store" });
        if (listRes.ok) {
          const listJson = await listRes.json();
          const items = Array.isArray(listJson?.items) ? listJson.items : [];
          payload = items.find((x: any) => String(x?.id) === cleaned || String(x?.slug || "").toLowerCase() === cleaned.toLowerCase()) ?? null;
        }
      }
      if (payload) {
        const slug = String(payload.slug || "").trim();
        if (slug) {
          canonicalKey = slug;
          alternates = getLocalizedAlternates(locale, `/pack/${canonicalKey}`);
        }
        programTitle = String(payload.title || payload.name || "").trim();
        const duration = Number(payload.durationDays || 0);
        const dp = Number(payload.downPayment || 0);
        minPrice = extractMinPrice(payload);
        let seoTitle = "";
        let seoDescription = "";
        try {
          const cfg = payload.displayConfigJson ? JSON.parse(payload.displayConfigJson) : {};
          seoTitle = String(cfg?.seoTitle || "").trim();
          seoDescription = String(cfg?.seoDescription || "").trim();
        } catch {}
        description = seoDescription || (locale === "en"
          ? `Package ${programTitle} ${duration > 0 ? `for ${duration} days` : ""}. Start from DP IDR ${dp.toLocaleString("id-ID")}.`
          : locale === "ar"
            ? `باقة ${programTitle} ${duration > 0 ? `لمدة ${duration} يوم` : ""}. تبدأ من دفعة أولى ${dp.toLocaleString("id-ID")} روبية.`
            : `Paket ${programTitle} ${duration > 0 ? `${duration} hari` : ""}. Mulai DP Rp ${dp.toLocaleString("id-ID")}.`);
        if (seoTitle) programTitle = seoTitle;
        image = extractMainImage(payload);
      }
    }
  } catch {
    // fallback metadata tetap jalan
  }

  const priceText = minPrice > 0
    ? (locale === "en"
      ? `Start from IDR ${minPrice.toLocaleString("id-ID")}`
      : locale === "ar"
        ? `يبدأ من ${minPrice.toLocaleString("id-ID")} روبية`
        : `Mulai Rp ${minPrice.toLocaleString("id-ID")}`)
    : "";
  const baseTitle = programTitle ? `${programTitle}` : (titleByLocale[locale] ?? titleByLocale.id);
  const pageTitle = priceText ? `${baseTitle} | ${priceText}` : baseTitle;

  return {
    title: pageTitle,
    description: description || (locale === "en" ? "Browse package details from Alfian Tour." : locale === "ar" ? "تصفح تفاصيل الباقات من الفيان تور." : "Lihat detail paket terbaik dari Alfian Tour."),
    alternates,
    metadataBase: new URL(siteUrl),
    openGraph: {
      title: pageTitle,
      description: description || undefined,
      url: alternates.canonical,
      type: "website",
      images: image ? [{ url: image }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: pageTitle,
      description: description || undefined,
      images: image ? [image] : undefined,
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
