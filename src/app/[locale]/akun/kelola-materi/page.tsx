'use client';

import { useEffect, useMemo, useState } from 'react';
import { ModalShell } from '@/components/ui/ModalShell';
import { apiDelete, apiGet, apiPost, apiPut } from '@/lib/api-client';

type Category = { id: number; name: string; slug: string; description?: string | null; sortOrder: number; isActive?: boolean };
type Material = {
  id: number;
  title: string;
  slug: string;
  description?: string | null;
  category?: Category | null;
  categoryId?: number | null;
  publishDate: string;
  coverUrl?: string | null;
  resourceUrl?: string | null;
  resourceLabel?: string | null;
  status: 'draft' | 'published';
  labels?: string[];
  roles?: string[];
  isPinned: boolean;
  sortOrder: number;
  viewCount: number;
  resourceOpenCount: number;
  contentBody?: string | null;
};

const emptyForm = {
  id: 0,
  title: '',
  slug: '',
  description: '',
  contentBody: '',
  categoryId: 0,
  publishDate: new Date().toISOString().slice(0, 16),
  coverUrl: '',
  resourceUrl: '',
  resourceLabel: 'Buka Materi',
  status: 'draft',
  labelsText: 'Penting',
  roles: ['SuperAdmin', 'Admin', 'Agen', 'Marketing'] as string[],
  isPinned: false,
  sortOrder: 0,
  isActive: true,
};

const defaultLabels = ['Penting', 'Rekomendasi', 'Urgent', 'Training', 'Script', 'Compliance', 'Pemula', 'Advanced'];
const defaultRoleOptions = ['SuperAdmin', 'Admin', 'Agen', 'Marketing'];
const defaultJsonTemplate = `[
  {
    "title": "Materi Follow Up Buyer Hari Ini",
    "slug": "materi-follow-up-buyer-hari-ini",
    "description": "Template follow up untuk calon jamaah yang sudah bertanya paket.",
    "contentBody": "Gunakan bahasa halus, gali kebutuhan buyer, lalu arahkan ke link paket resmi.",
    "categorySlug": "whatsapp-follow-up",
    "publishDate": "2026-06-04T09:00:00Z",
    "coverUrl": "https://example.com/cover.jpg",
    "resourceUrl": "https://example.com/materi.pdf",
    "resourceLabel": "Buka Materi",
    "status": "published",
    "labels": ["Penting", "Rekomendasi"],
    "roles": ["SuperAdmin", "Admin", "Agen", "Marketing"],
    "isPinned": false,
    "sortOrder": 0,
    "isActive": true
  }
]`;

export default function KelolaMateriPage() {
  const [tab, setTab] = useState<'materials' | 'categories' | 'report'>('materials');
  const [rows, setRows] = useState<Material[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [roles, setRoles] = useState<string[]>([]);
  const [form, setForm] = useState<any>(emptyForm);
  const [categoryForm, setCategoryForm] = useState<any>({ id: 0, name: '', slug: '', description: '', sortOrder: 0, isActive: true });
  const [report, setReport] = useState<any[]>([]);
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [materialModalOpen, setMaterialModalOpen] = useState(false);
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [materialModalTab, setMaterialModalTab] = useState<'form' | 'json'>('form');
  const [jsonText, setJsonText] = useState(defaultJsonTemplate);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState({
    search: '',
    categoryId: '',
    status: '',
    role: '',
    label: '',
    fromDate: '',
    toDate: '',
    sortBy: 'publishDate',
    sortDir: 'desc',
  });

  const labels = useMemo(() => {
    const fromRows = rows.flatMap((x) => x.labels ?? []);
    const fromForm = String(form.labelsText || '').split(',').map((x) => x.trim()).filter(Boolean);
    return Array.from(new Set([...defaultLabels, ...fromRows, ...fromForm]));
  }, [rows, form.labelsText]);

  const roleOptions = useMemo(() => {
    return Array.from(new Set([...defaultRoleOptions, ...roles].filter(Boolean)));
  }, [roles]);

  const queryString = (extra: Record<string, string | number | undefined> = {}) => {
    const q = new URLSearchParams();
    const merged: any = { ...filters, ...extra };
    Object.entries(merged).forEach(([k, v]) => {
      if (v !== undefined && v !== null && String(v).trim() !== '') q.set(k, String(v));
    });
    return q.toString();
  };

  const loadBase = async () => {
    const [c, r] = await Promise.all([
      apiGet<any>('/api/LearningMaterials/admin/categories'),
      apiGet<any>('/api/LearningMaterials/admin/roles'),
    ]);
    setCategories(Array.isArray(c?.data) ? c.data : []);
    setRoles((Array.isArray(r?.data) ? r.data : []).filter(Boolean));
  };

  const loadMaterials = async (nextPage = page) => {
    setLoading(true);
    try {
      const qs = queryString({ page: nextPage, pageSize: 10 });
      const res = await apiGet<any>(`/api/LearningMaterials/admin?${qs}`);
      setRows(res?.data?.items ?? []);
      setPage(res?.data?.page ?? nextPage);
      setTotalPages(res?.data?.totalPages ?? 1);
    } catch (e: any) {
      setMsg(e?.message || 'Gagal memuat materi');
    } finally {
      setLoading(false);
    }
  };

  const loadReport = async () => {
    setLoading(true);
    try {
      const q = new URLSearchParams();
      if (filters.role) q.set('role', filters.role);
      if (filters.fromDate) q.set('fromDate', `${filters.fromDate}T00:00:00Z`);
      if (filters.toDate) q.set('toDate', `${filters.toDate}T23:59:59Z`);
      q.set('pageSize', '100');
      const res = await apiGet<any>(`/api/LearningMaterials/admin/viewer-report?${q.toString()}`);
      setReport(res?.data?.items ?? []);
    } catch (e: any) {
      setMsg(e?.message || 'Gagal memuat report');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadBase();
    void loadMaterials(1);
  }, []);

  const resetForm = () => setForm({ ...emptyForm, publishDate: new Date().toISOString().slice(0, 16) });

  const openNewMaterial = () => {
    resetForm();
    setMaterialModalTab('form');
    setMaterialModalOpen(true);
  };

  const closeMaterialModal = () => {
    if (saving) return;
    setMaterialModalOpen(false);
  };

  const closeCategoryModal = () => {
    if (saving) return;
    setCategoryModalOpen(false);
  };

  const editMaterial = async (id: number) => {
    try {
      const res = await apiGet<any>(`/api/LearningMaterials/admin/${id}`);
      const x = res?.data;
      setForm({
        id: x.id,
        title: x.title ?? '',
        slug: x.slug ?? '',
        description: x.description ?? '',
        contentBody: x.contentBody ?? '',
        categoryId: x.categoryId ?? 0,
        publishDate: x.publishDate ? new Date(x.publishDate).toISOString().slice(0, 16) : new Date().toISOString().slice(0, 16),
        coverUrl: x.coverUrl ?? '',
        resourceUrl: x.resourceUrl ?? '',
        resourceLabel: x.resourceLabel ?? 'Buka Materi',
        status: x.status ?? 'draft',
        labelsText: (x.labels ?? []).join(', '),
        roles: x.roles ?? [],
        isPinned: Boolean(x.isPinned),
        sortOrder: Number(x.sortOrder || 0),
        isActive: true,
      });
      setMaterialModalTab('form');
      setMaterialModalOpen(true);
    } catch (e: any) {
      setMsg(e?.message || 'Gagal membuka detail materi');
    }
  };

  const saveMaterial = async () => {
    setSaving(true);
    try {
      const payload = {
        title: form.title,
        slug: form.slug,
        description: form.description,
        contentBody: form.contentBody,
        categoryId: Number(form.categoryId || 0) || null,
        publishDate: new Date(form.publishDate).toISOString(),
        coverUrl: form.coverUrl,
        resourceUrl: form.resourceUrl,
        resourceLabel: form.resourceLabel,
        status: form.status,
        labels: String(form.labelsText || '').split(',').map((x) => x.trim()).filter(Boolean),
        roles: form.roles,
        isPinned: Boolean(form.isPinned),
        sortOrder: Number(form.sortOrder || 0),
        isActive: Boolean(form.isActive),
      };
      if (form.id) await apiPut(`/api/LearningMaterials/admin/${form.id}`, payload);
      else await apiPost('/api/LearningMaterials/admin', payload);
      setMsg('Materi tersimpan');
      resetForm();
      setMaterialModalOpen(false);
      await loadMaterials(1);
    } catch (e: any) {
      setMsg(e?.message || 'Gagal menyimpan materi');
    } finally {
      setSaving(false);
    }
  };

  const resolveCategoryId = (raw: any) => {
    const explicitId = Number(raw?.categoryId || 0);
    if (explicitId > 0) return explicitId;
    const key = String(raw?.categorySlug ?? raw?.category ?? raw?.categoryName ?? '').trim().toLowerCase();
    if (!key) return null;
    const found = categories.find((x) => x.slug.toLowerCase() === key || x.name.toLowerCase() === key);
    return found?.id ?? null;
  };

  const normalizeJsonMaterial = (raw: any) => ({
    title: String(raw?.title ?? raw?.judul ?? '').trim(),
    slug: String(raw?.slug ?? '').trim(),
    description: String(raw?.description ?? raw?.deskripsi ?? '').trim(),
    contentBody: String(raw?.contentBody ?? raw?.content ?? raw?.isi ?? '').trim(),
    categoryId: resolveCategoryId(raw),
    publishDate: raw?.publishDate ? new Date(raw.publishDate).toISOString() : new Date().toISOString(),
    coverUrl: String(raw?.coverUrl ?? raw?.cover ?? '').trim(),
    resourceUrl: String(raw?.resourceUrl ?? raw?.url ?? raw?.downloadUrl ?? raw?.link ?? '').trim(),
    resourceLabel: String(raw?.resourceLabel ?? raw?.buttonLabel ?? 'Buka Materi').trim(),
    status: String(raw?.status ?? 'published').trim().toLowerCase(),
    labels: Array.isArray(raw?.labels)
      ? raw.labels.map((x: unknown) => String(x).trim()).filter(Boolean)
      : String(raw?.labels ?? 'Penting').split(',').map((x) => x.trim()).filter(Boolean),
    roles: Array.isArray(raw?.roles) && raw.roles.length > 0
      ? raw.roles.map((x: unknown) => String(x).trim()).filter(Boolean)
      : defaultRoleOptions,
    isPinned: Boolean(raw?.isPinned ?? false),
    sortOrder: Number(raw?.sortOrder || 0),
    isActive: raw?.isActive === undefined ? true : Boolean(raw.isActive),
  });

  const executeJson = async () => {
    setSaving(true);
    try {
      const parsed = JSON.parse(jsonText);
      const items = Array.isArray(parsed) ? parsed : [parsed];
      if (items.length === 0) throw new Error('JSON harus berisi object atau array object');
      for (const raw of items) {
        const payload = normalizeJsonMaterial(raw);
        if (!payload.title) throw new Error('Setiap item JSON wajib punya title/judul');
        const id = Number(raw?.id || 0);
        if (id > 0) await apiPut(`/api/LearningMaterials/admin/${id}`, payload);
        else await apiPost('/api/LearningMaterials/admin', payload);
      }
      setMsg(`Execute JSON berhasil: ${items.length} materi`);
      setMaterialModalOpen(false);
      await loadMaterials(1);
    } catch (e: any) {
      setMsg(e?.message || 'Gagal execute JSON');
    } finally {
      setSaving(false);
    }
  };

  const copyJson = async () => {
    try {
      await navigator.clipboard.writeText(jsonText);
      setMsg('JSON berhasil disalin');
    } catch {
      setMsg('Gagal copy JSON');
    }
  };

  const pasteJson = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setJsonText(text);
      setMsg('JSON berhasil ditempel');
    } catch {
      setMsg('Gagal paste JSON');
    }
  };

  const deleteMaterial = async (id: number) => {
    if (!confirm('Hapus materi ini?')) return;
    await apiDelete(`/api/LearningMaterials/admin/${id}`);
    setMsg('Materi dihapus');
    await loadMaterials(page);
  };

  const saveCategory = async () => {
    setSaving(true);
    try {
      const payload = {
        name: categoryForm.name,
        slug: categoryForm.slug,
        description: categoryForm.description,
        sortOrder: Number(categoryForm.sortOrder || 0),
        isActive: Boolean(categoryForm.isActive),
      };
      if (categoryForm.id) await apiPut(`/api/LearningMaterials/admin/categories/${categoryForm.id}`, payload);
      else await apiPost('/api/LearningMaterials/admin/categories', payload);
      setCategoryForm({ id: 0, name: '', slug: '', description: '', sortOrder: 0, isActive: true });
      setCategoryModalOpen(false);
      await loadBase();
      setMsg('Kategori tersimpan');
    } catch (e: any) {
      setMsg(e?.message || 'Gagal menyimpan kategori');
    } finally {
      setSaving(false);
    }
  };

  const deleteCategory = async (id: number) => {
    if (!confirm('Hapus kategori ini? Materi yang memakai kategori ini akan tetap ada tanpa kategori.')) return;
    await apiDelete(`/api/LearningMaterials/admin/categories/${id}`);
    await loadBase();
  };

  const toggleRole = (role: string) => {
    setForm((p: any) => ({
      ...p,
      roles: p.roles.includes(role) ? p.roles.filter((x: string) => x !== role) : [...p.roles, role],
    }));
  };

  return (
    <div className="p-4 space-y-4 animate-fade-up">
      <div className="bg-white border rounded-3xl p-5">
        <h1 className="text-lg font-extrabold">Kelola Materi</h1>
        <p className="text-xs text-zinc-500 mt-1">CRUD materi harian, kategori, role access, viewer, dan akses link.</p>
      </div>

      {msg ? <div className="rounded-2xl border bg-emerald-50 px-4 py-3 text-xs text-emerald-700">{msg}</div> : null}

      <div className="flex gap-2 overflow-x-auto text-xs">
        {[
          ['materials', 'Materi'],
          ['categories', 'Kategori'],
          ['report', 'Viewer Report'],
        ].map(([key, label]) => (
          <button key={key} className={`rounded-xl border px-3 py-2 font-semibold ${tab === key ? 'bg-zinc-900 text-white' : 'bg-white'}`} onClick={() => setTab(key as any)}>
            {label}
          </button>
        ))}
      </div>

      {tab === 'materials' ? (
        <>
          <div className="flex items-center justify-between gap-3">
            <div className="text-xs text-zinc-500">Tambah dan edit materi dilakukan lewat popup agar form tetap rapi di layout akun.</div>
            <button className="shrink-0 rounded-xl bg-zinc-900 px-4 py-2 text-xs font-semibold text-white" onClick={openNewMaterial}>
              Tambah Materi
            </button>
          </div>

          <div className="bg-white border rounded-3xl p-4 space-y-3 text-xs">
            <div className="grid grid-cols-[1fr_auto_auto] gap-2">
              <input className="min-w-0 border rounded-xl px-3 py-2" placeholder="Cari materi" value={filters.search} onChange={(e) => setFilters((p) => ({ ...p, search: e.target.value }))} />
              <button className="rounded-xl border px-3 py-2 font-semibold" onClick={() => void loadMaterials(1)}>Cari</button>
              <button className="rounded-xl border px-3 py-2 font-semibold" onClick={() => setShowAdvancedFilters((p) => !p)}>
                {showAdvancedFilters ? 'Hide' : 'Show'}
              </button>
            </div>
            {showAdvancedFilters ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <select className="border rounded-xl px-3 py-2" value={filters.categoryId} onChange={(e) => setFilters((p) => ({ ...p, categoryId: e.target.value }))}>
                  <option value="">Semua kategori</option>
                  {categories.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}
                </select>
                <select className="border rounded-xl px-3 py-2" value={filters.status} onChange={(e) => setFilters((p) => ({ ...p, status: e.target.value }))}>
                  <option value="">Semua status</option>
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                </select>
                <select className="border rounded-xl px-3 py-2" value={filters.role} onChange={(e) => setFilters((p) => ({ ...p, role: e.target.value }))}>
                  <option value="">Semua role</option>
                  {roleOptions.map((x) => <option key={x} value={x}>{x}</option>)}
                </select>
                <select className="border rounded-xl px-3 py-2" value={filters.label} onChange={(e) => setFilters((p) => ({ ...p, label: e.target.value }))}>
                  <option value="">Semua label</option>
                  {labels.map((x) => <option key={x} value={x}>{x}</option>)}
                </select>
                <input className="border rounded-xl px-3 py-2" type="date" value={filters.fromDate} onChange={(e) => setFilters((p) => ({ ...p, fromDate: e.target.value }))} />
                <input className="border rounded-xl px-3 py-2" type="date" value={filters.toDate} onChange={(e) => setFilters((p) => ({ ...p, toDate: e.target.value }))} />
                <select className="border rounded-xl px-3 py-2" value={filters.sortBy} onChange={(e) => setFilters((p) => ({ ...p, sortBy: e.target.value }))}>
                  <option value="publishDate">Tanggal publish</option>
                  <option value="createdAt">Tanggal dibuat</option>
                  <option value="title">Judul</option>
                  <option value="views">Viewer</option>
                  <option value="opens">Link dibuka</option>
                </select>
                <select className="border rounded-xl px-3 py-2" value={filters.sortDir} onChange={(e) => setFilters((p) => ({ ...p, sortDir: e.target.value }))}>
                  <option value="desc">Terbaru/Tertinggi</option>
                  <option value="asc">Terlama/Terendah</option>
                </select>
                <button className="rounded-xl border px-3 py-2 font-semibold md:col-span-2" onClick={() => void loadMaterials(1)}>Terapkan Filter</button>
              </div>
            ) : null}
          </div>

          <div className="space-y-2">
            {rows.map((x) => (
              <div key={x.id} className="bg-white border rounded-2xl p-4 text-xs space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-bold text-sm">{x.title}</div>
                    <div className="text-zinc-500">{x.category?.name || 'Tanpa kategori'} • {new Date(x.publishDate).toLocaleString('id-ID')}</div>
                  </div>
                  <span className={`rounded-full border px-2 py-1 ${x.status === 'published' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>{x.status}</span>
                </div>
                <div className="text-zinc-600">{x.description || '-'}</div>
                <div className="flex flex-wrap gap-1">
                  {(x.labels ?? []).map((label) => <span key={label} className="rounded-full bg-zinc-100 px-2 py-1">{label}</span>)}
                  {(x.roles ?? []).map((role) => <span key={role} className="rounded-full border px-2 py-1">{role}</span>)}
                </div>
                <div className="text-zinc-500">Viewer: {x.viewCount || 0} • Link dibuka: {x.resourceOpenCount || 0}</div>
                <div className="flex gap-2">
                  <button className="rounded-xl border px-3 py-2 font-semibold" onClick={() => void editMaterial(x.id)}>Edit</button>
                  <button className="rounded-xl border px-3 py-2 font-semibold text-red-600" onClick={() => void deleteMaterial(x.id)}>Hapus</button>
                </div>
              </div>
            ))}
            {rows.length === 0 ? <div className="rounded-2xl border bg-white p-4 text-xs text-zinc-500">Belum ada materi.</div> : null}
          </div>

          <div className="flex items-center justify-between text-xs">
            <button className="rounded-xl border px-3 py-2 disabled:opacity-40" disabled={page <= 1} onClick={() => void loadMaterials(page - 1)}>Sebelumnya</button>
            <span>Halaman {page} / {totalPages}</span>
            <button className="rounded-xl border px-3 py-2 disabled:opacity-40" disabled={page >= totalPages} onClick={() => void loadMaterials(page + 1)}>Berikutnya</button>
          </div>
        </>
      ) : null}

      {tab === 'categories' ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div className="text-xs text-zinc-500">Kelola kategori materi lewat popup singkat.</div>
            <button
              className="shrink-0 rounded-xl bg-zinc-900 px-4 py-2 text-xs font-semibold text-white"
              onClick={() => {
                setCategoryForm({ id: 0, name: '', slug: '', description: '', sortOrder: 0, isActive: true });
                setCategoryModalOpen(true);
              }}
            >
              Tambah Kategori
            </button>
          </div>
          {categories.map((x) => (
            <div key={x.id} className="bg-white border rounded-2xl p-4 text-xs flex items-center gap-3">
              <div className="flex-1">
                <div className="font-bold">{x.name}</div>
                <div className="text-zinc-500">{x.slug} • sort {x.sortOrder}</div>
              </div>
              <button className="rounded-xl border px-3 py-2" onClick={() => { setCategoryForm({ ...x, description: x.description ?? '', isActive: x.isActive ?? true }); setCategoryModalOpen(true); }}>Edit</button>
              <button className="rounded-xl border px-3 py-2 text-red-600" onClick={() => void deleteCategory(x.id)}>Hapus</button>
            </div>
          ))}
        </div>
      ) : null}

      {tab === 'report' ? (
        <div className="space-y-3">
          <div className="bg-white border rounded-3xl p-4 grid grid-cols-1 md:grid-cols-4 gap-2 text-xs">
            <select className="border rounded-xl px-3 py-2" value={filters.role} onChange={(e) => setFilters((p) => ({ ...p, role: e.target.value }))}>
              <option value="">Semua role</option>
              {roleOptions.map((x) => <option key={x} value={x}>{x}</option>)}
            </select>
            <input className="border rounded-xl px-3 py-2" type="date" value={filters.fromDate} onChange={(e) => setFilters((p) => ({ ...p, fromDate: e.target.value }))} />
            <input className="border rounded-xl px-3 py-2" type="date" value={filters.toDate} onChange={(e) => setFilters((p) => ({ ...p, toDate: e.target.value }))} />
            <button className="rounded-xl border px-3 py-2 font-semibold" onClick={() => void loadReport()}>Load Report</button>
          </div>
          {report.map((x) => (
            <div key={x.userId} className="bg-white border rounded-2xl p-4 text-xs">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="font-bold">{x.fullName || x.userName || '-'}</div>
                  <div className="text-zinc-500">@{x.userName || '-'} • {(x.roles ?? []).join(', ')}</div>
                </div>
                <span className="rounded-full border px-2 py-1">{x.activityLabel}</span>
              </div>
              <div className="mt-2 text-zinc-600">View: {x.views || 0} • Buka link: {x.resourceOpens || 0} • Total: {x.totalActivity || 0}</div>
              <div className="text-zinc-400">Terakhir akses: {x.lastAccessedAt ? new Date(x.lastAccessedAt).toLocaleString('id-ID') : '-'}</div>
            </div>
          ))}
          {report.length === 0 ? <div className="rounded-2xl border bg-white p-4 text-xs text-zinc-500">Klik Load Report untuk melihat aktivitas user.</div> : null}
        </div>
      ) : null}

      <ModalShell
        open={materialModalOpen}
        onBackdropClick={closeMaterialModal}
        zIndexClass="z-[1300]"
        overlayClassName="bg-black/35"
        contentWrapperClassName="relative h-full w-full flex items-center justify-center p-3 pointer-events-none"
      >
        <div className="mx-auto flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl border bg-white shadow-2xl">
          <div className="flex items-center justify-between gap-3 border-b px-4 py-3">
            <div>
              <h2 className="text-sm font-bold">{form.id ? 'Edit Materi' : 'Tambah Materi'}</h2>
              <p className="text-[11px] text-zinc-500">Isi metadata, role access, label, dan link dinamis materi.</p>
            </div>
            <div className="flex items-center gap-2">
              <button className="h-9 w-9 rounded-xl border font-mono text-xs disabled:opacity-40" title="Mode JSON" disabled={saving} onClick={() => setMaterialModalTab('json')}>
                {'{}'}
              </button>
              <button className="h-9 w-9 rounded-xl border text-lg leading-none disabled:opacity-40" disabled={saving} onClick={closeMaterialModal} aria-label="Tutup modal">×</button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 text-xs">
            <div className="mb-3 grid grid-cols-2 rounded-xl border bg-zinc-50 p-1">
              <button className={`rounded-lg px-3 py-2 font-semibold ${materialModalTab === 'form' ? 'bg-white shadow-sm' : 'text-zinc-500'}`} onClick={() => setMaterialModalTab('form')}>Form</button>
              <button className={`rounded-lg px-3 py-2 font-semibold ${materialModalTab === 'json' ? 'bg-white shadow-sm' : 'text-zinc-500'}`} onClick={() => setMaterialModalTab('json')}>JSON Execute</button>
            </div>

            {materialModalTab === 'form' ? (
            <>
              <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
              <input data-autofocus className="border rounded-xl px-3 py-2" placeholder="Judul" value={form.title} onChange={(e) => setForm((p: any) => ({ ...p, title: e.target.value }))} />
              <input className="border rounded-xl px-3 py-2" placeholder="Slug opsional" value={form.slug} onChange={(e) => setForm((p: any) => ({ ...p, slug: e.target.value }))} />
              <select className="border rounded-xl px-3 py-2" value={form.categoryId} onChange={(e) => setForm((p: any) => ({ ...p, categoryId: Number(e.target.value || 0) }))}>
                <option value={0}>Tanpa kategori</option>
                {categories.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}
              </select>
              <input className="border rounded-xl px-3 py-2" type="datetime-local" value={form.publishDate} onChange={(e) => setForm((p: any) => ({ ...p, publishDate: e.target.value }))} />
              <select className="border rounded-xl px-3 py-2" value={form.status} onChange={(e) => setForm((p: any) => ({ ...p, status: e.target.value }))}>
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </select>
              <input className="border rounded-xl px-3 py-2" type="number" placeholder="Sort order" value={form.sortOrder} onChange={(e) => setForm((p: any) => ({ ...p, sortOrder: Number(e.target.value || 0) }))} />
              <input className="border rounded-xl px-3 py-2 md:col-span-2" placeholder="Cover URL" value={form.coverUrl} onChange={(e) => setForm((p: any) => ({ ...p, coverUrl: e.target.value }))} />
              <input className="border rounded-xl px-3 py-2 md:col-span-2" placeholder="Link materi/download dinamis" value={form.resourceUrl} onChange={(e) => setForm((p: any) => ({ ...p, resourceUrl: e.target.value }))} />
              <input className="border rounded-xl px-3 py-2" placeholder="Label tombol link" value={form.resourceLabel} onChange={(e) => setForm((p: any) => ({ ...p, resourceLabel: e.target.value }))} />
              <input className="border rounded-xl px-3 py-2" placeholder="Label materi, pisahkan koma" value={form.labelsText} onChange={(e) => setForm((p: any) => ({ ...p, labelsText: e.target.value }))} />
              <textarea className="border rounded-xl px-3 py-2 md:col-span-2 min-h-20" placeholder="Deskripsi" value={form.description} onChange={(e) => setForm((p: any) => ({ ...p, description: e.target.value }))} />
              <textarea className="border rounded-xl px-3 py-2 md:col-span-2 min-h-28" placeholder="Isi materi ringkas / catatan internal" value={form.contentBody} onChange={(e) => setForm((p: any) => ({ ...p, contentBody: e.target.value }))} />
              </div>

              <div className="mt-4 space-y-2">
              <div className="font-semibold">Role yang boleh akses</div>
              <div className="flex gap-2 flex-wrap">
                {roleOptions.map((role) => (
                  <label key={role} className="inline-flex items-center gap-2 rounded-xl border px-3 py-2">
                    <input type="checkbox" checked={form.roles.includes(role)} onChange={() => toggleRole(role)} />
                    <span>{role}</span>
                  </label>
                ))}
              </div>
              </div>

              <div className="mt-3">
              <label className="inline-flex items-center gap-2 rounded-xl border px-3 py-2">
                <input type="checkbox" checked={form.isPinned} onChange={(e) => setForm((p: any) => ({ ...p, isPinned: e.target.checked }))} />
                <span>Pinned</span>
              </label>
              </div>
            </>
            ) : (
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <button className="rounded-xl border px-3 py-2 font-semibold" onClick={() => void copyJson()}>Copy</button>
                  <button className="rounded-xl border px-3 py-2 font-semibold" onClick={() => setJsonText('')}>Clear</button>
                  <button className="rounded-xl border px-3 py-2 font-semibold" onClick={() => void pasteJson()}>Paste</button>
                  <button className="inline-flex items-center gap-2 rounded-xl bg-zinc-900 px-3 py-2 font-semibold text-white disabled:opacity-60" disabled={saving} onClick={() => void executeJson()}>
                    {saving ? <span className="h-4 w-4 rounded-full border-2 border-white/50 border-t-white animate-spin" /> : null}
                    <span>{saving ? 'Executing...' : 'Execute'}</span>
                  </button>
                </div>
                <textarea
                  className="min-h-[360px] w-full rounded-2xl border bg-zinc-950 px-3 py-3 font-mono text-[11px] leading-relaxed text-zinc-100"
                  value={jsonText}
                  onChange={(e) => setJsonText(e.target.value)}
                  spellCheck={false}
                />
                <div className="rounded-2xl border bg-zinc-50 p-3 text-[11px] text-zinc-600">
                  Format bisa object tunggal atau array untuk bulk. Default role jika field roles kosong: SuperAdmin, Admin, Agen, Marketing. Kategori bisa pakai categoryId, categorySlug, categoryName, atau category.
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-2 border-t bg-white px-4 py-3 text-xs">
            <button className="rounded-xl border px-4 py-2 font-semibold disabled:opacity-40" disabled={saving} onClick={closeMaterialModal}>Batal</button>
            {materialModalTab === 'form' ? <button className="inline-flex items-center gap-2 rounded-xl bg-zinc-900 px-4 py-2 font-semibold text-white disabled:opacity-60" disabled={saving} onClick={() => void saveMaterial()}>
              {saving ? <span className="h-4 w-4 rounded-full border-2 border-white/50 border-t-white animate-spin" /> : null}
              <span>{saving ? 'Menyimpan...' : form.id ? 'Update Materi' : 'Tambah Materi'}</span>
            </button> : null}
          </div>
        </div>
      </ModalShell>

      <ModalShell open={categoryModalOpen} onBackdropClick={closeCategoryModal} zIndexClass="z-[1300]" overlayClassName="bg-black/35">
        <div className="mx-auto flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-3xl border bg-white shadow-2xl">
          <div className="flex items-center justify-between gap-3 border-b px-4 py-3">
            <div>
              <h2 className="text-sm font-bold">{categoryForm.id ? 'Edit Kategori' : 'Tambah Kategori'}</h2>
              <p className="text-[11px] text-zinc-500">Kategori dipakai untuk filter materi.</p>
            </div>
            <button className="h-9 w-9 rounded-xl border text-lg leading-none disabled:opacity-40" disabled={saving} onClick={closeCategoryModal} aria-label="Tutup modal">×</button>
          </div>

          <div className="grid flex-1 grid-cols-1 gap-2 overflow-y-auto p-4 text-xs md:grid-cols-2">
            <input data-autofocus className="border rounded-xl px-3 py-2" placeholder="Nama kategori" value={categoryForm.name} onChange={(e) => setCategoryForm((p: any) => ({ ...p, name: e.target.value }))} />
            <input className="border rounded-xl px-3 py-2" placeholder="Slug opsional" value={categoryForm.slug} onChange={(e) => setCategoryForm((p: any) => ({ ...p, slug: e.target.value }))} />
            <input className="border rounded-xl px-3 py-2" type="number" placeholder="Sort order" value={categoryForm.sortOrder} onChange={(e) => setCategoryForm((p: any) => ({ ...p, sortOrder: Number(e.target.value || 0) }))} />
            <label className="inline-flex items-center gap-2 rounded-xl border px-3 py-2">
              <input type="checkbox" checked={categoryForm.isActive} onChange={(e) => setCategoryForm((p: any) => ({ ...p, isActive: e.target.checked }))} />
              <span>Aktif</span>
            </label>
            <textarea className="border rounded-xl px-3 py-2 md:col-span-2 min-h-24" placeholder="Deskripsi" value={categoryForm.description} onChange={(e) => setCategoryForm((p: any) => ({ ...p, description: e.target.value }))} />
          </div>

          <div className="flex items-center justify-end gap-2 border-t bg-white px-4 py-3 text-xs">
            <button className="rounded-xl border px-4 py-2 font-semibold disabled:opacity-40" disabled={saving} onClick={closeCategoryModal}>Batal</button>
            <button className="inline-flex items-center gap-2 rounded-xl bg-zinc-900 px-4 py-2 font-semibold text-white disabled:opacity-60" disabled={saving} onClick={() => void saveCategory()}>
              {saving ? <span className="h-4 w-4 rounded-full border-2 border-white/50 border-t-white animate-spin" /> : null}
              <span>{saving ? 'Menyimpan...' : categoryForm.id ? 'Update Kategori' : 'Tambah Kategori'}</span>
            </button>
          </div>
        </div>
      </ModalShell>
    </div>
  );
}
