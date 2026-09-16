'use client';

import { useEffect, useState } from 'react';
import { apiGet, apiPost } from '@/lib/api-client';
import TravelGeneralNav from '../TravelGeneralNav';

export default function TravelGeneralSuppliersPage() {
  const [rows, setRows] = useState<any[]>([]);
  const [msg, setMsg] = useState('');
  const [form, setForm] = useState<any>({ name: '', description: '', supplierType: 'hotel', country: '', city: '', contractNo: '', currencyCode: 'IDR', netRate: 0 });
  const [bulkJson, setBulkJson] = useState(`[
  {
    "name": "Hotel Makkah Partner A",
    "supplierType": "hotel",
    "country": "Saudi Arabia",
    "city": "Makkah",
    "currencyCode": "SAR",
    "netRate": 500
  }
]`);

  const load = async () => {
    try {
      const res = await apiGet<any>('/api/TravelGeneral/suppliers');
      setRows(res.data?.items ?? []);
    } catch (e: any) {
      setMsg(e?.message || 'Gagal load suppliers');
    }
  };
  useEffect(() => { void load(); }, []);

  const runBulk = async () => {
    try {
      const parsed = JSON.parse(bulkJson);
      if (!Array.isArray(parsed) || parsed.length === 0) throw new Error('Bulk JSON harus array dan tidak boleh kosong');
      for (const row of parsed) {
        await apiPost('/api/TravelGeneral/suppliers', {
          name: row?.name ?? '',
          description: row?.description ?? '',
          supplierType: row?.supplierType ?? 'hotel',
          country: row?.country ?? '',
          city: row?.city ?? '',
          contractNo: row?.contractNo ?? '',
          currencyCode: row?.currencyCode ?? 'IDR',
          netRate: Number(row?.netRate ?? 0),
        });
      }
      setMsg(`Bulk supplier berhasil: ${parsed.length}`);
      await load();
    } catch (e: any) {
      setMsg(e?.message || 'Gagal bulk import supplier');
    }
  };

  return (
    <div className="p-4 space-y-4 animate-fade-up">
      <div className="bg-white border rounded-3xl p-5">
        <h1 className="text-lg font-extrabold g-text">Supplier & Allotment</h1>
        <p className="text-xs text-zinc-500 mt-1">Supplier terpisah untuk travel umum.</p>
      </div>
      <TravelGeneralNav />
      {msg ? <div className="text-xs text-red-600">{msg}</div> : null}
      <div className="bg-white border rounded-3xl p-5 text-xs space-y-2">
        <div className="grid grid-cols-2 gap-2">
          <input className="border rounded-xl px-3 py-2" placeholder="Nama supplier" value={form.name} onChange={(e) => setForm((p: any) => ({ ...p, name: e.target.value }))} />
          <select className="border rounded-xl px-3 py-2" value={form.supplierType} onChange={(e) => setForm((p: any) => ({ ...p, supplierType: e.target.value }))}>
            <option value="hotel">hotel</option><option value="airline">airline</option><option value="transport">transport</option><option value="activity">activity</option>
          </select>
          <input className="border rounded-xl px-3 py-2" placeholder="Negara" value={form.country} onChange={(e) => setForm((p: any) => ({ ...p, country: e.target.value }))} />
          <input className="border rounded-xl px-3 py-2" placeholder="Kota" value={form.city} onChange={(e) => setForm((p: any) => ({ ...p, city: e.target.value }))} />
          <input className="border rounded-xl px-3 py-2" placeholder="No Kontrak" value={form.contractNo} onChange={(e) => setForm((p: any) => ({ ...p, contractNo: e.target.value }))} />
          <input className="border rounded-xl px-3 py-2" type="number" placeholder="Net rate" value={form.netRate} onChange={(e) => setForm((p: any) => ({ ...p, netRate: Number(e.target.value || 0) }))} />
        </div>
        <button className="rounded-xl bg-zinc-900 text-white h-9 w-9 inline-flex items-center justify-center font-semibold" title="Simpan supplier" onClick={async () => { try { await apiPost('/api/TravelGeneral/suppliers', form); setMsg('Supplier tersimpan'); setForm({ ...form, name: '', country: '', city: '', contractNo: '', netRate: 0 }); await load(); } catch (e: any) { setMsg(e?.message || 'Gagal simpan supplier'); } }}>💾</button>
      </div>
      <div className="bg-white border rounded-3xl p-5 text-xs space-y-2">
        <div className="font-semibold">Bulk JSON Execute</div>
        <textarea className="w-full min-h-36 border rounded-xl px-3 py-2 font-mono text-[11px]" value={bulkJson} onChange={(e) => setBulkJson(e.target.value)} />
        <button className="border rounded-xl h-9 w-9 inline-flex items-center justify-center" title="Execute bulk JSON supplier" onClick={() => void runBulk()}>⚡</button>
      </div>
      <div className="bg-white border rounded-3xl p-5 text-xs space-y-2">
        {(rows || []).map((x) => (
          <div key={x.id} className="rounded-xl border px-3 py-2">
            <div className="font-semibold">{x.name}</div>
            <div className="text-zinc-500">{x.supplierType} • {x.country || '-'}, {x.city || '-'} • {x.currencyCode} {x.netRate}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
