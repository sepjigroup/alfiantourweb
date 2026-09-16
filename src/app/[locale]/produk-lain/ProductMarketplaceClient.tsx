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

function productKindLabel(x: ProductItem): string {
  return String(x.productType || '').toUpperCase() === 'AFFILIATE_PRODUCT' ? 'Marketplace' : 'Produk Resmi';
}

function productKindClass(x: ProductItem): string {
  return String(x.productType || '').toUpperCase() === 'AFFILIATE_PRODUCT'
    ? 'bg-amber-50 text-amber-700 border-amber-200'
    : 'bg-emerald-50 text-emerald-700 border-emerald-200';
}

export default function ProductMarketplaceClient() {
  const [items, setItems] = useState<ProductItem[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [initialLoaded, setInitialLoaded] = useState(false);
  const [error, setError] = useState('');
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
      const res = await fetch(`${API_BASE_URL}/api/Products?page=${nextPage}&pageSize=18`, { cache: 'no-store' });
      const json = (await res.json()) as ApiEnvelope<ProductsResponse>;
      if (!res.ok) throw new Error('Gagal memuat produk marketplace');
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
      setError(err instanceof Error ? err.message : 'Gagal memuat produk marketplace');
    } finally {
      setInitialLoaded(true);
      setLoading(false);
      loadingRef.current = false;
    }
  }, []);

  useEffect(() => {
    void loadPage(1);
  }, [loadPage]);

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

  const summary = useMemo(() => {
    if (!initialLoaded) return 'Memuat produk...';
    if (total <= 0) return 'Belum ada produk aktif.';
    return `${items.length} dari ${total} produk tampil`;
  }, [initialLoaded, items.length, total]);

  return (
    <div className="px-4 py-6 space-y-4">
      <div className="bg-white border rounded-3xl p-5">
        <h1 className="text-xl font-extrabold">Marketplace Produk</h1>
        <p className="text-xs text-zinc-500 mt-1">Produk perlengkapan ibadah, oleh-oleh, dan pilihan marketplace resmi.</p>
        <div className="mt-3 text-[11px] font-semibold text-zinc-500">{summary}</div>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        {items.map((x) => (
          <Link
            key={x.fileId}
            href={`/produk-lain/${x.fileId}${refUsername ? `@${encodeURIComponent(refUsername)}` : ''}`}
            className="overflow-hidden rounded-2xl border bg-white hover:shadow-sm"
          >
            <div className="relative h-44 bg-zinc-100">
              {x.mainImageUrl ? <Image src={x.mainImageUrl} alt={x.name || 'Produk'} fill className="object-cover" unoptimized /> : (
                <div className="flex h-full items-center justify-center text-3xl text-zinc-300">🛒</div>
              )}
            </div>
            <div className="space-y-1 p-3">
              <div className="flex justify-between gap-2">
                <div className="text-sm font-bold">{x.name}</div>
                <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] ${productKindClass(x)}`}>
                  {productKindLabel(x)}
                </span>
              </div>
              <div className="text-[11px] text-zinc-500">{x.category || '-'} {x.marketplace ? `• ${x.marketplace}` : ''}</div>
              <div className="text-xs font-semibold">Rp {Number(x.price || 0).toLocaleString('id-ID')}</div>
            </div>
          </Link>
        ))}
      </div>

      {!initialLoaded && loading ? (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          {[...Array(6)].map((_, i) => <div key={i} className="h-64 animate-pulse rounded-2xl border bg-zinc-100" />)}
        </div>
      ) : null}

      {error ? <div className="rounded-2xl border border-red-100 bg-red-50 p-4 text-xs text-red-600">{error}</div> : null}

      <div ref={sentinelRef} className="min-h-12">
        {loading && initialLoaded ? (
          <div className="flex items-center justify-center gap-2 py-4 text-xs font-semibold text-zinc-500">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-zinc-200 border-t-primary-600" />
            Memuat produk berikutnya...
          </div>
        ) : null}
        {!loading && hasMore ? (
          <button type="button" onClick={() => void loadPage(page + 1)} className="w-full rounded-2xl border bg-white py-3 text-xs font-bold text-primary-700">
            Muat produk lainnya
          </button>
        ) : null}
        {initialLoaded && !hasMore && items.length > 0 ? (
          <div className="py-4 text-center text-[11px] text-zinc-400">Semua produk sudah tampil.</div>
        ) : null}
      </div>
    </div>
  );
}
