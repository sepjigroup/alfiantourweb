'use client';

import { useEffect, useState } from 'react';
import { apiGet, apiPost } from '@/lib/api-client';
import TravelGeneralNav from '../TravelGeneralNav';

export default function TravelGeneralPricingPage() {
  const [rows, setRows] = useState<any[]>([]);
  const [msg, setMsg] = useState('');
  const [form, setForm] = useState<any>({ currencyCode: 'USD', rateToIdr: 0, effectiveDate: new Date().toISOString().slice(0, 10), note: '' });

  const load = async () => {
    try {
      const res = await apiGet<any>('/api/TravelGeneral/exchange-rates');
      setRows(res.data?.items ?? []);
    } catch (e: any) {
      setMsg(e?.message || 'Gagal load kurs');
    }
  };
  useEffect(() => { void load(); }, []);

  return (
    <div className="p-4 space-y-4 animate-fade-up">
      <div className="bg-white border rounded-3xl p-5">
        <h1 className="text-lg font-extrabold g-text">Pricing, Kurs, Pajak</h1>
        <p className="text-xs text-zinc-500 mt-1">Kurs khusus travel umum (IDR baseline).</p>
      </div>
      <TravelGeneralNav />
      {msg ? <div className="text-xs text-red-600">{msg}</div> : null}
      <div className="bg-white border rounded-3xl p-5 text-xs space-y-2">
        <div className="grid grid-cols-2 gap-2">
          <input className="border rounded-xl px-3 py-2" placeholder="Currency" value={form.currencyCode} onChange={(e) => setForm((p: any) => ({ ...p, currencyCode: e.target.value.toUpperCase() }))} />
          <input className="border rounded-xl px-3 py-2" type="number" placeholder="Rate to IDR" value={form.rateToIdr} onChange={(e) => setForm((p: any) => ({ ...p, rateToIdr: Number(e.target.value || 0) }))} />
          <input className="border rounded-xl px-3 py-2" type="date" value={form.effectiveDate} onChange={(e) => setForm((p: any) => ({ ...p, effectiveDate: e.target.value }))} />
          <input className="border rounded-xl px-3 py-2" placeholder="Note" value={form.note} onChange={(e) => setForm((p: any) => ({ ...p, note: e.target.value }))} />
        </div>
        <button className="rounded-xl bg-zinc-900 text-white px-4 py-2 font-semibold" onClick={async () => { try { await apiPost('/api/TravelGeneral/exchange-rates', form); setMsg('Kurs tersimpan'); await load(); } catch (e: any) { setMsg(e?.message || 'Gagal simpan kurs'); } }}>Simpan Kurs</button>
      </div>
      <div className="bg-white border rounded-3xl p-5 text-xs space-y-2">
        {(rows || []).map((x) => (
          <div key={x.id} className="rounded-xl border px-3 py-2">
            <div className="font-semibold">{x.currencyCode} {'->'} IDR {x.rateToIdr}</div>
            <div className="text-zinc-500">{String(x.effectiveDate || '').slice(0, 10)} • {x.note || '-'}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
