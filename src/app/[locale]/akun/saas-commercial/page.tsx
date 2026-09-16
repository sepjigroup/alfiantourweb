'use client';

import { useEffect, useMemo, useState } from 'react';
import { apiGet, apiPost, apiPut } from '@/lib/api-client';

export default function SaasCommercialPage() {
  const [currency, setCurrency] = useState('IDR');
  const [plans, setPlans] = useState<any[]>([]);
  const [contracts, setContracts] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [msg, setMsg] = useState('');
  const [alerts, setAlerts] = useState<any>(null);
  const [planJson, setPlanJson] = useState(`[
  { "planCode": "STARTER", "planName": "Starter", "billingCycle": "monthly", "monthlyPrice": 1500000, "annualPrice": 15000000, "includedSeats": 3, "extraSeatPrice": 150000, "isActive": true, "features": ["Core Ops", "Basic CRM"] },
  { "planCode": "GROWTH", "planName": "Growth", "billingCycle": "monthly", "monthlyPrice": 3500000, "annualPrice": 35000000, "includedSeats": 10, "extraSeatPrice": 125000, "isActive": true, "features": ["Core Ops", "CRM", "Inventory", "Finance"] }
]`);
  const [contractJson, setContractJson] = useState(`[
  { "contractId": "CTR-ALFA-001", "customerName": "PT Mitra Umrah Jaya", "planCode": "GROWTH", "billingCycle": "monthly", "status": "active", "startDate": "2026-05-01T00:00:00Z", "monthlyAmount": 3500000, "seats": 12, "extraSeatAmount": 250000, "addOnAmount": 500000, "outstandingAmount": 0, "nextBillingDate": "2026-06-01T00:00:00Z", "lastPaymentDate": "2026-05-01T00:00:00Z", "notes": "Add-on WhatsApp automation" },
  { "contractId": "CTR-ALFA-002", "customerName": "CV Barokah Haji", "planCode": "STARTER", "billingCycle": "monthly", "status": "past_due", "startDate": "2026-03-01T00:00:00Z", "monthlyAmount": 1500000, "seats": 3, "extraSeatAmount": 0, "addOnAmount": 0, "outstandingAmount": 1500000, "nextBillingDate": "2026-04-01T00:00:00Z", "lastPaymentDate": "2026-03-01T00:00:00Z" }
]`);

  const load = async () => {
    try {
      const [p, c, a] = await Promise.all([
        apiGet<any>('/api/system/saas-pricing'),
        apiGet<any>('/api/system/saas-contracts'),
        apiGet<any>('/api/system/saas-alerts?overdueDays=7'),
      ]);
      const pricing = p?.data ?? {};
      const contractData = c?.data ?? {};
      setCurrency(String(pricing.currency || contractData.currency || 'IDR'));
      setPlans(Array.isArray(pricing.plans) ? pricing.plans : []);
      setContracts(Array.isArray(contractData.contracts) ? contractData.contracts : []);
      setSummary(contractData.summary ?? null);
      setAlerts(a?.data ?? null);
    } catch (e: any) {
      setMsg(e?.message || 'Gagal memuat SaaS commercial');
    }
  };

  useEffect(() => { void load(); }, []);

  const money = useMemo(() => new Intl.NumberFormat('id-ID', { style: 'currency', currency: currency || 'IDR', maximumFractionDigits: 0 }), [currency]);

  const runAction = async (action: () => Promise<void>) => {
    try { await action(); } catch (e: any) { setMsg(e?.message || 'Terjadi kesalahan'); }
  };

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-lg font-bold">SaaS Commercial (Plans & Contracts)</h1>
      {msg ? <div className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2">{msg}</div> : null}

      <div className="grid sm:grid-cols-4 gap-2">
        <div className="bg-white border rounded-2xl p-3"><div className="text-xs text-zinc-500">Active Contracts</div><div className="text-sm font-bold">{Number(summary?.activeContracts || 0)}</div></div>
        <div className="bg-white border rounded-2xl p-3"><div className="text-xs text-zinc-500">MRR</div><div className="text-sm font-bold">{money.format(Number(summary?.mrr || 0))}</div></div>
        <div className="bg-white border rounded-2xl p-3"><div className="text-xs text-zinc-500">ARR</div><div className="text-sm font-bold">{money.format(Number(summary?.arr || 0))}</div></div>
        <div className="bg-white border rounded-2xl p-3"><div className="text-xs text-zinc-500">ARPA</div><div className="text-sm font-bold">{money.format(Number(summary?.arpa || 0))}</div></div>
        <div className="bg-white border rounded-2xl p-3"><div className="text-xs text-zinc-500">Past Due 0-30</div><div className="text-sm font-bold">{Number(summary?.aging?.d0_30 || 0)}</div></div>
        <div className="bg-white border rounded-2xl p-3"><div className="text-xs text-zinc-500">Past Due 31-60</div><div className="text-sm font-bold">{Number(summary?.aging?.d31_60 || 0)}</div></div>
        <div className="bg-white border rounded-2xl p-3"><div className="text-xs text-zinc-500">Past Due 61-90</div><div className="text-sm font-bold">{Number(summary?.aging?.d61_90 || 0)}</div></div>
        <div className="bg-white border rounded-2xl p-3"><div className="text-xs text-zinc-500">Overdue Amount</div><div className="text-sm font-bold">{money.format(Number(summary?.aging?.overdueAmount || 0))}</div></div>
      </div>
      <div className="bg-white border rounded-2xl p-3 text-xs text-zinc-600">
        Lifecycle status yang didukung: <span className="font-mono">trial</span>, <span className="font-mono">active</span>, <span className="font-mono">past_due</span>, <span className="font-mono">paused</span>, <span className="font-mono">cancelled</span>.
      </div>
      <div className="bg-white border rounded-2xl p-3 space-y-2">
        <div className="text-sm font-semibold">Aksi Finance SaaS</div>
        <div className="flex gap-2">
          <button className="border rounded-xl h-9 w-9 inline-flex items-center justify-center" title="Sync kontrak ke ledger bulan ini" onClick={() => void runAction(async () => {
            await apiPost('/api/system/saas-contracts/sync-ledger', {});
            setMsg('Sync ledger selesai');
          })}>🧾</button>
          <button className="border rounded-xl h-9 w-9 inline-flex items-center justify-center" title="Refresh alerts" onClick={() => void load()}>↻</button>
        </div>
        <div className="text-xs text-zinc-600">Overdue: {Number(alerts?.overdueCount || 0)} | Expiring 30 hari: {Number(alerts?.expiringCount || 0)}</div>
      </div>

      <div className="bg-white border rounded-2xl p-3 space-y-2">
        <div className="text-sm font-semibold">Pricing Plans (Bulk JSON)</div>
        <textarea className="w-full min-h-40 border rounded-xl px-3 py-2 font-mono text-[11px]" value={planJson} onChange={(e) => setPlanJson(e.target.value)} />
        <div className="flex gap-2">
          <button className="border rounded-xl h-9 w-9 inline-flex items-center justify-center" title="Simpan pricing plans" onClick={() => void runAction(async () => {
            const parsed = JSON.parse(planJson);
            if (!Array.isArray(parsed)) throw new Error('Plan JSON harus array');
            await apiPut('/api/system/saas-pricing', { currency, plans: parsed });
            setMsg(`Pricing tersimpan: ${parsed.length} plan`);
            await load();
          })}>💾</button>
          <button className="border rounded-xl h-9 w-9 inline-flex items-center justify-center" title="Refresh" onClick={() => void load()}>↻</button>
        </div>
        <div className="space-y-2">
          {plans.map((x) => (
            <div key={x.planCode} className="border rounded-xl p-3 text-xs space-y-1">
              <div className="font-semibold">{x.planName} ({x.planCode})</div>
              <div className="text-zinc-600">Monthly: {money.format(Number(x.monthlyPrice || 0))} | Annual: {money.format(Number(x.annualPrice || 0))}</div>
              <div className="text-zinc-600">Seats: {x.includedSeats} | Extra Seat: {money.format(Number(x.extraSeatPrice || 0))}</div>
              <div className="text-zinc-600">Status: {x.isActive ? 'active' : 'inactive'}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white border rounded-2xl p-3 space-y-2">
        <div className="text-sm font-semibold">Subscription Contracts (Bulk JSON)</div>
        <textarea className="w-full min-h-40 border rounded-xl px-3 py-2 font-mono text-[11px]" value={contractJson} onChange={(e) => setContractJson(e.target.value)} />
        <button className="border rounded-xl h-9 w-9 inline-flex items-center justify-center" title="Simpan contracts" onClick={() => void runAction(async () => {
          const parsed = JSON.parse(contractJson);
          if (!Array.isArray(parsed)) throw new Error('Contract JSON harus array');
          await apiPut('/api/system/saas-contracts', { currency, contracts: parsed });
          setMsg(`Contracts tersimpan: ${parsed.length}`);
          await load();
        })}>⚡</button>
        <div className="space-y-2">
          {contracts.map((x) => (
            <div key={x.contractId} className="border rounded-xl p-3 text-xs space-y-1">
              <div className="font-semibold">{x.customerName}</div>
              <div className="text-zinc-600">Contract: {x.contractId} | Plan: {x.planCode}</div>
              <div className="text-zinc-600">Monthly: {money.format(Number(x.monthlyAmount || 0))} | Extra: {money.format(Number(x.extraSeatAmount || 0))} | Add-on: {money.format(Number(x.addOnAmount || 0))}</div>
              <div className="text-zinc-600">Status: {x.status} | Seats: {x.seats}</div>
              <div className="text-zinc-600">Outstanding: {money.format(Number(x.outstandingAmount || 0))} | Next Billing: {x.nextBillingDate ? new Date(x.nextBillingDate).toLocaleDateString('id-ID') : '-'}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
