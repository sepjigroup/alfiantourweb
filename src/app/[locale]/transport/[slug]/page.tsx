import { notFound } from 'next/navigation';
import TransportBookingClient from './TransportBookingClient';
import { API_BASE_URL } from '@/lib/api-client';

function parseReferralSlug(raw: string) {
  const [slugPart, refPart] = decodeURIComponent(raw).split('@');
  return {
    slug: slugPart,
    refUsername: refPart ? refPart.trim().replace(/^@/, '') : null,
  };
}

async function getDetail(slug: string) {
  try {
    const res = await fetch(`${API_BASE_URL}/api/TransportPartner/public/packages/${encodeURIComponent(slug)}`, { cache: 'no-store' });
    if (!res.ok) return null;
    const json = await res.json();
    return json?.data ?? null;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const paramsValue = await params;
  const { slug } = parseReferralSlug(paramsValue.slug);
  const row = await getDetail(slug);
  const pkg = row?.package;
  if (!pkg) return { title: 'Paket Transport' };
  return {
    title: `${pkg.title} | Transport Partner Alfian Tour`,
    description: pkg.shortDescription || pkg.description || `${pkg.originCity} - ${pkg.destinationCity}`,
  };
}

export default async function TransportPackageDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const paramsValue = await params;
  const { slug, refUsername } = parseReferralSlug(paramsValue.slug);
  const row = await getDetail(slug);
  if (!row?.package) return notFound();
  return <TransportBookingClient packageData={row.package} departures={row.departures || []} initialRefUsername={refUsername} />;
}
