'use client';

import { useEffect, useMemo, useState } from 'react';
import { useLocale } from 'next-intl';
import { getApiBaseUrl, getAuthToken } from '@/lib/api-client';
import {
  createCareer,
  deleteCareer,
  fetchAdminCareers,
  fetchAdminApplicants,
  fetchAdminApplicantStats,
  toCareerAssetUrl,
  updateCareer,
  type CareerJobItem,
  type CareerApplicantItem,
  type ApplicantStats
} from '@/lib/careers-api';
import { ModalShell } from '@/components/ui/ModalShell';
import { Skeleton } from '@/components/Skeleton';
import { useToast } from '@/components/Toast';

type CareerForm = {
  title: string;
  slug: string;
  department: string;
  location: string;
  employmentType: string;
  workMode: string;
  salaryRange: string;
  summary: string;
  description: string;
  requirements: string;
  responsibilities: string;
  benefits: string;
  coverImageUrl: string;
  applyUrl: string;
  applyEmail: string;
  publishedAt: string;
  expiredAt: string;
  status: 'Draft' | 'Published' | 'Closed';
  sortOrder: number;
  isActive: boolean;
};

const blankForm = (): CareerForm => ({
  title: '',
  slug: '',
  department: '',
  location: '',
  employmentType: 'Full-time',
  workMode: 'On-site',
  salaryRange: '',
  summary: '',
  description: '',
  requirements: '',
  responsibilities: '',
  benefits: '',
  coverImageUrl: '',
  applyUrl: '',
  applyEmail: '',
  publishedAt: '',
  expiredAt: '',
  status: 'Draft',
  sortOrder: 0,
  isActive: true,
});

const toDateInput = (raw?: string | null) => {
  if (!raw) return '';
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return '';
  return d.toISOString().slice(0, 16);
};

const formatWhatsAppLink = (num: string, text = '') => {
  const clean = num.replace(/[^0-9]/g, '');
  const formatted = clean.startsWith('0') ? '62' + clean.slice(1) : clean;
  return `https://wa.me/${formatted}${text ? `?text=${encodeURIComponent(text)}` : ''}`;
};

export default function KelolaKarirPage() {
  const locale = useLocale();
  const { show } = useToast();
  const fallbackImg = "https://placehold.co/600x400/e2e8f0/71717a?text=AlfianTour.com";
  
  // Tab/View State
  const [activeView, setActiveView] = useState<'jobs' | 'applicants'>('jobs');

  // Jobs States
  const [rows, setRows] = useState<CareerJobItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<CareerForm>(blankForm());
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [tab, setTab] = useState<'main' | 'content' | 'apply'>('main');
  const [jsonOpen, setJsonOpen] = useState(false);
  const [jsonText, setJsonText] = useState('');

  // Applicants States
  const [applicants, setApplicants] = useState<CareerApplicantItem[]>([]);
  const [applicantsLoading, setApplicantsLoading] = useState(false);
  const [applicantsPage, setApplicantsPage] = useState(1);
  const [applicantsTotalPages, setApplicantsTotalPages] = useState(1);
  const [applicantsTotalCount, setApplicantsTotalCount] = useState(0);
  const [applicantSearch, setApplicantSearch] = useState('');
  const [applicantJobFilter, setApplicantJobFilter] = useState('');
  const [applicantDetail, setApplicantDetail] = useState<CareerApplicantItem | null>(null);
  const [stats, setStats] = useState<ApplicantStats | null>(null);

  // Auto-slugify and applyUrl generation
  useEffect(() => {
    if (!editingId && form.title) {
      const generatedSlug = form.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '');
      
      setForm((prev) => ({
        ...prev,
        slug: prev.slug ? prev.slug : generatedSlug,
        applyUrl: prev.applyUrl ? prev.applyUrl : `/karir/${generatedSlug}/apply`,
      }));
    }
  }, [form.title, editingId]);

  const load = async () => {
    setLoading(true);
    try {
      const json = await fetchAdminCareers(1, 100, search, status);
      setRows(json.items ?? []);
    } catch (e) {
      show(e instanceof Error ? e.message : 'Gagal memuat lowongan karir');
    } finally {
      setLoading(false);
    }
  };

  const loadApplicants = async (page = 1) => {
    setApplicantsLoading(true);
    try {
      const res = await fetchAdminApplicants(
        page,
        15,
        applicantSearch,
        Number(applicantJobFilter) || undefined
      );
      setApplicants(res.items ?? []);
      setApplicantsPage(res.page);
      setApplicantsTotalCount(res.totalCount);
      setApplicantsTotalPages(res.totalPages);
    } catch (e) {
      show(e instanceof Error ? e.message : 'Gagal memuat daftar pelamar');
    } finally {
      setApplicantsLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const data = await fetchAdminApplicantStats();
      setStats(data);
    } catch {}
  };

  useEffect(() => {
    const t = window.setTimeout(() => void load(), 250);
    return () => window.clearTimeout(t);
  }, [search, status]);

  useEffect(() => {
    if (activeView === 'applicants') {
      const t = window.setTimeout(() => {
        void loadApplicants(applicantsPage);
        void loadStats();
      }, 250);
      return () => window.clearTimeout(t);
    }
  }, [activeView, applicantsPage, applicantSearch, applicantJobFilter]);

  const openCreate = () => {
    setEditingId(null);
    setForm(blankForm());
    setTab('main');
    setJsonOpen(false);
    
    const richExample = {
      title: "Senior Marketing Strategist",
      slug: "senior-marketing-strategist-2026",
      department: "Marketing & Growth",
      location: "Jakarta Selatan / Head Office",
      employmentType: "Full-time",
      workMode: "Hybrid",
      salaryRange: "Competitive",
      summary: "Mencari pakar strategi pemasaran untuk memperluas market share Alfian Tour.",
      description: "Tuliskan deskripsi lengkap pekerjaan di sini. Bisa menggunakan format HTML sederhana.",
      requirements: "1. Minimal 5 tahun pengalaman\n2. Ahli dalam Digital Ads\n3. Leadership yang kuat",
      responsibilities: "1. Merancang strategi kampanye tahunan\n2. Mengoptimalkan ROI iklan\n3. Mentoring tim junior",
      benefits: "Gaji pokok, Komisi, BPJS, Lingkungan kerja Islami",
      coverImageUrl: "/uploads/careers/default-cover.jpg",
      applyUrl: "/karir/senior-marketing-strategist-2026/apply",
      applyEmail: "karir@alfiantour.com",
      publishedAt: new Date().toISOString().slice(0, 16),
      expiredAt: "2026-12-31T23:59",
      status: "Published",
      sortOrder: 1,
      isActive: true
    };
    
    setJsonText(JSON.stringify(richExample, null, 2));
    setFormOpen(true);
  };

  const openEdit = (row: CareerJobItem) => {
    const initial: CareerForm = {
      title: row.title || '',
      slug: row.slug || '',
      department: row.department || '',
      location: row.location || '',
      employmentType: row.employmentType || '',
      workMode: row.workMode || '',
      salaryRange: row.salaryRange || '',
      summary: row.summary || '',
      description: row.description || '',
      requirements: row.requirements || '',
      responsibilities: row.responsibilities || '',
      benefits: row.benefits || '',
      coverImageUrl: row.coverImageUrl || '',
      applyUrl: row.applyUrl || '',
      applyEmail: row.applyEmail || '',
      publishedAt: toDateInput(row.publishedAt),
      expiredAt: toDateInput(row.expiredAt),
      status: (row.status === 'Published' || row.status === 'Closed' ? row.status : 'Draft') as CareerForm['status'],
      sortOrder: Number(row.sortOrder ?? 0),
      isActive: row.isActive ?? true,
    };
    setEditingId(Number(row.id));
    setForm(initial);
    setTab('main');
    setJsonOpen(false);
    setJsonText(JSON.stringify(initial, null, 2));
    setFormOpen(true);
  };

  const applyJson = async () => {
    try {
      const data = JSON.parse(jsonText);
      const isArray = Array.isArray(data);
      const items = isArray ? data : [data];

      if (items.length === 0) {
        show('JSON Error: Tidak ada data untuk diproses');
        return;
      }

      setSaving(true);
      try {
        if (editingId) {
          const raw = items[0];
          const payload = normalizeCareerPayload(raw);
          if (!payload.title || !payload.description) throw new Error('Judul dan deskripsi wajib ada');
          
          await updateCareer(editingId, payload as any);
          show('Lowongan karir diperbarui via JSON');
        } else {
          let successCount = 0;
          for (const raw of items) {
            const payload = normalizeCareerPayload(raw);
            if (payload.title && payload.description) {
              await createCareer(payload as any);
              successCount++;
            }
          }
          show(isArray ? `${successCount} lowongan karir berhasil diimpor` : 'Lowongan karir baru berhasil dibuat');
        }
        
        setFormOpen(false);
        setEditingId(null);
        setForm(blankForm());
        await load();
      } catch (e) {
        show('Gagal kirim JSON ke API: ' + (e instanceof Error ? e.message : 'Error'));
      } finally {
        setSaving(false);
      }
    } catch (e) {
      show('Format JSON tidak valid: ' + (e instanceof Error ? e.message : 'Parse error'));
    }
  };

  const normalizeCareerPayload = (raw: any) => {
    return {
      title: (raw.title || '').trim(),
      slug: (raw.slug || '').trim() || null,
      department: (raw.department || '').trim() || null,
      location: (raw.location || '').trim() || null,
      employmentType: (raw.employmentType || '').trim() || null,
      workMode: (raw.workMode || '').trim() || null,
      salaryRange: (raw.salaryRange || '').trim() || null,
      summary: (raw.summary || '').trim() || null,
      description: (raw.description || '').trim(),
      requirements: (raw.requirements || '').trim() || null,
      responsibilities: (raw.responsibilities || '').trim() || null,
      benefits: (raw.benefits || '').trim() || null,
      coverImageUrl: (raw.coverImageUrl || '').trim() || null,
      applyUrl: (raw.applyUrl || '').trim() || null,
      applyEmail: (raw.applyEmail || '').trim() || null,
      publishedAt: raw.publishedAt ? new Date(raw.publishedAt).toISOString() : null,
      expiredAt: raw.expiredAt ? new Date(raw.expiredAt).toISOString() : null,
      status: raw.status || 'Draft',
      sortOrder: Number(raw.sortOrder || 0),
      isActive: raw.isActive ?? true,
    };
  };

  const payload = useMemo(() => ({
    title: form.title.trim(),
    slug: form.slug.trim() || null,
    department: form.department.trim() || null,
    location: form.location.trim() || null,
    employmentType: form.employmentType.trim() || null,
    workMode: form.workMode.trim() || null,
    salaryRange: form.salaryRange.trim() || null,
    summary: form.summary.trim() || null,
    description: form.description.trim(),
    requirements: form.requirements.trim() || null,
    responsibilities: form.responsibilities.trim() || null,
    benefits: form.benefits.trim() || null,
    coverImageUrl: form.coverImageUrl.trim() || null,
    applyUrl: form.applyUrl.trim() || null,
    applyEmail: form.applyEmail.trim() || null,
    publishedAt: form.publishedAt ? new Date(form.publishedAt).toISOString() : null,
    expiredAt: form.expiredAt ? new Date(form.expiredAt).toISOString() : null,
    status: form.status,
    sortOrder: Number(form.sortOrder || 0),
    isActive: form.isActive,
  }), [form]);

  const submit = async () => {
    if (!payload.title || !payload.description) {
      show('Judul dan deskripsi wajib diisi');
      return;
    }
    setSaving(true);
    try {
      if (editingId) await updateCareer(editingId, payload);
      else await createCareer(payload);
      show(editingId ? 'Lowongan karir diperbarui' : 'Lowongan karir dibuat');
      setFormOpen(false);
      setEditingId(null);
      setForm(blankForm());
      await load();
    } catch (e) {
      show(e instanceof Error ? e.message : 'Gagal menyimpan lowongan karir');
    } finally {
      setSaving(false);
    }
  };

  const uploadCover = async (file: File) => {
    setUploading(true);
    try {
      const token = getAuthToken();
      const body = new FormData();
      body.append('file', file);
      const res = await fetch(`${getApiBaseUrl()}/api/careers/admin/upload-cover`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        body,
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(String(json?.message || `Upload gagal (${res.status})`));
      const url = String(json?.data?.url || json?.url || '').trim();
      if (!url) throw new Error('URL cover dari server kosong');
      setForm((v) => ({ ...v, coverImageUrl: url }));
      show('Cover berhasil diupload');
    } catch (e) {
      show(e instanceof Error ? e.message : 'Upload cover gagal');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="p-4 space-y-4 animate-fade-up">
      {/* Header Panel */}
      <div className="bg-white border rounded-2xl p-4 space-y-2">
        <h1 className="text-sm font-bold">Kelola Karir & Pelamar</h1>
        <p className="text-xs text-zinc-500">Kelola lowongan kerja serta pantau laporan dan daftar berkas pelamar secara real-time.</p>
      </div>

      {/* View Switcher Tabs */}
      <div className="flex border-b border-zinc-200">
        <button
          type="button"
          onClick={() => setActiveView('jobs')}
          className={`px-5 py-3 font-semibold text-xs border-b-2 transition-all flex items-center gap-1.5 ${
            activeView === 'jobs'
              ? 'border-primary-600 text-primary-600 bg-primary-50/10'
              : 'border-transparent text-zinc-500 hover:text-zinc-700'
          }`}
        >
          📁 Kelola Lowongan
        </button>
        <button
          type="button"
          onClick={() => {
            setActiveView('applicants');
            setApplicantsPage(1);
          }}
          className={`px-5 py-3 font-semibold text-xs border-b-2 transition-all flex items-center gap-1.5 ${
            activeView === 'applicants'
              ? 'border-primary-600 text-primary-600 bg-primary-50/10'
              : 'border-transparent text-zinc-500 hover:text-zinc-700'
          }`}
        >
          👤 Daftar Pelamar ({stats?.totalApplicants ?? applicantsTotalCount})
        </button>
      </div>

      {/* VIEW 1: MANAGE JOBS */}
      {activeView === 'jobs' ? (
        <div className="bg-white border rounded-2xl p-3 space-y-3 shadow-sm">
          <div className="flex flex-col sm:flex-row items-center gap-2">
            <input 
              value={search} 
              onChange={(e) => setSearch(e.target.value)} 
              placeholder="Cari lowongan..." 
              className="border rounded-xl px-3 py-1.5 text-xs flex-1 min-w-0 w-full" 
            />
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <select 
                value={status} 
                onChange={(e) => setStatus(e.target.value)} 
                className="border rounded-xl px-3 py-1.5 text-xs bg-white flex-1 sm:flex-none sm:min-w-[100px]"
              >
                <option value="">Semua Status</option>
                <option value="Published">Published</option>
                <option value="Draft">Draft</option>
                <option value="Closed">Closed</option>
              </select>
              <button 
                type="button" 
                onClick={openCreate} 
                className="rounded-xl bg-primary-600 text-white px-4 py-1.5 text-xs font-semibold whitespace-nowrap"
              >
                + Tambah
              </button>
            </div>
          </div>

          {loading ? (
            <div className="space-y-2">
              <Skeleton className="h-20 w-full rounded-xl" />
              <Skeleton className="h-20 w-full rounded-xl" />
            </div>
          ) : null}
          {!loading && rows.length === 0 ? <div className="text-xs text-zinc-500">Belum ada lowongan.</div> : null}

          <div className="space-y-2">
            {rows.map((row) => {
              const img = toCareerAssetUrl(row.coverImageUrl);
              return (
                <div key={row.id} className="border rounded-xl p-3 text-xs sm:flex gap-3">
                  {img ? (
                    <img 
                      src={img} 
                      alt={row.title} 
                      className="mb-2 h-20 w-full rounded-lg object-cover sm:mb-0 sm:w-24" 
                      onError={(e) => { e.currentTarget.src = fallbackImg; }}
                    />
                  ) : null}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="font-semibold">{row.title}</div>
                        <div className="text-zinc-500 mt-1">{[row.department, row.location, row.employmentType].filter(Boolean).join(' • ') || '-'}</div>
                      </div>
                      <span className={`rounded-full px-2 py-1 text-[10px] font-semibold ${row.status === 'Published' ? 'bg-emerald-50 text-emerald-700' : row.status === 'Closed' ? 'bg-red-50 text-red-700' : 'bg-zinc-100 text-zinc-600'}`}>
                        {row.status || 'Draft'}
                      </span>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <a href={`/${locale}/karir/${encodeURIComponent(row.slug || String(row.id))}`} target="_blank" rel="noreferrer" className="border rounded-lg px-2 py-1">
                        Preview
                      </a>
                      <button type="button" onClick={() => openEdit(row)} className="border rounded-lg px-2 py-1">Edit</button>
                      <button type="button" onClick={() => setDeleteId(Number(row.id))} className="border border-red-300 text-red-700 rounded-lg px-2 py-1">Hapus</button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* VIEW 2: APPLICANTS DASHBOARD */
        <div className="space-y-4">
          {/* Stats Section */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-white border rounded-2xl p-4 shadow-sm">
              <p className="text-[10px] uppercase font-bold text-zinc-400">Total Pelamar</p>
              <h2 className="text-2xl font-extrabold text-zinc-950 mt-1">{stats?.totalApplicants ?? applicantsTotalCount} orang</h2>
              <p className="text-[10px] text-zinc-400 mt-0.5">Dari semua lowongan aktif</p>
            </div>
            <div className="bg-white border rounded-2xl p-4 shadow-sm sm:col-span-2">
              <p className="text-[10px] uppercase font-bold text-zinc-400">Distribusi Posisi Pelamar</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {stats?.byJob && stats.byJob.length > 0 ? (
                  stats.byJob.map((bj) => (
                    <span key={bj.jobId} className="inline-flex items-center gap-1.5 rounded-full bg-primary-50 text-primary-700 px-2.5 py-1 text-[10px] font-bold border border-primary-100">
                      {bj.jobTitle}: <strong>{bj.count}</strong>
                    </span>
                  ))
                ) : (
                  <span className="text-[11px] text-zinc-400">Belum ada statistik per pekerjaan.</span>
                )}
              </div>
            </div>
          </div>

          {/* Table / List Container */}
          <div className="bg-white border rounded-2xl p-3 space-y-3 shadow-sm">
            <div className="flex flex-col sm:flex-row items-center gap-2">
              <input
                value={applicantSearch}
                onChange={(e) => {
                  setApplicantSearch(e.target.value);
                  setApplicantsPage(1);
                }}
                placeholder="Cari pelamar berdasarkan nama, email, whatsapp..."
                className="border rounded-xl px-3 py-1.5 text-xs flex-1 min-w-0 w-full"
              />
              <select
                value={applicantJobFilter}
                onChange={(e) => {
                  setApplicantJobFilter(e.target.value);
                  setApplicantsPage(1);
                }}
                className="border rounded-xl px-3 py-1.5 text-xs bg-white w-full sm:w-auto sm:min-w-[180px]"
              >
                <option value="">Semua Posisi</option>
                {rows.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.title}
                  </option>
                ))}
              </select>
            </div>

            {applicantsLoading ? (
              <div className="space-y-2 py-4">
                <Skeleton className="h-10 w-full rounded-lg" />
                <Skeleton className="h-10 w-full rounded-lg" />
                <Skeleton className="h-10 w-full rounded-lg" />
              </div>
            ) : null}

            {!applicantsLoading && applicants.length === 0 ? (
              <div className="text-center py-8 text-zinc-500 text-xs">Belum ada data pelamar yang cocok.</div>
            ) : null}

            {!applicantsLoading && applicants.length > 0 ? (
              <>
                {/* Desktop Table View */}
                <div className="hidden md:block overflow-x-auto border rounded-xl">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-zinc-50 text-zinc-500 font-bold border-b">
                        <th className="p-3">Nama Lengkap</th>
                        <th className="p-3">Posisi Dilamar</th>
                        <th className="p-3">Kontak Pelamar</th>
                        <th className="p-3 text-center">CV</th>
                        <th className="p-3">Pendidikan / Umur</th>
                        <th className="p-3 text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {applicants.map((app) => (
                        <tr key={app.id} className="hover:bg-zinc-50 transition-colors">
                          <td className="p-3 font-semibold text-zinc-900">{app.fullName}</td>
                          <td className="p-3 text-zinc-600 font-medium">{app.jobTitle}</td>
                          <td className="p-3 space-y-0.5">
                            <div className="flex items-center gap-1">
                              <span>📧</span>
                              <a href={`mailto:${app.email}`} className="text-primary-600 hover:underline">{app.email}</a>
                            </div>
                            <div className="flex items-center gap-1">
                              <span className="text-emerald-500 font-bold">💬</span>
                              <a
                                href={formatWhatsAppLink(app.whatsAppNumber, `Halo ${app.fullName}, kami dari Alfian Tour...`)}
                                target="_blank"
                                rel="noreferrer"
                                className="text-emerald-600 font-semibold hover:underline"
                              >
                                {app.whatsAppNumber}
                              </a>
                            </div>
                          </td>
                          <td className="p-3 text-center">
                            <a
                              href={app.cvUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex rounded bg-zinc-900 text-white font-bold px-2.5 py-1 text-[10px] hover:bg-black"
                            >
                              Buka CV ↗
                            </a>
                          </td>
                          <td className="p-3 text-zinc-500">
                            {app.lastEducation} • {app.age} thn
                          </td>
                          <td className="p-3 text-right">
                            <button
                              type="button"
                              onClick={() => setApplicantDetail(app)}
                              className="rounded-lg border bg-white hover:bg-zinc-50 px-3 py-1 font-semibold transition-all shadow-sm"
                            >
                              Lihat Detail
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Card View */}
                <div className="md:hidden space-y-2">
                  {applicants.map((app) => (
                    <div key={app.id} className="border rounded-xl p-3 space-y-2 text-xs bg-zinc-50/50">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-extrabold text-zinc-900">{app.fullName}</p>
                          <p className="text-[10px] text-zinc-400 uppercase tracking-wide font-bold">{app.jobTitle}</p>
                        </div>
                        <span className="bg-zinc-100 rounded px-2 py-0.5 font-semibold text-[10px]">
                          {app.lastEducation} • {app.age} thn
                        </span>
                      </div>
                      
                      <div className="space-y-1 bg-white p-2.5 border rounded-lg">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-zinc-500">WhatsApp</span>
                          <a href={formatWhatsAppLink(app.whatsAppNumber)} className="text-emerald-600 font-bold hover:underline">
                            {app.whatsAppNumber} ↗
                          </a>
                        </div>
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-zinc-500">Email</span>
                          <a href={`mailto:${app.email}`} className="text-primary-600 hover:underline">
                            {app.email}
                          </a>
                        </div>
                      </div>

                      <div className="flex justify-between items-center gap-2 pt-1">
                        <a
                          href={app.cvUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="flex-1 text-center rounded-lg border bg-white font-bold py-1.5 text-[10px]"
                        >
                          CV berkas ↗
                        </a>
                        <button
                          type="button"
                          onClick={() => setApplicantDetail(app)}
                          className="flex-1 rounded-lg bg-zinc-900 hover:bg-black text-white font-bold py-1.5 text-[10px] shadow-sm text-center"
                        >
                          Detail Jawaban
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pagination Controls */}
                {applicantsTotalPages > 1 ? (
                  <div className="flex items-center justify-between pt-3 border-t">
                    <button
                      type="button"
                      disabled={applicantsPage <= 1}
                      onClick={() => setApplicantsPage(v => Math.max(1, v - 1))}
                      className="border rounded-lg px-3 py-1.5 text-[11px] font-semibold disabled:opacity-50"
                    >
                      ← Sebelum
                    </button>
                    <span className="text-[11px] text-zinc-500 font-medium">
                      Halaman {applicantsPage} dari {applicantsTotalPages} ({applicantsTotalCount} pelamar)
                    </span>
                    <button
                      type="button"
                      disabled={applicantsPage >= applicantsTotalPages}
                      onClick={() => setApplicantsPage(v => Math.min(applicantsTotalPages, v + 1))}
                      className="border rounded-lg px-3 py-1.5 text-[11px] font-semibold disabled:opacity-50"
                    >
                      Berikut →
                    </button>
                  </div>
                ) : null}
              </>
            ) : null}
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ModalShell open={deleteId !== null} onBackdropClick={() => setDeleteId(null)} zIndexClass="z-[1300]" overlayClassName="bg-black/30">
        <div className="bg-white w-full max-w-md rounded-2xl p-4 space-y-3">
          <div className="text-sm font-bold">Konfirmasi</div>
          <div className="text-xs text-zinc-700">Hapus lowongan karir ini?</div>
          <div className="flex justify-end gap-2">
            <button type="button" className="border rounded-lg px-3 py-1.5 text-xs" onClick={() => setDeleteId(null)}>Tidak</button>
            <button
              type="button"
              className="bg-red-600 text-white rounded-lg px-3 py-1.5 text-xs font-semibold"
              onClick={async () => {
                const id = deleteId;
                setDeleteId(null);
                if (!id) return;
                try {
                  await deleteCareer(id);
                  show('Lowongan karir dihapus');
                  await load();
                } catch (e) {
                  show(e instanceof Error ? e.message : 'Gagal hapus lowongan karir');
                }
              }}
            >
              Ya
            </button>
          </div>
        </div>
      </ModalShell>

      {/* Add / Edit Career Posting Modal */}
      <ModalShell open={formOpen} onBackdropClick={() => setFormOpen(false)} zIndexClass="z-[1300]" overlayClassName="bg-black/35">
        <div className="bg-white w-full max-w-3xl rounded-2xl max-h-[86vh] overflow-hidden">
          <div className="sticky top-0 z-20 bg-white border-b px-4 py-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold">{editingId ? 'Edit Lowongan Karir' : 'Tambah Lowongan Karir'}</h3>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setJsonOpen(!jsonOpen)}
                  className={`text-[10px] font-mono border rounded px-1.5 py-0.5 transition-colors ${jsonOpen ? 'bg-zinc-900 text-white border-zinc-900' : 'bg-zinc-50 text-zinc-500'}`}
                >
                  {'{JSON}'}
                </button>
                <button type="button" className="text-zinc-500 hover:text-black transition-colors" onClick={() => setFormOpen(false)}>✕</button>
              </div>
            </div>

            {jsonOpen && (
              <div className="mt-3 bg-zinc-50 border rounded-xl p-3 space-y-2 animate-in fade-in slide-in-from-top-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-zinc-600 uppercase tracking-wider">JSON Payload</span>
                  <div className="flex gap-1.5">
                    <button type="button" onClick={() => setJsonText('')} className="text-[10px] bg-white border px-2 py-0.5 rounded shadow-sm hover:bg-zinc-50">Clear</button>
                    <button type="button" onClick={() => {
                       navigator.clipboard.readText().then(text => setJsonText(text)).catch(() => show('Gagal paste (izin ditolak)'));
                    }} className="text-[10px] bg-white border px-2 py-0.5 rounded shadow-sm hover:bg-zinc-50">Paste</button>
                    <button type="button" onClick={() => {
                       navigator.clipboard.writeText(jsonText);
                       show('JSON disalin');
                    }} className="text-[10px] bg-white border px-2 py-0.5 rounded shadow-sm hover:bg-zinc-50">Copy</button>
                  </div>
                </div>
                <textarea
                  value={jsonText}
                  onChange={(e) => setJsonText(e.target.value)}
                  placeholder='Tempel JSON payload di sini...'
                  className="w-full h-24 text-[10px] font-mono p-2 border rounded-lg bg-white focus:ring-1 focus:ring-zinc-900 outline-none"
                />
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => void applyJson()}
                  className="w-full bg-zinc-900 text-white py-1.5 rounded-lg text-[11px] font-bold hover:bg-black transition-colors shadow-md disabled:opacity-60 inline-flex items-center justify-center gap-2"
                >
                  {saving ? <span className="h-3.5 w-3.5 rounded-full border-2 border-white/40 border-t-white animate-spin" /> : null}
                  {saving ? 'Memproses JSON...' : 'Eksekusi Payload JSON'}
                </button>
              </div>
            )}

            <div className="mt-2 flex items-center gap-2">
              {(['main', 'content', 'apply'] as const).map((x) => (
                <button key={x} type="button" onClick={() => setTab(x)} className={`h-8 px-3 rounded-lg text-[11px] font-semibold ${tab === x ? 'bg-zinc-900 text-white' : 'border'}`}>
                  {x === 'main' ? 'Utama' : x === 'content' ? 'Konten' : 'Lamaran'}
                </button>
              ))}
            </div>
          </div>

          <div className="px-4 py-3 overflow-y-auto max-h-[calc(86vh-130px)] text-xs">
            <div className={`grid grid-cols-1 sm:grid-cols-2 gap-2 ${tab === 'main' ? '' : 'hidden'}`}>
              <input value={form.title} onChange={(e) => setForm((v) => ({ ...v, title: e.target.value }))} placeholder="Judul lowongan *" className="border rounded-xl px-3 py-2 sm:col-span-2" />
              <input value={form.slug} onChange={(e) => setForm((v) => ({ ...v, slug: e.target.value }))} placeholder="Slug opsional (Auto-generate dari judul)" className="border rounded-xl px-3 py-2 sm:col-span-2" />
              <input value={form.department} onChange={(e) => setForm((v) => ({ ...v, department: e.target.value }))} placeholder="Divisi / Department" className="border rounded-xl px-3 py-2" />
              <input value={form.location} onChange={(e) => setForm((v) => ({ ...v, location: e.target.value }))} placeholder="Lokasi kerja" className="border rounded-xl px-3 py-2" />
              <input value={form.employmentType} onChange={(e) => setForm((v) => ({ ...v, employmentType: e.target.value }))} placeholder="Full-time / Part-time / Freelance" className="border rounded-xl px-3 py-2" />
              <input value={form.workMode} onChange={(e) => setForm((v) => ({ ...v, workMode: e.target.value }))} placeholder="On-site / Hybrid / Remote" className="border rounded-xl px-3 py-2" />
              <input value={form.salaryRange} onChange={(e) => setForm((v) => ({ ...v, salaryRange: e.target.value }))} placeholder="Range gaji opsional" className="border rounded-xl px-3 py-2" />
              <input type="number" value={form.sortOrder} onChange={(e) => setForm((v) => ({ ...v, sortOrder: Number(e.target.value || 0) }))} placeholder="Sort order" className="border rounded-xl px-3 py-2" />
              <div className="sm:col-span-2 space-y-1">
                <div className="flex items-center gap-2">
                  <input value={form.coverImageUrl} onChange={(e) => setForm((v) => ({ ...v, coverImageUrl: e.target.value }))} placeholder="URL cover image" className="border rounded-xl px-3 py-2 flex-1" />
                  <label className="h-9 px-3 rounded-xl border text-[11px] font-semibold inline-flex items-center cursor-pointer">
                    {uploading ? 'Upload...' : 'Upload'}
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) void uploadCover(f);
                      e.currentTarget.value = '';
                    }} />
                  </label>
                </div>
                {form.coverImageUrl ? (
                  <img 
                    src={toCareerAssetUrl(form.coverImageUrl)} 
                    alt="Cover preview" 
                    className="h-32 w-full rounded-xl border object-cover" 
                    onError={(e) => { e.currentTarget.src = fallbackImg; }}
                  />
                ) : null}
              </div>
              <select value={form.status} onChange={(e) => setForm((v) => ({ ...v, status: e.target.value as CareerForm['status'] }))} className="border rounded-xl px-3 py-2 bg-white">
                <option value="Draft">Draft</option>
                <option value="Published">Published</option>
                <option value="Closed">Closed</option>
              </select>
              <label className="flex items-center gap-2 border rounded-xl px-3 py-2">
                <input type="checkbox" checked={form.isActive} onChange={(e) => setForm((v) => ({ ...v, isActive: e.target.checked }))} />
                Aktif
              </label>
            </div>

            <div className={`grid grid-cols-1 gap-2 ${tab === 'content' ? '' : 'hidden'}`}>
              <textarea value={form.summary} onChange={(e) => setForm((v) => ({ ...v, summary: e.target.value }))} placeholder="Ringkasan singkat" className="border rounded-xl px-3 py-2 min-h-20" />
              <textarea value={form.description} onChange={(e) => setForm((v) => ({ ...v, description: e.target.value }))} placeholder="Deskripsi lowongan *" className="border rounded-xl px-3 py-2 min-h-32" />
              <textarea value={form.responsibilities} onChange={(e) => setForm((v) => ({ ...v, responsibilities: e.target.value }))} placeholder="Tanggung jawab" className="border rounded-xl px-3 py-2 min-h-28" />
              <textarea value={form.requirements} onChange={(e) => setForm((v) => ({ ...v, requirements: e.target.value }))} placeholder="Kualifikasi / Requirements" className="border rounded-xl px-3 py-2 min-h-28" />
              <textarea value={form.benefits} onChange={(e) => setForm((v) => ({ ...v, benefits: e.target.value }))} placeholder="Benefit" className="border rounded-xl px-3 py-2 min-h-24" />
            </div>

            <div className={`grid grid-cols-1 sm:grid-cols-2 gap-2 ${tab === 'apply' ? '' : 'hidden'}`}>
              <input value={form.applyUrl} onChange={(e) => setForm((v) => ({ ...v, applyUrl: e.target.value }))} placeholder="Link form lamaran / Auto-generated internal link" className="border rounded-xl px-3 py-2 sm:col-span-2" />
              <input value={form.applyEmail} onChange={(e) => setForm((v) => ({ ...v, applyEmail: e.target.value }))} placeholder="Email lamaran opsional" className="border rounded-xl px-3 py-2 sm:col-span-2" />
              <label className="space-y-1">
                <span className="text-[11px] text-zinc-500">Tanggal publish</span>
                <input type="datetime-local" value={form.publishedAt} onChange={(e) => setForm((v) => ({ ...v, publishedAt: e.target.value }))} className="w-full border rounded-xl px-3 py-2" />
              </label>
              <label className="space-y-1">
                <span className="text-[11px] text-zinc-500">Tanggal tutup</span>
                <input type="datetime-local" value={form.expiredAt} onChange={(e) => setForm((v) => ({ ...v, expiredAt: e.target.value }))} className="w-full border rounded-xl px-3 py-2" />
              </label>
              <div className="rounded-xl border bg-zinc-50 p-3 text-[11px] text-zinc-500 sm:col-span-2">
                Jika status Published dan tanggal publish kosong, server otomatis memakai waktu saat disimpan.
              </div>
            </div>
          </div>

          <div className="sticky bottom-0 z-20 bg-white border-t px-4 py-3 flex justify-end gap-2">
            <button type="button" onClick={() => setForm(blankForm())} className="rounded-xl border px-4 py-2 text-xs">Reset</button>
            <button type="button" disabled={saving || uploading} onClick={() => void submit()} className="rounded-xl bg-primary-600 text-white px-4 py-2 text-xs font-semibold disabled:opacity-60 inline-flex items-center gap-2">
              {saving ? <span className="h-3.5 w-3.5 rounded-full border-2 border-white/40 border-t-white animate-spin" /> : null}
              {saving ? 'Menyimpan...' : editingId ? 'Update Lowongan' : 'Simpan Lowongan'}
            </button>
          </div>
        </div>
      </ModalShell>

      {/* Applicant Detail View Modal */}
      <ModalShell open={applicantDetail !== null} onBackdropClick={() => setApplicantDetail(null)} zIndexClass="z-[1300]" overlayClassName="bg-black/35">
        <div className="bg-white w-full max-w-2xl rounded-2xl max-h-[86vh] overflow-hidden flex flex-col">
          <div className="sticky top-0 z-20 bg-white border-b px-4 py-3.5 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-zinc-950">Detail Profil Pelamar</h3>
              <p className="text-[10px] text-zinc-400 mt-0.5">Posisi: {applicantDetail?.jobTitle}</p>
            </div>
            <button type="button" className="text-zinc-500 hover:text-black transition-colors" onClick={() => setApplicantDetail(null)}>✕</button>
          </div>

          {applicantDetail && (
            <div className="p-4 overflow-y-auto space-y-4 text-xs">
              {/* Section 1: Informasi Pribadi */}
              <div className="space-y-2 border-b pb-3">
                <h4 className="font-extrabold text-zinc-900 border-l-2 border-primary-600 pl-2">Informasi Pribadi</h4>
                <div className="grid grid-cols-2 gap-x-4 gap-y-2 bg-zinc-50/50 p-3 border rounded-xl">
                  <div>
                    <span className="text-[10px] text-zinc-400 block">Nama Lengkap (KTP)</span>
                    <span className="font-bold text-zinc-800">{applicantDetail.fullName}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-zinc-400 block">Jenis Kelamin</span>
                    <span className="font-semibold text-zinc-800">{applicantDetail.gender}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-zinc-400 block">Umur</span>
                    <span className="font-semibold text-zinc-800">{applicantDetail.age} tahun</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-zinc-400 block">Pendidikan Terakhir</span>
                    <span className="font-semibold text-zinc-800">{applicantDetail.lastEducation}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-zinc-400 block">Kendaraan Pribadi</span>
                    <span className="font-semibold text-zinc-800">{applicantDetail.hasOwnVehicle ? 'Ya' : 'Tidak'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-zinc-400 block">Tanggal Melamar</span>
                    <span className="font-semibold text-zinc-800">
                      {new Date(applicantDetail.createdAt).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                </div>
              </div>

              {/* Section 2: Kontak & CV */}
              <div className="space-y-2 border-b pb-3">
                <h4 className="font-extrabold text-zinc-900 border-l-2 border-primary-600 pl-2">Hubungi Pelamar & Berkas</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="border rounded-xl p-3 flex items-center justify-between bg-white">
                    <div>
                      <span className="text-[10px] text-zinc-400 block">Nomor WhatsApp</span>
                      <a
                        href={formatWhatsAppLink(applicantDetail.whatsAppNumber, `Halo ${applicantDetail.fullName}, kami dari Alfian Tour ingin menindaklanjuti lamaran Anda untuk posisi ${applicantDetail.jobTitle}...`)}
                        target="_blank"
                        rel="noreferrer"
                        className="font-bold text-emerald-600 hover:underline"
                      >
                        {applicantDetail.whatsAppNumber} ↗
                      </a>
                    </div>
                    <span className="text-xl">💬</span>
                  </div>
                  <div className="border rounded-xl p-3 flex items-center justify-between bg-white">
                    <div>
                      <span className="text-[10px] text-zinc-400 block">Email Aktif</span>
                      <a href={`mailto:${applicantDetail.email}`} className="font-bold text-primary-600 hover:underline">
                        {applicantDetail.email}
                      </a>
                    </div>
                    <span className="text-xl">📧</span>
                  </div>
                  <a
                    href={applicantDetail.cvUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="sm:col-span-2 border rounded-xl p-3 bg-zinc-900 text-white font-bold flex items-center justify-between hover:bg-black transition-colors"
                  >
                    <div>
                      <span className="text-[9px] text-zinc-400 block font-normal uppercase tracking-wider">Tinjau Dokumen</span>
                      <span>Link Akses CV & Riwayat Hidup Pelamar</span>
                    </div>
                    <span className="text-sm">Buka CV ↗</span>
                  </a>
                </div>
              </div>

              {/* Section 3: Jawaban Kuesioner */}
              <div className="space-y-3">
                <h4 className="font-extrabold text-zinc-900 border-l-2 border-primary-600 pl-2">Kuesioner Lowongan</h4>
                
                <div className="space-y-3 bg-zinc-50/30 p-3.5 border rounded-2xl">
                  <div>
                    <span className="font-bold text-zinc-700 block">Mengapa tertarik melamar di travel ini?</span>
                    <p className="mt-1 text-zinc-600 bg-white p-2.5 border rounded-lg leading-relaxed whitespace-pre-line">
                      {applicantDetail.whyInterested || '-'}
                    </p>
                  </div>
                  <div>
                    <span className="font-bold text-zinc-700 block">Kelebihan utama yang relevan dengan posisi:</span>
                    <p className="mt-1 text-zinc-600 bg-white p-2.5 border rounded-lg leading-relaxed whitespace-pre-line">
                      {applicantDetail.strengths || '-'}
                    </p>
                  </div>
                  <div>
                    <span className="font-bold text-zinc-700 block">Kekurangan utama yang sedang diperbaiki:</span>
                    <p className="mt-1 text-zinc-600 bg-white p-2.5 border rounded-lg leading-relaxed whitespace-pre-line">
                      {applicantDetail.weaknesses || '-'}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <span className="font-bold text-zinc-700 block">Motivasi Kerja</span>
                      <p className="mt-1 text-zinc-600 bg-white p-2 border rounded-lg leading-relaxed">
                        {applicantDetail.motivation || '-'}
                      </p>
                    </div>
                    <div>
                      <span className="font-bold text-zinc-700 block">Tujuan Karir</span>
                      <p className="mt-1 text-zinc-600 bg-white p-2 border rounded-lg leading-relaxed">
                        {applicantDetail.goal || '-'}
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <span className="font-bold text-zinc-700 block">Mengetahui Lowongan Dari</span>
                      <p className="mt-1 text-zinc-600 bg-white p-2 border rounded-lg leading-relaxed">
                        {applicantDetail.infoSource || '-'}
                      </p>
                    </div>
                    <div>
                      <span className="font-bold text-zinc-700 block">Kapan Bisa Mulai Bekerja</span>
                      <p className="mt-1 text-zinc-600 bg-white p-2 border rounded-lg leading-relaxed">
                        {applicantDetail.startDate || '-'}
                      </p>
                    </div>
                  </div>
                  <div>
                    <span className="font-bold text-zinc-700 block">Pertimbangan Posisi Lain</span>
                    <p className="mt-1 text-zinc-600 bg-white p-2 border rounded-lg leading-relaxed font-semibold">
                      {applicantDetail.isWillingToConsiderOtherPositions 
                        ? '✓ Saya Bersedia dipertimbangkan untuk posisi lain yang sesuai dengan kemampuan saya.' 
                        : '✗ Tidak bersedia dipertimbangkan untuk posisi lain'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Section 4: Persetujuan */}
              <div className="p-3 border rounded-xl bg-emerald-50/50 space-y-1">
                <div className="flex items-center gap-1.5 text-emerald-800 font-bold">
                  <span>✓</span>
                  <span>Pernyataan & Persetujuan</span>
                </div>
                <p className="text-[10px] text-emerald-700 leading-relaxed">
                  Pelamar telah mencentang pernyataan bahwa ia bersedia dihubungi jika memenuhi kualifikasi rekrutmen serta menjamin seluruh data yang diisi adalah benar.
                </p>
              </div>
            </div>
          )}

          <div className="sticky bottom-0 z-20 bg-white border-t px-4 py-3 flex justify-end">
            <button
              type="button"
              onClick={() => setApplicantDetail(null)}
              className="rounded-xl bg-zinc-950 text-white hover:bg-black px-5 py-2 text-xs font-bold shadow-md"
            >
              Tutup Rincian
            </button>
          </div>
        </div>
      </ModalShell>
    </div>
  );
}
