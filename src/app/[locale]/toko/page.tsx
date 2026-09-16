import ProductMarketplaceClient from './ProductMarketplaceClient';
import { getLocalizedAlternates } from "@/lib/seo";
import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://alfiantour.com';
  const canonicalUrl = `${siteUrl}/${locale}/toko`;
  const title = 'Toko Alfian Tour — Produk Pilihan & Perlengkapan Ibadah';
  const description = 'Belanja produk resmi dan afiliasi Alfian Tour: oleh-oleh haji umroh, perlengkapan ibadah, busana muslim, koper, dan produk pilihan terbaik.';
  const image = `${siteUrl}/newlogo2.png`;

  return {
    title,
    description,
    alternates: getLocalizedAlternates(locale, "/toko"),
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      siteName: 'Toko Alfian Tour',
      type: 'website',
      images: [{ url: image, width: 800, height: 600, alt: 'Toko Alfian Tour' }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [image],
    },
  };
}

export default function TokoPage() {
  return <ProductMarketplaceClient />;
}
