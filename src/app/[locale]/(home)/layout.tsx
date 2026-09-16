import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;

  const titleByLocale: Record<string, string> = {
    id: "Beranda",
    en: "Home",
    ar: "الرئيسية",
  };

  return {
    title: titleByLocale[locale] ?? titleByLocale.id,
  };
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
