'use client';

import { useEffect, useMemo, useState } from 'react';
import { getAuthState } from '@/lib/auth';
import { apiGet, apiPost } from '@/lib/api-client';
import { Link } from '@/i18n/routing-patch';
import { Skeleton } from '@/components/Skeleton';

export default function AgenKomisiPage() {
  const [loading, setLoading] = useState(false);
  const [requesting, setRequesting] = useState(false);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState('');

  const roleNames = useMemo(() => {
    const roles = getAuthState()?.user?.roles;
    return Array.isArray(roles) ? roles.map((x) => String(x).toLowerCase()) : [];
  }, []);

  const isAgen = roleNames.includes('agen');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await apiGet<any>('/api/BusinessInsights/referral/agent/commissions');
      setData(res?.data ?? null);
    } catch (e: any) {
      setError(e?.message || 'Gagal memuat data komisi');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isAgen) return;
    void load();
  }, [isAgen]);

  if (!isAgen) {
    return (
      <div className="p-4 animate-fade-up">
        <div className="bg-white border rounded-3xl p-5 text-xs text-zinc-600">
          Halaman ini khusus role Agen.
        </div>
      </div>
    );
  }

  const rows = Array.isArray(data?.items) ? data.items : [];
  const totalPending = Number(data?.totalPending || 0);
  const totalRequested = Number(data?.totalRequested || 0);
  const totalApproved = Number(data?.totalApproved || 0);
  const totalPaid = Number(data?.totalPaid || 0);
  const minPayout = Number(data?.minPayout || 50000);

  return (
    <div className="p-4 space-y-4 animate-fade-up">
      <div className="bg-white border rounded-3xl p-5">
        <h1 className="text-lg font-extrabold g-text">Komisi Agen</h1>
        <p className="text-xs text-zinc-500 mt-1">Komisi real dari booking referral Anda.</p>
      </div>

      {loading ? (
        <div className="space-y-2">
          <div className="bg-white border rounded-2xl p-3 space-y-2">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-8 w-full rounded-xl" />
          </div>
          <div className="flex items-center gap-2 text-xs text-zinc-500">
            <span className="h-4 w-4 rounded-full border-2 border-zinc-300 border-t-primary-600 animate-spin" />
            Memuat data komisi...
          </div>
        </div>
      ) : null}
      {!loading && error ? <div className="text-xs text-red-600">{error}</div> : null}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
        <div className="bg-white border rounded-2xl p-3">
          <div className="text-zinc-500">Pending</div>
          <div className="text-sm font-bold mt-1">Rp {totalPending.toLocaleString('id-ID')}</div>
        </div>
         <div className="bg-white border rounded-2xl p-3">
          <div className="text-zinc-500">Requested</div>
          <div className="text-sm font-bold mt-1">Rp {totalRequested.toLocaleString('id-ID')}</div>
        </div>
         <div className="bg-white border rounded-2xl p-3">
          <div className="text-zinc-500">Approved</div>
          <div className="text-sm font-bold mt-1">Rp {totalApproved.toLocaleString('id-ID')}</div>
        </div>
         <div className="bg-white border rounded-2xl p-3">
          <div className="text-zinc-500">Paid</div>
          <div className="text-sm font-bold mt-1">Rp {totalPaid.toLocaleString('id-ID')}</div>
        </div>
      </div>

      <div className="bg-white border rounded-3xl p-4 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-bold">Pencairan Komisi</h2>
          <button
            type="button"
            disabled={requesting || totalPending < minPayout}
            onClick={async () => {
              setRequesting(true);
              setError('');
              try {
                await apiPost('/api/BusinessInsights/referral/agent/request-payout');
                await load();
              } catch (e: any) {
                setError(e?.message || 'Gagal request payout');
              } finally {
                setRequesting(false);
              }
            }}
            className="rounded-lg bg-primary-600 text-white px-3 py-1.5 text-[11px] disabled:opacity-50"
          >
            {requesting ? 'Memproses...' : 'Request Payout'}
          </button>
        </div>
        <div className="text-[11px] text-zinc-500">
          Minimal pencairan Rp {minPayout.toLocaleString('id-ID')} • pending saat ini Rp {totalPending.toLocaleString('id-ID')}
        </div>
      </div>

      <div className="bg-white border rounded-3xl p-4 space-y-2">
        <h2 className="text-sm font-bold">Riwayat Komisi Booking</h2>
        {rows.length === 0 ? <div className="text-xs text-zinc-500">Belum ada komisi dari booking referral.</div> : null}
        {rows.map((x: any) => (
          <div key={x.bookingId} className="border rounded-xl px-3 py-2 text-xs space-y-1">
            <div className="flex items-center justify-between gap-2">
              <span className="font-semibold">{x.customerName || '-'}</span>
              <span className="text-[11px] uppercase tracking-wide">{x.commissionStatus || '-'}</span>
            </div>
            <div className="text-zinc-500">Booking #{x.bookingId} • {x.program || '-'}</div>
            <div className="flex items-center justify-between">
              <span>Komisi</span>
              <span className="font-semibold">Rp {Number(x.commissionAmount || 0).toLocaleString('id-ID')}</span>
            </div>
            <div className="text-[11px] text-zinc-500">Sumber: {x.commissionSource || '-'}</div>
          </div>
        ))}
      </div>

      <Link href="/akun" className="inline-flex items-center gap-2 text-sm text-primary-600">
        <span aria-hidden>←</span>
        <span>Kembali ke Akun</span>
      </Link>
    </div>
  );
}


