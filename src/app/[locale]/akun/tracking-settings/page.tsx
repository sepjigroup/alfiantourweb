'use client';

import { useEffect, useState } from 'react';
import { Link } from '@/i18n/routing-patch';
import { apiDelete, apiGet, apiPost, apiPut } from '@/lib/api-client';
import { ModalShell } from '@/components/ui/ModalShell';
import { useToast } from '@/components/Toast';
import { Skeleton } from '@/components/Skeleton';

type TrackingFormState = {
  metaPixel: string;
  xCom: string;
  linkedIn: string;
  tiktok: string;
  googleAds: string;
  googleAdsense: string;
};

const emptyTrackingForm: TrackingFormState = {
  metaPixel: '',
  xCom: '',
  linkedIn: '',
  tiktok: '',
  googleAds: '',
  googleAdsense: '',
};

function normalizeTrackingForm(value: unknown): TrackingFormState {
  const src = (value ?? {}) as Record<string, unknown>;
  return {
    metaPixel: String(src.metaPixel ?? ''),
    xCom: String(src.xCom ?? ''),
    linkedIn: String(src.linkedIn ?? ''),
    tiktok: String(src.tiktok ?? ''),
    googleAds: String(src.googleAds ?? ''),
    googleAdsense: String(src.googleAdsense ?? ''),
  };
}

export default function TrackingSettingsPage() {
  const [loading, setLoading] = useState(false);
  const [maintenance, setMaintenance] = useState({ enabled: false, title: '', message: '' });
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);
  const [form, setForm] = useState<TrackingFormState>(emptyTrackingForm);
  const { show } = useToast();

  const load = async () => {
    setLoading(true);
    try {
      const [res, m] = await Promise.all([
        apiGet<any>('/api/BusinessInsights/settings/tracking'),
        apiGet<any>('/api/BusinessInsights/maintenance/public'),
      ]);
      setForm(normalizeTrackingForm(res?.data));
      setMaintenance({
        enabled: !!m?.data?.enabled,
        title: m?.data?.title || '',
        message: m?.data?.message || '',
      });
    } catch (e) {
      show(e instanceof Error ? e.message : 'Gagal load settings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  return (
    <div className="p-4 space-y-4 animate-fade-up">
      <div className="bg-white border rounded-3xl p-5">
        <h1 className="text-lg font-extrabold g-text">Tracking Settings</h1>
        <p className="text-xs text-zinc-500 mt-1">Meta Pixel, X.com, LinkedIn, TikTok, Google Ads, Google AdSense.</p>
      </div>
      {loading ? (
        <div className="space-y-2">
          <div className="bg-white border rounded-2xl p-3 space-y-2">
            <Skeleton className="h-4 w-36" />
            <Skeleton className="h-9 w-full rounded-xl" />
          </div>
          <div className="flex items-center gap-2 text-xs text-zinc-500">
            <span className="h-4 w-4 rounded-full border-2 border-zinc-300 border-t-primary-600 animate-spin" />
            Memuat settings...
          </div>
        </div>
      ) : null}

      <div className="bg-white border rounded-3xl p-4 space-y-2">
        <input className="w-full border rounded-xl px-3 py-2 text-xs" placeholder="Meta Pixel ID/Code" value={form.metaPixel} onChange={(e) => setForm((p) => ({ ...p, metaPixel: e.target.value }))} />
        <input className="w-full border rounded-xl px-3 py-2 text-xs" placeholder="X.com link" value={form.xCom} onChange={(e) => setForm((p) => ({ ...p, xCom: e.target.value }))} />
        <input className="w-full border rounded-xl px-3 py-2 text-xs" placeholder="LinkedIn link" value={form.linkedIn} onChange={(e) => setForm((p) => ({ ...p, linkedIn: e.target.value }))} />
        <input className="w-full border rounded-xl px-3 py-2 text-xs" placeholder="TikTok link" value={form.tiktok} onChange={(e) => setForm((p) => ({ ...p, tiktok: e.target.value }))} />
        <input className="w-full border rounded-xl px-3 py-2 text-xs" placeholder="Google Ads tag" value={form.googleAds} onChange={(e) => setForm((p) => ({ ...p, googleAds: e.target.value }))} />
        <input className="w-full border rounded-xl px-3 py-2 text-xs" placeholder="Google AdSense client" value={form.googleAdsense} onChange={(e) => setForm((p) => ({ ...p, googleAdsense: e.target.value }))} />
        <div className="flex gap-2">
          <button
            className="rounded-xl bg-primary-600 text-white px-4 py-2 text-xs font-semibold"
            onClick={async () => {
              try {
                await apiPut('/api/BusinessInsights/settings/tracking', form);
                try {
                  sessionStorage.removeItem('tracking_public_cache_v1');
                  window.dispatchEvent(new Event('tracking-updated'));
                } catch {
                  // ignore sync failures
                }
                show('Settings tracking tersimpan');
              } catch (e) {
                show(e instanceof Error ? e.message : 'Gagal simpan settings');
              }
            }}
          >
            Simpan
          </button>
          <button
            className="rounded-xl border border-red-200 text-red-600 px-4 py-2 text-xs font-semibold"
            onClick={() => setResetConfirmOpen(true)}
          >
            Reset
          </button>
        </div>
      </div>

      <div className="bg-white border rounded-3xl p-4 space-y-2">
        <h2 className="text-sm font-bold">Maintenance Mode</h2>
        <label className="inline-flex items-center gap-2 text-xs">
          <input type="checkbox" checked={maintenance.enabled} onChange={(e) => setMaintenance((p) => ({ ...p, enabled: e.target.checked }))} />
          Aktifkan Maintenance Global
        </label>
        <input
          className="w-full border rounded-xl px-3 py-2 text-xs"
          placeholder="Judul maintenance"
          value={maintenance.title}
          onChange={(e) => setMaintenance((p) => ({ ...p, title: e.target.value }))}
        />
        <textarea
          className="w-full min-h-20 border rounded-xl px-3 py-2 text-xs"
          placeholder="Pesan maintenance"
          value={maintenance.message}
          onChange={(e) => setMaintenance((p) => ({ ...p, message: e.target.value }))}
        />
        <button
          className="rounded-xl bg-primary-600 text-white px-4 py-2 text-xs font-semibold"
          onClick={async () => {
            try {
              await apiPost('/api/BusinessInsights/maintenance/set', maintenance);
              try {
                sessionStorage.removeItem('maintenance_cache_v1');
                window.dispatchEvent(new Event('maintenance-updated'));
              } catch {
                // ignore
              }
              show('Maintenance settings tersimpan');
            } catch (e) {
              show(e instanceof Error ? e.message : 'Gagal simpan maintenance settings');
            }
          }}
        >
          Simpan Maintenance
        </button>
      </div>

      <Link href="/akun" className="inline-flex text-sm text-primary-600">← Kembali ke Akun</Link>

      <ModalShell open={resetConfirmOpen} onBackdropClick={() => setResetConfirmOpen(false)} zIndexClass="z-[1300]" overlayClassName="bg-black/30">
        <div className="bg-white w-full max-w-md rounded-2xl p-4 space-y-3">
          <div className="text-sm font-bold">Konfirmasi</div>
          <div className="text-xs text-zinc-700">Reset semua tracking settings?</div>
          <div className="flex justify-end gap-2">
            <button type="button" className="border rounded-lg px-3 py-1.5 text-xs" onClick={() => setResetConfirmOpen(false)}>Tidak</button>
            <button
              type="button"
              className="bg-red-600 text-white rounded-lg px-3 py-1.5 text-xs font-semibold"
              onClick={async () => {
                setResetConfirmOpen(false);
                try {
                  await apiDelete('/api/BusinessInsights/settings/tracking');
                  setForm(emptyTrackingForm);
                  try {
                    sessionStorage.removeItem('tracking_public_cache_v1');
                    window.dispatchEvent(new Event('tracking-updated'));
                  } catch {
                    // ignore sync failures
                  }
                  show('Settings tracking direset');
                } catch (e) {
                  show(e instanceof Error ? e.message : 'Gagal reset settings');
                }
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

