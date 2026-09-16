import type { MetadataRoute } from 'next';

const locales = ['id', 'en', 'ar'];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  const now = new Date();
  const api = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5054';

  // Primary source: API SEO endpoint (single source of truth for search engines).
  try {
    const res = await fetch(`${api}/api/v1/seo/sitemap-urls`, { cache: 'no-store' });
    if (res.ok) {
      const json = await res.json() as { items?: Array<{ url?: string; lastModified?: string; changeFrequency?: MetadataRoute.Sitemap[number]['changeFrequency']; priority?: number }> };
      const rows = Array.isArray(json.items) ? json.items : [];
      const mapped = rows
        .map((x) => ({
          url: String(x.url || '').trim(),
          lastModified: x.lastModified ? new Date(x.lastModified) : now,
          changeFrequency: x.changeFrequency ?? 'weekly',
          priority: Number.isFinite(Number(x.priority)) ? Number(x.priority) : 0.7,
        }))
        .filter((x) => x.url.length > 0);
      if (mapped.length > 0) return mapped;
    }
  } catch {
    // continue to local fallback
  }

  const staticPaths = [
    '',
    '/pack',
    '/layanan',
    '/layanan/umroh-haji',
    '/layanan/tour-domestik-internasional',
    '/layanan/tiket-pesawat-kereta-kapal',
    '/layanan/reservasi-hotel-akomodasi',
    '/layanan/visa-dokumen-perjalanan',
    '/layanan/transportasi-rental-kendaraan',
    '/layanan/gathering-outbound-corporate-trip',
    '/layanan/study-tour-wisata-edukasi',
    '/layanan/wisata-religi-ziarah',
    '/layanan/event-perjalanan-mice',
    '/transport',
    '/feeds',
    '/agen',
    '/akun',
    '/toko',
    '/information',
    '/information/investor-revenue',
    '/about',
    '/contact',
  ];

  const entries: MetadataRoute.Sitemap = [];
  for (const locale of locales) {
    for (const p of staticPaths) {
      entries.push({
        url: `${base}/${locale}${p}`,
        lastModified: now,
        changeFrequency: p === '' ? 'daily' : 'weekly',
        priority: p === '' ? 1 : 0.8,
      });
    }
  }

  try {
    const res = await fetch(`${api}/api/v1/master/programs?page=1&pageSize=300&publicMode=true`, { cache: 'no-store' });
    if (res.ok) {
      const json = await res.json();
      const items = Array.isArray(json?.items) ? json.items : [];
      for (const locale of locales) {
        for (const item of items) {
          const code = item?.slug || item?.id;
          if (!code) continue;
          entries.push({
            url: `${base}/${locale}/pack/${encodeURIComponent(String(code))}`,
            lastModified: item?.modifiedAt ? new Date(item.modifiedAt) : now,
            changeFrequency: 'weekly',
            priority: 0.9,
          });
        }
      }
    }
  } catch {
    // ignore fallback
  }

  try {
    const res = await fetch(`${api}/api/Products?page=1&pageSize=300`, { cache: 'no-store' });
    if (res.ok) {
      const json = await res.json();
      const items = Array.isArray(json?.data?.items) ? json.data.items : [];
      for (const locale of locales) {
        for (const item of items) {
          const code = item?.fileId;
          if (!code) continue;
          entries.push({
            url: `${base}/${locale}/toko/${encodeURIComponent(String(code))}`,
            lastModified: item?.updatedAt || item?.modifiedAt || item?.createdAt ? new Date(item.updatedAt || item.modifiedAt || item.createdAt) : now,
            changeFrequency: 'weekly',
            priority: 0.8,
          });
        }
      }
    }
  } catch {
    // ignore fallback
  }

  return entries;
}
