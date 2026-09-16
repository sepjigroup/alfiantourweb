'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { apiGet } from '@/lib/api-client';
import { getAuthState } from '@/lib/auth';
import { Skeleton } from '@/components/Skeleton';

type BookingDetail = {
  id: number;
  customerName?: string;
  customerEmail?: string;
  customerWhatsApp?: string;
  refAgentUsername?: string;
  sessionId?: string;
  paxCount: number;
  jamaahCount: number;
  revenueAmount: number;
  costAmount: number;
  profitAmount: number;
  status?: string;
  createdAt?: string;
  detail?: Record<string, unknown> | null;
  jamaahs?: Array<{
    id: number;
    fullName?: string;
    gender?: string;
    passportNo?: string;
    birthDate?: string;
    phone?: string;
    email?: string;
  }>;
};

type ApiResponse<T> = {
  data?: T;
  message?: string;
};

export default function OrderDetailPage() {
  const params = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [row, setRow] = useState<BookingDetail | null>(null);
  const id = Number(params.id);

  const roleNames = useMemo(() => {
    const roles = getAuthState()?.user?.roles;
    return Array.isArray(roles) ? roles.map((x) => String(x).toLowerCase()) : [];
  }, []);

  useEffect(() => {
    const auth = getAuthState();
    const returnUrl = `${window.location.pathname}${window.location.search || ''}`;
    const locale = window.location.pathname.split('/').filter(Boolean)[0] || 'id';
    if (!auth?.token) {
      window.location.replace(`/${locale}/login?returnUrl=${encodeURIComponent(returnUrl)}`);
      return;
    }
    const canAccess = roleNames.some((r) => r === 'superadmin' || r === 'admin');
    if (!canAccess) {
      window.location.replace(`/${locale}/401?returnUrl=${encodeURIComponent(returnUrl)}`);
      return;
    }
  }, [roleNames]);

  useEffect(() => {
    const auth = getAuthState();
    const canAccess = roleNames.some((r) => r === 'superadmin' || r === 'admin');
    if (!auth?.token || !canAccess) return;
    if (!id || Number.isNaN(id)) {
      setError('ID order tidak valid');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');
    void apiGet<ApiResponse<BookingDetail>>(`/api/BusinessInsights/pack/bookings/${id}`)
      .then((res) => setRow(res.data ?? null))
      .catch((e) => setError(e instanceof Error ? e.message : 'Gagal memuat detail order'))
      .finally(() => setLoading(false));
  }, [id, roleNames]);

  if (loading) {
    return (
      <div className="p-4 space-y-4 animate-fade-up">
        <div className="bg-white border rounded-2xl p-4 space-y-2">
          <Skeleton className="h-5 w-44" />
          <Skeleton className="h-3 w-40 rounded-full" />
          <Skeleton className="h-3 w-56 rounded-full" />
        </div>
        <div className="bg-white border rounded-2xl p-4 space-y-2">
          <Skeleton className="h-5 w-36" />
          <Skeleton className="h-3 w-full rounded-full" />
          <Skeleton className="h-3 w-4/5 rounded-full" />
        </div>
        <div className="flex items-center gap-2 text-xs text-zinc-500">
          <span className="h-4 w-4 rounded-full border-2 border-zinc-300 border-t-primary-600 animate-spin" />
          Memuat detail order...
        </div>
      </div>
    );
  }
  if (error) return <div className="p-4 text-xs text-red-600">{error}</div>;
  if (!row) return <div className="p-4 text-xs text-zinc-500">Order tidak ditemukan.</div>;

  const detail = row.detail ?? {};
  const departureDate = typeof detail.departureDate === 'string' ? detail.departureDate : '';

  return (
    <div className="p-4 space-y-4">
      <div className="bg-white border rounded-2xl p-4">
        <h1 className="text-sm font-bold">Detail Order #{row.id}</h1>
        <div className="mt-2 text-xs text-zinc-700 space-y-1">
          <div>Status: {row.status || '-'}</div>
          <div>Created: {row.createdAt ? new Date(row.createdAt).toLocaleString('id-ID') : '-'}</div>
          <div>Customer: {row.customerName || '-'}</div>
          <div>WA: {row.customerWhatsApp || '-'}</div>
          <div>Ref Agent: {row.refAgentUsername || '-'}</div>
        </div>
      </div>

      <div className="bg-white border rounded-2xl p-4">
        <h2 className="text-sm font-semibold">Ringkasan Biaya</h2>
        <div className="mt-2 text-xs text-zinc-700 space-y-1">
          <div>Pax: {row.paxCount}</div>
          <div>Jamaah: {row.jamaahCount}</div>
          <div>Keberangkatan: {departureDate ? new Date(departureDate).toLocaleDateString('id-ID') : '-'}</div>
          <div>Total Revenue: Rp {Number(row.revenueAmount || 0).toLocaleString('id-ID')}</div>
          <div>Cost: Rp {Number(row.costAmount || 0).toLocaleString('id-ID')}</div>
          <div>Profit: Rp {Number(row.profitAmount || 0).toLocaleString('id-ID')}</div>
        </div>
      </div>

      <div className="bg-white border rounded-2xl p-4">
        <h2 className="text-sm font-semibold">Data Jamaah</h2>
        <div className="mt-2 space-y-2">
          {(row.jamaahs ?? []).length === 0 ? <div className="text-xs text-zinc-500">Belum ada data jamaah.</div> : null}
          {(row.jamaahs ?? []).map((j) => (
            <div key={j.id} className="border rounded-xl p-2 text-xs text-zinc-700">
              <div className="font-semibold">{j.fullName || '-'}</div>
              <div>Gender: {j.gender || '-'}</div>
              <div>Passport: {j.passportNo || '-'}</div>
              <div>Phone: {j.phone || '-'}</div>
              <div>Email: {j.email || '-'}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

