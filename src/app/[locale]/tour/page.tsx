import Image from 'next/image';
import { Link } from '@/i18n/routing-patch';
import { API_BASE_URL } from '@/lib/api-client';

async function getProducts() {
  try {
    const res = await fetch(`${API_BASE_URL}/api/TravelGeneral/public/products`, { cache: 'no-store' });
    if (!res.ok) return [];
    const json = await res.json();
    return json?.data?.items ?? [];
  } catch {
    return [];
  }
}

export default async function TourListPage() {
  const rows = await getProducts();
  return (
    <div className="px-4 py-6 space-y-4">
      <div className="bg-white border rounded-3xl p-5">
        <h1 className="text-xl font-extrabold">Wisata Domestik & Mancanegara</h1>
        <p className="text-xs text-zinc-500 mt-1">Paket tour umum terpisah dari produk Umrah/Haji.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {rows.map((x: any) => (
          <Link key={x.slug} href={`/tour/${x.slug}`} className="bg-white border rounded-2xl overflow-hidden hover:shadow-sm">
            <div className="relative h-44 bg-zinc-100">
              {x.coverImageUrl ? (
                <Image src={x.coverImageUrl} alt={x.name || 'Tour'} fill className="object-cover" unoptimized />
              ) : null}
            </div>
            <div className="p-3 space-y-1">
              <div className="text-sm font-bold">{x.name}</div>
              <div className="text-[11px] text-zinc-500">{x.travelScope} • {x.productKind} • {x.country || '-'} {x.city || ''}</div>
              <div className="text-xs font-semibold">{x.baseCurrency} {Number(x.basePrice || 0).toLocaleString('id-ID')}</div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

