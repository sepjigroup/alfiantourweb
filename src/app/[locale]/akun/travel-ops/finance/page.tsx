'use client';

import { useEffect, useMemo, useState } from 'react';
import { apiGet, apiPost, apiPut } from '@/lib/api-client';
import TravelOpsNav from '../TravelOpsNav';
import { downloadCsv, toRupiah } from '../_lib';

export default function TravelOpsFinancePage() {
  const now = new Date();
  const [year, setYear] = useState(String(now.getUTCFullYear()));
  const [month, setMonth] = useState(String(now.getUTCMonth() + 1));
  const [openingCash, setOpeningCash] = useState('0');
  const [rows, setRows] = useState<any[]>([]);
  const [msg, setMsg] = useState('');

  const load = async () => {
    try {
      const res = await apiGet<any>('/api/TravelOps/finance/monthly-closing');
      setRows(res.data ?? []);
    } catch (e: any) {
      setMsg(e?.message || 'Gagal memuat data finance closing');
    }
  };
  useEffect(() => { void load(); }, []);
  const sorted = useMemo(() => [...rows].sort((a, b) => (Number(b.year) * 100 + Number(b.month)) - (Number(a.year) * 100 + Number(a.month))), [rows]);
  const statusTone = (status?: string) => {
    const s = (status || '').toLowerCase();
    if (s === 'approved') return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    if (s === 'submitted') return 'bg-amber-50 text-amber-700 border-amber-200';
    return 'bg-zinc-50 text-zinc-700 border-zinc-200';
  };
  const runAction = async (action: () => Promise<void>) => {
    try {
      await action();
    } catch (e: any) {
      setMsg(e?.message || 'Terjadi kesalahan saat memproses permintaan');
    }
  };

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-lg font-bold">TravelOps • Audit & Finance Closing</h1>
      <TravelOpsNav />
      {msg ? <div className="text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-xl px-3 py-2">{msg}</div> : null}
      <div className="bg-white border rounded-2xl p-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2">
        <input className="border rounded-lg px-2.5 py-1.5 text-[11px]" placeholder="Year" value={year} onChange={(e) => setYear(e.target.value)} />
        <input className="border rounded-lg px-2.5 py-1.5 text-[11px]" placeholder="Month" value={month} onChange={(e) => setMonth(e.target.value)} />
        <input className="border rounded-lg px-2.5 py-1.5 text-[11px]" placeholder="Opening Cash" value={openingCash} onChange={(e) => setOpeningCash(e.target.value)} />
        <button
          className="border rounded-lg h-8 w-8 inline-flex items-center justify-center text-xs"
          title="Generate atau update monthly closing"
          onClick={() => void runAction(async () => {
            await apiPost('/api/TravelOps/finance/monthly-closing', {
              year: Number(year || 0),
              month: Number(month || 0),
              openingCash: Number(openingCash || 0),
              closingStatus: 'draft',
            });
            await load();
          })}
        >
          ⟳
        </button>
        <button
          className="border rounded-lg h-8 w-8 inline-flex items-center justify-center text-xs"
          title="Export CSV"
          onClick={() => downloadCsv('travelops-monthly-closing.csv', ['Year', 'Month', 'Status', 'Income', 'Expense', 'Revenue', 'Cost', 'Profit', 'EndingCash'], sorted.map((x) => [x.year, x.month, x.closingStatus, x.incomeAmount, x.expenseAmount, x.revenueAmount, x.costAmount, x.profitAmount, x.endingCash]))}
        >
          ⇩
        </button>
      </div>
      <div className="space-y-2">
        {sorted.map((x) => (
          <div key={x.id} className="bg-white border rounded-2xl p-3 space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="text-sm font-semibold">{x.year}-{String(x.month).padStart(2, '0')}</div>
                <div className="text-[11px] text-zinc-500">Periode Closing</div>
              </div>
              <div className="flex flex-wrap gap-1 justify-end">
                <span className={`text-[11px] px-2 py-1 rounded-full border ${statusTone(x.closingStatus)}`}>{x.closingStatus || 'draft'}</span>
                <span className={`text-[11px] px-2 py-1 rounded-full border ${statusTone(x.workflowStatus)}`}>{x.workflowStatus || 'draft'}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="rounded-xl border p-2"><div className="text-zinc-500">Income</div><div className="font-semibold">{toRupiah(Number(x.incomeAmount || 0))}</div></div>
              <div className="rounded-xl border p-2"><div className="text-zinc-500">Expense</div><div className="font-semibold">{toRupiah(Number(x.expenseAmount || 0))}</div></div>
              <div className="rounded-xl border p-2"><div className="text-zinc-500">Revenue</div><div className="font-semibold">{toRupiah(Number(x.revenueAmount || 0))}</div></div>
              <div className="rounded-xl border p-2"><div className="text-zinc-500">Cost</div><div className="font-semibold">{toRupiah(Number(x.costAmount || 0))}</div></div>
              <div className="rounded-xl border p-2"><div className="text-zinc-500">Profit</div><div className="font-semibold">{toRupiah(Number(x.profitAmount || 0))}</div></div>
              <div className="rounded-xl border p-2"><div className="text-zinc-500">Ending Cash</div><div className="font-semibold">{toRupiah(Number(x.endingCash || 0))}</div></div>
            </div>

            <div className="flex gap-2">
              <button
                className="border rounded-lg h-8 w-8 inline-flex items-center justify-center text-xs"
                title="Submit workflow"
                onClick={() => void runAction(async () => { await apiPut(`/api/TravelOps/finance/monthly-closing/${x.id}/workflow`, { action: 'submit' }); await load(); })}
              >
                ↑
              </button>
              <button
                className="border rounded-lg h-8 w-8 inline-flex items-center justify-center text-xs"
                title="Approve workflow"
                onClick={() => void runAction(async () => { await apiPut(`/api/TravelOps/finance/monthly-closing/${x.id}/workflow`, { action: 'approve' }); await load(); })}
              >
                ✓
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
