'use client';

import { useEffect, useMemo, useState } from 'react';
import { apiGet, apiPost, apiPut, getApiBaseUrl } from '@/lib/api-client';

type MonthMetric = {
  month: string;
  startingMrr: number;
  newMrr: number;
  expansionMrr: number;
  contractionMrr: number;
  churnedMrr: number;
  reactivationMrr: number;
  newCustomers: number;
  churnedCustomers: number;
  activeCustomersStart: number;
  cogs: number;
  opex: number;
};

const emptyMonth: MonthMetric = {
  month: '',
  startingMrr: 0,
  newMrr: 0,
  expansionMrr: 0,
  contractionMrr: 0,
  churnedMrr: 0,
  reactivationMrr: 0,
  newCustomers: 0,
  churnedCustomers: 0,
  activeCustomersStart: 0,
  cogs: 0,
  opex: 0,
};

export default function SaasMetricsPage() {
  const [currency, setCurrency] = useState('IDR');
  const [months, setMonths] = useState<MonthMetric[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [form, setForm] = useState<MonthMetric>(emptyMonth);
  const [msg, setMsg] = useState('');
  const [bulkJson, setBulkJson] = useState(`[
  { "month": "2026-04", "startingMrr": 15000000, "newMrr": 3000000, "expansionMrr": 1000000, "contractionMrr": 250000, "churnedMrr": 500000, "reactivationMrr": 0, "newCustomers": 4, "churnedCustomers": 1, "activeCustomersStart": 20, "cogs": 6000000, "opex": 9000000 }
]`);

  const load = async () => {
    try {
      const res = await apiGet<any>('/api/system/saas-metrics');
      const data = res?.data ?? {};
      setCurrency(String(data.currency || 'IDR'));
      setMonths(Array.isArray(data.months) ? data.months : []);
      setSummary(data.summary ?? null);
    } catch (e: any) {
      setMsg(e?.message || 'Gagal memuat SaaS metrics');
    }
  };

  useEffect(() => { void load(); }, []);

  const money = useMemo(() => new Intl.NumberFormat('id-ID', { style: 'currency', currency: currency || 'IDR', maximumFractionDigits: 0 }), [currency]);

  const runAction = async (action: () => Promise<void>) => {
    try {
      await action();
    } catch (e: any) {
      setMsg(e?.message || 'Terjadi kesalahan');
    }
  };

  const saveBulk = async () => {
    await runAction(async () => {
      const parsed = JSON.parse(bulkJson);
      if (!Array.isArray(parsed) || parsed.length === 0) throw new Error('Bulk JSON harus array');
      await apiPut('/api/system/saas-metrics', { currency, months: parsed });
      setMsg(`Bulk tersimpan: ${parsed.length} bulan`);
      await load();
    });
  };

  const exportCsv = async () => {
    await runAction(async () => {
      const res = await fetch(`${getApiBaseUrl()}/api/system/saas-investor-report?format=csv`, { credentials: 'include' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `saas-investor-report-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      setMsg('CSV report terunduh');
    });
  };

  const exportPdf = async () => {
    await runAction(async () => {
      const url = `${getApiBaseUrl()}/api/system/saas-investor-report?format=html`;
      const w = window.open(url, '_blank', 'noopener,noreferrer');
      if (!w) throw new Error('Popup diblokir browser');
      setMsg('Report HTML dibuka. Gunakan Print -> Save as PDF.');
    });
  };

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-lg font-bold">SaaS Metrics (Investor View)</h1>
      {msg ? <div className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2">{msg}</div> : null}

      <div className="grid sm:grid-cols-3 gap-2">
        <div className="bg-white border rounded-2xl p-3"><div className="text-xs text-zinc-500">MRR</div><div className="text-sm font-bold">{money.format(Number(summary?.mrr || 0))}</div></div>
        <div className="bg-white border rounded-2xl p-3"><div className="text-xs text-zinc-500">ARR</div><div className="text-sm font-bold">{money.format(Number(summary?.arr || 0))}</div></div>
        <div className="bg-white border rounded-2xl p-3"><div className="text-xs text-zinc-500">Net New MRR</div><div className="text-sm font-bold">{money.format(Number(summary?.netNewMrr || 0))}</div></div>
        <div className="bg-white border rounded-2xl p-3"><div className="text-xs text-zinc-500">NRR</div><div className="text-sm font-bold">{Number(summary?.nrrPct || 0)}%</div></div>
        <div className="bg-white border rounded-2xl p-3"><div className="text-xs text-zinc-500">GRR</div><div className="text-sm font-bold">{Number(summary?.grrPct || 0)}%</div></div>
        <div className="bg-white border rounded-2xl p-3"><div className="text-xs text-zinc-500">Burn</div><div className="text-sm font-bold">{money.format(Number(summary?.burn || 0))}</div></div>
      </div>

      <div className="bg-white border rounded-2xl p-3 space-y-2">
        <div className="text-sm font-semibold">Input Bulanan</div>
        <div className="grid sm:grid-cols-4 gap-2">
          <input className="border rounded-xl px-3 py-2 text-xs" placeholder="YYYY-MM" value={form.month} onChange={(e) => setForm((p) => ({ ...p, month: e.target.value }))} />
          <input type="number" className="border rounded-xl px-3 py-2 text-xs" placeholder="Starting MRR" value={form.startingMrr} onChange={(e) => setForm((p) => ({ ...p, startingMrr: Number(e.target.value || 0) }))} />
          <input type="number" className="border rounded-xl px-3 py-2 text-xs" placeholder="New MRR" value={form.newMrr} onChange={(e) => setForm((p) => ({ ...p, newMrr: Number(e.target.value || 0) }))} />
          <input type="number" className="border rounded-xl px-3 py-2 text-xs" placeholder="Expansion MRR" value={form.expansionMrr} onChange={(e) => setForm((p) => ({ ...p, expansionMrr: Number(e.target.value || 0) }))} />
          <input type="number" className="border rounded-xl px-3 py-2 text-xs" placeholder="Contraction MRR" value={form.contractionMrr} onChange={(e) => setForm((p) => ({ ...p, contractionMrr: Number(e.target.value || 0) }))} />
          <input type="number" className="border rounded-xl px-3 py-2 text-xs" placeholder="Churned MRR" value={form.churnedMrr} onChange={(e) => setForm((p) => ({ ...p, churnedMrr: Number(e.target.value || 0) }))} />
          <input type="number" className="border rounded-xl px-3 py-2 text-xs" placeholder="Reactivation MRR" value={form.reactivationMrr} onChange={(e) => setForm((p) => ({ ...p, reactivationMrr: Number(e.target.value || 0) }))} />
          <input type="number" className="border rounded-xl px-3 py-2 text-xs" placeholder="Active Start" value={form.activeCustomersStart} onChange={(e) => setForm((p) => ({ ...p, activeCustomersStart: Number(e.target.value || 0) }))} />
          <input type="number" className="border rounded-xl px-3 py-2 text-xs" placeholder="New Cust" value={form.newCustomers} onChange={(e) => setForm((p) => ({ ...p, newCustomers: Number(e.target.value || 0) }))} />
          <input type="number" className="border rounded-xl px-3 py-2 text-xs" placeholder="Churn Cust" value={form.churnedCustomers} onChange={(e) => setForm((p) => ({ ...p, churnedCustomers: Number(e.target.value || 0) }))} />
          <input type="number" className="border rounded-xl px-3 py-2 text-xs" placeholder="COGS" value={form.cogs} onChange={(e) => setForm((p) => ({ ...p, cogs: Number(e.target.value || 0) }))} />
          <input type="number" className="border rounded-xl px-3 py-2 text-xs" placeholder="OPEX" value={form.opex} onChange={(e) => setForm((p) => ({ ...p, opex: Number(e.target.value || 0) }))} />
        </div>
        <div className="flex gap-2">
          <button className="border rounded-xl h-9 w-9 inline-flex items-center justify-center text-xs" title="Upsert bulan" onClick={() => void runAction(async () => {
            await apiPost('/api/system/saas-metrics/month', form);
            setMsg('Data bulan tersimpan');
            await load();
          })}>💾</button>
          <button className="border rounded-xl h-9 w-9 inline-flex items-center justify-center text-xs" title="Refresh" onClick={() => void load()}>↻</button>
          <button className="border rounded-xl h-9 w-9 inline-flex items-center justify-center text-xs" title="Rebuild metrics dari contracts" onClick={() => void runAction(async () => {
            await apiPost('/api/system/saas-metrics/rebuild-from-contracts?monthsBack=12', {});
            setMsg('Metrics berhasil di-rebuild dari contracts');
            await load();
          })}>⟳</button>
          <button className="border rounded-xl h-9 w-9 inline-flex items-center justify-center text-xs" title="Export CSV investor report" onClick={() => void exportCsv()}>⬇</button>
          <button className="border rounded-xl h-9 w-9 inline-flex items-center justify-center text-xs" title="Open report untuk Print PDF" onClick={() => void exportPdf()}>🖨</button>
        </div>
      </div>

      <div className="bg-white border rounded-2xl p-3 space-y-2 text-xs">
        <div className="font-semibold">Bulk JSON Execute</div>
        <textarea className="w-full min-h-40 border rounded-xl px-3 py-2 font-mono text-[11px]" value={bulkJson} onChange={(e) => setBulkJson(e.target.value)} />
        <button className="border rounded-xl h-9 w-9 inline-flex items-center justify-center text-xs" title="Simpan bulk JSON SaaS metrics" onClick={() => void saveBulk()}>⚡</button>
      </div>

      <div className="bg-white border rounded-2xl p-3 space-y-2">
        <div className="text-sm font-semibold">Riwayat Bulanan</div>
        {months.length === 0 ? <div className="text-xs text-zinc-500">Belum ada data.</div> : null}
        {[...months].sort((a, b) => String(b.month).localeCompare(String(a.month))).map((x) => {
          const ending = Number(x.startingMrr || 0) + Number(x.newMrr || 0) + Number(x.expansionMrr || 0) + Number(x.reactivationMrr || 0) - Number(x.contractionMrr || 0) - Number(x.churnedMrr || 0);
          return (
            <div key={x.month} className="border rounded-xl p-3 text-xs space-y-1">
              <div className="font-semibold">{x.month}</div>
              <div className="text-zinc-600">Start MRR: {money.format(Number(x.startingMrr || 0))}</div>
              <div className="text-zinc-600">End MRR: {money.format(Math.max(0, ending))}</div>
              <div className="text-zinc-600">New/Expansion/Reactivation: {money.format(Number(x.newMrr || 0))} / {money.format(Number(x.expansionMrr || 0))} / {money.format(Number(x.reactivationMrr || 0))}</div>
              <div className="text-zinc-600">Contraction/Churn: {money.format(Number(x.contractionMrr || 0))} / {money.format(Number(x.churnedMrr || 0))}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
