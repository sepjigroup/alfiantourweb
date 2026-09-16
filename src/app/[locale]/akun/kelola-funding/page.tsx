'use client';

import { useEffect, useMemo, useState } from 'react';
import { ModalShell } from '@/components/ui/ModalShell';
import { JsonPayloadConsole } from '@/components/admin/JsonPayloadConsole';
import { apiDelete, apiGet, apiPost, apiPut, getApiBaseUrl, getAuthToken } from '@/lib/api-client';

const money = (v: unknown) => `Rp ${Number(v || 0).toLocaleString('id-ID')}`;
const emptyProject = { id: 0, code: '', name: '', slug: '', category: 'Umroh', shortDescription: '', description: '', targetAmount: '', minFundingAmount: '', revenueSharePercent: 0, revenueRule: 'Proportional', startDate: '', endDate: '', status: 'Draft', coverUrl: '', sortOrder: 0, isActive: true };
const projectActiveStatuses = new Set(['Published', 'FundingOpen', 'FundingClosed', 'Running', 'Completed']);
const isFundingActive = (form: any) => !!form?.isActive && projectActiveStatuses.has(String(form?.status || ''));

const sampleProjectPayload = JSON.stringify({
  name: 'Project Funding Umroh Lansia',
  code: 'PF-001',
  slug: 'project-funding-umroh-lansia',
  category: 'Umroh',
  shortDescription: 'Dana pengembangan project umroh lansia.',
  description: 'Project untuk kebutuhan operasional dan pengembangan layanan.',
  targetAmount: 500000000,
  minFundingAmount: 1000000,
  revenueSharePercent: 12.5,
  revenueRule: 'Proportional',
  startDate: new Date().toISOString(),
  endDate: null,
  status: 'Draft',
  coverUrl: '',
  sortOrder: 1,
  isActive: true,
}, null, 2);

// Curated outline colors
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

export default function KelolaFundingPage() {
  const [tab, setTab] = useState<'projects' | 'fundings' | 'revenue' | 'withdraw' | 'trust' | 'agreement' | 'docs' | 'audit'>('projects');
  const [dashboard, setDashboard] = useState<any>(null);
  const [projects, setProjects] = useState<any[]>([]);
  const [fundings, setFundings] = useState<any[]>([]);
  const [revenues, setRevenues] = useState<any[]>([]);
  const [withdraws, setWithdraws] = useState<any[]>([]);
  const [trust, setTrust] = useState<any[]>([]);
  const [agreements, setAgreements] = useState<any[]>([]);
  const [docs, setDocs] = useState<any[]>([]);
  const [timeline, setTimeline] = useState<any[]>([]);
  const [audit, setAudit] = useState<any[]>([]);
  const [preview, setPreview] = useState<any>(null);

  // Form states
  const [projectForm, setProjectForm] = useState<any>(emptyProject);
  const [projectJsonText, setProjectJsonText] = useState(sampleProjectPayload);
  const [revenueForm, setRevenueForm] = useState<any>({ projectFundingProjectId: '', revenuePeriod: new Date().toISOString().slice(0, 7), revenueAmount: '', description: '', attachmentUrl: '' });
  const [docForm, setDocForm] = useState<any>({ projectFundingProjectId: '', documentType: 'LegalDocument', title: '', fileUrl: '', description: '', fileName: '', isPublicToInvestor: true, sortOrder: 0 });
  const [timelineForm, setTimelineForm] = useState<any>({ projectFundingProjectId: '', title: '', description: '', eventDate: new Date().toISOString().slice(0, 16), statusLabel: 'Update', attachmentUrl: '', isPublicToInvestor: true });
  const [agreementForm, setAgreementForm] = useState<any>({ code: 'PROJECT_FUNDING_DEFAULT', title: 'Perjanjian Project Funding Alfian Tour', versionNo: `v${Date.now()}`, agreementBody: '<h1>Perjanjian Project Funding</h1><p>Isi pasal perjanjian...</p>', status: 'Draft' });

  // UI state
  const [modal, setModal] = useState('');
  const [saving, setSaving] = useState('');
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [showJsonConsole, setShowJsonConsole] = useState(false);

  // Custom reusable confirmation modal state
  const [confirmModal, setConfirmModal] = useState<{
    open: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  } | null>(null);

  // Filters & selection
  const [fundingStatusFilter, setFundingStatusFilter] = useState<'All' | 'Pending' | 'Approved' | 'Rejected' | 'Cancelled'>('All');
  const [fundingQuery, setFundingQuery] = useState('');
  const [selectedFundingId, setSelectedFundingId] = useState<number | null>(null);

  const [withdrawStatusFilter, setWithdrawStatusFilter] = useState<'All' | 'Pending' | 'Approved' | 'Rejected' | 'Paid' | 'Cancelled'>('All');
  const [withdrawQuery, setWithdrawQuery] = useState('');
  const [selectedWithdrawId, setSelectedWithdrawId] = useState<number | null>(null);

  const [withdrawNote, setWithdrawNote] = useState('Set status dari admin');
  const [withdrawReason, setWithdrawReason] = useState('Ditolak admin');
  const [withdrawPaymentRef, setWithdrawPaymentRef] = useState('');

  const [fundingRejectReason, setFundingRejectReason] = useState('');
  const [showRejectFundingId, setShowRejectFundingId] = useState<number | null>(null);

  const activeProjects = useMemo(() => projects.filter((x) => x.status !== 'Draft' && x.status !== 'Cancelled'), [projects]);
  const projectFundingCounts = useMemo(() => {
    const counts = new Map<number, number>();
    fundings.forEach((row) => {
      const id = Number(row.projectFundingProjectId || 0);
      if (!id) return;
      counts.set(id, (counts.get(id) || 0) + 1);
    });
    return counts;
  }, [fundings]);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 3500);
  };

  const projectPayloadFromForm = (form: any) => ({
    id: form.id && Number(form.id) > 0 ? Number(form.id) : undefined,
    code: String(form.code || '').trim(),
    name: String(form.name || '').trim(),
    slug: String(form.slug || '').trim(),
    category: String(form.category || '').trim(),
    shortDescription: String(form.shortDescription || '').trim(),
    description: String(form.description || '').trim(),
    targetAmount: parseRupiah(form.targetAmount),
    minFundingAmount: parseRupiah(form.minFundingAmount),
    revenueSharePercent: Number(form.revenueSharePercent || 0),
    revenueRule: String(form.revenueRule || 'Proportional'),
    startDate: form.startDate ? new Date(form.startDate).toISOString() : null,
    endDate: form.endDate ? new Date(form.endDate).toISOString() : null,
    status: String(form.status || 'Draft'),
    coverUrl: String(form.coverUrl || '').trim(),
    sortOrder: Number(form.sortOrder || 0),
    isActive: !!form.isActive,
  });

  const normalizeProjectJson = (raw: any) => ({
    ...raw,
    id: raw?.id && Number(raw.id) > 0 ? Number(raw.id) : undefined,
    targetAmount: Number(raw?.targetAmount || 0),
    minFundingAmount: Number(raw?.minFundingAmount || 0),
    revenueSharePercent: Number(raw?.revenueSharePercent || 0),
    sortOrder: Number(raw?.sortOrder || 0),
    startDate: raw?.startDate ? new Date(raw.startDate).toISOString() : null,
    endDate: raw?.endDate ? new Date(raw.endDate).toISOString() : null,
    isActive: raw?.isActive !== undefined ? !!raw.isActive : true,
  });

  const filteredFundings = useMemo(() => {
    const q = fundingQuery.trim().toLowerCase();
    return fundings.filter((row) => {
      if (fundingStatusFilter !== 'All' && String(row.status || '') !== fundingStatusFilter) return false;
      if (!q) return true;
      const haystack = [
        row.projectName,
        row.fullName,
        row.userName,
        row.status,
        row.transferReferenceNo,
        row.transferBankName,
        row.transferAccountName,
        row.proofUrl,
        row.notes,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [fundingQuery, fundingStatusFilter, fundings]);

  const selectedFunding = useMemo(
    () => filteredFundings.find((row) => row.id === selectedFundingId) ?? filteredFundings[0] ?? null,
    [filteredFundings, selectedFundingId]
  );

  const filteredWithdraws = useMemo(() => {
    const q = withdrawQuery.trim().toLowerCase();
    return withdraws.filter((row) => {
      if (withdrawStatusFilter !== 'All' && String(row.status || '') !== withdrawStatusFilter) return false;
      if (!q) return true;
      const haystack = [
        row.fullName,
        row.userName,
        row.status,
        row.bankName,
        row.bankAccountNo,
        row.bankAccountName,
        row.paymentReferenceNo,
        row.rejectionReason,
        row.notes,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [withdrawQuery, withdrawStatusFilter, withdraws]);

  const selectedWithdraw = useMemo(
    () => filteredWithdraws.find((row) => row.id === selectedWithdrawId) ?? filteredWithdraws[0] ?? null,
    [filteredWithdraws, selectedWithdrawId]
  );

  useEffect(() => {
    if (filteredWithdraws.length === 0) {
      if (selectedWithdrawId !== null) setSelectedWithdrawId(null);
      return;
    }
    if (!filteredWithdraws.some((row) => row.id === selectedWithdrawId)) {
      setSelectedWithdrawId(filteredWithdraws[0].id);
    }
  }, [filteredWithdraws, selectedWithdrawId]);

  useEffect(() => {
    if (filteredFundings.length === 0) {
      if (selectedFundingId !== null) setSelectedFundingId(null);
      return;
    }
    if (!filteredFundings.some((row) => row.id === selectedFundingId)) {
      setSelectedFundingId(filteredFundings[0].id);
    }
  }, [filteredFundings, selectedFundingId]);

  const load = async () => {
    setLoading(true);
    try {
      const [d, p, f, r, w, t, a, docsRes, timelineRes, auditRes] = await Promise.all([
        apiGet<any>('/api/ProjectFunding/admin/dashboard'),
        apiGet<any>('/api/ProjectFunding/admin/projects?page=1&pageSize=100'),
        apiGet<any>('/api/ProjectFunding/admin/fundings'),
        apiGet<any>('/api/ProjectFunding/admin/revenue'),
        apiGet<any>('/api/ProjectFunding/admin/withdraws'),
        apiGet<any>('/api/ProjectFunding/admin/trust-settings'),
        apiGet<any>('/api/ProjectFunding/admin/agreement-templates'),
        apiGet<any>('/api/ProjectFunding/admin/documents'),
        apiGet<any>('/api/ProjectFunding/admin/timeline'),
        apiGet<any>('/api/ProjectFunding/admin/audit-logs?pageSize=50'),
      ]);
      setDashboard(d?.data ?? null);
      setProjects(p?.data?.items ?? []);
      setFundings(f?.data ?? []);
      setRevenues(r?.data ?? []);
      setWithdraws(w?.data ?? []);
      setTrust(t?.data ?? []);
      setAgreements(a?.data ?? []);
      setDocs(docsRes?.data ?? []);
      setTimeline(timelineRes?.data ?? []);
      setAudit(auditRes?.data?.items ?? []);
    } catch (e: any) {
      showToast(e?.message || 'Gagal memuat data funding', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);

  const openProject = (row?: any) => {
    setProjectForm(row ? {
      ...emptyProject,
      ...row,
      targetAmount: formatRupiah(row.targetAmount),
      minFundingAmount: formatRupiah(row.minFundingAmount),
      startDate: row.startDate ? new Date(row.startDate).toISOString().slice(0, 16) : '',
      endDate: row.endDate ? new Date(row.endDate).toISOString().slice(0, 16) : ''
    } : {
      ...emptyProject,
      targetAmount: formatRupiah(100000000),
      minFundingAmount: formatRupiah(1000000),
      startDate: new Date().toISOString().slice(0, 16)
    });
    setProjectJsonText(JSON.stringify(projectPayloadFromForm(row ? { ...emptyProject, ...row, startDate: row.startDate ? new Date(row.startDate).toISOString().slice(0, 16) : '', endDate: row.endDate ? new Date(row.endDate).toISOString().slice(0, 16) : '' } : emptyProject), null, 2));
    setModal('project');
  };

  const deleteProject = (id: number, name: string) => {
    setConfirmModal({
      open: true,
      title: 'Hapus Project Funding',
      message: `Apakah Anda yakin ingin menghapus project funding "${name}"? Tindakan ini bersifat permanen dan hanya dapat dilakukan jika belum ada pendanaan masuk.`,
      onConfirm: async () => {
        setSaving(`project-delete-${id}`);
        try {
          await apiDelete(`/api/ProjectFunding/admin/projects/${id}`);
          showToast('Project funding berhasil dihapus!');
          setModal('');
          await load();
        } catch (e: any) {
          showToast(e?.message || 'Gagal hapus project', 'error');
        } finally {
          setSaving('');
        }
      }
    });
  };

  const saveProject = async () => {
    setSaving('project');
    try {
      const body = projectPayloadFromForm(projectForm);
      if (projectForm.id) await apiPut(`/api/ProjectFunding/admin/projects/${projectForm.id}`, body);
      else await apiPost('/api/ProjectFunding/admin/projects', body);
      setModal('');
      showToast('Project funding berhasil disimpan!');
      await load();
    } catch (e: any) {
      showToast(e?.message || 'Gagal simpan project', 'error');
    } finally {
      setSaving('');
    }
  };

  const saveProjectFromJson = async () => {
    setSaving('project-json');
    try {
      const parsed = JSON.parse(projectJsonText);
      const rows = Array.isArray(parsed) ? parsed : [parsed];
      if (rows.length === 0) throw new Error('JSON tidak boleh kosong');
      for (const raw of rows) {
        const body = normalizeProjectJson(raw);
        if (body.id) await apiPut(`/api/ProjectFunding/admin/projects/${body.id}`, body);
        else await apiPost('/api/ProjectFunding/admin/projects', body);
      }
      setModal('');
      showToast(`JSON project berhasil diproses: ${rows.length}`);
      await load();
    } catch (e: any) {
      showToast(e?.message || 'Gagal eksekusi JSON project', 'error');
    } finally {
      setSaving('');
    }
  };

  const approveFunding = (id: number) => {
    setConfirmModal({
      open: true,
      title: 'Setujui Pendanaan',
      message: 'Apakah Anda yakin ingin menyetujui transaksi pendanaan ini? Setelah disetujui, saldo akan didistribusikan ke project.',
      onConfirm: async () => {
        setSaving(`funding-${id}`);
        try {
          await apiPost(`/api/ProjectFunding/admin/fundings/${id}/approve`);
          showToast('Funding berhasil disetujui (Approved)!');
          await load();
        } catch (e: any) {
          showToast(e?.message || 'Gagal approve funding', 'error');
        } finally {
          setSaving('');
        }
      }
    });
  };

  const handleRejectFundingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const id = showRejectFundingId;
    if (!id) return;
    if (!fundingRejectReason.trim()) {
      showToast('Alasan reject wajib diisi.', 'error');
      return;
    }
    setSaving(`funding-${id}`);
    try {
      await apiPost(`/api/ProjectFunding/admin/fundings/${id}/reject`, { reason: fundingRejectReason.trim() });
      showToast('Funding berhasil ditolak (Rejected)');
      setShowRejectFundingId(null);
      setFundingRejectReason('');
      await load();
    } catch (err: any) {
      showToast(err?.message || 'Gagal reject funding', 'error');
    } finally {
      setSaving('');
    }
  };

  const saveRevenue = async () => {
    if (!revenueForm.projectFundingProjectId || !revenueForm.revenueAmount) {
      showToast('Project dan nominal revenue wajib diisi.', 'error');
      return;
    }
    setSaving('revenue');
    try {
      await apiPost('/api/ProjectFunding/admin/revenue', {
        ...revenueForm,
        projectFundingProjectId: Number(revenueForm.projectFundingProjectId),
        revenueAmount: parseRupiah(revenueForm.revenueAmount),
      });
      setRevenueForm({ projectFundingProjectId: '', revenuePeriod: new Date().toISOString().slice(0, 7), revenueAmount: '', description: '', attachmentUrl: '' });
      showToast('Revenue berhasil dicatat!');
      await load();
    } catch (e: any) {
      showToast(e?.message || 'Gagal simpan revenue', 'error');
    } finally {
      setSaving('');
    }
  };

  const publishRevenue = (id: number) => {
    setConfirmModal({
      open: true,
      title: 'Publish Distribusi Laba (Revenue)',
      message: 'Publish revenue akan mengunci distribusi bagi hasil dan membagikan dividen ke saldo masing-masing investor secara proporsional. Lanjutkan?',
      onConfirm: async () => {
        setSaving(`revenue-${id}`);
        try {
          await apiPost(`/api/ProjectFunding/admin/revenue/${id}/publish`);
          showToast('Revenue dipublish dan hasil terdistribusi!');
          await load();
        } catch (e: any) {
          showToast(e?.message || 'Gagal publish revenue', 'error');
        } finally {
          setSaving('');
        }
      }
    });
  };

  const previewRevenue = async (id: number) => {
    try {
      const res = await apiGet<any>(`/api/ProjectFunding/admin/revenue/${id}/preview`);
      setPreview(res?.data ?? null);
      setModal('preview');
    } catch (e: any) {
      showToast(e?.message || 'Gagal memuat preview revenue', 'error');
    }
  };

  const uploadFundingFile = async (file: File, folder: string) => {
    const fd = new FormData();
    fd.append('file', file);
    fd.append('folder', folder);
    const headers: Record<string, string> = {};
    const token = getAuthToken();
    if (token) headers.Authorization = `Bearer ${token}`;
    const res = await fetch(`${getApiBaseUrl()}/api/ProjectFunding/admin/upload`, { method: 'POST', headers, body: fd });
    const json = await res.json().catch(() => null);
    if (!res.ok) throw new Error(json?.message || `Upload gagal (${res.status})`);
    return json?.data?.url || '';
  };

  const openAgreementEvidence = async (id: number) => {
    const token = getAuthToken();
    const res = await fetch(`${getApiBaseUrl()}/api/ProjectFunding/admin/agreements/${id}/html`, { headers: token ? { Authorization: `Bearer ${token}` } : undefined });
    const html = await res.text();
    if (!res.ok) {
      showToast('Gagal membuka bukti agreement', 'error');
      return;
    }
    const blob = new Blob([html], { type: 'text/html' });
    window.open(URL.createObjectURL(blob), '_blank', 'noopener,noreferrer');
  };

  const updateWithdrawWithForm = async (id: number, status: string) => {
    setSaving(`withdraw-${id}`);
    try {
      await apiPost(`/api/ProjectFunding/admin/withdraws/${id}/status`, {
        status,
        notes: withdrawNote || `Set ${status} dari admin`,
        reason: status === 'Rejected' ? (withdrawReason || 'Ditolak admin') : '',
        paymentReferenceNo: status === 'Paid' ? (withdrawPaymentRef || `PAY-${Date.now()}`) : '',
      });
      showToast(`Status withdraw berhasil diperbarui menjadi ${status}!`);
      await load();
    } catch (e: any) {
      showToast(e?.message || 'Gagal memperbarui status withdraw', 'error');
    } finally {
      setSaving('');
    }
  };

  const updateTrust = async (x: any, value: string) => {
    setSaving(`trust-${x.settingKey}`);
    try {
      await apiPut(`/api/ProjectFunding/admin/trust-settings/${x.settingKey}`, { value, note: 'Update dari UI admin' });
      showToast('Trust setting berhasil diperbarui!');
      await load();
    } catch (e: any) {
      showToast(e?.message || 'Gagal update trust setting', 'error');
    } finally {
      setSaving('');
    }
  };

  const saveAgreement = async () => {
    setSaving('agreement');
    try {
      await apiPost('/api/ProjectFunding/admin/agreement-templates', agreementForm);
      showToast('Agreement template berhasil disimpan!');
      await load();
    } catch (e: any) {
      showToast(e?.message || 'Gagal simpan agreement template', 'error');
    } finally {
      setSaving('');
    }
  };

  const saveDoc = async () => {
    if (!docForm.projectFundingProjectId || !docForm.title || !docForm.fileUrl) {
      showToast('Project, judul, dan file dokumen wajib diisi.', 'error');
      return;
    }
    setSaving('doc');
    try {
      await apiPost('/api/ProjectFunding/admin/documents', { ...docForm, projectFundingProjectId: Number(docForm.projectFundingProjectId) });
      setDocForm({ projectFundingProjectId: '', documentType: 'LegalDocument', title: '', fileUrl: '', description: '', fileName: '', isPublicToInvestor: true, sortOrder: 0 });
      showToast('Dokumen legal berhasil diupload!');
      await load();
    } catch (e: any) {
      showToast(e?.message || 'Gagal simpan dokumen', 'error');
    } finally {
      setSaving('');
    }
  };

  const saveTimeline = async () => {
    if (!timelineForm.projectFundingProjectId || !timelineForm.title) {
      showToast('Project dan judul event wajib diisi.', 'error');
      return;
    }
    setSaving('timeline');
    try {
      await apiPost('/api/ProjectFunding/admin/timeline', {
        ...timelineForm,
        projectFundingProjectId: Number(timelineForm.projectFundingProjectId),
        eventDate: timelineForm.eventDate ? new Date(timelineForm.eventDate).toISOString() : null
      });
      setTimelineForm({ projectFundingProjectId: '', title: '', description: '', eventDate: new Date().toISOString().slice(0, 16), statusLabel: 'Update', attachmentUrl: '', isPublicToInvestor: true });
      showToast('Timeline project berhasil dicatat!');
      await load();
    } catch (e: any) {
      showToast(e?.message || 'Gagal simpan timeline', 'error');
    } finally {
      setSaving('');
    }
  };

  const printFundingSlip = (row: any) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      showToast('Pop-up blocker aktif. Tolong izinkan pop-up untuk mencetak.', 'error');
      return;
    }
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Bukti Pendanaan - ${row.fullName || row.userName}</title>
        <meta charset="utf-8">
        <style>
          @page { size: A4; margin: 20mm; }
          body { font-family: 'Segoe UI', Helvetica, Arial, sans-serif; color: #18181b; margin: 0; padding: 0; line-height: 1.5; }
          .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 3px double #18181b; padding-bottom: 10px; margin-bottom: 25px; }
          .logo-area { display: flex; align-items: center; gap: 10px; }
          .logo-text { font-size: 20px; font-weight: 900; color: #047857; letter-spacing: 1px; }
          .company-info { text-align: right; font-size: 10px; color: #71717a; }
          .title { text-align: center; margin-top: 10px; margin-bottom: 25px; text-transform: uppercase; font-size: 15px; font-weight: 850; letter-spacing: 2px; border-bottom: 1px solid #e4e4e7; padding-bottom: 5px; }
          .receipt-table { width: 100%; border-collapse: collapse; margin-bottom: 40px; }
          .receipt-table td { padding: 12px 10px; border-bottom: 1px solid #e4e4e7; font-size: 13px; }
          .receipt-table td.label { font-weight: bold; color: #52525b; width: 220px; }
          .receipt-table td.value { font-weight: 600; }
          .signatures { display: grid; grid-template-columns: 1fr 1fr; gap: 50px; margin-top: 60px; page-break-inside: avoid; }
          .sig-box { text-align: center; font-size: 12px; }
          .sig-space { height: 75px; }
          .sig-line { border-top: 1px solid #18181b; width: 180px; margin: 0 auto 5px auto; font-weight: bold; }
          .print-btn { background-color: #047857; color: white; border: none; padding: 10px 20px; font-size: 14px; font-weight: bold; border-radius: 8px; cursor: pointer; margin: 20px auto; display: block; }
          @media print {
            .print-btn { display: none; }
          }
        </style>
      </head>
      <body>
        <button class="print-btn" onclick="window.print()">Cetak Slip Pendanaan (Print A4)</button>
        <div class="header">
          <div class="logo-area"><div class="logo-text">ALFIAN TOUR</div></div>
          <div class="company-info">
            <strong>PT ALFIAN SEJAHTERA ABADI</strong><br>
            Spesialis Haji & Umroh Lansia (Kakek-Nenek)<br>
            Telp/WA: +62 812-3456-7890 | alfiantour.com
          </div>
        </div>
        <div class="title">Bukti Penerimaan Dana Project Funding</div>
        <table class="receipt-table">
          <tr>
            <td class="label">Nama Investor</td>
            <td class="value">: ${row.fullName || row.userName}</td>
          </tr>
          <tr>
            <td class="label">Username / Account</td>
            <td class="value">: ${row.userName}</td>
          </tr>
          <tr>
            <td class="label">Project Tujuan</td>
            <td class="value">: ${row.projectName}</td>
          </tr>
          <tr>
            <td class="label">Nominal Pendanaan</td>
            <td class="value" style="font-size: 15px; color: #047857; font-weight: 800;">: Rp ${Number(row.fundingAmount || 0).toLocaleString('id-ID')}</td>
          </tr>
          <tr>
            <td class="label">Metode / Bank Pengirim</td>
            <td class="value">: ${row.transferBankName || '-'}</td>
          </tr>
          <tr>
            <td class="label">Atas Nama Rekening</td>
            <td class="value">: ${row.transferAccountName || '-'}</td>
          </tr>
          <tr>
            <td class="label">Nomor Referensi Transfer</td>
            <td class="value" style="font-family: monospace;">: ${row.transferReferenceNo || '-'}</td>
          </tr>
          <tr>
            <td class="label">Tanggal Pengajuan</td>
            <td class="value">: ${row.submittedAt ? new Date(row.submittedAt).toLocaleString('id-ID') : '-'}</td>
          </tr>
          <tr>
            <td class="label">Status Verifikasi</td>
            <td class="value" style="text-transform: uppercase; font-weight: bold; color: ${row.status === 'Approved' ? '#047857' : '#b91c1c'}">: ${row.status}</td>
          </tr>
          ${row.notes ? `<tr><td class="label">Catatan Admin</td><td class="value">: ${row.notes}</td></tr>` : ''}
        </table>
        <div class="signatures">
          <div class="sig-box">
            <p>Mengetahui,</p>
            <p style="font-weight: bold; margin-bottom: 5px;">Investor</p>
            <div class="sig-space"></div>
            <div class="sig-line">${row.fullName || row.userName}</div>
            <span>Tanda Tangan Digital</span>
          </div>
          <div class="sig-box">
            <p>Jakarta, ${new Date().toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
            <p style="font-weight: bold; margin-bottom: 5px;">Manajer Funding / Admin Keuangan</p>
            <div class="sig-space"></div>
            <div class="sig-line">Alfian Tour Admin</div>
            <span>Petugas Berwenang</span>
          </div>
        </div>
        <script>
          window.onload = function() { setTimeout(function() { window.print(); }, 500); }
        </script>
      </body>
      </html>
    `;
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  const printWithdrawSlip = (row: any) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      showToast('Pop-up blocker aktif. Tolong izinkan pop-up untuk mencetak.', 'error');
      return;
    }
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Bukti Penarikan - ${row.fullName || row.userName}</title>
        <meta charset="utf-8">
        <style>
          @page { size: A4; margin: 20mm; }
          body { font-family: 'Segoe UI', Helvetica, Arial, sans-serif; color: #18181b; margin: 0; padding: 0; line-height: 1.5; }
          .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 3px double #18181b; padding-bottom: 10px; margin-bottom: 25px; }
          .logo-area { display: flex; align-items: center; gap: 10px; }
          .logo-text { font-size: 20px; font-weight: 900; color: #047857; letter-spacing: 1px; }
          .company-info { text-align: right; font-size: 10px; color: #71717a; }
          .title { text-align: center; margin-top: 10px; margin-bottom: 25px; text-transform: uppercase; font-size: 15px; font-weight: 850; letter-spacing: 2px; border-bottom: 1px solid #e4e4e7; padding-bottom: 5px; }
          .receipt-table { width: 100%; border-collapse: collapse; margin-bottom: 40px; }
          .receipt-table td { padding: 12px 10px; border-bottom: 1px solid #e4e4e7; font-size: 13px; }
          .receipt-table td.label { font-weight: bold; color: #52525b; width: 220px; }
          .receipt-table td.value { font-weight: 600; }
          .signatures { display: grid; grid-template-columns: 1fr 1fr; gap: 50px; margin-top: 60px; page-break-inside: avoid; }
          .sig-box { text-align: center; font-size: 12px; }
          .sig-space { height: 75px; }
          .sig-line { border-top: 1px solid #18181b; width: 180px; margin: 0 auto 5px auto; font-weight: bold; }
          .print-btn { background-color: #047857; color: white; border: none; padding: 10px 20px; font-size: 14px; font-weight: bold; border-radius: 8px; cursor: pointer; margin: 20px auto; display: block; }
          @media print {
            .print-btn { display: none; }
          }
        </style>
      </head>
      <body>
        <button class="print-btn" onclick="window.print()">Cetak Slip Penarikan (Print A4)</button>
        <div class="header">
          <div class="logo-area"><div class="logo-text">ALFIAN TOUR</div></div>
          <div class="company-info">
            <strong>PT ALFIAN SEJAHTERA ABADI</strong><br>
            Spesialis Haji & Umroh Lansia (Kakek-Nenek)<br>
            Telp/WA: +62 812-3456-7890 | alfiantour.com
          </div>
        </div>
        <div class="title">Kwitansi Penarikan Hasil Revenue (Withdrawal Receipt)</div>
        <table class="receipt-table">
          <tr>
            <td class="label">Nama Investor</td>
            <td class="value">: ${row.fullName || row.userName}</td>
          </tr>
          <tr>
            <td class="label">Nominal Penarikan</td>
            <td class="value" style="font-size: 15px; color: #b91c1c; font-weight: 800;">: Rp ${Number(row.amount || 0).toLocaleString('id-ID')}</td>
          </tr>
          <tr>
            <td class="label">Bank Tujuan Transfer</td>
            <td class="value">: ${row.bankName || '-'}</td>
          </tr>
          <tr>
            <td class="label">Nomor Rekening Tujuan</td>
            <td class="value" style="font-family: monospace;">: ${row.bankAccountNo || '-'}</td>
          </tr>
          <tr>
            <td class="label">Pemilik Rekening Tujuan</td>
            <td class="value">: ${row.bankAccountName || '-'}</td>
          </tr>
          <tr>
            <td class="label">Tanggal Pengajuan</td>
            <td class="value">: ${row.requestedAt ? new Date(row.requestedAt).toLocaleString('id-ID') : '-'}</td>
          </tr>
          <tr>
            <td class="label">Nomor Referensi Payment</td>
            <td class="value" style="font-family: monospace;">: ${row.paymentReferenceNo || '-'}</td>
          </tr>
          <tr>
            <td class="label">Status Penarikan</td>
            <td class="value" style="text-transform: uppercase; font-weight: bold; color: ${row.status === 'Paid' || row.status === 'Approved' ? '#047857' : '#b91c1c'}">: ${row.status}</td>
          </tr>
          ${row.notes ? `<tr><td class="label">Catatan Admin/Status</td><td class="value">: ${row.notes}</td></tr>` : ''}
          ${row.rejectionReason ? `<tr><td class="label">Alasan Penolakan</td><td class="value">: ${row.rejectionReason}</td></tr>` : ''}
        </table>
        <div class="signatures">
          <div class="sig-box">
            <p>Mengetahui,</p>
            <p style="font-weight: bold; margin-bottom: 5px;">Penerima / Investor</p>
            <div class="sig-space"></div>
            <div class="sig-line">${row.fullName || row.userName}</div>
            <span>Tanda Tangan Digital</span>
          </div>
          <div class="sig-box">
            <p>Jakarta, ${new Date().toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
            <p style="font-weight: bold; margin-bottom: 5px;">Kasir Keuangan / Direktur</p>
            <div class="sig-space"></div>
            <div class="sig-line">Alfian Tour Admin</div>
            <span>Petugas Berwenang</span>
          </div>
        </div>
        <script>
          window.onload = function() { setTimeout(function() { window.print(); }, 500); }
        </script>
      </body>
      </html>
    `;
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  const printFundingReport = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      showToast('Pop-up blocker aktif. Tolong izinkan pop-up untuk mencetak.', 'error');
      return;
    }

    const projectsHtml = projects.map((x, idx) => `
      <tr style="border-bottom: 1px solid #e4e4e7; font-size: 10px;">
        <td style="padding: 6px; text-align: center;">${idx + 1}</td>
        <td style="padding: 6px;"><b>${x.name}</b><br><span style="color: #71717a; font-size: 9px;">Code: ${x.code}</span></td>
        <td style="padding: 6px; text-align: center;">${x.category}</td>
        <td style="padding: 6px; text-align: right;">${money(x.targetAmount)}</td>
        <td style="padding: 6px; text-align: right; font-weight: bold;">${money(x.collectedAmount)}</td>
        <td style="padding: 6px; text-align: center;">${x.progressPercent}%</td>
        <td style="padding: 6px; text-align: center;">${x.revenueSharePercent}%</td>
        <td style="padding: 6px; text-align: center;">${x.status}</td>
      </tr>
    `).join('');

    const fundingsHtml = fundings.slice(0, 15).map((x, idx) => {
      const dateStr = x.submittedAt ? new Date(x.submittedAt).toLocaleDateString('id-ID', { year: 'numeric', month: '2-digit', day: '2-digit' }) : '-';
      return `
        <tr style="border-bottom: 1px solid #e4e4e7; font-size: 10px;">
          <td style="padding: 6px; text-align: center;">${idx + 1}</td>
          <td style="padding: 6px; text-align: center;">${dateStr}</td>
          <td style="padding: 6px;"><b>${x.fullName || x.userName}</b></td>
          <td style="padding: 6px;">${x.projectName}</td>
          <td style="padding: 6px; text-align: right; font-weight: bold;">${money(x.fundingAmount)}</td>
          <td style="padding: 6px; text-align: center;">${x.transferBankName || '-'}</td>
          <td style="padding: 6px; text-align: center;">${x.status}</td>
        </tr>
      `;
    }).join('');

    const withdrawsHtml = withdraws.slice(0, 15).map((x, idx) => {
      const dateStr = x.requestedAt ? new Date(x.requestedAt).toLocaleDateString('id-ID', { year: 'numeric', month: '2-digit', day: '2-digit' }) : '-';
      return `
        <tr style="border-bottom: 1px solid #e4e4e7; font-size: 10px;">
          <td style="padding: 6px; text-align: center;">${idx + 1}</td>
          <td style="padding: 6px; text-align: center;">${dateStr}</td>
          <td style="padding: 6px;"><b>${x.fullName || x.userName}</b></td>
          <td style="padding: 6px;">${x.bankName} (${x.bankAccountNo})</td>
          <td style="padding: 6px; text-align: right; font-weight: bold;">${money(x.amount)}</td>
          <td style="padding: 6px; text-align: center;">${x.status}</td>
        </tr>
      `;
    }).join('');

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Laporan Keuangan Project Funding</title>
        <meta charset="utf-8">
        <style>
          @page { size: A4; margin: 15mm; }
          body { font-family: 'Segoe UI', Helvetica, Arial, sans-serif; color: #18181b; margin: 0; padding: 0; line-height: 1.4; }
          .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 3px double #18181b; padding-bottom: 8px; margin-bottom: 15px; }
          .logo-area { display: flex; align-items: center; gap: 10px; }
          .logo-text { font-size: 20px; font-weight: 900; color: #047857; letter-spacing: 1px; }
          .company-info { text-align: right; font-size: 9px; color: #71717a; }
          .title { text-align: center; margin-top: 5px; margin-bottom: 15px; text-transform: uppercase; font-size: 14px; font-weight: 800; letter-spacing: 1.5px; border-bottom: 1px solid #e4e4e7; padding-bottom: 5px; }
          
          .stats-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 10px; margin-bottom: 20px; }
          .stat-card { border: 1px solid #e4e4e7; border-radius: 8px; padding: 10px; background-color: #fafafa; }
          .stat-label { font-size: 8px; text-transform: uppercase; color: #71717a; font-weight: bold; }
          .stat-val { font-size: 11px; font-weight: 900; margin-top: 4px; color: #0f172a; }

          h3 { font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: #047857; margin-top: 20px; margin-bottom: 8px; border-bottom: 1px solid #f4f4f5; padding-bottom: 3px; }
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
        <button class="print-btn" onclick="window.print()">Cetak Laporan Keuangan A4</button>
        
        <div class="header">
          <div class="logo-area">
            <div class="logo-text">ALFIAN TOUR</div>
          </div>
          <div class="company-info">
            <strong>PT ALFIAN SEJAHTERA ABADI</strong><br>
            Telp/WA: +62 812-3456-7890 | alfiantour.com
          </div>
        </div>

        <div class="title">Laporan Keuangan & Progress Project Funding</div>

        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-label">Total Projects</div>
            <div class="stat-val">${dashboard ? `${dashboard.projects} Projects` : '-'}</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">Total Approved Funding</div>
            <div class="stat-val">${dashboard ? money(dashboard.approvedFunding) : '-'}</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">Total Revenue Paid</div>
            <div class="stat-val">${dashboard ? money(dashboard.revenuePaid) : '-'}</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">Pending Funding</div>
            <div class="stat-val">${dashboard ? `${dashboard.pendingFundings} Transaksi` : '-'}</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">Pending Withdraw</div>
            <div class="stat-val">${dashboard ? `${dashboard.pendingWithdraws} Request` : '-'}</div>
          </div>
        </div>

        <h3>1. Status & Progress Project Funding</h3>
        <table>
          <thead>
            <tr>
              <th style="width: 5%">No</th>
              <th>Nama Project</th>
              <th>Kategori</th>
              <th style="width: 15%; text-align: right;">Target Dana</th>
              <th style="width: 15%; text-align: right;">Dana Terkumpul</th>
              <th style="width: 10%">Progress</th>
              <th style="width: 10%">Bagi Hasil %</th>
              <th style="width: 10%">Status</th>
            </tr>
          </thead>
          <tbody>
            ${projectsHtml || '<tr><td colspan="8" style="text-align: center; padding: 10px;">Tidak ada project termuat.</td></tr>'}
          </tbody>
        </table>

        <h3>2. Transaksi Pendanaan Terbaru (15 Transaksi Terakhir)</h3>
        <table>
          <thead>
            <tr>
              <th style="width: 5%">No</th>
              <th style="width: 12%">Tanggal</th>
              <th>Nama Investor</th>
              <th>Project Funding</th>
              <th style="width: 15%; text-align: right;">Nominal</th>
              <th style="width: 15%">Bank Transfer</th>
              <th style="width: 10%">Status</th>
            </tr>
          </thead>
          <tbody>
            ${fundingsHtml || '<tr><td colspan="7" style="text-align: center; padding: 10px;">Tidak ada transaksi pendanaan termuat.</td></tr>'}
          </tbody>
        </table>

        <h3>3. Permohonan Penarikan Hasil (15 Request Terakhir)</h3>
        <table>
          <thead>
            <tr>
              <th style="width: 5%">No</th>
              <th style="width: 12%">Tanggal</th>
              <th>Nama Investor</th>
              <th>Tujuan Transfer</th>
              <th style="width: 15%; text-align: right;">Nominal</th>
              <th style="width: 10%">Status</th>
            </tr>
          </thead>
          <tbody>
            ${withdrawsHtml || '<tr><td colspan="6" style="text-align: center; padding: 10px;">Tidak ada request penarikan termuat.</td></tr>'}
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
            <p style="font-weight: bold; margin-bottom: 5px;">Manajer Kemitraan & Keuangan</p>
            <div class="sig-space"></div>
            <div class="sig-line">Alfian Tour Admin</div>
            <span>Petugas Pemeriksa</span>
          </div>
        </div>

        <script>
          window.onload = function() { setTimeout(function() { window.print(); }, 500); }
        </script>
      </body>
      </html>
    `;
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  const exportAuditLogsCsv = () => {
    if (audit.length === 0) {
      showToast('Tidak ada data audit log untuk diexport', 'error');
      return;
    }
    const headers = ['ID', 'Action Name', 'Entity Name', 'Entity ID', 'Timestamp', 'Notes'];
    const rows = audit.map((x) => [
      x.id,
      x.actionName,
      x.entityName,
      x.entityId || '-',
      x.createdAt ? new Date(x.createdAt).toLocaleString('id-ID') : '-',
      (x.note || '').replace(/"/g, '""'),
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.map((val) => `"${val}"`).join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Audit_Logs_Funding_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Audit log berhasil diexport ke CSV!');
  };

  return (
    <div className="p-4 space-y-4 animate-fade-up">
      {/* Premium Header */}
      <div className="bg-white border border-zinc-200 rounded-3xl p-5 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-extrabold g-text flex items-center gap-1.5">
            <span>🛡️</span> Kelola Project Funding (SuperAdmin)
          </h1>
          <p className="text-xs text-zinc-500 mt-1">Review approval funding, revenue distribution, withdrawals, trust parameters, agreements, and audit logs.</p>
        </div>
        <div className="flex gap-2">
          <button
            className="rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 px-4 py-2.5 text-xs font-bold text-zinc-700 shadow-sm transition-colors flex items-center gap-1.5"
            onClick={printFundingReport}
          >
            <span>🖨️</span> Cetak Laporan Keuangan
          </button>
          <button
            className="rounded-xl bg-primary-600 hover:bg-primary-700 px-4 py-2.5 text-xs font-bold text-white shadow-md transition-colors"
            onClick={() => openProject()}
          >
            + Tambah Project Baru
          </button>
        </div>
      </div>

      {loading && <FundingLoadingSpinner />}

      {/* Modern Dashboard Stats summary */}
      {dashboard && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-white border rounded-2xl p-4 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
            <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wide">Total Projects</span>
            <b className="text-lg text-zinc-800 mt-1">{dashboard?.projects || 0} Projects</b>
          </div>
          <div className="bg-white border rounded-2xl p-4 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
            <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wide">Pending Funding Approval</span>
            <b className={`text-lg mt-1 ${dashboard?.pendingFundings > 0 ? 'text-amber-600 animate-pulse' : 'text-zinc-800'}`}>
              {dashboard?.pendingFundings || 0} Usulan
            </b>
          </div>
          <div className="bg-white border rounded-2xl p-4 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
            <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wide">Pending Withdraw</span>
            <b className={`text-lg mt-1 ${dashboard?.pendingWithdraws > 0 ? 'text-amber-600 animate-pulse' : 'text-zinc-800'}`}>
              {dashboard?.pendingWithdraws || 0} Request
            </b>
          </div>
          <div className="bg-white border rounded-2xl p-4 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
            <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wide">Approved Funding Amount</span>
            <b className="text-lg text-emerald-600 mt-1">{money(dashboard?.approvedFunding)}</b>
          </div>
          <div className="bg-white border rounded-2xl p-4 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
            <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wide">Total Revenue Paid</span>
            <b className="text-lg text-indigo-600 mt-1">{money(dashboard?.revenuePaid)}</b>
          </div>
        </div>
      )}

      {/* Tab Switcher Control Panel */}
      <div className="bg-white border border-zinc-200 rounded-3xl p-3 flex flex-wrap gap-2 shadow-xs">
        {[
          ['projects', '📁 Projects'],
          ['fundings', '✔️ Funding Approvals'],
          ['revenue', '💰 Revenue'],
          ['withdraw', '💸 Withdrawals'],
          ['trust', '🛡️ Trust Settings'],
          ['agreement', '📜 Agreements'],
          ['docs', '📂 Docs & Timeline'],
          ['audit', '📝 Audit Logs'],
        ].map(([k, label]) => (
          <button
            key={k}
            className={`rounded-xl px-4 py-2.5 text-xs font-bold transition-all duration-200 ${
              tab === k
                ? 'bg-zinc-900 text-white shadow-md'
                : 'bg-zinc-50 text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900'
            }`}
            onClick={() => setTab(k as any)}
          >
            {label}
          </button>
        ))}
      </div>

      {/* PROJECTS TAB */}
      {tab === 'projects' && (
        <div className="bg-white border rounded-3xl p-6 space-y-4 shadow-sm">
          <div className="flex justify-between items-center border-b pb-3">
            <h2 className="text-sm font-extrabold text-zinc-950">Daftar Project Funding Aktif ({projects.length})</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((x) => {
              const borderClass = getOutlineColor(x.id);
              const fundingCount = projectFundingCounts.get(Number(x.id)) || 0;
              return (
                <div key={x.id} className={`bg-white border-2 ${borderClass} rounded-3xl overflow-hidden shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between`}>
                  <div>
                    {x.coverUrl ? (
                      <img src={absoluteUrl(x.coverUrl)} className="w-full h-36 object-cover" alt={x.name} />
                    ) : (
                      <div className="w-full h-36 bg-gradient-to-br from-emerald-500/10 to-sky-500/10 flex items-center justify-center text-zinc-400 font-black text-xs uppercase tracking-wider">
                        🎨 {x.category}
                      </div>
                    )}
                    <div className="p-4 space-y-3">
                      <div className="flex justify-between items-start gap-2">
                        <span className="text-[10px] uppercase font-bold px-2 py-0.5 bg-zinc-150 text-zinc-600 rounded-md">{x.category}</span>
                        <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-md ${
                          x.status === 'FundingOpen' ? 'bg-emerald-50 text-emerald-700 border border-emerald-250' : 'bg-zinc-100 text-zinc-600'
                        }`}>{x.status}</span>
                      </div>
                      <h3 className="font-extrabold text-sm text-zinc-900 leading-tight min-h-[2.5rem] line-clamp-2">{x.name}</h3>
                      <div className="text-[11px] text-zinc-500 flex flex-wrap gap-x-2 gap-y-1">
                        <span>Code: <b className="text-zinc-700">{x.code}</b></span>
                        <span>&bull;</span>
                        <span>Rev Share: <b className="text-indigo-600">{x.revenueSharePercent}%</b></span>
                        <span>&bull;</span>
                        <span>Rule: <b className="text-zinc-700">{x.revenueRule}</b></span>
                      </div>
                      <div className="space-y-1.5 pt-1.5">
                        <div className="flex justify-between text-[11px]">
                          <span className="text-zinc-400">Terkumpul: <b>{money(x.collectedAmount)}</b></span>
                          <span className="text-zinc-700 font-extrabold">{x.progressPercent}%</span>
                        </div>
                        <div className="h-2 rounded-full bg-zinc-100 overflow-hidden relative">
                          <div className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-full" style={{ width: `${Math.min(100, Number(x.progressPercent || 0))}%` }} />
                        </div>
                        <div className="flex justify-between text-[10px] text-zinc-400">
                          <span>Target: {money(x.targetAmount)}</span>
                          <span>Funder: {fundingCount} User</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="p-4 pt-0 border-t border-zinc-100 flex gap-2 justify-end mt-auto bg-zinc-50/50">
                    <button
                      className="rounded-lg border px-3 py-1.5 text-xs font-semibold hover:bg-zinc-100 transition-colors"
                      onClick={() => openProject(x)}
                    >
                      📝 Edit
                    </button>
                    <button
                      className="rounded-lg border px-3 py-1.5 text-xs font-semibold hover:bg-zinc-100 transition-colors"
                      onClick={() => {
                        setTab('fundings');
                      }}
                    >
                      🔍 Lihat Funder
                    </button>
                    <button
                      className="rounded-lg border px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-40 transition-colors"
                      disabled={fundingCount > 0 || saving === `project-delete-${x.id}`}
                      onClick={() => deleteProject(x.id, x.name)}
                    >
                      {saving === `project-delete-${x.id}` ? 'Menghapus...' : 'Hapus'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* FUNDING APPROVAL TAB */}
      {tab === 'fundings' && (
        <div className="space-y-4 animate-fade-up">
          <div className="bg-white border rounded-3xl p-5 shadow-xs space-y-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-sm font-extrabold text-zinc-900">Verifikasi & Approval Pendanaan</h2>
                <p className="text-[11px] text-zinc-500">Pilih berkas pendanaan masuk, tinjau bukti transfer bank, lalu berikan persetujuan.</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {(['All', 'Pending', 'Approved', 'Rejected', 'Cancelled'] as const).map((status) => (
                  <button
                    key={status}
                    type="button"
                    onClick={() => setFundingStatusFilter(status)}
                    className={`rounded-full border px-3 py-1.5 text-[11px] font-semibold transition-all ${
                      fundingStatusFilter === status
                        ? 'bg-zinc-900 text-white shadow-xs'
                        : 'bg-white text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900'
                    }`}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid gap-3 lg:grid-cols-[1fr_220px]">
              <input
                className="w-full rounded-xl border px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Cari investor, project, bank, referensi..."
                value={fundingQuery}
                onChange={(e) => setFundingQuery(e.target.value)}
              />
              <div className="rounded-xl border bg-zinc-50 px-3 py-2 text-xs text-zinc-500 text-center font-semibold">
                Menampilkan <span className="font-black text-zinc-800">{filteredFundings.length}</span> data
              </div>
            </div>
          </div>

          <div className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(360px,0.8fr)] items-start">
            <div className="bg-white border rounded-3xl p-5 space-y-3 shadow-xs max-h-[70vh] overflow-y-auto">
              {filteredFundings.length === 0 ? (
                <div className="rounded-2xl border border-dashed px-4 py-16 text-center text-xs text-zinc-400">
                  Tidak ada data usulan pendanaan yang cocok.
                </div>
              ) : (
                filteredFundings.map((x) => {
                  const isSelected = selectedFunding?.id === x.id;
                  return (
                    <button
                      key={x.id}
                      type="button"
                      onClick={() => {
                        setSelectedFundingId(x.id);
                        setShowRejectFundingId(null);
                      }}
                      className={`w-full rounded-2xl border p-4 text-left text-xs transition-all ${
                        isSelected
                          ? 'border-emerald-300 bg-emerald-50/40 shadow-xs'
                          : 'hover:bg-zinc-50'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="font-extrabold text-zinc-900 truncate">{x.projectName}</div>
                          <div className="mt-1 font-semibold text-zinc-600 truncate flex items-center gap-1.5">
                            <span>👤 {x.fullName || x.userName}</span>
                            <span className="text-zinc-300">&bull;</span>
                            <span className="text-emerald-700 font-bold">{money(x.fundingAmount)}</span>
                          </div>
                        </div>
                        <span className={`shrink-0 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
                          x.status === 'Approved' ? 'bg-emerald-100 text-emerald-800' :
                          x.status === 'Pending' ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {x.status}
                        </span>
                      </div>
                      <div className="mt-3 flex flex-wrap items-center gap-x-2 text-[10px] text-zinc-400">
                        <span>Bank: <b>{x.transferBankName || '-'}</b></span>
                        <span>&bull;</span>
                        <span>Ref: <b className="font-mono">{x.transferReferenceNo || 'N/A'}</b></span>
                        <span>&bull;</span>
                        <span>{x.submittedAt ? new Date(x.submittedAt).toLocaleString('id-ID') : '-'}</span>
                      </div>
                    </button>
                  );
                })
              )}
            </div>

            <div className="bg-white border rounded-3xl p-5 shadow-xs">
              {selectedFunding ? (
                <div className="space-y-4">
                  <div className="flex items-start justify-between gap-3 border-b pb-3">
                    <div className="min-w-0">
                      <h3 className="text-sm font-black text-zinc-900 leading-tight">{selectedFunding.projectName}</h3>
                      <p className="mt-1 text-xs font-semibold text-zinc-500">Investor: {selectedFunding.fullName || selectedFunding.userName}</p>
                    </div>
                    <span className="rounded-full bg-zinc-100 px-3 py-1 text-[10px] font-bold text-zinc-700 uppercase">
                      {selectedFunding.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <InfoBox label="Nominal Pendanaan" value={money(selectedFunding.fundingAmount)} />
                    <InfoBox label="Bank Pengirim" value={selectedFunding.transferBankName || '-'} />
                    <InfoBox label="Nama Pemilik Rekening" value={selectedFunding.transferAccountName || '-'} />
                    <InfoBox label="Nomor Referensi" value={selectedFunding.transferReferenceNo || '-'} />
                    <InfoBox label="Tanggal Kirim" value={selectedFunding.submittedAt ? new Date(selectedFunding.submittedAt).toLocaleString('id-ID') : '-'} />
                  </div>

                  {selectedFunding.notes && (
                    <div className="rounded-2xl border bg-zinc-50 p-3 text-xs space-y-1">
                      <div className="font-bold text-zinc-700">Catatan Investor</div>
                      <div className="whitespace-pre-line text-zinc-600">{selectedFunding.notes}</div>
                    </div>
                  )}

                  {selectedFunding.rejectionReason && (
                    <div className="rounded-2xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">
                      <div className="font-bold">Alasan Penolakan</div>
                      <div className="mt-1 whitespace-pre-line">{selectedFunding.rejectionReason}</div>
                    </div>
                  )}

                  {/* Actions buttons */}
                  {showRejectFundingId === selectedFunding.id ? (
                    <form onSubmit={handleRejectFundingSubmit} className="bg-red-50 border border-red-200 rounded-2xl p-4 space-y-3 animate-fade-up">
                      <div className="space-y-1">
                        <label className="block text-xs font-bold text-red-800">Tulis Alasan Penolakan Pendanaan *</label>
                        <textarea
                          className="w-full rounded-xl border border-red-300 px-3 py-2 text-xs focus:ring-1 focus:ring-red-500 focus:outline-none"
                          placeholder="Contoh: Bukti transfer tidak valid atau dana tidak masuk rekening..."
                          rows={3}
                          value={fundingRejectReason}
                          onChange={(e) => setFundingRejectReason(e.target.value)}
                          required
                        />
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="submit"
                          disabled={saving === `funding-${selectedFunding.id}`}
                          className="rounded-lg bg-red-650 hover:bg-red-700 text-white px-3 py-1.5 text-xs font-bold transition-colors"
                        >
                          Konfirmasi Tolak
                        </button>
                        <button
                          type="button"
                          className="rounded-lg border border-red-300 bg-white text-red-800 px-3 py-1.5 text-xs font-semibold hover:bg-red-50 transition-colors"
                          onClick={() => {
                            setShowRejectFundingId(null);
                            setFundingRejectReason('');
                          }}
                        >
                          Batal
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {selectedFunding.status === 'Pending' && (
                        <>
                          <button
                            className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 text-xs font-bold shadow-xs transition-colors"
                            onClick={() => approveFunding(selectedFunding.id)}
                          >
                            Approve Pendanaan
                          </button>
                          <button
                            className="rounded-xl border border-red-200 bg-red-50 text-red-650 hover:bg-red-100 px-4 py-2 text-xs font-bold shadow-xs transition-colors"
                            onClick={() => setShowRejectFundingId(selectedFunding.id)}
                          >
                            Reject Pendanaan
                          </button>
                        </>
                      )}
                      <button
                        className="rounded-xl border border-zinc-200 px-3 py-2 text-xs font-semibold hover:bg-zinc-50 transition-colors"
                        onClick={() => printFundingSlip(selectedFunding)}
                      >
                        🖨️ Cetak Slip
                      </button>
                      {selectedFunding.agreementConsentId && (
                        <button
                          className="rounded-xl border border-zinc-200 px-3 py-2 text-xs font-semibold hover:bg-zinc-50 transition-colors"
                          onClick={() => void openAgreementEvidence(selectedFunding.agreementConsentId)}
                        >
                          Agreement PDF
                        </button>
                      )}
                      {selectedFunding.proofUrl && (
                        <a
                          className="rounded-xl border border-zinc-200 px-3 py-2 text-xs font-semibold hover:bg-zinc-50 transition-colors flex items-center"
                          href={absoluteUrl(selectedFunding.proofUrl)}
                          target="_blank"
                          rel="noreferrer"
                        >
                          Lihat Bukti Transfer
                        </a>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed px-4 py-16 text-center text-xs text-zinc-400">
                  Pilih pendanaan di sebelah kiri untuk melihat rincian verifikasi.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* REVENUE TAB */}
      {tab === 'revenue' && (
        <div className="space-y-4 animate-fade-up">
          <div className="grid md:grid-cols-5 gap-4">
            <div className="bg-white border rounded-3xl p-5 shadow-xs space-y-3 md:col-span-2">
              <h2 className="text-sm font-extrabold text-zinc-900 border-b pb-2">Catat Hasil Pendapatan (Revenue)</h2>
              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-zinc-700">Project Funding *</label>
                  <select
                    className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                    value={revenueForm.projectFundingProjectId}
                    onChange={(e) => setRevenueForm({ ...revenueForm, projectFundingProjectId: e.target.value })}
                  >
                    <option value="">Pilih project</option>
                    {activeProjects.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-zinc-700">Periode Revenue *</label>
                  <input
                    type="month"
                    className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary-500"
                    value={revenueForm.revenuePeriod}
                    onChange={(e) => setRevenueForm({ ...revenueForm, revenuePeriod: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-zinc-700">Nominal Pendapatan Bersih (Rupiah) *</label>
                  <input
                    className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary-500"
                    type="text"
                    placeholder="Contoh: Rp 25.000.000"
                    value={revenueForm.revenueAmount}
                    onChange={(e) => setRevenueForm({ ...revenueForm, revenueAmount: formatRupiah(e.target.value) })}
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-zinc-700">Keterangan / Laporan Laba Rugi</label>
                  <input
                    className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Deskripsi pembagian dividen..."
                    value={revenueForm.description}
                    onChange={(e) => setRevenueForm({ ...revenueForm, description: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-zinc-700">Upload Lampiran Laporan</label>
                  <div className="flex gap-2 items-center">
                    <input
                      type="file"
                      className="text-xs flex-1 text-zinc-500 file:mr-2 file:py-1 file:px-2 file:rounded-lg file:border file:border-zinc-200 file:text-[10px] file:font-semibold file:bg-white hover:file:bg-zinc-50 cursor-pointer"
                      onChange={async (e) => {
                        const f = e.target.files?.[0];
                        if (!f) return;
                        try {
                          setSaving('upload-revenue');
                          const url = await uploadFundingFile(f, 'revenue');
                          setRevenueForm({ ...revenueForm, attachmentUrl: url });
                          showToast('File laporan berhasil dilampirkan!');
                        } catch (err: any) {
                          showToast(err?.message || 'Upload gagal', 'error');
                        } finally {
                          setSaving('');
                        }
                      }}
                    />
                    {saving === 'upload-revenue' && <span className="text-[10px] text-zinc-500 animate-pulse">Uploading...</span>}
                  </div>
                  {revenueForm.attachmentUrl && (
                    <a className="text-[10px] text-primary-600 font-bold hover:underline block mt-1" href={absoluteUrl(revenueForm.attachmentUrl)} target="_blank" rel="noreferrer">
                      Lihat file laporan terupload
                    </a>
                  )}
                </div>
              </div>
              <button
                className="w-full rounded-xl bg-primary-600 hover:bg-primary-700 px-4 py-2 text-xs font-bold text-white shadow-sm transition-colors mt-2"
                onClick={saveRevenue}
                disabled={saving === 'revenue'}
              >
                {saving === 'revenue' ? 'Menyimpan...' : 'Simpan & Distribusikan Revenue'}
              </button>
            </div>

            <div className="bg-white border rounded-3xl p-5 shadow-xs md:col-span-3 space-y-3">
              <h2 className="text-sm font-extrabold text-zinc-900 border-b pb-2">Riwayat Dividen / Distribusi Revenue</h2>
              {revenues.length === 0 ? (
                <div className="rounded-2xl border border-dashed py-12 text-center text-xs text-zinc-400">Belum ada pendapatan terdistribusi.</div>
              ) : (
                <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
                  {revenues.map((x) => (
                    <div key={x.id} className="rounded-2xl border p-4 text-xs flex flex-wrap items-center justify-between gap-4 bg-white hover:bg-zinc-50/50 transition-colors">
                      <div className="space-y-1">
                        <b className="text-zinc-800 text-sm">{x.projectName}</b>
                        <div className="text-zinc-500 flex gap-2 items-center text-[10px]">
                          <span>Periode: <b>{x.revenuePeriod}</b></span>
                          <span>&bull;</span>
                          <span>Status: <b className={x.status === 'Published' ? 'text-emerald-600' : 'text-amber-600'}>{x.status}</b></span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-right">
                          <span className="text-sm font-extrabold text-zinc-900 block">{money(x.revenueAmount)}</span>
                          <div className="flex gap-1.5 justify-end mt-1">
                            <button
                              className="rounded-lg border border-zinc-200 bg-white hover:bg-zinc-50 px-2 py-1 text-[10px] font-bold text-zinc-700"
                              onClick={() => previewRevenue(x.id)}
                            >
                              🔍 Preview
                            </button>
                            {x.status === 'Draft' && (
                              <button
                                className="rounded-lg border border-emerald-250 bg-emerald-50 hover:bg-emerald-100 px-2 py-1 text-[10px] font-bold text-emerald-800"
                                onClick={() => publishRevenue(x.id)}
                              >
                                🚀 Publish
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* WITHDRAW MANAGEMENT TAB */}
      {tab === 'withdraw' && (
        <div className="space-y-4 animate-fade-up">
          <div className="bg-white border rounded-3xl p-5 shadow-xs space-y-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-sm font-extrabold text-zinc-900">Pencairan Dana (Withdrawals)</h2>
                <p className="text-[11px] text-zinc-500">Proses permohonan penarikan saldo revenue investor. Tandai sebagai Paid setelah melakukan transfer bank.</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {(['All', 'Pending', 'Approved', 'Rejected', 'Paid', 'Cancelled'] as const).map((status) => (
                  <button
                    key={status}
                    type="button"
                    onClick={() => setWithdrawStatusFilter(status)}
                    className={`rounded-full border px-3 py-1.5 text-[11px] font-semibold transition-all ${
                      withdrawStatusFilter === status
                        ? 'bg-zinc-900 text-white shadow-xs'
                        : 'bg-white text-zinc-650 hover:bg-zinc-50 hover:text-zinc-900'
                    }`}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid gap-3 lg:grid-cols-[1fr_220px]">
              <input
                className="w-full rounded-xl border px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Cari nama, bank, nomor rekening, catatan..."
                value={withdrawQuery}
                onChange={(e) => setWithdrawQuery(e.target.value)}
              />
              <div className="rounded-xl border bg-zinc-50 px-3 py-2 text-xs text-zinc-500 text-center font-semibold">
                Menampilkan <span className="font-black text-zinc-800">{filteredWithdraws.length}</span> pencairan
              </div>
            </div>
          </div>

          <div className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(360px,0.8fr)] items-start">
            <div className="bg-white border rounded-3xl p-5 shadow-xs max-h-[70vh] overflow-y-auto">
              {filteredWithdraws.length === 0 ? (
                <div className="rounded-2xl border border-dashed px-4 py-16 text-center text-xs text-zinc-400">
                  Tidak ada permohonan penarikan dana terdaftar.
                </div>
              ) : (
                filteredWithdraws.map((x) => {
                  const isSelected = selectedWithdraw?.id === x.id;
                  return (
                    <button
                      key={x.id}
                      type="button"
                      onClick={() => setSelectedWithdrawId(x.id)}
                      className={`w-full rounded-2xl border p-4 text-left text-xs transition-all ${
                        isSelected
                          ? 'border-indigo-300 bg-indigo-50/40 shadow-xs'
                          : 'hover:bg-zinc-50'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="font-extrabold text-zinc-900 truncate">{x.fullName || x.userName}</div>
                          <div className="mt-1 font-semibold text-indigo-700 text-sm">
                            {money(x.amount)}
                          </div>
                        </div>
                        <span className={`shrink-0 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
                          x.status === 'Paid' ? 'bg-emerald-100 text-emerald-800' :
                          x.status === 'Pending' ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {x.status}
                        </span>
                      </div>
                      <div className="mt-2 text-zinc-505 font-semibold">
                        {x.bankName} &bull; {x.bankAccountNo} &bull; {x.bankAccountName}
                      </div>
                      <div className="mt-2 text-[10px] text-zinc-400 flex justify-between">
                        <span>Ref: {x.paymentReferenceNo || 'N/A'}</span>
                        <span>{x.requestedAt ? new Date(x.requestedAt).toLocaleString('id-ID') : '-'}</span>
                      </div>
                    </button>
                  );
                })
              )}
            </div>

            <div className="bg-white border rounded-3xl p-5 shadow-xs">
              {selectedWithdraw ? (
                <div className="space-y-4">
                  <div className="flex items-start justify-between gap-3 border-b pb-3">
                    <div className="min-w-0">
                      <h3 className="text-base font-black text-zinc-900">{selectedWithdraw.fullName || selectedWithdraw.userName}</h3>
                      <p className="text-xs font-semibold text-zinc-500">{selectedWithdraw.bankName} &bull; {selectedWithdraw.bankAccountNo}</p>
                    </div>
                    <span className="rounded-full bg-zinc-100 px-3 py-1 text-[10px] font-bold text-zinc-700 uppercase">
                      {selectedWithdraw.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <InfoBox label="Nominal Penarikan" value={money(selectedWithdraw.amount)} />
                    <InfoBox label="Bank Tujuan" value={selectedWithdraw.bankName || '-'} />
                    <InfoBox label="Nomor Rekening" value={selectedWithdraw.bankAccountNo || '-'} />
                    <InfoBox label="Nama Rekening Pemilik" value={selectedWithdraw.bankAccountName || '-'} />
                    <InfoBox label="Payment Reference" value={selectedWithdraw.paymentReferenceNo || '-'} />
                    <InfoBox label="Tanggal Request" value={selectedWithdraw.requestedAt ? new Date(selectedWithdraw.requestedAt).toLocaleString('id-ID') : '-'} />
                  </div>

                  {(selectedWithdraw.notes || selectedWithdraw.rejectionReason) && (
                    <div className="rounded-2xl border bg-zinc-50 p-3 text-xs space-y-1">
                      <div className="font-bold text-zinc-700">Keterangan Tambahan / Alasan Ditolak</div>
                      <div className="whitespace-pre-line text-zinc-600">{selectedWithdraw.notes || selectedWithdraw.rejectionReason}</div>
                    </div>
                  )}

                  {selectedWithdraw.status === 'Pending' && (
                    <div className="rounded-2xl border border-zinc-150 p-4 space-y-3 bg-zinc-50/50">
                      <h4 className="text-xs font-bold text-zinc-700">Form Pembaruan Status Transfer</h4>
                      <div className="space-y-2">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-zinc-500">Catatan Admin</label>
                          <input
                            className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-xs focus:ring-1 focus:ring-primary-500 focus:outline-none"
                            placeholder="Catatan pencairan..."
                            value={withdrawNote}
                            onChange={(e) => setWithdrawNote(e.target.value)}
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-zinc-500">Alasan Tolak (jika ditolak)</label>
                          <input
                            className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-xs focus:ring-1 focus:ring-primary-500 focus:outline-none"
                            placeholder="Tulis alasan jika menolak penarikan..."
                            value={withdrawReason}
                            onChange={(e) => setWithdrawReason(e.target.value)}
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-zinc-500">No Referensi Pembayaran (jika sudah ditransfer)</label>
                          <input
                            className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-xs focus:ring-1 focus:ring-primary-500 focus:outline-none"
                            placeholder="Contoh: FT-TRF-9038289"
                            value={withdrawPaymentRef}
                            onChange={(e) => setWithdrawPaymentRef(e.target.value)}
                          />
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2 pt-2">
                        <button
                          type="button"
                          className="rounded-xl border border-emerald-250 bg-emerald-50 text-emerald-800 px-3 py-2 text-xs font-bold transition-colors"
                          onClick={() => updateWithdrawWithForm(selectedWithdraw.id, 'Approved')}
                        >
                          Approved
                        </button>
                        <button
                          type="button"
                          className="rounded-xl border border-red-200 bg-red-50 text-red-650 px-3 py-2 text-xs font-bold transition-colors"
                          onClick={() => updateWithdrawWithForm(selectedWithdraw.id, 'Rejected')}
                        >
                          Rejected
                        </button>
                        <button
                          type="button"
                          className="rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white px-3 py-2 text-xs font-bold transition-colors"
                          onClick={() => updateWithdrawWithForm(selectedWithdraw.id, 'Paid')}
                        >
                          Mark as Paid
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <button
                      className="rounded-xl border border-zinc-200 px-3 py-2 text-xs font-semibold hover:bg-zinc-50 transition-colors"
                      onClick={() => printWithdrawSlip(selectedWithdraw)}
                    >
                      🖨️ Cetak Kwitansi WD
                    </button>
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed px-4 py-16 text-center text-xs text-zinc-400">
                  Pilih permohonan di sebelah kiri untuk meninjau pencairan dana.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TRUST TAB */}
      {tab === 'trust' && (
        <div className="bg-white border rounded-3xl p-6 space-y-4 shadow-sm animate-fade-up">
          <div className="border-b pb-2">
            <h2 className="text-sm font-extrabold text-zinc-900">Pengaturan Parameter Kemitraan & Kepercayaan</h2>
            <p className="text-xs text-zinc-500">Konfigurasi batasan platform, persentase administrasi, atau verifikasi global project funding.</p>
          </div>
          <div className="space-y-3">
            {trust.map((x) => (
              <TrustRow key={x.settingKey} row={x} onSave={updateTrust} busy={saving === `trust-${x.settingKey}`} />
            ))}
          </div>
        </div>
      )}

      {/* AGREEMENT TAB */}
      {tab === 'agreement' && (
        <div className="grid md:grid-cols-2 gap-4 animate-fade-up">
          <div className="bg-white border rounded-3xl p-5 space-y-3 shadow-sm">
            <h2 className="text-sm font-extrabold text-zinc-900 border-b pb-2">Drafting Template Perjanjian Baru</h2>
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-zinc-700">Kode Dokumen</label>
                <input className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-xs" value={agreementForm.code} onChange={(e) => setAgreementForm({ ...agreementForm, code: e.target.value })} />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-zinc-700">Judul Surat Perjanjian</label>
                <input className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-xs" value={agreementForm.title} onChange={(e) => setAgreementForm({ ...agreementForm, title: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-700">Versi</label>
                  <input className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-xs" value={agreementForm.versionNo} onChange={(e) => setAgreementForm({ ...agreementForm, versionNo: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-700">Status</label>
                  <select className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-xs bg-white" value={agreementForm.status} onChange={(e) => setAgreementForm({ ...agreementForm, status: e.target.value })}>
                    {['Draft', 'Published', 'Inactive'].map((x) => <option key={x}>{x}</option>)}
                  </select>
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-zinc-700">Isi Perjanjian (HTML format)</label>
                <textarea className="w-full min-h-60 rounded-xl border border-zinc-200 px-3 py-2 text-xs font-mono" value={agreementForm.agreementBody} onChange={(e) => setAgreementForm({ ...agreementForm, agreementBody: e.target.value })} />
              </div>
            </div>
            <button className="w-full rounded-xl bg-primary-600 hover:bg-primary-700 px-4 py-2 text-xs font-bold text-white shadow-sm transition-colors mt-2" onClick={saveAgreement}>
              {saving === 'agreement' ? 'Menyimpan...' : 'Simpan Template Perjanjian'}
            </button>
          </div>

          <div className="bg-white border rounded-3xl p-5 space-y-3 shadow-sm">
            <h2 className="text-sm font-extrabold text-zinc-900 border-b pb-2">Daftar Template Perjanjian Aktif</h2>
            {agreements.length === 0 ? (
              <div className="text-xs text-zinc-400 py-6 text-center border border-dashed rounded-xl">Belum ada template.</div>
            ) : (
              <div className="space-y-2 max-h-[70vh] overflow-y-auto pr-1">
                {agreements.map((x) => (
                  <div key={x.id} className="rounded-2xl border p-4 text-xs bg-zinc-50/50 hover:bg-zinc-50 transition-colors flex justify-between items-center">
                    <div>
                      <b className="text-zinc-800 block">{x.title}</b>
                      <span className="text-[10px] text-zinc-500 font-semibold">{x.code} &bull; {x.versionNo}</span>
                    </div>
                    <span className={`px-2 py-0.5 rounded-md font-bold text-[9px] uppercase ${
                      x.status === 'Published' ? 'bg-emerald-100 text-emerald-800' : 'bg-zinc-200 text-zinc-700'
                    }`}>{x.status}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* DOCS & TIMELINE TAB */}
      {tab === 'docs' && (
        <div className="grid md:grid-cols-2 gap-4 animate-fade-up">
          {/* Legal Documents Section */}
          <div className="bg-white border rounded-3xl p-5 space-y-4 shadow-sm">
            <h2 className="text-sm font-extrabold text-zinc-900 border-b pb-2">📂 Dokumen Legal Pendukung</h2>
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-zinc-700">Pilih Project *</label>
                <select
                  className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-xs bg-white focus:ring-1 focus:ring-primary-500 focus:outline-none"
                  value={docForm.projectFundingProjectId}
                  onChange={(e) => setDocForm({ ...docForm, projectFundingProjectId: e.target.value })}
                >
                  <option value="">Pilih project</option>
                  {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-700">Tipe Dokumen</label>
                  <input className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-xs" placeholder="LegalDocument, Financial, dll" value={docForm.documentType} onChange={(e) => setDocForm({ ...docForm, documentType: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-700">Judul Dokumen</label>
                  <input className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-xs" placeholder="Akte Notaris, Laporan Audit" value={docForm.title} onChange={(e) => setDocForm({ ...docForm, title: e.target.value })} />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-zinc-700">File Dokumen *</label>
                <div className="flex gap-2 items-center">
                  <input
                    type="file"
                    className="text-xs flex-1 text-zinc-500 file:mr-2 file:py-1 file:px-2 file:rounded-lg file:border file:border-zinc-200 file:text-[10px] file:font-semibold file:bg-white hover:file:bg-zinc-50 cursor-pointer"
                    onChange={async (e) => {
                      const f = e.target.files?.[0];
                      if (!f) return;
                      try {
                        const url = await uploadFundingFile(f, 'documents');
                        setDocForm({ ...docForm, fileUrl: url, fileName: f.name });
                        showToast('File dokumen berhasil dilampirkan!');
                      } catch (err: any) {
                        showToast(err?.message || 'Upload gagal', 'error');
                      }
                    }}
                  />
                </div>
                {docForm.fileUrl && (
                  <span className="text-[10px] text-zinc-500 font-mono block mt-1 overflow-x-auto">File: {docForm.fileName}</span>
                )}
              </div>
              <button className="w-full rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white px-4 py-2 text-xs font-bold shadow-sm transition-colors mt-1" onClick={saveDoc}>
                Simpan & Publish Dokumen
              </button>
            </div>

            <div className="space-y-2 pt-3 border-t border-zinc-100 max-h-60 overflow-y-auto pr-1">
              <h3 className="text-xs font-bold text-zinc-700">Daftar Dokumen Terbit:</h3>
              {docs.length === 0 ? (
                <div className="text-[10px] text-zinc-400 py-3 text-center">Belum ada berkas terupload.</div>
              ) : (
                docs.map((x) => (
                  <a key={x.id} className="block rounded-xl border p-3 hover:bg-zinc-50 text-xs text-primary-600 font-semibold" href={absoluteUrl(x.fileUrl)} target="_blank" rel="noreferrer">
                    📁 {x.title} <span className="text-[10px] text-zinc-400 block font-normal">{x.documentType} &bull; File: {x.fileName || 'Link'}</span>
                  </a>
                ))
              )}
            </div>
          </div>

          {/* Project Timeline Section */}
          <div className="bg-white border rounded-3xl p-5 space-y-4 shadow-sm">
            <h2 className="text-sm font-extrabold text-zinc-900 border-b pb-2">📅 Rencana Kerja & Timeline Project</h2>
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-zinc-700">Pilih Project *</label>
                <select
                  className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-xs bg-white focus:ring-1 focus:ring-primary-500 focus:outline-none"
                  value={timelineForm.projectFundingProjectId}
                  onChange={(e) => setTimelineForm({ ...timelineForm, projectFundingProjectId: e.target.value })}
                >
                  <option value="">Pilih project</option>
                  {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-700">Tanggal & Waktu Event *</label>
                  <input className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-xs" type="datetime-local" value={timelineForm.eventDate} onChange={(e) => setTimelineForm({ ...timelineForm, eventDate: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-700">Judul Event</label>
                  <input className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-xs" placeholder="Kickoff, Pembelian Tiket, dll" value={timelineForm.title} onChange={(e) => setTimelineForm({ ...timelineForm, title: e.target.value })} />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-zinc-700">Deskripsi Detail</label>
                <textarea className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-xs focus:ring-1 focus:ring-primary-500 focus:outline-none" placeholder="Tulis rincian event di sini..." rows={2} value={timelineForm.description} onChange={(e) => setTimelineForm({ ...timelineForm, description: e.target.value })} />
              </div>
              <button className="w-full rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white px-4 py-2 text-xs font-bold shadow-sm transition-colors" onClick={saveTimeline}>
                Catat Event Timeline
              </button>
            </div>

            <div className="space-y-2 pt-3 border-t border-zinc-100 max-h-60 overflow-y-auto pr-1">
              <h3 className="text-xs font-bold text-zinc-700">Histori Perjalanan Project:</h3>
              {timeline.length === 0 ? (
                <div className="text-[10px] text-zinc-400 py-3 text-center">Belum ada histori tercatat.</div>
              ) : (
                timeline.map((x) => (
                  <div key={x.id} className="rounded-xl border p-3 text-xs bg-zinc-50/50">
                    <div className="flex justify-between items-start">
                      <b>📌 {x.title}</b>
                      <span className="text-[9px] bg-zinc-200 px-1.5 py-0.5 rounded-md font-bold text-zinc-600">{x.statusLabel}</span>
                    </div>
                    <p className="text-zinc-650 mt-1">{x.description}</p>
                    <div className="text-[9px] text-zinc-400 mt-1 font-semibold">
                      {x.eventDate ? new Date(x.eventDate).toLocaleString('id-ID') : '-'}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* AUDIT LOGS TAB */}
      {tab === 'audit' && (
        <div className="bg-white border rounded-3xl p-6 space-y-4 shadow-sm animate-fade-up">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-3">
            <div>
              <h2 className="text-sm font-extrabold text-zinc-955">Audit Trail Keamanan & Aktivitas Funding</h2>
              <p className="text-xs text-zinc-500 mt-0.5">Catatan log digital mutasi project, verifikasi approved/rejected dana platform.</p>
            </div>
            <button
              className="rounded-xl border border-zinc-300 bg-white hover:bg-zinc-50 px-4 py-2 text-xs font-bold text-zinc-700 shadow-2xs transition-colors flex items-center gap-1.5"
              onClick={exportAuditLogsCsv}
            >
              <span>📊</span> Export CSV
            </button>
          </div>
          {audit.length === 0 ? (
            <div className="text-xs text-zinc-400 py-16 text-center">Belum ada catatan log audit termuat.</div>
          ) : (
            <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
              {audit.map((x) => (
                <div key={x.id} className="rounded-2xl border p-4 text-xs bg-zinc-50/40 hover:bg-zinc-50 hover:border-zinc-300 transition-all flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-2xs">
                  <div className="space-y-1">
                    <span className="font-extrabold text-zinc-900 text-[13px]">{x.actionName}</span>
                    <div className="text-zinc-500 text-[11px] font-semibold flex items-center gap-2">
                      <span>Entity: <b className="text-zinc-700">{x.entityName}</b></span>
                      <span>&bull;</span>
                      <span>ID: <b className="text-zinc-700">#{x.entityId || 'N/A'}</b></span>
                    </div>
                    {x.note && (
                      <p className="text-zinc-650 bg-white p-2 rounded-xl border border-zinc-100 mt-2 whitespace-pre-line font-mono text-[10px]">{x.note}</p>
                    )}
                  </div>
                  <div className="text-[10px] text-zinc-400 font-bold shrink-0 self-end md:self-center">
                    {x.createdAt ? new Date(x.createdAt).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' }) : '-'}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* CREATE & EDIT PROJECT MODAL */}
      <ModalShell open={modal === 'project'} onBackdropClick={() => saving ? undefined : setModal('')}>
        <div className="mx-auto max-w-6xl rounded-3xl bg-white border shadow-2xl p-6 max-h-[90vh] overflow-y-auto space-y-4 my-auto animate-scale-up">
          <div className="flex justify-between items-center border-b pb-3">
            <h2 className="text-sm font-extrabold text-zinc-900 flex items-center gap-1.5">
              <span>📁</span> {projectForm.id ? 'Edit Detail Project' : 'Tambah Project Funding Baru'}
            </h2>
            <div className="flex gap-2">
              <button
                type="button"
                className="rounded-lg border px-3 py-1 text-xs font-semibold bg-zinc-50 hover:bg-zinc-100 transition-colors"
                onClick={() => setShowJsonConsole(!showJsonConsole)}
              >
                {showJsonConsole ? '👁️ Sembunyikan JSON' : '🛠️ JSON Console'}
              </button>
              <button className="rounded-lg border px-3 py-1 text-xs font-semibold hover:bg-zinc-50 transition-colors" onClick={() => setModal('')}>Tutup</button>
            </div>
          </div>

          <div className={`grid gap-6 ${showJsonConsole ? 'xl:grid-cols-[minmax(0,1fr)_minmax(380px,0.92fr)]' : 'grid-cols-1'}`}>
            <div className="space-y-4">
              <div className="grid md:grid-cols-2 gap-3.5">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-700">Nama Project *</label>
                  <input className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-xs focus:ring-1 focus:ring-primary-500 focus:outline-none" placeholder="Nama project..." value={projectForm.name} onChange={(e) => setProjectForm({ ...projectForm, name: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-700">Kode Project *</label>
                  <input className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-xs focus:ring-1 focus:ring-primary-500 focus:outline-none" placeholder="PF-001" value={projectForm.code} onChange={(e) => setProjectForm({ ...projectForm, code: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-700">Slug URL *</label>
                  <input className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-xs focus:ring-1 focus:ring-primary-500 focus:outline-none" placeholder="project-slug-url" value={projectForm.slug} onChange={(e) => setProjectForm({ ...projectForm, slug: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-700">Kategori *</label>
                  <input className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-xs focus:ring-1 focus:ring-primary-500 focus:outline-none" placeholder="Kategori project..." value={projectForm.category} onChange={(e) => setProjectForm({ ...projectForm, category: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-700">Status Project</label>
                  <select className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-xs bg-white focus:ring-1 focus:ring-primary-500 focus:outline-none" value={projectForm.status} onChange={(e) => setProjectForm({ ...projectForm, status: e.target.value })}>
                    {['Draft', 'Published', 'FundingOpen', 'FundingClosed', 'Running', 'Completed', 'Cancelled'].map((x) => <option key={x} value={x}>{x}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-700">Target Dana Pengumpulan (Rupiah) *</label>
                  <input className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-xs focus:ring-1 focus:ring-primary-500 focus:outline-none" type="text" placeholder="Rp 500.000.000" value={projectForm.targetAmount} onChange={(e) => setProjectForm({ ...projectForm, targetAmount: formatRupiah(e.target.value) })} />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-700">Minimal Pendanaan (Rupiah) *</label>
                  <input className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-xs focus:ring-1 focus:ring-primary-500 focus:outline-none" type="text" placeholder="Rp 1.000.000" value={projectForm.minFundingAmount} onChange={(e) => setProjectForm({ ...projectForm, minFundingAmount: formatRupiah(e.target.value) })} />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-700">Revenue Share / Bagi Hasil %</label>
                  <input className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-xs focus:ring-1 focus:ring-primary-500 focus:outline-none" type="number" step="0.0001" placeholder="12.5" value={projectForm.revenueSharePercent} onChange={(e) => setProjectForm({ ...projectForm, revenueSharePercent: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-700">Aturan Pembagian Hasil (Revenue Rule)</label>
                  <select className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-xs bg-white focus:ring-1 focus:ring-primary-500 focus:outline-none" value={projectForm.revenueRule} onChange={(e) => setProjectForm({ ...projectForm, revenueRule: e.target.value })}>
                    {['Proportional', 'Fixed', 'Priority'].map((x) => <option key={x} value={x}>{x}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-700">Tanggal Mulai Pengumpulan</label>
                  <input className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-xs focus:ring-1 focus:ring-primary-500 focus:outline-none" type="datetime-local" value={projectForm.startDate} onChange={(e) => setProjectForm({ ...projectForm, startDate: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-700">Tanggal Berakhir Pengumpulan</label>
                  <input className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-xs focus:ring-1 focus:ring-primary-500 focus:outline-none" type="datetime-local" value={projectForm.endDate} onChange={(e) => setProjectForm({ ...projectForm, endDate: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-700">Sort Order (Urutan Tampil)</label>
                  <input className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-xs focus:ring-1 focus:ring-primary-500 focus:outline-none" type="number" value={projectForm.sortOrder} onChange={(e) => setProjectForm({ ...projectForm, sortOrder: Number(e.target.value) })} />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-zinc-700">Cover URL / Image</label>
                <div className="flex gap-2">
                  <input className="rounded-xl border border-zinc-200 px-3 py-2 text-xs flex-1 focus:ring-1 focus:ring-primary-500 focus:outline-none" placeholder="Cover URL..." value={projectForm.coverUrl} onChange={(e) => setProjectForm({ ...projectForm, coverUrl: e.target.value })} />
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    id="project-cover-upload"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      setSaving('project-upload');
                      try {
                        const url = await uploadFundingFile(file, 'projects');
                        setProjectForm((p: any) => ({ ...p, coverUrl: url }));
                        showToast('Cover image uploaded successfully!');
                      } catch (err: any) {
                        showToast(err?.message || 'Upload failed', 'error');
                      } finally {
                        setSaving('');
                      }
                    }}
                  />
                  <label htmlFor="project-cover-upload" className="rounded-xl border border-zinc-200 px-3 py-2 text-xs bg-zinc-100 hover:bg-zinc-200 cursor-pointer font-bold shrink-0 flex items-center select-none">
                    {saving === 'project-upload' ? 'Uploading...' : '📁 Upload Cover'}
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-2.5">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-700">Deskripsi Singkat *</label>
                  <textarea className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-xs focus:ring-1 focus:ring-primary-500 focus:outline-none" placeholder="Deskripsi pendek untuk card list..." rows={2} value={projectForm.shortDescription} onChange={(e) => setProjectForm({ ...projectForm, shortDescription: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-700">Deskripsi Lengkap (Detail Pendanaan)</label>
                  <textarea className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-xs focus:ring-1 focus:ring-primary-500 focus:outline-none" placeholder="Deskripsi lengkap..." rows={4} value={projectForm.description} onChange={(e) => setProjectForm({ ...projectForm, description: e.target.value })} />
                </div>
              </div>

              <div className="flex items-center gap-2 py-2">
                <input
                  type="checkbox"
                  id="isActive-checkbox"
                  className="rounded border-zinc-350 text-primary-600 focus:ring-primary-500"
                  checked={isFundingActive(projectForm)}
                  onChange={(e) => setProjectForm({
                    ...projectForm,
                    isActive: e.target.checked,
                    status: e.target.checked ? 'FundingOpen' : 'Draft',
                  })}
                />
                <label htmlFor="isActive-checkbox" className="text-xs font-bold text-zinc-700 select-none">
                  Aktifkan Project Funding (Menyimpan status sebagai <b>FundingOpen</b>)
                </label>
              </div>

              <div className="flex flex-wrap gap-2 pt-2 border-t justify-end">
                <button
                  disabled={saving === 'project'}
                  className="rounded-xl bg-primary-600 hover:bg-primary-700 px-5 py-2.5 text-xs font-bold text-white shadow-sm disabled:opacity-60 transition-colors"
                  onClick={saveProject}
                >
                  {saving === 'project' ? 'Menyimpan...' : 'Simpan Project'}
                </button>
                {projectForm.id && !projectFundingCounts.get(Number(projectForm.id)) ? (
                  <button
                    type="button"
                    disabled={saving === `project-delete-${projectForm.id}`}
                    className="rounded-xl border border-red-200 bg-red-55 hover:bg-red-100 px-4 py-2.5 text-xs font-bold text-red-750 disabled:opacity-60 transition-colors"
                    onClick={() => deleteProject(Number(projectForm.id), projectForm.name || 'Project')}
                  >
                    Hapus Project
                  </button>
                ) : null}
              </div>
            </div>

            {showJsonConsole && (
              <div className="animate-scale-up duration-250">
                <JsonPayloadConsole
                  title="JSON Project Payload"
                  sampleJson={sampleProjectPayload}
                  jsonText={projectJsonText}
                  setJsonText={setProjectJsonText}
                  onFillFromForm={() => setProjectJsonText(JSON.stringify(projectPayloadFromForm(projectForm), null, 2))}
                  onExecute={() => void saveProjectFromJson()}
                  onExecuteBulk={() => void saveProjectFromJson()}
                  helperText="Tempel JSON object untuk add/edit, atau array JSON untuk bulk create/update."
                />
              </div>
            )}
          </div>
        </div>
      </ModalShell>

      {/* REVENUE PREVIEW MODAL */}
      <ModalShell open={modal === 'preview'} onBackdropClick={() => setModal('')}>
        <div className="mx-auto max-w-2xl rounded-3xl bg-white border shadow-2xl p-6 max-h-[90vh] overflow-y-auto space-y-4 my-auto animate-scale-up border-zinc-100">
          <div className="flex justify-between items-center border-b pb-2">
            <h2 className="text-sm font-extrabold text-zinc-900">Preview Laporan Distribusi Hasil</h2>
            <button className="rounded-lg border px-3 py-1 text-xs font-semibold hover:bg-zinc-50" onClick={() => setModal('')}>Tutup</button>
          </div>
          <div className="rounded-2xl bg-zinc-50 border p-4 text-xs space-y-2">
            <div className="text-zinc-400 font-bold uppercase tracking-wider text-[10px]">Project Info</div>
            <div className="text-sm font-extrabold text-zinc-850">{preview?.revenue?.projectName}</div>
            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-zinc-200 text-[11px] text-zinc-650">
              <div>Periode: <b>{preview?.revenue?.revenuePeriod}</b></div>
              <div>Nominal Hasil: <b className="text-indigo-600">{money(preview?.revenue?.revenueAmount)}</b></div>
              <div>Total Funding: <b>{money(preview?.totalFunding)}</b></div>
            </div>
          </div>

          <div className="space-y-2 pt-2">
            <h3 className="text-xs font-bold text-zinc-700 uppercase tracking-wider">Breakdown Distribusi per Investor:</h3>
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {(preview?.items ?? []).map((x: any) => (
                <div key={x.id} className="rounded-xl border p-3 text-xs flex justify-between items-center bg-white shadow-2xs hover:bg-zinc-50 transition-colors">
                  <div>
                    <span className="font-extrabold text-zinc-850 block">{x.fullName || x.userName}</span>
                    <span className="text-[10px] text-zinc-400 font-semibold">
                      Share: {x.sharePercent}% dari Investasi {money(x.fundingAmount)}
                    </span>
                  </div>
                  <b className="text-emerald-700 text-sm font-black">{money(x.amount)}</b>
                </div>
              ))}
            </div>
          </div>
        </div>
      </ModalShell>

      {/* REUSABLE CONFIRMATION MODAL OVERLAY */}
      {confirmModal && (
        <ModalShell open={confirmModal.open} onBackdropClick={() => setConfirmModal(null)}>
          <div className="mx-auto max-w-md rounded-3xl bg-white border shadow-2xl p-6 my-auto animate-scale-up border-zinc-150 space-y-4">
            <h3 className="text-base font-extrabold text-zinc-900">{confirmModal.title}</h3>
            <p className="text-xs text-zinc-600 leading-relaxed">{confirmModal.message}</p>
            <div className="flex justify-end gap-2 pt-2 border-t border-zinc-100">
              <button
                type="button"
                className="rounded-xl border px-4 py-2 text-xs font-semibold text-zinc-600 hover:bg-zinc-50 transition-colors"
                onClick={() => setConfirmModal(null)}
              >
                Batal
              </button>
              <button
                type="button"
                className="rounded-xl bg-red-650 hover:bg-red-750 px-4 py-2 text-xs font-bold text-white shadow-sm transition-colors"
                onClick={() => {
                  confirmModal.onConfirm();
                  setConfirmModal(null);
                }}
              >
                Konfirmasi
              </button>
            </div>
          </div>
        </ModalShell>
      )}

      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-55 animate-bounce">
          <div className={`rounded-2xl shadow-xl border p-4 text-xs font-bold text-white flex items-center gap-2 ${
            toast.type === 'success' ? 'bg-emerald-600 border-emerald-500' : 'bg-red-650 border-red-500'
          }`}>
            <span>{toast.type === 'success' ? '✅' : '❌'}</span>
            <span>{toast.message}</span>
          </div>
        </div>
      )}
    </div>
  );
}

function FundingLoadingSpinner() {
  return (
    <div className="rounded-3xl border border-primary-100 bg-white/90 p-4 shadow-sm">
      <div className="flex items-center gap-3 text-xs font-semibold text-zinc-700">
        <span className="h-5 w-5 animate-spin rounded-full border-2 border-primary-200 border-t-primary-600" />
        <span>Memuat data funding platform...</span>
      </div>
    </div>
  );
}

function TrustRow({ row, onSave, busy }: { row: any; onSave: (row: any, value: string) => void; busy: boolean }) {
  const [value, setValue] = useState(String(row.settingValue ?? ''));
  return (
    <div className="rounded-2xl border p-4 text-xs grid md:grid-cols-[1fr_240px_auto] gap-4 items-center bg-white hover:bg-zinc-50/50 transition-colors">
      <div>
        <b className="text-zinc-850 font-bold text-sm block">{row.settingLabel}</b>
        <span className="text-zinc-400 font-mono text-[10px]">{row.settingKey}</span>
      </div>
      <input
        className="rounded-xl border border-zinc-200 px-3 py-2 text-xs focus:ring-1 focus:ring-primary-500 focus:outline-none"
        value={value}
        onChange={(e) => setValue(e.target.value)}
      />
      <button
        className="rounded-xl border border-zinc-300 bg-white hover:bg-zinc-50 px-4 py-2 font-bold transition-all text-xs"
        onClick={() => onSave(row, value)}
        disabled={busy}
      >
        {busy ? 'Menyimpan...' : 'Simpan Parameter'}
      </button>
    </div>
  );
}

function InfoBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border bg-zinc-50 p-3">
      <div className="text-[9px] font-extrabold uppercase tracking-wide text-zinc-400">{label}</div>
      <div className="mt-1 text-xs font-bold text-zinc-800 break-words">{value}</div>
    </div>
  );
}
