import Image from 'next/image';
import { Link } from '@/i18n/routing-patch';
import { API_BASE_URL } from '@/lib/api-client';

async function getTransportPackages() {
  try {
    const res = await fetch(`${API_BASE_URL}/api/TransportPartner/public/packages`, { cache: 'no-store' });
    if (!res.ok) return [];
    const json = await res.json();
    return json?.data ?? [];
  } catch {
    return [];
  }
}

export default async function TransportPackagesPage() {
  const rows = await getTransportPackages();
  return (
    <div className="px-4 py-6 space-y-4">
      <div className="rounded-3xl border bg-white p-5">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary-600">Partner Transport</p>
        <h1 className="mt-1 text-xl font-extrabold">Paket Bus & Transport Partner</h1>
        <p className="mt-1 text-xs text-zinc-500">Paket perjalanan dari mitra transport yang bekerja sama dengan Alfian Tour.</p>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-3xl border border-dashed bg-white p-10 text-center text-sm text-zinc-500">Belum ada paket transport aktif.</div>
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          {rows.map((x: any) => (
            <Link key={x.slug} href={`/transport/${x.slug}`} className="group overflow-hidden rounded-3xl border bg-white transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary-100">
              <div className="relative h-44 bg-zinc-100">
                {x.coverImageUrl ? <Image src={x.coverImageUrl} alt={x.title || 'Transport'} fill className="object-cover" unoptimized /> : null}
              </div>
              <div className="space-y-2 p-4">
                <div className="flex items-start justify-between gap-2">
                  <h2 className="font-extrabold text-zinc-900 group-hover:text-primary-700">{x.title}</h2>
                  <span className="shrink-0 rounded-full bg-zinc-100 px-2 py-1 text-[10px] font-bold text-zinc-600">{x.availableSeats} seat</span>
                </div>
                <p className="text-xs text-zinc-500">{x.originCity} - {x.destinationCity}</p>
                <p className="line-clamp-2 text-xs text-zinc-600">{x.shortDescription || x.routeSummary || '-'}</p>
                <div className="text-sm font-extrabold">{x.currency || 'IDR'} {Number(x.sellPricePerSeat || 0).toLocaleString('id-ID')} / seat</div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
