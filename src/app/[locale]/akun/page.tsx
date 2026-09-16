'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { Link, useRouter } from '@/i18n/routing-patch';
import { useAuth } from '@/lib/auth';
import { API_BASE_URL, apiGet } from '@/lib/api-client';

type MenuItem = { icon: string; label: string; href: string };
type MenuGroup = { key: string; title: string; description: string; items: MenuItem[] };
type BootstrapPayload = {
  user?: { id?: string; userName?: string; roles?: string[] };
  roles?: string[];
  catalog?: Array<{ key: string; label: string; href: string; icon?: string }>;
  roleAccess?: { roleMenus?: Record<string, string[]> };
  allowedMenuKeys?: string[];
};
const BOOTSTRAP_CACHE_KEY = 'akun_bootstrap_v1';
const getBootstrapCacheKey = (userId?: string, userName?: string) =>
  `${BOOTSTRAP_CACHE_KEY}:${(userId || userName || 'anonymous').toLowerCase()}`;

const toAbsoluteUrl = (raw?: string | null): string => {
  const val = String(raw ?? '').trim();
  if (!val) return '';
  if (val.startsWith('http://') || val.startsWith('https://')) return val;
  return `${API_BASE_URL}${val.startsWith('/') ? '' : '/'}${val}`;
};

const QUICK_ACCESS_EXCLUDED_HREFS = new Set(['/akun/kelola-paket/bank-sampah']);

const groupMenuItems = (items: MenuItem[]): MenuGroup[] => {
  const buckets: Array<Omit<MenuGroup, 'items'> & { match: (item: MenuItem) => boolean }> = [
    {
      key: 'personal',
      title: 'Akun & Profil',
      description: 'Pengaturan data akun dan akses pribadi.',
      match: (item) => item.href === '/akun/edit-profile' || item.href === '/akun/menu-access',
    },
    {
      key: 'jamaah',
      title: 'Layanan Jamaah',
      description: 'Fitur yang dipakai jamaah, member, dan investor.',
      match: (item) => ['/akun/membership', '/akun/tabungan-jamaah', '/akun/affiliate', '/akun/creator', '/akun/funding', '/materi'].includes(item.href),
    },
    {
      key: 'content',
      title: 'Konten & Publikasi',
      description: 'Kelola materi, feed, video, gallery, dan karir.',
      match: (item) => /kelola-(feeds|gallery|video|materi|karir|creator)/.test(item.href),
    },
    {
      key: 'business',
      title: 'Operasional Bisnis',
      description: 'Kelola paket, layanan, partner, funding, membership, affiliate, dan tabungan.',
      match: (item) => /kelola-(paket|service|funding|membership|affiliate|tabungan)/.test(item.href) || item.href === '/akun/partner-transport' || item.href === '/akun/commerce-ops',
    },
  ];

  const grouped = buckets.map(({ match: _match, ...bucket }) => ({ ...bucket, items: [] as MenuItem[] }));
  const other: MenuGroup = {
    key: 'other',
    title: 'Menu Lainnya',
    description: 'Fitur tambahan sesuai akses akun.',
    items: [],
  };

  for (const item of items) {
    const index = buckets.findIndex((bucket) => bucket.match(item));
    if (index >= 0) grouped[index].items.push(item);
    else other.items.push(item);
  }

  return [...grouped, other].filter((group) => group.items.length > 0);
};

export default function AkunPage() {
  const router = useRouter();
  const { user, loading, logout, hasRole } = useAuth();
  const [copyInfo, setCopyInfo] = useState('');
  const [bootstrap, setBootstrap] = useState<BootstrapPayload | null>(null);
  const [desktopMenuQuery, setDesktopMenuQuery] = useState('');
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({
    content: true,
    business: true,
    other: true,
  });

  const toggleGroup = (groupKey: string) => {
    setCollapsedGroups((prev) => ({
      ...prev,
      [groupKey]: !prev[groupKey],
    }));
  };

  const isGroupCollapsed = (groupKey: string) => {
    if (desktopMenuQuery.trim() !== '') return false;
    return !!collapsedGroups[groupKey];
  };

  const isSuperAdmin = useMemo(() => hasRole('superadmin'), [hasRole]);
  const isAdmin = useMemo(() => hasRole('admin'), [hasRole]);
  const isAgen = useMemo(() => hasRole('agen'), [hasRole]);
  const avatarSrc = useMemo(() => toAbsoluteUrl(user?.picture) || 'https://lh3.googleusercontent.com/a/default-user', [user?.picture]);
  const referralLink = useMemo(() => `https://alfiantour.com/id/${user?.userName || ''}`, [user?.userName]);

  useEffect(() => {
    if (!user?.id && !user?.userName) return;
    const cacheKey = getBootstrapCacheKey(user.id, user.userName);
    const cached = typeof window !== 'undefined' ? localStorage.getItem(cacheKey) : null;
    if (cached) {
      try {
        setBootstrap(JSON.parse(cached));
        return;
      } catch { }
    }
    void (async () => {
      try {
        const res = await apiGet<any>('/api/Account/akun-bootstrap');
        const data = (res as any)?.data ?? (res as any) ?? null;
        setBootstrap(data);
        if (typeof window !== 'undefined') localStorage.setItem(cacheKey, JSON.stringify(data));
      } catch { }
    })();
  }, [user?.id, user?.userName]);

  const menuItems = useMemo<MenuItem[]>(() => {
    const catalog = Array.isArray(bootstrap?.catalog) ? bootstrap!.catalog! : [];
    const allowed = new Set(Array.isArray(bootstrap?.allowedMenuKeys) ? bootstrap!.allowedMenuKeys! : []);
    const mapped = catalog
      .filter((x) => allowed.has(String(x.key)))
      .map((x) => ({ icon: String(x.icon || '•'), label: String(x.label || x.key), href: String(x.href || '/akun') }));
    const next = mapped.length > 0 ? mapped : [{ icon: '📝', label: 'Edit Profile', href: '/akun/edit-profile' }];
    if (isSuperAdmin || isAdmin) {
      const forcedAdminMenus: MenuItem[] = [
        { icon: '🗑️', label: 'Bank Sampah Paket', href: '/akun/kelola-paket/bank-sampah' },
        { icon: '📰', label: 'Kelola Feeds', href: '/akun/kelola-feeds' },
        { icon: '🖼️', label: 'Kelola Gallery', href: '/akun/kelola-gallery' },
        { icon: '🎬', label: 'Kelola Video', href: '/akun/kelola-video' },
        { icon: '📚', label: 'Kelola Materi', href: '/akun/kelola-materi' },
        { icon: '💼', label: 'Kelola Karir', href: '/akun/kelola-karir' },
        { icon: '💎', label: 'Kelola Membership', href: '/akun/kelola-membership' },
        { icon: '💰', label: 'Kelola Tabungan Jamaah', href: '/akun/kelola-tabungan-jamaah' },
        { icon: '🤝', label: 'Kelola Affiliate', href: '/akun/kelola-affiliate' },
        { icon: '🎯', label: 'Kelola Creator', href: '/akun/kelola-creator' },
        { icon: '🏦', label: 'Kelola Funding', href: '/akun/kelola-funding' },
        { icon: '📊', label: 'Commerce Ops', href: '/akun/commerce-ops' },
        { icon: '🧭', label: 'Kelola Layanan', href: '/akun/kelola-service-marketplace' },
        { icon: '🚌', label: 'Partner Transport', href: '/akun/partner-transport' },
        { icon: '📅', label: 'Kelola Event', href: '/akun/kelola-event' },
      ];
      for (const item of forcedAdminMenus) {
        if (!next.some((x) => x.href === item.href)) next.push(item);
      }
    }
    if (!next.some((x) => x.href === '/materi')) {
      next.push({ icon: '📖', label: 'Materi', href: '/materi' });
    }
    const memberMenus: MenuItem[] = [
      { icon: '💎', label: 'Membership', href: '/akun/membership' },
      { icon: '💰', label: 'Tabungan Jamaah', href: '/akun/tabungan-jamaah' },
      { icon: '🤝', label: 'Affiliate', href: '/akun/affiliate' },
      { icon: '📢', label: 'Layanan Affiliate', href: '/akun/layanan-affiliate' },
      { icon: '🎯', label: 'Creator Partner', href: '/akun/creator' },
      { icon: '🏦', label: 'Project Funding', href: '/akun/funding' },
    ];
    for (const item of memberMenus) {
      if (!next.some((x) => x.href === item.href)) next.push(item);
    }
    if (isSuperAdmin && !next.some((x) => x.href === '/akun/menu-access')) {
      next.push({ icon: '🧩', label: 'Custom Menu Access', href: '/akun/menu-access' });
    }
    return next;
  }, [bootstrap, isSuperAdmin, isAdmin]);
  const desktopMenuItems = useMemo(() => {
    const query = desktopMenuQuery.trim().toLowerCase();
    if (!query) return menuItems;
    return menuItems.filter((item) =>
      `${item.label} ${item.href}`.toLowerCase().includes(query)
    );
  }, [desktopMenuQuery, menuItems]);
  const quickAccessItems = useMemo(
    () => menuItems.filter((item) => !QUICK_ACCESS_EXCLUDED_HREFS.has(item.href)).slice(0, 6),
    [menuItems]
  );
  const desktopMenuGroups = useMemo(() => groupMenuItems(desktopMenuItems), [desktopMenuItems]);
  const mobileMenuGroups = useMemo(() => groupMenuItems(menuItems), [menuItems]);
  const roleLabel = isSuperAdmin ? 'SuperAdmin' : isAgen ? 'Agen' : 'User';
  const referralTemplates = useMemo(() => {
    const pool = [
      `Assalamu'alaikum 🙏\n\nKami di Alfian Tour fokus mendampingi umroh & haji khusus lansia (kakek-nenek), dari persiapan sampai kepulangan.\n\nInsyaAllah bukan sekadar berangkat ibadah, tapi jadi keluarga yang terus terjalin.\n\nInfo paket & konsultasi: ${referralLink}`,
      `Bismillah, untuk Ayah/Bunda dan orang tua tercinta yang ingin umroh/haji dengan pendampingan nyaman untuk lansia, bisa melalui link saya:\n${referralLink}\n\nAlfian Tour melayani dengan pendekatan kekeluargaan, sabar, dan amanah.`,
      `Sahabat, kalau ada keluarga lansia yang ingin umroh/haji dengan pelayanan yang lebih perhatian, titip lewat link saya ya:\n${referralLink}\n\nAlfian Tour: perjalanan ibadah yang hangat, pulang jadi keluarga.`,
      `Yuk bantu orang tua kita berangkat ibadah dengan tenang.\n\nAlfian Tour spesialis umroh & haji lansia (kakek-nenek), pendampingan dari awal sampai akhir.\n\nDaftar/konsultasi dari link ini:\n${referralLink}`,
      `Untuk Bapak/Ibu yang cari travel umroh-haji ramah lansia, ini link rekomendasi saya:\n${referralLink}\n\nPelayanannya bukan cuma profesional, tapi juga terasa seperti keluarga sendiri.`,
    ];
    return pool.sort(() => Math.random() - 0.5).slice(0, 3);
  }, [referralLink]);

  const copyText = async (text: string, successMessage: string) => {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const el = document.createElement('textarea');
        el.value = text;
        document.body.appendChild(el);
        el.select();
        document.execCommand('copy');
        document.body.removeChild(el);
      }
      setCopyInfo(successMessage);
      setTimeout(() => setCopyInfo(''), 1800);
    } catch {
      setCopyInfo('Gagal menyalin. Coba copy manual.');
      setTimeout(() => setCopyInfo(''), 1800);
    }
  };

  if (loading) {
    return (
      <div className="p-4 animate-fade-up">
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="w-16 h-16 rounded-full shimmer-bg" />
          <div className="w-32 h-4 shimmer-bg rounded" />
          <div className="w-48 h-3 shimmer-bg rounded" />
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="hidden xl:grid xl:grid-cols-[280px_minmax(0,1fr)] xl:items-start xl:gap-6 animate-fade-up">
        <aside className="sticky top-0 space-y-4">
          <div className="g-main overflow-hidden rounded-3xl p-6 text-white shadow-lg shadow-primary-100">
            <div className="flex flex-col items-center text-center">
              <div className="h-20 w-20 overflow-hidden rounded-full border-4 border-white/40 bg-white/20">
                <Image
                  src={avatarSrc}
                  alt={user?.name || ''}
                  width={80}
                  height={80}
                  className="h-full w-full object-cover"
                  unoptimized
                />
              </div>
              <p className="mt-4 text-xs font-medium text-white/70">Selamat datang</p>
              <h1 className="mt-1 max-w-full truncate text-lg font-extrabold">
                {user?.name}
              </h1>
              <p className="mt-1 max-w-full truncate text-xs text-white/70">
                {user?.email}
              </p>
              <span className="mt-3 rounded-full border border-white/30 bg-white/15 px-3 py-1 text-[11px] font-bold">
                {roleLabel}
              </span>
            </div>
            <Link
              href="/akun/edit-profile"
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl border border-white/30 bg-white/15 px-4 py-2.5 text-xs font-bold transition hover:bg-white/25"
            >
              <span>✎</span>
              <span>Edit Profil</span>
            </Link>
          </div>

          <div className="rounded-3xl border border-zinc-200 bg-white p-4">
            <p className="px-2 text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-400">
              Akses cepat
            </p>
            <nav className="mt-2 space-y-1">
              {quickAccessItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-semibold text-zinc-600 transition hover:bg-primary-50 hover:text-primary-700"
                >
                  <span className="text-base">{item.icon}</span>
                  <span className="min-w-0 flex-1 truncate">{item.label}</span>
                  <span className="text-zinc-300">›</span>
                </Link>
              ))}
            </nav>
          </div>

          <button
            type="button"
            onClick={() => {
              logout();
              router.replace('/login');
            }}
            className="flex w-full items-center justify-center gap-2 rounded-2xl border border-red-100 bg-red-50 py-3 text-sm font-bold text-red-500 transition hover:bg-red-100"
          >
            <span>🚪</span>
            <span>Keluar</span>
          </button>
        </aside>

        <section className="min-w-0 space-y-5">
          <div className="rounded-3xl border border-zinc-200 bg-white p-6">
            <div className="flex items-start justify-between gap-6">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary-600">
                  Dashboard Akun
                </p>
                <h2 className="mt-1 text-2xl font-extrabold text-zinc-900">
                  Menu dan layanan akun
                </h2>
                <p className="mt-1 text-sm text-zinc-500">
                  Pilih fitur yang ingin dikelola sesuai akses akun Anda.
                </p>
              </div>
              <div className="rounded-2xl bg-primary-50 px-4 py-3 text-right">
                <p className="text-2xl font-extrabold text-primary-700">
                  {menuItems.length}
                </p>
                <p className="text-[10px] font-bold uppercase tracking-wider text-primary-500">
                  Menu tersedia
                </p>
              </div>
            </div>

            <div className="relative mt-6">
              <svg
                className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
              </svg>
              <input
                type="search"
                value={desktopMenuQuery}
                onChange={(event) => setDesktopMenuQuery(event.target.value)}
                placeholder="Cari menu akun..."
                aria-label="Cari menu akun"
                className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 py-3.5 pl-11 pr-12 text-sm font-medium text-zinc-800 outline-none transition placeholder:text-zinc-400 focus:border-primary-400 focus:bg-white focus:ring-4 focus:ring-primary-100"
              />
              {desktopMenuQuery ? (
                <button
                  type="button"
                  onClick={() => setDesktopMenuQuery('')}
                  aria-label="Hapus pencarian menu"
                  className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700"
                >
                  ×
                </button>
              ) : null}
            </div>
          </div>

          {desktopMenuItems.length > 0 ? (
            <div className="space-y-5">
              {desktopMenuGroups.map((group) => (
                <div key={group.key} className="rounded-3xl border border-zinc-200 bg-white p-5">
                  <button
                    type="button"
                    onClick={() => toggleGroup(group.key)}
                    className="w-full mb-4 flex items-start justify-between gap-4 text-left select-none focus:outline-none group/header"
                  >
                    <div className="min-w-0 flex-1">
                      <h3 className="text-base font-extrabold text-zinc-900 group-hover/header:text-primary-700 transition-colors">
                        {group.title}
                      </h3>
                      <p className="mt-0.5 text-xs text-zinc-500 leading-relaxed">{group.description}</p>
                    </div>
                    <div className="flex items-center gap-2.5 shrink-0 pt-0.5">
                      <span className="rounded-full bg-zinc-100 px-3 py-1 text-[10px] font-bold text-zinc-500">
                        {group.items.length} menu
                      </span>
                      <div className="rounded-full p-1 bg-zinc-50 border border-zinc-100 group-hover/header:bg-zinc-100 transition-colors">
                        <svg
                          className={`h-3.5 w-3.5 text-zinc-500 transition-transform duration-300 ${
                            isGroupCollapsed(group.key) ? '-rotate-90' : ''
                          }`}
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="3"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                        </svg>
                      </div>
                    </div>
                  </button>
                  <div
                    className={`transition-all duration-300 ease-in-out overflow-hidden ${
                      isGroupCollapsed(group.key)
                        ? 'max-h-0 opacity-0 pointer-events-none'
                        : 'max-h-[1000px] opacity-100'
                    }`}
                  >
                    <div className="grid grid-cols-2 gap-3 pt-1">
                      {group.items.map((item) => (
                        <Link
                          key={item.href}
                          href={item.href}
                          className="group flex min-h-24 items-start gap-4 rounded-2xl border border-zinc-100 bg-zinc-50/60 p-4 transition hover:-translate-y-0.5 hover:border-primary-300 hover:bg-white hover:shadow-lg hover:shadow-primary-100"
                        >
                          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-2xl shadow-sm transition group-hover:bg-primary-50">
                            {item.icon}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block font-extrabold text-zinc-900 group-hover:text-primary-700">
                              {item.label}
                            </span>
                            <span className="mt-1 block truncate text-xs text-zinc-400">
                              {item.href}
                            </span>
                          </span>
                          <span className="mt-1 text-xl text-zinc-300 transition group-hover:translate-x-1 group-hover:text-primary-500">
                            →
                          </span>
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-3xl border border-dashed border-zinc-300 bg-white px-6 py-12 text-center">
              <p className="font-bold text-zinc-800">Menu tidak ditemukan</p>
              <p className="mt-1 text-sm text-zinc-500">
                Coba gunakan kata kunci lain.
              </p>
            </div>
          )}

          {isAgen ? (
            <div className="rounded-3xl border border-zinc-200 bg-white p-6 space-y-4">
              <div>
                <h2 className="text-lg font-extrabold text-zinc-900">Link Referral Agen</h2>
                <p className="mt-1 text-sm text-zinc-500">
                  Bagikan link dan template promosi kepada calon jamaah.
                </p>
              </div>

              <div className="flex items-center gap-3 rounded-2xl border bg-zinc-50 p-3">
                <code className="min-w-0 flex-1 truncate text-xs">{referralLink}</code>
                <button
                  type="button"
                  onClick={() => copyText(referralLink, 'Link referral berhasil disalin')}
                  className="shrink-0 rounded-xl bg-primary-600 px-4 py-2 text-xs font-bold text-white hover:bg-primary-700"
                >
                  Copy Link
                </button>
              </div>

              <div className="grid grid-cols-3 gap-3">
                {referralTemplates.map((text, idx) => (
                  <div key={idx} className="flex flex-col rounded-2xl border p-4">
                    <p className="line-clamp-6 flex-1 whitespace-pre-line text-xs leading-relaxed text-zinc-600">
                      {text}
                    </p>
                    <button
                      type="button"
                      onClick={() => copyText(text, `Template ${idx + 1} berhasil disalin`)}
                      className="mt-3 rounded-xl border px-3 py-2 text-xs font-bold hover:bg-zinc-50"
                    >
                      Copy Template {idx + 1}
                    </button>
                  </div>
                ))}
              </div>

              {copyInfo ? <p className="text-xs font-medium text-emerald-600">{copyInfo}</p> : null}
            </div>
          ) : null}
        </section>
      </div>

      <div className="p-4 space-y-4 animate-fade-up xl:hidden">
        <div className="g-main rounded-3xl p-5 text-white">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-4 min-w-0">
              <div className="w-14 h-14 rounded-full bg-white/20 overflow-hidden flex-shrink-0 border-2 border-white/40">
                <Image src={avatarSrc} alt={user?.name || ''} width={56} height={56} className="object-cover" unoptimized />
              </div>
              <div className="min-w-0">
                <div className="text-xs opacity-80">Selamat datang</div>
                <div className="font-bold text-base truncate">{user?.name}</div>
                <div className="text-[10px] opacity-70 truncate">{user?.email}</div>
                <div className="text-[10px] opacity-90 mt-1">Role: {roleLabel}</div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => router.push('/akun/edit-profile')}
              className="shrink-0 h-9 w-9 rounded-full bg-white/20 border border-white/40 inline-flex items-center justify-center hover:bg-white/30 transition-colors"
              aria-label="Edit Profile"
              title="Edit Profile"
            >
              ✎
            </button>
          </div>
        </div>

        <div className="space-y-3">
          {mobileMenuGroups.map((group) => (
            <div key={group.key} className="bg-white border rounded-3xl overflow-hidden">
              <button
                type="button"
                onClick={() => toggleGroup(group.key)}
                className="w-full text-left border-b border-zinc-100 px-5 py-4 focus:outline-none hover:bg-zinc-50/50 transition-colors flex items-center justify-between gap-3 select-none group/header"
              >
                <div className="min-w-0 flex-1">
                  <h2 className="text-sm font-extrabold text-zinc-900 group-hover/header:text-primary-700 transition-colors">
                    {group.title}
                  </h2>
                  <p className="mt-0.5 text-[11px] text-zinc-500 leading-relaxed">{group.description}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-[10px] font-bold text-zinc-500">
                    {group.items.length}
                  </span>
                  <div className="rounded-full p-1 bg-zinc-50 border border-zinc-100 group-hover/header:bg-zinc-100 transition-colors">
                    <svg
                      className={`h-3 w-3 text-zinc-500 transition-transform duration-300 ${
                        isGroupCollapsed(group.key) ? '-rotate-90' : ''
                      }`}
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3.5"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                    </svg>
                  </div>
                </div>
              </button>
              <div
                className={`transition-all duration-300 ease-in-out overflow-hidden ${
                  isGroupCollapsed(group.key)
                    ? 'max-h-0 opacity-0 pointer-events-none'
                    : 'max-h-[1000px] opacity-100'
                }`}
              >
                <div className="divide-y divide-zinc-50">
                  {group.items.map((item) => (
                    <button
                      key={item.href}
                      type="button"
                      onClick={() => router.push(item.href)}
                      className="w-full flex items-center gap-3 px-5 py-4 text-sm font-medium hover:bg-zinc-50 transition-colors text-left"
                    >
                      <span className="text-xl">{item.icon}</span>
                      <span>{item.label}</span>
                      <span className="ml-auto text-zinc-300">›</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {isAgen ? (
          <div className="bg-white border rounded-3xl p-5 space-y-3">
            <h2 className="text-sm font-bold">Link Referral Agen</h2>
            <p className="text-xs text-zinc-500">
              Bagikan link ini untuk mengajak jamaah umroh/haji lansia. Pendekatan kita: hangat, sabar, dan setelah pulang tetap terjalin sebagai keluarga.
            </p>

            <div className="rounded-2xl border bg-zinc-50 p-3 text-xs font-mono break-all">{referralLink}</div>
            <button
              type="button"
              onClick={() => copyText(referralLink, 'Link referral berhasil disalin')}
              className="w-full rounded-xl border py-2 text-xs font-semibold"
            >
              Copy Link Referral
            </button>

            <div className="space-y-2">
              <div className="text-xs font-semibold text-zinc-700">Template Copywriting (Siap Copy)</div>
              {referralTemplates.map((text, idx) => (
                <div key={idx} className="rounded-2xl border p-3 space-y-2">
                  <p className="text-[11px] text-zinc-700 whitespace-pre-line">{text}</p>
                  <button
                    type="button"
                    onClick={() => copyText(text, `Template ${idx + 1} berhasil disalin`)}
                    className="rounded-lg border px-3 py-1.5 text-[11px] font-semibold"
                  >
                    Copy Template {idx + 1}
                  </button>
                </div>
              ))}
            </div>

            {copyInfo ? <p className="text-[11px] text-emerald-600">{copyInfo}</p> : null}
          </div>
        ) : null}

        <button
          onClick={() => {
            logout();
            router.replace('/login');
          }}
          className="w-full flex items-center justify-center gap-2 bg-red-50 text-red-500 rounded-3xl py-3.5 text-sm font-semibold hover:bg-red-100 transition-colors"
        >
          <span>🚪</span>
          <span>Keluar</span>
        </button>
      </div>
    </>
  );
}
