'use client';

import { useEffect, useRef, useState, useMemo } from 'react';
import { Link } from '@/i18n/routing-patch';
import { ModalShell } from '@/components/ui/ModalShell';
import { useToast } from '@/components/Toast';
import { apiGet, apiPost, getApiBaseUrl, getAuthToken } from '@/lib/api-client';
import { useAuth } from '@/lib/auth';

const money = (v: unknown) => `Rp ${Number(v || 0).toLocaleString('id-ID')}`;

const formatRupiah = (value: any) => {
  if (value === undefined || value === null) return '';
  const numString = String(value).replace(/[^0-9]/g, '');
  if (!numString) return '';
  return `Rp ${Number(numString).toLocaleString('id-ID')}`;
};

const parseRupiah = (formattedValue: any) => {
  const cleanString = String(formattedValue || '').replace(/[^0-9]/g, '');
  return Number(cleanString) || 0;
};

const absoluteUrl = (value?: string | null) => {
  if (!value) return '';
  if (/^https?:\/\//i.test(value)) return value;
  return `${getApiBaseUrl()}${value.startsWith('/') ? '' : '/'}${value}`;
};

const fmtDate = (d?: string | null, opts?: Intl.DateTimeFormatOptions) =>
  d ? new Date(d).toLocaleDateString('id-ID', opts ?? { year: 'numeric', month: 'short', day: 'numeric' }) : '-';

const ledgerTypeLabel = (type: string, direction: string) => {
  const map: Record<string, string> = {
    Funding: '💰 Pendanaan',
    Revenue: '📈 Bagi Hasil',
    Withdraw: '💸 Penarikan',
    Adjustment: '🔧 Koreksi',
    Refund: '↩️ Refund',
    ManualCorrection: '✏️ Koreksi Manual',
  };
  return map[type] ?? type;
};

const outlineColors = [
  'border-sky-200 hover:border-sky-400',
  'border-emerald-200 hover:border-emerald-400',
  'border-indigo-200 hover:border-indigo-400',
  'border-amber-200 hover:border-amber-400',
  'border-rose-200 hover:border-rose-400',
  'border-violet-200 hover:border-violet-400',
  'border-teal-200 hover:border-teal-400',
];
const getOutlineColor = (id: number) => outlineColors[id % outlineColors.length];

// Phase 3 — Investor Badge Level
const getInvestorBadge = (totalFunding: number) => {
  if (totalFunding >= 500_000_000) return { label: 'Platinum', emoji: '💎', color: 'text-violet-700 bg-violet-50 border-violet-200' };
  if (totalFunding >= 100_000_000) return { label: 'Gold', emoji: '🥇', color: 'text-amber-700 bg-amber-50 border-amber-200' };
  if (totalFunding >= 25_000_000) return { label: 'Silver', emoji: '🥈', color: 'text-zinc-600 bg-zinc-50 border-zinc-300' };
  if (totalFunding >= 5_000_000) return { label: 'Bronze', emoji: '🥉', color: 'text-orange-700 bg-orange-50 border-orange-200' };
  return { label: 'Starter', emoji: '🌱', color: 'text-emerald-700 bg-emerald-50 border-emerald-200' };
};

const badgeThresholds = [
  { label: 'Starter', min: 0, max: 5_000_000 },
  { label: 'Bronze', min: 5_000_000, max: 25_000_000 },
  { label: 'Silver', min: 25_000_000, max: 100_000_000 },
  { label: 'Gold', min: 100_000_000, max: 500_000_000 },
  { label: 'Platinum', min: 500_000_000, max: null },
];

export default function FundingPage() {
  const { user } = useAuth();
  const { show: showGlobalToast } = useToast();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawingRef = useRef(false);

  // Core state
  const [dashboard, setDashboard] = useState<any>(null);
  const [projects, setProjects] = useState<any[]>([]);
  const [fundings, setFundings] = useState<any[]>([]);
  const [withdraws, setWithdraws] = useState<any[]>([]);
  const [projectDetail, setProjectDetail] = useState<any>(null);
  const [agreement, setAgreement] = useState<any>(null);
  const [fundForm, setFundForm] = useState<any>({ fundingAmount: '', transferBankName: '', transferAccountName: '', transferReferenceNo: '', proofUrl: '', acceptAgreement: false, notes: '' });
  const [withdrawForm, setWithdrawForm] = useState<any>({ amount: '', bankName: '', bankAccountNo: '', bankAccountName: '', notes: '' });
  const [modal, setModal] = useState<'fund' | 'withdraw' | 'project-detail' | 'roi-calc' | ''>('');
  const [saving, setSaving] = useState('');
  const [error, setError] = useState('');

  // Phase 2 — Project detail state
  const [projectDetailFull, setProjectDetailFull] = useState<any>(null);
  const [projectDetailTab, setProjectDetailTab] = useState<'overview' | 'timeline' | 'docs' | 'reports'>('overview');
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Phase 3 — ROI Calculator
  const [roiAmount, setRoiAmount] = useState('');
  const [roiProjectId, setRoiProjectId] = useState<number | null>(null);
  const [roiMonths, setRoiMonths] = useState(12);

  // Phase 1 — Active tab for history sections
  const [historyTab, setHistoryTab] = useState<'fundings' | 'ledger' | 'withdraws'>('fundings');

  const showToast = (message: string, _type: 'success' | 'error' = 'success') => {
    showGlobalToast(message);
  };

  const load = async () => {
    setError('');
    const [d, p, f, w] = await Promise.all([
      apiGet<any>('/api/ProjectFunding/dashboard'),
      apiGet<any>('/api/ProjectFunding/projects?page=1&pageSize=20'),
      apiGet<any>('/api/ProjectFunding/my-fundings'),
      apiGet<any>('/api/ProjectFunding/withdraws'),
    ]);
    setDashboard(d?.data ?? null);
    setProjects(p?.data?.items ?? []);
    setFundings(f?.data ?? []);
    setWithdraws(w?.data ?? []);
  };

  useEffect(() => {
    void load().catch((e) => setError(e?.message || 'Gagal memuat funding'));
  }, []);

  // Phase 2 — Open full project detail
  const openProjectDetail = async (project: any) => {
    setProjectDetailFull(null);
    setProjectDetailTab('overview');
    setModal('project-detail');
    setProjectDetail(project);
    setLoadingDetail(true);
    try {
      const res = await apiGet<any>(`/api/ProjectFunding/projects/${project.id}`);
      setProjectDetailFull(res?.data ?? null);
    } catch {
      // fallback to basic data
      setProjectDetailFull(project);
    } finally {
      setLoadingDetail(false);
    }
  };

  const openFund = async (project: any) => {
    setProjectDetail(project);
    setFundForm({ fundingAmount: formatRupiah(project.minFundingAmount || ''), transferBankName: '', transferAccountName: '', transferReferenceNo: '', proofUrl: '', acceptAgreement: false, notes: '' });
    setAgreement(null);
    setModal('fund');
    setError('');
    try {
      const res = await apiGet<any>(`/api/ProjectFunding/projects/${project.id}/agreement-template`);
      setAgreement(res?.data ?? null);
      setTimeout(clearCanvas, 100);
    } catch (e: any) {
      setError(e?.message || 'Agreement template belum tersedia untuk proyek ini.');
    }
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  };

  const pointer = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const c = canvasRef.current!;
    const r = c.getBoundingClientRect();
    return { x: (e.clientX - r.left) * (c.width / r.width), y: (e.clientY - r.top) * (c.height / r.height) };
  };

  const startDraw = (e: React.PointerEvent<HTMLCanvasElement>) => {
    drawingRef.current = true;
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    const p = pointer(e);
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
  };

  const draw = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawingRef.current) return;
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    const p = pointer(e);
    ctx.lineTo(p.x, p.y);
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#0f172a';
    ctx.stroke();
  };

  const submitFunding = async () => {
    if (!fundForm.transferBankName || !fundForm.transferAccountName || !fundForm.transferReferenceNo) {
      showToast('Mohon lengkapi info transfer rekening Anda.', 'error');
      return;
    }
    const signatureImage = canvasRef.current?.toDataURL('image/png') || '';
    setSaving('fund');
    setError('');
    try {
      await apiPost(`/api/ProjectFunding/projects/${projectDetail.id}/fund`, {
        ...fundForm,
        fundingAmount: parseRupiah(fundForm.fundingAmount),
        signatureImage
      });
      showToast('Pendanaan terkirim! Menunggu persetujuan admin.');
      setModal('');
      await load();
    } catch (e: any) {
      showToast(e?.message || 'Gagal submit funding', 'error');
      setError(e?.message || 'Gagal submit funding');
    } finally {
      setSaving('');
    }
  };

  const uploadProof = async (file: File) => {
    const fd = new FormData();
    fd.append('file', file);
    const headers: Record<string, string> = {};
    const token = getAuthToken();
    if (token) headers.Authorization = `Bearer ${token}`;
    const res = await fetch(`${getApiBaseUrl()}/api/ProjectFunding/upload-proof`, { method: 'POST', headers, body: fd });
    const json = await res.json().catch(() => null);
    if (!res.ok) throw new Error(json?.message || `Upload gagal (${res.status})`);
    setFundForm((p: any) => ({ ...p, proofUrl: json?.data?.url || '' }));
    showToast('Bukti transfer berhasil diupload.');
  };

  const openStatement = (format: 'csv' | 'html') => {
    const token = getAuthToken();
    const url = `${getApiBaseUrl()}/api/ProjectFunding/statements?format=${format}`;
    if (format === 'html') {
      void fetch(url, { headers: token ? { Authorization: `Bearer ${token}` } : undefined })
        .then((r) => r.text())
        .then((html) => {
          const blob = new Blob([html], { type: 'text/html' });
          window.open(URL.createObjectURL(blob), '_blank', 'noopener,noreferrer');
        });
      return;
    }
    void fetch(url, { headers: token ? { Authorization: `Bearer ${token}` } : undefined })
      .then((r) => r.blob())
      .then((blob) => {
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `funding-statement-${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        URL.revokeObjectURL(a.href);
      });
  };

  const printInvestorStatement = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) { showToast('Pop-up blocker aktif. Tolong izinkan pop-up untuk mencetak.', 'error'); return; }

    const fundingsHtml = fundings.map((x, idx) => `
      <tr style="border-bottom:1px solid #e4e4e7;font-size:11px;">
        <td style="text-align:center;padding:8px;">${idx + 1}</td>
        <td style="text-align:center;padding:8px;">${fmtDate(x.submittedAt)}</td>
        <td style="padding:8px;"><b>${x.projectName}</b></td>
        <td style="text-align:right;padding:8px;font-weight:bold;color:#047857;">${money(x.fundingAmount)}</td>
        <td style="text-align:center;padding:8px;">${x.transferBankName || '-'}</td>
        <td style="text-align:center;padding:8px;">${x.status}</td>
      </tr>`).join('');

    const withdrawsHtml = withdraws.map((x, idx) => `
      <tr style="border-bottom:1px solid #e4e4e7;font-size:11px;">
        <td style="text-align:center;padding:8px;">${idx + 1}</td>
        <td style="text-align:center;padding:8px;">${fmtDate(x.requestedAt)}</td>
        <td style="padding:8px;">${x.bankName} - ${x.bankAccountNo} (${x.bankAccountName})</td>
        <td style="text-align:right;padding:8px;font-weight:bold;color:#b91c1c;">${money(x.amount)}</td>
        <td style="text-align:center;padding:8px;font-family:monospace;">${x.paymentReferenceNo || '-'}</td>
        <td style="text-align:center;padding:8px;">${x.status}</td>
      </tr>`).join('');

    const htmlContent = `<!DOCTYPE html><html><head><title>Rekening Koran Pendanaan</title><meta charset="utf-8">
      <style>@page{size:A4;margin:15mm}body{font-family:'Segoe UI',Helvetica,Arial,sans-serif;color:#18181b;line-height:1.5}
      .header{display:flex;justify-content:space-between;align-items:center;border-bottom:3px double #18181b;padding-bottom:10px;margin-bottom:20px}
      .logo-text{font-size:20px;font-weight:900;color:#047857;letter-spacing:1px}.company-info{text-align:right;font-size:10px;color:#71717a}
      .title{text-align:center;margin:10px 0 20px;text-transform:uppercase;font-size:16px;font-weight:800;letter-spacing:2px;border-bottom:1px solid #e4e4e7;padding-bottom:5px}
      .metrics-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:25px}
      .metric-card{border:1px solid #e4e4e7;border-radius:8px;padding:10px;background:#fcfcfc}
      .metric-label{font-size:8px;text-transform:uppercase;color:#71717a;font-weight:bold}
      .metric-val{font-size:12px;font-weight:900;margin-top:4px}
      h3{font-size:11px;text-transform:uppercase;color:#047857;border-bottom:1px solid #e4e4e7;padding-bottom:4px;margin-top:25px}
      table{width:100%;border-collapse:collapse;margin-bottom:20px}
      th{background:#f4f4f5;border-bottom:2px solid #d4d4d8;padding:10px 8px;font-size:11px;text-transform:uppercase}
      .print-btn{background:#047857;color:#fff;border:none;padding:10px 20px;font-size:14px;font-weight:bold;border-radius:8px;cursor:pointer;margin:20px auto;display:block}
      @media print{.print-btn{display:none}}</style></head>
      <body><button class="print-btn" onclick="window.print()">Cetak Halaman (Print A4)</button>
      <div class="header"><div class="logo-text">ALFIAN TOUR</div>
      <div class="company-info"><strong>PT ALFIAN SEJAHTERA ABADI</strong><br>Spesialis Haji & Umroh Lansia<br>Telp/WA: +62 812-3456-7890 | alfiantour.com</div></div>
      <div class="title">Rekening Koran Pendanaan Investor</div>
      <p style="font-size:12px;margin-bottom:20px;">Nama: <b>${user?.name || user?.userName || 'Investor'}</b> | Username: <b>${user?.userName || '-'}</b> | Dicetak: <b>${fmtDate(new Date().toISOString(), { year: 'numeric', month: 'long', day: 'numeric' })}</b></p>
      <div class="metrics-grid">
        <div class="metric-card"><div class="metric-label">Funding Aktif</div><div class="metric-val" style="color:#047857;">${money(metrics.activeFunding)}</div></div>
        <div class="metric-card"><div class="metric-label">Total Bagi Hasil</div><div class="metric-val" style="color:#4f46e5;">${money(metrics.totalRevenue)}</div></div>
        <div class="metric-card"><div class="metric-label">Saldo Dompet</div><div class="metric-val" style="color:#d97706;">${money(metrics.revenueBalance)}</div></div>
        <div class="metric-card"><div class="metric-label">Dana Jaminan</div><div class="metric-val" style="color:#0f172a;">${money(trust.company_guarantee_balance)}</div></div>
      </div>
      <h3>1. Riwayat Investasi Pendanaan</h3>
      <table><thead><tr><th>No</th><th>Tanggal</th><th>Nama Proyek</th><th style="text-align:right;">Nominal</th><th>Metode</th><th>Status</th></tr></thead>
      <tbody>${fundingsHtml || '<tr><td colspan="6" style="text-align:center;padding:15px;color:#71717a;">Belum ada riwayat investasi.</td></tr>'}</tbody></table>
      <h3>2. Riwayat Penarikan Dana</h3>
      <table><thead><tr><th>No</th><th>Tanggal</th><th>Rekening Tujuan</th><th style="text-align:right;">Nominal</th><th>Ref Pembayaran</th><th>Status</th></tr></thead>
      <tbody>${withdrawsHtml || '<tr><td colspan="6" style="text-align:center;padding:15px;color:#71717a;">Belum ada riwayat penarikan.</td></tr>'}</tbody></table>
      <script>window.onload=function(){setTimeout(function(){window.print();},500);}</script></body></html>`;
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  const submitWithdraw = async () => {
    if (!withdrawForm.amount || !withdrawForm.bankName || !withdrawForm.bankAccountNo || !withdrawForm.bankAccountName) {
      showToast('Mohon lengkapi semua isian rekening tujuan.', 'error'); return;
    }
    const amountVal = parseRupiah(withdrawForm.amount);
    const availableBalance = Number(dashboard?.metrics?.revenueBalance || 0);
    if (availableBalance <= 0) { showToast('Saldo Dompet Hasil Anda saat ini Rp 0. Penarikan belum memungkinkan.', 'error'); return; }
    if (amountVal <= 0) { showToast('Nominal penarikan harus lebih besar dari Rp 0.', 'error'); return; }
    if (amountVal > availableBalance) { showToast(`Saldo tidak mencukupi. Maksimal penarikan adalah ${money(availableBalance)}.`, 'error'); return; }
    const minWithdraw = 50000;
    if (amountVal < minWithdraw) { showToast(`Ketentuan minimal penarikan adalah Rp ${minWithdraw.toLocaleString('id-ID')}.`, 'error'); return; }
    setSaving('withdraw');
    setError('');
    try {
      await apiPost('/api/ProjectFunding/withdraws', { ...withdrawForm, amount: parseRupiah(withdrawForm.amount) });
      showToast('Permohonan withdraw berhasil diajukan.');
      setModal('');
      setWithdrawForm({ amount: '', bankName: '', bankAccountNo: '', bankAccountName: '', notes: '' });
      await load();
    } catch (e: any) {
      showToast(e?.message || 'Gagal mengajukan permohonan withdraw', 'error');
      setError(e?.message || 'Gagal mengajukan permohonan withdraw');
    } finally {
      setSaving('');
    }
  };

  const printSingleFunding = (x: any) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) { showToast('Pop-up blocker aktif. Tolong izinkan pop-up untuk mencetak.', 'error'); return; }
    const dateStr = fmtDate(x.submittedAt, { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    const htmlContent = `<!DOCTYPE html><html><head><title>Bukti Kemitraan - ${x.id}</title><meta charset="utf-8">
    <style>@page{size:A4;margin:20mm}body{font-family:'Segoe UI',Helvetica,Arial,sans-serif;color:#18181b;line-height:1.6}
    .receipt-box{border:2px solid #047857;border-radius:16px;padding:30px;background:#fff;position:relative;max-width:700px;margin:20px auto}
    .watermark{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%) rotate(-30deg);font-size:80px;font-weight:900;color:rgba(4,120,87,0.05);pointer-events:none;white-space:nowrap;z-index:0}
    .header{display:flex;justify-content:space-between;align-items:center;border-bottom:2px solid #e4e4e7;padding-bottom:15px;margin-bottom:25px}
    .logo-area{font-size:22px;font-weight:900;color:#047857;letter-spacing:1px}
    .grid-info{display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:30px;font-size:13px;z-index:1;position:relative}
    .info-block h4{margin:0 0 5px;color:#71717a;font-size:11px;text-transform:uppercase;letter-spacing:1px}
    .info-block p{margin:0;font-weight:700}
    table{width:100%;border-collapse:collapse;margin-bottom:30px;z-index:1;position:relative}
    th{background:#f4f4f5;text-align:left;padding:12px;font-size:11px;text-transform:uppercase;color:#52525b;border-bottom:2px solid #e4e4e7}
    td{padding:12px;font-size:13px;border-bottom:1px solid #e4e4e7}
    .amount-section{display:flex;justify-content:space-between;align-items:center;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;padding:15px 20px;margin-bottom:35px}
    .amount-label{font-size:12px;font-weight:bold;color:#166534}.amount-val{font-size:20px;font-weight:900;color:#15803d}
    .signatures{display:grid;grid-template-columns:1fr 1fr;gap:40px;text-align:center;font-size:12px;margin-top:40px}
    .sig-line{border-top:1px solid #71717a;width:160px;margin:0 auto;font-weight:bold}
    .print-btn{background:#047857;color:#fff;border:none;padding:10px 20px;font-size:14px;font-weight:bold;border-radius:8px;cursor:pointer;margin:20px auto;display:block}
    @media print{.print-btn{display:none}}</style></head>
    <body><button class="print-btn" onclick="window.print()">Cetak Bukti (Print A4)</button>
    <div class="receipt-box"><div class="watermark">${x.status.toUpperCase()}</div>
    <div class="header"><div class="logo-area">ALFIAN TOUR</div><div style="text-align:right;font-size:14px;font-weight:800;text-transform:uppercase;">Bukti Transaksi Pendanaan</div></div>
    <div class="grid-info">
      <div class="info-block"><h4>Nama Investor</h4><p>${user?.name || user?.userName || 'Investor'}</p></div>
      <div class="info-block" style="text-align:right;"><h4>ID Transaksi</h4><p>TX-FUND-${x.id.toString().padStart(6, '0')}</p></div>
      <div class="info-block"><h4>Tanggal Pengajuan</h4><p>${dateStr}</p></div>
      <div class="info-block" style="text-align:right;"><h4>Status</h4><p style="color:${x.status === 'Approved' ? '#15803d' : x.status === 'Pending' ? '#b45309' : '#b91c1c'}">${x.status}</p></div>
    </div>
    <table><thead><tr><th>Deskripsi</th><th style="text-align:right;">Detail</th></tr></thead>
    <tbody>
      <tr><td>Proyek Kemitraan</td><td style="text-align:right;"><b>${x.projectName}</b></td></tr>
      <tr><td>Bank Pengirim</td><td style="text-align:right;">${x.transferBankName || '-'}</td></tr>
      <tr><td>Pemilik Rekening</td><td style="text-align:right;">${x.transferAccountName || '-'}</td></tr>
      <tr><td>No. Referensi Transfer</td><td style="text-align:right;font-family:monospace;">${x.transferReferenceNo || '-'}</td></tr>
      ${x.approvedAt ? `<tr><td>Tanggal Disetujui</td><td style="text-align:right;">${fmtDate(x.approvedAt, { year: 'numeric', month: 'long', day: 'numeric' })}</td></tr>` : ''}
      ${x.notes ? `<tr><td>Catatan</td><td style="text-align:right;">${x.notes}</td></tr>` : ''}
    </tbody></table>
    <div class="amount-section"><span class="amount-label">TOTAL PENDANAAN</span><span class="amount-val">${money(x.fundingAmount)}</span></div>
    <div class="signatures">
      <div><p style="color:#71717a;margin-bottom:60px;">Investor,</p><div class="sig-line">${user?.name || user?.userName || 'Investor'}</div></div>
      <div><p style="color:#71717a;margin-bottom:60px;">Manajemen Alfian Tour,</p><div class="sig-line">Direktur Operasional</div></div>
    </div></div><script>window.print()</script></body></html>`;
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  const printAllFundings = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) { showToast('Pop-up blocker aktif. Tolong izinkan pop-up untuk mencetak.', 'error'); return; }
    const rowsHtml = fundings.map((x, idx) => `
      <tr style="border-bottom:1px solid #e4e4e7;font-size:11px;">
        <td style="text-align:center;padding:8px;">${idx + 1}</td>
        <td style="text-align:center;padding:8px;">${fmtDate(x.submittedAt)}</td>
        <td style="padding:8px;"><b>${x.projectName}</b></td>
        <td style="text-align:right;padding:8px;font-weight:bold;color:#047857;">${money(x.fundingAmount)}</td>
        <td style="text-align:center;padding:8px;">${x.transferBankName || '-'}</td>
        <td style="text-align:center;padding:8px;font-family:monospace;">${x.transferReferenceNo || '-'}</td>
        <td style="text-align:center;padding:8px;">${x.status}</td>
      </tr>`).join('');
    const htmlContent = `<!DOCTYPE html><html><head><title>Daftar Riwayat Investasi</title><meta charset="utf-8">
    <style>@page{size:A4;margin:15mm}body{font-family:'Segoe UI',Helvetica,Arial,sans-serif;color:#18181b;line-height:1.5}
    .header{display:flex;justify-content:space-between;align-items:center;border-bottom:3px double #18181b;padding-bottom:10px;margin-bottom:20px}
    .logo-text{font-size:20px;font-weight:900;color:#047857;letter-spacing:1px}.company-info{text-align:right;font-size:10px;color:#71717a}
    .title{text-align:center;margin:10px 0 20px;text-transform:uppercase;font-size:16px;font-weight:800;letter-spacing:2px;border-bottom:1px solid #e4e4e7;padding-bottom:5px}
    table{width:100%;border-collapse:collapse;margin-bottom:20px}th{background:#f4f4f5;border-bottom:2px solid #d4d4d8;padding:10px 8px;font-size:11px;text-transform:uppercase}
    .print-btn{background:#047857;color:#fff;border:none;padding:10px 20px;font-size:14px;font-weight:bold;border-radius:8px;cursor:pointer;margin:20px auto;display:block}
    @media print{.print-btn{display:none}}</style></head>
    <body><button class="print-btn" onclick="window.print()">Cetak Halaman (Print A4)</button>
    <div class="header"><div class="logo-text">ALFIAN TOUR</div><div class="company-info"><strong>PT ALFIAN SEJAHTERA ABADI</strong><br>Dicetak: ${fmtDate(new Date().toISOString(), { year: 'numeric', month: 'long', day: 'numeric' })}</div></div>
    <div class="title">Laporan Riwayat Investasi Saya</div>
    <p style="font-size:12px;margin-bottom:20px;">Nama: <b>${user?.name || user?.userName || 'Investor'}</b> | Username: <b>${user?.userName || '-'}</b></p>
    <table><thead><tr><th>No</th><th>Tanggal</th><th>Nama Proyek</th><th style="text-align:right;">Nominal</th><th>Bank</th><th>No. Referensi</th><th>Status</th></tr></thead>
    <tbody>${rowsHtml}</tbody></table>
    <script>window.print()</script></body></html>`;
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  // Derived
  const metrics = dashboard?.metrics ?? {};
  const trust = dashboard?.trust ?? {};
  const ledger: any[] = dashboard?.ledger ?? [];
  const activeFunding = Number(metrics.activeFunding || 0);
  const badge = getInvestorBadge(activeFunding);
  const nextBadge = badgeThresholds.find(b => b.min > activeFunding);
  const progressToNext = nextBadge ? Math.min(100, (activeFunding / nextBadge.min) * 100) : 100;

  // Phase 3 — ROI Calculator
  const roiProject = useMemo(() => projects.find(p => p.id === roiProjectId), [projects, roiProjectId]);
  const roiAmountNum = parseRupiah(roiAmount);
  const roiMonthlyReturn = useMemo(() => {
    if (!roiProject || !roiAmountNum) return 0;
    const pct = Number(roiProject.revenueSharePercent || 0);
    return Math.round((roiAmountNum * pct) / 100 / 12);
  }, [roiProject, roiAmountNum]);
  const roiTotal = roiMonthlyReturn * roiMonths;

  // Status badge helper
  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
      Approved: 'bg-emerald-50 text-emerald-800 border border-emerald-200',
      Pending: 'bg-amber-50 text-amber-800 border border-amber-200',
      Rejected: 'bg-red-50 text-red-800 border border-red-200',
      Cancelled: 'bg-zinc-100 text-zinc-600 border border-zinc-200',
      Paid: 'bg-blue-50 text-blue-800 border border-blue-200',
    };
    return `px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider inline-block ${map[status] ?? 'bg-zinc-100 text-zinc-600'}`;
  };

  return (
    <div className="p-4 space-y-5 animate-fade-up">

      {/* ── Header ── */}
      <div className="bg-white border rounded-3xl p-5 flex flex-wrap items-center justify-between gap-4 shadow-sm">
        <div>
          <h1 className="text-lg font-extrabold g-text flex items-center gap-1.5">
            <span>📈</span> Kemitraan Project Funding
          </h1>
          <p className="text-xs text-zinc-500 mt-1">Kelola investasi pendanaan proyek, monitor performa bagi hasil, dan ajukan pencairan saldo secara real-time.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            className="rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 px-3.5 py-2 text-xs font-bold text-zinc-700 shadow-sm transition-colors flex items-center gap-1.5"
            onClick={() => { setRoiProjectId(projects[0]?.id ?? null); setRoiAmount(''); setModal('roi-calc'); }}
          >
            🧮 Kalkulator ROI
          </button>
          <button
            className="rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 px-3.5 py-2 text-xs font-bold text-zinc-700 shadow-sm transition-colors flex items-center gap-1.5"
            onClick={printInvestorStatement}
          >
            <span>🖨️</span> Cetak Rekening Koran
          </button>
          <button
            className="rounded-xl bg-primary-600 hover:bg-primary-700 px-4 py-2.5 text-xs font-bold text-white shadow-md transition-colors"
            onClick={() => { setWithdrawForm({ amount: '', bankName: '', bankAccountNo: '', bankAccountName: '', notes: '' }); setModal('withdraw'); }}
          >
            💸 Ajukan Withdraw
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-3.5 text-xs text-red-700 flex justify-between items-center animate-fade-up">
          <span>{error}</span>
          <button className="font-bold hover:text-red-900" onClick={() => setError('')}>&times;</button>
        </div>
      )}

      {/* ── Phase 1: 6 Portfolio Metric Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-white border border-zinc-150 rounded-3xl p-5 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
          <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">Investasi / Funding Aktif</span>
          <span className="text-base lg:text-lg font-black text-emerald-600 mt-1.5 block">{money(metrics.activeFunding)}</span>
        </div>
        <div className="bg-white border border-zinc-150 rounded-3xl p-5 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
          <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">Total Bagi Hasil Diterima</span>
          <span className="text-base lg:text-lg font-black text-indigo-600 mt-1.5 block">{money(metrics.totalRevenue)}</span>
        </div>
        <div className="bg-white border border-zinc-150 rounded-3xl p-5 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
          <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">Saldo Dompet Hasil</span>
          <span className="text-base lg:text-lg font-black text-amber-600 mt-1.5 block">{money(metrics.revenueBalance)}</span>
        </div>
        <div className="bg-white border border-zinc-150 rounded-3xl p-5 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
          <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">Dana Jaminan Perusahaan</span>
          <span className="text-base lg:text-lg font-black text-zinc-800 mt-1.5 block">{money(trust.company_guarantee_balance)}</span>
        </div>
        {/* Phase 1: 2 new metrics */}
        <div className="bg-white border border-zinc-150 rounded-3xl p-5 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
          <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">Proyek Aktif Tersedia</span>
          <span className="text-base lg:text-lg font-black text-sky-600 mt-1.5 block">{metrics.activeProjects ?? projects.length} Proyek</span>
        </div>
        <div className="bg-white border border-zinc-150 rounded-3xl p-5 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
          <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">Total Penarikan Dana</span>
          <span className="text-base lg:text-lg font-black text-rose-600 mt-1.5 block">{money(metrics.totalWithdraw)}</span>
        </div>
      </div>

      {/* ── Phase 3: Investor Badge Level ── */}
      <div className="bg-white border rounded-3xl p-5 shadow-sm flex flex-col md:flex-row items-center gap-4">
        <div className="flex items-center gap-3">
          <div className={`rounded-2xl border px-4 py-3 flex items-center gap-2 ${badge.color}`}>
            <span className="text-2xl">{badge.emoji}</span>
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider opacity-70">Level Investor</div>
              <div className="text-sm font-black">{badge.label}</div>
            </div>
          </div>
        </div>
        <div className="flex-1 space-y-1.5 w-full">
          <div className="flex justify-between text-[10px] font-bold text-zinc-500">
            <span>Progress ke level berikutnya</span>
            {nextBadge ? <span>{badge.label} → {nextBadge.label} ({money(nextBadge.min)})</span> : <span className="text-violet-700">Level Tertinggi 💎</span>}
          </div>
          <div className="h-2.5 rounded-full bg-zinc-100 overflow-hidden">
            <div className="h-full bg-gradient-to-r from-primary-500 to-indigo-500 rounded-full transition-all duration-500" style={{ width: `${progressToNext}%` }} />
          </div>
          <div className="text-[10px] text-zinc-400">Total invest Anda: <b className="text-zinc-700">{money(activeFunding)}</b></div>
        </div>
      </div>

      {/* ── Platform Trust Record ── */}
      <div className="bg-white border rounded-3xl p-5 shadow-xs grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
        <div className="md:col-span-3 grid grid-cols-3 gap-2">
          <div className="border-r pr-2">
            <div className="text-[10px] text-zinc-400 font-bold uppercase">Proyek Selesai</div>
            <b className="text-sm font-black text-zinc-800 mt-0.5 block">{trust.total_project_completed || 0} Proyek</b>
          </div>
          <div className="border-r px-2">
            <div className="text-[10px] text-zinc-400 font-bold uppercase">Jamaah Berangkat</div>
            <b className="text-sm font-black text-zinc-800 mt-0.5 block">{trust.total_jamaah_departed || 0} Orang</b>
          </div>
          <div className="px-2">
            <div className="text-[10px] text-zinc-400 font-bold uppercase">Bagi Hasil Dibayarkan</div>
            <b className="text-sm font-black text-zinc-800 mt-0.5 block">{money(trust.total_revenue_paid)}</b>
          </div>
        </div>
        <div className="bg-emerald-50 border border-emerald-150 p-3 rounded-2xl flex flex-col justify-center items-center text-center">
          <span className="text-[10px] uppercase font-bold text-emerald-800 flex items-center gap-1">🛡️ Secured Trust</span>
          <span className="text-[9px] text-emerald-600 mt-0.5">Saldo terjamin sepenuhnya.</span>
        </div>
      </div>

      {/* ── Action shortcuts ── */}
      <div className="bg-white border rounded-3xl p-4 shadow-xs flex flex-wrap gap-2.5 items-center justify-between">
        <span className="text-xs text-zinc-500 font-medium">Butuh dokumen pencatatan atau laporan tertulis?</span>
        <div className="flex gap-2">
          <button className="rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 px-3.5 py-2 text-xs font-bold text-zinc-700 shadow-3xs transition-colors" onClick={() => openStatement('csv')}>📥 Export CSV</button>
          <button className="rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 px-3.5 py-2 text-xs font-bold text-zinc-700 shadow-3xs transition-colors" onClick={() => openStatement('html')}>📄 Buka HTML Laporan</button>
        </div>
      </div>

      {/* ── Phase 2: Projects Grid with Detail Button ── */}
      <div className="bg-white border rounded-3xl p-6 space-y-4 shadow-sm">
        <h2 className="text-sm font-extrabold text-zinc-950 flex items-center gap-1.5">
          <span>📁</span> Proyek Funding Aktif Terbuka
        </h2>
        {projects.length === 0 ? (
          <p className="text-xs text-zinc-400 py-6 text-center">Saat ini tidak ada project funding terbuka.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
            {projects.map((p) => (
              <div key={p.id} className={`w-full bg-white border-2 ${getOutlineColor(p.id)} rounded-3xl overflow-hidden shadow-xs hover:shadow-lg transition-all flex flex-col justify-between`}>
                <div>
                  {p.coverUrl ? (
                    <img src={absoluteUrl(p.coverUrl)} className="w-full h-36 object-cover" alt={p.name} />
                  ) : (
                    <div className="w-full h-36 bg-gradient-to-br from-emerald-500/10 to-sky-500/10 flex items-center justify-center text-zinc-400 font-black text-xs uppercase tracking-wider">
                      🎨 {p.category || 'Funding Project'}
                    </div>
                  )}
                  <div className="p-5 space-y-3">
                    <div className="flex justify-between items-center gap-2 flex-wrap">
                      <span className="text-[10px] uppercase font-bold px-2 py-0.5 bg-zinc-150 text-zinc-600 rounded-md">{p.category || 'Umroh'}</span>
                      <span className="text-[10px] uppercase font-bold px-2 py-0.5 bg-emerald-50 text-emerald-800 rounded-md border border-emerald-200">{p.status}</span>
                    </div>
                    <h3 className="font-extrabold text-sm text-zinc-900 leading-tight line-clamp-2 min-h-[2.5rem]">{p.name}</h3>
                    <p className="text-[11px] text-zinc-500 line-clamp-2">{p.shortDescription || 'Membuka peluang kemitraan bagi hasil pendanaan proyek.'}</p>

                    {/* Phase 1 + 2: Revenue Share + Partner count */}
                    <div className="flex items-center gap-2 flex-wrap pt-0.5">
                      {p.revenueSharePercent ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-md border border-indigo-100">
                          📊 Bagi Hasil {p.revenueSharePercent}%/tahun
                        </span>
                      ) : null}
                      {p.fundingPartnerCount ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 bg-amber-50 text-amber-700 rounded-md border border-amber-100">
                          👥 {p.fundingPartnerCount} Investor
                        </span>
                      ) : null}
                    </div>

                    <div className="space-y-2 pt-1">
                      <div className="flex justify-between items-center text-[11px] gap-2 flex-wrap">
                        <span className="text-zinc-400">Terkumpul: <b className="text-zinc-800">{money(p.collectedAmount)}</b></span>
                        <span className="text-zinc-800 font-extrabold shrink-0">{p.progressPercent || 0}%</span>
                      </div>
                      <div className="h-2 rounded-full bg-zinc-100 overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-full" style={{ width: `${Math.min(100, Number(p.progressPercent || 0))}%` }} />
                      </div>
                      <div className="flex justify-between text-[10px] text-zinc-400 gap-2 flex-wrap">
                        <span>Target: <b className="text-zinc-600">{money(p.targetAmount)}</b></span>
                        <span>Min: <b className="text-zinc-600">{money(p.minFundingAmount)}</b></span>
                      </div>
                      {(p.startDate || p.endDate) && (
                        <div className="text-[10px] text-zinc-400">
                          📅 {fmtDate(p.startDate)} – {fmtDate(p.endDate)}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div className="p-4 pt-0 mt-auto bg-zinc-50/50 border-t border-zinc-100 flex items-center gap-2">
                  <button
                    className="flex-1 rounded-xl border border-zinc-200 hover:bg-zinc-100 py-2 text-xs font-bold text-zinc-700 transition-colors"
                    onClick={() => openProjectDetail(p)}
                  >
                    🔍 Detail
                  </button>
                  <button
                    className="flex-1 rounded-xl bg-primary-600 hover:bg-primary-700 py-2.5 text-xs font-bold text-white shadow-sm transition-colors"
                    onClick={() => openFund(p)}
                  >
                    Funding Proyek Ini
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Phase 1: Tabbed History (Fundings / Ledger / Withdraws) ── */}
      <div className="bg-white border rounded-3xl p-5 space-y-4 shadow-sm">
        {/* Tab bar */}
        <div className="flex items-center gap-1 flex-wrap border-b pb-3">
          {([
            { key: 'fundings', label: `📁 Riwayat Investasi (${fundings.length})` },
            { key: 'ledger', label: `📊 Mutasi Saldo (${ledger.length})` },
            { key: 'withdraws', label: `💸 Penarikan (${withdraws.length})` },
          ] as const).map(tab => (
            <button
              key={tab.key}
              onClick={() => setHistoryTab(tab.key)}
              className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-colors ${historyTab === tab.key ? 'bg-primary-600 text-white shadow-sm' : 'border border-zinc-200 text-zinc-600 hover:bg-zinc-50'}`}
            >
              {tab.label}
            </button>
          ))}
          {historyTab === 'fundings' && fundings.length > 0 && (
            <button
              className="ml-auto rounded-lg border bg-white hover:bg-zinc-50 px-2.5 py-1 text-[10px] font-bold text-zinc-700 transition-colors shadow-3xs flex items-center gap-1"
              onClick={printAllFundings}
            >
              🖨️ Cetak Semua
            </button>
          )}
        </div>

        {/* Tab: Fundings */}
        {historyTab === 'fundings' && (
          <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
            {fundings.length === 0 ? (
              <p className="text-xs text-zinc-400 py-4 text-center">Anda belum memiliki riwayat investasi.</p>
            ) : fundings.map((x) => (
              <div key={x.id} className="rounded-xl border p-3 text-xs bg-white hover:bg-zinc-50 transition-colors">
                <div className="flex justify-between items-start gap-3">
                  <div className="space-y-1 flex-1 min-w-0">
                    <span className="font-bold text-zinc-900 block truncate">{x.projectName}</span>
                    <div className="flex items-center gap-2 flex-wrap mt-0.5">
                      <span className={statusBadge(x.status)}>{x.status}</span>
                      {x.approvedAt && <span className="text-[9px] text-zinc-400">✅ Disetujui {fmtDate(x.approvedAt)}</span>}
                      {x.rejectedAt && <span className="text-[9px] text-red-500">❌ Ditolak {fmtDate(x.rejectedAt)}</span>}
                      <span className="text-[9px] text-zinc-400">📅 {fmtDate(x.submittedAt)}</span>
                    </div>
                    {/* Phase 1: Rejection reason */}
                    {x.rejectionReason && (
                      <div className="mt-1.5 rounded-lg bg-red-50 border border-red-100 px-2 py-1 text-[9px] text-red-700 flex gap-1">
                        <span>⚠️ Alasan penolakan:</span>
                        <span className="font-semibold">{x.rejectionReason}</span>
                      </div>
                    )}
                    {x.transferBankName && (
                      <span className="text-[9px] text-zinc-400">🏦 {x.transferBankName} · Ref: {x.transferReferenceNo || '-'}</span>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <b className="text-emerald-700 font-extrabold text-sm">{money(x.fundingAmount)}</b>
                    <button
                      className="text-[9px] border px-1.5 py-0.5 rounded text-zinc-500 hover:text-emerald-700 hover:border-emerald-200 transition-colors font-bold bg-zinc-50 hover:bg-emerald-50/50 flex items-center gap-0.5 shadow-4xs"
                      onClick={() => printSingleFunding(x)}
                    >
                      🖨️ Bukti
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Tab: Ledger Mutasi Saldo — Phase 1 */}
        {historyTab === 'ledger' && (
          <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
            {ledger.length === 0 ? (
              <p className="text-xs text-zinc-400 py-4 text-center">Belum ada mutasi saldo tercatat.</p>
            ) : ledger.map((x: any, i: number) => {
              const isCredit = String(x.direction).toLowerCase() === 'credit' || ['Revenue', 'Refund'].includes(x.transactionType);
              return (
                <div key={x.id ?? i} className="rounded-xl border p-3 text-xs bg-white hover:bg-zinc-50 transition-colors">
                  <div className="flex justify-between items-center gap-3">
                    <div className="space-y-0.5 flex-1 min-w-0">
                      <div className="font-bold text-zinc-800">{ledgerTypeLabel(x.transactionType, x.direction)}</div>
                      <div className="text-[10px] text-zinc-400 flex gap-2 flex-wrap">
                        <span>📅 {fmtDate(x.transactionDate)}</span>
                        {x.description && <span className="truncate max-w-xs">{x.description}</span>}
                      </div>
                      {x.balanceAfter !== undefined && (
                        <div className="text-[10px] text-zinc-500">Saldo setelah: <b>{money(x.balanceAfter)}</b></div>
                      )}
                    </div>
                    <span className={`font-black text-sm shrink-0 ${isCredit ? 'text-emerald-600' : 'text-red-600'}`}>
                      {isCredit ? '+' : '-'}{money(x.amount)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Tab: Withdraws — Phase 1 (detailed) */}
        {historyTab === 'withdraws' && (
          <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
            {withdraws.length === 0 ? (
              <p className="text-xs text-zinc-400 py-4 text-center">Anda belum mengajukan pencairan saldo.</p>
            ) : withdraws.map((x) => (
              <div key={x.id} className="rounded-xl border p-3 text-xs bg-white hover:bg-zinc-50 transition-colors">
                <div className="flex justify-between items-start gap-3">
                  <div className="space-y-1 flex-1 min-w-0">
                    <div className="font-bold text-zinc-800">{x.bankName || 'Pencairan'}</div>
                    <div className="text-[9px] text-zinc-500 space-y-0.5">
                      {x.bankAccountNo && <div>🏦 {x.bankAccountName} · No. {x.bankAccountNo}</div>}
                      {x.requestedAt && <div>📅 Diajukan: {fmtDate(x.requestedAt)}</div>}
                      {x.paidAt && <div>✅ Dibayarkan: {fmtDate(x.paidAt)}</div>}
                      {x.paymentReferenceNo && <div className="font-mono">🔖 Ref: {x.paymentReferenceNo}</div>}
                      {x.notes && <div>📝 {x.notes}</div>}
                    </div>
                    {x.rejectionReason && (
                      <div className="mt-1 rounded-lg bg-red-50 border border-red-100 px-2 py-1 text-[9px] text-red-700">
                        ⚠️ Alasan penolakan: <b>{x.rejectionReason}</b>
                      </div>
                    )}
                    <span className={statusBadge(x.status)}>{x.status}</span>
                  </div>
                  <b className="text-rose-600 font-extrabold text-sm shrink-0">{money(x.amount)}</b>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Phase 2: Project Detail Modal ── */}
      <ModalShell open={modal === 'project-detail'} onBackdropClick={() => setModal('')}>
        <div className="mx-auto max-w-2xl rounded-3xl bg-white border shadow-2xl p-6 max-h-[92vh] overflow-y-auto space-y-4 my-auto animate-scale-up">
          <div className="flex justify-between items-center border-b pb-3">
            <h2 className="text-sm font-extrabold text-zinc-950 flex items-center gap-2">
              <span>🔍</span> {projectDetail?.name}
            </h2>
            <button className="text-zinc-400 hover:text-zinc-600 text-lg font-bold" onClick={() => setModal('')}>&times;</button>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 flex-wrap">
            {(['overview', 'timeline', 'docs', 'reports'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setProjectDetailTab(tab)}
                className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-colors ${projectDetailTab === tab ? 'bg-primary-600 text-white' : 'border border-zinc-200 text-zinc-600 hover:bg-zinc-50'}`}
              >
                {{ overview: '📋 Ringkasan', timeline: '🗓️ Timeline', docs: '📂 Dokumen', reports: '📝 Laporan' }[tab]}
              </button>
            ))}
          </div>

          {loadingDetail ? (
            <div className="text-center py-8 text-zinc-400 text-xs">Memuat data proyek...</div>
          ) : (
            <>
              {/* Overview */}
              {projectDetailTab === 'overview' && (
                <div className="space-y-4">
                  {projectDetail?.coverUrl && (
                    <img src={absoluteUrl(projectDetail.coverUrl)} className="w-full h-40 object-cover rounded-2xl" alt={projectDetail?.name} />
                  )}
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: 'Status', value: projectDetail?.status },
                      { label: 'Kategori', value: projectDetail?.category },
                      { label: 'Target Dana', value: money(projectDetail?.targetAmount) },
                      { label: 'Terkumpul', value: money(projectDetail?.collectedAmount) },
                      { label: 'Min. Investasi', value: money(projectDetail?.minFundingAmount) },
                      { label: 'Bagi Hasil/tahun', value: projectDetail?.revenueSharePercent ? `${projectDetail.revenueSharePercent}%` : '-' },
                      { label: 'Investor Aktif', value: projectDetailFull?.fundingPartnerCount ?? projectDetail?.fundingPartnerCount ?? '-' },
                      { label: 'Periode', value: `${fmtDate(projectDetail?.startDate)} – ${fmtDate(projectDetail?.endDate)}` },
                    ].map(item => (
                      <div key={item.label} className="rounded-xl bg-zinc-50 border border-zinc-100 p-3">
                        <div className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider">{item.label}</div>
                        <div className="text-xs font-bold text-zinc-800 mt-0.5">{item.value ?? '-'}</div>
                      </div>
                    ))}
                  </div>
                  {projectDetail?.description && (
                    <div className="rounded-xl bg-zinc-50 border p-4 text-xs text-zinc-700 leading-relaxed">
                      {projectDetail.description}
                    </div>
                  )}
                  {projectDetailFull?.revenueRule && (
                    <div className="rounded-xl bg-indigo-50 border border-indigo-100 p-4 text-xs text-indigo-800 leading-relaxed">
                      <div className="font-bold mb-1">📊 Aturan Bagi Hasil</div>
                      {projectDetailFull.revenueRule}
                    </div>
                  )}
                  <button
                    className="w-full rounded-xl bg-primary-600 hover:bg-primary-700 py-3 text-xs font-bold text-white shadow-sm transition-colors"
                    onClick={() => { setModal('fund'); openFund(projectDetail); }}
                  >
                    💰 Funding Proyek Ini
                  </button>
                </div>
              )}

              {/* Timeline */}
              {projectDetailTab === 'timeline' && (
                <div className="space-y-3">
                  {(projectDetailFull?.timeline ?? []).length === 0 ? (
                    <p className="text-xs text-zinc-400 py-4 text-center">Belum ada timeline tercatat untuk proyek ini.</p>
                  ) : (projectDetailFull?.timeline ?? []).map((t: any, i: number) => (
                    <div key={t.id ?? i} className="flex gap-3 relative">
                      <div className="flex flex-col items-center">
                        <div className="w-3 h-3 rounded-full bg-primary-500 border-2 border-white shadow-sm shrink-0 mt-0.5" />
                        {i < (projectDetailFull?.timeline ?? []).length - 1 && <div className="w-0.5 flex-1 bg-zinc-200 mt-1" />}
                      </div>
                      <div className="pb-4 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[10px] font-bold text-zinc-400">{fmtDate(t.eventDate)}</span>
                          {t.statusLabel && <span className="text-[9px] font-bold px-1.5 py-0.5 bg-emerald-50 text-emerald-700 rounded border border-emerald-100">{t.statusLabel}</span>}
                        </div>
                        <div className="font-bold text-xs text-zinc-800 mt-0.5">{t.title}</div>
                        {t.description && <p className="text-[11px] text-zinc-500 mt-0.5">{t.description}</p>}
                        {t.attachmentUrl && <a href={absoluteUrl(t.attachmentUrl)} target="_blank" rel="noreferrer" className="text-[10px] text-primary-600 hover:underline font-bold">📎 Lihat Lampiran</a>}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Documents */}
              {projectDetailTab === 'docs' && (
                <div className="space-y-2">
                  {(projectDetailFull?.documents ?? []).filter((d: any) => d.isPublicToInvestor !== false).length === 0 ? (
                    <p className="text-xs text-zinc-400 py-4 text-center">Belum ada dokumen publik untuk proyek ini.</p>
                  ) : (projectDetailFull?.documents ?? []).filter((d: any) => d.isPublicToInvestor !== false).map((d: any, i: number) => (
                    <div key={d.id ?? i} className="rounded-xl border p-3 flex items-center justify-between gap-3 hover:bg-zinc-50">
                      <div>
                        <div className="text-xs font-bold text-zinc-800">{d.title || d.fileName}</div>
                        <div className="text-[10px] text-zinc-400">{d.documentType} {d.description ? `· ${d.description}` : ''}</div>
                      </div>
                      <a href={absoluteUrl(d.fileUrl)} target="_blank" rel="noreferrer" className="rounded-lg bg-primary-50 border border-primary-100 text-primary-700 font-bold text-[10px] px-3 py-1.5 hover:bg-primary-100 transition-colors shrink-0">
                        📥 Unduh
                      </a>
                    </div>
                  ))}
                </div>
              )}

              {/* Reports */}
              {projectDetailTab === 'reports' && (
                <div className="space-y-2">
                  {(projectDetailFull?.reports ?? []).length === 0 ? (
                    <p className="text-xs text-zinc-400 py-4 text-center">Belum ada laporan periodik tersedia.</p>
                  ) : (projectDetailFull?.reports ?? []).map((r: any, i: number) => (
                    <div key={r.id ?? i} className="rounded-xl border p-3 hover:bg-zinc-50">
                      <div className="flex justify-between items-start gap-2">
                        <div>
                          <div className="text-xs font-bold text-zinc-800">{r.title}</div>
                          <div className="text-[10px] text-zinc-400">{r.reportType} · {r.reportPeriod}</div>
                          {r.summary && <p className="text-[11px] text-zinc-500 mt-1 line-clamp-3">{r.summary}</p>}
                        </div>
                        <div className="flex gap-1 shrink-0">
                          {r.pdfUrl && <a href={absoluteUrl(r.pdfUrl)} target="_blank" rel="noreferrer" className="rounded-lg bg-red-50 border border-red-100 text-red-700 font-bold text-[10px] px-2 py-1 hover:bg-red-100 transition-colors">📄 PDF</a>}
                          {r.attachmentUrl && <a href={absoluteUrl(r.attachmentUrl)} target="_blank" rel="noreferrer" className="rounded-lg bg-primary-50 border border-primary-100 text-primary-700 font-bold text-[10px] px-2 py-1 hover:bg-primary-100 transition-colors">📎 Lampiran</a>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </ModalShell>

      {/* ── Phase 3: ROI Calculator Modal ── */}
      <ModalShell open={modal === 'roi-calc'} onBackdropClick={() => setModal('')}>
        <div className="mx-auto max-w-md rounded-3xl bg-white border shadow-2xl p-6 space-y-4 my-auto animate-scale-up">
          <div className="flex justify-between items-center border-b pb-2">
            <h2 className="text-sm font-extrabold text-zinc-950">🧮 Simulasi ROI Investasi</h2>
            <button className="text-zinc-400 hover:text-zinc-600 text-lg font-bold" onClick={() => setModal('')}>&times;</button>
          </div>
          <p className="text-[11px] text-zinc-500">Simulasi estimasi return on investment berdasarkan persentase bagi hasil proyek. Angka bersifat ilustrasi, bukan jaminan.</p>
          <div className="space-y-3">
            <div className="space-y-1">
              <label className="text-xs font-bold text-zinc-700">Pilih Proyek</label>
              <select
                className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-xs focus:ring-1 focus:ring-primary-500 focus:outline-none"
                value={roiProjectId ?? ''}
                onChange={(e) => setRoiProjectId(Number(e.target.value))}
              >
                {projects.map(p => (
                  <option key={p.id} value={p.id}>{p.name} {p.revenueSharePercent ? `(${p.revenueSharePercent}%/thn)` : ''}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-zinc-700">Nominal Investasi</label>
              <input
                className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-xs focus:ring-1 focus:ring-primary-500 focus:outline-none"
                placeholder="Contoh: Rp 10.000.000"
                value={roiAmount}
                onChange={(e) => setRoiAmount(formatRupiah(e.target.value))}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-zinc-700">Durasi Investasi (Bulan): <b>{roiMonths} bulan</b></label>
              <input type="range" min={1} max={60} value={roiMonths} onChange={(e) => setRoiMonths(Number(e.target.value))} className="w-full accent-primary-600" />
              <div className="flex justify-between text-[9px] text-zinc-400"><span>1 bln</span><span>5 tahun</span></div>
            </div>
          </div>
          {roiAmountNum > 0 && roiProject && (
            <div className="rounded-2xl bg-gradient-to-br from-emerald-50 to-indigo-50 border border-emerald-100 p-4 space-y-3">
              <div className="text-xs font-bold text-zinc-700">Estimasi Hasil ({roiMonths} bulan)</div>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-white border p-3 text-center">
                  <div className="text-[9px] text-zinc-400 font-bold uppercase">Per Bulan</div>
                  <div className="text-sm font-black text-emerald-600 mt-0.5">{money(roiMonthlyReturn)}</div>
                </div>
                <div className="rounded-xl bg-white border p-3 text-center">
                  <div className="text-[9px] text-zinc-400 font-bold uppercase">Total Return</div>
                  <div className="text-sm font-black text-indigo-600 mt-0.5">{money(roiTotal)}</div>
                </div>
                <div className="rounded-xl bg-white border p-3 text-center">
                  <div className="text-[9px] text-zinc-400 font-bold uppercase">Total Nilai</div>
                  <div className="text-sm font-black text-zinc-800 mt-0.5">{money(roiAmountNum + roiTotal)}</div>
                </div>
                <div className="rounded-xl bg-white border p-3 text-center">
                  <div className="text-[9px] text-zinc-400 font-bold uppercase">% Bagi Hasil</div>
                  <div className="text-sm font-black text-amber-600 mt-0.5">{roiProject.revenueSharePercent ?? 0}%/thn</div>
                </div>
              </div>
            </div>
          )}
          {roiProject && (
            <button
              className="w-full rounded-xl bg-primary-600 hover:bg-primary-700 py-3 text-xs font-bold text-white shadow-sm transition-colors"
              onClick={() => { setModal('fund'); openFund(roiProject); }}
            >
              💰 Invest di Proyek {roiProject.name}
            </button>
          )}
        </div>
      </ModalShell>

      {/* ── FUND MODAL ── */}
      <ModalShell open={modal === 'fund'} onBackdropClick={() => saving ? undefined : setModal('')}>
        <div className="mx-auto max-w-3xl rounded-3xl bg-white border shadow-2xl p-6 max-h-[90vh] overflow-y-auto space-y-4 my-auto animate-scale-up border-zinc-150">
          <div className="flex justify-between items-center border-b pb-2">
            <h2 className="text-sm font-extrabold text-zinc-950 flex items-center gap-1.5">
              <span>✍️</span> Lembar Kemitraan: {projectDetail?.name}
            </h2>
            <button className="text-zinc-400 hover:text-zinc-600 text-lg font-bold" onClick={() => setModal('')}>&times;</button>
          </div>
          {error && (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-3.5 text-xs text-red-700 flex justify-between items-center">
              <span>{error}</span>
              <button className="font-bold hover:text-red-900 text-sm" onClick={() => setError('')}>&times;</button>
            </div>
          )}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-zinc-700">Surat Perjanjian Pendanaan</label>
            <div className="rounded-2xl bg-zinc-50 border p-3 text-xs max-h-56 overflow-y-auto leading-relaxed border-zinc-200 text-zinc-700" dangerouslySetInnerHTML={{ __html: agreement?.agreementBody || '<div class="p-4 text-center">Sedang memuat naskah perjanjian...</div>' }} />
          </div>
          <label className="flex gap-2 text-xs font-semibold text-zinc-700 items-start cursor-pointer">
            <input type="checkbox" className="mt-0.5 rounded border-zinc-350 text-primary-600 focus:ring-primary-500" checked={fundForm.acceptAgreement} onChange={(e) => setFundForm({ ...fundForm, acceptAgreement: e.target.checked })} />
            <span>Saya telah meneliti, memahami, dan menyetujui seluruh ketentuan Surat Perjanjian Project Funding di atas.</span>
          </label>
          <div className="grid md:grid-cols-2 gap-3.5 pt-2 border-t border-dashed">
            <div className="space-y-1">
              <label className="text-xs font-bold text-zinc-700">Nominal Pendanaan (Rupiah) *</label>
              <input className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-xs focus:ring-1 focus:ring-primary-500 focus:outline-none" type="text" placeholder="Contoh: Rp 5.000.000" value={fundForm.fundingAmount} onChange={(e) => setFundForm({ ...fundForm, fundingAmount: formatRupiah(e.target.value) })} />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-zinc-700">Bank Transfer Pengirim *</label>
              <input className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-xs focus:ring-1 focus:ring-primary-500 focus:outline-none" placeholder="Contoh: Bank Central Asia (BCA)" value={fundForm.transferBankName} onChange={(e) => setFundForm({ ...fundForm, transferBankName: e.target.value })} />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-zinc-700">Pemilik Rekening Transfer *</label>
              <input className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-xs focus:ring-1 focus:ring-primary-500 focus:outline-none" placeholder="Nama sesuai buku tabungan" value={fundForm.transferAccountName} onChange={(e) => setFundForm({ ...fundForm, transferAccountName: e.target.value })} />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-zinc-700">Nomor Referensi Transfer / Ref *</label>
              <input className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-xs focus:ring-1 focus:ring-primary-500 focus:outline-none" placeholder="Contoh: Ref-902381928" value={fundForm.transferReferenceNo} onChange={(e) => setFundForm({ ...fundForm, transferReferenceNo: e.target.value })} />
            </div>
            <div className="space-y-1 md:col-span-2">
              <label className="text-xs font-bold text-zinc-700">Bukti Transfer (URL) / Keterangan Lain</label>
              <input className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-xs focus:ring-1 focus:ring-primary-500 focus:outline-none" placeholder="URL bukti pembayaran (jika diupload dari luar)..." value={fundForm.proofUrl} onChange={(e) => setFundForm({ ...fundForm, proofUrl: e.target.value })} />
            </div>
          </div>
          <div className="space-y-1">
            <label className="block text-xs font-bold text-zinc-700">Upload Berkas Bukti Transfer</label>
            <div className="flex gap-2 items-center">
              <input type="file" className="hidden" id="investor-proof-upload" accept="image/*,.pdf" onChange={async (e) => {
                const f = e.target.files?.[0];
                if (!f) return;
                try { setSaving('upload-proof'); await uploadProof(f); } catch (err: any) { showToast(err?.message || 'Upload gagal', 'error'); } finally { setSaving(''); }
              }} />
              <label htmlFor="investor-proof-upload" className="rounded-xl border border-zinc-200 px-3.5 py-2 text-xs bg-zinc-150 hover:bg-zinc-200 cursor-pointer font-bold shrink-0 select-none">
                {saving === 'upload-proof' ? 'Uploading...' : '📁 Pilih Berkas Transfer'}
              </label>
              {fundForm.proofUrl && <a className="text-[10px] text-primary-600 font-bold hover:underline shrink-0" href={absoluteUrl(fundForm.proofUrl)} target="_blank" rel="noreferrer">Lihat bukti transfer terupload</a>}
            </div>
          </div>
          <div className="space-y-2">
            <div className="text-xs font-bold text-zinc-700">Bubuhkan Tanda Tangan Digital Anda *</div>
            <div className="relative border rounded-2xl overflow-hidden bg-white">
              <canvas ref={canvasRef} width={720} height={220} className="w-full h-40 bg-white touch-none" onPointerDown={startDraw} onPointerMove={draw} onPointerUp={() => { drawingRef.current = false; }} onPointerLeave={() => { drawingRef.current = false; }} />
            </div>
            <button className="rounded-lg border px-3 py-1.5 text-[10px] font-bold hover:bg-zinc-50 transition-colors" onClick={clearCanvas}>Hapus Tanda Tangan</button>
          </div>
          <div className="flex justify-end gap-2 pt-3 border-t">
            <button className="rounded-xl border px-4 py-2 text-xs font-semibold text-zinc-600 hover:bg-zinc-50" onClick={() => setModal('')}>Batal</button>
            <button disabled={saving === 'fund' || !fundForm.acceptAgreement} className="rounded-xl bg-primary-600 hover:bg-primary-700 px-4 py-2 text-xs font-bold text-white shadow-sm disabled:opacity-60 transition-colors" onClick={submitFunding}>
              {saving === 'fund' ? 'Mengirim...' : 'Submit Pendanaan'}
            </button>
          </div>
        </div>
      </ModalShell>

      {/* ── WITHDRAW MODAL ── */}
      <ModalShell open={modal === 'withdraw'} onBackdropClick={() => saving ? undefined : setModal('')}>
        <div className="mx-auto max-w-xl rounded-3xl bg-white border shadow-2xl p-6 space-y-4 my-auto animate-scale-up border-zinc-150">
          <div className="flex justify-between items-center border-b pb-2">
            <h2 className="text-sm font-extrabold text-zinc-950 flex items-center gap-1.5"><span>💸</span> Permohonan Pencairan Saldo (Withdrawal)</h2>
            <button className="text-zinc-400 hover:text-zinc-600 text-lg font-bold" onClick={() => setModal('')}>&times;</button>
          </div>
          <div className="rounded-2xl bg-amber-50 border border-amber-100 p-3 text-[11px] text-amber-800 flex gap-2 items-start">
            <span>⚠️</span>
            <span>Saldo tersedia: <b>{money(metrics.revenueBalance)}</b> · Minimal penarikan: <b>Rp 50.000</b></span>
          </div>
          {error && (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-3.5 text-xs text-red-700 flex justify-between items-center">
              <span>{error}</span>
              <button className="font-bold hover:text-red-900 text-sm" onClick={() => setError('')}>&times;</button>
            </div>
          )}
          <div className="space-y-3">
            <div className="space-y-1">
              <label className="text-xs font-bold text-zinc-700">Nominal Pencairan (Rupiah) *</label>
              <input className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-xs focus:ring-1 focus:ring-primary-500 focus:outline-none" type="text" placeholder="Contoh: Rp 10.000.000" value={withdrawForm.amount} onChange={(e) => setWithdrawForm({ ...withdrawForm, amount: formatRupiah(e.target.value) })} />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-zinc-700">Bank Penerima *</label>
              <input className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-xs focus:ring-1 focus:ring-primary-500 focus:outline-none" placeholder="Contoh: Bank Central Asia (BCA)" value={withdrawForm.bankName} onChange={(e) => setWithdrawForm({ ...withdrawForm, bankName: e.target.value })} />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-zinc-700">Nomor Rekening Penerima *</label>
              <input className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-xs focus:ring-1 focus:ring-primary-500 focus:outline-none" placeholder="Contoh: 8019283912" value={withdrawForm.bankAccountNo} onChange={(e) => setWithdrawForm({ ...withdrawForm, bankAccountNo: e.target.value })} />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-zinc-700">Nama Pemilik Rekening *</label>
              <input className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-xs focus:ring-1 focus:ring-primary-500 focus:outline-none" placeholder="Nama sesuai buku tabungan" value={withdrawForm.bankAccountName} onChange={(e) => setWithdrawForm({ ...withdrawForm, bankAccountName: e.target.value })} />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-zinc-700">Catatan / Deskripsi Tambahan</label>
              <input className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-xs focus:ring-1 focus:ring-primary-500 focus:outline-none" placeholder="Contoh: Penarikan deviden periode Mei" value={withdrawForm.notes} onChange={(e) => setWithdrawForm({ ...withdrawForm, notes: e.target.value })} />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-3 border-t">
            <button className="rounded-xl border px-4 py-2 text-xs font-semibold text-zinc-600 hover:bg-zinc-50" onClick={() => setModal('')}>Batal</button>
            <button disabled={saving === 'withdraw'} className="rounded-xl bg-primary-600 hover:bg-primary-700 px-4 py-2 text-xs font-bold text-white shadow-sm disabled:opacity-60 transition-colors" onClick={submitWithdraw}>
              {saving === 'withdraw' ? 'Mengirim...' : 'Ajukan Penarikan'}
            </button>
          </div>
        </div>
      </ModalShell>

      <div className="pt-2">
        <Link href="/akun" className="text-sm text-primary-600 hover:underline flex items-center gap-1 font-bold">
          <span>&larr;</span> Kembali ke Akun
        </Link>
      </div>
    </div>
  );
}
