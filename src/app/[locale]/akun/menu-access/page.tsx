'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from '@/i18n/routing-patch';
import { apiGet, apiPut } from '@/lib/api-client';
import { useAuth } from '@/lib/auth';

type BootstrapPayload = {
  roles?: string[];
  catalog?: Array<{ key: string; label: string; href: string; icon?: string }>;
  roleAccess?: { roleMenus?: Record<string, string[]> };
};

const BOOTSTRAP_CACHE_KEY = 'akun_bootstrap_v1';
const getBootstrapCacheKey = (userId?: string, userName?: string) =>
  `${BOOTSTRAP_CACHE_KEY}:${(userId || userName || 'anonymous').toLowerCase()}`;

export default function MenuAccessPage() {
  const router = useRouter();
  const { hasRole, user } = useAuth();
  const [bootstrap, setBootstrap] = useState<BootstrapPayload | null>(null);
  const [menuMsg, setMenuMsg] = useState('');
  const [openRoles, setOpenRoles] = useState<string[]>([]);
  const [menuFilter, setMenuFilter] = useState('');
  const initializedRolesRef = useRef(false);
  const filterWasActiveRef = useRef(false);
  const normalizedFilter = menuFilter.trim().toLowerCase();

  const isSuperAdmin = useMemo(() => hasRole('superadmin'), [hasRole]);
  const roleKeys = useMemo(
    () => (bootstrap?.roles ?? []).map((role) => String(role).toLowerCase()),
    [bootstrap?.roles]
  );
  const allRolesOpen = roleKeys.length > 0 && roleKeys.every((role) => openRoles.includes(role));
  const allRolesClosed = roleKeys.every((role) => !openRoles.includes(role));

  useEffect(() => {
    if (!isSuperAdmin) return;
    if (!user?.id && !user?.userName) return;
    const cacheKey = getBootstrapCacheKey(user.id, user.userName);
    const cached = typeof window !== 'undefined' ? localStorage.getItem(cacheKey) : null;
    if (cached) {
      try { setBootstrap(JSON.parse(cached)); return; } catch { }
    }
    void (async () => {
      try {
        const res = await apiGet<any>('/api/Account/akun-bootstrap');
        const data = (res as any)?.data ?? (res as any) ?? null;
        setBootstrap(data);
        if (typeof window !== 'undefined') localStorage.setItem(cacheKey, JSON.stringify(data));
      } catch { }
    })();
  }, [isSuperAdmin, user?.id, user?.userName]);

  useEffect(() => {
    if (initializedRolesRef.current || roleKeys.length === 0) return;
    initializedRolesRef.current = true;
    setOpenRoles([roleKeys[0]]);
  }, [roleKeys]);

  useEffect(() => {
    const filterIsActive = normalizedFilter.length > 0;
    if (filterIsActive && !filterWasActiveRef.current) {
      setOpenRoles(roleKeys);
    }
    filterWasActiveRef.current = filterIsActive;
  }, [normalizedFilter, roleKeys]);

  if (!isSuperAdmin) {
    return (
      <div className="p-4">
        <div className="bg-white border rounded-3xl p-5 text-xs text-zinc-600">Akses ditolak. Halaman ini khusus SuperAdmin.</div>
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-4 space-y-4 animate-fade-up">
      <div className="bg-white border rounded-3xl p-3 sm:p-5 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h1 className="text-xs sm:text-sm font-bold">Custom Menu Access (Bootstrap API)</h1>
          <button
            type="button"
            className="border rounded-xl h-9 w-9 inline-flex items-center justify-center"
            title="Kembali ke Akun"
            onClick={() => router.push('/akun')}
          >
            ←
          </button>
        </div>
        {menuMsg ? <div className="text-[11px] text-emerald-600">{menuMsg}</div> : null}
        <div className="text-[11px] text-zinc-500">Checklist akses menu per role. Simpan akan mengupdate JSON hak akses.</div>
        <input
          value={menuFilter}
          onChange={(e) => setMenuFilter(e.target.value)}
          placeholder="Filter menu..."
          className="w-full border rounded-xl px-3 py-2 text-xs"
        />
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border bg-zinc-50 p-2">
          <div className="px-1">
            <div className="text-[11px] font-semibold text-zinc-700">Tampilan section role</div>
            <div className="text-[10px] text-zinc-500">
              {openRoles.length} dari {roleKeys.length} section terbuka
            </div>
          </div>
          <div className="flex items-center gap-1.5">
          <button
            type="button"
            disabled={allRolesOpen || roleKeys.length === 0}
            className="inline-flex h-8 items-center gap-1.5 rounded-xl border bg-white px-3 text-[11px] font-semibold text-zinc-700 transition hover:border-primary-300 hover:text-primary-700 disabled:cursor-not-allowed disabled:opacity-40"
            onClick={() => setOpenRoles(roleKeys)}
            title="Expand semua section role"
          >
            <span aria-hidden="true">⌄</span>
            <span>Buka semua</span>
          </button>
          <button
            type="button"
            disabled={allRolesClosed || roleKeys.length === 0}
            className="inline-flex h-8 items-center gap-1.5 rounded-xl border bg-white px-3 text-[11px] font-semibold text-zinc-700 transition hover:border-primary-300 hover:text-primary-700 disabled:cursor-not-allowed disabled:opacity-40"
            onClick={() => setOpenRoles([])}
            title="Tutup semua section role"
          >
            <span aria-hidden="true">⌃</span>
            <span>Tutup semua</span>
          </button>
          </div>
        </div>
        <div className="space-y-3">
          {(bootstrap?.roles ?? []).map((role) => {
            const roleKey = String(role).toLowerCase();
            const selected = new Set((bootstrap?.roleAccess?.roleMenus?.[roleKey] ?? []).map(String));
            const visibleMenus = (bootstrap?.catalog ?? []).filter((m) => {
              if (!normalizedFilter) return true;
              const label = String(m.label ?? '').toLowerCase();
              const key = String(m.key ?? '').toLowerCase();
              const href = String(m.href ?? '').toLowerCase();
              return label.includes(normalizedFilter) || key.includes(normalizedFilter) || href.includes(normalizedFilter);
            });
            const isOpen = openRoles.includes(roleKey);
            return (
              <div
                key={role}
                className={`overflow-hidden rounded-2xl border transition-colors ${
                  isOpen ? 'border-primary-200 bg-white' : 'border-zinc-200 bg-zinc-50/70'
                }`}
              >
                <button
                  type="button"
                  onClick={() => {
                    setOpenRoles((prev) =>
                      prev.includes(roleKey)
                        ? prev.filter((x) => x !== roleKey)
                        : [...prev, roleKey]
                    );
                  }}
                  aria-expanded={isOpen}
                  aria-controls={`role-menu-${roleKey}`}
                  className="flex min-h-14 w-full items-center justify-between gap-3 px-4 py-3 text-left transition hover:bg-primary-50/60"
                >
                  <div className="min-w-0">
                    <div className="truncate text-xs font-bold text-zinc-800">{role}</div>
                    <div className="mt-0.5 text-[10px] text-zinc-500">
                      {selected.size} dipilih · {visibleMenus.length} menu tampil
                    </div>
                  </div>
                  <span
                    className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-semibold transition ${
                      isOpen
                        ? 'border-primary-200 bg-primary-50 text-primary-700'
                        : 'border-zinc-200 bg-white text-zinc-600'
                    }`}
                  >
                    <span>{isOpen ? 'Tutup' : 'Buka'}</span>
                    <span aria-hidden="true">{isOpen ? '⌃' : '⌄'}</span>
                  </span>
                </button>
                <div
                  id={`role-menu-${roleKey}`}
                  className={isOpen ? 'grid gap-1.5 border-t px-3 py-3 sm:grid-cols-2' : 'hidden'}
                >
                  {visibleMenus.length === 0 ? (
                    <div className="sm:col-span-2 text-[11px] text-zinc-500 px-2 py-2">Tidak ada menu yang cocok dengan filter.</div>
                  ) : null}
                  {visibleMenus.map((m) => (
                    <label key={`${role}-${m.key}`} className="text-[11px] flex items-center gap-2 rounded-lg px-2 py-2 min-h-10 hover:bg-zinc-50">
                      <input
                        type="checkbox"
                        checked={selected.has(String(m.key))}
                        onChange={(e) => {
                          setBootstrap((prev) => {
                            if (!prev) return prev;
                            const next = JSON.parse(JSON.stringify(prev)) as BootstrapPayload;
                            next.roleAccess = next.roleAccess ?? { roleMenus: {} };
                            next.roleAccess.roleMenus = next.roleAccess.roleMenus ?? {};
                            const arr = new Set((next.roleAccess.roleMenus[roleKey] ?? []).map(String));
                            if (e.target.checked) arr.add(String(m.key)); else arr.delete(String(m.key));
                            next.roleAccess.roleMenus[roleKey] = Array.from(arr);
                            return next;
                          });
                        }}
                      />
                      <span className="leading-tight">{m.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
        <div className="sticky bottom-2 bg-white/95 backdrop-blur border rounded-2xl p-2 flex gap-2 justify-end">
          <button className="border rounded-xl h-9 w-9 inline-flex items-center justify-center shrink-0" title="Simpan menu access" onClick={() => void (async () => {
            try {
              await apiPut('/api/Account/akun-bootstrap/menu-access', { roleMenus: bootstrap?.roleAccess?.roleMenus ?? {} });
              const cacheKey = getBootstrapCacheKey(user?.id, user?.userName);
              localStorage.removeItem(cacheKey);
              const res = await apiGet<any>('/api/Account/akun-bootstrap');
              const data = (res as any)?.data ?? (res as any) ?? null;
              setBootstrap(data);
              localStorage.setItem(cacheKey, JSON.stringify(data));
              setMenuMsg('Menu access tersimpan');
            } catch (e: any) {
              setMenuMsg(e?.message || 'Gagal simpan');
            }
          })}>💾</button>
          <button className="border rounded-xl h-9 w-9 inline-flex items-center justify-center shrink-0" title="Refresh bootstrap" onClick={() => void (async () => {
            try {
              const res = await apiGet<any>('/api/Account/akun-bootstrap');
              const data = (res as any)?.data ?? (res as any) ?? null;
              setBootstrap(data);
              const cacheKey = getBootstrapCacheKey(user?.id, user?.userName);
              localStorage.setItem(cacheKey, JSON.stringify(data));
              setMenuMsg('Bootstrap refresh');
            } catch (e: any) {
              setMenuMsg(e?.message || 'Gagal refresh');
            }
          })}>↻</button>
        </div>
      </div>
    </div>
  );
}
