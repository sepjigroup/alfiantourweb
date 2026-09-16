'use client';

import { useEffect, useMemo, useState } from 'react';
import { apiGet, apiPost } from '@/lib/api-client';
import TravelOpsNav from '../TravelOpsNav';
import { downloadCsv, toRupiah } from '../_lib';

export default function TravelOpsSupplierPage() {
  const [rows, setRows] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [msg, setMsg] = useState('');
  const [bulkJson, setBulkJson] = useState(`[
  { "supplierType": "hotel", "supplierName": "Hotel Partner A", "status": "active" }
]`);

  const load = async () => {
    try {
      const res = await apiGet<any>('/api/TravelOps/supplier/contracts');
      setRows(res.data ?? []);
    } catch (e: any) {
      setMsg(e?.message || 'Gagal memuat supplier ops');
    }
  };
  useEffect(() => { void load(); }, []);
  const runAction = async (action: () => Promise<void>) => {
    try { await action(); } catch (e: any) { setMsg(e?.message || 'Terjadi kesalahan saat memproses permintaan'); }
  };
  const runBulk = async () => {
    await runAction(async () => {
      const parsed = JSON.parse(bulkJson);
      if (!Array.isArray(parsed) || parsed.length === 0) throw new Error('Bulk JSON harus array');
      for (const row of parsed) {
        await apiPost('/api/TravelOps/supplier/contracts', {
          supplierType: row?.supplierType ?? 'hotel',
          supplierName: row?.supplierName ?? `Supplier ${Date.now()}`,
          contractNo: row?.contractNo ?? '',
          effectiveDate: row?.effectiveDate ?? new Date().toISOString(),
          expiryDate: row?.expiryDate ?? null,
          allotmentTotal: Number(row?.allotmentTotal ?? 0),
          allotmentUsed: Number(row?.allotmentUsed ?? 0),
          unitCost: Number(row?.unitCost ?? 0),
          penaltyCost: Number(row?.penaltyCost ?? 0),
          status: row?.status ?? 'active',
          notes: row?.notes ?? '',
        });
      }
      setMsg(`Bulk kontrak berhasil: ${parsed.length}`);
      await load();
    });
  };

  const filtered = useMemo(() => rows.filter((x) => `${x.supplierName || ''} ${x.contractNo || ''}`.toLowerCase().includes(search.toLowerCase())), [rows, search]);

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-lg font-bold">TravelOps • Supplier Ops</h1>
      <TravelOpsNav />
      {msg ? <div className="text-xs text-emerald-700">{msg}</div> : null}
      <div className="bg-white border rounded-2xl p-3 flex flex-wrap gap-2">
        <input className="border rounded-xl px-3 py-2 text-xs" placeholder="Cari supplier/contract no" value={search} onChange={(e) => setSearch(e.target.value)} />
        <button className="border rounded-xl h-9 w-9 inline-flex items-center justify-center text-xs" title="Tambah kontrak" onClick={() => void runAction(async () => { await apiPost('/api/TravelOps/supplier/contracts', { supplierType: 'hotel', supplierName: `Hotel Supplier ${Date.now()}`, effectiveDate: new Date().toISOString(), allotmentTotal: 0, allotmentUsed: 0, unitCost: 0, penaltyCost: 0, status: 'active' }); await load(); })}>＋</button>
        <button className="border rounded-xl px-3 py-2 text-xs" onClick={() => downloadCsv('travelops-suppliers.csv', ['SupplierType', 'SupplierName', 'ContractNo', 'AllotmentTotal', 'AllotmentUsed', 'UnitCost', 'Status'], filtered.map((x) => [x.supplierType, x.supplierName, x.contractNo || '', x.allotmentTotal || 0, x.allotmentUsed || 0, x.unitCost || 0, x.status || '']))}>Export CSV</button>
      </div>
      <div className="bg-white border rounded-2xl p-3 space-y-2 text-xs">
        <div className="font-semibold">Bulk JSON Execute</div>
        <textarea className="w-full min-h-24 border rounded-xl px-3 py-2 font-mono text-[11px]" value={bulkJson} onChange={(e) => setBulkJson(e.target.value)} />
        <button className="border rounded-xl h-9 w-9 inline-flex items-center justify-center" title="Execute bulk supplier contracts" onClick={() => void runBulk()}>⚡</button>
      </div>
      <div className="space-y-2">
        {filtered.map((x) => (
          <div key={x.id} className="bg-white border rounded-2xl p-3 text-xs space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div className="font-semibold">{x.supplierName}</div>
              <div>{x.status || '-'}</div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-lg border p-2"><div className="text-zinc-500">Type</div><div>{x.supplierType}</div></div>
              <div className="rounded-lg border p-2"><div className="text-zinc-500">Contract</div><div>{x.contractNo || '-'}</div></div>
              <div className="rounded-lg border p-2"><div className="text-zinc-500">Allotment</div><div>{x.allotmentUsed || 0}/{x.allotmentTotal || 0}</div></div>
              <div className="rounded-lg border p-2"><div className="text-zinc-500">Unit Cost</div><div>{toRupiah(Number(x.unitCost || 0))}</div></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
