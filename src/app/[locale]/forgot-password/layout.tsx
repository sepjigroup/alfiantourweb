import type { Metadata } from 'next';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const titleByLocale: Record<string, string> = {
    id: 'Lupa Password',
    en: 'Forgot Password',
    ar: 'نسيت كلمة المرور',
  };
  return {
    title: titleByLocale[locale] ?? titleByLocale.id,
    description: 'Halaman pemulihan password akun Alfian Tour.',
    alternates: { canonical: `/${locale}/forgot-password` },
  };
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}

