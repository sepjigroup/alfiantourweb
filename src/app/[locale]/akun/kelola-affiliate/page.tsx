'use client';

import { useEffect, useState } from 'react';
import { Link } from '@/i18n/routing-patch';
import { apiDelete, apiGet, apiPost, apiPut } from '@/lib/api-client';
import { openMembershipExport } from '../membership-enterprise-utils';

const money = (v: unknown) => `Rp ${Number(v || 0).toLocaleString('id-ID')}`;

export default function KelolaAffiliatePage() {
  const [users, setUsers] = useState<any[]>([]);
  const [rows, setRows] = useState<any[]>([]);
  const [status, setStatus] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState<any>({ referrerUserId: '', referredUserId: '', sourceType: 'Manual', amount: '', notes: '' });
  const [logs, setLogs] = useState<Record<number, any[]>>({});
  const [selected, setSelected] = useState<number[]>([]);

  const load = async () => {
    const [u, c] = await Promise.all([
      apiGet<any>('/api/UserManagement?pageNumber=1&pageSize=200'),
      apiGet<any>(`/api/Membership/admin/affiliate/commissions?page=1&pageSize=50${status ? `&status=${status}` : ''}`),
    ]);
    setUsers(u?.data?.items ?? u?.data?.Items ?? []);
    setRows(c?.data?.items ?? []);
  };

  useEffect(() => { void load().catch((e) => setError(e?.message || 'Gagal memuat affiliate')); }, [status]);

  const save = async () => {
    setSaving(true);
    setError('');
    try {
      await apiPost('/api/Membership/admin/affiliate/commissions', { ...form, amount: Number(form.amount || 0), referredUserId: form.referredUserId || null });
      setForm({ referrerUserId: '', referredUserId: '', sourceType: 'Manual', amount: '', notes: '' });
      await load();
    } catch (e: any) { setError(e?.message || 'Gagal simpan komisi'); } finally { setSaving(false); }
  };

  const updateStatus = async (id: number, nextStatus: string) => {
    try {
      await apiPut(`/api/Membership/admin/affiliate/commissions/${id}/status`, { status: nextStatus, notes: '', rejectionReason: nextStatus === 'Rejected' ? 'Ditolak admin' : '', paymentReferenceNo: '' });
      await load();
    } catch (e: any) {
      setError(e?.message || 'Gagal update status komisi');
    }
  };

  const toggleLogs = async (id: number) => {
    if (logs[id]) {
      setLogs((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
      return;
    }
    try {
      const res = await apiGet<any>(`/api/Membership/admin/affiliate/commissions/${id}/logs`);
      setLogs((prev) => ({ ...prev, [id]: res?.data ?? [] }));
    } catch (e: any) {
      setError(e?.message || 'Gagal memuat log komisi');
    }
  };

  const removeCommission = async (id: number) => {
    try {
      await apiDelete(`/api/Membership/admin/affiliate/commissions/${id}`);
      await load();
    } catch (e: any) {
      setError(e?.message || 'Gagal hapus komisi');
    }
  };

  const toggleSelected = (id: number) => setSelected((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  const bulkStatus = async (nextStatus: string) => {
    if (selected.length === 0) return;
    try {
      await apiPost('/api/Membership/admin/affiliate/commissions/bulk-status', { ids: selected, status: nextStatus, notes: 'Bulk action dari UI admin', rejectionReason: nextStatus === 'Rejected' ? 'Ditolak admin' : '' });
      setSelected([]);
      await load();
    } catch (e: any) {
      setError(e?.message || 'Gagal bulk update komisi');
    }
  };
  const bulkDelete = async () => {
    if (selected.length === 0) return;
    try {
      await apiPost('/api/Membership/admin/affiliate/commissions/bulk-delete', { ids: selected });
      setSelected([]);
      await load();
    } catch (e: any) {
      setError(e?.message || 'Gagal bulk delete komisi');
    }
  };

  return (
    <div className="p-4 space-y-4 animate-fade-up">
      <div className="bg-white border rounded-3xl p-5"><h1 className="text-lg font-extrabold g-text">Kelola Affiliate</h1><p className="text-xs text-zinc-500 mt-1">Komisi affiliate 1 level. Nominal dan status ditentukan admin.</p></div>
      {error ? <div className="text-xs text-red-600">{error}</div> : null}

      <div className="bg-white border rounded-3xl p-5 space-y-3">
        <h2 className="text-sm font-bold">Tambah Komisi Manual</h2>
        <div className="grid md:grid-cols-2 gap-2">
          <select className="rounded-xl border px-3 py-2 text-sm" value={form.referrerUserId} onChange={(e) => setForm({ ...form, referrerUserId: e.target.value })}><option value="">Pilih referrer</option>{users.map((u) => <option key={u.id} value={u.id}>{u.fullName || u.userName || u.email}</option>)}</select>
          <select className="rounded-xl border px-3 py-2 text-sm" value={form.referredUserId} onChange={(e) => setForm({ ...form, referredUserId: e.target.value })}><option value="">Referred opsional</option>{users.map((u) => <option key={u.id} value={u.id}>{u.fullName || u.userName || u.email}</option>)}</select>
          <select className="rounded-xl border px-3 py-2 text-sm" value={form.sourceType} onChange={(e) => setForm({ ...form, sourceType: e.target.value })}>{['Manual', 'Booking', 'Membership', 'Savings'].map((x) => <option key={x}>{x}</option>)}</select>
          <input className="rounded-xl border px-3 py-2 text-sm" type="number" placeholder="Nominal komisi" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
        </div>
        <textarea className="w-full rounded-xl border px-3 py-2 text-sm" placeholder="Catatan" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
        <button disabled={saving || !form.referrerUserId} onClick={save} className="rounded-xl bg-primary-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">{saving ? 'Menyimpan...' : 'Simpan Komisi'}</button>
      </div>

      <div className="bg-white border rounded-3xl p-4 flex flex-wrap gap-2">
        <select className="rounded-xl border px-3 py-2 text-sm" value={status} onChange={(e) => setStatus(e.target.value)}><option value="">Semua status</option>{['Pending', 'Approved', 'Rejected', 'Paid', 'Cancelled'].map((x) => <option key={x}>{x}</option>)}</select>
        <button className="rounded-xl border px-3 py-2 text-xs font-semibold" onClick={() => openMembershipExport('affiliate-commissions', 'csv')}>Export Excel</button>
        <button className="rounded-xl border px-3 py-2 text-xs font-semibold" onClick={() => openMembershipExport('affiliate-commissions', 'pdf')}>Export PDF</button>
      </div>

      <div className="bg-white border rounded-3xl p-5 space-y-2">
        <h2 className="text-sm font-bold">Daftar Komisi</h2>
        {selected.length > 0 ? (
          <div className="rounded-xl bg-zinc-50 border p-3 text-xs flex flex-wrap items-center gap-2">
            <span>{selected.length} komisi dipilih</span>
            {['Approved', 'Rejected', 'Paid', 'Cancelled'].map((s) => <button key={s} className="rounded-lg border px-3 py-1.5" onClick={() => bulkStatus(s)}>{s}</button>)}
            <button className="rounded-lg bg-red-600 px-3 py-1.5 text-white" onClick={bulkDelete}>Bulk Hapus</button>
          </div>
        ) : null}
        {rows.map((x) => (
          <div key={x.id} className="rounded-xl border p-3 text-xs space-y-2">
            <div className="flex justify-between gap-2"><label className="flex items-center gap-2"><input type="checkbox" checked={selected.includes(x.id)} onChange={() => toggleSelected(x.id)} /><b>{x.referrerName || x.referrerUserId}</b></label><b>{money(x.amount)}</b></div>
            <div className="text-zinc-500">{x.sourceType} • {x.status} • referral: {x.referredName || '-'}</div>
            <div className="flex flex-wrap gap-2">
              {['Approved', 'Rejected', 'Paid', 'Cancelled'].map((s) => <button key={s} className="rounded-lg border px-3 py-1.5" onClick={() => updateStatus(x.id, s)}>{s}</button>)}
              <button className="rounded-lg border px-3 py-1.5" onClick={() => toggleLogs(x.id)}>{logs[x.id] ? 'Tutup Log' : 'Log'}</button>
              <button disabled={x.status === 'Paid'} className="rounded-lg border px-3 py-1.5 text-red-600 disabled:opacity-50" onClick={() => removeCommission(x.id)}>Hapus</button>
            </div>
            {logs[x.id] ? (
              <div className="rounded-xl bg-zinc-50 p-2 space-y-1">
                {logs[x.id].length === 0 ? <div className="text-zinc-500">Belum ada log.</div> : null}
                {logs[x.id].map((log) => (
                  <div key={log.id} className="flex justify-between gap-2">
                    <span>{log.oldStatus || '-'} → {log.newStatus}</span>
                    <span>{log.changedAt ? new Date(log.changedAt).toLocaleString('id-ID') : '-'}</span>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        ))}
      </div>
      <Link href="/akun" className="text-sm text-primary-600">Kembali ke Akun</Link>
    </div>
  );
}
