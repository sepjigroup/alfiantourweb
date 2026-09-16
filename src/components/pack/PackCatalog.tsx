'use client';

import { useEffect, useMemo, useState } from 'react';
import { useLocale } from 'next-intl';
import { useRouter } from '@/i18n/routing-patch';
import { PackCard } from '@/components/PackCard';
import { PackCardSkeleton } from '@/components/Skeleton';
import { API_BASE_URL } from '@/lib/api-client';
import { fetchPrograms, type ProgramItem } from '@/lib/programs';
import { fetchPackageTypes, getPackageTypeSlug, normalizeServiceSlug, type PackageTypeItem } from '@/lib/package-types';
import { usePublicCurrency } from '@/lib/public-currency';
import { useLeadsTrack } from '@/hooks/useLeadsTrack';
import Script from 'next/script';

type PackView = {
  id: number;
  title: string;
  date: string;
  duration: string;
  priceIdr: number;
  price: string;
  seats: number;
  totalSeats: number;
  image: string;
  images: string[];
  badge: 'flash' | 'promo' | 'hot';
  slug?: string;
  sourceText: string;
  makkahHotel?: string;
  madinahHotel?: string;
  airline?: string;
  airport?: string;
};

type Props = {
  initialServiceSlug?: string;
};

export function PackCatalog({ initialServiceSlug }: Props) {
  const locale = useLocale();
  const router = useRouter();
  const { formatPrice } = usePublicCurrency(locale);
  const { trackEvent } = useLeadsTrack();

  const [loading, setLoading] = useState(true);
  const [fetched, setFetched] = useState(false);
  const [visibleCount, setVisibleCount] = useState(4);
  const [loadingMore, setLoadingMore] = useState(false);
  const [apiPrograms, setApiPrograms] = useState<ProgramItem[]>([]);
  const [programImagesMap, setProgramImagesMap] = useState<Record<number, string[]>>({});
  const [serviceTypes, setServiceTypes] = useState<PackageTypeItem[]>([]);
  const [selectedService, setSelectedService] = useState<string>(initialServiceSlug ? normalizeServiceSlug(initialServiceSlug) : 'semua');

  useEffect(() => {
    setSelectedService(initialServiceSlug ? normalizeServiceSlug(initialServiceSlug) : 'semua');
    setVisibleCount(4);
  }, [initialServiceSlug]);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setFetched(false);
    Promise.allSettled([fetchPrograms(), fetchPackageTypes()]).then((results) => {
      if (!mounted) return;
      const programRows = results[0].status === 'fulfilled' ? results[0].value : [];
      const serviceRows = results[1].status === 'fulfilled' ? results[1].value : [];
      if (programRows.length > 0) setApiPrograms(programRows);
      setServiceTypes(serviceRows);
      setLoading(false);
      setFetched(true);
    });
    return () => {
      mounted = false;
    };
  }, []);



  useEffect(() => {
    let mounted = true;
    const programIds = Array.from(new Set((apiPrograms || []).map((x) => Number(x.id || 0)).filter((x) => x > 0)));
    if (programIds.length === 0) {
      setProgramImagesMap({});
      return () => {
        mounted = false;
      };
    }

    const toAbs = (raw: string): string => {
      const v = String(raw || '').trim();
      if (!v) return '';
      if (v.startsWith('http://') || v.startsWith('https://')) return v;
      return `${API_BASE_URL}${v.startsWith('/') ? '' : '/'}${v}`;
    };

    (async () => {
      const results = await Promise.allSettled(
        programIds.map(async (id) => {
          const res = await fetch(`${API_BASE_URL}/api/v1/master/programs/${id}/images`, { cache: 'no-store' });
          if (!res.ok) return [id, []] as const;
          const json = await res.json();
          const rows = Array.isArray((json as any)?.items)
            ? (json as any).items
            : Array.isArray((json as any)?.data?.items)
              ? (json as any).data.items
              : Array.isArray(json)
                ? json
                : [];
          const urls = rows
            .map((x: any) => toAbs(String(x?.url ?? x?.Url ?? x?.fileUrl ?? x?.FileUrl ?? x?.imageUrl ?? x?.ImageUrl ?? '')))
            .filter(Boolean);
          return [id, Array.from(new Set(urls))] as const;
        })
      );
      if (!mounted) return;
      const next: Record<number, string[]> = {};
      for (const r of results) {
        if (r.status !== 'fulfilled') continue;
        const value = r.value as readonly [number, string[]];
        next[value[0]] = value[1];
      }
      setProgramImagesMap(next);
    })();

    return () => {
      mounted = false;
    };
  }, [apiPrograms]);

  const packRows: PackView[] = useMemo(() => {
    const resolveCoverImage = (program: ProgramItem): string => {
      if (program.coverImageUrl?.trim()) {
        const url = program.coverImageUrl.trim();
        if (url.startsWith('http://') || url.startsWith('https://')) return url;
        return `${API_BASE_URL}${url.startsWith('/') ? '' : '/'}${url}`;
      }
      try {
        const raw = program.metadata;
        if (!raw) return `https://picsum.photos/seed/program-${program.id}/800/500`;
        const obj = JSON.parse(raw) as {
          images?: Array<{ url?: string; isCover?: boolean; Url?: string; IsCover?: boolean }>;
        };
        const rows = Array.isArray(obj.images) ? obj.images : [];
        const cover = rows.find((x) => x?.isCover || x?.IsCover) ?? rows[0];
        const coverUrl = String(cover?.url ?? cover?.Url ?? '').trim();
        if (!coverUrl) return `https://picsum.photos/seed/program-${program.id}/800/500`;
        if (coverUrl.startsWith('http://') || coverUrl.startsWith('https://')) return coverUrl;
        return `${API_BASE_URL}${coverUrl.startsWith('/') ? '' : '/'}${coverUrl}`;
      } catch {
        return `https://picsum.photos/seed/program-${program.id}/800/500`;
      }
    };
    const resolveAllImages = (program: ProgramItem): string[] => {
      const out: string[] = [];
      if (program.coverImageUrl?.trim()) {
        const url = program.coverImageUrl.trim();
        out.push(url.startsWith('http://') || url.startsWith('https://') ? url : `${API_BASE_URL}${url.startsWith('/') ? '' : '/'}${url}`);
      }
      const endpointRows = programImagesMap[Number(program.id || 0)] || [];
      endpointRows.forEach((u) => {
        const v = String(u || '').trim();
        if (v) out.push(v);
      });
      try {
        const raw = program.metadata;
        if (!raw) return Array.from(new Set(out));
        const obj = JSON.parse(raw) as {
          images?: Array<{ url?: string; isCover?: boolean; Url?: string; IsCover?: boolean }>;
        };
        const rows = Array.isArray(obj.images) ? obj.images : [];
        for (const row of rows) {
          const val = String(row?.url ?? row?.Url ?? '').trim();
          if (!val) continue;
          out.push(val.startsWith('http://') || val.startsWith('https://') ? val : `${API_BASE_URL}${val.startsWith('/') ? '' : '/'}${val}`);
        }
      } catch {
        // ignore metadata parse error
      }
      return Array.from(new Set(out));
    };

    if (apiPrograms.length > 0) {
      return apiPrograms.map((p, i) => {
        const programMeta = (() => {
          try { return p.metadata ? JSON.parse(p.metadata) as { defaultSeatCapacity?: number; defaultSeatAvailable?: number } : {}; }
          catch { return {}; }
        })();
        const getLowestPackageTypePrice = (): number => {
          try {
            const cfg = typeof p.displayConfigJson === 'string' ? JSON.parse(p.displayConfigJson) as { packageTypePricings?: Array<{ priceIdr?: number }>; priceIdr?: number } : {};
            const rows = Array.isArray(cfg.packageTypePricings) ? cfg.packageTypePricings : [];
            const prices = rows.map((x) => Number(x?.priceIdr || 0)).filter((v) => v > 0);
            if (prices.length > 0) return Math.min(...prices);
            return Number(cfg.priceIdr || 0);
          } catch {
            return 0;
          }
        };
        const formatShortDate = (raw?: string): string => {
          if (!raw) return '-';
          const d = new Date(raw);
          if (Number.isNaN(d.getTime())) return '-';
          const day = String(d.getDate()).padStart(2, '0');
          const month = d.toLocaleDateString(locale, { month: 'short' });
          const year = d.getFullYear();
          return `${day} ${month} ${year}`;
        };
        const firstPackage = p.packages?.[0];
        const departures = (firstPackage?.departures ?? [])
          .slice()
          .sort((a, b) => new Date(a.departureDate).getTime() - new Date(b.departureDate).getTime());
        const now = Date.now();
        const firstUpcomingDeparture =
          departures.find((d) => new Date(d.departureDate).getTime() >= now && Number(d.seatAvailable || 0) > 0)
          ?? departures.find((d) => new Date(d.departureDate).getTime() >= now)
          ?? departures[0];
        const explicitAirlineName = Number(firstUpcomingDeparture?.airlineId || 0) > 0
          ? String(firstUpcomingDeparture?.airlineName || '').trim()
          : '';
        const priceIdr = Math.max(0, getLowestPackageTypePrice());
        const dateText = formatShortDate(firstUpcomingDeparture?.departureDate || p.departurePeriodStart);
        const metaSeatCapacity = Math.max(0, Number(programMeta.defaultSeatCapacity ?? 0));
        const metaSeatAvailableRaw = Number(programMeta.defaultSeatAvailable ?? metaSeatCapacity);
        const metaSeatAvailable = Math.max(0, Math.min(metaSeatAvailableRaw, Math.max(0, metaSeatCapacity)));
        const seatAvailable = Number(firstUpcomingDeparture?.seatAvailable ?? metaSeatAvailable);
        const seatCapacity = Number(firstUpcomingDeparture?.seatCapacity ?? metaSeatCapacity);
        return {
          id: p.id,
          title: p.title || p.name,
          date: dateText,
          duration: `${p.durationDays} Hari`,
          priceIdr,
          price: formatPrice(priceIdr),
          seats: seatAvailable,
          totalSeats: seatCapacity,
          image: resolveCoverImage(p),
          images: resolveAllImages(p),
          badge: (i % 3 === 0 ? 'promo' : i % 5 === 0 ? 'flash' : 'hot') as 'flash' | 'promo' | 'hot',
          slug: p.slug,
          sourceText: `${p.title || ''} ${p.name || ''} ${p.slug || ''}`.toLowerCase(),
          airline: explicitAirlineName || undefined,
        };
      });
    }

    return [];
  }, [apiPrograms, locale, formatPrice, programImagesMap]);

  const tabs = useMemo(() => {
    const dynamic = serviceTypes
      .filter((x) => x.isActive !== false)
      .map((x) => ({ label: x.name, slug: getPackageTypeSlug(x) }))
      .filter((x) => x.slug);
    return [{ label: 'Semua', slug: 'semua' }, ...dynamic];
  }, [serviceTypes]);

  const selectedLabel = useMemo(() => {
    const found = tabs.find((x) => x.slug === selectedService);
    return found?.label || selectedService;
  }, [selectedService, tabs]);

  const filteredPacks = useMemo(() => {
    if (selectedService === 'semua') return packRows;
    const key = normalizeServiceSlug(selectedLabel).toLowerCase();
    return packRows.filter((x) => {
      const text = x.sourceText;
      return text.includes(key) || text.includes(selectedService);
    });
  }, [packRows, selectedService, selectedLabel]);

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://alfiantour.com';
  const listPath = `/${locale}/pack`;
  const seoSchema = useMemo(
    () => ({
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'Organization',
          '@id': `${baseUrl}/#organization`,
          name: 'Alfian Tour',
          url: baseUrl,
          description: 'Penyedia paket umrah dan haji dengan fokus layanan ramah lansia.',
        },
        {
          '@type': 'BreadcrumbList',
          '@id': `${baseUrl}${listPath}#breadcrumb`,
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Home', item: `${baseUrl}/${locale}` },
            { '@type': 'ListItem', position: 2, name: 'Paket Alfian Tour', item: `${baseUrl}${listPath}` },
          ],
        },
        {
          '@type': 'CollectionPage',
          '@id': `${baseUrl}${listPath}#collection`,
          url: `${baseUrl}${listPath}`,
          name: 'Paket Alfian Tour',
          isPartOf: { '@id': `${baseUrl}/#organization` },
          inLanguage: locale,
          description:
            'Daftar paket umrah dan haji Alfian Tour dengan pilihan jadwal keberangkatan, kelas paket, dan harga terbaik.',
          mainEntity: {
            '@type': 'ItemList',
            itemListElement: filteredPacks.slice(0, 12).map((p, i) => ({
              '@type': 'ListItem',
              position: i + 1,
              url: `${baseUrl}/${locale}/pack/${p.slug || p.id}`,
              name: p.title,
            })),
          },
        },
      ],
    }),
    [baseUrl, filteredPacks, listPath, locale]
  );

  const onSelectTab = (slug: string) => {
    const normalized = normalizeServiceSlug(slug);
    setSelectedService(normalized);
    setVisibleCount(4);
    if (normalized === 'semua') router.push('/pack');
    else router.push(`/pack/${normalized}`);
  };

  const handleLoadMore = () => {
    setVisibleCount((prev) => prev + 4);
  };

  const showLoadMoreButton = !loading && filteredPacks.length > visibleCount;

  return (
    <div className="p-4 space-y-4 animate-fade-up">
      <Script
        id="pack-list-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(seoSchema) }}
      />
      <h2 className="mb-2 text-base font-extrabold">Paket Alfian Tour</h2>

      <div className="flex gap-2 overflow-x-auto pb-2">
        {tabs.map((tab) => {
          const active = selectedService === tab.slug;
          return (
            <button
              key={tab.slug}
              onClick={() => onSelectTab(tab.slug)}
              className={`whitespace-nowrap rounded-full px-4 py-1.5 text-[11px] font-semibold border transition-colors ${
                active ? 'bg-purple-600 border-purple-600 text-white' : 'border-zinc-300 text-zinc-700 bg-white'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {loading && apiPrograms.length === 0 ? (
        <div className="py-10 flex flex-col items-center justify-center gap-3">
          <div className="h-8 w-8 rounded-full border-2 border-zinc-200 border-t-primary-600 animate-spin" />
          <div className="text-xs text-zinc-500">Memuat paket...</div>
        </div>
      ) : (
      <div className="columns-2 gap-3 [column-fill:_balance]">
        {filteredPacks.slice(0, visibleCount).map((pack) => (
              <div key={pack.id} className="mb-3 break-inside-avoid">
              <PackCard
                {...pack}
                images={pack.images}
                airline={pack.airline}
                showPriceStartLabel
                onDetail={() => {
                  trackEvent('ad_click', undefined, {
                    source: 'pack_list',
                    packId: pack.id,
                    packSlug: String(pack.slug || ''),
                    packTitle: pack.title,
                  });
                  router.push(`/pack/${pack.slug || pack.id}`);
                }}
              />
              </div>
            ))}
      </div>
      )}

      {!loading && fetched && filteredPacks.length === 0 ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-center text-xs text-amber-700">
          Data paket belum tersedia dari endpoint.
        </div>
      ) : null}

      {showLoadMoreButton && (
        <div className="text-center">
          <button
            onClick={handleLoadMore}
            className="inline-flex items-center justify-center gap-2 rounded-full border border-purple-600 bg-purple-50 px-6 py-2 text-sm font-medium text-purple-700 hover:bg-purple-100 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
          >
            Load More
          </button>
        </div>
      )}
    </div>
  );
}
