'use client';

import { useEffect, useMemo, useState } from 'react';
import { Link } from '@/i18n/routing-patch';
import { apiDelete, apiGet, apiPost } from '@/lib/api-client';
import { useToast } from '@/components/Toast';
import { SectionCard } from '@/components/dynamic/SectionCard';
import { ProgramListCard } from '@/components/paket/ProgramListCard';
import { ModalShell } from '@/components/ui/ModalShell';
import { Skeleton } from '@/components/Skeleton';

export default function BankSampahPaketPage() {
  const { show } = useToast();
  const [items, setItems] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [restoreId, setRestoreId] = useState<number | null>(null);
  const [hardDeleteId, setHardDeleteId] = useState<number | null>(null);
  const [jsonOpen, setJsonOpen] = useState(false);
  const [jsonTitle, setJsonTitle] = useState('');
  const [jsonText, setJsonText] = useState('');

  const loadTrash = async () => {
    try {
      const res = await apiGet<any>('/api/v1/master/programs/trash?page=1&pageSize=100');
      const list = Array.isArray(res?.items) ? res.items : Array.isArray(res?.data?.items) ? res.data.items : [];
      setItems(list);
    } catch (e) {
      setItems([]);
      show(e instanceof Error ? e.message : 'Gagal memuat data bank sampah');
    }
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      try {
        await loadTrash();
      } finally {
        setLoading(false);
      }
    };
    void init();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter((x) => `${x.title || ''} ${x.name || ''} ${x.slug || ''}`.toLowerCase().includes(q));
  }, [items, search]);

  const restoreProgram = async (id: number) => {
    await apiPost(`/api/v1/master/programs/${id}/restore`);
  };

  const hardDeleteProgram = async (id: number) => {
    await apiDelete(`/api/v1/master/programs/${id}/hard`);
  };

  const openJsonModal = async (item: any) => {
    const id = Number(item?.id || 0);
    setJsonTitle(String(item?.title || item?.name || `Program #${id}`));
    setJsonText(JSON.stringify(item, null, 2));
    setJsonOpen(true);
  };

  return (
    <div className="p-4 space-y-4 animate-fade-up">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-extrabold g-text">Bank Sampah Paket</h1>
        <Link href="/akun/kelola-paket" className="text-blue-600 underline text-xs">Kelola Paket →</Link>
      </div>

      <SectionCard title="Data Soft Delete" right={<input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cari nama/slug..." className="border rounded-xl px-3 py-1.5 text-xs" />}>
        {loading ? (
          <div className="py-3 space-y-2">
            <div className="border rounded-2xl p-3 space-y-2">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-3 w-56 rounded-full" />
              <Skeleton className="h-8 w-full rounded-xl" />
            </div>
            <div className="flex items-center justify-center gap-2 text-xs text-zinc-500">
              <span className="h-4 w-4 rounded-full border-2 border-zinc-300 border-t-primary-600 animate-spin" />
              Memuat data bank sampah...
            </div>
          </div>
        ) : null}
        {!loading && filtered.length === 0 ? (
          <div className="py-8 text-xs text-zinc-500 text-center">Belum ada data soft delete.</div>
        ) : null}
        {!loading ? filtered.map((x) => (
          <ProgramListCard
            key={x.id}
            item={x}
            trashMode
            isActive={Boolean(x.isActive)}
            onEdit={() => {}}
            onSoftDelete={() => {}}
            onRestore={() => setRestoreId(Number(x.id))}
            onHardDelete={() => setHardDeleteId(Number(x.id))}
            onJsonData={() => void openJsonModal(x)}
            deleting={busy && (restoreId === Number(x.id) || hardDeleteId === Number(x.id))}
          />
        )) : null}
      </SectionCard>

      <ModalShell open={restoreId !== null} onBackdropClick={() => { if (!busy) setRestoreId(null); }}>
        <div className="bg-white w-full max-w-md rounded-2xl p-4 space-y-3">
          <div className="text-sm font-bold">Konfirmasi Restore</div>
          <div className="text-xs text-zinc-700">Kembalikan paket ini ke list aktif?</div>
          <div className="flex justify-end gap-2">
            <button type="button" disabled={busy} className="border rounded-lg px-3 py-1.5 text-xs" onClick={() => setRestoreId(null)}>Tidak</button>
            <button
              type="button"
              disabled={busy}
              className="bg-emerald-600 text-white rounded-lg px-3 py-1.5 text-xs font-semibold disabled:opacity-60"
              onClick={async () => {
                if (!restoreId) return;
                try {
                  setBusy(true);
                  await restoreProgram(restoreId);
                  show('Program berhasil di-restore');
                  setRestoreId(null);
                  await loadTrash();
                } catch (e) {
                  show(e instanceof Error ? e.message : 'Gagal restore program');
                } finally {
                  setBusy(false);
                }
              }}
            >
              Ya
            </button>
          </div>
        </div>
      </ModalShell>

      <ModalShell open={hardDeleteId !== null} onBackdropClick={() => { if (!busy) setHardDeleteId(null); }}>
        <div className="bg-white w-full max-w-md rounded-2xl p-4 space-y-3">
          <div className="text-sm font-bold text-red-700">Konfirmasi Hard Delete</div>
          <div className="text-xs text-zinc-700">Data akan dihapus permanen dari database. Lanjutkan?</div>
          <div className="flex justify-end gap-2">
            <button type="button" disabled={busy} className="border rounded-lg px-3 py-1.5 text-xs" onClick={() => setHardDeleteId(null)}>Tidak</button>
            <button
              type="button"
              disabled={busy}
              className="bg-red-600 text-white rounded-lg px-3 py-1.5 text-xs font-semibold disabled:opacity-60"
              onClick={async () => {
                if (!hardDeleteId) return;
                try {
                  setBusy(true);
                  await hardDeleteProgram(hardDeleteId);
                  show('Hard delete berhasil');
                  setHardDeleteId(null);
                  await loadTrash();
                } catch (e) {
                  show(e instanceof Error ? e.message : 'Gagal hard delete program');
                } finally {
                  setBusy(false);
                }
              }}
            >
              Ya, Hard Delete
            </button>
          </div>
        </div>
      </ModalShell>

      <ModalShell open={jsonOpen} onBackdropClick={() => setJsonOpen(false)}>
        <div className="bg-white w-full max-w-3xl rounded-3xl p-4 space-y-3 max-h-[88vh] overflow-y-auto">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold">JSON Program: {jsonTitle}</h3>
            <button type="button" onClick={() => setJsonOpen(false)} className="text-zinc-500" aria-label="Tutup modal">✕</button>
          </div>
          <textarea value={jsonText} readOnly className="w-full min-h-96 border rounded-xl px-3 py-2 text-xs font-mono bg-zinc-50" />
          <div className="flex justify-end gap-2">
            <button
              type="button"
              className="border rounded-xl px-4 py-2 text-xs"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(jsonText);
                  show('JSON disalin');
                } catch {
                  show('Gagal menyalin JSON');
                }
              }}
            >
              Copy JSON
            </button>
            <button type="button" className="border rounded-xl px-4 py-2 text-xs" onClick={() => setJsonOpen(false)}>
              Tutup
            </button>
          </div>
        </div>
      </ModalShell>
    </div>
  );
}
