'use client';

import { Suspense, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Link } from '@/i18n/routing-patch';

function inferTypeFromUrl(url: string): 'image' | 'video' | 'document' {
  const lower = url.toLowerCase();
  if (/\.(png|jpg|jpeg|webp|gif|svg)(\?|$)/.test(lower)) return 'image';
  if (/\.(mp4|mov|webm|mkv)(\?|$)/.test(lower)) return 'video';
  return 'document';
}

function MediaAssetPreviewContent() {
  const searchParams = useSearchParams();
  const src = (searchParams.get('src') ?? '').trim();
  const typeParam = (searchParams.get('type') ?? '').trim().toLowerCase();
  const [failed, setFailed] = useState(false);

  const type = useMemo(() => {
    if (typeParam === 'image' || typeParam === 'video' || typeParam === 'document') return typeParam;
    return inferTypeFromUrl(src);
  }, [src, typeParam]);

  return (
    <div className="p-4 space-y-4 animate-fade-up">
      <div className="bg-white border rounded-3xl p-5 space-y-2">
        <div className="flex items-center justify-between text-xs">
          <Link href="/akun/master/media-assets" className="text-blue-600 underline underline-offset-2">← Kembali ke Media Assets</Link>
          <Link href="/akun/kelola-media-assets" className="text-blue-600 underline underline-offset-2">Media Center →</Link>
        </div>
        <h1 className="text-lg font-extrabold g-text">Preview Asset Media</h1>
        <p className="text-xs text-zinc-500">Halaman client untuk membuka asset media dengan fallback rapi jika file tidak ditemukan.</p>
      </div>

      <div className="bg-white border rounded-3xl p-5 space-y-3">
        {!src ? (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-700">URL asset kosong. Buka dari tombol "Buka" di halaman media assets.</div>
        ) : failed ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-xs text-red-700 space-y-1">
            <div className="font-semibold">Asset tidak ditemukan (404) atau gagal dimuat.</div>
            <div className="break-all">{src}</div>
          </div>
        ) : (
          <div className="space-y-2">
            {type === 'image' ? (
              <img src={src} alt="Preview Media" onError={() => setFailed(true)} className="w-full max-h-[70vh] rounded-2xl border object-contain bg-zinc-50" />
            ) : null}
            {type === 'video' ? (
              <video src={src} controls onError={() => setFailed(true)} className="w-full max-h-[70vh] rounded-2xl border bg-black" />
            ) : null}
            {type === 'document' ? (
              <iframe title="Preview Dokumen" src={src} onError={() => setFailed(true)} className="w-full h-[70vh] rounded-2xl border bg-white" />
            ) : null}
          </div>
        )}

        {src ? (
          <div className="text-[11px] text-zinc-500 break-all">
            URL: {src}
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default function MediaAssetPreviewPage() {
  return (
    <Suspense fallback={<div className="p-4 text-xs text-zinc-500">Menyiapkan preview media...</div>}>
      <MediaAssetPreviewContent />
    </Suspense>
  );
}
