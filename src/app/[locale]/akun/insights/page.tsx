'use client';

import { useEffect, useMemo, useState } from 'react';
import { Link } from '@/i18n/routing-patch';
import { apiGet } from '@/lib/api-client';
import { Skeleton } from '@/components/Skeleton';

const toRupiah = (n: number) => `Rp ${Number(n || 0).toLocaleString('id-ID')}`;

export default function InsightsPage() {
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<any>(null);
  const [finance, setFinance] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);

  const load = async () => {
    setLoading(true);
    try {
      const [s, f, o] = await Promise.all([
        apiGet<any>('/api/BusinessInsights/summary'),
        apiGet<any>('/api/BusinessInsights/finance/summary'),
        apiGet<any>('/api/BusinessInsights/pack/bookings/manage?page=1&pageSize=200'),
      ]);
      setSummary(s?.data ?? null);
      setFinance(f?.data ?? null);
      setOrders(Array.isArray(o?.data?.items) ? o.data.items : []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const orderStats = useMemo(() => {
    const total = orders.length;
    const byStatus = (key: string) => orders.filter((x) => String(x?.status || '').toLowerCase() === key).length;
    return {
      total,
      success: byStatus('success'),
      paid: byStatus('paid'),
      pending: byStatus('new') + byStatus('confirmed'),
      cancelled: byStatus('cancelled'),
      gmv: orders.reduce((acc, x) => acc + Number(x?.revenueAmount || 0), 0),
    };
  }, [orders]);

  return (
    <div className="p-4 space-y-4 animate-fade-up">
      <div className="bg-white border rounded-3xl p-5">
        <h1 className="text-lg font-extrabold g-text">Ringkasan Bisnis (Real Data)</h1>
        <p className="text-xs text-zinc-500 mt-1">Leads, pipeline, dan laporan pesanan berdasarkan data API saat ini.</p>
      </div>

      {loading ? (
        <div className="space-y-2">
          <div className="bg-white border rounded-2xl p-3 space-y-2">
            <Skeleton className="h-4 w-44" />
            <Skeleton className="h-8 w-full rounded-xl" />
          </div>
          <div className="flex items-center gap-2 text-xs text-zinc-500">
            <span className="h-4 w-4 rounded-full border-2 border-zinc-300 border-t-primary-600 animate-spin" />
            Memuat data rill...
          </div>
        </div>
      ) : null}

      <div className="grid grid-cols-2 gap-2">
        <div className="bg-white border rounded-2xl p-3"><div className="text-[11px] text-zinc-500">Leads Masuk</div><div className="text-lg font-extrabold">{summary?.leadsMasuk ?? 0}</div></div>
        <div className="bg-white border rounded-2xl p-3"><div className="text-[11px] text-zinc-500">Conversion Rate</div><div className="text-lg font-extrabold">{summary?.conversionRatePercent ?? 0}%</div></div>
        <div className="bg-white border rounded-2xl p-3"><div className="text-[11px] text-zinc-500">Repeat Customer</div><div className="text-lg font-extrabold">{summary?.repeatCustomer ?? 0}</div></div>
        <div className="bg-white border rounded-2xl p-3"><div className="text-[11px] text-zinc-500">Avg Rating</div><div className="text-lg font-extrabold">{summary?.reviewRating?.avg ?? 0}</div></div>
      </div>

      <div className="bg-white border rounded-3xl p-4 space-y-2 text-xs">
        <h2 className="text-sm font-bold">Laporan Pesanan (Real)</h2>
        <div className="space-y-1">
          <div className="flex justify-between"><span>Total Pesanan</span><span className="font-semibold">{orderStats.total}</span></div>
          <div className="flex justify-between"><span>Success</span><span className="font-semibold">{orderStats.success}</span></div>
          <div className="flex justify-between"><span>Paid</span><span className="font-semibold">{orderStats.paid}</span></div>
          <div className="flex justify-between"><span>Pending (new+confirmed)</span><span className="font-semibold">{orderStats.pending}</span></div>
          <div className="flex justify-between"><span>Cancelled</span><span className="font-semibold">{orderStats.cancelled}</span></div>
          <div className="flex justify-between"><span>GMV</span><span className="font-semibold">{toRupiah(orderStats.gmv)}</span></div>
        </div>
      </div>

      <div className="bg-white border rounded-3xl p-4 space-y-2 text-xs">
        <h2 className="text-sm font-bold">Finance Summary (Real)</h2>
        <div className="space-y-1">
          <div className="flex justify-between"><span>Total Revenue</span><span>{toRupiah(Number(finance?.totalRevenue ?? 0))}</span></div>
          <div className="flex justify-between"><span>Total Cost</span><span>{toRupiah(Number(finance?.totalCost ?? 0))}</span></div>
          <div className="flex justify-between"><span>Net Cashflow</span><span>{toRupiah(Number(finance?.netCashflow ?? 0))}</span></div>
          <div className="flex justify-between"><span>Total Profit</span><span>{toRupiah(Number(summary?.totalProfit ?? 0))}</span></div>
        </div>
      </div>

      <div className="flex gap-2">
        <button type="button" className="border rounded-xl px-3 py-2 text-xs font-semibold" onClick={() => void load()}>Refresh Data</button>
        <Link href="/akun/orders" className="border rounded-xl px-3 py-2 text-xs font-semibold">Buka Order Masuk</Link>
        <Link href="/akun/leads" className="border rounded-xl px-3 py-2 text-xs font-semibold">Buka Leads</Link>
      </div>

      <Link href="/akun" className="inline-flex text-sm text-primary-600">← Kembali ke Akun</Link>
    </div>
  );
}


