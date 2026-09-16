'use client';

import { useEffect, useMemo, useState } from 'react';
import { Link } from '@/i18n/routing-patch';
import { apiDelete, apiGet, apiPost, apiPut, getApiBaseUrl, getAuthToken } from '@/lib/api-client';
import { useAuth } from '@/lib/auth';

const money = (v: unknown) => `Rp ${Number(v || 0).toLocaleString('id-ID')}`;
const emptyDeposit = { amount: '', paymentMethod: '', referenceNo: '', notes: '', proofUrl: '' };

function itemsOf(payload: any): any[] {
  const data = payload?.data ?? payload;
  return Array.isArray(data) ? data : Array.isArray(data?.items) ? data.items : [];
}

function absoluteUrl(path?: string | null) {
  if (!path) return '';
  if (/^https?:\/\//i.test(path)) return path;
  return `${getApiBaseUrl()}${path.startsWith('/') ? '' : '/'}${path}`;
}

// Curated colors for target cards outline
const outlineColors = [
  'border-sky-200 focus-within:border-sky-400 focus-within:ring-sky-100',
  'border-emerald-200 focus-within:border-emerald-400 focus-within:ring-emerald-100',
  'border-indigo-200 focus-within:border-indigo-400 focus-within:ring-indigo-100',
  'border-amber-200 focus-within:border-amber-400 focus-within:ring-amber-100',
  'border-rose-200 focus-within:border-rose-400 focus-within:ring-rose-100',
  'border-violet-200 focus-within:border-violet-400 focus-within:ring-violet-100',
  'border-teal-200 focus-within:border-teal-400 focus-within:ring-teal-100',
];

const getOutlineColor = (id: number) => {
  return outlineColors[id % outlineColors.length];
};

// Automatic Rupiah formatter helpers
const formatRupiah = (value: string | number) => {
  if (value === undefined || value === null) return '';
  const numString = String(value).replace(/[^0-9]/g, '');
  if (!numString) return '';
  return `Rp ${Number(numString).toLocaleString('id-ID')}`;
};

const parseRupiah = (formattedValue: string) => {
  const cleanString = (formattedValue || '').replace(/[^0-9]/g, '');
  return Number(cleanString) || 0;
};

const getDefaultTargetDate = () => {
  const d = new Date();
  d.setMonth(d.getMonth() + 1);
  return d.toISOString().slice(0, 10); // YYYY-MM-DD
};

export default function TabunganJamaahPage() {
  const { user } = useAuth();
  const [targets, setTargets] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [options, setOptions] = useState<Record<string, any[]>>({ Program: [], OtherProduct: [], TravelGeneralProduct: [] });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [deposit, setDeposit] = useState<any>(emptyDeposit);

  // Modals state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  const [newTargetForm, setNewTargetForm] = useState({
    targetName: '',
    targetType: 'Manual',
    targetId: '',
    targetAmount: '',
    targetDate: getDefaultTargetDate(),
    notes: '',
  });

  const [editTargetForm, setEditTargetForm] = useState({
    id: 0,
    targetName: '',
    targetAmount: '',
    targetDate: '',
    notes: '',
  });

  const targetOptions = useMemo(() => options[newTargetForm.targetType] ?? [], [newTargetForm.targetType, options]);
  const canDeposit = selected?.status === 'Active' && selected?.isActive !== false;

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await apiGet<any>('/api/Membership/savings/targets');
      const next = itemsOf(res);
      setTargets(next);
      if (selected) {
        const updatedSelected = next.find((x: any) => x.id === selected.id);
        if (updatedSelected) {
          setSelected(updatedSelected);
        }
      }
    } catch (e: any) {
      setError(e?.message || 'Gagal memuat tabungan');
    } finally {
      setLoading(false);
    }
  };

  const loadTransactions = async (id: number) => {
    try {
      const res = await apiGet<any>(`/api/Membership/savings/targets/${id}/transactions`);
      setTransactions(itemsOf(res));
    } catch (e: any) {
      setError(e?.message || 'Gagal memuat transaksi');
    }
  };

  const loadTargetOptions = async () => {
    const results = await Promise.allSettled([
      apiGet<any>('/api/v1/master/programs?page=1&pageSize=100&publicMode=true'),
      apiGet<any>('/api/Products?page=1&pageSize=100'),
      apiGet<any>('/api/TravelGeneral/public/products'),
    ]);
    setOptions({
      Program: results[0].status === 'fulfilled' ? itemsOf(results[0].value) : [],
      OtherProduct: results[1].status === 'fulfilled' ? itemsOf(results[1].value) : [],
      TravelGeneralProduct: results[2].status === 'fulfilled' ? itemsOf(results[2].value) : [],
    });
  };

  const uploadProof = async (file: File) => {
    const fd = new FormData();
    fd.append('file', file);
    const token = getAuthToken();
    const res = await fetch(`${getApiBaseUrl()}/api/Membership/savings/upload-proof`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      body: fd,
    });
    const json = await res.json().catch(() => null);
    if (!res.ok) throw new Error(json?.message || `Upload gagal (${res.status})`);
    setDeposit((p: any) => ({ ...p, proofUrl: json?.data?.url || '' }));
  };

  const handleCreateTarget = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const targetId = Number(newTargetForm.targetId || 0) || null;
      const body: Record<string, unknown> = {
        targetName: newTargetForm.targetName.trim(),
        targetType: newTargetForm.targetType,
        targetAmount: parseRupiah(newTargetForm.targetAmount),
        targetDate: newTargetForm.targetDate || null,
        notes: newTargetForm.notes ? newTargetForm.notes.trim() : null,
        programId: newTargetForm.targetType === 'Program' ? targetId : null,
        otherProductId: newTargetForm.targetType === 'OtherProduct' ? targetId : null,
        travelGeneralProductId: newTargetForm.targetType === 'TravelGeneralProduct' ? targetId : null,
      };
      await apiPost('/api/Membership/savings/targets', body);
      setShowCreateModal(false);
      setNewTargetForm({
        targetName: '',
        targetType: 'Manual',
        targetId: '',
        targetAmount: '',
        targetDate: getDefaultTargetDate(),
        notes: '',
      });
      await load();
    } catch (err: any) {
      setError(err?.message || 'Gagal membuat target baru');
    } finally {
      setSaving(false);
    }
  };

  const startEditTarget = (x: any) => {
    setEditTargetForm({
      id: x.id,
      targetName: x.targetName,
      targetAmount: formatRupiah(x.targetAmount),
      targetDate: x.targetDate ? String(x.targetDate).slice(0, 10) : '',
      notes: x.notes || '',
    });
    setShowEditModal(true);
  };

  const handleUpdateTarget = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const body = {
        targetName: editTargetForm.targetName.trim(),
        targetAmount: parseRupiah(editTargetForm.targetAmount),
        targetDate: editTargetForm.targetDate || null,
        notes: editTargetForm.notes ? editTargetForm.notes.trim() : null,
      };
      await apiPut(`/api/Membership/savings/targets/${editTargetForm.id}`, body);
      setShowEditModal(false);
      await load();
    } catch (err: any) {
      setError(err?.message || 'Gagal memperbarui target');
    } finally {
      setSaving(false);
    }
  };

  const printUserPassbook = async (target: any) => {
    let txs: any[] = [];
    try {
      const res = await apiGet<any>(`/api/Membership/savings/targets/${target.id}/transactions`);
      txs = itemsOf(res);
    } catch (e) {
      console.error(e);
      setError('Gagal memuat transaksi untuk dicetak');
      return;
    }

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      setError('Pop-up blocker aktif. Tolong izinkan pop-up untuk mencetak.');
      return;
    }

    const rowsHtml = txs.map((tx: any) => {
      const dateStr = new Date(tx.transactionDate).toLocaleDateString('id-ID', { year: 'numeric', month: '2-digit', day: '2-digit' });
      const isDeposit = tx.transactionType === 'Deposit' || (tx.transactionType === 'Adjustment' && tx.amount >= 0);
      const isWithdrawal = tx.transactionType === 'Withdrawal' || (tx.transactionType === 'Adjustment' && tx.amount < 0);
      return `
        <tr style="border-bottom: 1px solid #e4e4e7; font-size: 11px;">
          <td style="padding: 8px; text-align: center;">${dateStr}</td>
          <td style="padding: 8px; text-align: center; font-family: monospace;">${tx.referenceNo || '-'}</td>
          <td style="padding: 8px;">${tx.transactionType} ${tx.notes ? `(${tx.notes})` : ''}</td>
          <td style="padding: 8px; text-align: right; color: ${isDeposit ? '#047857' : '#000'}">${isDeposit ? money(tx.amount) : '-'}</td>
          <td style="padding: 8px; text-align: right; color: ${isWithdrawal ? '#b91c1c' : '#000'}">${isWithdrawal ? money(Math.abs(tx.amount)) : '-'}</td>
          <td style="padding: 8px; text-align: right; font-weight: bold;">${money(tx.balanceAfter)}</td>
          <td style="padding: 8px; text-align: center; color: #71717a;">[ ${tx.status} ]</td>
        </tr>
      `;
    }).join('');

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Buku Tabungan - ${user?.name || user?.userName || 'Jamaah'}</title>
        <meta charset="utf-8">
        <style>
          @page { size: A4; margin: 15mm; }
          body { font-family: 'Segoe UI', Helvetica, Arial, sans-serif; color: #18181b; margin: 0; padding: 0; line-height: 1.5; }
          .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 3px double #18181b; padding-bottom: 10px; margin-bottom: 20px; }
          .logo-area { display: flex; align-items: center; gap: 10px; }
          .logo-text { font-size: 20px; font-weight: 900; color: #047857; letter-spacing: 1px; }
          .company-info { text-align: right; font-size: 10px; color: #71717a; }
          .title { text-align: center; margin-top: 10px; margin-bottom: 20px; text-transform: uppercase; font-size: 16px; font-weight: 800; letter-spacing: 2px; border-bottom: 1px solid #e4e4e7; padding-bottom: 5px; }
          .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 25px; background-color: #fafafa; border: 1px solid #e4e4e7; border-radius: 12px; padding: 15px; font-size: 12px; }
          .meta-item { display: flex; margin-bottom: 6px; }
          .meta-label { width: 130px; font-weight: bold; color: #52525b; }
          .meta-value { flex: 1; font-weight: 600; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
          th { background-color: #f4f4f5; border-bottom: 2px solid #d4d4d8; border-top: 1px solid #e4e4e7; padding: 10px 8px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; }
          .signatures { display: grid; grid-template-columns: 1fr 1fr; gap: 50px; margin-top: 50px; page-break-inside: avoid; }
          .sig-box { text-align: center; font-size: 12px; }
          .sig-space { height: 75px; }
          .sig-line { border-top: 1px solid #18181b; width: 180px; margin: 0 auto 5px auto; font-weight: bold; }
          .print-btn { background-color: #047857; color: white; border: none; padding: 10px 20px; font-size: 14px; font-weight: bold; border-radius: 8px; cursor: pointer; margin: 20px auto; display: block; }
          @media print {
            .print-btn { display: none; }
            body { padding: 0; }
          }
        </style>
      </head>
      <body>
        <button class="print-btn" onclick="window.print()">Cetak Halaman (Print A4)</button>
        
        <div class="header">
          <div class="logo-area">
            <div class="logo-text">ALFIAN TOUR</div>
          </div>
          <div class="company-info">
            <strong>PT ALFIAN SEJAHTERA ABADI</strong><br>
            Spesialis Haji & Umroh Lansia (Kakek-Nenek)<br>
            Telp/WA: +62 812-3456-7890 | Website: alfiantour.com
          </div>
        </div>

        <div class="title">Buku Tabungan Jamaah</div>

        <div class="meta-grid">
          <div>
            <div class="meta-item"><span class="meta-label">Nama Jamaah</span><span class="meta-value">: ${user?.name || user?.userName || 'Jamaah'}</span></div>
            <div class="meta-item"><span class="meta-label">Username / ID</span><span class="meta-value">: ${user?.userName || '-'}</span></div>
            <div class="meta-item"><span class="meta-label">Email</span><span class="meta-value">: ${user?.email || '-'}</span></div>
          </div>
          <div>
            <div class="meta-item"><span class="meta-label">Nama Target</span><span class="meta-value">: ${target.targetName}</span></div>
            <div class="meta-item"><span class="meta-label">Nominal Target</span><span class="meta-value">: ${money(target.targetAmount)}</span></div>
            <div class="meta-item"><span class="meta-label">Saldo Saat Ini</span><span class="meta-value">: ${money(target.currentBalance)}</span></div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th style="width: 12%">Tanggal</th>
              <th style="width: 15%">No Referensi</th>
              <th>Keterangan Mutasi</th>
              <th style="width: 15%; text-align: right;">Setoran (Debet)</th>
              <th style="width: 15%; text-align: right;">Penarikan (Kredit)</th>
              <th style="width: 15%; text-align: right;">Saldo</th>
              <th style="width: 10%">Status</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml || '<tr><td colspan="7" style="text-align: center; padding: 15px; color: #71717a;">Belum ada riwayat transaksi.</td></tr>'}
          </tbody>
        </table>

        <div class="signatures">
          <div class="sig-box">
            <p>Mengetahui,</p>
            <p style="font-weight: bold; margin-bottom: 5px;">Pihak Jamaah</p>
            <div class="sig-space"></div>
            <div class="sig-line">${user?.name || user?.userName || 'Jamaah'}</div>
            <span>Tanda Tangan Jamaah</span>
          </div>
          <div class="sig-box">
            <p>Jakarta, ${new Date().toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
            <p style="font-weight: bold; margin-bottom: 5px;">Kasir / Admin Keuangan</p>
            <div class="sig-space"></div>
            <div class="sig-line">Alfian Tour Admin</div>
            <span>Petugas Berwenang</span>
          </div>
        </div>

        <script>
          window.onload = function() {
            setTimeout(function() { window.print(); }, 500);
          }
        </script>
      </body>
      </html>
    `;
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  useEffect(() => {
    void load();
    void loadTargetOptions();
  }, []);

  return (
    <div className="p-4 space-y-4 animate-fade-up">
      {/* Header Card */}
      <div className="bg-white border rounded-3xl p-5 flex flex-wrap items-center justify-between gap-4 shadow-sm">
        <div>
          <h1 className="text-lg font-extrabold g-text">Tabungan Jamaah</h1>
          <p className="text-xs text-zinc-500 mt-1">Saldo titipan untuk target perjalanan. Tidak ada bunga, investasi, atau profit sharing.</p>
        </div>
        <button
          className="rounded-xl bg-primary-600 hover:bg-primary-700 px-4 py-2.5 text-xs font-bold text-white shadow-md transition-colors"
          onClick={() => {
            setNewTargetForm({
              targetName: '',
              targetType: 'Manual',
              targetId: '',
              targetAmount: '',
              targetDate: getDefaultTargetDate(),
              notes: '',
            });
            setShowCreateModal(true);
          }}
        >
          + Buat Target Baru
        </button>
      </div>

      {loading && <div className="text-xs text-zinc-500">Memuat data...</div>}
      {error && (
        <div className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-xl p-3 flex justify-between items-center">
          <span>{error}</span>
          <button className="font-bold hover:text-red-800" onClick={() => setError('')}>&times;</button>
        </div>
      )}

      {/* Target Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {targets.map((x) => {
          const borderClass = getOutlineColor(x.id);
          const isSelected = selected?.id === x.id;
          return (
            <div key={x.id} className={`bg-white border-2 ${borderClass} ${isSelected ? 'ring-2 ring-primary-500' : ''} rounded-3xl p-5 shadow-sm space-y-4 transition-all duration-200 hover:shadow-md`}>
              <button
                type="button"
                onClick={() => {
                  setSelected(x);
                  void loadTransactions(x.id);
                }}
                className="w-full text-left focus:outline-none"
              >
                <div className="flex justify-between gap-2 text-sm font-extrabold text-zinc-900">
                  <span>{x.targetName}</span>
                  <span className="text-primary-600 font-black">{Number(x.progressPercent || 0)}%</span>
                </div>
                <div className="mt-2.5 h-2.5 rounded-full bg-zinc-100 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-sky-400 to-blue-600 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, Number(x.progressPercent || 0))}%` }}
                  />
                </div>
                <div className="mt-3 flex justify-between gap-2 text-xs text-zinc-500">
                  <span className="font-semibold text-zinc-700">{money(x.currentBalance)} / {money(x.targetAmount)}</span>
                  <span className="bg-zinc-100 px-2 py-0.5 rounded-md text-[10px] uppercase font-bold text-zinc-600">{x.targetType}</span>
                </div>
                <div className="mt-1 flex justify-between gap-2 text-[10px] text-zinc-400">
                  <span>Target: {x.targetDate ? new Date(x.targetDate).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' }) : 'Tanpa batas waktu'}</span>
                  <span>Status: <b className={x.status === 'Active' ? 'text-emerald-600' : 'text-zinc-600'}>{x.status}</b></span>
                </div>
                {x.notes && (
                  <div className="mt-2 text-xs text-zinc-600 bg-zinc-50 p-2 rounded-xl border border-zinc-100 border-dashed">
                    <b>Catatan:</b> {x.notes}
                  </div>
                )}
              </button>

              <div className="flex gap-2 pt-3 border-t border-zinc-100">
                <button
                  type="button"
                  className="rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-semibold hover:bg-zinc-50 transition-colors flex items-center gap-1"
                  onClick={() => startEditTarget(x)}
                >
                  <span>📝</span> Edit
                </button>
                <button
                  type="button"
                  className="rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-800 px-3 py-1.5 text-xs font-semibold hover:bg-emerald-100 transition-colors flex items-center gap-1"
                  onClick={() => void printUserPassbook(x)}
                >
                  <span>🖨️</span> Cetak Buku
                </button>
                <button
                  type="button"
                  className="rounded-lg border border-red-100 text-red-600 px-3 py-1.5 text-xs font-semibold hover:bg-red-50 disabled:opacity-50 transition-colors flex items-center gap-1 ml-auto"
                  disabled={Number(x.currentBalance || 0) > 0}
                  onClick={async () => {
                    if (confirm('Apakah Anda yakin ingin menghapus target tabungan ini?')) {
                      try {
                        await apiDelete(`/api/Membership/savings/targets/${x.id}`);
                        if (selected?.id === x.id) setSelected(null);
                        await load();
                      } catch (err: any) {
                        setError(err?.message || 'Gagal menghapus target');
                      }
                    }
                  }}
                >
                  <span>🗑️</span> Hapus
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Target Ledger & Deposit Request */}
      {selected ? (
        <div className="bg-white border border-zinc-200 rounded-3xl p-5 space-y-4 shadow-sm animate-fade-up">
          <div className="flex justify-between items-center border-b pb-3">
            <h2 className="text-sm font-extrabold text-zinc-900 flex items-center gap-1.5">
              <span>💰</span> Setoran & Riwayat Mutasi: <span className="text-primary-600 font-black">{selected.targetName}</span>
            </h2>
            <button className="text-xs font-semibold text-zinc-500 hover:text-zinc-700" onClick={() => setSelected(null)}>Tutup Detail</button>
          </div>

          {canDeposit ? (
            <div className="bg-zinc-50 border rounded-2xl p-4 space-y-3">
              <h3 className="text-xs font-bold text-zinc-700 uppercase tracking-wide">Ajukan Setoran Baru</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500">Nominal Setoran *</label>
                  <input
                    className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-xs focus:ring-2 focus:ring-primary-500 focus:outline-none"
                    type="number"
                    min="1"
                    placeholder="Contoh: 500000"
                    value={deposit.amount}
                    onChange={(e) => setDeposit({ ...deposit, amount: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500">Metode Pembayaran *</label>
                  <input
                    className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-xs focus:ring-2 focus:ring-primary-500 focus:outline-none"
                    placeholder="Contoh: Transfer Bank Mandiri"
                    value={deposit.paymentMethod}
                    onChange={(e) => setDeposit({ ...deposit, paymentMethod: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500">No Referensi / Pengirim</label>
                  <input
                    className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-xs focus:ring-2 focus:ring-primary-500 focus:outline-none"
                    placeholder="Contoh: Ref-1290382 / a.n. Ahmad"
                    value={deposit.referenceNo}
                    onChange={(e) => setDeposit({ ...deposit, referenceNo: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500">Catatan</label>
                  <input
                    className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-xs focus:ring-2 focus:ring-primary-500 focus:outline-none"
                    placeholder="Catatan transfer..."
                    value={deposit.notes}
                    onChange={(e) => setDeposit({ ...deposit, notes: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 py-2 text-xs">
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-zinc-500">Upload Bukti Transfer</label>
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    className="text-xs text-zinc-500 file:mr-2 file:py-1 file:px-2 file:rounded-lg file:border file:border-zinc-200 file:text-[10px] file:font-semibold file:bg-white hover:file:bg-zinc-50 cursor-pointer"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      setUploading(true);
                      try {
                        await uploadProof(file);
                      } catch (err: any) {
                        setError(err?.message || 'Upload gagal');
                      } finally {
                        setUploading(false);
                      }
                    }}
                  />
                </div>
                {uploading && <span className="text-zinc-500 animate-pulse text-[10px]">Mengupload file...</span>}
                {deposit.proofUrl && (
                  <a
                    className="text-primary-600 font-bold hover:underline self-end"
                    href={absoluteUrl(deposit.proofUrl)}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Lihat Bukti Terupload
                  </a>
                )}
              </div>

              <button
                className="rounded-xl bg-primary-600 hover:bg-primary-700 px-4 py-2 text-xs font-semibold text-white shadow-sm transition-colors"
                onClick={async () => {
                  if (!deposit.amount || !deposit.paymentMethod) {
                    setError('Nominal dan Metode Pembayaran wajib diisi.');
                    return;
                  }
                  try {
                    await apiPost(`/api/Membership/savings/targets/${selected.id}/deposits`, {
                      ...deposit,
                      amount: Number(deposit.amount || 0),
                    });
                    setDeposit(emptyDeposit);
                    await load();
                    await loadTransactions(selected.id);
                  } catch (err: any) {
                    setError(err?.message || 'Gagal mengajukan setoran');
                  }
                }}
              >
                Ajukan Setoran
              </button>
            </div>
          ) : (
            <div className="rounded-2xl bg-amber-50 border border-amber-200 p-3 text-xs text-amber-800">
              Target berstatus <b>{selected.status}</b>; setoran baru dinonaktifkan.
            </div>
          )}

          <div className="space-y-2">
            <h3 className="text-xs font-bold text-zinc-700 uppercase tracking-wide">Mutasi Transaksi</h3>
            {transactions.length === 0 ? (
              <div className="text-xs text-zinc-400 py-3 text-center border border-zinc-100 rounded-2xl">Belum ada riwayat transaksi.</div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                {transactions.map((tx) => (
                  <div key={tx.id} className="rounded-2xl border border-zinc-100 p-3 text-xs space-y-1.5 bg-white hover:bg-zinc-50 transition-colors shadow-2xs">
                    <div className="flex justify-between items-center">
                      <span className="font-extrabold text-zinc-800">
                        {tx.transactionType} &bull; <span className={tx.status === 'Approved' ? 'text-emerald-600' : tx.status === 'Pending' ? 'text-amber-600' : 'text-red-600'}>{tx.status}</span>
                      </span>
                      <b className="text-sm font-black text-zinc-900">{money(tx.amount)}</b>
                    </div>
                    <div className="text-[10px] text-zinc-500 flex flex-wrap gap-x-3 gap-y-1">
                      <span>Saldo sesudah: <b>{money(tx.balanceAfter)}</b></span>
                      <span>Metode: <b>{tx.paymentMethod || '-'}</b></span>
                      <span>No Ref: <b>{tx.referenceNo || '-'}</b></span>
                    </div>
                    <div className="text-[10px] text-zinc-400">
                      {tx.transactionDate ? new Date(tx.transactionDate).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' }) : '-'}
                    </div>
                    {tx.notes && <div className="text-zinc-600 bg-zinc-50 p-1.5 rounded-lg border border-zinc-100">Catatan: {tx.notes}</div>}
                    {tx.proofUrl && (
                      <a className="inline-flex text-primary-600 font-semibold hover:underline" href={absoluteUrl(tx.proofUrl)} target="_blank" rel="noreferrer">
                        Lihat Bukti Transfer
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : null}

      {/* CREATE TARGET MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-900/60 backdrop-blur-sm p-4 overflow-y-auto">
          <form
            className="relative bg-white rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl my-auto animate-scale-up border border-zinc-100"
            onSubmit={handleCreateTarget}
          >
            <div className="flex justify-between items-center border-b pb-2">
              <h3 className="text-base font-extrabold text-zinc-900">Buat Target Baru</h3>
              <button
                type="button"
                className="text-zinc-400 hover:text-zinc-600 text-lg font-bold"
                onClick={() => setShowCreateModal(false)}
              >
                &times;
              </button>
            </div>

            <div className="space-y-3">
              <div className="space-y-1">
                <label className="block text-xs font-bold text-zinc-700">Nama Target Tabungan *</label>
                <input
                  className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-xs focus:ring-2 focus:ring-primary-500 focus:outline-none"
                  placeholder="Contoh: Tabungan Umroh Akhir Tahun"
                  value={newTargetForm.targetName}
                  onChange={(e) => setNewTargetForm({ ...newTargetForm, targetName: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-zinc-700">Jenis Target</label>
                <select
                  className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-xs bg-white font-medium focus:ring-2 focus:ring-primary-500 focus:outline-none"
                  value={newTargetForm.targetType}
                  onChange={(e) => setNewTargetForm({ ...newTargetForm, targetType: e.target.value, targetId: '' })}
                >
                  <option value="Manual">Target manual</option>
                  <option value="Program">Program umroh/haji</option>
                  <option value="OtherProduct">Produk lain</option>
                  <option value="TravelGeneralProduct">Produk travel umum</option>
                </select>
              </div>

              {newTargetForm.targetType !== 'Manual' && (
                <div className="space-y-1 animate-fade-down duration-200">
                  <label className="block text-xs font-bold text-zinc-700">Pilih Paket Target *</label>
                  <select
                    className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-xs bg-white font-medium focus:ring-2 focus:ring-primary-500 focus:outline-none"
                    value={newTargetForm.targetId}
                    onChange={(e) => setNewTargetForm({ ...newTargetForm, targetId: e.target.value })}
                    required
                  >
                    <option value="">Pilih target</option>
                    {targetOptions.map((x: any) => (
                      <option key={x.id} value={x.id}>
                        {x.title || x.name || x.fileId || `#${x.id}`}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="space-y-1">
                <label className="block text-xs font-bold text-zinc-700">Nominal Target (Rupiah) *</label>
                <input
                  className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-xs focus:ring-2 focus:ring-primary-500 focus:outline-none"
                  type="text"
                  placeholder="Contoh: Rp 35.000.000"
                  value={newTargetForm.targetAmount}
                  onChange={(e) => setNewTargetForm({ ...newTargetForm, targetAmount: formatRupiah(e.target.value) })}
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-zinc-700">Batas Waktu (Target Date)</label>
                <input
                  className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-xs focus:ring-2 focus:ring-primary-500 focus:outline-none"
                  type="date"
                  value={newTargetForm.targetDate}
                  onChange={(e) => setNewTargetForm({ ...newTargetForm, targetDate: e.target.value })}
                />
                <span className="text-[10px] text-zinc-400 block mt-0.5">Batas waktu tidak dapat diubah setelah target dibuat.</span>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-zinc-700">Catatan</label>
                <textarea
                  className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-xs focus:ring-2 focus:ring-primary-500 focus:outline-none"
                  placeholder="Catatan target tabungan..."
                  rows={2}
                  value={newTargetForm.notes}
                  onChange={(e) => setNewTargetForm({ ...newTargetForm, notes: e.target.value })}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t">
              <button
                type="button"
                className="rounded-xl border px-4 py-2 text-xs font-semibold text-zinc-600 hover:bg-zinc-50"
                onClick={() => setShowCreateModal(false)}
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={saving}
                className="rounded-xl bg-primary-600 hover:bg-primary-700 px-4 py-2 text-xs font-semibold text-white shadow-sm disabled:opacity-60 transition-colors"
              >
                {saving ? 'Menyimpan...' : 'Simpan Target'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* EDIT TARGET MODAL */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-900/60 backdrop-blur-sm p-4 overflow-y-auto">
          <form
            className="relative bg-white rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl my-auto animate-scale-up border border-zinc-100"
            onSubmit={handleUpdateTarget}
          >
            <div className="flex justify-between items-center border-b pb-2">
              <h3 className="text-base font-extrabold text-zinc-900">Edit Detail Target Tabungan</h3>
              <button
                type="button"
                className="text-zinc-400 hover:text-zinc-600 text-lg font-bold"
                onClick={() => setShowEditModal(false)}
              >
                &times;
              </button>
            </div>

            <div className="space-y-3">
              <div className="space-y-1">
                <label className="block text-xs font-bold text-zinc-700">Nama Target Tabungan *</label>
                <input
                  className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-xs focus:ring-2 focus:ring-primary-500 focus:outline-none"
                  value={editTargetForm.targetName}
                  onChange={(e) => setEditTargetForm({ ...editTargetForm, targetName: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-zinc-400">Nominal Target (Rupiah) &bull; <span className="text-[10px] text-zinc-400 italic">Hanya Baca</span></label>
                <input
                  className="w-full rounded-xl border border-zinc-100 bg-zinc-50 text-zinc-400 px-3 py-2 text-xs cursor-not-allowed"
                  type="text"
                  value={editTargetForm.targetAmount}
                  disabled
                  readOnly
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-zinc-400">Batas Waktu (Target Date) &bull; <span className="text-[10px] text-zinc-400 italic">Hanya Baca</span></label>
                <input
                  className="w-full rounded-xl border border-zinc-100 bg-zinc-50 text-zinc-400 px-3 py-2 text-xs cursor-not-allowed"
                  type="date"
                  value={editTargetForm.targetDate}
                  disabled
                  readOnly
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-zinc-700">Catatan</label>
                <textarea
                  className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-xs focus:ring-2 focus:ring-primary-500 focus:outline-none"
                  placeholder="Catatan target tabungan..."
                  rows={2}
                  value={editTargetForm.notes}
                  onChange={(e) => setEditTargetForm({ ...editTargetForm, notes: e.target.value })}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t">
              <button
                type="button"
                className="rounded-xl border px-4 py-2 text-xs font-semibold text-zinc-600 hover:bg-zinc-50"
                onClick={() => setShowEditModal(false)}
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={saving}
                className="rounded-xl bg-primary-600 hover:bg-primary-700 px-4 py-2 text-xs font-semibold text-white shadow-sm disabled:opacity-60 transition-colors"
              >
                {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="pt-2">
        <Link href="/akun" className="text-sm text-primary-600 hover:underline flex items-center gap-1 font-bold">
          <span>&larr;</span> Kembali ke Akun
        </Link>
      </div>
    </div>
  );
}
