'use client';

import { useEffect, useMemo, useState } from 'react';
import { Link } from '@/i18n/routing-patch';
import { apiGet } from '@/lib/api-client';
import { useToast } from '@/components/Toast';

type Category = { id: number; name: string; slug: string };
type Material = {
  id: number;
  title: string;
  slug: string;
  description?: string | null;
  category?: Category | null;
  publishDate: string;
  coverUrl?: string | null;
  resourceLabel?: string | null;
  labels?: string[];
  isPinned: boolean;
  viewCount: number;
  resourceOpenCount: number;
};

export default function MateriPage() {
  const { show } = useToast();
  const [rows, setRows] = useState<Material[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brokenImages, setBrokenImages] = useState<Record<number, true>>({});
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState({
    search: '',
    categoryId: '',
    label: '',
    fromDate: '',
    toDate: '',
    sortBy: 'publishDate',
    sortDir: 'desc',
  });

  const labels = useMemo(() => Array.from(new Set(rows.flatMap((x) => x.labels ?? []))), [rows]);

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

  const copyPlainText = async (html?: string | null) => {
    const el = document.createElement('div');
    el.innerHTML = sanitizeHtml(html);
    const text = (el.textContent || el.innerText || '').trim();
    if (!text) return;
    await navigator.clipboard.writeText(text);
    show('Deskripsi berhasil disalin');
  };

  const load = async (nextPage = page) => {
    setLoading(true);
    try {
      const q = new URLSearchParams();
      q.set('page', String(nextPage));
      q.set('pageSize', '12');
      Object.entries(filters).forEach(([k, v]) => {
        if (v) q.set(k, v);
      });
      const [m, c] = await Promise.all([
        apiGet<any>(`/api/LearningMaterials?${q.toString()}`),
        apiGet<any>('/api/LearningMaterials/categories'),
      ]);
      setRows(m?.data?.items ?? []);
      setPage(m?.data?.page ?? nextPage);
      setTotalPages(m?.data?.totalPages ?? 1);
      setCategories(Array.isArray(c?.data) ? c.data : []);
    } catch (e: any) {
      setMsg(e?.message || 'Gagal memuat materi');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load(1);
  }, []);

  return (
    <div className="p-4 space-y-4 animate-fade-up">
      <div className="bg-white border rounded-3xl p-5">
        <h1 className="text-lg font-extrabold">Materi</h1>
        <p className="text-xs text-zinc-500 mt-1">Pusat materi resmi untuk mendukung aktivitas belajar, promosi, dan follow up tim.</p>
      </div>

      {msg ? <div className="rounded-2xl border bg-amber-50 px-4 py-3 text-xs text-amber-700">{msg}</div> : null}

      <div className="bg-white border rounded-3xl p-4 space-y-3 text-xs">
        <div className="grid grid-cols-[1fr_auto_auto] gap-2">
          <input className="min-w-0 border rounded-xl px-3 py-2" placeholder="Cari materi" value={filters.search} onChange={(e) => setFilters((p) => ({ ...p, search: e.target.value }))} />
          <button className="rounded-xl border px-3 py-2 font-semibold" onClick={() => void load(1)}>Cari</button>
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
            <button className="rounded-xl border px-3 py-2 font-semibold md:col-span-2" onClick={() => void load(1)}>Terapkan Filter</button>
          </div>
        ) : null}
      </div>

      {loading ? <div className="text-xs text-zinc-500">Memuat materi...</div> : null}

      <div className="space-y-3">
        {rows.map((x) => (
          <Link key={x.id} href={`/materi/${x.slug}`} className="flex gap-3 bg-white border rounded-2xl p-3 hover:border-primary-300 transition-colors">
            {x.coverUrl && !brokenImages[x.id] ? (
              <div className="h-24 w-28 shrink-0 overflow-hidden rounded-xl bg-zinc-100 md:h-28 md:w-36">
                <img src={x.coverUrl} alt={x.title} className="h-full w-full object-cover" onError={() => setBrokenImages((p) => ({ ...p, [x.id]: true }))} />
              </div>
            ) : null}
            <div className="min-w-0 flex-1 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <h2 className="text-sm font-bold">{x.title}</h2>
                {x.isPinned ? <span className="rounded-full bg-zinc-900 px-2 py-1 text-[10px] text-white">Pinned</span> : null}
              </div>
              <div className="text-[11px] text-zinc-500">{x.category?.name || 'Tanpa kategori'} • {timeAgo(x.publishDate)}</div>
              {x.description ? (
                <div className="relative rounded-xl border bg-zinc-50 p-3 pr-10">
                  <button
                    type="button"
                    className="absolute right-2 top-2 h-7 w-7 rounded-lg border bg-white text-[11px] font-semibold text-zinc-600"
                    title="Copy deskripsi"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      void copyPlainText(x.description);
                    }}
                  >
                    ⧉
                  </button>
                  <div className="line-clamp-3 text-xs leading-relaxed text-zinc-600" dangerouslySetInnerHTML={{ __html: sanitizeHtml(x.description) }} />
                </div>
              ) : null}
              <div className="flex gap-1 flex-wrap">
                {(x.labels ?? []).map((label) => <span key={label} className="rounded-full bg-zinc-100 px-2 py-1 text-[10px]">{label}</span>)}
              </div>
              <div className="text-[10px] text-zinc-400">Dilihat {x.viewCount || 0}x • Link dibuka {x.resourceOpenCount || 0}x</div>
            </div>
          </Link>
        ))}
      </div>

      {rows.length === 0 && !loading ? <div className="rounded-2xl border bg-white p-4 text-xs text-zinc-500">Belum ada materi untuk role Anda.</div> : null}

      <div className="flex items-center justify-between text-xs">
        <button className="rounded-xl border px-3 py-2 disabled:opacity-40" disabled={page <= 1} onClick={() => void load(page - 1)}>Sebelumnya</button>
        <span>Halaman {page} / {totalPages}</span>
        <button className="rounded-xl border px-3 py-2 disabled:opacity-40" disabled={page >= totalPages} onClick={() => void load(page + 1)}>Berikutnya</button>
      </div>
    </div>
  );
}
