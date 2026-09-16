import type { Metadata } from 'next';

type PublicUserItem = {
  userName?: string;
  fullName?: string;
  avatar?: string | null;
  branchName?: string | null;
};

type LayoutProps = {
  children: React.ReactNode;
  params: Promise<{ locale: string; username: string }>;
};

const PROD_API_URL = 'https://api-alfiantour.sepji.net';
const DEV_API_URL = 'http://localhost:5054';
const DEFAULT_SITE_URL = 'https://alfiantour.com';
const DEFAULT_LOGO_PATH = '/newlogo2.png';

function getApiBaseUrl(): string {
  const envApi = (process.env.NEXT_PUBLIC_API_URL || '').trim();
  if (envApi) return envApi.replace(/\/+$/, '');
  return (process.env.NODE_ENV === 'production' ? PROD_API_URL : DEV_API_URL).replace(/\/+$/, '');
}

function getSiteUrl(): string {
  const envSite = (process.env.NEXT_PUBLIC_SITE_URL || '').trim();
  return (envSite || DEFAULT_SITE_URL).replace(/\/+$/, '');
}

function toAbsoluteUrl(raw?: string | null): string {
  const val = String(raw ?? '').trim();
  if (!val) return '';
  if (val.startsWith('http://') || val.startsWith('https://')) return val;
  const api = getApiBaseUrl();
  return `${api}${val.startsWith('/') ? '' : '/'}${val}`;
}

function normalize(v?: string | null): string {
  return String(v ?? '').trim();
}

async function fetchReferralUser(username: string): Promise<PublicUserItem | null> {
  const api = getApiBaseUrl();
  try {
    const res = await fetch(
      `${api}/api/UserManagement/public-users?pageNumber=1&pageSize=50&searchTerm=${encodeURIComponent(username)}&isActive=true`,
      { cache: 'no-store' }
    );
    if (!res.ok) return null;
    const json = await res.json();
    const items = (json?.data?.items ?? []) as PublicUserItem[];
    const key = normalize(username).toLowerCase();
    return (
      items.find((x) => normalize(x.userName).toLowerCase() === key) ??
      items.find((x) => normalize(x.userName).toLowerCase().includes(key)) ??
      null
    );
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: LayoutProps): Promise<Metadata> {
  const { locale, username: usernameRaw } = await params;
  const username = String(usernameRaw || '').replace(/^@/, '');
  const site = getSiteUrl();
  const canonicalUrl = `${site}/${locale}/ref/${encodeURIComponent(username)}`;
  const user = await fetchReferralUser(username);

  const personName = normalize(user?.fullName) || `@${username}`;
  const branch = normalize(user?.branchName);
  const title = branch
    ? `${personName} - Referral Resmi ${branch} | Alfian Tour`
    : `${personName} - Referral Resmi | Alfian Tour`;
  const description = `Halaman referral resmi ${personName}. Konsultasi paket umroh/haji terpercaya bersama Alfian Tour.`;
  const image = toAbsoluteUrl(user?.avatar) || `${site}${DEFAULT_LOGO_PATH}`;

  return {
    title,
    description,
    alternates: { canonical: canonicalUrl },
    openGraph: {
      type: 'profile',
      title,
      description,
      url: canonicalUrl,
      siteName: 'Alfian Tour',
      images: [{ url: image, width: 1200, height: 630, alt: personName }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [image],
    },
  };
}

export default async function ReferralUsernameLayout({ children, params }: LayoutProps) {
  const { locale, username: usernameRaw } = await params;
  const username = String(usernameRaw || '').replace(/^@/, '');
  const site = getSiteUrl();
  const canonicalUrl = `${site}/${locale}/ref/${encodeURIComponent(username)}`;
  const user = await fetchReferralUser(username);
  const personName = normalize(user?.fullName) || `@${username}`;
  const image = toAbsoluteUrl(user?.avatar) || `${site}${DEFAULT_LOGO_PATH}`;

  const schema = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': `${site}/#organization`,
        name: 'Alfian Tour',
        url: site,
        logo: `${site}${DEFAULT_LOGO_PATH}`,
      },
      {
        '@type': 'ProfilePage',
        '@id': `${canonicalUrl}#profile-page`,
        url: canonicalUrl,
        name: `Referral ${personName}`,
        mainEntity: {
          '@type': 'Person',
          name: personName,
          identifier: normalize(user?.userName) || username,
          image,
          worksFor: { '@id': `${site}/#organization` },
        },
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      {children}
    </>
  );
}

