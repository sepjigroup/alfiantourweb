import type { Metadata } from "next";
import AkunRouteGuard from "./AkunRouteGuard";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;

  const titleByLocale: Record<string, string> = {
    id: "Akun",
    en: "Account",
    ar: "الحساب",
  };

  return {
    title: titleByLocale[locale] ?? titleByLocale.id,
    robots: {
      index: false,
      follow: false,
    },
  };
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return <AkunRouteGuard>{children}</AkunRouteGuard>;
}
