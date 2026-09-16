import type { Metadata } from 'next';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const titleByLocale: Record<string, string> = {
    id: 'Daftar',
    en: 'Register',
    ar: 'إنشاء حساب',
  };
  return {
    title: titleByLocale[locale] ?? titleByLocale.id,
    description: 'Halaman pendaftaran akun Alfian Tour.',
    alternates: { canonical: `/${locale}/register` },
  };
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}

