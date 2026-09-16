'use client';

import { useEffect, useState } from 'react';
import { Link } from '@/i18n/routing-patch';
import { apiDelete, apiGet, apiPost, apiPut } from '@/lib/api-client';
import { ModalShell } from '@/components/ui/ModalShell';
import { openMembershipExport } from '../membership-enterprise-utils';

const money = (v: unknown) => `Rp ${Number(v || 0).toLocaleString('id-ID')}`;
const today = () => new Date().toISOString().slice(0, 10);

export default function KelolaMembershipPage() {
  const [plans, setPlans] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [memberships, setMemberships] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [plan, setPlan] = useState<any>({ id: 0, code: '', name: '', description: '', durationDays: 365, priceAmount: 0, currency: 'IDR', sortOrder: 0, isActive: true });
  const [assign, setAssign] = useState<any>({ userId: '', membershipPlanId: '', startDate: today(), endDate: today(), notes: '' });
  const [share, setShare] = useState<any>({ id: 0, title: '', description: '', externalUrl: '', coverUrl: '', sourceType: 'Manual', roles: 'SuperAdmin,Admin,Agen,Marketing', isActive: true });
  const [shares, setShares] = useState<any[]>([]);
  const [memberStatus, setMemberStatus] = useState('');
  const [quickModal, setQuickModal] = useState<'plan' | 'assign' | 'share' | null>(null);
  const [selectedShares, setSelectedShares] = useState<number[]>([]);

  const load = async () => {
    const [p, u, m, s] = await Promise.all([
      apiGet<any>('/api/Membership/admin/plans'),
      apiGet<any>('/api/UserManagement?pageNumber=1&pageSize=200'),
      apiGet<any>(`/api/Membership/admin/users?page=1&pageSize=50${memberStatus ? `&status=${encodeURIComponent(memberStatus)}` : ''}`),
      apiGet<any>('/api/Membership/admin/product-shares?page=1&pageSize=50'),
    ]);
    setPlans(p?.data ?? []);
    setUsers(u?.data?.items ?? u?.data?.Items ?? []);
    setMemberships(m?.data?.items ?? []);
    setShares(s?.data?.items ?? []);
  };

  useEffect(() => { void load().catch((e) => setError(e?.message || 'Gagal memuat data')); }, [memberStatus]);

  const savePlan = async () => {
    setSaving(true);
    setError('');
    try {
      const body = { ...plan, durationDays: Number(plan.durationDays), priceAmount: Number(plan.priceAmount), sortOrder: Number(plan.sortOrder), isActive: Boolean(plan.isActive) };
      if (plan.id) await apiPut(`/api/Membership/admin/plans/${plan.id}`, body);
      else await apiPost('/api/Membership/admin/plans', body);
      setPlan({ id: 0, code: '', name: '', description: '', durationDays: 365, priceAmount: 0, currency: 'IDR', sortOrder: 0, isActive: true });
      await load();
    } catch (e: any) { setError(e?.message || 'Gagal simpan plan'); } finally { setSaving(false); }
  };

  const saveShare = async () => {
    setSaving(true);
    setError('');
    try {
      const body = {
        ...share,
        roles: String(share.roles || '').split(',').map((x) => x.trim()).filter(Boolean),
        sortOrder: 0,
      };
      if (share.id) await apiPut(`/api/Membership/admin/product-shares/${share.id}`, body);
      else await apiPost('/api/Membership/admin/product-shares', body);
      setShare({ id: 0, title: '', description: '', externalUrl: '', coverUrl: '', sourceType: 'Manual', roles: 'SuperAdmin,Admin,Agen,Marketing', isActive: true });
      await load();
    } catch (e: any) { setError(e?.message || 'Gagal simpan produk khusus'); } finally { setSaving(false); }
  };

  const renewMembership = async (membership: any) => {
    setSaving(true);
    setError('');
    try {
      await apiPost(`/api/Membership/admin/users/${membership.id}/renew`, {
        membershipPlanId: membership.membershipPlanId || null,
        durationDays: 365,
        notes: 'Renew dari UI admin',
      });
      await load();
    } catch (e: any) { setError(e?.message || 'Gagal renew membership'); } finally { setSaving(false); }
  };

  const deactivateMembership = async (membership: any) => {
    setSaving(true);
    setError('');
    try {
      await apiPost(`/api/Membership/admin/users/${membership.id}/deactivate`, { reason: 'Dinonaktifkan dari UI admin' });
      await load();
    } catch (e: any) { setError(e?.message || 'Gagal deactivate membership'); } finally { setSaving(false); }
  };

  const toggleShare = (id: number) => setSelectedShares((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  const bulkDeleteShares = async () => {
    if (selectedShares.length === 0) return;
    await apiPost('/api/Membership/admin/product-shares/bulk-delete', { ids: selectedShares });
    setSelectedShares([]);
    await load();
  };

  return (
    <div className="p-4 space-y-4 animate-fade-up">
      <div className="bg-white border rounded-3xl p-5"><h1 className="text-lg font-extrabold g-text">Kelola Membership</h1><p className="text-xs text-zinc-500 mt-1">Plan premium, assign/renew user, dan produk khusus berdasarkan role.</p></div>
      {error ? <div className="text-xs text-red-600">{error}</div> : null}

      <div className="bg-white border rounded-3xl p-4 flex flex-wrap gap-2">
        <button className="rounded-xl bg-primary-600 px-3 py-2 text-xs font-semibold text-white" onClick={() => setQuickModal('plan')}>Tambah Plan</button>
        <button className="rounded-xl border px-3 py-2 text-xs font-semibold" onClick={() => setQuickModal('assign')}>Assign Membership</button>
        <button className="rounded-xl border px-3 py-2 text-xs font-semibold" onClick={() => setQuickModal('share')}>Tambah Produk Khusus</button>
        <button className="rounded-xl border px-3 py-2 text-xs font-semibold" onClick={() => openMembershipExport('memberships', 'csv')}>Export Membership Excel</button>
        <button className="rounded-xl border px-3 py-2 text-xs font-semibold" onClick={() => openMembershipExport('memberships', 'pdf')}>Export Membership PDF</button>
        <button className="rounded-xl border px-3 py-2 text-xs font-semibold" onClick={() => openMembershipExport('product-shares', 'csv')}>Export Produk Excel</button>
        <button className="rounded-xl border px-3 py-2 text-xs font-semibold" onClick={() => openMembershipExport('product-shares', 'pdf')}>Export Produk PDF</button>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <div className="bg-white border rounded-3xl p-5 space-y-3">
          <h2 className="text-sm font-bold">{plan.id ? 'Edit Plan' : 'Tambah Plan'}</h2>
          <div className="grid md:grid-cols-2 gap-2">
            <input className="rounded-xl border px-3 py-2 text-sm" placeholder="Kode" value={plan.code} onChange={(e) => setPlan({ ...plan, code: e.target.value })} />
            <input className="rounded-xl border px-3 py-2 text-sm" placeholder="Nama plan" value={plan.name} onChange={(e) => setPlan({ ...plan, name: e.target.value })} />
            <input className="rounded-xl border px-3 py-2 text-sm" type="number" placeholder="Durasi hari" value={plan.durationDays} onChange={(e) => setPlan({ ...plan, durationDays: e.target.value })} />
            <input className="rounded-xl border px-3 py-2 text-sm" type="number" placeholder="Harga" value={plan.priceAmount} onChange={(e) => setPlan({ ...plan, priceAmount: e.target.value })} />
          </div>
          <textarea className="w-full rounded-xl border px-3 py-2 text-sm" placeholder="Deskripsi" value={plan.description || ''} onChange={(e) => setPlan({ ...plan, description: e.target.value })} />
          <button onClick={savePlan} disabled={saving} className="rounded-xl bg-primary-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">{saving ? 'Menyimpan...' : 'Simpan Plan'}</button>
        </div>

        <div className="bg-white border rounded-3xl p-5 space-y-3">
          <h2 className="text-sm font-bold">Assign Membership User</h2>
          <select className="w-full rounded-xl border px-3 py-2 text-sm" value={assign.userId} onChange={(e) => setAssign({ ...assign, userId: e.target.value })}>
            <option value="">Pilih user</option>{users.map((u) => <option key={u.id} value={u.id}>{u.fullName || u.userName || u.email}</option>)}
          </select>
          <select className="w-full rounded-xl border px-3 py-2 text-sm" value={assign.membershipPlanId} onChange={(e) => setAssign({ ...assign, membershipPlanId: e.target.value })}>
            <option value="">Tanpa plan</option>{plans.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <div className="grid grid-cols-2 gap-2"><input type="date" className="rounded-xl border px-3 py-2 text-sm" value={assign.startDate} onChange={(e) => setAssign({ ...assign, startDate: e.target.value })} /><input type="date" className="rounded-xl border px-3 py-2 text-sm" value={assign.endDate} onChange={(e) => setAssign({ ...assign, endDate: e.target.value })} /></div>
          <button disabled={saving || !assign.userId} onClick={async () => { try { setSaving(true); await apiPost('/api/Membership/admin/users', { ...assign, membershipPlanId: assign.membershipPlanId ? Number(assign.membershipPlanId) : null }); await load(); } catch (e: any) { setError(e?.message || 'Gagal assign membership'); } finally { setSaving(false); } }} className="rounded-xl bg-primary-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">Assign</button>
        </div>
      </div>

      <div className="bg-white border rounded-3xl p-5 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-bold">{share.id ? 'Edit Produk Khusus' : 'Produk Khusus Membership'}</h2>
          {share.id ? <button className="rounded-lg border px-3 py-1.5 text-xs" onClick={() => setShare({ id: 0, title: '', description: '', externalUrl: '', coverUrl: '', sourceType: 'Manual', roles: 'SuperAdmin,Admin,Agen,Marketing', isActive: true })}>Batal Edit</button> : null}
        </div>
        <div className="grid md:grid-cols-2 gap-2">
          <input className="rounded-xl border px-3 py-2 text-sm" placeholder="Judul" value={share.title} onChange={(e) => setShare({ ...share, title: e.target.value })} />
          <input className="rounded-xl border px-3 py-2 text-sm" placeholder="Role, pisahkan koma" value={share.roles} onChange={(e) => setShare({ ...share, roles: e.target.value })} />
          <input className="rounded-xl border px-3 py-2 text-sm" placeholder="URL dinamis" value={share.externalUrl} onChange={(e) => setShare({ ...share, externalUrl: e.target.value })} />
          <input className="rounded-xl border px-3 py-2 text-sm" placeholder="Cover URL" value={share.coverUrl} onChange={(e) => setShare({ ...share, coverUrl: e.target.value })} />
        </div>
        <textarea className="w-full rounded-xl border px-3 py-2 text-sm" placeholder="Deskripsi" value={share.description} onChange={(e) => setShare({ ...share, description: e.target.value })} />
        <button onClick={saveShare} disabled={saving} className="rounded-xl bg-primary-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">{saving ? 'Menyimpan...' : 'Simpan Produk Khusus'}</button>
      </div>

      <div className="bg-white border rounded-3xl p-5 space-y-2">
        <h2 className="text-sm font-bold">Plan Aktif</h2>
        {plans.map((p) => <div key={p.id} className="rounded-xl border px-3 py-2 text-xs flex justify-between gap-2"><button className="text-left" onClick={() => setPlan(p)}><b>{p.name}</b><br />{p.durationDays} hari • {money(p.priceAmount)}</button><button className="text-red-600" onClick={async () => { await apiDelete(`/api/Membership/admin/plans/${p.id}`); await load(); }}>Hapus</button></div>)}
      </div>

      <div className="bg-white border rounded-3xl p-5 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-bold">Membership User Terbaru</h2>
          <select className="rounded-lg border px-2 py-1 text-xs" value={memberStatus} onChange={(e) => setMemberStatus(e.target.value)}>
            <option value="">Semua</option>
            {['Active', 'Expired', 'Suspended', 'Cancelled'].map((x) => <option key={x}>{x}</option>)}
          </select>
        </div>
        {memberships.map((x) => (
          <div key={x.membership.id} className="rounded-xl border px-3 py-2 text-xs space-y-2">
            <div className="flex justify-between gap-2"><span>{x.user.fullName || x.user.userName} • {x.membership.planName || '-'}</span><span>{x.membership.status}</span></div>
            <div className="flex flex-wrap gap-2">
              <button disabled={saving} className="rounded-lg border px-3 py-1.5" onClick={() => renewMembership(x.membership)}>Renew 1 Tahun</button>
              <button disabled={saving || x.membership.status === 'Cancelled'} className="rounded-lg border px-3 py-1.5 text-red-600 disabled:opacity-50" onClick={() => deactivateMembership(x.membership)}>Deactivate</button>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white border rounded-3xl p-5 space-y-2">
        <h2 className="text-sm font-bold">Produk Khusus Tersimpan</h2>
        {selectedShares.length > 0 ? (
          <div className="rounded-xl bg-red-50 border border-red-100 p-3 text-xs flex items-center justify-between gap-2">
            <span>{selectedShares.length} produk dipilih</span>
            <button className="rounded-lg bg-red-600 px-3 py-1.5 text-white" onClick={bulkDeleteShares}>Bulk Hapus</button>
          </div>
        ) : null}
        {shares.map((x) => (
          <div key={x.id} className="rounded-xl border px-3 py-2 text-xs space-y-2">
            <div className="flex justify-between gap-2">
              <label className="flex items-center gap-2"><input type="checkbox" checked={selectedShares.includes(x.id)} onChange={() => toggleShare(x.id)} /><span>{x.title}</span></label>
              <span>{(x.roles || []).join(', ')}</span>
            </div>
            <div className="flex gap-2">
              <button className="rounded-lg border px-3 py-1.5" onClick={() => setShare({ ...x, roles: (x.roles || []).join(', ') })}>Edit</button>
              <button className="rounded-lg border px-3 py-1.5 text-red-600" onClick={async () => { await apiDelete(`/api/Membership/admin/product-shares/${x.id}`); await load(); }}>Hapus</button>
            </div>
          </div>
        ))}
      </div>

      <ModalShell open={quickModal !== null} onBackdropClick={() => setQuickModal(null)} zIndexClass="z-[1300]" overlayClassName="bg-black/35">
        <div className="bg-white rounded-3xl w-[min(760px,calc(100vw-32px))] max-h-[88vh] overflow-auto p-5 space-y-4 pointer-events-auto">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-base font-extrabold">{quickModal === 'plan' ? 'Plan Membership' : quickModal === 'assign' ? 'Assign Membership' : 'Produk Khusus Membership'}</h2>
            <button className="rounded-full border h-9 w-9" onClick={() => setQuickModal(null)}>×</button>
          </div>
          {quickModal === 'plan' ? (
            <div className="space-y-3">
              <div className="grid md:grid-cols-2 gap-2">
                <input className="rounded-xl border px-3 py-2 text-sm" placeholder="Kode" value={plan.code} onChange={(e) => setPlan({ ...plan, code: e.target.value })} />
                <input className="rounded-xl border px-3 py-2 text-sm" placeholder="Nama plan" value={plan.name} onChange={(e) => setPlan({ ...plan, name: e.target.value })} />
                <input className="rounded-xl border px-3 py-2 text-sm" type="number" placeholder="Durasi hari" value={plan.durationDays} onChange={(e) => setPlan({ ...plan, durationDays: e.target.value })} />
                <input className="rounded-xl border px-3 py-2 text-sm" type="number" placeholder="Harga" value={plan.priceAmount} onChange={(e) => setPlan({ ...plan, priceAmount: e.target.value })} />
              </div>
              <textarea className="w-full rounded-xl border px-3 py-2 text-sm" placeholder="Deskripsi" value={plan.description || ''} onChange={(e) => setPlan({ ...plan, description: e.target.value })} />
              <button onClick={async () => { await savePlan(); setQuickModal(null); }} disabled={saving} className="rounded-xl bg-primary-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">{saving ? 'Menyimpan...' : 'Simpan'}</button>
            </div>
          ) : null}
          {quickModal === 'assign' ? (
            <div className="space-y-3">
              <select className="w-full rounded-xl border px-3 py-2 text-sm" value={assign.userId} onChange={(e) => setAssign({ ...assign, userId: e.target.value })}><option value="">Pilih user</option>{users.map((u) => <option key={u.id} value={u.id}>{u.fullName || u.userName || u.email}</option>)}</select>
              <select className="w-full rounded-xl border px-3 py-2 text-sm" value={assign.membershipPlanId} onChange={(e) => setAssign({ ...assign, membershipPlanId: e.target.value })}><option value="">Tanpa plan</option>{plans.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select>
              <div className="grid grid-cols-2 gap-2"><input type="date" className="rounded-xl border px-3 py-2 text-sm" value={assign.startDate} onChange={(e) => setAssign({ ...assign, startDate: e.target.value })} /><input type="date" className="rounded-xl border px-3 py-2 text-sm" value={assign.endDate} onChange={(e) => setAssign({ ...assign, endDate: e.target.value })} /></div>
              <button disabled={saving || !assign.userId} onClick={async () => { try { setSaving(true); await apiPost('/api/Membership/admin/users', { ...assign, membershipPlanId: assign.membershipPlanId ? Number(assign.membershipPlanId) : null }); setQuickModal(null); await load(); } catch (e: any) { setError(e?.message || 'Gagal assign membership'); } finally { setSaving(false); } }} className="rounded-xl bg-primary-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">Assign</button>
            </div>
          ) : null}
          {quickModal === 'share' ? (
            <div className="space-y-3">
              <div className="grid md:grid-cols-2 gap-2">
                <input className="rounded-xl border px-3 py-2 text-sm" placeholder="Judul" value={share.title} onChange={(e) => setShare({ ...share, title: e.target.value })} />
                <input className="rounded-xl border px-3 py-2 text-sm" placeholder="Role, pisahkan koma" value={share.roles} onChange={(e) => setShare({ ...share, roles: e.target.value })} />
                <input className="rounded-xl border px-3 py-2 text-sm" placeholder="URL dinamis" value={share.externalUrl} onChange={(e) => setShare({ ...share, externalUrl: e.target.value })} />
                <input className="rounded-xl border px-3 py-2 text-sm" placeholder="Cover URL" value={share.coverUrl} onChange={(e) => setShare({ ...share, coverUrl: e.target.value })} />
              </div>
              <textarea className="w-full rounded-xl border px-3 py-2 text-sm" placeholder="Deskripsi" value={share.description} onChange={(e) => setShare({ ...share, description: e.target.value })} />
              <button onClick={async () => { await saveShare(); setQuickModal(null); }} disabled={saving} className="rounded-xl bg-primary-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">{saving ? 'Menyimpan...' : 'Simpan'}</button>
            </div>
          ) : null}
        </div>
      </ModalShell>

      <Link href="/akun" className="text-sm text-primary-600">Kembali ke Akun</Link>
    </div>
  );
}
