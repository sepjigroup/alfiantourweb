'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from '@/i18n/routing-patch';
import { apiGet, apiPut } from '@/lib/api-client';
import { getAuthState } from '@/lib/auth';
import { Skeleton } from '@/components/Skeleton';

type OrderRow = {
  id: number;
  customerName?: string;
  customerWhatsApp?: string;
  programSlugSnapshot?: string;
  refAgentUsername?: string;
  paxCount: number;
  status?: string;
  revenueAmount: number;
  createdAt?: string;
};

type OrderListResp = {
  data?: {
    items?: OrderRow[];
    totalCount?: number;
    page?: number;
    totalPages?: number;
  };
};

export default function OrdersPage() {
  const router = useRouter();
  const [rows, setRows] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [accessReady, setAccessReady] = useState(false);

  const roleNames = useMemo(() => {
    const roles = getAuthState()?.user?.roles;
    return Array.isArray(roles) ? roles.map((x) => String(x).toLowerCase()) : [];
  }, []);

  const load = async () => {
    setLoading(true);
    try {
      const q = new URLSearchParams({ page: '1', pageSize: '50' });
      if (search.trim()) q.set('search', search.trim());
      if (statusFilter !== 'all') q.set('status', statusFilter);
      const res = await apiGet<OrderListResp>(`/api/BusinessInsights/pack/bookings/manage?${q.toString()}`);
      setRows(res.data?.items ?? []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const auth = getAuthState();
    const returnUrl = `${window.location.pathname}${window.location.search || ''}`;
    const locale = window.location.pathname.split('/').filter(Boolean)[0] || 'id';
    if (!auth?.token) {
      window.location.replace(`/${locale}/login?returnUrl=${encodeURIComponent(returnUrl)}`);
      return;
    }
    const canAccess = roleNames.some((r) => r === 'superadmin' || r === 'admin');
    if (!canAccess) {
      window.location.replace(`/${locale}/401?returnUrl=${encodeURIComponent(returnUrl)}`);
      return;
    }
    setAccessReady(true);
  }, [roleNames]);

  useEffect(() => {
    if (!accessReady) return;
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessReady, statusFilter]);

  const setStatus = async (id: number, status: 'new' | 'confirmed' | 'paid' | 'cancelled' | 'payout' | 'success') => {
    setBusyId(id);
    try {
      await apiPut(`/api/BusinessInsights/pack/bookings/${id}/status`, { status });
      await load();
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="p-4 space-y-3">
      <div className="bg-white border rounded-2xl p-4 space-y-2">
        <h1 className="text-sm font-bold">Order Masuk</h1>
        <div className="grid grid-cols-2 gap-2">
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cari customer/pack/ref..." className="col-span-2 border rounded-xl px-3 py-2 text-xs" />
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="border rounded-xl px-3 py-2 text-xs bg-white">
            <option value="all">Semua status</option>
            <option value="new">new</option>
            <option value="confirmed">confirmed</option>
            <option value="paid">paid</option>
            <option value="payout">payout</option>
            <option value="success">success</option>
            <option value="cancelled">cancelled</option>
          </select>
          <button onClick={() => void load()} className="border rounded-xl px-3 py-2 text-xs font-semibold">Refresh</button>
        </div>
      </div>

      <div className="space-y-2">
        {loading ? (
          <div className="space-y-2">
            <div className="bg-white border rounded-2xl p-3 space-y-2">
              <Skeleton className="h-4 w-44" />
              <Skeleton className="h-3 w-56 rounded-full" />
              <Skeleton className="h-8 w-full rounded-xl" />
            </div>
            <div className="flex items-center gap-2 text-xs text-zinc-500">
              <span className="h-4 w-4 rounded-full border-2 border-zinc-300 border-t-primary-600 animate-spin" />
              Memuat order...
            </div>
          </div>
        ) : null}
        {!loading && rows.length === 0 ? <div className="text-xs text-zinc-500">Belum ada order.</div> : null}
        {rows.map((r) => (
          <div key={r.id} className="bg-white border rounded-2xl p-3 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="text-sm font-semibold">#{r.id} • {r.customerName || '-'}</div>
                <div className="text-[11px] text-zinc-500">{r.programSlugSnapshot || '-'} • {r.customerWhatsApp || '-'}</div>
              </div>
              <button onClick={() => router.push(`/akun/orders/${r.id}`)} className="text-xs border rounded-lg px-2 py-1">Detail</button>
            </div>
            <div className="text-[11px] text-zinc-600">Status: <span className="font-semibold">{r.status || '-'}</span> • Pax: {r.paxCount} • Revenue: Rp {Number(r.revenueAmount || 0).toLocaleString('id-ID')}</div>
            <div className="grid grid-cols-4 gap-1">
              {(['new', 'confirmed', 'paid', 'payout', 'success', 'cancelled'] as const).map((st) => (
                <button key={st} disabled={busyId === r.id} onClick={() => void setStatus(r.id, st)} className={`text-[11px] border rounded-lg px-2 py-1 ${r.status === st ? 'bg-blue-600 text-white border-blue-600' : ''}`}>
                  {st}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

