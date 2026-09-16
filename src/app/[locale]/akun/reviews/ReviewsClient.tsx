'use client';

import { useEffect, useMemo, useState } from 'react';
import { Link } from '@/i18n/routing-patch';
import { apiDelete, apiGet, apiPost, apiPut } from '@/lib/api-client';
import { useAuth } from '@/lib/auth';
import { ModalShell } from '@/components/ui/ModalShell';
import { Skeleton } from '@/components/Skeleton';

type ReviewItem = {
  id: number;
  programSlugSnapshot?: string;
  reviewerName: string;
  reviewerEmail?: string;
  rating: number;
  reviewText?: string;
  isActive?: boolean;
  createdAt: string;
};

function Stars({ value, onChange, readOnly = false }: { value: number; onChange?: (v: number) => void; readOnly?: boolean }) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          disabled={readOnly}
          onClick={() => onChange?.(n)}
          className={`text-lg leading-none ${n <= value ? 'text-amber-500' : 'text-zinc-300'} ${readOnly ? 'cursor-default' : ''}`}
          aria-label={`rate-${n}`}
        >
          ★
        </button>
      ))}
    </div>
  );
}

export default function ReviewsClient({ manageOnly = false }: { manageOnly?: boolean }) {
  const { user, hasRole } = useAuth();
  const isAdmin = useMemo(() => hasRole('superadmin') || hasRole('admin'), [hasRole]);
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<ReviewItem[]>([]);
  const [editing, setEditing] = useState<ReviewItem | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({ programCode: '', reviewerName: '', reviewerEmail: '', rating: 5, reviewText: '' });

  const load = async () => {
    setLoading(true);
    try {
      const path = isAdmin
        ? `/api/BusinessInsights/pack/reviews/manage?page=1&pageSize=100&search=${encodeURIComponent(search)}`
        : '/api/BusinessInsights/pack/reviews?page=1&pageSize=100';
      const res = await apiGet<any>(path);
      setItems(res?.data?.items ?? []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [isAdmin]);

  return (
    <div className="p-4 space-y-4 animate-fade-up">
      <div className="bg-white border rounded-3xl p-5">
        <h1 className="text-lg font-extrabold g-text">{manageOnly ? 'Kelola Review' : 'Kasih Review'}</h1>
        <p className="text-xs text-zinc-500 mt-2">{isAdmin ? 'Mode SuperAdmin: kelola semua review.' : 'Silakan kirim review Anda.'}</p>
      </div>

      {!manageOnly ? (
      <div className="bg-white border rounded-3xl p-4 space-y-2">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <input className="border rounded-xl px-3 py-2 text-xs" placeholder="Program code / slug (opsional)" value={form.programCode} onChange={(e) => setForm((p) => ({ ...p, programCode: e.target.value }))} />
          <input className="border rounded-xl px-3 py-2 text-xs" placeholder="Nama" value={form.reviewerName} onChange={(e) => setForm((p) => ({ ...p, reviewerName: e.target.value }))} />
          <input className="border rounded-xl px-3 py-2 text-xs" placeholder="Email (opsional)" value={form.reviewerEmail} onChange={(e) => setForm((p) => ({ ...p, reviewerEmail: e.target.value }))} />
          <div className="flex items-center gap-2 text-xs">
            <span>Rating:</span>
            <Stars value={form.rating} onChange={(v) => setForm((p) => ({ ...p, rating: v }))} />
          </div>
        </div>
        <textarea className="w-full min-h-20 border rounded-xl px-3 py-2 text-xs" placeholder="Tulis review..." value={form.reviewText} onChange={(e) => setForm((p) => ({ ...p, reviewText: e.target.value }))} />
        <button
          type="button"
          className="rounded-xl bg-primary-600 text-white px-4 py-2 text-xs font-semibold"
          onClick={async () => {
            await apiPost('/api/BusinessInsights/pack/review', {
              programCode: form.programCode || null,
              reviewerName: form.reviewerName || user?.name || 'Pelanggan',
              reviewerEmail: form.reviewerEmail || user?.email || null,
              rating: form.rating,
              reviewText: form.reviewText || null,
            });
            setForm({ programCode: '', reviewerName: '', reviewerEmail: '', rating: 5, reviewText: '' });
            await load();
          }}
        >
          Kirim Review
        </button>
      </div>
      ) : null}

      {isAdmin ? (
        <div className="bg-white border rounded-3xl p-4 space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold">Kelola Review</h2>
            <div className="flex gap-2">
              <input className="border rounded-xl px-3 py-1.5 text-xs" placeholder="Cari review..." value={search} onChange={(e) => setSearch(e.target.value)} />
              <button className="border rounded-xl px-3 py-1.5 text-xs" onClick={() => void load()}>Cari</button>
            </div>
          </div>
        </div>
      ) : null}

      <div className="space-y-2">
        {loading ? (
          <div className="space-y-2">
            <div className="bg-white border rounded-2xl p-3 space-y-2">
              <Skeleton className="h-4 w-36" />
              <Skeleton className="h-3 w-48 rounded-full" />
              <Skeleton className="h-8 w-full rounded-xl" />
            </div>
            <div className="flex items-center gap-2 text-xs text-zinc-500">
              <span className="h-4 w-4 rounded-full border-2 border-zinc-300 border-t-primary-600 animate-spin" />
              Memuat review...
            </div>
          </div>
        ) : null}
        {items.map((x) => (
          <div key={x.id} className="bg-white border rounded-2xl p-3 space-y-1">
            <div className="flex items-center justify-between gap-2">
              <div className="text-xs font-semibold">{x.reviewerName}</div>
              <Stars value={x.rating} readOnly />
            </div>
            <div className="text-[11px] text-zinc-500">{x.reviewerEmail || '-'} • {x.programSlugSnapshot || 'umum'}</div>
            <div className="text-xs text-zinc-700">{x.reviewText || '-'}</div>
            {isAdmin ? (
              <div className="flex gap-2 pt-1">
                <button className="border rounded-xl px-3 py-1 text-xs" onClick={() => setEditing(x)}>Edit</button>
                <button
                  className="border border-red-200 text-red-600 rounded-xl px-3 py-1 text-xs"
                  onClick={() => setDeleteConfirmId(x.id)}
                >
                  Delete
                </button>
              </div>
            ) : null}
          </div>
        ))}
      </div>

      <ModalShell open={Boolean(editing)} onBackdropClick={() => setEditing(null)}>
          <div className="bg-white w-full max-w-md rounded-3xl p-4 space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold">Edit Review</h3>
              <button onClick={() => setEditing(null)} aria-label="Tutup modal">✕</button>
            </div>
            <input className="w-full border rounded-xl px-3 py-2 text-xs" value={editing?.reviewerName || ''} onChange={(e) => setEditing((p) => (p ? { ...p, reviewerName: e.target.value } : p))} />
            <input className="w-full border rounded-xl px-3 py-2 text-xs" value={editing?.reviewerEmail || ''} onChange={(e) => setEditing((p) => (p ? { ...p, reviewerEmail: e.target.value } : p))} />
            <Stars value={editing?.rating || 5} onChange={(v) => setEditing((p) => (p ? { ...p, rating: v } : p))} />
            <textarea className="w-full min-h-20 border rounded-xl px-3 py-2 text-xs" value={editing?.reviewText || ''} onChange={(e) => setEditing((p) => (p ? { ...p, reviewText: e.target.value } : p))} />
            <label className="inline-flex items-center gap-2 text-xs">
              <input type="checkbox" checked={editing?.isActive ?? true} onChange={(e) => setEditing((p) => (p ? { ...p, isActive: e.target.checked } : p))} />
              Aktif
            </label>
            <button
              className="rounded-xl bg-primary-600 text-white px-4 py-2 text-xs font-semibold"
              onClick={async () => {
                if (!editing) return;
                await apiPut(`/api/BusinessInsights/pack/reviews/${editing.id}`, {
                  reviewerName: editing.reviewerName,
                  reviewerEmail: editing.reviewerEmail,
                  rating: editing.rating,
                  reviewText: editing.reviewText,
                  isActive: editing.isActive ?? true,
                });
                setEditing(null);
                await load();
              }}
            >
              Simpan
            </button>
          </div>
      </ModalShell>

      <Link href="/akun" className="inline-flex text-sm text-primary-600">← Kembali ke Akun</Link>

      <ModalShell open={deleteConfirmId !== null} onBackdropClick={() => setDeleteConfirmId(null)} zIndexClass="z-[1300]" overlayClassName="bg-black/30">
        <div className="bg-white w-full max-w-md rounded-2xl p-4 space-y-3">
          <div className="text-sm font-bold">Konfirmasi</div>
          <div className="text-xs text-zinc-700">Hapus review ini?</div>
          <div className="flex justify-end gap-2">
            <button type="button" className="border rounded-lg px-3 py-1.5 text-xs" onClick={() => setDeleteConfirmId(null)}>Tidak</button>
            <button
              type="button"
              className="bg-red-600 text-white rounded-lg px-3 py-1.5 text-xs font-semibold"
              onClick={async () => {
                const id = deleteConfirmId;
                setDeleteConfirmId(null);
                if (!id) return;
                await apiDelete(`/api/BusinessInsights/pack/reviews/${id}`);
                await load();
              }}
            >
              Ya
            </button>
          </div>
        </div>
      </ModalShell>
    </div>
  );
}

