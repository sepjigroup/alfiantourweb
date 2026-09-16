'use client';

import { useEffect, useMemo, useState } from 'react';
import { Link } from '@/i18n/routing-patch';
import { API_BASE_URL, getAuthToken } from '@/lib/api-client';

type ServiceCategory = {
  id: number;
  name: string;
  code?: string;
  slug?: string;
  description?: string;
  sortOrder?: number;
  parentCategoryId?: number | null;
  isActive?: boolean;
};

type ServiceListResponse = {
  items?: ServiceCategory[];
  data?: { items?: ServiceCategory[] };
  metadata?: { totalPages?: number; totalCount?: number };
};

type InputMode = 'form' | 'json-single' | 'json-bulk';

function toSlug(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-');
}

export default function KelolaLayananPage() {
  const [list, setList] = useState<ServiceCategory[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState<ServiceCategory | null>(null);
  const [mode, setMode] = useState<InputMode>('form');

  const [form, setForm] = useState({ name: '', code: '', slug: '', description: '', sortOrder: '0', isActive: true, parentCategoryId: '' });
  const [singleJson, setSingleJson] = useState('{\n  "name": "Umroh",\n  "code": "UMROH",\n  "slug": "umroh",\n  "description": "Layanan umroh reguler",\n  "sortOrder": 1,\n  "isActive": true,\n  "parentCategoryId": null\n}');
  const [bulkJson, setBulkJson] = useState('[\n  {\n    "name": "Umroh",\n    "code": "UMROH",\n    "slug": "umroh",\n    "description": "Layanan umroh reguler",\n    "sortOrder": 1,\n    "isActive": true,\n    "parentCategoryId": null\n  },\n  {\n    "name": "Haji",\n    "code": "HAJI",\n    "slug": "haji",\n    "description": "Layanan haji",\n    "sortOrder": 2,\n    "isActive": true,\n    "parentCategoryId": null\n  }\n]');

  const token = useMemo(() => getAuthToken(), []);

  async function fetchList(nextPage = page) {
    setBusy(true);
    setError('');
    try {
      const q = new URLSearchParams({ page: String(nextPage), pageSize: '20' });
      if (search.trim()) q.set('searchTerm', search.trim());
      const res = await fetch(`${API_BASE_URL}/api/v1/master/PackageCategories?${q.toString()}`, { cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = (await res.json()) as ServiceListResponse;
      const rows = Array.isArray(json.items) ? json.items : (json.data?.items ?? []);
      setList(rows);
      setTotalPages(Math.max(1, Number(json.metadata?.totalPages ?? 1)));
      setPage(nextPage);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Gagal memuat layanan');
      setList([]);
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    void fetchList(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function openAdd() {
    setEditing(null);
    setForm({ name: '', code: '', slug: '', description: '', sortOrder: '0', isActive: true, parentCategoryId: '' });
  }

  function openEdit(item: ServiceCategory) {
    setEditing(item);
    setMode('form');
    setForm({
      name: item.name ?? '',
      code: item.code ?? '',
      slug: item.slug ?? '',
      description: item.description ?? '',
      sortOrder: String(item.sortOrder ?? 0),
      isActive: item.isActive ?? true,
      parentCategoryId: item.parentCategoryId == null ? '' : String(item.parentCategoryId),
    });
  }

  async function saveForm() {
    if (!token) return setError('Token login tidak ditemukan');
    if (!form.name.trim()) return setError('Nama layanan wajib diisi');
    setBusy(true);
    setError('');
    try {
      const payload = {
        id: editing?.id,
        name: form.name.trim(),
        code: form.code.trim() || undefined,
        slug: (form.slug.trim() || toSlug(form.name)).trim(),
        description: form.description.trim() || undefined,
        sortOrder: Number(form.sortOrder || '0'),
        isActive: form.isActive,
        parentCategoryId: form.parentCategoryId.trim() ? Number(form.parentCategoryId) : null,
      };
      const endpoint = editing ? `${API_BASE_URL}/api/v1/master/PackageCategories/${editing.id}` : `${API_BASE_URL}/api/v1/master/PackageCategories`;
      const method = editing ? 'PUT' : 'POST';
      const body = editing ? JSON.stringify(payload) : JSON.stringify({ ...payload, id: undefined });
      const res = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body,
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      openAdd();
      await fetchList(page);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Gagal simpan layanan');
    } finally {
      setBusy(false);
    }
  }

  async function saveSingleJson() {
    if (!token) return setError('Token login tidak ditemukan');
    setBusy(true);
    setError('');
    try {
      const payload = JSON.parse(singleJson) as Record<string, unknown>;
      const res = await fetch(`${API_BASE_URL}/api/v1/master/PackageCategories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      await fetchList(1);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'JSON single tidak valid');
    } finally {
      setBusy(false);
    }
  }

  async function saveBulkJson() {
    if (!token) return setError('Token login tidak ditemukan');
    setBusy(true);
    setError('');
    try {
      const payload = JSON.parse(bulkJson) as unknown[];
      const res = await fetch(`${API_BASE_URL}/api/v1/master/PackageCategories/bulk`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      await fetchList(1);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'JSON bulk tidak valid');
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: number) {
    if (!token) return setError('Token login tidak ditemukan');
    setBusy(true);
    setError('');
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/master/PackageCategories/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      await fetchList(page);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Gagal hapus layanan');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="p-4 space-y-4 animate-fade-up">
      <div className="bg-white border rounded-3xl p-5 space-y-1">
        <div className="flex items-center justify-between text-xs pb-1">
          <Link href="/akun" className="text-blue-600 underline underline-offset-2">Akun →</Link>
          <Link href="/akun/master" className="text-blue-600 underline underline-offset-2">Master Data →</Link>
        </div>
        <h1 className="text-lg font-extrabold g-text">Kelola Layanan</h1>
        <p className="text-xs text-zinc-500">Master data kategori layanan (untuk Home Layanan dan filter /pack/{'{slug}'}).</p>
      </div>

      <div className="bg-white border rounded-3xl p-4 space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cari layanan..." className="border rounded-xl px-3 py-2 text-xs md:col-span-2" />
          <button disabled={busy} onClick={() => void fetchList(1)} className="border rounded-xl px-3 py-2 text-xs font-semibold">Cari</button>
          <button disabled={busy} onClick={openAdd} className="border rounded-xl px-3 py-2 text-xs font-semibold">Reset Form</button>
        </div>

        <div className="flex flex-wrap gap-2">
          <button onClick={() => setMode('form')} className={`px-3 py-1.5 text-xs rounded-xl border ${mode === 'form' ? 'bg-purple-600 text-white border-purple-600' : 'bg-white'}`}>Form Input</button>
          <button onClick={() => setMode('json-single')} className={`px-3 py-1.5 text-xs rounded-xl border ${mode === 'json-single' ? 'bg-purple-600 text-white border-purple-600' : 'bg-white'}`}>JSON Single</button>
          <button onClick={() => setMode('json-bulk')} className={`px-3 py-1.5 text-xs rounded-xl border ${mode === 'json-bulk' ? 'bg-purple-600 text-white border-purple-600' : 'bg-white'}`}>JSON Bulk</button>
        </div>

        {mode === 'form' ? (
          <div className="space-y-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value, slug: p.slug || toSlug(e.target.value) }))} placeholder="Nama layanan" className="border rounded-xl px-3 py-2 text-xs" />
              <input value={form.slug} onChange={(e) => setForm((p) => ({ ...p, slug: toSlug(e.target.value) }))} placeholder="Slug" className="border rounded-xl px-3 py-2 text-xs" />
              <input value={form.code} onChange={(e) => setForm((p) => ({ ...p, code: e.target.value }))} placeholder="Code" className="border rounded-xl px-3 py-2 text-xs" />
              <input value={form.sortOrder} onChange={(e) => setForm((p) => ({ ...p, sortOrder: e.target.value }))} placeholder="Sort Order" className="border rounded-xl px-3 py-2 text-xs" />
              <input value={form.parentCategoryId} onChange={(e) => setForm((p) => ({ ...p, parentCategoryId: e.target.value }))} placeholder="Parent Category Id (opsional)" className="border rounded-xl px-3 py-2 text-xs" />
              <label className="inline-flex items-center gap-2 text-xs px-2">
                <input type="checkbox" checked={form.isActive} onChange={(e) => setForm((p) => ({ ...p, isActive: e.target.checked }))} />
                Aktif
              </label>
              <textarea value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} placeholder="Deskripsi" className="border rounded-xl px-3 py-2 text-xs md:col-span-2 min-h-20" />
            </div>
            <button disabled={busy} onClick={() => void saveForm()} className="w-full border rounded-xl px-3 py-2 text-xs font-semibold">
              {editing ? 'Simpan Perubahan' : 'Tambah Layanan'}
            </button>
          </div>
        ) : null}

        {mode === 'json-single' ? (
          <div className="space-y-2">
            <textarea value={singleJson} onChange={(e) => setSingleJson(e.target.value)} className="w-full border rounded-xl px-3 py-2 text-xs min-h-48 font-mono" />
            <button disabled={busy} onClick={() => void saveSingleJson()} className="w-full border rounded-xl px-3 py-2 text-xs font-semibold">Submit JSON Single</button>
          </div>
        ) : null}

        {mode === 'json-bulk' ? (
          <div className="space-y-2">
            <textarea value={bulkJson} onChange={(e) => setBulkJson(e.target.value)} className="w-full border rounded-xl px-3 py-2 text-xs min-h-56 font-mono" />
            <button disabled={busy} onClick={() => void saveBulkJson()} className="w-full border rounded-xl px-3 py-2 text-xs font-semibold">Submit JSON Bulk</button>
          </div>
        ) : null}

        {error ? <div className="text-xs text-red-500">{error}</div> : null}
      </div>

      <div className="bg-white border rounded-3xl overflow-hidden divide-y divide-zinc-100">
        {list.map((item) => (
          <div key={item.id} className="p-4 flex items-center gap-3">
            <div className={`text-[11px] px-2 py-1 rounded-full ${item.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-zinc-100 text-zinc-600'}`}>
              {item.isActive ? 'Aktif' : 'Nonaktif'}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-semibold truncate">{item.name}</div>
              <div className="text-[11px] text-zinc-500 truncate">/{item.slug || toSlug(item.name || '')} • code: {item.code || '-'} • urut: {item.sortOrder ?? 0}</div>
            </div>
            <button onClick={() => openEdit(item)} className="border rounded-xl px-3 py-1.5 text-xs">Edit</button>
            <button onClick={() => void remove(item.id)} className="border border-red-200 text-red-600 rounded-xl px-3 py-1.5 text-xs">Hapus</button>
          </div>
        ))}
        {!busy && list.length === 0 ? <div className="p-4 text-xs text-zinc-500">Data layanan kosong.</div> : null}
      </div>

      <div className="flex items-center justify-between text-xs">
        <button disabled={busy || page <= 1} onClick={() => void fetchList(page - 1)} className="border rounded-xl px-3 py-1.5">Sebelumnya</button>
        <span>Halaman {page} / {totalPages}</span>
        <button disabled={busy || page >= totalPages} onClick={() => void fetchList(page + 1)} className="border rounded-xl px-3 py-1.5">Berikutnya</button>
      </div>
    </div>
  );
}

