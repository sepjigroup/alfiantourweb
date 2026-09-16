'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import { Link } from '@/i18n/routing-patch';
import { API_BASE_URL } from '@/lib/api-client';
import { getAuthState } from '@/lib/auth';

type ProductItem = {
  fileId: string;
  name?: string | null;
  price?: number | null;
  stock?: number | null;
  category?: string | null;
  productType?: string | null;
  marketplace?: string | null;
  mainImageUrl?: string | null;
  description?: string | null;
};

type ProductsResponse = {
  items?: ProductItem[];
  page?: number;
  pageSize?: number;
  total?: number;
  totalPages?: number;
};

type ApiEnvelope<T> = {
  data?: T;
};

const CATEGORY_ICONS: Record<string, string> = {
  'Oleh-Oleh': '🎁',
  'Perlengkapan Ibadah': '🕌',
  'Busana Muslim': '👘',
  'Koper & Travel Gear': '🧳',
  'Digital Product': '💻',
  'Lainnya': '📦',
};

function isAffiliate(x: ProductItem) {
  return String(x.productType || '').toUpperCase() === 'AFFILIATE_PRODUCT';
}

function BadgeType({ x }: { x: ProductItem }) {
  return isAffiliate(x) ? (
    <span className="shrink-0 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
      🛍️ {x.marketplace || 'Marketplace'}
    </span>
  ) : (
    <span className="shrink-0 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
      ✅ Produk Resmi
    </span>
  );
}

const ALL_CATEGORIES = ['Semua', 'Oleh-Oleh', 'Perlengkapan Ibadah', 'Busana Muslim', 'Koper & Travel Gear', 'Digital Product', 'Lainnya'];

export default function ProductMarketplaceClient() {
  const [items, setItems] = useState<ProductItem[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [initialLoaded, setInitialLoaded] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('Semua');
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const loadingRef = useRef(false);
  const [refUsername, setRefUsername] = useState('');

  const hasMore = page < totalPages;

  const loadPage = useCallback(async (nextPage: number) => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_BASE_URL}/api/Products?page=${nextPage}&pageSize=24`, { cache: 'no-store' });
      const json = (await res.json()) as ApiEnvelope<ProductsResponse>;
      if (!res.ok) throw new Error('Gagal memuat produk');
      const data = json.data ?? {};
      const rows = data.items ?? [];
      setItems((prev) => {
        const map = new Map(prev.map((x) => [x.fileId, x]));
        rows.forEach((x) => map.set(x.fileId, x));
        return Array.from(map.values());
      });
      setPage(Number(data.page || nextPage));
      setTotalPages(Math.max(1, Number(data.totalPages || 1)));
      setTotal(Number(data.total || 0));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memuat produk');
    } finally {
      setInitialLoaded(true);
      setLoading(false);
      loadingRef.current = false;
    }
  }, []);

  useEffect(() => { void loadPage(1); }, [loadPage]);

  useEffect(() => {
    const getCookie = (name: string): string => {
      if (typeof document === 'undefined') return '';
      const found = document.cookie.split(';').map((x) => x.trim()).find((x) => x.startsWith(`${name}=`));
      return found ? decodeURIComponent(found.slice(name.length + 1)) : '';
    };
    const userName = String(getAuthState()?.user?.userName || '').trim();
    const cookieRef = String(getCookie('ref_agent') || '').trim();
    setRefUsername((userName || cookieRef).replace(/^@/, ''));
  }, []);

  useEffect(() => {
    const target = sentinelRef.current;
    if (!target) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && !loadingRef.current && page < totalPages) {
          void loadPage(page + 1);
        }
      },
      { root: null, rootMargin: '420px 0px', threshold: 0.01 }
    );
    observer.observe(target);
    return () => observer.disconnect();
  }, [loadPage, page, totalPages]);

  const buildHref = (x: ProductItem) =>
    `/toko/${x.fileId}${refUsername ? `@${encodeURIComponent(refUsername)}` : ''}`;

  const filtered = useMemo(() => {
    return items.filter((x) => {
      const matchCat = activeCategory === 'Semua' || (x.category ?? '') === activeCategory;
      const q = search.toLowerCase();
      const matchSearch = !q || (x.name ?? '').toLowerCase().includes(q) || (x.category ?? '').toLowerCase().includes(q);
      return matchCat && matchSearch;
    });
  }, [items, activeCategory, search]);

  const summary = useMemo(() => {
    if (!initialLoaded) return 'Memuat produk...';
    if (total <= 0) return 'Belum ada produk aktif.';
    return `${filtered.length} produk ditemukan`;
  }, [initialLoaded, filtered.length, total]);

  return (
    <>
      <style>{`
        @keyframes fade-up { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
        .card-appear { animation: fade-up 0.35s ease both; }
        .card-appear:nth-child(1){animation-delay:0.05s}
        .card-appear:nth-child(2){animation-delay:0.1s}
        .card-appear:nth-child(3){animation-delay:0.15s}
        .card-appear:nth-child(4){animation-delay:0.2s}
        .card-appear:nth-child(5){animation-delay:0.25s}
        .card-appear:nth-child(6){animation-delay:0.3s}
        .product-card { transition: transform 0.22s ease, box-shadow 0.22s ease; }
        .product-card:hover { transform: translateY(-4px); box-shadow: 0 12px 32px rgba(0,0,0,0.10); }
        .cat-pill { transition: all 0.18s ease; }
        .img-wrapper img { transition: transform 0.4s ease; }
        .product-card:hover .img-wrapper img { transform: scale(1.06); }
        .search-glow:focus { box-shadow: 0 0 0 3px rgba(99,102,241,0.2); }
      `}</style>

      <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-indigo-50/30">

        {/* ── Hero Banner ───────────────────────────────────────────── */}
        <div className="relative overflow-hidden bg-gradient-to-br from-indigo-700 via-violet-700 to-purple-800 px-6 py-10 text-white">
          {/* decorative blobs */}
          <div className="pointer-events-none absolute -top-20 -right-20 h-72 w-72 rounded-full bg-white/5 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-16 -left-16 h-60 w-60 rounded-full bg-white/5 blur-3xl" />

          <div className="relative max-w-5xl mx-auto">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold mb-3 border border-white/20">
              🛒 Alfian Tour Official Store
            </div>
            <h1 className="text-2xl md:text-4xl font-extrabold leading-tight">
              Toko Produk Pilihan<br className="hidden md:block" />
              <span className="text-yellow-300"> Alfian Tour</span>
            </h1>
            <p className="mt-2 text-sm md:text-base text-white/80 max-w-xl">
              Oleh-oleh haji & umroh, perlengkapan ibadah, busana muslim, koper, dan produk afiliasi terbaik — semua dalam satu tempat.
            </p>
            <div className="mt-5 flex flex-wrap gap-2 text-xs">
              {['✅ Produk Resmi', '🚀 Pengiriman Cepat', '🛡️ Terpercaya', '💬 Chat Langsung'].map(t => (
                <span key={t} className="rounded-full bg-white/15 border border-white/20 px-3 py-1 font-medium">{t}</span>
              ))}
            </div>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-4 py-6 space-y-5">

          {/* ── Search ───────────────────────────────────────────────── */}
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
            <input
              className="search-glow w-full rounded-2xl border border-slate-200 bg-white py-3 pl-11 pr-5 text-sm shadow-sm focus:outline-none focus:border-indigo-400"
              placeholder="Cari produk, kategori, atau keyword…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          {/* ── Category pills ───────────────────────────────────────── */}
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {ALL_CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`cat-pill flex-shrink-0 rounded-full px-4 py-1.5 text-xs font-semibold border transition-all ${
                  activeCategory === cat
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-200'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-300 hover:text-indigo-600'
                }`}
              >
                {cat !== 'Semua' ? (CATEGORY_ICONS[cat] ?? '📦') + ' ' : ''}{cat}
              </button>
            ))}
          </div>

          {/* ── Summary ──────────────────────────────────────────────── */}
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>{summary}</span>
            {total > 0 && <span className="font-semibold text-indigo-600">{total} total produk</span>}
          </div>

          {/* ── Skeleton ─────────────────────────────────────────────── */}
          {!initialLoaded && loading && (
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="h-64 animate-pulse rounded-2xl border bg-slate-100" />
              ))}
            </div>
          )}

          {/* ── Error ────────────────────────────────────────────────── */}
          {error && (
            <div className="rounded-2xl border border-red-100 bg-red-50 p-4 text-xs text-red-600">{error}</div>
          )}

          {/* ── Empty ────────────────────────────────────────────────── */}
          {initialLoaded && filtered.length === 0 && !loading && (
            <div className="py-20 text-center text-slate-400">
              <div className="text-5xl mb-3">🔍</div>
              <div className="font-semibold text-slate-600">Produk tidak ditemukan</div>
              <div className="text-xs mt-1">Coba kata kunci atau kategori lain</div>
            </div>
          )}

          {/* ── Product grid ─────────────────────────────────────────── */}
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
            {filtered.map((x, idx) => (
              <Link
                key={x.fileId}
                href={buildHref(x)}
                className={`product-card card-appear group overflow-hidden rounded-2xl border border-slate-200 bg-white`}
                style={{ animationDelay: `${Math.min(idx, 6) * 0.05}s` }}
              >
                {/* Image */}
                <div className="img-wrapper relative h-44 overflow-hidden bg-slate-100">
                  {x.mainImageUrl ? (
                    <Image
                      src={x.mainImageUrl}
                      alt={x.name || 'Produk'}
                      fill
                      className="object-cover"
                      unoptimized
                      onError={(e) => { (e.target as HTMLImageElement).src = `https://placehold.co/400x300/e2e8f0/94a3b8?text=📦`; }}
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-4xl text-slate-300">
                      {CATEGORY_ICONS[x.category ?? ''] ?? '📦'}
                    </div>
                  )}
                  {/* Overlay badge */}
                  <div className="absolute top-2 left-2">
                    <BadgeType x={x} />
                  </div>
                </div>

                {/* Info */}
                <div className="space-y-1.5 p-3">
                  <div className="text-sm font-bold text-slate-800 line-clamp-2 leading-snug">{x.name}</div>
                  <div className="text-[11px] text-slate-500">
                    {CATEGORY_ICONS[x.category ?? ''] ?? ''} {x.category || 'Produk'}
                  </div>
                  <div className="flex items-center justify-between gap-1 pt-0.5">
                    <div className="text-sm font-extrabold text-indigo-700">
                      Rp {Number(x.price || 0).toLocaleString('id-ID')}
                    </div>
                    {!isAffiliate(x) && (x.stock ?? 0) > 0 && (
                      <span className="text-[10px] text-slate-400">Stok: {x.stock}</span>
                    )}
                  </div>
                  <div className="pt-1">
                    <span className="block w-full text-center rounded-xl bg-indigo-600 group-hover:bg-indigo-700 py-1.5 text-xs font-bold text-white transition-colors">
                      {isAffiliate(x) ? '🛍️ Lihat di Toko' : '🛒 Beli Sekarang'}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* ── Infinite scroll sentinel ──────────────────────────────── */}
          <div ref={sentinelRef} className="min-h-12">
            {loading && initialLoaded ? (
              <div className="flex items-center justify-center gap-2 py-6 text-xs font-semibold text-slate-500">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-200 border-t-indigo-600" />
                Memuat lebih banyak produk…
              </div>
            ) : null}
            {!loading && hasMore && initialLoaded ? (
              <button
                type="button"
                onClick={() => void loadPage(page + 1)}
                className="w-full rounded-2xl border border-indigo-200 bg-indigo-50 py-3 text-xs font-bold text-indigo-700 hover:bg-indigo-100 transition-colors"
              >
                Muat Lebih Banyak Produk →
              </button>
            ) : null}
            {initialLoaded && !hasMore && filtered.length > 0 ? (
              <div className="py-5 text-center text-xs text-slate-400">
                🎉 Semua produk sudah ditampilkan ({total} produk)
              </div>
            ) : null}
          </div>

        </div>
      </div>
    </>
  );
}
