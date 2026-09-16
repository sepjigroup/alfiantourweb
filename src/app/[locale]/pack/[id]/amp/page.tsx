import { redirect } from 'next/navigation';

type Params = {
  locale: string;
  id: string;
};

function normalizeId(raw: string): string {
  const decoded = decodeURIComponent(String(raw || '')).trim();
  const atIndex = decoded.lastIndexOf('@');
  return atIndex > 0 ? decoded.slice(0, atIndex).trim() : decoded;
}

function getAmpBaseUrl(): string {
  const env = String(process.env.NEXT_PUBLIC_AMP_SITE_URL || '').trim();
  if (env) return env.replace(/\/+$/, '');
  return process.env.NODE_ENV === 'production'
    ? 'https://amp.alfiantour.com'
    : 'http://localhost:3001';
}

export default async function PackAmpRedirectPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { locale, id } = await params;
  const cleanId = normalizeId(id);
  const target = `${getAmpBaseUrl()}/${encodeURIComponent(locale)}/pack/${encodeURIComponent(cleanId)}/amp`;
  redirect(target);
}
