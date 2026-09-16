'use client';

import { useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { getAuthState } from '@/lib/auth';

const normalizeRole = (v: string) => v.trim().toLowerCase();

export default function AkunRouteGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname() || '';
  const [ready, setReady] = useState(false);
  const [allowed, setAllowed] = useState(false);

  const locale = useMemo(() => {
    const seg = pathname.split('/').filter(Boolean)[0] || 'id';
    return ['id', 'en', 'ar'].includes(seg) ? seg : 'id';
  }, [pathname]);

  useEffect(() => {
    if (!pathname) return;

    const auth = getAuthState();
    const search = typeof window !== 'undefined' ? window.location.search : '';
    const returnUrl = `${pathname}${search || ''}`;

    if (!auth?.token || !auth?.user) {
      setReady(true);
      setAllowed(false);
      router.replace(`/${locale}/login?returnUrl=${encodeURIComponent(returnUrl)}`);
      return;
    }

    const pathNoLocale = pathname.replace(/^\/(id|en|ar)(?=\/|$)/i, '') || '/';
    const roleSet = new Set((auth.user.roles || []).map((r) => normalizeRole(String(r))));
    const isSuperAdmin = roleSet.has('superadmin');
    const isAdmin = roleSet.has('admin');
    const isProtectedAdminArea = /^\/akun\/master(?:\/|$)/.test(pathNoLocale) || /^\/akun\/kelola-(?:.+)/.test(pathNoLocale);
    const isCreatorAdminArea = /^\/akun\/kelola-creator(?:\/|$)/.test(pathNoLocale);
    const isFundingAdminArea = /^\/akun\/kelola-funding(?:\/|$)/.test(pathNoLocale);
    const isCareerAdminArea = /^\/akun\/kelola-karir(?:\/|$)/.test(pathNoLocale);
    const isServiceMarketplaceArea = /^\/akun\/kelola-service-marketplace(?:\/|$)/.test(pathNoLocale);
    const isPartnerTransportArea = /^\/akun\/partner-transport(?:\/|$)/.test(pathNoLocale);
    const isEventAdminArea = /^\/akun\/kelola-event(?:\/|$)/.test(pathNoLocale);
    const isCommerceOpsArea = /^\/akun\/commerce-ops(?:\/|$)/.test(pathNoLocale);
    const isOrdersArea = /^\/akun\/orders(?:\/|$)/.test(pathNoLocale);
    const isInventoryArea = /^\/akun\/inventory(?:\/|$)/.test(pathNoLocale);
    const isCrmArea = /^\/akun\/crm(?:\/|$)/.test(pathNoLocale);
    const isExecutiveKpiArea = /^\/akun\/executive-kpi(?:\/|$)/.test(pathNoLocale);
    const isManager = roleSet.has('manager');
    const isAgen = roleSet.has('agen');

    if ((isCreatorAdminArea || isFundingAdminArea || isCareerAdminArea || isServiceMarketplaceArea || isPartnerTransportArea || isEventAdminArea) && !(isSuperAdmin || isAdmin || isManager)) {
      setReady(true);
      setAllowed(false);
      router.replace(`/${locale}/401?returnUrl=${encodeURIComponent(returnUrl)}`);
      return;
    }
    if (isCommerceOpsArea && !(isSuperAdmin || isAdmin || isManager)) {
      setReady(true);
      setAllowed(false);
      router.replace(`/${locale}/401?returnUrl=${encodeURIComponent(returnUrl)}`);
      return;
    }
    if (isProtectedAdminArea && !isCreatorAdminArea && !isFundingAdminArea && !isCareerAdminArea && !isServiceMarketplaceArea && !isEventAdminArea && !isSuperAdmin) {
      setReady(true);
      setAllowed(false);
      router.replace(`/${locale}/401?returnUrl=${encodeURIComponent(returnUrl)}`);
      return;
    }
    if (isOrdersArea && !(isSuperAdmin || isAdmin)) {
      setReady(true);
      setAllowed(false);
      router.replace(`/${locale}/401?returnUrl=${encodeURIComponent(returnUrl)}`);
      return;
    }
    if (isInventoryArea && !(isSuperAdmin || isAdmin || isManager)) {
      setReady(true);
      setAllowed(false);
      router.replace(`/${locale}/401?returnUrl=${encodeURIComponent(returnUrl)}`);
      return;
    }
    if (isExecutiveKpiArea && !(isSuperAdmin || isAdmin || isManager)) {
      setReady(true);
      setAllowed(false);
      router.replace(`/${locale}/401?returnUrl=${encodeURIComponent(returnUrl)}`);
      return;
    }
    if (isCrmArea && !(isSuperAdmin || isAdmin || isManager || isAgen)) {
      setReady(true);
      setAllowed(false);
      router.replace(`/${locale}/401?returnUrl=${encodeURIComponent(returnUrl)}`);
      return;
    }

    setAllowed(true);
    setReady(true);
  }, [locale, pathname, router]);

  if (!ready) {
    return (
      <div className="p-4 min-h-[60vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 rounded-full border-2 border-zinc-200 border-t-primary-600 animate-spin" />
          <p className="text-xs text-zinc-500">Memeriksa autentikasi...</p>
        </div>
      </div>
    );
  }

  if (!allowed) {
    return (
      <div className="p-4 min-h-[60vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 rounded-full border-2 border-zinc-200 border-t-primary-600 animate-spin" />
          <p className="text-xs text-zinc-500">Mengalihkan ke halaman login...</p>
        </div>
      </div>
    );
  }
  return <>{children}</>;
}
