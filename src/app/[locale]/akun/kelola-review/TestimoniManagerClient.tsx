'use client';

import { useEffect, useMemo, useState } from 'react';
import { Link } from '@/i18n/routing-patch';
import { apiDelete, apiGet, apiPost, apiPut } from '@/lib/api-client';
import { ModalShell } from '@/components/ui/ModalShell';
import { useToast } from '@/components/Toast';
import { Skeleton } from '@/components/Skeleton';

type TestimoniItem = {
  id: number;
  reviewerName: string;
  reviewerEmail?: string;
  rating: number;
  reviewText?: string;
  isActive?: boolean;
};

type PublicUser = {
  id: string;
  userName?: string;
  email?: string;
  fullName?: string;
};

function Stars({ value, onChange, readOnly = false }: { value: number; onChange?: (v: number) => void; readOnly?: boolean }) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button key={n} type="button" disabled={readOnly} onClick={() => onChange?.(n)} className={`text-lg leading-none ${n <= value ? 'text-amber-500' : 'text-zinc-300'} ${readOnly ? 'cursor-default' : ''}`} aria-label={`rate-${n}`}>★</button>
      ))}
    </div>
  );
}

export default function TestimoniManagerClient() {
  const { show } = useToast();
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<TestimoniItem[]>([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [statusFilter, setStatusFilter] = useState<'all' | 'public' | 'draft'>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest'>('newest');
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [selectionScope, setSelectionScope] = useState<'page' | 'filtered' | 'none'>('none');
  const [bulkRunning, setBulkRunning] = useState(false);
  const [bulkDeleteConfirmOpen, setBulkDeleteConfirmOpen] = useState(false);
  const [selectAllFilteredLoading, setSelectAllFilteredLoading] = useState(false);
  const [editing, setEditing] = useState<TestimoniItem | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const [openAdd, setOpenAdd] = useState(false);
  const [userSearch, setUserSearch] = useState('');
  const [usersLoading, setUsersLoading] = useState(false);
  const [users, setUsers] = useState<PublicUser[]>([]);
  const [selectedUser, setSelectedUser] = useState<PublicUser | null>(null);
  const [addForm, setAddForm] = useState({ rating: 5, reviewText: '' });

  const canSubmitAdd = useMemo(() => Boolean(selectedUser && addForm.reviewText.trim()), [selectedUser, addForm.reviewText]);
  const allOnPageChecked = items.length > 0 && items.every((x) => selectedIds.includes(x.id));
  const checkedCount = selectedIds.length;

  const buildListUrl = (targetPage: number, targetPageSize: number) => {
    const isActiveQuery = statusFilter === 'all' ? '' : `&isActive=${statusFilter === 'public' ? 'true' : 'false'}`;
    const sortQuery = `&sort=${sortBy === 'oldest' ? 'created_asc' : 'created_desc'}`;
    return `/api/BusinessInsights/pack/reviews/manage?page=${targetPage}&pageSize=${targetPageSize}&search=${encodeURIComponent(search)}${isActiveQuery}${sortQuery}`;
  };

  const load = async () => {
    setLoading(true);
    try {
      const res = await apiGet<any>(buildListUrl(page, pageSize));
      setItems(res?.data?.items ?? []);
      setTotalPages(Math.max(1, Number(res?.data?.totalPages ?? 1)));
      setTotalCount(Number(res?.data?.totalCount ?? 0));
      setSelectedIds([]);
      setSelectionScope('none');
    } catch (e: any) {
      show(e?.message || 'Gagal memuat testimoni');
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    setUsersLoading(true);
    try {
      const res = await apiGet<any>(`/api/UserProfile/public?page=1&pageSize=20&searchTerm=${encodeURIComponent(userSearch)}`);
      setUsers(Array.isArray(res?.data) ? res.data : []);
    } catch (e: any) {
      show(e?.message || 'Gagal memuat user');
      setUsers([]);
    } finally {
      setUsersLoading(false);
    }
  };

  useEffect(() => { void load(); }, [page, statusFilter, sortBy]);
  useEffect(() => { if (openAdd) void loadUsers(); }, [openAdd]);

  const toggleSelectRow = (id: number, checked: boolean) => {
    setSelectionScope('page');
    setSelectedIds((prev) => (checked ? (prev.includes(id) ? prev : [...prev, id]) : prev.filter((x) => x !== id)));
  };

  const toggleSelectAllCurrentPage = (checked: boolean) => {
    setSelectionScope(checked ? 'page' : 'none');
    setSelectedIds(checked ? items.map((x) => x.id) : []);
  };

  const selectAllFilteredAcrossPages = async () => {
    setSelectAllFilteredLoading(true);
    try {
      const first = await apiGet<any>(buildListUrl(1, 200));
      const firstItems: TestimoniItem[] = Array.isArray(first?.data?.items) ? first.data.items : [];
      const allIds = new Set<number>(firstItems.map((x) => x.id));
      const pages = Math.max(1, Number(first?.data?.totalPages ?? 1));
      for (let p = 2; p <= pages; p += 1) {
        const res = await apiGet<any>(buildListUrl(p, 200));
        const rows: TestimoniItem[] = Array.isArray(res?.data?.items) ? res.data.items : [];
        rows.forEach((x) => allIds.add(x.id));
      }
      setSelectedIds(Array.from(allIds));
      setSelectionScope('filtered');
      show(`Terpilih ${allIds.size} testimoni (semua hasil filter)`);
    } catch (e: any) {
      show(e?.message || 'Gagal pilih semua hasil filter');
    } finally {
      setSelectAllFilteredLoading(false);
    }
  };

  const runBulk = async (action: 'publish' | 'draft' | 'delete') => {
    if (selectedIds.length === 0) return show('Pilih minimal satu testimoni');
    setBulkRunning(true);
    try {
      if (action === 'delete') {
        const results = await Promise.allSettled(selectedIds.map((id) => apiDelete(`/api/BusinessInsights/pack/reviews/${id}`)));
        show(`Hapus massal selesai: ${results.filter((r) => r.status === 'fulfilled').length}/${selectedIds.length}`);
      } else {
        const targetActive = action === 'publish';
        const rows = new Map<number, TestimoniItem>();
        items.forEach((x) => rows.set(x.id, x));
        if (selectedIds.some((id) => !rows.has(id))) {
          for (let p = 1; p <= totalPages; p += 1) {
            const res = await apiGet<any>(buildListUrl(p, 200));
            const pageItems: TestimoniItem[] = Array.isArray(res?.data?.items) ? res.data.items : [];
            pageItems.forEach((x) => rows.set(x.id, x));
          }
        }
        const selectedRows = selectedIds.map((id) => rows.get(id)).filter(Boolean) as TestimoniItem[];
        const results = await Promise.allSettled(
          selectedRows.map((row) =>
            apiPut(`/api/BusinessInsights/pack/reviews/${row.id}`, {
              reviewerName: row.reviewerName,
              reviewerEmail: row.reviewerEmail,
              rating: row.rating,
              reviewText: row.reviewText,
              isActive: targetActive,
            }),
          ),
        );
        show(`${action === 'publish' ? 'Publikasi' : 'Draft'} massal selesai: ${results.filter((r) => r.status === 'fulfilled').length}/${selectedRows.length}`);
      }
      setBulkDeleteConfirmOpen(false);
      await load();
    } catch (e: any) {
      show(e?.message || 'Aksi massal gagal');
    } finally {
      setBulkRunning(false);
    }
  };

  return (
    <div className="p-4 space-y-4 animate-fade-up">
      <div className="bg-white border rounded-3xl p-5">
        <h1 className="text-lg font-extrabold g-text">Kelola Testimoni</h1>
        <p className="text-xs text-zinc-500 mt-2">Testimoni di sini otomatis tampil di halaman publik tab Testimoni.</p>
      </div>

      <div className="bg-white border rounded-3xl p-4 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-bold">Daftar Testimoni</h2>
          <button type="button" className="rounded-xl bg-primary-600 text-white px-4 py-2 text-xs font-semibold" onClick={() => { setSelectedUser(null); setUserSearch(''); setAddForm({ rating: 5, reviewText: '' }); setOpenAdd(true); }}>+ Tambah Testimoni</button>
        </div>
        <div className="flex gap-2">
          <input className="border rounded-xl px-3 py-1.5 text-xs w-full" placeholder="Cari testimoni..." value={search} onChange={(e) => setSearch(e.target.value)} />
          <button className="border rounded-xl px-3 py-1.5 text-xs" onClick={() => { setPage(1); void load(); }}>Cari</button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <select className="border rounded-xl px-3 py-2 text-xs" value={statusFilter} onChange={(e) => { setPage(1); setStatusFilter(e.target.value as 'all' | 'public' | 'draft'); }}>
            <option value="all">Semua</option><option value="public">Publik</option><option value="draft">Draft</option>
          </select>
          <select className="border rounded-xl px-3 py-2 text-xs" value={sortBy} onChange={(e) => { setPage(1); setSortBy(e.target.value as 'newest' | 'oldest'); }}>
            <option value="newest">Terbaru</option><option value="oldest">Terlama</option>
          </select>
          <label className="inline-flex items-center gap-2 border rounded-xl px-3 py-2 text-xs">
            <input type="checkbox" checked={allOnPageChecked} onChange={(e) => toggleSelectAllCurrentPage(e.target.checked)} />
            Pilih semua (halaman ini)
          </label>
        </div>
        <div className="flex flex-wrap gap-2">
          <button className="border rounded-xl px-3 py-1.5 text-xs disabled:opacity-50" disabled={selectAllFilteredLoading || bulkRunning || totalCount === 0} onClick={() => void selectAllFilteredAcrossPages()}>
            {selectAllFilteredLoading ? 'Memilih...' : `Pilih Semua Hasil Filter (${totalCount})`}
          </button>
          <button className="border rounded-xl px-3 py-1.5 text-xs disabled:opacity-50" disabled={checkedCount === 0 || bulkRunning} onClick={() => void runBulk('publish')}>Publikasikan Terpilih ({checkedCount})</button>
          <button className="border rounded-xl px-3 py-1.5 text-xs disabled:opacity-50" disabled={checkedCount === 0 || bulkRunning} onClick={() => void runBulk('draft')}>Jadikan Draft ({checkedCount})</button>
          <button className="border border-red-200 text-red-600 rounded-xl px-3 py-1.5 text-xs disabled:opacity-50" disabled={checkedCount === 0 || bulkRunning} onClick={() => setBulkDeleteConfirmOpen(true)}>Hapus Terpilih ({checkedCount})</button>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] text-zinc-500">Mode seleksi:</span>
          <span
            className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold border ${
              selectionScope === 'filtered'
                ? 'border-fuchsia-300 text-fuchsia-700 bg-fuchsia-50'
                : selectionScope === 'page'
                  ? 'border-sky-300 text-sky-700 bg-sky-50'
                  : 'border-zinc-200 text-zinc-600 bg-zinc-50'
            }`}
          >
            {selectionScope === 'filtered' ? 'Semua Hasil Filter' : selectionScope === 'page' ? 'Halaman Ini' : 'Belum Dipilih'}
          </span>
          <span className="inline-flex items-center rounded-full bg-primary-600 text-white px-3 py-1 text-xs font-bold shadow-sm">
            {checkedCount} terpilih
          </span>
        </div>
        <div className="text-[11px] text-zinc-500">Total {totalCount} testimoni</div>
      </div>

      <div className="space-y-2">
        {loading ? (
          <div className="space-y-2">
            <div className="bg-white border rounded-2xl p-3 space-y-2">
              <Skeleton className="h-4 w-44" />
              <Skeleton className="h-3 w-56 rounded-full" />
              <Skeleton className="h-8 w-full rounded-xl" />
            </div>
            <div className="flex items-center gap-2 text-xs text-zinc-500">
              <span className="h-4 w-4 rounded-full border-2 border-zinc-300 border-t-primary-600 animate-spin" />
              Memuat testimoni...
            </div>
          </div>
        ) : null}
        {items.map((x) => (
          <div key={x.id} className="bg-white border rounded-2xl p-3 space-y-1">
            <div className="flex items-center justify-between gap-2">
              <div className="inline-flex items-center gap-2">
                <input type="checkbox" checked={selectedIds.includes(x.id)} onChange={(e) => toggleSelectRow(x.id, e.target.checked)} />
                <div className="text-xs font-semibold">{x.reviewerName}</div>
              </div>
              <Stars value={x.rating} readOnly />
            </div>
            <div className="text-[11px] text-zinc-500">{x.reviewerEmail || '-'}</div>
            <div className="text-[11px]"><span className={`inline-flex rounded-full px-2 py-0.5 border ${x.isActive ? 'border-emerald-200 text-emerald-700 bg-emerald-50' : 'border-amber-200 text-amber-700 bg-amber-50'}`}>{x.isActive ? 'Publik' : 'Draft'}</span></div>
            <div className="text-xs text-zinc-700">{x.reviewText || '-'}</div>
            <div className="flex gap-2 pt-1">
              <button className="border rounded-xl px-3 py-1 text-xs" onClick={async () => { try { await apiPut(`/api/BusinessInsights/pack/reviews/${x.id}`, { reviewerName: x.reviewerName, reviewerEmail: x.reviewerEmail, rating: x.rating, reviewText: x.reviewText, isActive: !(x.isActive ?? true) }); show((x.isActive ?? true) ? 'Dipindah ke Draft' : 'Dipublikasikan'); await load(); } catch (e: any) { show(e?.message || 'Gagal ubah status'); } }}>{(x.isActive ?? true) ? 'Jadikan Draft' : 'Publikasikan'}</button>
              <button className="border rounded-xl px-3 py-1 text-xs" onClick={() => setEditing(x)}>Edit</button>
              <button className="border border-red-200 text-red-600 rounded-xl px-3 py-1 text-xs" onClick={() => setDeleteConfirmId(x.id)}>Delete</button>
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between pt-1">
        <button className="border rounded-lg px-3 py-1.5 text-xs disabled:opacity-50" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>Sebelumnya</button>
        <div className="text-[11px] text-zinc-500">Halaman {page}/{totalPages}</div>
        <button className="border rounded-lg px-3 py-1.5 text-xs disabled:opacity-50" disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>Berikutnya</button>
      </div>

      <ModalShell open={openAdd} onBackdropClick={() => setOpenAdd(false)}>
        <div className="bg-white w-full max-w-2xl rounded-3xl p-4 space-y-3">
          <div className="flex items-center justify-between"><h3 className="text-sm font-bold">Tambah Testimoni</h3><button onClick={() => setOpenAdd(false)} aria-label="Tutup modal">✕</button></div>
          <div className="space-y-2">
            <div className="text-xs font-semibold">Pilih User</div>
            <div className="flex gap-2"><input className="border rounded-xl px-3 py-2 text-xs w-full" placeholder="Cari user: nama / username / email" value={userSearch} onChange={(e) => setUserSearch(e.target.value)} /><button className="border rounded-xl px-3 py-2 text-xs" onClick={() => void loadUsers()}>Cari</button></div>
            <div className="max-h-44 overflow-auto border rounded-xl p-2 space-y-1">
              {usersLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-9 w-full rounded-lg" />
                  <Skeleton className="h-9 w-full rounded-lg" />
                  <div className="flex items-center gap-2 text-xs text-zinc-500">
                    <span className="h-4 w-4 rounded-full border-2 border-zinc-300 border-t-primary-600 animate-spin" />
                    Memuat user...
                  </div>
                </div>
              ) : null}
              {!usersLoading && users.length === 0 ? <div className="text-xs text-zinc-500">User tidak ditemukan.</div> : null}
              {users.map((u) => (<button key={u.id} type="button" onClick={() => setSelectedUser(u)} className={`w-full text-left border rounded-lg px-2 py-2 text-xs ${selectedUser?.id === u.id ? 'border-primary-500 bg-primary-50' : 'border-zinc-200'}`}><div className="font-semibold">{u.fullName || u.userName || '-'}</div><div className="text-zinc-500">{u.userName || '-'} • {u.email || '-'}</div></button>))}
            </div>
          </div>
          <div className="space-y-2">
            <div className="text-xs">User terpilih: <span className="font-semibold">{selectedUser?.fullName || selectedUser?.userName || '-'}</span></div>
            <div className="flex items-center gap-2 text-xs"><span>Rating:</span><Stars value={addForm.rating} onChange={(v) => setAddForm((p) => ({ ...p, rating: v }))} /></div>
            <textarea className="w-full min-h-24 border rounded-xl px-3 py-2 text-xs" placeholder="Tulis testimoni..." value={addForm.reviewText} onChange={(e) => setAddForm((p) => ({ ...p, reviewText: e.target.value }))} />
          </div>
          <div className="flex justify-end gap-2">
            <button className="border rounded-xl px-3 py-2 text-xs" onClick={() => setOpenAdd(false)}>Batal</button>
            <button className="rounded-xl bg-primary-600 text-white px-4 py-2 text-xs font-semibold disabled:opacity-50" disabled={!canSubmitAdd} onClick={async () => {
              if (!selectedUser || !addForm.reviewText.trim()) return show('Pilih user dan isi testimoni dulu');
              try { await apiPost('/api/BusinessInsights/pack/review', { programCode: null, reviewerName: selectedUser.fullName || selectedUser.userName || 'Pelanggan', reviewerEmail: selectedUser.email || null, rating: addForm.rating, reviewText: addForm.reviewText.trim() }); show('Testimoni berhasil ditambahkan'); setOpenAdd(false); await load(); } catch (e: any) { show(e?.message || 'Gagal menambahkan testimoni'); }
            }}>Simpan Testimoni</button>
          </div>
        </div>
      </ModalShell>

      <ModalShell open={Boolean(editing)} onBackdropClick={() => setEditing(null)}>
        <div className="bg-white w-full max-w-md rounded-3xl p-4 space-y-2">
          <div className="flex items-center justify-between"><h3 className="text-sm font-bold">Edit Testimoni</h3><button onClick={() => setEditing(null)} aria-label="Tutup modal">✕</button></div>
          <input className="w-full border rounded-xl px-3 py-2 text-xs" value={editing?.reviewerName || ''} onChange={(e) => setEditing((p) => (p ? { ...p, reviewerName: e.target.value } : p))} />
          <input className="w-full border rounded-xl px-3 py-2 text-xs" value={editing?.reviewerEmail || ''} onChange={(e) => setEditing((p) => (p ? { ...p, reviewerEmail: e.target.value } : p))} />
          <Stars value={editing?.rating || 5} onChange={(v) => setEditing((p) => (p ? { ...p, rating: v } : p))} />
          <textarea className="w-full min-h-20 border rounded-xl px-3 py-2 text-xs" value={editing?.reviewText || ''} onChange={(e) => setEditing((p) => (p ? { ...p, reviewText: e.target.value } : p))} />
          <label className="inline-flex items-center gap-2 text-xs"><input type="checkbox" checked={editing?.isActive ?? true} onChange={(e) => setEditing((p) => (p ? { ...p, isActive: e.target.checked } : p))} />Aktif</label>
          <button className="rounded-xl bg-primary-600 text-white px-4 py-2 text-xs font-semibold" onClick={async () => {
            if (!editing) return;
            try { await apiPut(`/api/BusinessInsights/pack/reviews/${editing.id}`, { reviewerName: editing.reviewerName, reviewerEmail: editing.reviewerEmail, rating: editing.rating, reviewText: editing.reviewText, isActive: editing.isActive ?? true }); show('Testimoni berhasil diperbarui'); setEditing(null); await load(); } catch (e: any) { show(e?.message || 'Gagal update testimoni'); }
          }}>Simpan</button>
        </div>
      </ModalShell>

      <ModalShell open={deleteConfirmId !== null} onBackdropClick={() => setDeleteConfirmId(null)} zIndexClass="z-[1300]" overlayClassName="bg-black/30">
        <div className="bg-white w-full max-w-md rounded-2xl p-4 space-y-3">
          <div className="text-sm font-bold">Konfirmasi</div>
          <div className="text-xs text-zinc-700">Hapus testimoni ini?</div>
          <div className="flex justify-end gap-2">
            <button type="button" className="border rounded-lg px-3 py-1.5 text-xs" onClick={() => setDeleteConfirmId(null)}>Tidak</button>
            <button type="button" className="bg-red-600 text-white rounded-lg px-3 py-1.5 text-xs font-semibold" onClick={async () => {
              const id = deleteConfirmId; setDeleteConfirmId(null); if (!id) return;
              try { await apiDelete(`/api/BusinessInsights/pack/reviews/${id}`); show('Testimoni berhasil dihapus'); await load(); } catch (e: any) { show(e?.message || 'Gagal hapus testimoni'); }
            }}>Ya</button>
          </div>
        </div>
      </ModalShell>

      <ModalShell open={bulkDeleteConfirmOpen} onBackdropClick={() => setBulkDeleteConfirmOpen(false)} zIndexClass="z-[1300]" overlayClassName="bg-black/30">
        <div className="bg-white w-full max-w-md rounded-2xl p-4 space-y-3">
          <div className="text-sm font-bold">Konfirmasi Hapus Massal</div>
          <div className="text-xs text-zinc-700">Yakin hapus {checkedCount} testimoni terpilih? Aksi ini tidak bisa dibatalkan.</div>
          <div className="flex justify-end gap-2">
            <button type="button" className="border rounded-lg px-3 py-1.5 text-xs" onClick={() => setBulkDeleteConfirmOpen(false)}>Tidak</button>
            <button type="button" className="bg-red-600 text-white rounded-lg px-3 py-1.5 text-xs font-semibold disabled:opacity-50" disabled={bulkRunning || checkedCount === 0} onClick={() => void runBulk('delete')}>Ya, Hapus</button>
          </div>
        </div>
      </ModalShell>

      <Link href="/akun" className="inline-flex text-sm text-primary-600">← Kembali ke Akun</Link>
    </div>
  );
}

