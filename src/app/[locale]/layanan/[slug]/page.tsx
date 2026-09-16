import { notFound } from 'next/navigation';
import { API_BASE_URL } from '@/lib/api-client';
import ServiceDetailClient from './ServiceDetailClient';
import { getLocalizedAlternates } from "@/lib/seo";
import type { Metadata } from "next";

function parseReferralSlug(raw: string) {
  const [slugPart, refPart] = decodeURIComponent(raw).split('@');
  return {
    slug: slugPart,
    refUsername: refPart ? refPart.trim().replace(/^@/, '') : null,
  };
}

function toAbsoluteUrl(raw?: string | null): string {
  const val = String(raw ?? '').trim();
  if (!val) return '';
  if (val.startsWith('http://') || val.startsWith('https://')) return val;
  const api = process.env.NEXT_PUBLIC_API_URL || 'https://api-alfiantour.sepji.net';
  return `${api}${val.startsWith('/') ? '' : '/'}${val}`;
}

async function getOfferings(slug: string) {
  try {
    const res = await fetch(`${API_BASE_URL}/api/ServiceMarketplace/public/offerings?categorySlug=${encodeURIComponent(slug)}`, { cache: 'no-store' });
    if (!res.ok) return [];
    const json = await res.json();
    return Array.isArray(json?.data) ? json.data : [];
  } catch {
    return [];
  }
}

async function getCategories() {
  try {
    const res = await fetch(`${API_BASE_URL}/api/ServiceMarketplace/public/categories`, { cache: 'no-store' });
    if (!res.ok) return [];
    const json = await res.json();
    return Array.isArray(json?.data) ? json.data : [];
  } catch {
    return [];
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const paramsValue = await params;
  const locale = paramsValue.locale;
  const { slug } = parseReferralSlug(paramsValue.slug);
  const categories = await getCategories();
  const category = categories.find((x: any) => x.slug === slug);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://alfiantour.com';
  const canonicalUrl = `${siteUrl}/${locale}/layanan/${paramsValue.slug}`;

  if (!category) {
    const title = 'Layanan Perjalanan | AlfianTour';
    const description = 'Layanan perjalanan ibadah dan wisata resmi AlfianTour';
    return {
      title,
      description,
      alternates: getLocalizedAlternates(locale, `/layanan/${paramsValue.slug}`),
    };
  }

  const title = `${category.name} | AlfianTour`;
  const description = category.shortDescription || category.description || `Layanan resmi ${category.name} oleh AlfianTour.`;
  const image = toAbsoluteUrl(category.coverImageUrl) || `${siteUrl}/newlogo2.png`;

  return {
    title,
    description,
    alternates: getLocalizedAlternates(locale, `/layanan/${paramsValue.slug}`),
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      siteName: 'AlfianTour',
      type: 'website',
      images: [{ url: image, width: 800, height: 600, alt: category.name }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [image],
    },
  };
}

export default async function ServiceDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const paramsValue = await params;
  const { slug, refUsername } = parseReferralSlug(paramsValue.slug);
  const [categories, offerings] = await Promise.all([getCategories(), getOfferings(slug)]);
  const category = categories.find((x: any) => x.slug === slug);
  if (!category && offerings.length === 0) return notFound();
  return <ServiceDetailClient category={category ?? { slug, name: slug }} offerings={offerings} initialRefUsername={refUsername} />;
}
