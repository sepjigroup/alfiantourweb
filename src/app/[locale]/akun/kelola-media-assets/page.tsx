'use client';

import { useEffect, useMemo, useState } from 'react';
import { Link } from '@/i18n/routing-patch';
import { apiGet, apiPost, getApiBaseUrl, getAuthToken } from '@/lib/api-client';
import { useToast } from '@/components/Toast';
import { Skeleton } from '@/components/Skeleton';

type MediaItem = {
  id: number;
  name: string;
  mediaType?: string | null;
  fileUrl?: string | null;
  thumbnailUrl?: string | null;
  mimeType?: string | null;
  altText?: string | null;
  fileSizeBytes?: number | null;
};

function toApiAssetUrl(rawUrl: string): string {
  const value = rawUrl.trim();
  if (!value) return '';
  if (/^https?:\/\//i.test(value)) return value;
  const base = getApiBaseUrl().replace(/\/+$/, '');
  const path = value.startsWith('/') ? value : `/${value}`;
  return `${base}${path}`;
}

export default function KelolaMediaAssetsPage() {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [mediaType, setMediaType] = useState<'all' | 'image' | 'video' | 'document' | 'audio'>('all');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const { show } = useToast();

  const fetchList = async () => {
    setBusy(true);
    setError('');
    try {
      const q = mediaType === 'all' ? '' : `&mediaType=${mediaType}`;
      const res = await apiGet<{ data?: { items?: MediaItem[] } | MediaItem[] }>(`/api/v1/master/MediaAssets?page=1&pageSize=200${q}`);
      const payload = Array.isArray(res.data) ? res.data : res.data?.items ?? [];
      setItems(payload);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Gagal memuat media assets');
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    fetchList();
  }, [mediaType]);

  const title = useMemo(() => (mediaType === 'all' ? 'Semua Tipe' : mediaType.toUpperCase()), [mediaType]);

  const inferMediaTypeFromFile = (file: File): 'image' | 'video' | 'document' | 'audio' => {
    if (file.type.startsWith('image/')) return 'image';
    if (file.type.startsWith('video/')) return 'video';
    if (file.type.startsWith('audio/')) return 'audio';
    return 'document';
  };

  const uploadOne = async (file: File) => {
    const token = getAuthToken();
    const inferredType = inferMediaTypeFromFile(file);
    const formData = new FormData();
    formData.append('file', file);
    const uploadResult = await new Promise<{
      fileUrl?: string;
      thumbnailUrl?: string | null;
      mimeType?: string;
      fileSizeBytes?: number;
      mediaType?: string;
      fileName?: string;
    }>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', `${getApiBaseUrl()}/api/v1/master/MediaAssets/upload?mediaType=${encodeURIComponent(inferredType)}`);
      if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      xhr.upload.onprogress = (evt) => {
        if (!evt.lengthComputable) return;
        setUploadProgress(Math.round((evt.loaded / evt.total) * 100));
      };
      xhr.onerror = () => reject(new Error('Upload gagal'));
      xhr.onload = () => {
        if (xhr.status < 200 || xhr.status >= 300) {
          reject(new Error(`Upload gagal (${xhr.status})`));
          return;
        }
        try {
          resolve(JSON.parse(xhr.responseText));
        } catch {
          reject(new Error('Response upload tidak valid'));
        }
      };
      xhr.send(formData);
    });

    await apiPost('/api/v1/master/MediaAssets', {
      name: file.name.replace(/\.[^/.]+$/, ''),
      code: null,
      description: `Uploaded via Media Center: ${file.name}`,
      sortOrder: 0,
      mediaType: uploadResult.mediaType ?? inferredType,
      fileUrl: uploadResult.fileUrl ?? null,
      thumbnailUrl: uploadResult.thumbnailUrl ?? null,
      mimeType: uploadResult.mimeType ?? file.type ?? null,
      fileSizeBytes: uploadResult.fileSizeBytes ?? file.size ?? null,
      width: null,
      height: null,
      durationSeconds: null,
      altText: file.name,
      storageProvider: 'LocalStorage',
      externalId: null,
    });
  };

  const handleFilesUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    setUploadProgress(0);
    setError('');
    try {
      for (const f of Array.from(files)) {
        await uploadOne(f);
      }
      show('Upload media berhasil');
      await fetchList();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Upload gagal');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  return (
    <div className="p-4 space-y-4 animate-fade-up">
      <div className="bg-white border rounded-3xl p-5 space-y-2">
        <div className="flex items-center justify-between text-xs">
          <Link href="/akun/master/media-assets" className="text-blue-600 underline underline-offset-2">← Master Media Assets</Link>
          <Link href="/akun" className="text-blue-600 underline underline-offset-2">Akun →</Link>
        </div>
        <h1 className="text-lg font-extrabold g-text">Media Center</h1>
        <p className="text-xs text-zinc-500">Pusat aset media untuk semua kebutuhan konten: gallery, feeds, hero banner, video, dan dokumen promosi.</p>
      </div>

      <div className="bg-white border rounded-3xl p-5 space-y-3">
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            void handleFilesUpload(e.dataTransfer.files);
          }}
          className="rounded-2xl border-2 border-dashed border-blue-300 bg-blue-50/40 p-4 text-center"
        >
          <div className="text-xs font-semibold text-zinc-800">Drag & Drop file media ke sini</div>
          <div className="text-[11px] text-zinc-500 mt-1">Atau pilih file manual untuk upload otomatis ke Media Assets</div>
          <label className="inline-flex mt-3 cursor-pointer rounded-xl border bg-white px-3 py-1.5 text-xs font-semibold">
            Pilih File
            <input type="file" multiple className="hidden" onChange={(e) => void handleFilesUpload(e.target.files)} />
          </label>
          {uploading ? (
            <div className="mt-3 space-y-1">
              <div className="h-2 rounded bg-zinc-200 overflow-hidden">
                <div className="h-full bg-blue-600 transition-all" style={{ width: `${uploadProgress}%` }} />
              </div>
              <div className="text-[11px] text-zinc-600">Uploading... {uploadProgress}%</div>
            </div>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-2">
          {(['all', 'image', 'video', 'document', 'audio'] as const).map((t) => (
            <button key={t} onClick={() => setMediaType(t)} className={`rounded-xl px-3 py-1.5 text-xs border ${mediaType === t ? 'bg-blue-600 text-white border-blue-600' : 'bg-white'}`}>
              {t === 'all' ? 'Semua' : t}
            </button>
          ))}
          <button onClick={fetchList} className="rounded-xl px-3 py-1.5 text-xs border">Refresh</button>
        </div>
        <div className="text-xs text-zinc-500">Filter aktif: {title}</div>
      </div>

      <div className="bg-white border rounded-3xl p-5 space-y-3">
        {busy ? (
          <div className="space-y-2">
            <div className="border rounded-2xl p-3 space-y-2">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-24 w-full rounded-xl" />
            </div>
            <div className="flex items-center gap-2 text-xs text-zinc-500">
              <span className="h-4 w-4 rounded-full border-2 border-zinc-300 border-t-primary-600 animate-spin" />
              Memuat data...
            </div>
          </div>
        ) : null}
        {error ? <div className="text-xs text-red-500">{error}</div> : null}
        {!busy && !error && items.length === 0 ? <div className="text-xs text-zinc-500">Belum ada media.</div> : null}
        <div className="grid gap-3 md:grid-cols-2">
          {items.map((item) => {
            const fileUrl = toApiAssetUrl(String(item.fileUrl ?? ''));
            const thumb = toApiAssetUrl(String(item.thumbnailUrl ?? item.fileUrl ?? ''));
            const type = String(item.mediaType ?? '').toLowerCase();
            return (
              <div key={item.id} className="border rounded-2xl p-3 space-y-2">
                {type === 'image' && thumb ? <img src={thumb} alt={item.altText ?? item.name} className="h-36 w-full rounded-xl object-cover border" /> : null}
                {type === 'video' && fileUrl ? <video src={fileUrl} controls className="h-36 w-full rounded-xl border bg-black" /> : null}
                <div className="text-sm font-semibold">{item.name}</div>
                <div className="text-[11px] text-zinc-600">Type: {item.mediaType ?? '-'}</div>
                <div className="text-[11px] text-zinc-600 break-all">URL: {fileUrl || '-'}</div>
                <div className="flex gap-2">
                  <button
                    onClick={async () => {
                      if (!fileUrl) return show('URL file kosong');
                      await navigator.clipboard.writeText(fileUrl);
                      show('URL media berhasil dicopy');
                    }}
                    className="text-xs border rounded-lg px-2 py-1"
                  >
                    Copy URL
                  </button>
                  <Link
                    href={fileUrl ? `/akun/media-assets-preview?src=${encodeURIComponent(fileUrl)}&type=${encodeURIComponent(type || 'document')}` : '#'}
                    className="text-xs border rounded-lg px-2 py-1"
                  >
                    Buka
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
