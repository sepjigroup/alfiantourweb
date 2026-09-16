import type { Metadata } from 'next';

type FeedDetail = {
  id: number;
  slug: string;
  title: string;
  excerpt?: string | null;
  content?: string | null;
  coverImageUrl?: string | null;
  authorName?: string | null;
  publishedAt?: string | null;
};

type LayoutProps = {
  children: React.ReactNode;
  params: Promise<{ locale: string; id: string }>;
};

const PROD_API_URL = 'https://api-alfiantour.sepji.net';
const DEV_API_URL = 'http://localhost:5054';
const DEFAULT_SITE_URL = 'https://alfiantour.com';
const DEFAULT_IMAGE = '/newlogo2.png';

function getApiBaseUrl(): string {
  const envApi = (process.env.NEXT_PUBLIC_API_URL || '').trim();
  if (envApi) return envApi.replace(/\/+$/, '');
  return (process.env.NODE_ENV === 'production' ? PROD_API_URL : DEV_API_URL).replace(/\/+$/, '');
}

function getSiteUrl(): string {
  const envSite = (process.env.NEXT_PUBLIC_SITE_URL || '').trim();
  return (envSite || DEFAULT_SITE_URL).replace(/\/+$/, '');
}

function toAbsoluteAsset(raw?: string | null): string {
  const val = String(raw ?? '').trim();
  if (!val) return '';
  if (val.startsWith('http://') || val.startsWith('https://')) return val;
  const api = getApiBaseUrl();
  return `${api}${val.startsWith('/') ? '' : '/'}${val}`;
}

function stripHtml(raw?: string | null): string {
  return String(raw ?? '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

async function fetchFeed(slugOrId: string): Promise<FeedDetail | null> {
  try {
    const res = await fetch(`${getApiBaseUrl()}/api/feeds/public/${encodeURIComponent(slugOrId)}`, { cache: 'no-store' });
    if (!res.ok) return null;
    return (await res.json()) as FeedDetail;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: LayoutProps): Promise<Metadata> {
  const { locale, id } = await params;
  const site = getSiteUrl();
  const row = await fetchFeed(id);

  if (!row) {
    const fallbackTitle = locale === 'en' ? 'Feed Detail' : locale === 'ar' ? 'تفاصيل المنشور' : 'Detail Feed';
    return { title: fallbackTitle };
  }

  const slugOrId = row.slug || String(row.id);
  const canonical = `${site}/${locale}/feeds/${encodeURIComponent(slugOrId)}`;
  const title = row.title || 'Feed Alfian Tour';
  const description = (row.excerpt || stripHtml(row.content)).slice(0, 180) || 'Informasi terbaru dari Alfian Tour.';
  const image = toAbsoluteAsset(row.coverImageUrl) || `${site}${DEFAULT_IMAGE}`;

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      type: 'article',
      title,
      description,
      url: canonical,
      siteName: 'Alfian Tour',
      images: [{ url: image, width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [image],
    },
  };
}

export default async function FeedDetailLayout({ children, params }: LayoutProps) {
  const { locale, id } = await params;
  const site = getSiteUrl();
  const row = await fetchFeed(id);

  if (!row) return children;

  const slugOrId = row.slug || String(row.id);
  const canonical = `${site}/${locale}/feeds/${encodeURIComponent(slugOrId)}`;
  const title = row.title || 'Feed Alfian Tour';
  const description = (row.excerpt || stripHtml(row.content)).slice(0, 180) || 'Informasi terbaru dari Alfian Tour.';
  const image = toAbsoluteAsset(row.coverImageUrl) || `${site}${DEFAULT_IMAGE}`;
  const publishedAt = row.publishedAt || undefined;

  const schema = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': `${site}/#organization`,
        name: 'Alfian Tour',
        url: site,
        logo: `${site}${DEFAULT_IMAGE}`,
      },
      {
        '@type': 'NewsArticle',
        '@id': `${canonical}#article`,
        headline: title,
        description,
        image: [image],
        author: {
          '@type': 'Person',
          name: row.authorName || 'Admin Alfian Tour',
        },
        publisher: { '@id': `${site}/#organization` },
        datePublished: publishedAt,
        dateModified: publishedAt,
        mainEntityOfPage: canonical,
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: `${site}/${locale}` },
          { '@type': 'ListItem', position: 2, name: 'Feeds', item: `${site}/${locale}/feeds` },
          { '@type': 'ListItem', position: 3, name: title, item: canonical },
        ],
      },
      {
        '@type': 'WebSite',
        '@id': `${site}/#website`,
        url: site,
        name: 'Alfian Tour',
        potentialAction: {
          '@type': 'SearchAction',
          target: `${site}/${locale}/feeds?search={search_term_string}`,
          'query-input': 'required name=search_term_string',
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

