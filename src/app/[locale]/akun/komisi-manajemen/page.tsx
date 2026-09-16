'use client';

import { useEffect, useMemo, useState } from 'react';
import { Link } from '@/i18n/routing-patch';
import { apiGet, apiPost, apiPut } from '@/lib/api-client';
import { getAuthState } from '@/lib/auth';

const STATUS_OPTIONS = ['pending', 'requested', 'approved', 'paid', 'rejected'] as const;
type AgentItem = { id?: string; userName?: string; fullName?: string; email?: string; branchCode?: string; city?: string };

export default function KomisiManajemenPage() {
  const [loading, setLoading] = useState(false);
  const [savingId, setSavingId] = useState<number | null>(null);
  const [submittingManual, setSubmittingManual] = useState(false);
  const [manualOpen, setManualOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');
  const [agentFilter, setAgentFilter] = useState('');
  const [rows, setRows] = useState<any[]>([]);
  const [agents, setAgents] = useState<AgentItem[]>([]);
  const [agentQuery, setAgentQuery] = useState('');
  const [error, setError] = useState('');
  const [summary, setSummary] = useState<any>(null);
  const [policyJson, setPolicyJson] = useState('');
  const [twoLevelEnabled, setTwoLevelEnabled] = useState(false);
  const [savingPolicy, setSavingPolicy] = useState(false);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [recon, setRecon] = useState<any>(null);
  const [manualForm, setManualForm] = useState({
    agentUsername: '',
    packagePrice: '',
    commissionType: 'fixed',
    commissionValue: '',
    customerName: '',
    programCode: '',
    note: '',
  });
  const selectedAgent = useMemo(
    () => agents.find((a) => String(a.userName || '').toLowerCase() === manualForm.agentUsername.toLowerCase()) ?? null,
    [agents, manualForm.agentUsername]
  );
  const filteredAgents = useMemo(() => {
    const q = agentQuery.trim().toLowerCase();
    if (!q) return agents;
      return agents.filter((a) => {
      const blob = `${a.fullName || ''} ${a.userName || ''} ${a.email || ''} ${a.branchCode || ''} ${a.city || ''}`.toLowerCase();
      return blob.includes(q);
    });
  }, [agents, agentQuery]);

  const canManage = useMemo(() => {
    const roles = getAuthState()?.user?.roles ?? [];
    const norm = roles.map((x) => String(x).toLowerCase());
    return norm.includes('superadmin') || norm.includes('admin') || norm.includes('manager');
  }, []);
  const canEditPolicy = useMemo(() => {
    const roles = getAuthState()?.user?.roles ?? [];
    const norm = roles.map((x) => String(x).toLowerCase());
    return norm.includes('superadmin');
  }, []);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const q = new URLSearchParams();
      if (statusFilter) q.set('status', statusFilter);
      if (agentFilter.trim()) q.set('agent', agentFilter.trim());
      const res = await apiGet<any>(`/api/BusinessInsights/referral/commissions/manage${q.toString() ? `?${q.toString()}` : ''}`);
      setRows(Array.isArray(res?.data?.items) ? res.data.items : []);
      const sq = new URLSearchParams();
      if (fromDate) sq.set('from', `${fromDate}T00:00:00Z`);
      if (toDate) sq.set('to', `${toDate}T23:59:59Z`);
      if (agentFilter.trim()) sq.set('agent', agentFilter.trim());
      const sRes = await apiGet<any>(`/api/BusinessInsights/referral/commissions/summary${sq.toString() ? `?${sq.toString()}` : ''}`);
      setSummary(sRes?.data ?? null);
    } catch (e: any) {
      setError(e?.message || 'Gagal memuat data manajemen komisi');
    } finally {
      setLoading(false);
    }
  };
  const loadPolicy = async () => {
    try {
      const res = await apiGet<any>('/api/BusinessInsights/referral/commission-policy');
      const payload = res?.data ?? {};
      setTwoLevelEnabled(Boolean(payload.twoLevelEnabled));
      setPolicyJson(JSON.stringify(payload.policy ?? {
        enabled: false,
        defaultType: 'fixed',
        defaultValue: 50000,
        defaultMinPayout: 50000,
        defaultNote: 'Komisi default sistem',
        rules: [],
      }, null, 2));
    } catch {
      setPolicyJson(JSON.stringify({
        enabled: false,
        defaultType: 'fixed',
        defaultValue: 50000,
        defaultMinPayout: 50000,
        defaultNote: 'Komisi default sistem',
        rules: [],
      }, null, 2));
    }
  };
  const loadReconciliation = async () => {
    try {
      const q = new URLSearchParams();
      if (fromDate) q.set('from', `${fromDate}T00:00:00Z`);
      if (toDate) q.set('to', `${toDate}T23:59:59Z`);
      const res = await apiGet<any>(`/api/BusinessInsights/referral/commissions/reconciliation${q.toString() ? `?${q.toString()}` : ''}`);
      setRecon(res?.data ?? null);
    } catch {
      setRecon(null);
    }
  };

  const loadAgents = async () => {
    try {
      const res = await apiGet<any>('/api/UserManagement/public-users?pageNumber=1&pageSize=500&role=Agen&sortBy=name&sortDirection=asc&isActive=true');
      setAgents(Array.isArray(res?.data?.items) ? res.data.items : []);
    } catch {
      setAgents([]);
    }
  };

  useEffect(() => {
    if (!canManage) return;
    void load();
    void loadAgents();
    void loadPolicy();
    void loadReconciliation();
  }, [canManage]);

  if (!canManage) {
    return (
      <div className="p-4 animate-fade-up">
        <div className="bg-white border rounded-3xl p-5 text-xs text-zinc-600">Halaman ini khusus SuperAdmin/Admin/Manager.</div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4 animate-fade-up">
      <div className="bg-white border rounded-3xl p-5">
        <h1 className="text-lg font-extrabold g-text">Manajemen Komisi Agen</h1>
        <p className="text-xs text-zinc-500 mt-1">Kelola approval dan pembayaran komisi referral booking.</p>
      </div>

      <div className="bg-white border rounded-3xl p-4 space-y-2 text-xs">
        <h2 className="text-sm font-bold">Ringkasan Komisi</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
          <input type="date" className="border rounded-lg px-2 py-2" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
          <input type="date" className="border rounded-lg px-2 py-2" value={toDate} onChange={(e) => setToDate(e.target.value)} />
          <button type="button" className="border rounded-lg px-3 py-2 font-semibold" onClick={() => { void load(); void loadReconciliation(); }}>Refresh Summary</button>
          <button type="button" className="border rounded-lg px-3 py-2" onClick={() => {
            const items = Array.isArray(summary?.items) ? summary.items : [];
            const headers = ['AgentUsername', 'BookingCount', 'TotalAmount', 'Pending', 'Requested', 'Approved', 'Paid'];
            const esc = (v: unknown) => `"${String(v ?? '').replaceAll('"', '""')}"`;
            const rows = items.map((x: any) => [x.agentUsername, x.bookingCount, x.totalAmount, x.pending, x.requested, x.approved, x.paid]);
            const csv = [headers.map(esc).join(','), ...rows.map((r: any[]) => r.map(esc).join(','))].join('\n');
            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `commission-summary-${new Date().toISOString().slice(0, 10)}.csv`;
            a.click();
            URL.revokeObjectURL(url);
          }}>Export CSV Summary</button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
          <div className="border rounded-xl p-2"><div className="text-zinc-500">Total</div><div className="font-bold">Rp {Number(summary?.totalAmount || 0).toLocaleString('id-ID')}</div></div>
          <div className="border rounded-xl p-2"><div className="text-zinc-500">Pending</div><div className="font-bold">Rp {Number(summary?.totalPending || 0).toLocaleString('id-ID')}</div></div>
          <div className="border rounded-xl p-2"><div className="text-zinc-500">Requested</div><div className="font-bold">Rp {Number(summary?.totalRequested || 0).toLocaleString('id-ID')}</div></div>
          <div className="border rounded-xl p-2"><div className="text-zinc-500">Approved</div><div className="font-bold">Rp {Number(summary?.totalApproved || 0).toLocaleString('id-ID')}</div></div>
          <div className="border rounded-xl p-2"><div className="text-zinc-500">Paid</div><div className="font-bold">Rp {Number(summary?.totalPaid || 0).toLocaleString('id-ID')}</div></div>
        </div>
      </div>

      <div className="bg-white border rounded-3xl p-4 space-y-2 text-xs">
        <h2 className="text-sm font-bold">Kebijakan Komisi (Opsional)</h2>
        <p className="text-[11px] text-zinc-500">JSON policy global + rule per program/cabang. Aktif jika ingin auto-komisi terstruktur.</p>
        <label className="inline-flex items-center gap-2 text-[11px] text-zinc-700">
          <input type="checkbox" checked={twoLevelEnabled} onChange={(e) => setTwoLevelEnabled(e.target.checked)} />
          <span>Aktifkan Two-Level Approval (status paid hanya SuperAdmin)</span>
        </label>
        <textarea className="w-full min-h-[180px] border rounded-xl p-2 font-mono text-[11px]" value={policyJson} onChange={(e) => setPolicyJson(e.target.value)} />
        <div className="flex justify-end">
          <button
            type="button"
            disabled={!canEditPolicy || savingPolicy}
            onClick={async () => {
              if (!canEditPolicy) return;
              setSavingPolicy(true);
              setError('');
              try {
                const payload = JSON.parse(policyJson || '{}');
                await apiPut('/api/BusinessInsights/referral/commission-policy', { twoLevelEnabled, policy: payload });
                await loadPolicy();
              } catch (e: any) {
                setError(e?.message || 'Gagal menyimpan policy komisi');
              } finally {
                setSavingPolicy(false);
              }
            }}
            className="rounded-lg bg-primary-600 text-white px-4 py-2 font-semibold disabled:opacity-60"
          >
            {savingPolicy ? 'Menyimpan...' : 'Simpan Policy'}
          </button>
        </div>
      </div>

      <div className="bg-white border rounded-3xl p-4 space-y-2 text-xs">
        <h2 className="text-sm font-bold">Rekonsiliasi Payout vs Cash Ledger</h2>
        <div className="flex items-center gap-2">
          <button className="border rounded-lg px-3 py-2" onClick={() => void loadReconciliation()}>Refresh Rekonsiliasi</button>
          <button className="border rounded-lg px-3 py-2" onClick={() => {
            const items = Array.isArray(recon?.items) ? recon.items : [];
            const headers = ['BookingId', 'AgentUsername', 'CommissionAmount', 'PaidAt', 'ExpectedRefNo', 'HasCashEntry', 'CashEntryId', 'CashAmount'];
            const esc = (v: unknown) => `"${String(v ?? '').replaceAll('"', '""')}"`;
            const rowsCsv = items.map((x: any) => [x.bookingId, x.agentUsername, x.commissionAmount, x.paidAt, x.expectedRefNo, x.hasCashEntry, x.cashEntryId, x.cashAmount]);
            const csv = [headers.map(esc).join(','), ...rowsCsv.map((r: any[]) => r.map(esc).join(','))].join('\n');
            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `commission-reconciliation-${new Date().toISOString().slice(0, 10)}.csv`;
            a.click();
            URL.revokeObjectURL(url);
          }}>Export CSV Rekonsiliasi</button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          <div className="border rounded-xl p-2"><div className="text-zinc-500">Paid</div><div className="font-bold">{Number(recon?.totalPaidCommissions || 0)}</div></div>
          <div className="border rounded-xl p-2"><div className="text-zinc-500">Paid Amount</div><div className="font-bold">Rp {Number(recon?.totalPaidAmount || 0).toLocaleString('id-ID')}</div></div>
          <div className="border rounded-xl p-2"><div className="text-zinc-500">Matched</div><div className="font-bold">{Number(recon?.totalCashMatched || 0)}</div></div>
          <div className="border rounded-xl p-2"><div className="text-zinc-500">Unmatched</div><div className="font-bold">{Number(recon?.totalCashUnmatched || 0)}</div></div>
        </div>
      </div>

      <div className="bg-white border rounded-3xl p-4 space-y-3 text-xs">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-bold">Input Komisi Manual</h2>
          <button
            type="button"
            onClick={() => setManualOpen((v) => !v)}
            className="rounded-lg border px-3 py-1.5 text-[11px] font-semibold"
          >
            {manualOpen ? 'Hide' : 'Show'}
          </button>
        </div>
        {!manualOpen ? (
          <p className="text-[11px] text-zinc-500">Section disembunyikan. Klik `Show` untuk menampilkan form input komisi manual.</p>
        ) : null}
        {manualOpen ? (
          <>
            <p className="text-[11px] text-zinc-500">
              Untuk kasus closing manual, input komisi ke agen terdaftar. Komisi bisa persen atau nominal rupiah dari harga paket.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          <label className="block">
            <span className="text-[11px] text-zinc-600">Cari Agen</span>
            <input
              value={agentQuery}
              onChange={(e) => setAgentQuery(e.target.value)}
              placeholder="Cari nama / username / email agen"
              className="w-full border rounded-lg px-2 py-2"
            />
          </label>
          <label className="block">
            <span className="text-[11px] text-zinc-600">Harga Paket (Rp)</span>
            <input
              value={manualForm.packagePrice}
              onChange={(e) => setManualForm((p) => ({ ...p, packagePrice: e.target.value }))}
              placeholder="Contoh: 35000000"
              className="w-full border rounded-lg px-2 py-2"
            />
          </label>
          <label className="block">
            <span className="text-[11px] text-zinc-600">Tipe Komisi</span>
            <select
              value={manualForm.commissionType}
              onChange={(e) => setManualForm((p) => ({ ...p, commissionType: e.target.value }))}
              className="w-full border rounded-lg px-2 py-2"
            >
              <option value="fixed">Nominal Rupiah</option>
              <option value="percent">Persentase (%)</option>
            </select>
          </label>
          <label className="block">
            <span className="text-[11px] text-zinc-600">
              Nilai Komisi {manualForm.commissionType === 'percent' ? '(%)' : '(Rp)'}
            </span>
            <input
              value={manualForm.commissionValue}
              onChange={(e) => setManualForm((p) => ({ ...p, commissionValue: e.target.value }))}
              placeholder={manualForm.commissionType === 'percent' ? 'Contoh: 5' : 'Contoh: 150000'}
              className="w-full border rounded-lg px-2 py-2"
            />
          </label>
          <label className="block">
            <span className="text-[11px] text-zinc-600">Nama Jamaah/Customer (opsional)</span>
            <input
              value={manualForm.customerName}
              onChange={(e) => setManualForm((p) => ({ ...p, customerName: e.target.value }))}
              placeholder="Contoh: Ahmad Fauzi"
              className="w-full border rounded-lg px-2 py-2"
            />
          </label>
          <label className="block">
            <span className="text-[11px] text-zinc-600">Kode Program/Slug (opsional)</span>
            <input
              value={manualForm.programCode}
              onChange={(e) => setManualForm((p) => ({ ...p, programCode: e.target.value }))}
              placeholder="Contoh: umrah-reguler-9-hari-2027"
              className="w-full border rounded-lg px-2 py-2"
            />
          </label>
            </div>

            <div className="border rounded-xl max-h-52 overflow-auto divide-y">
          {filteredAgents.length === 0 ? (
            <div className="px-3 py-2 text-[11px] text-zinc-500">Agen tidak ditemukan.</div>
          ) : null}
          {filteredAgents.map((a) => {
            const selected = manualForm.agentUsername === (a.userName || '');
            return (
              <button
                key={a.id || a.userName}
                type="button"
                onClick={() => setManualForm((p) => ({ ...p, agentUsername: a.userName || '' }))}
                className={`w-full text-left px-3 py-2 hover:bg-zinc-50 ${selected ? 'bg-primary-50' : 'bg-white'}`}
              >
                <div className="font-semibold">{a.fullName || '-'}</div>
                <div className="text-[11px] text-zinc-500">@{a.userName || '-'} • {a.email || '-'}</div>
                <div className="text-[11px] text-zinc-500">Cabang: {a.branchCode || '-'} • Kota: {a.city || '-'}</div>
              </button>
            );
          })}
            </div>

            {selectedAgent ? (
              <div className="border rounded-xl bg-zinc-50 p-3 space-y-1">
                <div className="text-[11px] font-semibold text-zinc-700">Preview Agen Terpilih</div>
                <div>Nama: <span className="font-medium">{selectedAgent.fullName || '-'}</span></div>
                <div>Username: <span className="font-medium">@{selectedAgent.userName || '-'}</span></div>
                <div>Email: <span className="font-medium">{selectedAgent.email || '-'}</span></div>
                <div>Cabang: <span className="font-medium">{selectedAgent.branchCode || '-'}</span></div>
                <div>Kota: <span className="font-medium">{selectedAgent.city || '-'}</span></div>
              </div>
            ) : (
              <div className="text-[11px] text-amber-700">Pilih agen dulu dari list di atas.</div>
            )}

            <label className="block">
              <span className="text-[11px] text-zinc-600">Catatan</span>
              <input
                value={manualForm.note}
                onChange={(e) => setManualForm((p) => ({ ...p, note: e.target.value }))}
                placeholder="Contoh: Closing via WA cabang Bandung"
                className="w-full border rounded-lg px-2 py-2"
              />
            </label>
            <div className="flex justify-end">
              <button
                type="button"
                disabled={submittingManual}
                onClick={async () => {
                  setSubmittingManual(true);
                  setError('');
                  try {
                    await apiPost('/api/BusinessInsights/referral/commissions/manual', {
                      agentUsername: manualForm.agentUsername.trim(),
                      packagePrice: Number(manualForm.packagePrice || 0),
                      commissionType: manualForm.commissionType,
                      commissionValue: Number(manualForm.commissionValue || 0),
                      minPayout: 50000,
                      programCode: manualForm.programCode.trim() || null,
                      customerName: manualForm.customerName.trim() || null,
                      customerEmail: null,
                      customerWhatsApp: null,
                      note: manualForm.note.trim() || null,
                    });
                    setManualForm({
                      agentUsername: '',
                      packagePrice: '',
                      commissionType: 'fixed',
                      commissionValue: '',
                      customerName: '',
                      programCode: '',
                      note: '',
                    });
                    await load();
                  } catch (err: any) {
                    setError(err?.message || 'Gagal menambahkan komisi manual');
                  } finally {
                    setSubmittingManual(false);
                  }
                }}
                className="rounded-lg bg-primary-600 text-white px-4 py-2 font-semibold disabled:opacity-60"
              >
                {submittingManual ? 'Menyimpan...' : 'Tambah Komisi Manual'}
              </button>
            </div>
          </>
        ) : null}
      </div>

      <div className="bg-white border rounded-3xl p-4 grid grid-cols-1 md:grid-cols-4 gap-2 text-xs">
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="border rounded-lg px-2 py-2">
          <option value="">Semua Status</option>
          {STATUS_OPTIONS.map((x) => <option key={x} value={x}>{x}</option>)}
        </select>
        <input
          value={agentFilter}
          onChange={(e) => setAgentFilter(e.target.value)}
          placeholder="Filter username agen"
          className="border rounded-lg px-2 py-2"
        />
        <button type="button" onClick={() => void load()} disabled={loading} className="border rounded-lg px-3 py-2 font-semibold">
          {loading ? 'Memuat...' : 'Terapkan Filter'}
        </button>
        <button type="button" onClick={() => { setStatusFilter(''); setAgentFilter(''); void load(); }} className="border rounded-lg px-3 py-2">
          Reset
        </button>
      </div>

      {error ? <div className="text-xs text-red-600">{error}</div> : null}

      <div className="bg-white border rounded-3xl p-4 space-y-2">
        {rows.length === 0 ? <div className="text-xs text-zinc-500">Belum ada data komisi.</div> : null}
        {rows.map((x) => (
          <div key={x.bookingId} className="border rounded-xl p-3 text-xs space-y-2">
            <div className="flex items-center justify-between gap-2">
              <div className="font-semibold">Booking #{x.bookingId}</div>
              <select
                value={x.commissionStatus || 'pending'}
                disabled={savingId === x.bookingId}
                onChange={async (e) => {
                  const next = e.target.value;
                  setSavingId(x.bookingId);
                  setError('');
                  try {
                    await apiPut(`/api/BusinessInsights/referral/commissions/${x.bookingId}/status`, {
                      status: next,
                      note: x.note || null,
                    });
                    await load();
                  } catch (err: any) {
                    setError(err?.message || 'Gagal update status komisi');
                  } finally {
                    setSavingId(null);
                  }
                }}
                className="border rounded-lg px-2 py-1"
              >
                {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="text-zinc-600">Agen: <span className="font-medium">{x.agentUsername || '-'}</span></div>
            <div className="text-zinc-600">Status booking: <span className="font-medium">{x.bookingStatus || '-'}</span></div>
            <div className="flex items-center justify-between">
              <span>Nominal komisi</span>
              <span className="font-semibold">Rp {Number(x.commissionAmount || 0).toLocaleString('id-ID')}</span>
            </div>
            <div className="text-[11px] text-zinc-500">Sumber: {x.source || '-'} {x.note ? `• ${x.note}` : ''}</div>
          </div>
        ))}
      </div>

      <Link href="/akun" className="inline-flex items-center gap-2 text-sm text-primary-600">
        <span aria-hidden>←</span>
        <span>Kembali ke Akun</span>
      </Link>
    </div>
  );
}
