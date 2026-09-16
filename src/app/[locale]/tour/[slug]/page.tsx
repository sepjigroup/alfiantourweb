import Image from 'next/image';
import { notFound } from 'next/navigation';
import { API_BASE_URL } from '@/lib/api-client';

async function getDetail(slug: string) {
  try {
    const res = await fetch(`${API_BASE_URL}/api/TravelGeneral/public/products/${encodeURIComponent(slug)}`, { cache: 'no-store' });
    if (!res.ok) return null;
    const json = await res.json();
    return json?.data ?? null;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const row = await getDetail(slug);
  if (!row) return { title: 'Paket Tour' };
  return {
    title: row.seoTitle || row.name,
    description: row.seoDescription || row.description || `Paket ${row.name}`,
    openGraph: {
      title: row.seoTitle || row.name,
      description: row.seoDescription || row.description || `Paket ${row.name}`,
      images: row.coverImageUrl ? [row.coverImageUrl] : [],
      type: 'website',
    },
  };
}

export default async function TourDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const row = await getDetail(slug);
  if (!row) return notFound();

  const ld = {
    '@context': 'https://schema.org',
    '@type': 'Trip',
    name: row.name,
    description: row.seoDescription || row.description || row.name,
    image: row.coverImageUrl ? [row.coverImageUrl] : undefined,
    touristType: row.travelScope,
    itinerary: (row.itineraries || []).map((x: any) => ({
      '@type': 'TouristTrip',
      name: `Hari ${x.dayNumber} - ${x.title}`,
      description: x.activities || x.title,
    })),
    offers: {
      '@type': 'Offer',
      priceCurrency: row.baseCurrency || 'IDR',
      price: Number(row.basePrice || 0),
      availability: 'https://schema.org/InStock',
    },
  };

  return (
    <div className="px-4 py-6 space-y-4">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
      <div className="bg-white border rounded-3xl overflow-hidden">
        <div className="relative h-64 bg-zinc-100">
          {row.coverImageUrl ? <Image src={row.coverImageUrl} alt={row.name || 'Tour'} fill className="object-cover" unoptimized /> : null}
        </div>
        <div className="p-5 space-y-2">
          <h1 className="text-xl font-extrabold">{row.name}</h1>
          <p className="text-sm text-zinc-600">{row.description || '-'}</p>
          <div className="text-xs text-zinc-500">{row.travelScope} • {row.productKind} • {row.country || '-'} {row.city || ''}</div>
          <div className="text-sm font-bold">{row.baseCurrency} {Number(row.basePrice || 0).toLocaleString('id-ID')}</div>
        </div>
      </div>
      <div className="bg-white border rounded-3xl p-5">
        <h2 className="text-sm font-bold mb-2">Itinerary</h2>
        <div className="space-y-2 text-sm">
          {(row.itineraries || []).map((x: any) => (
            <div key={`${x.dayNumber}-${x.title}`} className="rounded-xl border p-3">
              <div className="font-semibold">Hari {x.dayNumber}: {x.title}</div>
              <div className="text-zinc-600">{x.city || '-'} • {x.activities || '-'}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

