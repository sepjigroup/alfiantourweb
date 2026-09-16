'use client';

import { useEffect, useMemo, useState } from 'react';
import { API_BASE_URL, getAuthToken } from '@/lib/api-client';
import { fetchAdminVideos } from '@/lib/videos';
import type { AdminVideoItem } from '@/types/video';
import { ModalShell } from '@/components/ui/ModalShell';
import { InlineConfirmOverlay } from '@/components/ui/InlineConfirmOverlay';

type DashboardStats = {
  totalVideo: number;
  uploadToday: number;
  uploadLimit: number;
  remainingUpload: number;
};

export default function KelolaVideoPage() {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [search, setSearch] = useState('');
  const [items, setItems] = useState<AdminVideoItem[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState('');
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [editId, setEditId] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editIsPublic, setEditIsPublic] = useState(true);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [previewVideo, setPreviewVideo] = useState<AdminVideoItem | null>(null);
  const [oauthOpen, setOauthOpen] = useState(false);
  const [oauthConfigured, setOauthConfigured] = useState<boolean | null>(null);
  const [oauthUrl, setOauthUrl] = useState('');
  const [oauthCode, setOauthCode] = useState('');
  const [generatedRefreshToken, setGeneratedRefreshToken] = useState('');

  const loadDashboard = async () => {
    const token = getAuthToken();
    if (!token) return;
    const res = await fetch(`${API_BASE_URL}/api/videos/admin/dashboard`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    });
    if (!res.ok) return;
    const json = await res.json();
    setStats(json.data as DashboardStats);
  };

  const loadOAuthStatus = async () => {
    const token = getAuthToken();
    if (!token) return;
    const res = await fetch(`${API_BASE_URL}/api/videos/admin/config-status`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    });
    if (!res.ok) return;
    const json = await res.json();
    setOauthConfigured(Boolean(json?.data?.isConfigured));
  };

  const loadOAuthUrl = async () => {
    const token = getAuthToken();
    if (!token) return;
    const res = await fetch(`${API_BASE_URL}/api/videos/admin/oauth-url`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    });
    if (!res.ok) return;
    const json = await res.json();
    setOauthUrl(String(json?.data?.url || ''));
  };

  const exchangeOAuthCode = async () => {
    const token = getAuthToken();
    if (!token) return;
    if (!oauthCode.trim()) {
      setError('Code OAuth wajib diisi');
      return;
    }
    setBusy(true);
    setError('');
    try {
      const res = await fetch(`${API_BASE_URL}/api/videos/admin/oauth-exchange`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: oauthCode.trim() }),
      });
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || `Gagal exchange code (${res.status})`);
      }
      const json = await res.json();
      setGeneratedRefreshToken(String(json?.data?.refreshToken || ''));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Gagal exchange code');
    } finally {
      setBusy(false);
    }
  };

  const loadVideos = async (nextPage = 1, nextSearch = search, nextPageSize = pageSize) => {
    const data = await fetchAdminVideos(nextPage, nextPageSize, nextSearch);
    setItems(data.items);
    setPage(data.page);
    setTotalPages(data.totalPages);
    setTotalCount(data.totalCount);
  };

  useEffect(() => {
    void loadDashboard();
    void loadVideos(1);
    void loadOAuthStatus();
    void loadOAuthUrl();
  }, []);

  const doUpload = async () => {
    if (!file) return;
    if (!title.trim()) {
      setError('Judul video wajib diisi');
      return;
    }
    const token = getAuthToken();
    if (!token) {
      setError('Login terlebih dahulu');
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    setError('');
    try {
      await new Promise<void>((resolve, reject) => {
        const form = new FormData();
        form.append('file', file);
        form.append('title', title.trim());
        form.append('description', description.trim());
        form.append('isPublic', String(isPublic));

        const xhr = new XMLHttpRequest();
        xhr.open('POST', `${API_BASE_URL}/api/videos/admin/upload`);
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
        xhr.upload.onprogress = (evt) => {
          if (!evt.lengthComputable) return;
          const pct = Math.max(0, Math.min(100, Math.round((evt.loaded / evt.total) * 100)));
          setUploadProgress(pct);
        };
        xhr.onload = () => {
          if (xhr.status < 200 || xhr.status >= 300) {
            reject(new Error(xhr.responseText || `Upload gagal (${xhr.status})`));
            return;
          }
          resolve();
        };
        xhr.onerror = () => reject(new Error('Upload gagal, cek koneksi internet.'));
        xhr.send(form);
      });

      setFile(null);
      setTitle('');
      setDescription('');
      setIsPublic(true);
      await loadDashboard();
      await loadVideos(1);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload gagal');
    } finally {
      setUploading(false);
      setTimeout(() => setUploadProgress(0), 500);
    }
  };

  const openEdit = (item: AdminVideoItem) => {
    setEditId(item.id);
    setEditTitle(item.title);
    setEditDescription(item.description || '');
    setEditIsPublic(item.isPublic);
  };

  const doSaveEdit = async () => {
    if (!editId) return;
    const token = getAuthToken();
    if (!token) return;

    setBusy(true);
    setError('');
    try {
      const res = await fetch(`${API_BASE_URL}/api/videos/admin/${editId}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editTitle.trim(),
          description: editDescription.trim() || null,
          isPublic: editIsPublic,
          publishedAt: null,
          regenerateSlug: false,
        }),
      });
      if (!res.ok) throw new Error(`Update gagal (${res.status})`);
      setEditId(null);
      await loadVideos(page);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Update gagal');
    } finally {
      setBusy(false);
    }
  };

  const doDelete = async (id: number) => {
    const token = getAuthToken();
    if (!token) return;
    setBusy(true);
    setError('');
    try {
      const res = await fetch(`${API_BASE_URL}/api/videos/admin/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`Delete gagal (${res.status})`);
      await loadDashboard();
      await loadVideos(Math.max(1, page), search, pageSize);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete gagal');
    } finally {
      setBusy(false);
    }
  };

  const from = useMemo(() => (page - 1) * pageSize + 1, [page, pageSize]);
  const to = useMemo(() => Math.min(totalCount, page * pageSize), [page, pageSize, totalCount]);

  return (
    <div className="p-4 space-y-4 animate-fade-up">
      <div className="bg-white border rounded-3xl p-5 space-y-1">
        <div className="flex items-center justify-between gap-2">
          <h1 className="text-lg font-extrabold g-text">Kelola Video</h1>
          <button type="button" onClick={() => setOauthOpen((v) => !v)} className="border rounded-xl px-3 py-1.5 text-xs font-semibold">
            {oauthOpen ? 'Hide Setup YouTube' : 'Setup YouTube API'}
          </button>
        </div>
        <p className="text-xs text-zinc-500">CRUD video, upload YouTube, preview player, pagination, dan status upload real-time.</p>
      </div>

      {oauthOpen ? (
        <div className="bg-white border rounded-3xl p-5 space-y-3">
          <div className="text-sm font-bold">Konfigurasi YouTube OAuth</div>
          <div className={`text-xs rounded-xl px-3 py-2 border ${oauthConfigured ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-amber-50 border-amber-200 text-amber-700'}`}>
            Status: {oauthConfigured ? 'Siap upload (refresh token terdeteksi).' : 'Belum lengkap. Butuh refresh token.'}
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={() => void loadOAuthUrl()} className="border rounded-xl px-3 py-2 text-xs font-semibold">Refresh URL OAuth</button>
            <button type="button" onClick={() => void loadOAuthStatus()} className="border rounded-xl px-3 py-2 text-xs font-semibold">Cek Status</button>
          </div>
          <textarea value={oauthUrl} readOnly className="w-full border rounded-xl px-3 py-2 text-xs min-h-16 font-mono" />
          <div className="text-[11px] text-zinc-500">Buka URL di atas, login Google, lalu copy parameter `code` dari callback.</div>
          <input value={oauthCode} onChange={(e) => setOauthCode(e.target.value)} placeholder="Paste code OAuth di sini" className="w-full border rounded-xl px-3 py-2 text-xs" />
          <button type="button" disabled={busy} onClick={() => void exchangeOAuthCode()} className="rounded-xl bg-blue-600 text-white px-4 py-2 text-xs font-semibold disabled:opacity-60">
            {busy ? 'Memproses...' : 'Generate Refresh Token'}
          </button>
          {generatedRefreshToken ? (
            <>
              <div className="text-xs font-semibold text-emerald-700">Refresh token berhasil dibuat. Simpan ke `appsettings.json` → `YouTubeUpload:RefreshToken`:</div>
              <textarea value={generatedRefreshToken} readOnly className="w-full border rounded-xl px-3 py-2 text-xs min-h-16 font-mono" />
            </>
          ) : null}
        </div>
      ) : null}

      {stats ? (
        <div className="grid grid-cols-2 gap-3">
          <div className="border rounded-2xl p-3 bg-white"><div className="text-xs text-zinc-500">Total Video</div><div className="text-lg font-bold">{stats.totalVideo}</div></div>
          <div className="border rounded-2xl p-3 bg-white"><div className="text-xs text-zinc-500">Upload Hari Ini</div><div className="text-lg font-bold">{stats.uploadToday}/{stats.uploadLimit}</div><div className="text-[11px] text-zinc-500">Sisa: {stats.remainingUpload}</div></div>
        </div>
      ) : null}

      <div className="bg-white border rounded-3xl p-5 space-y-3">
        <div className="text-sm font-bold">Upload Video Baru</div>
        <input type="file" accept="video/*" onChange={(e) => setFile(e.target.files?.[0] ?? null)} className="w-full border rounded-xl px-3 py-2 text-xs" />
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Judul video" className="w-full border rounded-xl px-3 py-2 text-xs" />
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Deskripsi" className="w-full border rounded-xl px-3 py-2 text-xs min-h-20" />
        <label className="inline-flex items-center gap-2 text-xs">
          <input type="checkbox" checked={isPublic} onChange={(e) => setIsPublic(e.target.checked)} />
          Public
        </label>
        {uploading ? (
          <div className="space-y-1">
            <div className="h-2 rounded-full bg-zinc-100 overflow-hidden">
              <div className="h-full bg-blue-600 transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
            </div>
            <div className="text-[11px] text-zinc-600">Uploading... {uploadProgress}%</div>
          </div>
        ) : null}
        <button disabled={busy || uploading || !file} onClick={() => void doUpload()} className="w-full rounded-xl bg-blue-600 py-2 text-xs font-semibold text-white disabled:opacity-60">
          {uploading ? 'Sedang Upload...' : 'Upload ke YouTube'}
        </button>
        {error ? <p className="text-xs text-red-500 whitespace-pre-wrap">{error}</p> : null}
      </div>

      <div className="bg-white border rounded-3xl p-5 space-y-3">
        <div className="flex flex-wrap gap-2">
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cari judul/slug" className="flex-1 min-w-[220px] border rounded-xl px-3 py-2 text-xs" />
          <select value={pageSize} onChange={(e) => { const n = Number(e.target.value || 10); setPageSize(n); void loadVideos(1, search, n); }} className="border rounded-xl px-3 py-2 text-xs">
            <option value={10}>10 / page</option>
            <option value={20}>20 / page</option>
            <option value={50}>50 / page</option>
          </select>
          <button className="border rounded-xl px-3 text-xs font-semibold" onClick={() => void loadVideos(1, search, pageSize)}>Cari</button>
        </div>
        <div className="text-xs text-zinc-500">Menampilkan {totalCount === 0 ? 0 : from}-{to} dari {totalCount} video • Hal {page}/{Math.max(1, totalPages)}</div>
        <div className="space-y-2">
          {items.map((x) => (
            <article key={x.id} className="border rounded-2xl p-3">
              <div className="flex gap-3">
                <img src={x.thumbnailUrl} alt={x.title} className="w-28 h-16 rounded-lg object-cover border" />
                <div className="min-w-0 flex-1">
                  <div className="font-semibold text-sm line-clamp-1">{x.title}</div>
                  <div className="text-[11px] text-zinc-500 line-clamp-1">/{x.slug}</div>
                  <div className="text-[11px] text-zinc-500">Views: {x.viewCount} • {x.isPublic ? 'Public' : 'Unlisted'}</div>
                  <div className="mt-2 flex gap-2 text-[11px]">
                    <button className="text-indigo-600 font-semibold" onClick={() => setPreviewVideo(x)}>Preview</button>
                    <button className="text-blue-600 font-semibold" onClick={() => openEdit(x)}>Edit</button>
                    <button className="text-red-600 font-semibold" onClick={() => setDeleteId(x.id)}>Delete</button>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
        <div className="flex justify-between">
          <button disabled={page <= 1} onClick={() => void loadVideos(page - 1, search, pageSize)} className="border rounded-xl px-3 py-2 text-xs disabled:opacity-50">Prev</button>
          <button disabled={page >= totalPages} onClick={() => void loadVideos(page + 1, search, pageSize)} className="border rounded-xl px-3 py-2 text-xs disabled:opacity-50">Next</button>
        </div>
      </div>

      <ModalShell open={Boolean(editId)} onBackdropClick={() => setEditId(null)}>
        <div className="w-full max-w-lg bg-white rounded-3xl p-5 space-y-2">
          <h3 className="text-sm font-bold">Edit Video</h3>
          <input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} placeholder="Judul" className="w-full border rounded-xl px-3 py-2 text-xs" />
          <textarea value={editDescription} onChange={(e) => setEditDescription(e.target.value)} placeholder="Deskripsi" className="w-full border rounded-xl px-3 py-2 text-xs min-h-20" />
          <label className="inline-flex items-center gap-2 text-xs">
            <input type="checkbox" checked={editIsPublic} onChange={(e) => setEditIsPublic(e.target.checked)} />
            Public
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button onClick={() => setEditId(null)} className="border rounded-xl py-2 text-xs font-semibold">Batal</button>
            <button disabled={busy} onClick={() => void doSaveEdit()} className="bg-blue-600 text-white rounded-xl py-2 text-xs font-semibold disabled:opacity-60">{busy ? 'Menyimpan...' : 'Simpan'}</button>
          </div>
        </div>
      </ModalShell>

      <ModalShell open={Boolean(previewVideo)} onBackdropClick={() => setPreviewVideo(null)}>
        <div className="w-full max-w-3xl bg-white rounded-3xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-sm font-bold line-clamp-1">{previewVideo?.title}</div>
            <button type="button" onClick={() => setPreviewVideo(null)} className="text-zinc-500">✕</button>
          </div>
          {previewVideo ? (
            <div className="aspect-video rounded-2xl overflow-hidden border">
              <iframe
                src={`https://www.youtube.com/embed/${previewVideo.youTubeVideoId}?rel=0&modestbranding=1`}
                title={previewVideo.title}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            </div>
          ) : null}
        </div>
      </ModalShell>

      <InlineConfirmOverlay
        open={deleteId !== null}
        title="Konfirmasi"
        message="Hapus video ini?"
        cancelLabel="Tidak"
        confirmLabel="Ya"
        onCancel={() => setDeleteId(null)}
        onConfirm={async () => {
          const id = deleteId;
          setDeleteId(null);
          if (!id) return;
          await doDelete(id);
        }}
      />
    </div>
  );
}

