import type { Metadata } from "next";
import { getLocalizedAlternates } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://alfiantour.com';
  const canonicalUrl = `${siteUrl}/${locale}/layanan`;

  const titleByLocale: Record<string, string> = {
    id: "Layanan Resmi Perjalanan & Akomodasi | AlfianTour",
    en: "Official Travel & Accommodation Services | AlfianTour",
    ar: "خدمات السفر والإقامة الرسمية | الفيّان تور",
  };

  const descByLocale: Record<string, string> = {
    id: "Jelajahi seluruh layanan travel resmi AlfianTour: Haji & Umrah, Tour Internasional, Tiket Pesawat, Booking Hotel, Pengurusan Visa, Rental Mobil, Gathering, dan MICE.",
    en: "Explore all official travel services from AlfianTour: Hajj & Umrah, International Tour, Flight Tickets, Hotel Booking, Visa Assistance, Car Rental, Gathering, and MICE.",
    ar: "استكشف جميع خدمات السفر الرسمية من الفيّان تور: الحج والعمرة، الجولات الدولية، تذاكر الطيران، حجز الفنادق، المساعدة في تأشيرات السفر، تأجير السيارات، والاجتماعات.",
  };

  const title = titleByLocale[locale] ?? titleByLocale.id;
  const description = descByLocale[locale] ?? descByLocale.id;
  const image = `${siteUrl}/newlogo2.png`;

  return {
    title,
    description,
    alternates: getLocalizedAlternates(locale, "/layanan"),
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      siteName: 'AlfianTour',
      type: 'website',
      images: [{ url: image, width: 800, height: 600, alt: 'Layanan AlfianTour' }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [image],
    },
  };
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
