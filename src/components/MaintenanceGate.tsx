'use client';

import { useEffect, useState } from 'react';
import { API_BASE_URL } from '@/lib/api-client';
import { usePathname } from '@/i18n/routing-patch';

type MaintenanceState = {
  enabled: boolean;
  title: string;
  message: string;
};

const CACHE_KEY = 'maintenance_cache_v1';
const CACHE_TTL_MS = 60_000;

export function MaintenanceGate() {
  const pathname = usePathname();
  const [state, setState] = useState<MaintenanceState | null>(null);

  const isAdminArea = /^\/akun(?:\/|$)/.test(pathname || '') || /^\/[^/]+\/akun(?:\/|$)/.test(pathname || '');

  useEffect(() => {
    const now = Date.now();
    const raw = typeof window !== 'undefined' ? sessionStorage.getItem(CACHE_KEY) : null;
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as { ts: number; data: MaintenanceState };
        if (now - parsed.ts < CACHE_TTL_MS) {
          setState(parsed.data);
        }
      } catch {
        // ignore
      }
    }

    const run = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/BusinessInsights/maintenance/public`, { cache: 'no-store' });
        if (!res.ok) return;
        const json = await res.json();
        const data = (json?.data ?? {}) as MaintenanceState;
        setState(data);
        sessionStorage.setItem(CACHE_KEY, JSON.stringify({ ts: Date.now(), data }));
      } catch {
        // ignore
      }
    };

    const onMaintenanceUpdated = () => {
      try {
        sessionStorage.removeItem(CACHE_KEY);
      } catch {
        // ignore
      }
      void run();
    };

    window.addEventListener('maintenance-updated', onMaintenanceUpdated as EventListener);
    void run();
    return () => {
      window.removeEventListener('maintenance-updated', onMaintenanceUpdated as EventListener);
    };
  }, [pathname]);

  if (!state?.enabled || isAdminArea) return null;

  return (
    <div className="fixed inset-0 z-[2000] bg-gradient-to-br from-purple-900 via-violet-800 to-indigo-900 text-white flex items-center justify-center p-6">
      <div className="max-w-xl w-full rounded-3xl border border-white/20 bg-white/10 backdrop-blur-md p-8 text-center shadow-2xl">
        <div className="mx-auto mb-5 h-14 w-14 rounded-full bg-white/20 flex items-center justify-center text-2xl">🛠️</div>
        <h1 className="text-2xl font-extrabold tracking-tight">{state.title || 'Maintenance in Progress'}</h1>
        <p className="mt-3 text-sm leading-relaxed text-white/90">{state.message || 'Sistem sedang dalam pemeliharaan. Silakan coba lagi beberapa saat.'}</p>
        <p className="mt-5 text-[11px] text-white/70">PT. Alfian Sejahtera Abadi</p>
      </div>
    </div>
  );
}
