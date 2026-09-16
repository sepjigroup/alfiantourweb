'use client';

import { useEffect, useMemo, useState } from 'react';
import { apiGet, apiPost, apiPut } from '@/lib/api-client';
import TravelOpsNav from '../TravelOpsNav';
import { downloadCsv } from '../_lib';

export default function TravelOpsDeparturePage() {
  const [rows, setRows] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [msg, setMsg] = useState('');
  const [bulkJson, setBulkJson] = useState(`[
  { "departureDate": "2026-06-01T00:00:00.000Z", "status": "planning" }
]`);

  const load = async () => {
    try {
      const res = await apiGet<any>('/api/TravelOps/departure/operations');
      setRows(res.data ?? []);
    } catch (e: any) {
      setMsg(e?.message || 'Gagal memuat departure ops');
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
        await apiPost('/api/TravelOps/departure/operations', { departureDate: row?.departureDate ?? new Date().toISOString(), status: row?.status ?? 'planning' });
      }
      setMsg(`Bulk departure berhasil: ${parsed.length}`);
      await load();
    });
  };

  const filtered = useMemo(() => rows.filter((x) => statusFilter === 'all' ? true : String(x.status) === statusFilter), [rows, statusFilter]);

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-lg font-bold">TravelOps • Departure Operations</h1>
      <TravelOpsNav />
      {msg ? <div className="text-xs text-emerald-700">{msg}</div> : null}
      <div className="bg-white border rounded-2xl p-3 flex flex-wrap gap-2">
        <button className="border rounded-xl h-9 w-9 inline-flex items-center justify-center text-xs" title="Tambah departure" onClick={() => void runAction(async () => { await apiPost('/api/TravelOps/departure/operations', { departureDate: new Date().toISOString(), status: 'planning' }); await load(); })}>＋</button>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="border rounded-xl px-3 py-2 text-xs">
          <option value="all">Semua Status</option>
          <option value="planning">planning</option>
          <option value="ready">ready</option>
          <option value="departed">departed</option>
          <option value="closed">closed</option>
        </select>
        <button className="border rounded-xl px-3 py-2 text-xs" onClick={() => downloadCsv('travelops-departure.csv', ['Id', 'Program', 'DepartureDate', 'Status', 'Manifest', 'Rooming', 'Docs'], filtered.map((x) => [x.id, x.programSlugSnapshot || '', x.departureDate || '', x.status || '', x.manifestCount || 0, x.roomingListCount || 0, x.documentsCompletedCount || 0]))}>Export CSV</button>
      </div>
      <div className="bg-white border rounded-2xl p-3 space-y-2 text-xs">
        <div className="font-semibold">Bulk JSON Execute</div>
        <textarea className="w-full min-h-24 border rounded-xl px-3 py-2 font-mono text-[11px]" value={bulkJson} onChange={(e) => setBulkJson(e.target.value)} />
        <button className="border rounded-xl h-9 w-9 inline-flex items-center justify-center" title="Execute bulk departure" onClick={() => void runBulk()}>⚡</button>
      </div>
      <div className="space-y-2">
        {filtered.map((x) => (
          <div key={x.id} className="bg-white border rounded-2xl p-3 text-xs space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div className="font-semibold">#{x.id} {x.programSlugSnapshot || '-'}</div>
              <div>{x.status}</div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-lg border p-2"><div className="text-zinc-500">Tanggal</div><div>{String(x.departureDate || '').slice(0, 10)}</div></div>
              <div className="rounded-lg border p-2"><div className="text-zinc-500">Manifest</div><div>{x.manifestCount}</div></div>
              <div className="rounded-lg border p-2"><div className="text-zinc-500">Rooming</div><div>{x.roomingListCount}</div></div>
              <div className="rounded-lg border p-2"><div className="text-zinc-500">Docs</div><div>{x.documentsCompletedCount}</div></div>
            </div>
            <button className="border rounded-lg h-8 w-8 inline-flex items-center justify-center" title="Set ready" onClick={() => void runAction(async () => { await apiPut(`/api/TravelOps/departure/operations/${x.id}/status`, { status: 'ready' }); await load(); })}>✓</button>
          </div>
        ))}
      </div>
    </div>
  );
}
