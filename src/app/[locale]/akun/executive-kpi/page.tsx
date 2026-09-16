'use client';

import { useEffect, useState } from 'react';
import { Link } from '@/i18n/routing-patch';
import { apiGet } from '@/lib/api-client';

const toRupiah = (n: number) => `Rp ${Number(n || 0).toLocaleString('id-ID')}`;

export default function ExecutiveKpiPage() {
  const [loading, setLoading] = useState(false);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [data, setData] = useState<any>(null);

  const load = async () => {
    setLoading(true);
    try {
      const q = new URLSearchParams();
      if (fromDate) q.set('from', `${fromDate}T00:00:00Z`);
      if (toDate) q.set('to', `${toDate}T23:59:59Z`);
      const res = await apiGet<any>(`/api/BusinessInsights/executive-kpi${q.toString() ? `?${q.toString()}` : ''}`);
      setData(res?.data ?? null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);

  const funnel = Array.isArray(data?.funnel) ? data.funnel : [];
  const topAgents = Array.isArray(data?.topAgents) ? data.topAgents : [];

  return (
    <div className="p-4 space-y-4 animate-fade-up">
      <div className="bg-white border rounded-3xl p-5">
        <h1 className="text-lg font-extrabold g-text">Executive KPI</h1>
        <p className="text-xs text-zinc-500 mt-1">Dashboard gabungan Agen, Komisi, Closing, dan Funnel.</p>
      </div>

      <div className="bg-white border rounded-3xl p-4 grid grid-cols-1 md:grid-cols-4 gap-2 text-xs">
        <input type="date" className="border rounded-lg px-2 py-2" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
        <input type="date" className="border rounded-lg px-2 py-2" value={toDate} onChange={(e) => setToDate(e.target.value)} />
        <button className="border rounded-lg px-3 py-2 font-semibold" onClick={() => void load()}>{loading ? 'Memuat...' : 'Refresh KPI'}</button>
        <button className="border rounded-lg px-3 py-2" onClick={() => {
          const rows = topAgents;
          const headers = ['Username', 'Leads', 'Won', 'Bookings', 'Revenue', 'Profit', 'ConversionRate', 'CommissionPending', 'CommissionApproved', 'CommissionPaid'];
          const esc = (v: unknown) => `"${String(v ?? '').replaceAll('"', '""')}"`;
          const csv = [
            headers.map(esc).join(','),
            ...rows.map((x: any) => [x.username, x.leads, x.won, x.bookings, x.revenue, x.profit, x.conversionRate, x.commissionPending, x.commissionApproved, x.commissionPaid].map(esc).join(',')),
          ].join('\n');
          const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `executive-kpi-${new Date().toISOString().slice(0, 10)}.csv`;
          a.click();
          URL.revokeObjectURL(url);
        }}>Export CSV</button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-xs">
        <div className="bg-white border rounded-2xl p-3"><div className="text-zinc-500">Total Leads</div><div className="text-sm font-bold">{Number(data?.headline?.totalLeads || 0)}</div></div>
        <div className="bg-white border rounded-2xl p-3"><div className="text-zinc-500">Total Booking</div><div className="text-sm font-bold">{Number(data?.headline?.totalBookings || 0)}</div></div>
        <div className="bg-white border rounded-2xl p-3"><div className="text-zinc-500">Revenue</div><div className="text-sm font-bold">{toRupiah(Number(data?.headline?.totalRevenue || 0))}</div></div>
        <div className="bg-white border rounded-2xl p-3"><div className="text-zinc-500">Profit</div><div className="text-sm font-bold">{toRupiah(Number(data?.headline?.totalProfit || 0))}</div></div>
        <div className="bg-white border rounded-2xl p-3"><div className="text-zinc-500">Net Cashflow</div><div className="text-sm font-bold">{toRupiah(Number(data?.headline?.netCashflow || 0))}</div></div>
      </div>

      <div className="bg-white border rounded-3xl p-4 space-y-2 text-xs">
        <h2 className="text-sm font-bold">Funnel Snapshot</h2>
        {funnel.map((x: any) => (
          <div key={x.stage} className="flex justify-between border rounded-xl px-3 py-2">
            <span>{x.stage}</span>
            <span className="font-semibold">{x.count}</span>
          </div>
        ))}
      </div>

      <div className="bg-white border rounded-3xl p-4 space-y-2 text-xs">
        <h2 className="text-sm font-bold">Top Agents</h2>
        {topAgents.length === 0 ? <div className="text-zinc-500">Belum ada data.</div> : null}
        {topAgents.map((x: any) => (
          <div key={x.username} className="border rounded-xl p-3 space-y-1">
            <div className="font-semibold">@{x.username}</div>
            <div className="text-zinc-600">Leads {x.leads} • Booking {x.bookings} • Won {x.won} • Conv {Number(x.conversionRate || 0).toLocaleString('id-ID')}%</div>
            <div className="text-zinc-700">Revenue {toRupiah(x.revenue)} • Profit {toRupiah(x.profit)}</div>
            <div className="text-zinc-500">Komisi pending {toRupiah(x.commissionPending)} • approved {toRupiah(x.commissionApproved)} • paid {toRupiah(x.commissionPaid)}</div>
          </div>
        ))}
      </div>

      <Link href="/akun" className="inline-flex text-sm text-primary-600">← Kembali ke Akun</Link>
    </div>
  );
}
