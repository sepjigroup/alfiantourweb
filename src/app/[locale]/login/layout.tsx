import type { Metadata } from 'next';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const titleByLocale: Record<string, string> = {
    id: 'Login',
    en: 'Login',
    ar: 'تسجيل الدخول',
  };
  return {
    title: titleByLocale[locale] ?? titleByLocale.id,
    description: 'Halaman login akun Alfian Tour.',
    alternates: { canonical: `/${locale}/login` },
  };
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}

