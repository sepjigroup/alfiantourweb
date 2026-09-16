'use client';

import { useEffect, useMemo, useState } from 'react';
import { apiGet, apiPost, apiPut } from '@/lib/api-client';
import TravelOpsNav from '../TravelOpsNav';
import { downloadCsv } from '../_lib';

export default function TravelOpsSupportPage() {
  const [rows, setRows] = useState<any[]>([]);
  const [status, setStatus] = useState('all');
  const [msg, setMsg] = useState('');
  const [bulkJson, setBulkJson] = useState(`[
  { "subject": "Follow up calon jamaah", "channel": "whatsapp", "priority": "normal", "status": "open" }
]`);

  const load = async () => {
    try {
      const q = status !== 'all' ? `?status=${status}` : '';
      const res = await apiGet<any>(`/api/TravelOps/support/tickets${q}`);
      setRows(res.data ?? []);
    } catch (e: any) {
      setMsg(e?.message || 'Gagal memuat tickets');
    }
  };
  useEffect(() => { void load(); }, [status]);
  const runAction = async (action: () => Promise<void>) => {
    try { await action(); } catch (e: any) { setMsg(e?.message || 'Terjadi kesalahan saat memproses permintaan'); }
  };
  const runBulk = async () => {
    await runAction(async () => {
      const parsed = JSON.parse(bulkJson);
      if (!Array.isArray(parsed) || parsed.length === 0) throw new Error('Bulk JSON harus array');
      for (const row of parsed) {
        await apiPost('/api/TravelOps/support/tickets', {
          subject: row?.subject ?? 'Follow up',
          channel: row?.channel ?? 'whatsapp',
          priority: row?.priority ?? 'normal',
          status: row?.status ?? 'open',
        });
      }
      setMsg(`Bulk ticket berhasil: ${parsed.length}`);
      await load();
    });
  };

  const sorted = useMemo(() => [...rows].sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt))), [rows]);

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-lg font-bold">TravelOps • Support Pipeline + SLA</h1>
      <TravelOpsNav />
      {msg ? <div className="text-xs text-emerald-700">{msg}</div> : null}
      <div className="bg-white border rounded-2xl p-3 flex flex-wrap gap-2">
        <button className="border rounded-xl h-9 w-9 inline-flex items-center justify-center text-xs" title="Tambah ticket" onClick={() => void runAction(async () => { await apiPost('/api/TravelOps/support/tickets', { subject: 'Follow up calon jamaah', channel: 'whatsapp', priority: 'normal', status: 'open' }); await load(); })}>＋</button>
        <select className="border rounded-xl px-3 py-2 text-xs" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="all">Semua Status</option>
          <option value="open">open</option>
          <option value="in_progress">in_progress</option>
          <option value="resolved">resolved</option>
          <option value="closed">closed</option>
        </select>
        <button className="border rounded-xl px-3 py-2 text-xs" onClick={() => downloadCsv('travelops-support.csv', ['TicketNo', 'Subject', 'Channel', 'Priority', 'Status', 'AssignedTo', 'SlaDueAt'], sorted.map((x) => [x.ticketNo, x.subject, x.channel, x.priority, x.status, x.assignedTo || '', x.slaDueAt || '']))}>Export CSV</button>
      </div>
      <div className="bg-white border rounded-2xl p-3 space-y-2 text-xs">
        <div className="font-semibold">Bulk JSON Execute</div>
        <textarea className="w-full min-h-24 border rounded-xl px-3 py-2 font-mono text-[11px]" value={bulkJson} onChange={(e) => setBulkJson(e.target.value)} />
        <button className="border rounded-xl h-9 w-9 inline-flex items-center justify-center" title="Execute bulk ticket" onClick={() => void runBulk()}>⚡</button>
      </div>
      <div className="space-y-2">
        {sorted.map((x) => (
          <div key={x.id} className="bg-white border rounded-2xl p-3 text-xs space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div className="font-semibold">{x.ticketNo}</div>
              <div>{x.status}</div>
            </div>
            <div>{x.subject}</div>
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-lg border p-2"><div className="text-zinc-500">Priority</div><div>{x.priority}</div></div>
              <div className="rounded-lg border p-2"><div className="text-zinc-500">SLA</div><div>{x.slaDueAt ? new Date(x.slaDueAt).toLocaleString('id-ID') : '-'}</div></div>
            </div>
            <button className="border rounded-lg h-8 w-8 inline-flex items-center justify-center" title="Resolve" onClick={() => void runAction(async () => { await apiPut(`/api/TravelOps/support/tickets/${x.id}/status`, { status: 'resolved', markFirstResponse: true, resolutionNote: 'Solved by ops' }); await load(); })}>✓</button>
          </div>
        ))}
      </div>
    </div>
  );
}
