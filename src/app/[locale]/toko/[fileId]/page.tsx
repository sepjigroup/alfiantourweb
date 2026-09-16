import Image from 'next/image';
import { notFound } from 'next/navigation';
import { cookies } from 'next/headers';
import Link from 'next/link';
import type { Metadata } from 'next';
import { API_BASE_URL } from '@/lib/api-client';
import { ProductReferralCookieBridge } from './ProductReferralCookieBridge';

// ─── Helpers ─────────────────────────────────────────────────────────────────
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
  } catch { return null; }
}

async function getCheckoutAction(fileId: string) {
  try {
    const res = await fetch(`${API_BASE_URL}/api/Products/${encodeURIComponent(fileId)}/checkout-action`, { cache: 'no-store' });
    if (!res.ok) return null;
    const json = await res.json();
    return json?.data ?? null;
  } catch { return null; }
}

async function getRelated(category: string, currentId: string) {
  try {
    const res = await fetch(`${API_BASE_URL}/api/Products?page=1&pageSize=20`, { cache: 'no-store' });
    if (!res.ok) return [];
    const json = await res.json();
    const items: any[] = json?.data?.items ?? [];
    // Same category first, then fill with other products
    const sameCat = items.filter((x) => x.fileId !== currentId && x.category === category);
    const others = items.filter((x) => x.fileId !== currentId && x.category !== category);
    return [...sameCat, ...others].slice(0, 6);
  } catch { return []; }
}

const CATEGORY_ICONS: Record<string, string> = {
  'Oleh-Oleh': '🎁',
  'Perlengkapan Ibadah': '🕌',
  'Busana Muslim': '👘',
  'Koper & Travel Gear': '🧳',
  'Digital Product': '💻',
  'Lainnya': '📦',
};

// ─── Bank data (same as /information/payment) ─────────────────────────────────
const BANKS = [
  {
    name: 'Bank Mandiri',
    number: '13000.2958.7907',
    holder: 'PT ALFIAN SEJAHTERA ABADI',
    color: 'from-blue-700 to-blue-900',
    logo: '🏦',
  },
  {
    name: 'Bank BRI',
    number: '0405.01.001886.30.0',
    holder: 'PT ALFIAN SEJAHTERA ABADI',
    color: 'from-sky-500 to-blue-700',
    logo: '🏛️',
  },
  {
    name: 'Bank Muamalat',
    number: 'Hubungi Admin',
    holder: 'PT ALFIAN SEJAHTERA ABADI',
    color: 'from-purple-700 to-purple-900',
    logo: '🕌',
  },
];

// ─── SEO: generateMetadata ────────────────────────────────────────────────────
export async function generateMetadata({
  params,
}: {
  params: Promise<{ fileId: string; locale: string }>;
}): Promise<Metadata> {
  const { fileId: fileIdRaw, locale } = await params;
  const { fileId } = splitProductReferral(fileIdRaw);
  const row = await getDetail(fileId);

  if (!row) {
    return {
      title: 'Produk Tidak Ditemukan — Alfian Tour Toko',
      description: 'Produk yang Anda cari tidak tersedia. Jelajahi produk lainnya di Toko Alfian Tour.',
    };
  }

  const title = `${row.name} — Toko Alfian Tour`;
  const description = row.description
    ? String(row.description).slice(0, 160)
    : `Beli ${row.name} di Toko Alfian Tour. Kategori: ${row.category || 'Produk'}. Harga: Rp ${Number(row.price || 0).toLocaleString('id-ID')}. Produk terpercaya dengan layanan terbaik.`;

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://alfiantour.com';
  const canonicalUrl = `${siteUrl}/${locale}/toko/${fileId}`;

  return {
    title,
    description,
    keywords: [
      row.name,
      row.category,
      'Alfian Tour',
      'Toko',
      'Oleh-oleh Haji',
      'Perlengkapan Umroh',
      'Produk Islami',
    ].filter(Boolean).join(', '),
    alternates: {
      canonical: canonicalUrl,
      languages: {
        'id': `${siteUrl}/id/toko/${fileId}`,
        'en': `${siteUrl}/en/toko/${fileId}`,
      },
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      siteName: 'Alfian Tour Official Store',
      type: 'website',
      images: row.mainImageUrl
        ? [{ url: row.mainImageUrl, width: 800, height: 600, alt: row.name }]
        : [],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: row.mainImageUrl ? [row.mainImageUrl] : [],
    },
  };
}

// ─── Page ────────────────────────────────────────────────────────────────────
export default async function TokoDetailPage({
  params,
}: {
  params: Promise<{ fileId: string; locale: string }>;
}) {
  const { fileId: fileIdRaw, locale } = await params;
  const { fileId, refUsername } = splitProductReferral(fileIdRaw);
  const row = await getDetail(fileId);
  if (!row) return notFound();

  const action = await getCheckoutAction(fileId);
  const cookieStore = await cookies();
  const cookieRef = String(cookieStore.get('ref_agent')?.value || '').trim();
  const activeRef = (refUsername || cookieRef).replace(/^@/, '');

  const isAffiliate = action?.checkoutType === 'MARKETPLACE';
  const productUrl = `/toko/${fileId}${activeRef ? `@${activeRef}` : ''}`;
  const waMessage = activeRef
    ? `Id: ${activeRef}\nHalo admin, saya ingin order:\n*${row.name}*\nHarga: Rp ${Number(row.price || 0).toLocaleString('id-ID')}\nLink: ${productUrl}`
    : `Halo admin, saya ingin order:\n*${row.name}*\nHarga: Rp ${Number(row.price || 0).toLocaleString('id-ID')}\nLink: ${productUrl}`;

  const related = await getRelated(row.category, fileId);
  const catIcon = CATEGORY_ICONS[row.category as string] ?? '📦';
  const hasStock = !isAffiliate && (row.stock ?? 0) > 0;
  const outOfStock = !isAffiliate && (row.stock ?? 0) <= 0;

  // structured data (JSON-LD)
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: row.name,
    description: row.description || '',
    image: row.mainImageUrl || '',
    brand: { '@type': 'Brand', name: 'Alfian Tour' },
    offers: {
      '@type': 'Offer',
      priceCurrency: 'IDR',
      price: row.price || 0,
      availability: outOfStock
        ? 'https://schema.org/OutOfStock'
        : 'https://schema.org/InStock',
      seller: { '@type': 'Organization', name: 'Alfian Tour' },
    },
  };

  return (
    <>
      {/* JSON-LD structured data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <style>{`
        @keyframes fade-up { from { opacity:0;transform:translateY(20px); } to { opacity:1;transform:translateY(0); } }
        .fade-up { animation: fade-up 0.4s ease both; }
        .fade-up-2 { animation: fade-up 0.4s ease 0.12s both; }
        .fade-up-3 { animation: fade-up 0.4s ease 0.22s both; }
        .related-card { transition:transform 0.22s ease,box-shadow 0.22s ease; }
        .related-card:hover { transform:translateY(-4px);box-shadow:0 10px 28px rgba(0,0,0,0.10); }
        .bank-card { background-size:200% 200%; animation: shimmer 6s ease infinite; }
        @keyframes shimmer { 0%,100%{background-position:0% 50%} 50%{background-position:100% 50%} }
        .copy-btn:active { transform:scale(0.95); }
      `}</style>

      <ProductReferralCookieBridge username={refUsername} />

      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white pb-20">

        {/* ── Breadcrumb ───────────────────────────────────────────── */}
        <nav className="border-b border-slate-100 bg-white px-4 py-3" aria-label="Breadcrumb">
          <div className="max-w-5xl mx-auto flex items-center gap-2 text-xs text-slate-500">
            <Link href={`/${locale}`} className="hover:text-indigo-600 transition-colors">Beranda</Link>
            <span aria-hidden>/</span>
            <Link href={`/${locale}/toko`} className="hover:text-indigo-600 transition-colors">Toko</Link>
            <span aria-hidden>/</span>
            <span className="text-slate-700 font-medium truncate max-w-[200px]" aria-current="page">{row.name}</span>
          </div>
        </nav>

        <div className="max-w-5xl mx-auto px-4 py-6 space-y-10">

          {/* ══════════════════════════════════════════════════════════ */}
          {/* SECTION 1: Product Detail                                  */}
          {/* ══════════════════════════════════════════════════════════ */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 fade-up">

            {/* ── Left: Image ───────────────────────────────────────── */}
            <div className="space-y-3">
              <div className="relative aspect-square w-full overflow-hidden rounded-3xl border border-slate-200 bg-slate-100 shadow-sm">
                {row.mainImageUrl ? (
                  <Image
                    src={row.mainImageUrl as string}
                    alt={row.name || 'Produk Alfian Tour'}
                    fill
                    priority
                    className="object-cover"
                    unoptimized
                    onError={(e: any) => { e.target.src = `https://placehold.co/600x600/e2e8f0/94a3b8?text=📦`; }}
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-8xl text-slate-200" aria-hidden>
                    {catIcon}
                  </div>
                )}
                {/* Badge overlay */}
                <div className="absolute top-4 left-4">
                  {isAffiliate ? (
                    <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700 shadow">
                      🛍️ {row.marketplace || 'Marketplace'}
                    </span>
                  ) : (
                    <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 shadow">
                      ✅ Produk Resmi
                    </span>
                  )}
                </div>
              </div>

              {/* Trust badges */}
              <div className="grid grid-cols-3 gap-2">
                {[
                  { icon: '🛡️', label: 'Terpercaya' },
                  { icon: '🚀', label: 'Pengiriman Cepat' },
                  { icon: '💬', label: 'CS Responsif' },
                ].map(b => (
                  <div key={b.label} className="flex flex-col items-center gap-1 rounded-2xl border border-slate-100 bg-white p-3 text-center shadow-sm">
                    <span className="text-xl" aria-hidden>{b.icon}</span>
                    <span className="text-[10px] font-semibold text-slate-600">{b.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Right: Detail & CTA ───────────────────────────────── */}
            <div className="space-y-4">
              {/* Category pill */}
              <div className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 border border-indigo-100 px-3 py-1 text-xs font-semibold text-indigo-700">
                <span aria-hidden>{catIcon}</span>
                <span>{row.category || 'Produk'}</span>
              </div>

              {/* Name — H1 for SEO */}
              <h1 className="text-2xl font-extrabold text-slate-900 leading-tight">{row.name}</h1>

              {/* Price */}
              <div className="flex items-end gap-2">
                <span className="text-3xl font-extrabold text-indigo-700">
                  Rp {Number(row.price || 0).toLocaleString('id-ID')}
                </span>
              </div>

              {/* Stock / availability */}
              {!isAffiliate && (
                <div className="flex items-center gap-2 text-sm">
                  <span className={`h-2 w-2 rounded-full ${hasStock ? 'bg-emerald-500' : 'bg-red-400'}`} aria-hidden />
                  <span className="text-slate-600">
                    {hasStock ? `Stok tersedia: ${row.stock} unit` : 'Stok habis'}
                  </span>
                </div>
              )}
              {isAffiliate && (
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <span aria-hidden>🏬</span>
                  <span>Tersedia di <strong>{row.marketplace}</strong></span>
                </div>
              )}

              {/* Description */}
              {row.description && (
                <div className="rounded-2xl bg-slate-50 border border-slate-100 p-4">
                  <div className="text-xs font-semibold text-slate-500 mb-1.5">📋 Deskripsi Produk</div>
                  <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">{row.description}</p>
                </div>
              )}

              {/* CTA Buttons */}
              <div className="space-y-2.5 pt-2">
                {isAffiliate ? (
                  <a
                    href={action?.affiliateUrl || '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 py-3.5 text-sm font-bold text-white shadow-lg shadow-amber-200 transition-all"
                    aria-label={`Beli ${row.name} di ${row.marketplace || 'Marketplace'}`}
                  >
                    🛍️ Beli di {row.marketplace || 'Marketplace'} →
                  </a>
                ) : (
                  <a
                    href={`https://wa.me/?text=${encodeURIComponent(waMessage)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full rounded-2xl bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 py-3.5 text-sm font-bold text-white shadow-lg shadow-green-200 transition-all"
                    aria-label={`Order ${row.name} via WhatsApp`}
                  >
                    💬 Order via WhatsApp →
                  </a>
                )}
                <Link
                  href={`/${locale}/toko`}
                  className="flex items-center justify-center gap-2 w-full rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 py-3 text-sm font-semibold text-slate-700 transition-all"
                >
                  ← Kembali ke Toko
                </Link>
              </div>

              {/* Referral notice */}
              {activeRef && (
                <div className="rounded-2xl bg-indigo-50 border border-indigo-100 p-3 text-xs text-indigo-700">
                  🤝 Anda mengunjungi via agen: <strong>@{activeRef}</strong>
                </div>
              )}
            </div>
          </div>

          {/* ══════════════════════════════════════════════════════════ */}
          {/* SECTION 2: Related Products                               */}
          {/* ══════════════════════════════════════════════════════════ */}
          {related.length > 0 && (
            <section className="fade-up-2 space-y-4" aria-label="Produk Terkait">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-extrabold text-slate-800">
                  {catIcon} Produk Terkait &amp; Pilihan Lainnya
                </h2>
                <Link href={`/${locale}/toko`} className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 transition-colors">
                  Lihat semua →
                </Link>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-6">
                {related.map((p: any) => (
                  <Link
                    key={p.fileId}
                    href={`/${locale}/toko/${p.fileId}${activeRef ? `@${encodeURIComponent(activeRef)}` : ''}`}
                    className="related-card group overflow-hidden rounded-2xl border border-slate-200 bg-white"
                  >
                    <div className="relative h-28 overflow-hidden bg-slate-100">
                      {p.mainImageUrl ? (
                        <Image
                          src={p.mainImageUrl}
                          alt={p.name || 'Produk'}
                          fill
                          className="object-cover transition-transform duration-300 group-hover:scale-105"
                          unoptimized
                          onError={(e: any) => { e.target.src = 'https://placehold.co/200x150/e2e8f0/94a3b8?text=📦'; }}
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-2xl text-slate-300" aria-hidden>
                          {CATEGORY_ICONS[p.category] ?? '📦'}
                        </div>
                      )}
                    </div>
                    <div className="p-2.5 space-y-1">
                      <div className="text-[11px] font-bold text-slate-800 line-clamp-2 leading-snug">{p.name}</div>
                      <div className="text-[11px] font-extrabold text-indigo-700">
                        Rp {Number(p.price || 0).toLocaleString('id-ID')}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* ══════════════════════════════════════════════════════════ */}
          {/* SECTION 3: Payment / Transfer Info                        */}
          {/* ══════════════════════════════════════════════════════════ */}
          {!isAffiliate && (
            <section className="fade-up-3 space-y-5" aria-label="Informasi Pembayaran">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-extrabold text-slate-800">💳 Informasi Pembayaran</h2>
                  <p className="text-xs text-slate-500 mt-0.5">Transfer ke rekening resmi Alfian Tour di bawah ini</p>
                </div>
                <Link
                  href={`/${locale}/information/payment`}
                  className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 border border-indigo-100 bg-indigo-50 px-3 py-1.5 rounded-xl transition-colors"
                >
                  Lihat Panduan →
                </Link>
              </div>

              {/* Bank cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {BANKS.map((bank) => (
                  <div
                    key={bank.name}
                    className={`relative overflow-hidden rounded-3xl p-5 text-white bg-gradient-to-br ${bank.color} shadow-lg`}
                  >
                    {/* decorative circle */}
                    <div className="absolute -top-6 -right-6 h-24 w-24 rounded-full bg-white/10" aria-hidden />
                    <div className="absolute -bottom-8 -left-4 h-20 w-20 rounded-full bg-white/5" aria-hidden />

                    <div className="relative z-10 space-y-4">
                      {/* Bank name */}
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-base tracking-wide">{bank.name}</span>
                        <span className="text-2xl" aria-hidden>{bank.logo}</span>
                      </div>

                      {/* Account number */}
                      <div>
                        <div className="text-[9px] uppercase tracking-[0.2em] opacity-70 mb-1">Nomor Rekening</div>
                        <div className="font-mono text-lg font-bold tracking-widest">{bank.number}</div>
                      </div>

                      {/* Account holder */}
                      <div>
                        <div className="text-[9px] uppercase tracking-[0.2em] opacity-70 mb-1">Atas Nama</div>
                        <div className="text-sm font-bold uppercase tracking-wide">{bank.holder}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Warning notice */}
              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 flex gap-3 items-start">
                <span className="text-xl flex-shrink-0" aria-hidden>⚠️</span>
                <div className="text-xs text-amber-800 leading-relaxed">
                  <strong>Penting:</strong> Setelah transfer, harap konfirmasi pembayaran melalui WhatsApp dengan menyertakan:
                  <ul className="mt-2 space-y-1 list-disc list-inside">
                    <li>Nama lengkap pemesan</li>
                    <li>Nama produk: <strong>{row.name}</strong></li>
                    <li>Jumlah yang ditransfer</li>
                    <li>Bukti transfer (screenshot)</li>
                    {activeRef && <li>Kode agen: <strong>@{activeRef}</strong></li>}
                  </ul>
                </div>
              </div>

              {/* WhatsApp confirm button */}
              <a
                href={`https://wa.me/?text=${encodeURIComponent(`Halo admin, saya ingin konfirmasi pembayaran untuk:\n*${row.name}*\nHarga: Rp ${Number(row.price || 0).toLocaleString('id-ID')}${activeRef ? `\nKode Agen: @${activeRef}` : ''}\n\nSaya sudah transfer ke rekening Alfian Tour. Mohon konfirmasi. Terima kasih!`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full rounded-2xl bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 py-3.5 text-sm font-bold text-white shadow-lg shadow-green-200 transition-all"
                aria-label="Konfirmasi pembayaran via WhatsApp"
              >
                ✅ Konfirmasi Pembayaran via WhatsApp
              </a>
            </section>
          )}

        </div>
      </div>
    </>
  );
}
