'use client';

import { useEffect, useState } from 'react';
import { API_BASE_URL, getAuthToken } from '@/lib/api-client';
import { ModalShell } from '@/components/ui/ModalShell';

type GalleryItem = {
  id: number;
  name: string;
  fileUrl: string;
  description?: string;
  blurDataUrl?: string;
  width?: number;
  height?: number;
  createdAt?: string;
};
const PLACEHOLDER_404 = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='800' height='500'><rect width='100%' height='100%' fill='%23f4f4f5'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' font-family='Arial' font-size='28' fill='%233f3f46'>404 - Alfian Tour</text></svg>";
const toPublicAssetUrl = (raw?: string | null): string => {
  const val = String(raw ?? '').trim();
  if (!val) return '';
  if (val.startsWith('http://') || val.startsWith('https://') || val.startsWith('data:')) return val;
  if (val.startsWith('file:///')) {
    const normalized = val.replace(/^file:\/\/+/, '/').replace(/\\/g, '/');
    return `${API_BASE_URL}${normalized.startsWith('/') ? '' : '/'}${normalized}`;
  }
  return `${API_BASE_URL}${val.startsWith('/') ? '' : '/'}${val}`;
};

export default function KelolaGalleryPage() {
  const [files, setFiles] = useState<FileList | null>(null);
  const [caption, setCaption] = useState('');
  const [seoTitle, setSeoTitle] = useState('');
  const [seoDescription, setSeoDescription] = useState('');
  const [rotateDegrees, setRotateDegrees] = useState(0);
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [busy, setBusy] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadingFileName, setUploadingFileName] = useState('');
  const [error, setError] = useState('');
  const [previewSrc, setPreviewSrc] = useState('');
  const [mounted, setMounted] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [editCaption, setEditCaption] = useState('');
  const [editAlt, setEditAlt] = useState('');
  const [editSeoTitle, setEditSeoTitle] = useState('');
  const [editSeoDescription, setEditSeoDescription] = useState('');

  const loadMine = async (nextPage = 1) => {
    const token = getAuthToken();
    if (!token) return;
    const res = await fetch(`${API_BASE_URL}/api/gallery/mine?page=${nextPage}&pageSize=24`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error(`Gagal load gallery (${res.status})`);
    const json = await res.json();
    const rows = Array.isArray(json?.items) ? json.items : [];
    setItems(rows.map((x: Record<string, unknown>) => ({
      id: Number(x.id ?? 0),
      name: String(x.name ?? '-'),
      fileUrl: toPublicAssetUrl(String(x.fileUrl ?? '')),
      description: String(x.description ?? ''),
      blurDataUrl: toPublicAssetUrl(String(x.blurDataUrl ?? '')),
      width: Number(x.width ?? 0),
      height: Number(x.height ?? 0),
      createdAt: String(x.createdAt ?? ''),
    })));
    setPage(Number(json?.page ?? nextPage));
    setTotalPages(Number(json?.totalPages ?? 1));
  };

  useEffect(() => {
    void loadMine(1);
  }, []);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  const doUpload = async () => {
    if (!files || files.length === 0) return;
    const token = getAuthToken();
    if (!token) {
      setError('Login terlebih dahulu.');
      return;
    }

    setBusy(true);
    setUploadProgress(0);
    setUploadingFileName('');
    setError('');
    try {
      const fileArray = Array.from(files);
      for (let i = 0; i < fileArray.length; i++) {
        const f = fileArray[i];
        setUploadingFileName(f.name);
        await new Promise<void>((resolve, reject) => {
          const form = new FormData();
          form.append('files', f);
          form.append('caption', caption);
          form.append('seoTitle', seoTitle);
          form.append('seoDescription', seoDescription);
          form.append('rotateDegrees', String(rotateDegrees));
          const xhr = new XMLHttpRequest();
          xhr.open('POST', `${API_BASE_URL}/api/gallery/upload`);
          xhr.setRequestHeader('Authorization', `Bearer ${token}`);
          xhr.upload.onprogress = (evt) => {
            if (!evt.lengthComputable) return;
            const base = (i / fileArray.length) * 100;
            const part = (evt.loaded / evt.total) * (100 / fileArray.length);
            setUploadProgress(Math.min(99, Math.round(base + part)));
          };
          xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) resolve();
            else reject(new Error(xhr.responseText || `Upload gagal (${xhr.status})`));
          };
          xhr.onerror = () => reject(new Error('Upload gagal'));
          xhr.send(form);
        });
      }
      setUploadProgress(100);
      await loadMine(1);
      setFiles(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload gagal');
    } finally {
      setBusy(false);
      setTimeout(() => setUploadProgress(0), 600);
      setUploadingFileName('');
    }
  };

  const doDelete = async (id: number) => {
    const token = getAuthToken();
    if (!token) return;
    setBusy(true);
    setError('');
    try {
      const res = await fetch(`${API_BASE_URL}/api/gallery/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`Hapus gagal (${res.status})`);
      await loadMine(page);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Hapus gagal');
    } finally {
      setBusy(false);
    }
  };

  const rotateItem = async (id: number, degrees: 90 | -90) => {
    const token = getAuthToken();
    if (!token) return;
    setBusy(true);
    setError('');
    try {
      const res = await fetch(`${API_BASE_URL}/api/gallery/${id}/rotate`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ degrees }),
      });
      if (!res.ok) throw new Error(`Rotasi gagal (${res.status})`);
      const json = await res.json();
      setItems((prev) =>
        prev.map((x) =>
          x.id === id
            ? {
                ...x,
                fileUrl: String(json?.fileUrl ?? x.fileUrl),
                width: Number(json?.width ?? x.width ?? 0),
                height: Number(json?.height ?? x.height ?? 0),
              }
            : x,
        ),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Rotasi gagal');
    } finally {
      setBusy(false);
    }
  };

  const openEdit = (x: GalleryItem) => {
    setEditId(x.id);
    setEditCaption(x.description ?? '');
    setEditAlt(x.description ?? '');
    setEditSeoTitle(x.name ?? '');
    setEditSeoDescription(x.description ?? '');
  };

  const doSaveEdit = async () => {
    if (!editId) return;
    const token = getAuthToken();
    if (!token) return;
    setBusy(true);
    setError('');
    try {
      const res = await fetch(`${API_BASE_URL}/api/gallery/${editId}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          caption: editCaption,
          altText: editAlt,
          seoTitle: editSeoTitle,
          seoDescription: editSeoDescription,
        }),
      });
      if (!res.ok) throw new Error(`Update gagal (${res.status})`);
      setEditId(null);
      await loadMine(page);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Update gagal');
    } finally {
      setBusy(false);
    }
  };

  const useAsHero = async (item: GalleryItem) => {
    const token = getAuthToken();
    if (!token) return;
    const sortInput = window.prompt('Sort order hero (angka kecil tampil dulu):', '1');
    const sortOrder = Number(sortInput ?? '1');
    if (Number.isNaN(sortOrder)) return;

    const heroNamePrompt = window.prompt('Judul Hero:', item.name || 'Hero Banner');
    const heroName = (heroNamePrompt ?? item.name ?? 'Hero Banner').trim() || 'Hero Banner';
    const ctaLabelPrompt = window.prompt('Teks Tombol CTA:', 'Lihat Paket');
    const ctaLabel = (ctaLabelPrompt ?? 'Lihat Paket').trim() || 'Lihat Paket';
    const ctaUrlPrompt = window.prompt('URL Tujuan CTA:', '/pack');
    const ctaUrl = (ctaUrlPrompt ?? '/pack').trim() || '/pack';

    setBusy(true);
    setError('');
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/content/hero-banners`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: heroName,
          code: `HERO-FROM-GAL-${item.id}-${Date.now()}`,
          description: item.description || '',
          imageUrl: item.fileUrl,
          actionLabel: ctaLabel,
          actionUrl: ctaUrl,
          locale: 'id',
          sortOrder,
          isActive: true,
        }),
      });
      if (!res.ok) throw new Error(`Gagal membuat hero (${res.status})`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menjadikan hero');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="p-4 space-y-4 animate-fade-up">
      <div className="bg-white border rounded-3xl p-5 space-y-2">
        <h1 className="text-lg font-extrabold g-text">Kelola Gallery</h1>
        <p className="text-xs text-zinc-500">Upload multiple image, auto-convert webp, caption + SEO metadata.</p>
      </div>

      <div className="bg-white border rounded-3xl p-5 space-y-3">
        <input type="file" accept="image/*" multiple onChange={(e) => setFiles(e.target.files)} className="w-full border rounded-xl px-3 py-2 text-xs" />
        <input value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="Caption" className="w-full border rounded-xl px-3 py-2 text-xs" />
        <input value={seoTitle} onChange={(e) => setSeoTitle(e.target.value)} placeholder="SEO Title" className="w-full border rounded-xl px-3 py-2 text-xs" />
        <textarea value={seoDescription} onChange={(e) => setSeoDescription(e.target.value)} placeholder="SEO Description" className="w-full border rounded-xl px-3 py-2 text-xs min-h-20" />
        <select value={rotateDegrees} onChange={(e) => setRotateDegrees(Number(e.target.value))} className="w-full border rounded-xl px-3 py-2 text-xs bg-white">
          <option value={0}>Rotasi: Normal</option>
          <option value={90}>Rotasi: 90°</option>
          <option value={180}>Rotasi: 180°</option>
          <option value={270}>Rotasi: 270°</option>
        </select>
        <button disabled={busy || !files || files.length === 0} onClick={() => void doUpload()} className="w-full rounded-xl bg-blue-600 py-2 text-xs font-semibold text-white disabled:opacity-60">
          {busy ? 'Uploading...' : 'Upload Gallery'}
        </button>
        {uploadProgress > 0 ? (
          <div className="space-y-1">
            <div className="h-2 w-full rounded-full bg-zinc-100 overflow-hidden">
              <div className="h-full bg-blue-600 transition-all" style={{ width: `${uploadProgress}%` }} />
            </div>
            <p className="text-[11px] text-zinc-500">{uploadingFileName ? `Uploading: ${uploadingFileName}` : 'Uploading...'} ({uploadProgress}%)</p>
          </div>
        ) : null}
        {error ? <p className="text-xs text-red-500">{error}</p> : null}
      </div>

      <div className="bg-white border rounded-3xl p-5 space-y-3">
        <div className="flex items-center justify-between text-xs">
          <span>Data Saya</span>
          <span>Hal {page}/{totalPages}</span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {items.map((x) => (
            <article key={x.id} className="rounded-2xl border overflow-hidden bg-white">
              <div className="h-32 w-full bg-cover bg-center" style={{ backgroundImage: x.blurDataUrl ? `url(${x.blurDataUrl})` : undefined }}>
                <img
                  src={x.fileUrl}
                  alt={x.description || x.name}
                  className="h-32 w-full object-cover"
                  loading="lazy"
                  onClick={() => setPreviewSrc(x.fileUrl)}
                  onError={(e) => {
                    const el = e.currentTarget;
                    if (el.src !== PLACEHOLDER_404) el.src = PLACEHOLDER_404;
                  }}
                />
              </div>
              <div className="p-2 text-[11px]">
                <div className="font-semibold line-clamp-1">{x.name}</div>
                <div className="text-zinc-500 line-clamp-2">{x.description}</div>
                <div className="mt-2 flex gap-2">
                  <button className="text-blue-600 font-semibold" onClick={() => openEdit(x)}>Edit</button>
                  <button className="text-emerald-600 font-semibold" onClick={() => void useAsHero(x)}>Use as Hero</button>
                  <button className="text-zinc-700 font-semibold" onClick={() => void rotateItem(x.id, -90)}>↺</button>
                  <button className="text-zinc-700 font-semibold" onClick={() => void rotateItem(x.id, 90)}>↻</button>
                  <button className="text-red-600 font-semibold" onClick={() => void doDelete(x.id)}>Delete</button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>

      <ModalShell open={Boolean(editId)} onBackdropClick={() => setEditId(null)}>
          <div className="w-full max-w-lg bg-white rounded-3xl p-5 space-y-2">
            <h3 className="text-sm font-bold">Edit Metadata Gallery</h3>
            <input value={editCaption} onChange={(e) => setEditCaption(e.target.value)} placeholder="Caption" className="w-full border rounded-xl px-3 py-2 text-xs" />
            <input value={editAlt} onChange={(e) => setEditAlt(e.target.value)} placeholder="Alt Text" className="w-full border rounded-xl px-3 py-2 text-xs" />
            <input value={editSeoTitle} onChange={(e) => setEditSeoTitle(e.target.value)} placeholder="SEO Title" className="w-full border rounded-xl px-3 py-2 text-xs" />
            <textarea value={editSeoDescription} onChange={(e) => setEditSeoDescription(e.target.value)} placeholder="SEO Description" className="w-full border rounded-xl px-3 py-2 text-xs min-h-20" />
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => setEditId(null)} className="border rounded-xl py-2 text-xs font-semibold">Batal</button>
              <button onClick={() => void doSaveEdit()} className="bg-blue-600 text-white rounded-xl py-2 text-xs font-semibold">Simpan</button>
            </div>
          </div>
      </ModalShell>

      <ModalShell open={Boolean(previewSrc && mounted)} onBackdropClick={() => setPreviewSrc('')}>
        <div className="bg-black/55 p-4 rounded-3xl">
          <div className="w-full max-w-[680px] rounded-3xl bg-white p-2 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => setPreviewSrc('')}
              className="absolute right-6 top-6 z-10 rounded-full bg-black/80 px-3 py-1 text-xs font-semibold text-white"
            >
              Close ✕
            </button>
            <img
              src={previewSrc}
              alt="Preview Gallery"
              className="w-full max-h-[78vh] rounded-2xl object-contain bg-zinc-50"
              onError={(e) => {
                const el = e.currentTarget;
                if (el.src !== PLACEHOLDER_404) el.src = PLACEHOLDER_404;
              }}
            />
          </div>
        </div>
      </ModalShell>
    </div>
  );
}
