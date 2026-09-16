'use client';

import { useEffect, useState } from 'react';
import { Link } from '@/i18n/routing-patch';
import { apiGet, apiPost, apiPut, apiDelete, getApiBaseUrl } from '@/lib/api-client';
import { openMembershipExport } from '../membership-enterprise-utils';

const money = (v: unknown) => `Rp ${Number(v || 0).toLocaleString('id-ID')}`;
const pageSize = 20;
const itemsOf = (payload: any) => payload?.data?.items ?? [];
const absoluteUrl = (value?: string | null) => !value ? '' : /^https?:\/\//i.test(value) ? value : `${getApiBaseUrl()}${value.startsWith('/') ? '' : '/'}${value}`;

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

export default function KelolaTabunganJamaahPage() {
  const [targets, setTargets] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [programs, setPrograms] = useState<any[]>([]);
  const [transactionStatus, setTransactionStatus] = useState('');
  const [targetStatus, setTargetStatus] = useState('');
  const [search, setSearch] = useState('');
  const [targetPage, setTargetPage] = useState(1);
  const [transactionPage, setTransactionPage] = useState(1);
  const [targetPages, setTargetPages] = useState(1);
  const [transactionPages, setTransactionPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedTx, setSelectedTx] = useState<number[]>([]);
  const [reminderDays, setReminderDays] = useState(30);
  const [reminders, setReminders] = useState<any[]>([]);
  
  // Dashboard summary stats
  const [summary, setSummary] = useState<any>(null);

  // Input form state containing formatted strings
  const [depositForm, setDepositForm] = useState<Record<number, any>>({});
  const [ledgerForm, setLedgerForm] = useState<Record<number, any>>({});
  const [conversionForm, setConversionForm] = useState<Record<number, any>>({});

  // Target-specific mutasi log state
  const [targetTransactions, setTargetTransactions] = useState<Record<number, any[]>>({});
  const [loadingTargetTx, setLoadingTargetTx] = useState<Record<number, boolean>>({});

  // Toast feedback state
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // UI state
  const [showMoreFilters, setShowMoreFilters] = useState(false);
  const [expandedTargets, setExpandedTargets] = useState<number[]>([]);

  // Modals state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showChartModal, setShowChartModal] = useState(false);
  const [editingTarget, setEditingTarget] = useState<any>(null);

  // User search/select inside Create Modal
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [userList, setUserList] = useState<any[]>([]);
  const [searchingUsers, setSearchingUsers] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);

  const [newTargetForm, setNewTargetForm] = useState({
    targetName: '',
    targetAmount: '',
    targetType: 'Manual',
    programId: '',
    targetDate: '',
    notes: '',
  });

  const [editTargetForm, setEditTargetForm] = useState({
    id: 0,
    targetName: '',
    targetAmount: '',
    targetDate: '',
    notes: '',
  });

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 3500);
  };

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const tq = new URLSearchParams({ page: String(targetPage), pageSize: String(pageSize) });
      if (search.trim()) tq.set('search', search.trim());
      if (targetStatus) tq.set('status', targetStatus);
      const txq = new URLSearchParams({ page: String(transactionPage), pageSize: String(pageSize) });
      if (transactionStatus) txq.set('status', transactionStatus);
      const [t, tx, sum] = await Promise.all([
        apiGet<any>(`/api/Membership/admin/savings/targets?${tq.toString()}`),
        apiGet<any>(`/api/Membership/admin/savings/transactions?${txq.toString()}`),
        apiGet<any>('/api/Membership/admin/savings/summary'),
      ]);
      setTargets(itemsOf(t));
      setTransactions(itemsOf(tx));
      setSummary(sum?.data ?? sum ?? null);
      setTargetPages(Number(t?.data?.totalPages || 1));
      setTransactionPages(Number(tx?.data?.totalPages || 1));
      setSelectedTx([]);
    } catch (e: any) {
      setError(e?.message || 'Gagal memuat data tabungan');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, [targetPage, transactionPage, transactionStatus, targetStatus]);
  useEffect(() => {
    void apiGet<any>('/api/v1/master/programs?page=1&pageSize=200&publicMode=true')
      .then((res) => setPrograms(res?.items ?? res?.data?.items ?? []))
      .catch(() => setPrograms([]));
  }, []);

  const searchUsers = async (term: string) => {
    if (!term.trim()) {
      setUserList([]);
      return;
    }
    setSearchingUsers(true);
    try {
      const res = await apiGet<any>(`/api/UserManagement/public-users?searchTerm=${encodeURIComponent(term.trim())}&pageSize=10`);
      setUserList(res?.data?.items ?? res?.items ?? []);
    } catch (e) {
      console.error('Gagal mencari user', e);
    } finally {
      setSearchingUsers(false);
    }
  };

  const handleCreateTarget = async () => {
    if (!selectedUser) {
      showToast('Pilih jamaah/user terlebih dahulu', 'error');
      return;
    }
    if (!newTargetForm.targetName.trim() || !newTargetForm.targetAmount) {
      showToast('Nama target dan nominal wajib diisi', 'error');
      return;
    }
    try {
      await apiPost('/api/Membership/admin/savings/targets', {
        userId: selectedUser.id,
        targetName: newTargetForm.targetName.trim(),
        targetAmount: parseRupiah(newTargetForm.targetAmount),
        targetType: newTargetForm.targetType,
        programId: newTargetForm.targetType === 'Program' && newTargetForm.programId ? Number(newTargetForm.programId) : null,
        targetDate: newTargetForm.targetDate ? newTargetForm.targetDate : null,
        notes: newTargetForm.notes.trim() || null,
      });
      setShowCreateModal(false);
      setSelectedUser(null);
      setNewTargetForm({
        targetName: '',
        targetAmount: '',
        targetType: 'Manual',
        programId: '',
        targetDate: '',
        notes: '',
      });
      showToast('Target tabungan jamaah berhasil dibuat!');
      await load();
    } catch (e: any) {
      showToast(e?.message || 'Gagal membuat target tabungan', 'error');
    }
  };

  const startEditTarget = (x: any) => {
    setEditingTarget(x);
    setEditTargetForm({
      id: x.target.id,
      targetName: x.target.targetName,
      targetAmount: formatRupiah(x.target.targetAmount),
      targetDate: x.target.targetDate ? new Date(x.target.targetDate).toISOString().slice(0, 10) : '',
      notes: x.target.notes || '',
    });
    setShowEditModal(true);
  };

  const handleUpdateTarget = async () => {
    if (!editTargetForm.targetName.trim() || !editTargetForm.targetAmount) {
      showToast('Nama target dan nominal wajib diisi', 'error');
      return;
    }
    try {
      await apiPut(`/api/Membership/admin/savings/targets/${editTargetForm.id}`, {
        targetName: editTargetForm.targetName.trim(),
        targetAmount: parseRupiah(editTargetForm.targetAmount),
        targetDate: editTargetForm.targetDate ? editTargetForm.targetDate : null,
        notes: editTargetForm.notes.trim() || null,
      });
      setShowEditModal(false);
      setEditingTarget(null);
      showToast('Detail target tabungan berhasil diperbarui!');
      await load();
    } catch (e: any) {
      showToast(e?.message || 'Gagal memperbarui target tabungan', 'error');
    }
  };

  const handleDeleteTarget = async (id: number) => {
    if (!confirm('Apakah Anda yakin ingin menghapus target tabungan ini?')) return;
    try {
      await apiDelete(`/api/Membership/admin/savings/targets/${id}`);
      showToast('Target tabungan berhasil dihapus!');
      await load();
    } catch (e: any) {
      showToast(e?.message || 'Gagal menghapus target tabungan', 'error');
    }
  };

  const review = async (id: number, status: string) => {
    try {
      await apiPut(`/api/Membership/admin/savings/transactions/${id}/status`, { status, notes: '', rejectionReason: status === 'Rejected' ? 'Ditolak admin' : '' });
      showToast(`Transaksi berhasil di-${status === 'Approved' ? 'setujui' : 'tolak'}!`);
      await load();
    } catch (e: any) { showToast(e?.message || 'Gagal update transaksi', 'error'); }
  };

  const bulkReview = async (status: string) => {
    if (!selectedTx.length) return;
    try {
      await apiPost('/api/Membership/admin/savings/transactions/bulk-status', { ids: selectedTx, status, notes: 'Bulk action dari UI admin', rejectionReason: status === 'Rejected' ? 'Ditolak admin' : '' });
      showToast(`Bulk transaksi berhasil di-${status === 'Approved' ? 'setujui' : 'tolak'}!`);
      await load();
    } catch (e: any) { showToast(e?.message || 'Gagal bulk update transaksi', 'error'); }
  };

  const manualDeposit = async (targetId: number) => {
    const form = depositForm[targetId] || {};
    try {
      await apiPost(`/api/Membership/admin/savings/targets/${targetId}/manual-deposit`, {
        amount: parseRupiah(form.amount || ''),
        paymentMethod: form.paymentMethod || 'Transfer Rekening Perusahaan',
        referenceNo: form.referenceNo || null,
        notes: form.notes || null,
      });
      setDepositForm((p) => ({ ...p, [targetId]: {} }));
      showToast('Setoran manual berhasil dicatat!');
      await load();
      void reloadTargetTx(targetId);
    } catch (e: any) { showToast(e?.message || 'Gagal input setoran manual', 'error'); }
  };

  const createLedgerTransaction = async (targetId: number) => {
    const form = ledgerForm[targetId] || {};
    try {
      await apiPost(`/api/Membership/admin/savings/targets/${targetId}/transactions`, {
        transactionType: form.transactionType || 'Withdrawal',
        amount: parseRupiah(form.amount || ''),
        paymentMethod: form.paymentMethod || 'Admin Ledger',
        referenceNo: form.referenceNo || null,
        notes: form.notes || null,
      });
      setLedgerForm((p) => ({ ...p, [targetId]: {} }));
      showToast('Transaksi ledger berhasil dicatat!');
      await load();
      void reloadTargetTx(targetId);
    } catch (e: any) { showToast(e?.message || 'Gagal mencatat transaksi', 'error'); }
  };

  const convertTarget = async (target: any) => {
    const form = conversionForm[target.id] || {};
    const programId = Number(form.programId || target.programId || 0);
    const amt = form.packageAmount ? parseRupiah(form.packageAmount) : target.targetAmount;
    try {
      await apiPost(`/api/Membership/admin/savings/targets/${target.id}/convert-to-package`, {
        programId: programId || null,
        packageAmount: amt,
        paxCount: Number(form.paxCount || 1),
        refAgentUsername: form.refAgentUsername || null,
        notes: form.notes || 'Konversi saldo tabungan dari UI admin',
      });
      showToast('Target tabungan berhasil dikonversi ke paket!');
      await load();
      void reloadTargetTx(target.id);
    } catch (e: any) { showToast(e?.message || 'Gagal konversi saldo ke paket', 'error'); }
  };

  const loadReminders = async () => {
    try {
      const res = await apiGet<any>(`/api/Membership/admin/savings/reminders?days=${reminderDays}`);
      setReminders(res?.data ?? []);
      showToast('Pengingat WhatsApp berhasil dimuat!');
    } catch (e: any) { showToast(e?.message || 'Gagal memuat reminder', 'error'); }
  };

  const reloadTargetTx = async (id: number) => {
    try {
      const res = await apiGet<any>(`/api/Membership/admin/savings/targets/${id}/transactions`);
      setTargetTransactions((p) => ({ ...p, [id]: res?.data ?? res ?? [] }));
    } catch (e) {
      console.error('Gagal memuat mutasi target', e);
    }
  };

  const toggleTargetExpand = async (id: number) => {
    const isExpanding = !expandedTargets.includes(id);
    setExpandedTargets((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );

    if (isExpanding) {
      setLoadingTargetTx((p) => ({ ...p, [id]: true }));
      try {
        const res = await apiGet<any>(`/api/Membership/admin/savings/targets/${id}/transactions`);
        setTargetTransactions((p) => ({ ...p, [id]: res?.data ?? res ?? [] }));
      } catch (e) {
        console.error('Gagal memuat mutasi target', e);
      } finally {
        setLoadingTargetTx((p) => ({ ...p, [id]: false }));
      }
    }
  };

  // PRINT FUNCTION: Passbook style per User A4
  const printPassbook = async (target: any) => {
    let txs: any[] = [];
    try {
      const res = await apiGet<any>(`/api/Membership/admin/savings/targets/${target.target.id}/transactions`);
      txs = res?.data ?? res ?? [];
    } catch (e) {
      console.error(e);
      showToast('Gagal memuat transaksi untuk dicetak', 'error');
      return;
    }

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      showToast('Pop-up blocker aktif. Tolong izinkan pop-up untuk mencetak.', 'error');
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
        <title>Buku Tabungan - ${target.user.fullName || target.user.userName}</title>
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
            <div class="meta-item"><span class="meta-label">Nama Jamaah</span><span class="meta-value">: ${target.user.fullName || target.user.userName}</span></div>
            <div class="meta-item"><span class="meta-label">Username / ID</span><span class="meta-value">: ${target.user.userName}</span></div>
            <div class="meta-item"><span class="meta-label">Email</span><span class="meta-value">: ${target.user.email}</span></div>
          </div>
          <div>
            <div class="meta-item"><span class="meta-label">Nama Target</span><span class="meta-value">: ${target.target.targetName}</span></div>
            <div class="meta-item"><span class="meta-label">Nominal Target</span><span class="meta-value">: ${money(target.target.targetAmount)}</span></div>
            <div class="meta-item"><span class="meta-label">Saldo Saat Ini</span><span class="meta-value">: ${money(target.target.currentBalance)}</span></div>
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
            <div class="sig-line">${target.user.fullName || target.user.userName}</div>
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

  // PRINT FUNCTION: Financial Report A4
  const printFinancialReport = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      showToast('Pop-up blocker aktif. Tolong izinkan pop-up untuk mencetak.', 'error');
      return;
    }

    const targetsHtml = targets.map((x: any, idx: number) => {
      return `
        <tr style="border-bottom: 1px solid #e4e4e7; font-size: 10px;">
          <td style="padding: 6px; text-align: center;">${idx + 1}</td>
          <td style="padding: 6px;"><b>${x.user.fullName || x.user.userName}</b><br><span style="color: #71717a; font-size: 9px;">${x.user.email}</span></td>
          <td style="padding: 6px;">${x.target.targetName}</td>
          <td style="padding: 6px; text-align: center;">${x.target.targetType}</td>
          <td style="padding: 6px; text-align: right;">${money(x.target.targetAmount)}</td>
          <td style="padding: 6px; text-align: right; font-weight: bold;">${money(x.target.currentBalance)}</td>
          <td style="padding: 6px; text-align: center;">${x.target.progressPercent}%</td>
          <td style="padding: 6px; text-align: center;">${x.target.status}</td>
        </tr>
      `;
    }).join('');

    const txsHtml = transactions.slice(0, 15).map((x: any, idx: number) => {
      const dateStr = new Date(x.transaction.transactionDate).toLocaleDateString('id-ID', { year: 'numeric', month: '2-digit', day: '2-digit' });
      return `
        <tr style="border-bottom: 1px solid #e4e4e7; font-size: 10px;">
          <td style="padding: 6px; text-align: center;">${idx + 1}</td>
          <td style="padding: 6px; text-align: center;">${dateStr}</td>
          <td style="padding: 6px;">${x.user.fullName || x.user.userName}</td>
          <td style="padding: 6px;">${x.targetName}</td>
          <td style="padding: 6px; text-align: center;">${x.transaction.transactionType}</td>
          <td style="padding: 6px; text-align: right; font-weight: bold;">${money(x.transaction.amount)}</td>
          <td style="padding: 6px; text-align: center;">${x.transaction.paymentMethod || '-'}</td>
          <td style="padding: 6px; text-align: center;">${x.transaction.status}</td>
        </tr>
      `;
    }).join('');

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Laporan Keuangan Tabungan Jamaah</title>
        <meta charset="utf-8">
        <style>
          @page { size: A4; margin: 15mm; }
          body { font-family: 'Segoe UI', Helvetica, Arial, sans-serif; color: #18181b; margin: 0; padding: 0; line-height: 1.4; }
          .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 3px double #18181b; padding-bottom: 8px; margin-bottom: 15px; }
          .logo-area { display: flex; align-items: center; gap: 10px; }
          .logo-text { font-size: 20px; font-weight: 900; color: #047857; letter-spacing: 1px; }
          .company-info { text-align: right; font-size: 9px; color: #71717a; }
          .title { text-align: center; margin-top: 5px; margin-bottom: 15px; text-transform: uppercase; font-size: 14px; font-weight: 800; letter-spacing: 1.5px; border-bottom: 1px solid #e4e4e7; padding-bottom: 5px; }
          
          .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 20px; }
          .stat-card { border: 1px solid #e4e4e7; border-radius: 8px; padding: 10px; background-color: #fafafa; }
          .stat-label { font-size: 9px; text-transform: uppercase; color: #71717a; font-weight: bold; }
          .stat-val { font-size: 13px; font-weight: 900; margin-top: 4px; color: #0f172a; }

          h3 { font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: #047857; margin-bottom: 8px; border-bottom: 1px solid #f4f4f5; padding-bottom: 3px; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
          th { background-color: #f4f4f5; border-bottom: 2px solid #d4d4d8; border-top: 1px solid #e4e4e7; padding: 6px 4px; font-size: 9px; text-transform: uppercase; }
          
          .signatures { display: grid; grid-template-columns: 1fr 1fr; gap: 50px; margin-top: 40px; page-break-inside: avoid; }
          .sig-box { text-align: center; font-size: 11px; }
          .sig-space { height: 60px; }
          .sig-line { border-top: 1px solid #18181b; width: 150px; margin: 0 auto 4px auto; font-weight: bold; }
          .print-btn { background-color: #047857; color: white; border: none; padding: 10px 20px; font-size: 14px; font-weight: bold; border-radius: 8px; cursor: pointer; margin: 20px auto; display: block; }
          @media print {
            .print-btn { display: none; }
            body { padding: 0; }
          }
        </style>
      </head>
      <body>
        <button class="print-btn" onclick="window.print()">Cetak Laporan (Print A4)</button>
        
        <div class="header">
          <div class="logo-area">
            <div class="logo-text">ALFIAN TOUR</div>
          </div>
          <div class="company-info">
            <strong>PT ALFIAN SEJAHTERA ABADI</strong><br>
            Telp/WA: +62 812-3456-7890 | Website: alfiantour.com
          </div>
        </div>

        <div class="title">Laporan Keuangan Tabungan Jamaah</div>

        {/* Stats Summary */}
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-label">Total Dana Mengendap</div>
            <div class="stat-val">${summary ? money(summary.totalBalance) : '-'}</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">Target Jamaah Aktif</div>
            <div class="stat-val">${summary ? `${summary.activeTargetsCount} Jamaah` : '-'}</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">Setoran Butuh Review</div>
            <div class="stat-val">${summary ? `${summary.pendingTransactionsCount} Transaksi` : '-'}</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">Rata-rata Progress</div>
            <div class="stat-val">${summary ? `${summary.averageProgress}%` : '-'}</div>
          </div>
        </div>

        <h3>1. Detail Target Tabungan Jamaah</h3>
        <table>
          <thead>
            <tr>
              <th style="width: 5%">No</th>
              <th>Nama Jamaah</th>
              <th>Nama Target</th>
              <th style="width: 10%">Tipe</th>
              <th style="width: 15%; text-align: right;">Target Nominal</th>
              <th style="width: 15%; text-align: right;">Saldo Mengendap</th>
              <th style="width: 10%">Progress</th>
              <th style="width: 10%">Status</th>
            </tr>
          </thead>
          <tbody>
            ${targetsHtml || '<tr><td colspan="8" style="text-align: center; padding: 10px;">Tidak ada target tabungan yang termuat.</td></tr>'}
          </tbody>
        </table>

        <h3>2. Mutasi Transaksi Terbaru (15 Transaksi Terakhir)</h3>
        <table>
          <thead>
            <tr>
              <th style="width: 5%">No</th>
              <th style="width: 12%">Tanggal</th>
              <th>Nama Jamaah</th>
              <th>Nama Target</th>
              <th style="width: 10%">Mutasi</th>
              <th style="width: 15%; text-align: right;">Nominal</th>
              <th style="width: 15%">Metode</th>
              <th style="width: 10%">Status</th>
            </tr>
          </thead>
          <tbody>
            ${txsHtml || '<tr><td colspan="8" style="text-align: center; padding: 10px;">Tidak ada transaksi yang termuat.</td></tr>'}
          </tbody>
        </table>

        <div class="signatures">
          <div class="sig-box">
            <p>Mengetahui,</p>
            <p style="font-weight: bold; margin-bottom: 5px;">Direktur Utama</p>
            <div class="sig-space"></div>
            <div class="sig-line">H. Alfian</div>
            <span>PT. Alfian Sejahtera Abadi</span>
          </div>
          <div class="sig-box">
            <p>Jakarta, ${new Date().toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
            <p style="font-weight: bold; margin-bottom: 5px;">Manajer Keuangan</p>
            <div class="sig-space"></div>
            <div class="sig-line">Alfian Tour Finance</div>
            <span>Petugas Pemeriksa</span>
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

  return (
    <div className="p-4 space-y-4 animate-fade-up">
      {/* Header section */}
      <div className="bg-white border rounded-3xl p-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-extrabold g-text">Kelola Tabungan Jamaah</h1>
          <p className="text-xs text-zinc-500 mt-1">Review setoran, ledger saldo, reminder, dan konversi paket.</p>
        </div>
        <div className="flex gap-2">
          <button
            className="rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 px-4 py-2.5 text-xs font-bold text-zinc-700 shadow-sm transition-colors flex items-center gap-1.5"
            onClick={() => setShowChartModal(true)}
          >
            <span>📊</span>
            <span>Grafik Progress Terbaik</span>
          </button>
          <button
            className="rounded-xl bg-primary-600 hover:bg-primary-700 px-4 py-2.5 text-xs font-bold text-white shadow-md transition-colors"
            onClick={() => setShowCreateModal(true)}
          >
            + Buat Target Tabungan
          </button>
        </div>
      </div>

      {error ? <div className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-xl p-3">{error}</div> : null}

      {/* 1. Dashboard Ringkasan Statistik */}
      {summary && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white border border-zinc-200 rounded-3xl p-4 shadow-sm flex flex-col justify-between">
            <span className="text-[10px] text-zinc-400 font-extrabold uppercase tracking-wider">Total Dana Mengendap</span>
            <span className="text-base lg:text-lg font-black text-zinc-900 mt-1">{money(summary.totalBalance)}</span>
          </div>
          <div className="bg-white border border-zinc-200 rounded-3xl p-4 shadow-sm flex flex-col justify-between">
            <span className="text-[10px] text-zinc-400 font-extrabold uppercase tracking-wider">Target Jamaah Aktif</span>
            <span className="text-base lg:text-lg font-black text-zinc-950 mt-1">{summary.activeTargetsCount} Jamaah</span>
          </div>
          <div className="bg-white border border-zinc-200 rounded-3xl p-4 shadow-sm flex flex-col justify-between">
            <span className="text-[10px] text-zinc-400 font-extrabold uppercase tracking-wider">Setoran Butuh Review</span>
            <span className={`text-base lg:text-lg font-black mt-1 flex items-center gap-1.5 ${
              summary.pendingTransactionsCount > 0 ? 'text-amber-600 animate-pulse' : 'text-zinc-955'
            }`}>
              <span>{summary.pendingTransactionsCount} Transaksi</span>
              {summary.pendingTransactionsCount > 0 && <span className="w-2.5 h-2.5 rounded-full bg-amber-500 block" />}
            </span>
          </div>
          <div className="bg-white border border-zinc-200 rounded-3xl p-4 shadow-sm flex flex-col justify-between">
            <span className="text-[10px] text-zinc-400 font-extrabold uppercase tracking-wider">Rata-rata Progress</span>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-base lg:text-lg font-black text-zinc-955">{summary.averageProgress}%</span>
              <span className="flex-1 bg-zinc-100 rounded-full h-2 overflow-hidden relative">
                <span className="bg-emerald-500 h-full block" style={{ width: `${summary.averageProgress}%` }} />
              </span>
            </div>
          </div>
        </div>
      )}

      {/* FILTER & EXPORT ACTIONS */}
      <div className="bg-white border rounded-3xl p-4 space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <input 
            className="rounded-xl border px-3 py-2 text-sm flex-1 min-w-[200px]" 
            placeholder="Cari jamaah / target..." 
            value={search} 
            onChange={(e) => setSearch(e.target.value)} 
          />
          <button 
            className="rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white px-4 py-2 text-xs font-bold transition-colors" 
            onClick={() => { setTargetPage(1); void load(); }}
          >
            Cari
          </button>
          <button 
            className="rounded-xl border px-3 py-2 text-xs font-semibold bg-zinc-50 hover:bg-zinc-100 transition-colors" 
            onClick={() => setShowMoreFilters(!showMoreFilters)}
          >
            {showMoreFilters ? 'Sembunyikan Filter' : 'Filter & Aksi Lainnya'}
          </button>
        </div>

        {showMoreFilters && (
          <div className="pt-3 border-t border-dashed border-zinc-200 flex flex-wrap gap-2 animate-fade-down duration-200">
            <select 
              className="rounded-xl border px-3 py-2 text-sm bg-white" 
              value={targetStatus} 
              onChange={(e) => { setTargetStatus(e.target.value); setTargetPage(1); }}
            >
              <option value="">Semua status target</option>
              {['Active', 'Completed', 'Closed', 'Cancelled'].map((x) => <option key={x}>{x}</option>)}
            </select>

            <div className="h-9 w-px bg-zinc-200 mx-1" />

            <button className="rounded-xl border px-3 py-2 text-xs font-semibold hover:bg-zinc-50" onClick={() => openMembershipExport('savings-targets', 'xlsx')}>Export Target Excel</button>
            <button className="rounded-xl border px-3 py-2 text-xs font-semibold hover:bg-zinc-50" onClick={() => openMembershipExport('savings-targets', 'pdf')}>Export Target PDF</button>
            <button className="rounded-xl border px-3 py-2 text-xs font-semibold hover:bg-zinc-50" onClick={() => openMembershipExport('savings-transactions', 'xlsx')}>Export Transaksi Excel</button>
            <button className="rounded-xl border px-3 py-2 text-xs font-semibold hover:bg-zinc-50" onClick={() => openMembershipExport('savings-transactions', 'pdf')}>Export Transaksi PDF</button>

            <div className="h-9 w-px bg-zinc-200 mx-1" />

            <button className="rounded-xl border px-3 py-2 text-xs font-bold bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100 transition-colors" onClick={printFinancialReport}>🖨️ Cetak Laporan A4</button>

            <div className="h-9 w-px bg-zinc-200 mx-1" />

            <select className="rounded-xl border px-3 py-2 text-sm bg-white" value={reminderDays} onChange={(e) => setReminderDays(Number(e.target.value))}>{[30, 60, 90].map((x) => <option key={x} value={x}>Reminder {x} hari</option>)}</select>
            <button className="rounded-xl bg-emerald-600 hover:bg-emerald-700 px-3 py-2 text-xs font-semibold text-white transition-colors" onClick={loadReminders}>Cek Reminder WA</button>
          </div>
        )}
      </div>

      {reminders.length ? <div className="bg-white border rounded-3xl p-5 space-y-2"><h2 className="text-sm font-bold">Reminder WhatsApp</h2>{reminders.map((x) => <div key={x.id} className="rounded-xl border p-3 text-xs space-y-2"><div className="flex justify-between"><b>{x.user.fullName || x.user.userName}</b><span>{x.inactiveDays} hari</span></div><div>{x.targetName} • {money(x.currentBalance)} / {money(x.targetAmount)}</div><div className="bg-zinc-50 p-2 rounded-lg">{x.message}</div>{x.whatsappUrl ? <a className="inline-flex rounded-lg bg-emerald-600 px-3 py-1.5 text-white" href={x.whatsappUrl} target="_blank" rel="noreferrer">Kirim WhatsApp</a> : <span className="text-red-600">Nomor belum tersedia</span>}</div>)}</div> : null}

      {/* TWO-COLUMN LAYOUT ON DESKTOP */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Target Tabungan (7/12) */}
        <div className="lg:col-span-7 space-y-3">
          <div className="bg-white border rounded-3xl p-4 flex justify-between items-center">
            <h2 className="text-sm font-extrabold text-zinc-900">Daftar Target Tabungan Jamaah ({targets.length})</h2>
          </div>
          
          <div className="space-y-3">
            {targets.map((x) => {
              const targetId = x.target.id;
              const isExpanded = expandedTargets.includes(targetId);
              const outlineColor = getOutlineColor(targetId);
              const dep = depositForm[targetId] || {};
              const ledger = ledgerForm[targetId] || {};
              const conversion = conversionForm[targetId] || {};

              return (
                <div key={targetId} className={`bg-white border-2 ${outlineColor} rounded-3xl p-5 shadow-sm space-y-3 transition-all duration-200 hover:shadow-md`}>
                  <div className="flex justify-between items-start gap-4">
                    <div>
                      <h3 className="font-extrabold text-sm text-zinc-900 flex flex-wrap items-center gap-2">
                        <span>{x.user.fullName || x.user.userName}</span>
                        <span className="text-xs text-zinc-400 font-normal">({x.user.email})</span>
                      </h3>
                      <p className="text-xs font-bold text-primary-600 mt-1">{x.target.targetName}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                        x.target.status === 'Active' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                        x.target.status === 'Completed' ? 'bg-sky-50 text-sky-700 border border-sky-200' :
                        x.target.status === 'Closed' ? 'bg-zinc-100 text-zinc-600 border border-zinc-200' :
                        'bg-red-50 text-red-700 border border-red-200'
                      }`}>
                        {x.target.status}
                      </span>
                      <button
                        onClick={() => toggleTargetExpand(targetId)}
                        className="rounded-lg border bg-zinc-50 hover:bg-zinc-100 px-3 py-1 text-xs font-bold transition-colors flex items-center gap-1"
                      >
                        <span>{isExpanded ? 'Sembunyikan' : 'Kelola'}</span>
                        <span className="text-[10px]">{isExpanded ? '▲' : '▼'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Collapsed view summary */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-zinc-50/50 rounded-2xl p-3 border border-zinc-100 text-xs">
                    <div>
                      <div className="text-[10px] text-zinc-400 font-bold uppercase">Saldo Saat Ini</div>
                      <div className="font-extrabold text-zinc-950 text-sm mt-0.5">{money(x.target.currentBalance)}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-zinc-400 font-bold uppercase">Target Nominal</div>
                      <div className="font-semibold text-zinc-700 text-sm mt-0.5">{money(x.target.targetAmount)}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-zinc-400 font-bold uppercase">Progress</div>
                      <div className="font-bold text-zinc-700 mt-1 flex items-center gap-1.5">
                        <span className="w-12 bg-zinc-200 rounded-full h-1.5 overflow-hidden block">
                          <span className="bg-primary-600 h-full block" style={{ width: `${Math.min(100, x.target.progressPercent)}%` }} />
                        </span>
                        <span>{x.target.progressPercent}%</span>
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] text-zinc-400 font-bold uppercase">Jenis Target</div>
                      <div className="font-medium text-zinc-600 mt-0.5">{x.target.targetType}</div>
                    </div>
                  </div>

                  {/* Detailed management section */}
                  {isExpanded && (
                    <div className="space-y-4 pt-3 border-t border-dashed border-zinc-200 animate-fade-down duration-200">
                      
                      {/* Mutasi Log Khusus Target ini */}
                      <div className="border-t pt-3 space-y-2">
                        <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Riwayat Mutasi Target Ini</div>
                        {loadingTargetTx[targetId] ? (
                          <div className="text-[10px] text-zinc-500">Memuat mutasi...</div>
                        ) : !targetTransactions[targetId] || targetTransactions[targetId].length === 0 ? (
                          <div className="text-[10px] text-zinc-400 italic">Belum ada mutasi transaksi untuk target ini.</div>
                        ) : (
                          <div className="border rounded-2xl overflow-hidden divide-y divide-zinc-100 max-h-40 overflow-y-auto bg-zinc-50/20">
                            {targetTransactions[targetId].map((tx: any) => (
                              <div key={tx.id} className="p-2 text-[10px] flex justify-between items-center hover:bg-zinc-50">
                                <div>
                                  <div className="font-bold text-zinc-700">{tx.transactionType} • <span className="text-zinc-400 font-normal">{new Date(tx.transactionDate).toLocaleDateString('id-ID')}</span></div>
                                  <div className="text-zinc-500 text-[9px]">{tx.paymentMethod || 'Metode -'} {tx.referenceNo ? `| Ref: ${tx.referenceNo}` : ''}</div>
                                  {tx.notes && <div className="text-zinc-400 italic text-[9px] mt-0.5">Catatan: {tx.notes}</div>}
                                </div>
                                <div className="text-right">
                                  <div className={`font-bold ${tx.transactionType === 'Deposit' ? 'text-emerald-600' : tx.transactionType === 'Withdrawal' ? 'text-red-600' : 'text-zinc-600'}`}>
                                    {tx.transactionType === 'Withdrawal' ? '-' : '+'}{money(tx.amount)}
                                  </div>
                                  <span className={`text-[8px] font-extrabold uppercase px-1 rounded ${
                                    tx.status === 'Approved' || tx.status === 'Posted' ? 'bg-emerald-100 text-emerald-800' :
                                    tx.status === 'Pending' ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800'
                                  }`}>{tx.status}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="border-t pt-3 space-y-2">
                        <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Input Setoran Manual (Membayar Saldo)</div>
                        <div className="grid md:grid-cols-4 gap-2">
                          <input 
                            className="rounded-lg border px-3 py-2 text-xs" 
                            type="text" 
                            placeholder="Nominal Setoran (Format Rupiah)" 
                            value={dep.amount || ''} 
                            onChange={(e) => setDepositForm((p) => ({
                              ...p,
                              [targetId]: { ...dep, amount: formatRupiah(e.target.value) }
                            }))} 
                          />
                          <input className="rounded-lg border px-3 py-2 text-xs" placeholder="Metode bayar" value={dep.paymentMethod || ''} onChange={(e) => setDepositForm((p) => ({ ...p, [targetId]: { ...dep, paymentMethod: e.target.value } }))} />
                          <input className="rounded-lg border px-3 py-2 text-xs" placeholder="Referensi" value={dep.referenceNo || ''} onChange={(e) => setDepositForm((p) => ({ ...p, [targetId]: { ...dep, referenceNo: e.target.value } }))} />
                          <button disabled={x.target.status !== 'Active'} className="rounded-lg bg-primary-600 hover:bg-primary-700 text-xs font-semibold px-3 py-2 text-white disabled:opacity-40 transition-colors" onClick={() => manualDeposit(x.target.id)}>Input Setoran</button>
                        </div>
                      </div>

                      <div className="border-t pt-3 space-y-2">
                        <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Ledger Mutasi (Withdrawal / Adjustment / Deposit)</div>
                        <div className="grid md:grid-cols-5 gap-2">
                          <select className="rounded-lg border px-3 py-2 text-xs bg-white font-medium" value={ledger.transactionType || 'Withdrawal'} onChange={(e) => setLedgerForm((p) => ({ ...p, [targetId]: { ...ledger, transactionType: e.target.value } }))}><option>Withdrawal</option><option>Adjustment</option><option>Deposit</option></select>
                          <input 
                            className="rounded-lg border px-3 py-2 text-xs" 
                            type="text" 
                            placeholder="Nominal (+/- Rupiah)" 
                            value={ledger.amount || ''} 
                            onChange={(e) => setLedgerForm((p) => ({
                              ...p,
                              [targetId]: { ...ledger, amount: formatRupiah(e.target.value) }
                            }))} 
                          />
                          <input className="rounded-lg border px-3 py-2 text-xs" placeholder="Referensi ledger" value={ledger.referenceNo || ''} onChange={(e) => setLedgerForm((p) => ({ ...p, [targetId]: { ...ledger, referenceNo: e.target.value } }))} />
                          <input className="rounded-lg border px-3 py-2 text-xs" placeholder="Catatan ledger" value={ledger.notes || ''} onChange={(e) => setLedgerForm((p) => ({ ...p, [targetId]: { ...ledger, notes: e.target.value } }))} />
                          <button className="rounded-lg border hover:bg-zinc-50 px-3 py-2 text-xs font-semibold transition-colors" onClick={() => createLedgerTransaction(x.target.id)}>Catat Ledger</button>
                        </div>
                      </div>

                      <div className="border-t pt-3 space-y-2">
                        <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Konversi Ke Paket Booking Travel</div>
                        <div className="grid md:grid-cols-4 gap-2">
                          <select className="rounded-lg border px-3 py-2 text-xs bg-white font-medium" value={conversion.programId || x.target.programId || ''} onChange={(e) => setConversionForm((p) => ({ ...p, [targetId]: { ...conversion, programId: e.target.value } }))}><option value="">Pilih program konversi</option>{programs.map((p) => <option key={p.id} value={p.id}>{p.title || p.name}</option>)}</select>
                          <input 
                            className="rounded-lg border px-3 py-2 text-xs" 
                            type="text" 
                            placeholder="Nominal Paket (Rupiah)" 
                            value={conversion.packageAmount || formatRupiah(x.target.targetAmount)} 
                            onChange={(e) => setConversionForm((p) => ({
                              ...p,
                              [targetId]: { ...conversion, packageAmount: formatRupiah(e.target.value) }
                            }))} 
                          />
                          <input className="rounded-lg border px-3 py-2 text-xs" type="number" min="1" placeholder="Jumlah pax" value={conversion.paxCount || 1} onChange={(e) => setConversionForm((p) => ({ ...p, [targetId]: { ...conversion, paxCount: e.target.value } }))} />
                          <button disabled={x.target.status !== 'Active' || Number(x.target.currentBalance || 0) < parseRupiah(conversion.packageAmount || String(x.target.targetAmount))} className="rounded-lg border text-emerald-700 hover:bg-emerald-50 px-3 py-2 text-xs font-semibold disabled:opacity-40 transition-colors" onClick={() => convertTarget(x.target)}>Konversi ke Paket</button>
                        </div>
                      </div>

                      <div className="border-t pt-3 flex flex-wrap items-center justify-between gap-2">
                        <div className="flex flex-wrap gap-1.5 items-center">
                          <span className="text-[10px] text-zinc-400 font-bold uppercase mr-1">Status:</span>
                          {['Active', 'Completed', 'Closed', 'Cancelled'].map((s) => (
                            <button
                              key={s}
                              className={`rounded-lg border px-2.5 py-1 text-[11px] font-semibold transition-colors ${x.target.status === s ? 'bg-zinc-800 text-white border-zinc-800' : 'hover:bg-zinc-50'}`}
                              onClick={async () => {
                                try {
                                  await apiPut(`/api/Membership/admin/savings/targets/${x.target.id}/status`, { status: s, notes: '' });
                                  showToast('Status target tabungan berhasil diperbarui!');
                                  await load();
                                } catch (e: any) {
                                  showToast(e?.message || 'Gagal update status target', 'error');
                                }
                              }}
                            >
                              {s}
                            </button>
                          ))}
                        </div>
                        <div className="flex gap-1.5">
                          <button
                            className="rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-1.5 text-emerald-700 font-bold hover:bg-emerald-100 transition-colors text-[11px] flex items-center gap-1"
                            onClick={() => printPassbook(x)}
                          >
                            <span>🖨️</span>
                            <span>Cetak Buku</span>
                          </button>
                          <button
                            className="rounded-lg border border-primary-300 bg-primary-50 px-3 py-1.5 text-primary-700 font-bold hover:bg-primary-100 transition-colors text-[11px]"
                            onClick={() => startEditTarget(x)}
                          >
                            Edit Detail
                          </button>
                          <button
                            className="rounded-lg border border-red-300 bg-red-50 px-3 py-1.5 text-red-700 font-bold hover:bg-red-100 transition-colors text-[11px]"
                            onClick={() => handleDeleteTarget(x.target.id)}
                          >
                            Hapus
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          <div className="flex justify-between text-xs pt-2"><button disabled={targetPage <= 1} className="border bg-white rounded-lg px-3 py-1.5 disabled:opacity-40 hover:bg-zinc-50" onClick={() => setTargetPage((p) => p - 1)}>Sebelumnya</button><span>{targetPage} / {targetPages}</span><button disabled={targetPage >= targetPages} className="border bg-white rounded-lg px-3 py-1.5 disabled:opacity-40 hover:bg-zinc-50" onClick={() => setTargetPage((p) => p + 1)}>Berikutnya</button></div>
        </div>

        {/* Right Column: Transaksi Setoran & Penarikan Tabungan (5/12) */}
        <div className="lg:col-span-5 bg-white border rounded-3xl p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-3">
            <h2 className="text-sm font-extrabold text-zinc-900">Transaksi Setoran & Penarikan</h2>
            <select 
              className="rounded-xl border px-3 py-1.5 text-xs bg-white font-medium" 
              value={transactionStatus} 
              onChange={(e) => { setTransactionStatus(e.target.value); setTransactionPage(1); }}
            >
              <option value="">Semua status transaksi</option>
              {['Pending', 'Approved', 'Posted', 'Rejected', 'Cancelled'].map((x) => <option key={x}>{x}</option>)}
            </select>
          </div>
          
          {selectedTx.length ? (
            <div className="rounded-xl bg-zinc-50 border p-3 text-xs flex items-center justify-between gap-2 animate-fade-in">
              <span className="font-bold text-zinc-700">{selectedTx.length} terpilih</span>
              <div className="flex gap-1">
                <button className="rounded-lg bg-emerald-600 hover:bg-emerald-700 px-3 py-1.5 text-white font-bold transition-colors" onClick={() => bulkReview('Approved')}>Approve</button>
                <button className="rounded-lg bg-red-600 hover:bg-red-700 px-3 py-1.5 text-white font-bold transition-colors" onClick={() => bulkReview('Rejected')}>Reject</button>
              </div>
            </div>
          ) : null}
          
          <div className="space-y-3 divide-y divide-zinc-100 max-h-[70vh] overflow-y-auto pr-1">
            {transactions.map((x) => (
              <div key={x.transaction.id} className="pt-3 first:pt-0 text-xs space-y-2">
                <div className="flex justify-between gap-2 items-start">
                  <label className="flex gap-2 font-bold text-zinc-900 cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="rounded border-zinc-300 mt-0.5" 
                      checked={selectedTx.includes(x.transaction.id)} 
                      onChange={() => setSelectedTx((p) => p.includes(x.transaction.id) ? p.filter((id) => id !== x.transaction.id) : [...p, x.transaction.id])} 
                    />
                    <span>{x.user.fullName || x.user.userName}</span>
                  </label>
                  <b className="text-zinc-950">{money(x.transaction.amount)}</b>
                </div>
                
                <div className="flex justify-between text-zinc-500 text-[11px]">
                  <span>{x.targetName}</span>
                  <span className="font-medium text-primary-600">{x.transaction.transactionType}</span>
                </div>

                <div className="flex justify-between items-center text-[10px]">
                  <span className="text-zinc-400">Saldo: {money(x.transaction.balanceAfter)} | {x.transaction.paymentMethod || 'Metode -'}</span>
                  <span className={`px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                    x.transaction.status === 'Approved' || x.transaction.status === 'Posted' ? 'bg-emerald-50 text-emerald-700' :
                    x.transaction.status === 'Pending' ? 'bg-amber-50 text-amber-700' :
                    'bg-red-50 text-red-700'
                  }`}>
                    {x.transaction.status}
                  </span>
                </div>

                {x.transaction.referenceNo && (
                  <div className="text-[10px] text-zinc-400">Ref No: <span className="font-mono">{x.transaction.referenceNo}</span></div>
                )}
                {x.transaction.notes && (
                  <div className="text-[10px] text-zinc-500 italic bg-zinc-50 p-1.5 rounded-lg border border-zinc-100">Catatan: {x.transaction.notes}</div>
                )}
                {x.transaction.rejectionReason && (
                  <div className="text-[10px] text-red-600">Alasan Tolak: {x.transaction.rejectionReason}</div>
                )}

                <div className="flex flex-wrap gap-2 pt-1.5">
                  {x.transaction.proofUrl ? (
                    <a className="rounded-lg border hover:bg-zinc-50 px-3 py-1.5 font-semibold transition-colors" href={absoluteUrl(x.transaction.proofUrl)} target="_blank" rel="noreferrer">Bukti Transfer</a>
                  ) : null}
                  {x.transaction.status === 'Pending' ? (
                    <>
                      <button className="rounded-lg bg-emerald-600 hover:bg-emerald-700 px-3 py-1.5 text-white font-bold transition-colors" onClick={() => review(x.transaction.id, 'Approved')}>Approve</button>
                      <button className="rounded-lg bg-red-600 hover:bg-red-700 px-3 py-1.5 text-white font-bold transition-colors" onClick={() => review(x.transaction.id, 'Rejected')}>Reject</button>
                    </>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
          
          <div className="flex justify-between text-xs pt-3 border-t border-zinc-100"><button disabled={transactionPage <= 1} className="border rounded-lg px-3 py-1.5 disabled:opacity-40 hover:bg-zinc-50" onClick={() => setTransactionPage((p) => p - 1)}>Sebelumnya</button><span>{transactionPage} / {transactionPages}</span><button disabled={transactionPage >= transactionPages} className="border rounded-lg px-3 py-1.5 disabled:opacity-40 hover:bg-zinc-50" onClick={() => setTransactionPage((p) => p + 1)}>Berikutnya</button></div>
        </div>

      </div>

      {/* GRAPH CHART MODAL */}
      {showChartModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-900/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="relative bg-white rounded-3xl p-6 max-w-2xl w-full space-y-5 shadow-2xl my-auto animate-scale-up">
            <div className="flex justify-between items-center border-b pb-3">
              <div>
                <h3 className="text-base font-extrabold text-zinc-900">Grafik Progress Kemajuan Tabungan Terbanyak</h3>
                <p className="text-xs text-zinc-500 mt-0.5">Daftar jamaah dengan persentase target tabungan paling mendekati selesai.</p>
              </div>
              <button 
                type="button" 
                className="text-zinc-400 hover:text-zinc-600 text-lg font-bold p-1"
                onClick={() => setShowChartModal(false)}
              >
                ×
              </button>
            </div>

            {/* Chart Body */}
            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
              {targets.length === 0 ? (
                <div className="text-center text-xs text-zinc-400 py-10">Belum ada target tabungan untuk ditampilkan.</div>
              ) : (
                [...targets]
                  .sort((a, b) => Number(b.target.progressPercent || 0) - Number(a.target.progressPercent || 0))
                  .map((x, index) => {
                    const progress = Math.min(100, Number(x.target.progressPercent || 0));
                    const barColor = index === 0 ? 'from-emerald-500 to-teal-600 animate-pulse' :
                                     index === 1 ? 'from-primary-500 to-indigo-600' :
                                     index === 2 ? 'from-indigo-500 to-purple-600' :
                                     'from-zinc-500 to-slate-600';
                    return (
                      <div key={x.target.id} className="space-y-1.5 p-3 rounded-2xl border border-zinc-100 hover:bg-zinc-50 transition-colors">
                        <div className="flex justify-between items-center text-xs">
                          <div className="font-bold text-zinc-800 flex items-center gap-1.5">
                            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-zinc-100 font-extrabold text-[10px] text-zinc-600">{index + 1}</span>
                            <span>{x.user.fullName || x.user.userName}</span>
                            <span className="text-[10px] text-zinc-400 font-normal">({x.target.targetName})</span>
                          </div>
                          <span className="font-extrabold text-zinc-950">{progress}%</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="flex-1 bg-zinc-100 rounded-xl h-6 overflow-hidden relative border border-zinc-200/50 shadow-inner">
                            <div 
                              className={`bg-gradient-to-r ${barColor} h-full rounded-xl transition-all duration-1000 ease-out`}
                              style={{ width: `${progress}%` }}
                            />
                            <span className="absolute inset-0 flex items-center px-3 font-bold text-[9px] text-zinc-900 pointer-events-none drop-shadow-sm">
                              {money(x.target.currentBalance)} / {money(x.target.targetAmount)}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })
              )}
            </div>

            <div className="flex justify-end pt-2 border-t">
              <button
                type="button"
                className="rounded-xl border px-5 py-2.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 transition-colors"
                onClick={() => setShowChartModal(false)}
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CREATE MODAL - Centered in middle of screen */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-900/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="relative bg-white rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl my-auto animate-scale-up">
            <h3 className="text-base font-extrabold text-zinc-900">Buat Target Tabungan Jamaah</h3>
            
            {/* User Selection */}
            <div className="space-y-1">
              <label className="block text-xs font-bold text-zinc-700">Cari Jamaah / User *</label>
              <div className="flex gap-2">
                <input
                  className="rounded-lg border px-3 py-2 text-xs flex-1"
                  placeholder="Nama / Email / Username"
                  value={userSearchTerm}
                  onChange={(e) => setUserSearchTerm(e.target.value)}
                />
                <button
                  type="button"
                  className="rounded-lg border px-3 py-2 text-xs bg-zinc-100 hover:bg-zinc-200 font-semibold"
                  onClick={() => void searchUsers(userSearchTerm)}
                >
                  Cari
                </button>
              </div>
              {searchingUsers && <div className="text-[10px] text-zinc-500">Mencari...</div>}
              {userList.length > 0 && (
                <div className="border rounded-lg max-h-40 overflow-y-auto divide-y divide-zinc-100 bg-white mt-1">
                  {userList.map((u) => (
                    <button
                      key={u.id}
                      type="button"
                      className="w-full text-left px-3 py-2 text-xs hover:bg-zinc-50 flex flex-col"
                      onClick={() => {
                        setSelectedUser(u);
                        setUserList([]);
                        setUserSearchTerm('');
                      }}
                    >
                      <span className="font-bold">{u.fullName || u.userName}</span>
                      <span className="text-zinc-500 text-[10px]">{u.email}</span>
                    </button>
                  ))}
                </div>
              )}
              {selectedUser && (
                <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-2 text-xs flex justify-between items-center mt-1">
                  <div>
                    Jamaah Terpilih: <b className="text-emerald-800">{selectedUser.fullName || selectedUser.userName}</b>
                  </div>
                  <button type="button" className="text-red-600 hover:text-red-800 font-bold" onClick={() => setSelectedUser(null)}>Hapus</button>
                </div>
              )}
            </div>

            {/* Target Fields */}
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="block text-xs font-bold text-zinc-700">Nama Target Tabungan *</label>
                <input
                  className="rounded-lg border px-3 py-2 text-xs w-full"
                  placeholder="Contoh: Tabungan Haji Akbar 2027"
                  value={newTargetForm.targetName}
                  onChange={(e) => setNewTargetForm((p) => ({ ...p, targetName: e.target.value }))}
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-zinc-700">Nominal Target (Rupiah) *</label>
                <input
                  className="rounded-lg border px-3 py-2 text-xs w-full"
                  type="text"
                  placeholder="Contoh: Rp 45.000.000"
                  value={newTargetForm.targetAmount}
                  onChange={(e) => setNewTargetForm((p) => ({ ...p, targetAmount: formatRupiah(e.target.value) }))}
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-zinc-700">Jenis Target</label>
                <select
                  className="rounded-lg border px-3 py-2 text-xs w-full bg-white font-medium"
                  value={newTargetForm.targetType}
                  onChange={(e) => setNewTargetForm((p) => ({ ...p, targetType: e.target.value }))}
                >
                  <option value="Manual">Manual (Bebas / Tanpa Kaitan)</option>
                  <option value="Program">Program (Paket Travel / Umroh)</option>
                  <option value="OtherProduct">Other Product (Komersial Lain)</option>
                  <option value="TravelGeneralProduct">Travel General Product (Travel Umum)</option>
                </select>
              </div>

              {newTargetForm.targetType === 'Program' && (
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-zinc-700">Pilih Program / Paket</label>
                  <select
                    className="rounded-lg border px-3 py-2 text-xs w-full bg-white font-medium"
                    value={newTargetForm.programId}
                    onChange={(e) => setNewTargetForm((p) => ({ ...p, programId: e.target.value }))}
                  >
                    <option value="">-- Pilih Program --</option>
                    {programs.map((p) => (
                      <option key={p.id} value={p.id}>{p.title || p.name}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="space-y-1">
                <label className="block text-xs font-bold text-zinc-700">Batas Waktu (Target Date)</label>
                <input
                  className="rounded-lg border px-3 py-2 text-xs w-full"
                  type="date"
                  value={newTargetForm.targetDate}
                  onChange={(e) => setNewTargetForm((p) => ({ ...p, targetDate: e.target.value }))}
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-zinc-700">Catatan</label>
                <textarea
                  className="rounded-lg border px-3 py-2 text-xs w-full"
                  placeholder="Catatan tambahan..."
                  rows={2}
                  value={newTargetForm.notes}
                  onChange={(e) => setNewTargetForm((p) => ({ ...p, notes: e.target.value }))}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t">
              <button
                type="button"
                className="rounded-xl border px-4 py-2 text-xs font-semibold text-zinc-600 hover:bg-zinc-50"
                onClick={() => {
                  setShowCreateModal(false);
                  setSelectedUser(null);
                }}
              >
                Batal
              </button>
              <button
                type="button"
                className="rounded-xl bg-primary-600 hover:bg-primary-700 px-4 py-2 text-xs font-semibold text-white shadow-sm transition-colors"
                onClick={handleCreateTarget}
              >
                Buat Target
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT MODAL - Centered in middle of screen */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-900/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="relative bg-white rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl my-auto animate-scale-up">
            <h3 className="text-base font-extrabold text-zinc-900">Edit Detail Target Tabungan</h3>
            {editingTarget && (
              <div className="text-xs text-zinc-500">
                Jamaah: <b>{editingTarget.user.fullName || editingTarget.user.userName}</b>
              </div>
            )}

            <div className="space-y-3">
              <div className="space-y-1">
                <label className="block text-xs font-bold text-zinc-700">Nama Target Tabungan *</label>
                <input
                  className="rounded-lg border px-3 py-2 text-xs w-full"
                  value={editTargetForm.targetName}
                  onChange={(e) => setEditTargetForm((p) => ({ ...p, targetName: e.target.value }))}
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-zinc-700">Nominal Target (Rupiah) *</label>
                <input
                  className="rounded-lg border px-3 py-2 text-xs w-full"
                  type="text"
                  value={editTargetForm.targetAmount}
                  onChange={(e) => setEditTargetForm((p) => ({ ...p, targetAmount: formatRupiah(e.target.value) }))}
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-zinc-700">Batas Waktu (Target Date)</label>
                <input
                  className="rounded-lg border px-3 py-2 text-xs w-full"
                  type="date"
                  value={editTargetForm.targetDate}
                  onChange={(e) => setEditTargetForm((p) => ({ ...p, targetDate: e.target.value }))}
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-zinc-700">Catatan</label>
                <textarea
                  className="rounded-lg border px-3 py-2 text-xs w-full"
                  rows={2}
                  value={editTargetForm.notes}
                  onChange={(e) => setEditTargetForm((p) => ({ ...p, notes: e.target.value }))}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t">
              <button
                type="button"
                className="rounded-xl border px-4 py-2 text-xs font-semibold text-zinc-600 hover:bg-zinc-50"
                onClick={() => {
                  setShowEditModal(false);
                  setEditingTarget(null);
                }}
              >
                Batal
              </button>
              <button
                type="button"
                className="rounded-xl bg-primary-600 hover:bg-primary-700 px-4 py-2 text-xs font-semibold text-white shadow-sm transition-colors"
                onClick={handleUpdateTarget}
              >
                Simpan Perubahan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 animate-bounce">
          <div className={`rounded-2xl px-4 py-3 shadow-xl text-xs font-bold text-white flex items-center gap-2 ${
            toast.type === 'success' ? 'bg-emerald-600' : 'bg-red-600'
          }`}>
            <span>{toast.type === 'success' ? '✓' : '✗'}</span>
            <span>{toast.message}</span>
          </div>
        </div>
      )}
    </div>
  );
}
