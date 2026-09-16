import ReviewsClient from './ReviewsClient';

import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;

  const titleByLocale: Record<string, string> = {
    id: "Kasih Review",
    en: "Write a Review",
    ar: "اكتب تقييماً",
  };

  return {
    title: titleByLocale[locale] ?? titleByLocale.id,
  };
}

export default function ReviewsPage() {
  return <ReviewsClient />;
}
