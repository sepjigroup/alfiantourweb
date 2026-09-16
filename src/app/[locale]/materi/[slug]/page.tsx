'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Link } from '@/i18n/routing-patch';
import { apiGet, apiPost } from '@/lib/api-client';
import { useToast } from '@/components/Toast';

export default function MateriDetailPage() {
  const { show } = useToast();
  const params = useParams() as { slug?: string };
  const slug = String(params?.slug || '');
  const [row, setRow] = useState<any>(null);
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [openingResource, setOpeningResource] = useState(false);
  const [coverError, setCoverError] = useState(false);

  const timeAgo = (raw?: string | null) => {
    const date = raw ? new Date(raw) : null;
    if (!date || Number.isNaN(date.getTime())) return '-';
    const diffSeconds = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000));
    if (diffSeconds < 60) return 'baru saja';
    const minutes = Math.floor(diffSeconds / 60);
    if (minutes < 60) return `${minutes} menit lalu`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} jam lalu`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days} hari lalu`;
    const months = Math.floor(days / 30);
    if (months < 12) return `${months} bulan lalu`;
    return `${Math.floor(months / 12)} tahun lalu`;
  };

  const sanitizeHtml = (raw?: string | null) => String(raw || '')
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
    .replace(/\son\w+="[^"]*"/gi, '')
    .replace(/\son\w+='[^']*'/gi, '')
    .replace(/javascript:/gi, '');

  const copyPlainText = async (html?: string | null, label = 'Konten') => {
    const el = document.createElement('div');
    el.innerHTML = sanitizeHtml(html);
    const text = (el.textContent || el.innerText || '').trim();
    if (!text) return;
    await navigator.clipboard.writeText(text);
    show(`${label} berhasil disalin`);
  };

  const load = async () => {
    if (!slug) return;
    setLoading(true);
    try {
      const res = await apiGet<any>(`/api/LearningMaterials/${encodeURIComponent(slug)}`);
      setRow(res?.data ?? null);
      setCoverError(false);
    } catch (e: any) {
      setMsg(e?.message || 'Materi tidak tersedia untuk akun Anda');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [slug]);

  const openResource = async () => {
    setOpeningResource(true);
    try {
      const res = await apiPost<any>(`/api/LearningMaterials/${encodeURIComponent(slug)}/open-resource`);
      const url = res?.data?.resourceUrl;
      if (!url) throw new Error('Link materi kosong');
      window.open(url, '_blank', 'noopener,noreferrer');
      await load();
    } catch (e: any) {
      setMsg(e?.message || 'Gagal membuka link materi');
    } finally {
      setOpeningResource(false);
    }
  };

  const shareToWhatsApp = () => {
    if (!row) return;
    const url = typeof window !== 'undefined' ? window.location.href : '';
    const text = `${row.title}\n\n${row.description ? `${String(row.description).replace(/<[^>]*>/g, '').trim()}\n\n` : ''}${url}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="p-4 space-y-4 animate-fade-up">
      <Link href="/materi" className="inline-flex text-sm text-primary-600">← Kembali ke Materi</Link>

      {loading ? <div className="text-xs text-zinc-500">Memuat materi...</div> : null}
      {msg ? <div className="rounded-2xl border bg-amber-50 px-4 py-3 text-xs text-amber-700">{msg}</div> : null}

      {row ? (
        <article className="bg-white border rounded-3xl overflow-hidden">
          {row.coverUrl && !coverError ? (
            <div className="aspect-[16/9] bg-zinc-100">
              <img src={row.coverUrl} alt={row.title} className="h-full w-full object-cover" onError={() => setCoverError(true)} />
            </div>
          ) : null}
          <div className="p-5 space-y-4">
            <div className="space-y-2">
              <div className="text-[11px] text-zinc-500">{row.category?.name || 'Tanpa kategori'} • {timeAgo(row.publishDate)}</div>
              <h1 className="text-xl font-extrabold">{row.title}</h1>
              <div className="flex flex-wrap gap-1">
                {(row.labels ?? []).map((label: string) => <span key={label} className="rounded-full bg-zinc-100 px-2 py-1 text-[10px]">{label}</span>)}
              </div>
            </div>

            {row.description ? (
              <div className="relative rounded-2xl border bg-white p-4 pr-12">
                <button
                  type="button"
                  className="absolute right-3 top-3 h-8 w-8 rounded-lg border bg-white text-xs font-semibold text-zinc-600"
                  title="Copy deskripsi"
                  onClick={() => void copyPlainText(row.description, 'Deskripsi')}
                >
                  ⧉
                </button>
                <div className="text-sm leading-7 text-zinc-700" dangerouslySetInnerHTML={{ __html: sanitizeHtml(row.description) }} />
              </div>
            ) : null}
            {row.contentBody ? (
              <div className="relative rounded-2xl border bg-zinc-50 p-4 pr-12">
                <button
                  type="button"
                  className="absolute right-3 top-3 h-8 w-8 rounded-lg border bg-white text-xs font-semibold text-zinc-600"
                  title="Copy isi materi"
                  onClick={() => void copyPlainText(row.contentBody, 'Isi materi')}
                >
                  ⧉
                </button>
                <div className="text-sm leading-7 text-zinc-700" dangerouslySetInnerHTML={{ __html: sanitizeHtml(row.contentBody) }} />
              </div>
            ) : null}

            <div className="text-[11px] text-zinc-400">Dilihat {row.viewCount || 0}x • Link dibuka {row.resourceOpenCount || 0}x</div>

            {row.hasResource ? (
              <div className="grid grid-cols-[1fr_auto] gap-2">
                <button className="inline-flex min-w-0 items-center justify-center gap-2 rounded-2xl bg-zinc-900 px-4 py-3 text-sm font-bold text-white disabled:opacity-60" disabled={openingResource} onClick={() => void openResource()}>
                  {openingResource ? <span className="h-4 w-4 rounded-full border-2 border-white/50 border-t-white animate-spin" /> : null}
                  <span className="truncate">{openingResource ? 'Membuka...' : row.resourceLabel || 'Buka Materi'}</span>
                </button>
                <button
                  type="button"
                  className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border bg-white text-lg font-bold text-emerald-700"
                  title="Share ke WhatsApp"
                  aria-label="Share ke WhatsApp"
                  onClick={shareToWhatsApp}
                >
                  ↗
                </button>
              </div>
            ) : (
              <div className="rounded-2xl border bg-zinc-50 p-4 text-xs text-zinc-500">Link materi belum tersedia.</div>
            )}
          </div>
        </article>
      ) : null}
    </div>
  );
}
