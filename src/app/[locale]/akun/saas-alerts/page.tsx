'use client';

import { useEffect, useState } from 'react';
import { apiGet, apiPost } from '@/lib/api-client';

export default function SaasAlertsPage() {
  const [data, setData] = useState<any>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [msg, setMsg] = useState('');
  const [days, setDays] = useState('7');
  const [note, setNote] = useState('Follow-up by finance team');

  const load = async () => {
    try {
      const res = await apiGet<any>(`/api/system/saas-alerts?overdueDays=${Number(days || 7)}`);
      setData(res?.data ?? null);
      const lg = await apiGet<any>('/api/system/saas-audit-logs?pageSize=30');
      setLogs(Array.isArray(lg?.data) ? lg.data : []);
    } catch (e: any) {
      setMsg(e?.message || 'Gagal memuat alerts');
    }
  };

  useEffect(() => { void load(); }, []);

  const runAction = async (fn: () => Promise<void>) => {
    try { await fn(); } catch (e: any) { setMsg(e?.message || 'Terjadi kesalahan'); }
  };

  const apply = async (contractId: string, action: string) => {
    await runAction(async () => {
      await apiPost(`/api/system/saas-contracts/${encodeURIComponent(contractId)}/action`, { action, note });
      setMsg(`Action ${action} tersimpan untuk ${contractId}`);
      await load();
    });
  };

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-lg font-bold">SaaS Alerts & Follow-up</h1>
      {msg ? <div className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2">{msg}</div> : null}

      <div className="bg-white border rounded-2xl p-3 space-y-2">
        <div className="text-sm font-semibold">Filter Alert</div>
        <div className="grid sm:grid-cols-3 gap-2">
          <input className="border rounded-xl px-3 py-2 text-xs" value={days} onChange={(e) => setDays(e.target.value)} placeholder="Overdue days threshold" />
          <input className="border rounded-xl px-3 py-2 text-xs" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Catatan action" />
          <button className="border rounded-xl h-9 w-9 inline-flex items-center justify-center" title="Refresh alerts" onClick={() => void load()}>↻</button>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-2">
        <div className="bg-white border rounded-2xl p-3"><div className="text-xs text-zinc-500">Overdue</div><div className="text-sm font-bold">{Number(data?.overdueCount || 0)}</div></div>
        <div className="bg-white border rounded-2xl p-3"><div className="text-xs text-zinc-500">Expiring 30 hari</div><div className="text-sm font-bold">{Number(data?.expiringCount || 0)}</div></div>
      </div>

      <div className="bg-white border rounded-2xl p-3 space-y-2">
        <div className="text-sm font-semibold">Overdue Contracts</div>
        {Array.isArray(data?.overdue) && data.overdue.length === 0 ? <div className="text-xs text-zinc-500">Tidak ada overdue.</div> : null}
        {(data?.overdue ?? []).map((x: any) => (
          <div key={x.contractId} className="border rounded-xl p-3 text-xs space-y-1">
            <div className="font-semibold">{x.customerName}</div>
            <div className="text-zinc-600">Contract: {x.contractId} | Status: {x.status}</div>
            <div className="text-zinc-600">Outstanding: {Number(x.outstandingAmount || 0).toLocaleString('id-ID')} | Overdue: {x.overdueDays} hari</div>
            <div className="flex gap-1">
              <button className="border rounded h-8 w-8 inline-flex items-center justify-center" title="Mark Paid" onClick={() => void apply(x.contractId, 'mark_paid')}>✓</button>
              <button className="border rounded h-8 w-8 inline-flex items-center justify-center" title="Set Past Due" onClick={() => void apply(x.contractId, 'set_past_due')}>!</button>
              <button className="border rounded h-8 w-8 inline-flex items-center justify-center" title="Pause" onClick={() => void apply(x.contractId, 'pause')}>⏸</button>
              <button className="border rounded h-8 w-8 inline-flex items-center justify-center" title="Cancel" onClick={() => void apply(x.contractId, 'cancel')}>✕</button>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white border rounded-2xl p-3 space-y-2">
        <div className="text-sm font-semibold">Expiring Contracts</div>
        {Array.isArray(data?.expiring) && data.expiring.length === 0 ? <div className="text-xs text-zinc-500">Tidak ada kontrak akan berakhir.</div> : null}
        {(data?.expiring ?? []).map((x: any) => (
          <div key={x.contractId} className="border rounded-xl p-3 text-xs space-y-1">
            <div className="font-semibold">{x.customerName}</div>
            <div className="text-zinc-600">Contract: {x.contractId} | Status: {x.status}</div>
            <div className="text-zinc-600">End Date: {x.endDate ? new Date(x.endDate).toLocaleDateString('id-ID') : '-'}</div>
            <div className="flex gap-1">
              <button className="border rounded h-8 w-8 inline-flex items-center justify-center" title="Renew" onClick={() => void apply(x.contractId, 'renew')}>↻</button>
              <button className="border rounded h-8 w-8 inline-flex items-center justify-center" title="Pause" onClick={() => void apply(x.contractId, 'pause')}>⏸</button>
              <button className="border rounded h-8 w-8 inline-flex items-center justify-center" title="Cancel" onClick={() => void apply(x.contractId, 'cancel')}>✕</button>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white border rounded-2xl p-3 space-y-2">
        <div className="text-sm font-semibold">Audit Trail Terbaru</div>
        {logs.length === 0 ? <div className="text-xs text-zinc-500">Belum ada audit log.</div> : null}
        {logs.map((x) => (
          <div key={x.id} className="border rounded-xl p-3 text-xs space-y-1">
            <div className="font-semibold">{x.actionName}</div>
            <div className="text-zinc-600">Actor: {x.actor} | {x.createdAt ? new Date(x.createdAt).toLocaleString('id-ID') : '-'}</div>
            <div className="text-zinc-600 break-all">Note: {x.note || '-'}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
