'use client';

import { useEffect, useState } from 'react';
import { Link } from '@/i18n/routing-patch';
import { apiGet } from '@/lib/api-client';

const money = (v: unknown) => `Rp ${Number(v || 0).toLocaleString('id-ID')}`;
const date = (v?: string | null) => v ? new Date(v).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '-';

export default function MembershipPage() {
  const [loading, setLoading] = useState(true);
  const [me, setMe] = useState<any>(null);
  const [shares, setShares] = useState<any[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    void (async () => {
      setLoading(true);
      setError('');
      try {
        const [meRes, shareRes] = await Promise.all([
          apiGet<any>('/api/Membership/me'),
          apiGet<any>('/api/Membership/product-shares?page=1&pageSize=50'),
        ]);
        setMe(meRes?.data ?? null);
        setShares(shareRes?.data?.items ?? []);
      } catch (e: any) {
        setError(e?.message || 'Gagal memuat membership');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const membership = me?.membership;

  return (
    <div className="p-4 space-y-4 animate-fade-up">
      <div className="bg-white border rounded-3xl p-5">
        <h1 className="text-lg font-extrabold g-text">Membership</h1>
        <p className="text-xs text-zinc-500 mt-1">Status akses premium dan produk khusus sesuai role akun Anda.</p>
      </div>

      {loading ? <div className="text-xs text-zinc-500">Memuat data...</div> : null}
      {error ? <div className="text-xs text-red-600">{error}</div> : null}

      <div className="bg-white border rounded-3xl p-5 space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-xs text-zinc-500">Status</div>
            <div className="text-base font-bold">{me?.isPremium ? 'Premium Aktif' : 'Belum Aktif / Expired'}</div>
          </div>
          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${me?.isPremium ? 'bg-emerald-50 text-emerald-700' : 'bg-zinc-100 text-zinc-600'}`}>
            {membership?.status || 'Nonaktif'}
          </span>
        </div>
        {membership ? (
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="rounded-2xl bg-zinc-50 p-3"><div className="text-zinc-500">Plan</div><div className="font-semibold">{membership.planName || '-'}</div></div>
            <div className="rounded-2xl bg-zinc-50 p-3"><div className="text-zinc-500">Sisa Hari</div><div className="font-semibold">{membership.daysRemaining}</div></div>
            <div className="rounded-2xl bg-zinc-50 p-3"><div className="text-zinc-500">Mulai</div><div className="font-semibold">{date(membership.startDate)}</div></div>
            <div className="rounded-2xl bg-zinc-50 p-3"><div className="text-zinc-500">Berakhir</div><div className="font-semibold">{date(membership.endDate)}</div></div>
          </div>
        ) : <p className="text-xs text-zinc-500">Belum ada data membership aktif.</p>}
      </div>

      <div className="bg-white border rounded-3xl p-5 space-y-3">
        <h2 className="text-sm font-bold">Produk Khusus Role Saya</h2>
        {shares.length === 0 ? <p className="text-xs text-zinc-500">Belum ada produk khusus yang dibagikan untuk role Anda.</p> : null}
        {shares.map((x) => (
          <div key={x.id} className="rounded-2xl border p-3 text-xs space-y-1">
            <div className="font-semibold text-sm">{x.title}</div>
            {x.description ? <p className="text-zinc-600 whitespace-pre-line">{x.description}</p> : null}
            <div className="flex items-center justify-between gap-2">
              <span className="text-zinc-500">{x.sourceType}</span>
              {x.externalUrl ? <a className="text-primary-600 font-semibold" href={x.externalUrl} target="_blank" rel="noreferrer">Buka</a> : null}
            </div>
          </div>
        ))}
      </div>

      <Link href="/akun" className="text-sm text-primary-600">Kembali ke Akun</Link>
    </div>
  );
}

