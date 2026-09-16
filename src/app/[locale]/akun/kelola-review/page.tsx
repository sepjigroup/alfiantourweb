import type { Metadata } from 'next';
import TestimoniManagerClient from './TestimoniManagerClient';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;

  const titleByLocale: Record<string, string> = {
    id: 'Kelola Testimoni',
    en: 'Manage Testimonials',
    ar: 'إدارة الشهادات',
  };

  return {
    title: titleByLocale[locale] ?? titleByLocale.id,
  };
}

export default function KelolaReviewPage() {
  return <TestimoniManagerClient />;
}
