'use client';

import { useEffect, useState } from 'react';
import { Link } from '@/i18n/routing-patch';
import { apiGet, apiPost, apiPut } from '@/lib/api-client';
import { Skeleton } from '@/components/Skeleton';

const toRupiah = (n: number) => `Rp ${Number(n || 0).toLocaleString('id-ID')}`;

export default function CrmPage() {
  const [loading, setLoading] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [dash, setDash] = useState<any>(null);
  const [contacts, setContacts] = useState<any[]>([]);
  const [deals, setDeals] = useState<any[]>([]);
  const [queue, setQueue] = useState<any[]>([]);
  const [waDispatch, setWaDispatch] = useState<any[]>([]);
  const [waTemplatesText, setWaTemplatesText] = useState('');
  const [planOffsets, setPlanOffsets] = useState('3,14,30');
  const [planSubject, setPlanSubject] = useState('Aftersales follow-up {{name}} (H+{{day}})');
  const [contactName, setContactName] = useState('');
  const [contactWa, setContactWa] = useState('');
  const [dealTitle, setDealTitle] = useState('');
  const [dealContactId, setDealContactId] = useState('');
  const [dealValue, setDealValue] = useState('0');
  const [msg, setMsg] = useState('');
  const [bulkContactsJson, setBulkContactsJson] = useState(`[
  { "fullName": "Ahmad", "whatsApp": "6281234567890" }
]`);
  const [bulkDealsJson, setBulkDealsJson] = useState(`[
  { "crmContactId": 1, "dealTitle": "Deal Paket Umrah", "estimatedValue": 25000000 }
]`);

  const load = async () => {
    setLoading(true);
    try {
      const [f, d, c, dl, q, w, tpl, plan] = await Promise.all([
        apiGet<any>('/api/Crm/feature'),
        apiGet<any>('/api/Crm/dashboard'),
        apiGet<any>('/api/Crm/contacts'),
        apiGet<any>('/api/Crm/deals'),
        apiGet<any>('/api/Crm/aftersales/queue'),
        apiGet<any>('/api/Crm/aftersales/wa-dispatch?limit=100'),
        apiGet<any>('/api/Crm/whatsapp/templates'),
        apiGet<any>('/api/Crm/aftersales/plan'),
      ]);
      setEnabled(Boolean(f?.data?.enabled));
      setDash(d?.data ?? null);
      setContacts(Array.isArray(c?.data) ? c.data : []);
      setDeals(Array.isArray(dl?.data) ? dl.data : []);
      setQueue(Array.isArray(q?.data) ? q.data : []);
      setWaDispatch(Array.isArray(w?.data?.items) ? w.data.items : []);
      setWaTemplatesText(Array.isArray(tpl?.data?.templates) ? tpl.data.templates.join('\n---\n') : '');
      setPlanOffsets(Array.isArray(plan?.data?.dayOffsets) ? plan.data.dayOffsets.join(',') : '3,14,30');
      setPlanSubject(String(plan?.data?.subjectTemplate || 'Aftersales follow-up {{name}} (H+{{day}})'));
      setMsg('');
    } catch (e: any) {
      setMsg(e?.message || 'Gagal memuat CRM');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);
  const runAction = async (action: () => Promise<void>) => {
    try { await action(); } catch (e: any) { setMsg(e?.message || 'Terjadi kesalahan saat memproses permintaan'); }
  };
  const runBulkContacts = async () => {
    await runAction(async () => {
      const parsed = JSON.parse(bulkContactsJson);
      if (!Array.isArray(parsed) || parsed.length === 0) throw new Error('Bulk contact JSON harus array');
      for (const row of parsed) {
        await apiPost('/api/Crm/contacts', { fullName: row?.fullName ?? '', whatsApp: row?.whatsApp ?? '', source: 'manual', lifecycleStage: row?.lifecycleStage ?? 'lead' });
      }
      setMsg(`Bulk contact berhasil: ${parsed.length}`);
      await load();
    });
  };
  const runBulkDeals = async () => {
    await runAction(async () => {
      const parsed = JSON.parse(bulkDealsJson);
      if (!Array.isArray(parsed) || parsed.length === 0) throw new Error('Bulk deal JSON harus array');
      for (const row of parsed) {
        await apiPost('/api/Crm/deals', { crmContactId: Number(row?.crmContactId || 0), dealTitle: row?.dealTitle ?? '', estimatedValue: Number(row?.estimatedValue || 0), stage: row?.stage ?? 'new', probabilityPercent: Number(row?.probabilityPercent ?? 10) });
      }
      setMsg(`Bulk deal berhasil: ${parsed.length}`);
      await load();
    });
  };

  return (
    <div className="p-4 space-y-4 animate-fade-up">
      <div className="bg-white border rounded-3xl p-5">
        <h1 className="text-lg font-extrabold g-text">CRM Aftersales</h1>
        <p className="text-xs text-zinc-500 mt-1">Kelola kontak jamaah, follow-up aftersales, dan pipeline deal.</p>
      </div>
      {msg ? <div className="text-xs text-emerald-700">{msg}</div> : null}

      <div className="bg-white border rounded-3xl p-4 text-xs space-y-2">
        <div className="flex items-center justify-between">
          <span className="font-semibold">Feature CRM</span>
          <label className="inline-flex items-center gap-2">
            <span>{enabled ? 'Aktif' : 'Nonaktif'}</span>
            <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} />
          </label>
        </div>
        <button className="border rounded-lg h-9 w-9 inline-flex items-center justify-center" title="Simpan toggle" onClick={() => void runAction(async () => { await apiPut('/api/Crm/feature', { enabled }); await load(); })}>💾</button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-6 gap-2 text-xs">
        <div className="bg-white border rounded-2xl p-3"><div className="text-zinc-500">Contacts</div><div className="font-bold">{Number(dash?.contacts || 0)}</div></div>
        <div className="bg-white border rounded-2xl p-3"><div className="text-zinc-500">Deals</div><div className="font-bold">{Number(dash?.deals || 0)}</div></div>
        <div className="bg-white border rounded-2xl p-3"><div className="text-zinc-500">Won Deals</div><div className="font-bold">{Number(dash?.wonDeals || 0)}</div></div>
        <div className="bg-white border rounded-2xl p-3"><div className="text-zinc-500">Open Deals</div><div className="font-bold">{Number(dash?.openDeals || 0)}</div></div>
        <div className="bg-white border rounded-2xl p-3"><div className="text-zinc-500">Pipeline Value</div><div className="font-bold">{toRupiah(Number(dash?.pipelineValue || 0))}</div></div>
        <div className="bg-white border rounded-2xl p-3"><div className="text-zinc-500">Aftersales Due</div><div className="font-bold">{Number(dash?.aftersalesDue || 0)}</div></div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
        <div className="bg-white border rounded-2xl p-3"><div className="text-zinc-500">SLA Avg Lag (Jam)</div><div className="font-bold">{Number(dash?.sla?.avgLagHours || 0).toLocaleString('id-ID')}</div></div>
        <div className="bg-white border rounded-2xl p-3"><div className="text-zinc-500">SLA Planned</div><div className="font-bold">{Number(dash?.sla?.plannedCount || 0)}</div></div>
        <div className="bg-white border rounded-2xl p-3"><div className="text-zinc-500">SLA Overdue</div><div className="font-bold">{Number(dash?.sla?.overdueCount || 0)}</div></div>
        <div className="bg-white border rounded-2xl p-3"><div className="text-zinc-500">Overdue Rate</div><div className="font-bold">{Number(dash?.sla?.overdueRate || 0).toLocaleString('id-ID')}%</div></div>
      </div>

      <div className="bg-white border rounded-3xl p-4 space-y-2 text-xs">
        <h2 className="text-sm font-bold">Tambah Contact</h2>
        <div className="grid md:grid-cols-3 gap-2">
          <input className="border rounded-lg px-2 py-2" placeholder="Nama" value={contactName} onChange={(e) => setContactName(e.target.value)} />
          <input className="border rounded-lg px-2 py-2" placeholder="WhatsApp" value={contactWa} onChange={(e) => setContactWa(e.target.value)} />
          <button className="border rounded-lg h-9 w-9 inline-flex items-center justify-center" title="Simpan contact" onClick={() => void runAction(async () => {
            await apiPost('/api/Crm/contacts', { fullName: contactName, whatsApp: contactWa, source: 'manual', lifecycleStage: 'lead' });
            setContactName(''); setContactWa('');
            await load();
          })}>💾</button>
        </div>
      </div>
      <div className="bg-white border rounded-3xl p-4 space-y-2 text-xs">
        <h2 className="text-sm font-bold">Bulk JSON Contact</h2>
        <textarea className="w-full min-h-[110px] border rounded-xl p-2 font-mono text-[11px]" value={bulkContactsJson} onChange={(e) => setBulkContactsJson(e.target.value)} />
        <button className="border rounded-lg h-9 w-9 inline-flex items-center justify-center" title="Execute bulk contact" onClick={() => void runBulkContacts()}>⚡</button>
      </div>

      <div className="bg-white border rounded-3xl p-4 space-y-2 text-xs">
        <h2 className="text-sm font-bold">Auto Aftersales Plan (Saat Deal Won)</h2>
        <p className="text-zinc-500">Offset hari dipisah koma, contoh: `3,14,30`.</p>
        <div className="grid md:grid-cols-2 gap-2">
          <input className="border rounded-lg px-2 py-2" value={planOffsets} onChange={(e) => setPlanOffsets(e.target.value)} placeholder="3,14,30" />
          <input className="border rounded-lg px-2 py-2" value={planSubject} onChange={(e) => setPlanSubject(e.target.value)} placeholder="Aftersales follow-up {{name}} (H+{{day}})" />
        </div>
        <button className="border rounded-lg h-9 w-9 inline-flex items-center justify-center" title="Simpan plan" onClick={async () => {
          const dayOffsets = planOffsets.split(',').map((x) => Number(x.trim())).filter((x) => Number.isFinite(x));
          await runAction(async () => { await apiPut('/api/Crm/aftersales/plan', { dayOffsets, subjectTemplate: planSubject }); await load(); });
        }}>💾</button>
      </div>

      <div className="bg-white border rounded-3xl p-4 space-y-2 text-xs">
        <h2 className="text-sm font-bold">Template WhatsApp Aftersales</h2>
        <p className="text-zinc-500">Pisahkan template dengan `---`. Gunakan placeholder {'{{name}}'} untuk nama kontak.</p>
        <textarea className="w-full min-h-[140px] border rounded-xl p-2 font-mono text-[11px]" value={waTemplatesText} onChange={(e) => setWaTemplatesText(e.target.value)} />
        <button className="border rounded-lg h-9 w-9 inline-flex items-center justify-center" title="Simpan template WA" onClick={async () => {
          const templates = waTemplatesText.split('\n---\n').map((x) => x.trim()).filter(Boolean);
          await runAction(async () => { await apiPut('/api/Crm/whatsapp/templates', { templates }); await load(); });
        }}>💾</button>
      </div>

      <div className="bg-white border rounded-3xl p-4 space-y-2 text-xs">
        <h2 className="text-sm font-bold">Tambah Deal</h2>
        <div className="grid md:grid-cols-4 gap-2">
          <select className="border rounded-lg px-2 py-2" value={dealContactId} onChange={(e) => setDealContactId(e.target.value)}>
            <option value="">Pilih Contact</option>
            {contacts.map((c) => <option key={c.id} value={c.id}>{c.fullName}</option>)}
          </select>
          <input className="border rounded-lg px-2 py-2" placeholder="Judul Deal" value={dealTitle} onChange={(e) => setDealTitle(e.target.value)} />
          <input className="border rounded-lg px-2 py-2" placeholder="Nilai" value={dealValue} onChange={(e) => setDealValue(e.target.value)} />
          <button className="border rounded-lg h-9 w-9 inline-flex items-center justify-center" title="Simpan deal" onClick={() => void runAction(async () => {
            await apiPost('/api/Crm/deals', { crmContactId: Number(dealContactId), dealTitle, estimatedValue: Number(dealValue || 0), stage: 'new', probabilityPercent: 10 });
            setDealTitle(''); setDealValue('0');
            await load();
          })}>💾</button>
        </div>
      </div>
      <div className="bg-white border rounded-3xl p-4 space-y-2 text-xs">
        <h2 className="text-sm font-bold">Bulk JSON Deal</h2>
        <textarea className="w-full min-h-[110px] border rounded-xl p-2 font-mono text-[11px]" value={bulkDealsJson} onChange={(e) => setBulkDealsJson(e.target.value)} />
        <button className="border rounded-lg h-9 w-9 inline-flex items-center justify-center" title="Execute bulk deal" onClick={() => void runBulkDeals()}>⚡</button>
      </div>

      <div className="bg-white border rounded-3xl p-4 space-y-2 text-xs">
        <h2 className="text-sm font-bold">Pipeline Deals</h2>
        {deals.map((d) => (
          <div key={d.id} className="border rounded-xl p-2">
            <div className="font-semibold">{d.dealTitle}</div>
            <div>Stage: {d.stage} • Value: {toRupiah(Number(d.estimatedValue || 0))}</div>
            <div className="mt-1 flex gap-1 flex-wrap">
              {['new', 'qualified', 'proposal', 'won', 'lost'].map((s) => (
                <button key={s} className="border rounded px-2 py-1" onClick={async () => { await apiPut(`/api/Crm/deals/${d.id}/stage`, { stage: s }); await load(); }}>{s}</button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white border rounded-3xl p-4 space-y-2 text-xs">
        <h2 className="text-sm font-bold">Queue Aftersales Follow-Up</h2>
        {queue.length === 0 ? <div className="text-zinc-500">Belum ada follow-up terjadwal.</div> : null}
        {queue.map((q) => (
          <div key={q.id} className="border rounded-xl p-2">
            <div className="font-semibold">{q.subject}</div>
            <div>{q.nextFollowUpAt ? new Date(q.nextFollowUpAt).toLocaleString('id-ID') : '-'} {q.overdue ? '• Overdue' : ''}</div>
          </div>
        ))}
      </div>

      <div className="bg-white border rounded-3xl p-4 space-y-2 text-xs">
        <h2 className="text-sm font-bold">WA Dispatch Queue (Ready to Send)</h2>
        {waDispatch.length === 0 ? <div className="text-zinc-500">Belum ada queue follow-up yang jatuh tempo.</div> : null}
        {waDispatch.map((x) => (
          <div key={x.activityId} className="border rounded-xl p-2 space-y-1">
            <div className="font-semibold">{x.name} • {x.whatsapp || '-'}</div>
            <div className="text-zinc-600">{x.message}</div>
            <div className="flex gap-2">
              <button className="border rounded px-2 py-1" onClick={async () => {
                if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) await navigator.clipboard.writeText(x.message || '');
              }}>Copy Pesan</button>
              {x.waLink ? <a href={x.waLink} target="_blank" rel="noreferrer" className="border rounded px-2 py-1">Buka WhatsApp</a> : null}
              <button className="border rounded px-2 py-1" onClick={async () => { await apiPut(`/api/Crm/activities/${x.activityId}/mark-sent`, {}); await load(); }}>Mark Sent</button>
            </div>
          </div>
        ))}
      </div>

      {loading ? (
        <div className="space-y-2">
          <div className="bg-white border rounded-2xl p-3 space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-10 w-full rounded-xl" />
          </div>
          <div className="flex items-center gap-2 text-xs text-zinc-500">
            <span className="h-4 w-4 rounded-full border-2 border-zinc-300 border-t-primary-600 animate-spin" />
            Memuat CRM...
          </div>
        </div>
      ) : null}
      <Link href="/akun" className="inline-flex text-sm text-primary-600">← Kembali ke Akun</Link>
    </div>
  );
}
