'use client';

import { useEffect, useMemo, useState } from 'react';
import { useLocale } from 'next-intl';
import { useRouter } from '@/i18n/routing-patch';
import { API_BASE_URL } from '@/lib/api-client';
import { fetchPrograms, type ProgramItem } from '@/lib/programs';
import { usePublicCurrency } from '@/lib/public-currency';
import { PackCard } from '@/components/PackCard';

type PublicUserItem = {
  id?: string;
  userName?: string;
  fullName?: string;
  avatar?: string | null;
  whatsApp?: string | null;
  branchCode?: string | null;
  branchName?: string | null;
  address?: string | null;
};

type BranchItem = {
  id: number;
  name?: string | null;
  code?: string | null;
  address?: string | null;
  city?: string | null;
  province?: string | null;
};

type Props = {
  params: Promise<{ username: string }>;
};

function toAbsoluteUrl(url?: string | null): string {
  const raw = String(url ?? '').trim();
  if (!raw) return '';
  if (raw.startsWith('http://') || raw.startsWith('https://')) return raw;
  return `${API_BASE_URL}${raw.startsWith('/') ? '' : '/'}${raw}`;
}

function normalize(v?: string | null): string {
  return String(v ?? '').trim();
}

function formatDate(raw?: string, locale = 'id'): string {
  if (!raw) return '-';
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return '-';
  return d.toLocaleDateString(locale, { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function ReferralLandingPage({ params }: Props) {
  const locale = useLocale();
  const router = useRouter();
  const { formatPrice } = usePublicCurrency(locale);
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<PublicUserItem | null>(null);
  const [branch, setBranch] = useState<BranchItem | null>(null);
  const [programs, setPrograms] = useState<ProgramItem[]>([]);
  const [page, setPage] = useState(1);

  useEffect(() => {
    let active = true;
    params.then((p) => {
      if (!active) return;
      setUsername(String(p.username || '').replace(/^@/, ''));
    });
    return () => {
      active = false;
    };
  }, [params]);

  useEffect(() => {
    if (!username) return;
    if (typeof document !== 'undefined') {
      const hasRefCookie = document.cookie.split(';').some((item) => item.trim().startsWith('ref_agent='));
      if (!hasRefCookie) {
        const maxAge = 60 * 60 * 24 * 15;
        document.cookie = `ref_agent=${encodeURIComponent(username)}; Max-Age=${maxAge}; Path=/; SameSite=Lax`;
      }
    }
    let active = true;
    setPage(1);
    (async () => {
      setLoading(true);
      try {
        const userRes = await fetch(
          `${API_BASE_URL}/api/UserManagement/public-users?pageNumber=1&pageSize=50&searchTerm=${encodeURIComponent(username)}&isActive=true`,
          { cache: 'no-store' }
        );
        const userJson = await userRes.json();
        const items = (userJson?.data?.items ?? []) as PublicUserItem[];
        const found =
          items.find((x) => normalize(x.userName).toLowerCase() === username.toLowerCase()) ??
          items.find((x) => normalize(x.userName).toLowerCase().includes(username.toLowerCase())) ??
          null;
        if (!active) return;
        setUser(found);

        let branchRow: BranchItem | null = null;
        if (found?.branchCode) {
          const branchRes = await fetch(
            `${API_BASE_URL}/api/Branch?pageNumber=1&pageSize=10&searchTerm=${encodeURIComponent(found.branchCode)}`,
            { cache: 'no-store' }
          );
          const branchJson = await branchRes.json();
          const branchItems = (branchJson?.data ?? []) as BranchItem[];
          branchRow =
            branchItems.find((b) => normalize(b.code).toLowerCase() === normalize(found.branchCode).toLowerCase()) ??
            branchItems[0] ??
            null;
          if (!active) return;
        }
        setBranch(branchRow);

        const allPrograms = await fetchPrograms();
        if (!active) return;
        if (branchRow?.id) {
          const filtered = allPrograms.filter((p) => Number((p as any).officeBranchId ?? 0) === branchRow!.id);
          setPrograms(filtered.length > 0 ? filtered : allPrograms);
        } else {
          setPrograms(allPrograms);
        }
      } catch {
        if (!active) return;
        setUser(null);
        setBranch(null);
        setPrograms([]);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [username]);

  const pageSize = 8;
  const totalPages = Math.max(1, Math.ceil(programs.length / pageSize));
  const pagedPrograms = useMemo(() => {
    const start = (page - 1) * pageSize;
    return programs.slice(start, start + pageSize);
  }, [page, programs]);

  const waHref = useMemo(() => {
    const wa = normalize(user?.whatsApp).replace(/\D/g, '');
    if (!wa) return '';
    const text = encodeURIComponent(`Assalamualaikum, saya tertarik konsultasi paket umroh/haji dari ${normalize(user?.fullName) || normalize(user?.userName)}.`);
    return `https://wa.me/${wa}?text=${text}`;
  }, [user]);

  return (
    <div className="p-4 space-y-4 animate-fade-up">
      <div className="rounded-3xl border bg-gradient-to-br from-primary-50 via-white to-sky-50 p-4 shadow-sm transition-all duration-300 hover:shadow-md">
        {loading ? (
          <div className="space-y-3 animate-pulse">
            <div className="h-5 w-28 rounded-full bg-zinc-200" />
            <div className="flex items-start gap-3">
              <div className="h-16 w-16 rounded-2xl bg-zinc-200" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-40 rounded bg-zinc-200" />
                <div className="h-3 w-32 rounded bg-zinc-200" />
                <div className="h-3 w-56 rounded bg-zinc-200" />
                <div className="h-7 w-32 rounded-xl bg-zinc-200" />
              </div>
            </div>
          </div>
        ) : !user ? (
          <div className="space-y-2">
            <div className="text-sm font-semibold text-rose-600">Username referral tidak ditemukan.</div>
            <div className="text-xs text-zinc-600">Silakan cek ulang link referral atau buka katalog paket umum.</div>
            <button
              type="button"
              onClick={() => router.push(`/${locale}/pack`)}
              className="inline-flex rounded-xl border px-3 py-1.5 text-xs font-semibold"
            >
              Buka Paket Umum
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="inline-flex rounded-full bg-white/80 border px-2.5 py-1 text-[10px] font-bold text-primary-700">
              Referral Resmi
            </div>
            <div className="flex items-start gap-3">
            <div className="h-16 w-16 rounded-2xl overflow-hidden border bg-zinc-100 shrink-0 shadow-sm">
              {toAbsoluteUrl(user.avatar) ? (
                <img src={toAbsoluteUrl(user.avatar)} alt={normalize(user.fullName) || normalize(user.userName)} className="h-full w-full object-cover" />
              ) : (
                <div className="h-full w-full flex items-center justify-center text-lg font-bold text-zinc-500">
                  {(normalize(user.fullName) || normalize(user.userName) || 'A').charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-extrabold truncate">{normalize(user.fullName) || normalize(user.userName)}</div>
              <div className="text-[11px] text-zinc-700 mt-1">Cabang: {normalize(branch?.name) || normalize(user.branchName) || '-'}</div>
              <div className="text-[11px] text-zinc-700">Alamat: {normalize(branch?.address) || normalize(user.address) || '-'}</div>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                {waHref ? (
                  <a href={waHref} target="_blank" rel="noopener noreferrer" className="inline-flex rounded-xl bg-emerald-600 hover:bg-emerald-700 px-3 py-1.5 text-[11px] font-semibold text-white transition-all duration-200 hover:-translate-y-0.5">
                    Hubungi WhatsApp
                  </a>
                ) : null}
                {normalize(user.userName) ? (
                  <button
                    type="button"
                    onClick={() => router.push(`/${locale}/reg/${encodeURIComponent(normalize(user.userName))}`)}
                    className="inline-flex rounded-xl border border-primary-200 bg-white px-3 py-1.5 text-[11px] font-semibold text-primary-700 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary-400 hover:bg-primary-50"
                  >
                    Register
                  </button>
                ) : null}
              </div>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-xl border bg-white p-2 text-center">
              <div className="text-[10px] text-zinc-500">Username</div>
              <div className="text-[11px] font-bold truncate">@{normalize(user.userName) || '-'}</div>
            </div>
            <div className="rounded-xl border bg-white p-2 text-center">
              <div className="text-[10px] text-zinc-500">Cabang</div>
              <div className="text-[11px] font-bold truncate">{normalize(branch?.code) || '-'}</div>
            </div>
            <div className="rounded-xl border bg-white p-2 text-center">
              <div className="text-[10px] text-zinc-500">Paket</div>
              <div className="text-[11px] font-bold">{programs.length}</div>
            </div>
          </div>
          </div>
        )}
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="text-sm font-extrabold">Paket Rekomendasi</div>
          {!loading ? <div className="text-[11px] text-zinc-600">{programs.length} paket</div> : null}
        </div>
        {loading ? (
          <div className="py-10 flex justify-center">
            <div className="h-8 w-8 rounded-full border-2 border-zinc-200 border-t-primary-600 animate-spin" />
          </div>
        ) : programs.length === 0 ? (
          <div className="rounded-2xl border bg-white p-4 text-xs text-zinc-600">Belum ada paket aktif pada referral ini.</div>
        ) : (
          <div className="columns-2 gap-3 [column-fill:_balance]">
            {pagedPrograms.map((p, i) => {
              const departures = (p.packages?.[0]?.departures ?? []).slice().sort((a, b) => new Date(a.departureDate).getTime() - new Date(b.departureDate).getTime());
              const firstDeparture = departures[0];
              let priceIdr = 0;
              try {
                const cfg = typeof p.displayConfigJson === 'string' ? JSON.parse(p.displayConfigJson) as { packageTypePricings?: Array<{ priceIdr?: number }>; priceIdr?: number } : {};
                const prices = (cfg.packageTypePricings ?? []).map((x) => Number(x?.priceIdr || 0)).filter((x) => x > 0);
                priceIdr = prices.length > 0 ? Math.min(...prices) : Number(cfg.priceIdr || 0);
              } catch {}
              const cover = toAbsoluteUrl(p.coverImageUrl) || `https://picsum.photos/seed/ref-program-${p.id}/800/500`;
              return (
                <div key={p.id} className="mb-3 break-inside-avoid transition-transform duration-200 hover:-translate-y-0.5">
                  <PackCard
                    id={p.id}
                    title={p.title || p.name}
                    date={formatDate(firstDeparture?.departureDate || p.departurePeriodStart, locale)}
                    duration={`${p.durationDays} Hari`}
                    priceIdr={Math.max(0, priceIdr)}
                    price={formatPrice(Math.max(0, priceIdr))}
                    seats={firstDeparture?.seatAvailable ?? 0}
                    totalSeats={firstDeparture?.seatCapacity ?? 0}
                    image={cover}
                    images={cover ? [cover] : []}
                    badge={i % 2 === 0 ? 'promo' : 'hot'}
                    airline={firstDeparture?.airlineName || p.airlineName}
                    showPriceStartLabel
                    onDetail={() => router.push(`/${locale}/pack/${p.slug || p.id}`)}
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>

      {!loading && programs.length > pageSize ? (
        <div className="sticky bottom-20 z-20 flex items-center justify-center gap-2 rounded-2xl border bg-white/95 p-2 backdrop-blur">
          <button
            type="button"
            className="rounded-xl border px-3 py-1.5 text-xs disabled:opacity-50"
            disabled={page <= 1}
            onClick={() => setPage((v) => Math.max(1, v - 1))}
          >
            Sebelumnya
          </button>
          <div className="text-xs text-zinc-600">{page} / {totalPages}</div>
          <button
            type="button"
            className="rounded-xl border px-3 py-1.5 text-xs disabled:opacity-50"
            disabled={page >= totalPages}
            onClick={() => setPage((v) => Math.min(totalPages, v + 1))}
          >
            Berikutnya
          </button>
        </div>
      ) : null}
    </div>
  );
}
