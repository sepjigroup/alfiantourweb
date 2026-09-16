import Image from 'next/image';
import { notFound } from 'next/navigation';
import { cookies } from 'next/headers';
import { API_BASE_URL } from '@/lib/api-client';
import { ProductReferralCookieBridge } from './ProductReferralCookieBridge';

function splitProductReferral(raw: string) {
  const value = decodeURIComponent(String(raw || '')).trim();
  const at = value.lastIndexOf('@');
  if (at <= 0 || at === value.length - 1) return { fileId: value, refUsername: '' };
  return {
    fileId: value.slice(0, at),
    refUsername: value.slice(at + 1).replace(/^@/, ''),
  };
}

async function getDetail(fileId: string) {
  try {
    const res = await fetch(`${API_BASE_URL}/api/Products/${encodeURIComponent(fileId)}`, { cache: 'no-store' });
    if (!res.ok) return null;
    const json = await res.json();
    return json?.data ?? null;
  } catch {
    return null;
  }
}

async function getCheckoutAction(fileId: string) {
  try {
    const res = await fetch(`${API_BASE_URL}/api/Products/${encodeURIComponent(fileId)}/checkout-action`, { cache: 'no-store' });
    if (!res.ok) return null;
    const json = await res.json();
    return json?.data ?? null;
  } catch {
    return null;
  }
}

export default async function OtherProductDetailPage({ params }: { params: Promise<{ fileId: string }> }) {
  const { fileId: fileIdRaw } = await params;
  const { fileId, refUsername } = splitProductReferral(fileIdRaw);
  const row = await getDetail(fileId);
  if (!row) return notFound();
  const action = await getCheckoutAction(fileId);
  const cookieStore = await cookies();
  const cookieRef = String(cookieStore.get('ref_agent')?.value || '').trim();
  const activeRef = (refUsername || cookieRef).replace(/^@/, '');

  const isAffiliate = action?.checkoutType === 'MARKETPLACE';
  const buyLabel = isAffiliate ? `Beli di ${row.marketplace || 'Marketplace'}` : 'Checkout via WhatsApp';
  const currentUrlSuffix = activeRef ? `@${activeRef}` : '';
  const productUrl = `/produk-lain/${fileId}${currentUrlSuffix}`;
  const waMessage = activeRef
    ? `Id: ${activeRef}\nHalo admin, saya ingin order ${row.name}\n${productUrl}`
    : `Halo admin, saya ingin order ${row.name}\n${productUrl}`;

  return (
    <div className="px-4 py-6 space-y-4">
      <ProductReferralCookieBridge username={refUsername} />
      <div className="bg-white border rounded-3xl overflow-hidden">
        <div className="relative h-64 bg-zinc-100">
          {row.mainImageUrl ? <Image src={row.mainImageUrl} alt={row.name || 'Produk'} fill className="object-cover" unoptimized /> : null}
        </div>
        <div className="p-5 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <h1 className="text-xl font-extrabold">{row.name}</h1>
            <span className={`text-[10px] px-2 py-0.5 rounded-full border ${isAffiliate ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'}`}>
              {isAffiliate ? 'Marketplace' : 'Produk Resmi'}
            </span>
          </div>
          <p className="text-sm text-zinc-600">{row.description || '-'}</p>
          <div className="text-xs text-zinc-500">{row.category || '-'} {row.marketplace ? `• ${row.marketplace}` : ''}</div>
          <div className="text-sm font-bold">Rp {Number(row.price || 0).toLocaleString('id-ID')}</div>
          {!isAffiliate ? <div className="text-xs text-zinc-500">Stok: {row.stock ?? 0}</div> : null}
          {isAffiliate ? <div className="text-xs text-zinc-500">Produk ini tersedia melalui marketplace resmi.</div> : null}
          {isAffiliate ? (
            <a href={action?.affiliateUrl || '#'} target="_blank" rel="noopener noreferrer" className="inline-flex rounded-2xl px-4 py-2 text-sm font-bold bg-zinc-900 text-white">
              {buyLabel}
            </a>
          ) : (
            <a href={`https://wa.me/?text=${encodeURIComponent(waMessage)}`} target="_blank" rel="noopener noreferrer" className="inline-flex rounded-2xl px-4 py-2 text-sm font-bold bg-zinc-900 text-white">
              {buyLabel}
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
