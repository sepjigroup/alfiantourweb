'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { AgenCard } from '@/components/AgenCard';
import { Skeleton } from '@/components/Skeleton';
import { cn } from '@/lib/utils';
import { apiGet } from '@/lib/api-client';
import { useLeadsTrack } from '@/hooks/useLeadsTrack';

type ApiEnvelope<T> = { data?: T };
type PublicUsersListPayload = {
  items?: PublicUserItem[];
  totalCount?: number;
  pageNumber?: number;
  pageSize?: number;
  totalPages?: number;
};

type BranchItem = {
  id?: number;
  name?: string;
  code?: string;
  city?: string | null;
  province?: string | null;
  address?: string | null;
  mapsUrl?: string | null;
};

type PublicUserItem = {
  id?: string;
  userName?: string;
  email?: string;
  fullName?: string;
  whatsApp?: string | null;
  phone?: string | null;
  city?: string | null;
  branchCode?: string | null;
};

type AgenView = {
  id: string;
  username?: string;
  name: string;
  initial: string;
  verified: boolean;
  city: string;
  code?: string;
  whatsApp?: string;
  rating: number;
  reviews: number;
};

function normalize(v: string | null | undefined): string {
  if (!v) return '';
  const s = v.trim();
  return s.toLowerCase() === 'null' ? '' : s;
}

function toAgenFromPublicUser(user: PublicUserItem): AgenView {
  const name = normalize(user.fullName) || normalize(user.userName) || 'Agen';
  return {
    id: user.id || `${name}-${Math.random().toString(36).slice(2, 8)}`,
    username: normalize(user.userName) || undefined,
    name,
    initial: name.charAt(0).toUpperCase(),
    verified: true,
    city: normalize(user.city) || '-',
    code: normalize(user.branchCode) || undefined,
    whatsApp: normalize(user.whatsApp) || normalize(user.phone) || undefined,
    rating: 5,
    reviews: 0,
  };
}

export default function AgenPage() {
  const t = useTranslations('agen');
  const { trackEvent } = useLeadsTrack();
  const [loading, setLoading] = useState(true);
  const [province, setProvince] = useState('');
  const [city, setCity] = useState('');
  const [provinces, setProvinces] = useState<string[]>([]);
  const [cities, setCities] = useState<string[]>([]);
  const [branches, setBranches] = useState<BranchItem[]>([]);
  const [agents, setAgents] = useState<AgenView[]>([]);
  const [message, setMessage] = useState('');
  const [officeExpanded, setOfficeExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<AgenView[] | null>(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchMessage, setSearchMessage] = useState('');

  useEffect(() => {
    trackEvent('page_view');
  }, [trackEvent]);

  useEffect(() => {
    let cancelled = false;

    const loadInitial = async () => {
      setLoading(true);
      try {
        const [provinceRes, agentRes] = await Promise.all([
          apiGet<ApiEnvelope<string[]>>('/api/Branch/distinct/provinces'),
          apiGet<ApiEnvelope<PublicUsersListPayload>>('/api/UserManagement/public-users?pageNumber=1&pageSize=10&role=Agen&sortBy=recentLogin&sortDirection=desc&isActive=true'),
        ]);

        if (!cancelled) {
          setProvinces((provinceRes.data ?? []).filter((x) => normalize(x) !== ''));
          setAgents((agentRes.data?.items ?? []).map((u) => toAgenFromPublicUser(u)));
        }
      } catch {
        if (!cancelled) {
          setMessage('Data agen belum tersedia saat ini.');
          setProvinces([]);
          setAgents([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadInitial();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const query = searchQuery.trim();
    if (!query) {
      setSearchResults(null);
      setSearchMessage('');
      setSearchLoading(false);
      return;
    }

    let cancelled = false;
    const timer = window.setTimeout(async () => {
      setSearchLoading(true);
      setSearchMessage('');

      try {
        const params = new URLSearchParams({
          pageNumber: '1',
          pageSize: '200',
          role: 'Agen',
          searchTerm: query,
          sortBy: 'name',
          sortDirection: 'asc',
          isActive: 'true',
        });
        if (city) params.set('city', city);

        const response = await apiGet<ApiEnvelope<PublicUsersListPayload>>(
          `/api/UserManagement/public-users?${params.toString()}`
        );
        let rows = (response.data?.items ?? []).map((user) => toAgenFromPublicUser(user));

        if (province && !city) {
          const allowedCodes = new Set(branches.map((branch) => normalize(branch.code)).filter(Boolean));
          rows = rows.filter((agent) => !agent.code || allowedCodes.has(normalize(agent.code)));
        }

        if (!cancelled) {
          setSearchResults(rows);
          setSearchMessage(rows.length === 0 ? 'Agen tidak ditemukan. Coba nama atau username lain.' : '');
        }
      } catch {
        if (!cancelled) {
          setSearchResults([]);
          setSearchMessage('Pencarian agen gagal dimuat. Silakan coba lagi.');
        }
      } finally {
        if (!cancelled) setSearchLoading(false);
      }
    }, 350);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [branches, city, province, searchQuery]);

  const onPickProvince = async (value: string) => {
    setSearchQuery('');
    setSearchResults(null);
    setSearchMessage('');
    setProvince(value);
    setCity('');
    setOfficeExpanded(false);
    setBranches([]);
    setAgents([]);
    setMessage('Memuat agen berdasarkan provinsi...');

    setLoading(true);
    try {
      const [cityRes, branchRes, agentRes] = await Promise.all([
        apiGet<ApiEnvelope<string[]>>(`/api/Branch/distinct/cities?province=${encodeURIComponent(value)}`),
        apiGet<ApiEnvelope<BranchItem[]>>(`/api/Branch?pageNumber=1&pageSize=500&province=${encodeURIComponent(value)}`),
        apiGet<ApiEnvelope<PublicUsersListPayload>>(`/api/UserManagement/public-users?pageNumber=1&pageSize=500&role=Agen&sortBy=recentLogin&sortDirection=desc&isActive=true`),
      ]);
      setCities((cityRes.data ?? []).filter((x) => normalize(x) !== ''));
      const provinceBranches = (branchRes.data ?? []).filter((b) => normalize(b.code) !== '');
      setBranches(provinceBranches);
      const allowedCodes = new Set(provinceBranches.map((b) => normalize(b.code)).filter(Boolean));
      const allAgents = (agentRes.data?.items ?? []).map((u) => toAgenFromPublicUser(u));
      const filtered = allAgents.filter((a) => !a.code || allowedCodes.has(normalize(a.code)));
      setAgents(filtered);
      setMessage(filtered.length === 0 ? 'Belum ada agen aktif pada provinsi ini.' : '');
    } catch {
      setCities([]);
      setMessage('Gagal memuat daftar kota.');
    } finally {
      setLoading(false);
    }
  };

  const onPickCity = async (value: string) => {
    setSearchQuery('');
    setSearchResults(null);
    setSearchMessage('');
    setCity(value);
    setOfficeExpanded(false);
    setLoading(true);
    setMessage('');

    try {
      const branchRes = await apiGet<ApiEnvelope<BranchItem[]>>(`/api/Branch?pageNumber=1&pageSize=500&province=${encodeURIComponent(province)}&city=${encodeURIComponent(value)}`);
      const cityBranches = (branchRes.data ?? []).filter((b) => normalize(b.code) !== '');
      setBranches(cityBranches);

      if (cityBranches.length === 0) {
        setAgents([]);
        setMessage('Belum ada kode cabang pada kota ini.');
        return;
      }

      const agentRes = await apiGet<ApiEnvelope<PublicUsersListPayload>>(`/api/UserManagement/public-users?pageNumber=1&pageSize=500&role=Agen&city=${encodeURIComponent(value)}&sortBy=recentLogin&sortDirection=desc&isActive=true`);
      const merged = (agentRes.data?.items ?? []).map((u) => toAgenFromPublicUser(u));
      const uniq = new Map<string, AgenView>();
      merged.forEach((a) => {
        if (!uniq.has(a.id)) uniq.set(a.id, a);
      });

      const finalAgents = Array.from(uniq.values());
      setAgents(finalAgents);
      if (finalAgents.length === 0) {
        setMessage('Belum ada agen aktif pada kota ini.');
      }
    } catch {
      setAgents([]);
      setBranches([]);
      setMessage('Gagal memuat data agen berdasarkan kota.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 space-y-4 animate-fade-up">
      <h2 className="text-base font-extrabold mb-2">Hubungi Kepala Cabang</h2>

      <div className="relative">
        <svg
          className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.35-4.35" />
        </svg>
        <input
          type="search"
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          placeholder="Cari nama atau username agen..."
          aria-label="Cari kepala cabang atau agen"
          className="w-full rounded-2xl border border-zinc-200 bg-white py-3 pl-11 pr-12 text-sm font-medium text-zinc-800 outline-none transition placeholder:text-zinc-400 focus:border-primary-400 focus:ring-4 focus:ring-primary-100"
        />
        {searchLoading ? (
          <span className="absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin rounded-full border-2 border-zinc-200 border-t-primary-600" />
        ) : searchQuery ? (
          <button
            type="button"
            onClick={() => setSearchQuery('')}
            aria-label="Hapus pencarian"
            className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700"
          >
            ×
          </button>
        ) : null}
      </div>

      <div className="bg-white border rounded-3xl p-4 space-y-2">
        <div className="text-xs font-semibold">Provinsi</div>
        <div className="flex gap-2 overflow-x-auto whitespace-nowrap pb-2">
          {provinces.map((item) => (
            <button
              key={item}
              onClick={() => onPickProvince(item)}
              className={cn(
                'inline-flex shrink-0 text-left px-4 py-2 rounded-2xl text-[11px] font-semibold transition-all',
                province === item ? 'g-main text-white' : 'bg-zinc-50 border text-zinc-700 hover:border-primary-300'
              )}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      {province ? (
        <div className="bg-white border rounded-3xl p-4 space-y-2">
          <div className="text-xs font-semibold">City - {province}</div>
          <div className="flex gap-2 overflow-x-auto whitespace-nowrap pb-2">
            {cities.map((item) => (
              <button
                key={item}
                onClick={() => onPickCity(item)}
                className={cn(
                  'inline-flex shrink-0 text-left px-4 py-2 rounded-2xl text-[11px] font-semibold transition-all',
                  city === item ? 'g-main text-white' : 'bg-zinc-50 border text-zinc-700 hover:border-primary-300'
                )}
              >
                {item}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {city ? (
        <div className="bg-white border rounded-3xl p-4 space-y-3">
          <button onClick={() => setOfficeExpanded((v) => !v)} className="w-full flex items-center justify-between text-left">
            <span className="text-sm font-bold">Informasi Lokasi Kantor</span>
            <span className="text-xs text-zinc-500">{officeExpanded ? 'Sembunyikan' : 'Tampilkan'}</span>
          </button>

          {officeExpanded ? (
            <div className="space-y-2">
              {branches.map((b, idx) => (
                <div key={`${b.id ?? idx}`} className="border rounded-2xl p-3 bg-zinc-50/60">
                  <div className="text-xs font-semibold text-zinc-800">{normalize(b.name) || 'Cabang'}</div>
                  <div className="text-[11px] text-zinc-600 mt-1">Code: {normalize(b.code) || '-'}</div>
                  <div className="text-[11px] text-zinc-600">Address: {normalize(b.address) || 'Belum Terisi'}</div>
                  {normalize(b.mapsUrl) ? (
                    <a
                      href={normalize(b.mapsUrl)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 mt-2 text-[11px] px-3 py-1.5 rounded-xl g-main text-white font-semibold"
                    >
                      <span>🗺️</span>
                      <span>Buka Maps</span>
                    </a>
                  ) : null}
                </div>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="space-y-3">
        {loading || searchLoading
          ? [...Array(4)].map((_, i) => (
              <div key={i} className="bg-white rounded-3xl p-4 flex items-center gap-4 border">
                <Skeleton className="w-12 h-12 rounded-2xl" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-3 w-20" />
                </div>
                <Skeleton className="h-9 w-24 rounded-2xl" />
              </div>
            ))
          : (searchResults ?? agents).map((agent) => <AgenCard key={agent.id} {...agent} />)}
      </div>

      {!loading && !searchLoading && (searchResults ?? agents).length === 0 ? (
        <div className="bg-white border rounded-3xl p-4 text-xs text-zinc-600">
          {searchResults !== null
            ? searchMessage || 'Agen tidak ditemukan.'
            : message || 'Belum ada data agen yang dapat ditampilkan.'}
        </div>
      ) : null}
    </div>
  );
}
