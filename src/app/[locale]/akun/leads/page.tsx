'use client';

import { useEffect, useState } from 'react';
import { Link } from '@/i18n/routing-patch';
import { apiGet, apiPut } from '@/lib/api-client';
import { getAuthState } from '@/lib/auth';
import { Skeleton } from '@/components/Skeleton';

export default function AgenLeadsPage() {
  const [summary, setSummary] = useState<any[]>([]);
  const [report, setReport] = useState<any[]>([]);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [loading, setLoading] = useState(false);
  const roles = (getAuthState()?.user?.roles ?? []).map((x) => String(x).toLowerCase());
  const canManage = roles.includes('superadmin') || roles.includes('admin') || roles.includes('manager');

  const load = async () => {
    setLoading(true);
    try {
      const q = new URLSearchParams();
      if (fromDate) q.set('from', `${fromDate}T00:00:00Z`);
      if (toDate) q.set('to', `${toDate}T23:59:59Z`);
      const suffix = q.toString() ? `&${q.toString()}` : '';
      const [s, r, l] = await Promise.all([
        apiGet<any>(`/api/Leads/funnel?${q.toString()}`),
        apiGet<any>(`/api/Leads/report?page=1&pageSize=50${suffix}`),
        apiGet<any>(`/api/Leads/leaderboard?${q.toString()}`),
      ]);
      setSummary(Array.isArray(s?.data) ? s.data : []);
      setReport(Array.isArray(r?.data?.items) ? r.data.items : []);
      setLeaderboard(Array.isArray(l?.data?.items) ? l.data.items : []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  return (
    <div className="p-4 space-y-4 animate-fade-up">
      <div className="bg-white border rounded-3xl p-5">
        <h1 className="text-lg font-extrabold g-text">Leads Agen</h1>
        <p className="text-xs text-zinc-500 mt-1">Menampilkan leads milik agen yang login.</p>
      </div>
      {loading ? (
        <div className="space-y-2">
          <div className="bg-white border rounded-2xl p-3 space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-8 w-full rounded-xl" />
          </div>
          <div className="flex items-center gap-2 text-xs text-zinc-500">
            <span className="h-4 w-4 rounded-full border-2 border-zinc-300 border-t-primary-600 animate-spin" />
            Memuat data leads...
          </div>
        </div>
      ) : null}
      <div className="bg-white border rounded-3xl p-4 grid grid-cols-1 md:grid-cols-3 gap-2 text-xs">
        <input type="date" className="border rounded-lg px-2 py-2" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
        <input type="date" className="border rounded-lg px-2 py-2" value={toDate} onChange={(e) => setToDate(e.target.value)} />
        <button className="border rounded-lg px-3 py-2 font-semibold" onClick={() => void load()}>Refresh</button>
      </div>

      <div className="bg-white border rounded-3xl p-4 space-y-2">
        <h2 className="text-sm font-bold">Funnel Leads</h2>
        {summary.length === 0 ? <div className="text-xs text-zinc-500">Belum ada data</div> : null}
        {summary.map((x, i) => (
          <div key={i} className="border rounded-xl px-3 py-2 text-xs flex justify-between">
            <span>{x.stage || '-'}</span>
            <span className="font-semibold">{x.count || 0}</span>
          </div>
        ))}
      </div>

      {canManage ? (
        <div className="bg-white border rounded-3xl p-4 space-y-2">
          <h2 className="text-sm font-bold">Leaderboard Agen</h2>
          {leaderboard.length === 0 ? <div className="text-xs text-zinc-500">Belum ada data</div> : null}
          {leaderboard.map((x, i) => (
            <div key={i} className="border rounded-xl px-3 py-2 text-xs">
              <div className="font-semibold">@{x.agentUsername || '-'}</div>
              <div className="text-zinc-500">Cabang: {x.branchCode || '-'} • Leads: {x.leads || 0} • Booking: {x.bookings || 0} • Conv: {Number(x.conversionRate || 0).toLocaleString('id-ID')}%</div>
              <div className="text-zinc-700 font-semibold">Revenue: Rp {Number(x.revenue || 0).toLocaleString('id-ID')}</div>
            </div>
          ))}
        </div>
      ) : null}

      <div className="bg-white border rounded-3xl p-4 space-y-2">
        <h2 className="text-sm font-bold">Log Leads Terbaru</h2>
        {report.length === 0 ? <div className="text-xs text-zinc-500">Belum ada data</div> : null}
        {report.map((x, i) => (
          <div key={x.id || i} className="border rounded-xl px-3 py-2 text-xs">
            <div className="font-semibold">{x.eventType || '-'} • Stage: {x.funnelStage || 'new'}</div>
            <div className="text-zinc-500">{x.pageUrl || '-'} • {x.createdAt ? new Date(x.createdAt).toLocaleString('id-ID') : '-'}</div>
            <div className="mt-2 flex gap-1 flex-wrap">
              {['new', 'contacted', 'qualified', 'proposal', 'won', 'lost'].map((st) => (
                <button
                  key={st}
                  className="border rounded px-2 py-1 text-[11px]"
                  onClick={async () => {
                    await apiPut(`/api/Leads/${x.id}/stage`, { stage: st });
                    await load();
                  }}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <Link href="/akun" className="inline-flex text-sm text-primary-600">← Kembali ke Akun</Link>
    </div>
  );
}


