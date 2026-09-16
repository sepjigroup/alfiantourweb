'use client';

import { useEffect, useState } from 'react';
import { bulkCreateFeeds, createFeed, deleteFeed, fetchAdminFeeds, updateFeed, type FeedPostItem } from '@/lib/feeds-api';
import { getApiBaseUrl, getAuthToken } from '@/lib/api-client';
import { useToast } from '@/components/Toast';
import { SimpleWysiwyg } from '@/components/ui/SimpleWysiwyg';
import { ModalShell } from '@/components/ui/ModalShell';
import { Skeleton } from '@/components/Skeleton';
import { useLocale } from 'next-intl';

type FeedForm = {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  coverImageUrl: string;
  authorName: string;
  publishedAt: string;
  isActive: boolean;
  tags: string;
};

const blankForm = (): FeedForm => ({
  title: '',
  slug: '',
  excerpt: '',
  content: '',
  coverImageUrl: '',
  authorName: 'Admin',
  publishedAt: '',
  isActive: true,
  tags: '',
});

const bulkFeedSample = `[
  {
    "title": "Tips Umrah Lansia: Persiapan Fisik dan Mental",
    "slug": "tips-umrah-lansia-persiapan-fisik-dan-mental",
    "excerpt": "Panduan ringkas agar jamaah lansia lebih siap sebelum berangkat umrah.",
    "content": "<p><strong>Persiapan Umrah untuk Lansia</strong> dimulai dari pemeriksaan kesehatan, latihan jalan ringan, dan manajemen obat rutin.</p><p>Pastikan dokumen lengkap, konsultasi dengan pembimbing, serta pilih paket dengan jadwal yang lebih nyaman.</p>",
    "coverImageUrl": "https://images.unsplash.com/photo-1469041797191-50ace28483c3?auto=format&fit=crop&w=1200&q=80",
    "authorName": "Tim Alfian Tour",
    "publishedAt": "2026-05-25T08:00:00Z",
    "isActive": true,
    "tags": "umrah,lansia,tips,persiapan"
  },
  {
    "title": "Checklist Dokumen Umrah 2026",
    "slug": "checklist-dokumen-umrah-2026",
    "excerpt": "Daftar dokumen penting yang wajib disiapkan sebelum keberangkatan.",
    "content": "<p>Dokumen utama: paspor aktif, KTP, KK, foto terbaru, dan dokumen pendukung sesuai ketentuan terbaru.</p><p>Simpan salinan digital agar mudah diakses kapan pun.</p>",
    "coverImageUrl": "",
    "authorName": "Admin",
    "publishedAt": "2026-05-24T09:30:00Z",
    "isActive": true,
    "tags": "umrah,dokumen,checklist"
  }
]`;

export default function KelolaFeedsPage() {
  const locale = useLocale();
  const { show } = useToast();
  const [rows, setRows] = useState<FeedPostItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<FeedForm>(blankForm());
  const [bulkJson, setBulkJson] = useState(bulkFeedSample);
  const [formTab, setFormTab] = useState<'main' | 'optional' | 'json' | 'bulk'>('main');
  const [formJson, setFormJson] = useState('');
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [bulkTab, setBulkTab] = useState<'required' | 'optional'>('required');
  const [coverUploading, setCoverUploading] = useState(false);
  const [coverUploadProgress, setCoverUploadProgress] = useState(0);
  const [slugTouched, setSlugTouched] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const json = await fetchAdminFeeds(1, 100, search);
      setRows(json.items ?? []);
    } catch (e) {
      show(e instanceof Error ? e.message : 'Gagal load feed');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, [search]);

  const submit = async () => {
    if (!form.title.trim() || !form.content.trim()) {
      show('Title dan content wajib diisi');
      return;
    }
    const base = toSlug(form.title || '');
    if (!base) {
      show('Judul tidak valid untuk generate slug');
      return;
    }
    let finalSlug = toSlug(form.slug || '');
    if (!finalSlug) {
      const suffix = Math.floor(1000 + Math.random() * 9000);
      finalSlug = `${base}-${suffix}`;
      let guard = 0;
      while (findDuplicateSlug(finalSlug) && guard < 30) {
        const n = Math.floor(1000 + Math.random() * 9000);
        finalSlug = `${base}-${n}`;
        guard += 1;
      }
    }
    if (findDuplicateSlug(finalSlug)) {
      show('Slug sudah terdaftar. Gunakan slug lain atau generate ulang.');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        title: form.title.trim(),
        slug: finalSlug,
        excerpt: form.excerpt.trim() || null,
        content: form.content.trim(),
        coverImageUrl: form.coverImageUrl.trim() || null,
        authorName: form.authorName.trim() || 'Admin',
        publishedAt: form.publishedAt ? new Date(form.publishedAt).toISOString() : null,
        isActive: form.isActive,
        tags: form.tags.trim() || null,
      };
      if (editingId) await updateFeed(editingId, payload);
      else await createFeed(payload);
      show(editingId ? 'Feed diperbarui' : 'Feed dibuat');
      setForm(blankForm());
      setEditingId(null);
      setFormModalOpen(false);
      await load();
    } catch (e) {
      show(e instanceof Error ? e.message : 'Gagal simpan feed');
    } finally {
      setSaving(false);
    }
  };

  const buildFormJson = () => JSON.stringify({
    title: form.title.trim(),
    slug: form.slug.trim() || null,
    excerpt: form.excerpt.trim() || null,
    content: form.content.trim(),
    coverImageUrl: form.coverImageUrl.trim() || null,
    authorName: form.authorName.trim() || 'Admin',
    publishedAt: form.publishedAt ? new Date(form.publishedAt).toISOString() : null,
    isActive: form.isActive,
    tags: form.tags.trim() || null,
  }, null, 2);

  const applyJsonToForm = () => {
    try {
      const parsed = JSON.parse(formJson) as Record<string, unknown>;
      setForm((v) => ({
        ...v,
        title: String(parsed.title ?? ''),
        slug: String(parsed.slug ?? ''),
        excerpt: String(parsed.excerpt ?? ''),
        content: String(parsed.content ?? ''),
        coverImageUrl: String(parsed.coverImageUrl ?? ''),
        authorName: String(parsed.authorName ?? 'Admin'),
        publishedAt: parsed.publishedAt ? new Date(String(parsed.publishedAt)).toISOString().slice(0, 16) : '',
        isActive: typeof parsed.isActive === 'boolean' ? parsed.isActive : true,
        tags: String(parsed.tags ?? ''),
      }));
      show('JSON diterapkan ke form');
    } catch {
      show('JSON tidak valid');
    }
  };

  const copyBulkFormat = async () => {
    try {
      await navigator.clipboard.writeText(bulkFeedSample);
      show('Format JSON berhasil dicopy');
    } catch {
      show('Gagal copy format JSON');
    }
  };

  const pasteCoverUrl = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setForm((v) => ({ ...v, coverImageUrl: text.trim() }));
    } catch {
      show('Clipboard tidak bisa diakses');
    }
  };

  const pasteContent = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setForm((v) => ({ ...v, content: text }));
    } catch {
      show('Clipboard tidak bisa diakses');
    }
  };

  const toSlug = (raw: string) =>
    raw
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');

  const findDuplicateSlug = (candidate: string) => {
    const key = toSlug(candidate);
    if (!key) return false;
    return rows.some((r) => {
      const rowSlug = toSlug(String(r.slug ?? ''));
      if (!rowSlug) return false;
      if (editingId && Number(r.id) === Number(editingId)) return false;
      return rowSlug === key;
    });
  };
  const slugCandidate = toSlug(form.slug || '');
  const slugIsDuplicate = slugCandidate ? findDuplicateSlug(slugCandidate) : false;

  const generateSlugFromTitle = () => {
    const base = toSlug(form.title || '');
    if (!base) {
      show('Judul wajib diisi dulu');
      return;
    }
    const suffix = Math.floor(1000 + Math.random() * 9000);
    let candidate = `${base}-${suffix}`;
    let guard = 0;
    while (findDuplicateSlug(candidate) && guard < 20) {
      const n = Math.floor(1000 + Math.random() * 9000);
      candidate = `${base}-${n}`;
      guard += 1;
    }
    setForm((v) => ({ ...v, slug: candidate }));
  };

  const uploadCoverImage = async (file: File) => {
    setCoverUploading(true);
    setCoverUploadProgress(0);
    try {
      const token = getAuthToken();
      const formData = new FormData();
      formData.append('file', file);
      const result = await new Promise<{ fileUrl?: string }>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', `${getApiBaseUrl()}/api/v1/master/mediaassets/upload?mediaType=image`);
        if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);
        xhr.upload.onprogress = (event) => {
          if (!event.lengthComputable) return;
          setCoverUploadProgress(Math.min(100, Math.round((event.loaded / event.total) * 100)));
        };
        xhr.onerror = () => reject(new Error('Upload cover gagal'));
        xhr.onload = () => {
          if (xhr.status < 200 || xhr.status >= 300) {
            reject(new Error(`Upload gagal (${xhr.status})`));
            return;
          }
          try {
            resolve(JSON.parse(xhr.responseText) as { fileUrl?: string });
          } catch {
            reject(new Error('Response upload tidak valid'));
          }
        };
        xhr.send(formData);
      });
      const nextUrl = String(result.fileUrl ?? '').trim();
      if (!nextUrl) throw new Error('URL cover dari server kosong');
      const absoluteUrl = nextUrl.startsWith('http://') || nextUrl.startsWith('https://')
        ? nextUrl
        : `${getApiBaseUrl().replace(/\/+$/, '')}${nextUrl.startsWith('/') ? '' : '/'}${nextUrl}`;
      setForm((v) => ({ ...v, coverImageUrl: absoluteUrl }));
      show('Upload cover berhasil');
    } catch (e) {
      show(e instanceof Error ? e.message : 'Upload cover gagal');
    } finally {
      setCoverUploading(false);
    }
  };

  const runBulk = async () => {
    let parsed: unknown;
    try {
      parsed = JSON.parse(bulkJson);
    } catch {
      show('JSON bulk tidak valid');
      return;
    }
    if (!Array.isArray(parsed)) {
      show('Format bulk harus array JSON');
      return;
    }
    setSaving(true);
    try {
      await bulkCreateFeeds(parsed as Array<Record<string, unknown>>);
      show('Bulk feed berhasil disimpan');
      setBulkJson('');
      await load();
    } catch (e) {
      show(e instanceof Error ? e.message : 'Gagal bulk feed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-4 space-y-4 animate-fade-up">
      <div className="bg-white border rounded-2xl p-4 space-y-2">
        <h1 className="text-sm font-bold">Kelola Feeds</h1>
        <p className="text-xs text-zinc-500">Bisa posting manual atau bulk JSON hasil generate AI.</p>
      </div>

      <div className="bg-white border rounded-2xl p-4 space-y-2">
        <h2 className="text-sm font-bold">Daftar Feed</h2>
        <div className="flex items-center gap-2">
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cari judul / slug..." className="w-full border rounded-xl px-3 py-2 text-xs" />
          <button
            type="button"
            onClick={() => {
              setEditingId(null);
              setForm(blankForm());
              setFormJson('');
              setSlugTouched(false);
              setFormTab('main');
              setFormModalOpen(true);
            }}
            className="rounded-xl bg-primary-600 text-white px-3 py-2 text-xs font-semibold whitespace-nowrap"
          >
            + Add Feed
          </button>
        </div>
        {loading ? (
          <div className="space-y-2">
            <div className="border rounded-xl p-3 space-y-2">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-8 w-full rounded-lg" />
            </div>
            <div className="flex items-center gap-2 text-xs text-zinc-500">
              <span className="h-4 w-4 rounded-full border-2 border-zinc-300 border-t-primary-600 animate-spin" />
              Memuat feed...
            </div>
          </div>
        ) : null}
        {!loading && rows.length === 0 ? <div className="text-xs text-zinc-500">Belum ada feed.</div> : null}
        <div className="space-y-2">
          {rows.map((x) => (
            <div key={x.id} className="border rounded-xl p-3 text-xs">
              <div className="font-semibold">{x.title}</div>
              <div className="text-zinc-500 mt-1">
                <a
                  href={`/${locale}/feeds/${encodeURIComponent(x.slug || String(x.id))}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-blue-600 underline underline-offset-2"
                >
                  /{x.slug || x.id}
                </a>
                {' '}• {x.publishedAt ? new Date(x.publishedAt).toLocaleString('id-ID') : '-'}
              </div>
              <div className="flex gap-2 mt-2">
                <button type="button" onClick={() => {
                  setEditingId(Number(x.id));
                  setForm({
                    title: x.title || '',
                    slug: x.slug || '',
                    excerpt: x.excerpt || '',
                    content: x.content || '',
                    coverImageUrl: x.coverImageUrl || '',
                    authorName: x.authorName || 'Admin',
                    publishedAt: x.publishedAt ? new Date(x.publishedAt).toISOString().slice(0, 16) : '',
                    isActive: x.isActive ?? true,
                    tags: x.tags || '',
                  });
                  setFormJson('');
                  setSlugTouched(false);
                  setFormModalOpen(true);
                }} className="border rounded-lg px-2 py-1">Edit</button>
                <button type="button" onClick={() => setDeleteId(Number(x.id))} className="border border-red-300 text-red-700 rounded-lg px-2 py-1">Hapus</button>
              </div>
            </div>
          ))}
        </div>
      </div>
      <ModalShell open={deleteId !== null} onBackdropClick={() => setDeleteId(null)} zIndexClass="z-[1300]" overlayClassName="bg-black/30">
        <div className="bg-white w-full max-w-md rounded-2xl p-4 space-y-3">
          <div className="text-sm font-bold">Konfirmasi</div>
          <div className="text-xs text-zinc-700">Hapus feed ini?</div>
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
                  await deleteFeed(id);
                  show('Feed dihapus');
                  await load();
                } catch (e) {
                  show(e instanceof Error ? e.message : 'Gagal hapus feed');
                }
              }}
            >
              Ya
            </button>
          </div>
        </div>
      </ModalShell>

      <ModalShell open={formModalOpen} onBackdropClick={() => setFormModalOpen(false)} zIndexClass="z-[1300]" overlayClassName="bg-black/35">
        <div className="bg-white w-full max-w-3xl rounded-2xl max-h-[86vh] overflow-hidden">
          <div className="sticky top-0 z-20 bg-white border-b px-4 py-3">
            <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold">{editingId ? 'Edit Feed' : 'Add Feed'}</h3>
            <button type="button" className="text-zinc-500" onClick={() => setFormModalOpen(false)}>✕</button>
          </div>
            <div className="flex items-center gap-2 mt-2">
            <button type="button" onClick={() => setFormTab('main')} className={`h-8 px-3 rounded-lg text-[11px] font-semibold ${formTab === 'main' ? 'bg-zinc-900 text-white' : 'border'}`}>Main</button>
            <button type="button" onClick={() => setFormTab('optional')} className={`h-8 px-3 rounded-lg text-[11px] font-semibold ${formTab === 'optional' ? 'bg-zinc-900 text-white' : 'border'}`}>Optional</button>
            <button
              type="button"
              onClick={() => {
                setFormJson(buildFormJson());
                setFormTab('json');
              }}
              className={`h-8 px-3 rounded-lg text-[11px] font-semibold ${formTab === 'json' ? 'bg-zinc-900 text-white' : 'border'}`}
            >
              JSON
            </button>
            <button type="button" onClick={() => setFormTab('bulk')} className={`h-8 px-3 rounded-lg text-[11px] font-semibold ${formTab === 'bulk' ? 'bg-zinc-900 text-white' : 'border'}`}>
              Bulk
            </button>
            </div>
          </div>
          <div className="px-4 py-3 overflow-y-auto max-h-[calc(86vh-130px)]">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            <input value={form.title} onChange={(e) => setForm((v) => ({ ...v, title: e.target.value }))} placeholder="Judul (full satu baris)" className={`border rounded-xl px-3 py-2 sm:col-span-2 ${formTab === 'main' ? '' : 'hidden'}`} />
            <div className={`sm:col-span-2 ${formTab === 'main' ? '' : 'hidden'}`}>
              <div className="mb-1 flex items-center justify-between">
                <div className="text-[11px] text-zinc-500">Konten Feed (WYSIWYG)</div>
                <button type="button" title="Paste konten" onClick={() => void pasteContent()} className="h-7 w-7 rounded-lg border inline-flex items-center justify-center text-xs">📋</button>
              </div>
              <SimpleWysiwyg value={form.content} onChange={(html) => setForm((v) => ({ ...v, content: html }))} />
            </div>
            <div className={`sm:col-span-2 flex items-center gap-2 ${formTab === 'main' ? '' : 'hidden'}`}>
              <input
                value={form.slug}
                onChange={(e) => {
                  setSlugTouched(true);
                  setForm((v) => ({ ...v, slug: e.target.value }));
                }}
                placeholder="Slug (opsional)"
                className={`border rounded-xl px-3 py-2 flex-1 ${slugTouched && slugIsDuplicate ? 'border-red-400' : ''}`}
              />
              <button type="button" onClick={generateSlugFromTitle} className="h-9 px-3 rounded-xl border text-[11px] font-semibold whitespace-nowrap">Generate</button>
            </div>
            <div className={`sm:col-span-2 text-[11px] ${formTab === 'main' ? '' : 'hidden'}`}>
              {slugTouched && slugIsDuplicate ? (
                <span className="text-red-600">Slug sudah dipakai feed lain.</span>
              ) : (
                <span className="text-zinc-500">Slug unik akan dibuat otomatis bila dikosongkan.</span>
              )}
            </div>
            <div className={`sm:col-span-2 space-y-1 ${formTab === 'main' ? '' : 'hidden'}`}>
              <div className="flex items-center gap-2">
                <input value={form.coverImageUrl} onChange={(e) => setForm((v) => ({ ...v, coverImageUrl: e.target.value }))} placeholder="URL Cover Image" className="border rounded-xl px-3 py-2 flex-1" />
                <button type="button" title="Paste URL" onClick={() => void pasteCoverUrl()} className="h-9 w-9 rounded-xl border inline-flex items-center justify-center">📋</button>
              </div>
              <div className="flex items-center gap-2">
                <label className="h-8 px-3 rounded-lg border text-[11px] font-semibold inline-flex items-center cursor-pointer">
                  Upload
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) void uploadCoverImage(f);
                      e.currentTarget.value = '';
                    }}
                  />
                </label>
                {coverUploading ? (
                  <div className="text-[11px] text-zinc-500">Uploading {coverUploadProgress}%...</div>
                ) : null}
              </div>
            </div>
            <input value={form.authorName} onChange={(e) => setForm((v) => ({ ...v, authorName: e.target.value }))} placeholder="Author" className={`border rounded-xl px-3 py-2 ${formTab === 'optional' ? '' : 'hidden'}`} />
            <input type="datetime-local" value={form.publishedAt} onChange={(e) => setForm((v) => ({ ...v, publishedAt: e.target.value }))} className={`border rounded-xl px-3 py-2 ${formTab === 'optional' ? '' : 'hidden'}`} />
            <input value={form.tags} onChange={(e) => setForm((v) => ({ ...v, tags: e.target.value }))} placeholder="Tags (pisahkan koma)" className={`border rounded-xl px-3 py-2 sm:col-span-2 ${formTab === 'optional' ? '' : 'hidden'}`} />
            <textarea value={form.excerpt} onChange={(e) => setForm((v) => ({ ...v, excerpt: e.target.value }))} placeholder="Excerpt" className={`border rounded-xl px-3 py-2 min-h-20 sm:col-span-2 ${formTab === 'optional' ? '' : 'hidden'}`} />
            <label className={`sm:col-span-2 flex items-center gap-2 text-xs border rounded-xl px-3 py-2 ${formTab === 'main' ? '' : 'hidden'}`}>
              <input type="checkbox" checked={form.isActive} onChange={(e) => setForm((v) => ({ ...v, isActive: e.target.checked }))} />
              Publish aktif
            </label>
            <div className={`sm:col-span-2 space-y-2 ${formTab === 'json' ? '' : 'hidden'}`}>
              <textarea
                value={formJson}
                onChange={(e) => setFormJson(e.target.value)}
                placeholder='{"title":"...","content":"...","isActive":true}'
                className="w-full border rounded-xl px-3 py-2 min-h-56 font-mono text-[11px]"
              />
              <div className="flex gap-2">
                <button type="button" className="h-8 px-3 rounded-lg border text-[11px] font-semibold" onClick={() => setFormJson(buildFormJson())}>
                  Sync dari Form
                </button>
                <button type="button" className="h-8 px-3 rounded-lg border text-[11px] font-semibold" onClick={applyJsonToForm}>
                  Terapkan ke Form
                </button>
              </div>
            </div>
            <div className={`sm:col-span-2 space-y-2 ${formTab === 'bulk' ? '' : 'hidden'}`}>
              <div className="rounded-xl bg-blue-50 border border-blue-200 px-3 py-2 text-[11px] text-blue-700">
                Format wajib: array JSON. Field minimal: <code>title</code>, <code>content</code>, <code>isActive</code>.
              </div>
              <div className="flex items-center gap-2">
                <button type="button" className={`h-8 px-3 rounded-lg text-[11px] font-semibold ${bulkTab === 'required' ? 'bg-zinc-900 text-white' : 'border'}`} onClick={() => setBulkTab('required')}>
                  Required
                </button>
                <button type="button" className={`h-8 px-3 rounded-lg text-[11px] font-semibold ${bulkTab === 'optional' ? 'bg-zinc-900 text-white' : 'border'}`} onClick={() => setBulkTab('optional')}>
                  Optional
                </button>
                <button type="button" onClick={() => void copyBulkFormat()} className="ml-auto rounded-lg border px-3 h-8 text-[11px] font-semibold">
                  Copy Format
                </button>
              </div>
              <textarea value={bulkJson} onChange={(e) => setBulkJson(e.target.value)} placeholder='[{"title":"Tips Umrah Lansia","content":"...","isActive":true}]' className="w-full border rounded-xl px-3 py-2 text-xs min-h-40 font-mono" />
              <div className="flex gap-2">
                <button type="button" onClick={() => setBulkJson(bulkFeedSample)} className="rounded-xl border px-4 py-2 text-xs font-semibold">
                  Isi Contoh
                </button>
                <button type="button" disabled={saving} onClick={() => void runBulk()} className="rounded-xl border px-4 py-2 text-xs font-semibold disabled:opacity-60">
                  Simpan Bulk
                </button>
              </div>
            </div>
          </div>
          </div>
          <div className="sticky bottom-0 z-20 bg-white border-t px-4 py-3 flex justify-end gap-2">
            <button type="button" onClick={() => { setForm(blankForm()); setEditingId(null); }} className="rounded-xl border px-4 py-2 text-xs">Reset</button>
            <button type="button" disabled={saving || coverUploading || formTab === 'bulk'} onClick={() => void submit()} className="rounded-xl bg-primary-600 text-white px-4 py-2 text-xs font-semibold disabled:opacity-60">
              {saving ? 'Menyimpan...' : editingId ? 'Update Feed' : 'Simpan Feed'}
            </button>
          </div>
        </div>
      </ModalShell>
    </div>
  );
}
