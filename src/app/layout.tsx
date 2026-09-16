import type { Metadata } from 'next';
import Script from 'next/script';
import './globals.css';

const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/+$/, '');

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'Alfian Tour | PT. Alfian Sejahtera Abadi',
    template: '%s | PT. Alfian Sejahtera Abadi',
  },
  description: 'Travel umroh dan haji terpercaya. Paket umroh, jadwal keberangkatan, dan pemesanan online resmi Alfian Tour.',
  alternates: {
    canonical: '/',
  },
  icons: {
    apple: '/apple-touch-icon.png',
    icon: [
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
    ],
  },
  openGraph: {
    type: 'website',
    url: siteUrl,
    siteName: 'Alfian Tour',
    title: 'Alfian Tour | PT. Alfian Sejahtera Abadi',
    description: 'Travel umroh dan haji terpercaya dengan layanan ramah lansia dan keluarga.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Alfian Tour | PT. Alfian Sejahtera Abadi',
    description: 'Travel umroh dan haji terpercaya dengan layanan ramah lansia dan keluarga.',
  },
  manifest: '/site.webmanifest',
  other: {
    'google-adsense-account': 'ca-pub-7379695285237095',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const organizationJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Alfian Tour',
    legalName: 'PT. Alfian Sejahtera Abadi',
    url: siteUrl,
    logo: `${siteUrl}/android-chrome-512x512.png`,
  };
  const websiteJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Alfian Tour',
    url: siteUrl,
    potentialAction: {
      '@type': 'SearchAction',
      target: `${siteUrl}/id/pack?search={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  };
  return (
    <html lang="id">
      <head>
        <meta name="google-adsense-account" content="ca-pub-7379695285237095" />
        <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-7379695285237095" crossOrigin="anonymous" />
      </head>
      <body>
        {children}
        <Script
          id="google-ads-aw-18205195766-lib"
          src="https://www.googletagmanager.com/gtag/js?id=AW-18205195766"
          strategy="afterInteractive"
        />
        <Script id="google-ads-aw-18205195766-init" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            window.gtag = window.gtag || function(){window.dataLayer.push(arguments);}
            window.gtag('js', new Date());
            window.gtag('config', 'AW-18205195766');
          `}
        </Script>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
        />
      </body>
    </html>
  );
}
