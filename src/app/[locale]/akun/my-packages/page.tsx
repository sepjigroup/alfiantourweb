import { Link } from '@/i18n/routing-patch';

import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;

  const titleByLocale: Record<string, string> = {
    id: "Paket Saya",
    en: "My Packages",
    ar: "باقاتي",
  };

  return {
    title: titleByLocale[locale] ?? titleByLocale.id,
  };
}

export default function MyPackagesPage() {
  return (
    <div className="p-4 space-y-4 animate-fade-up">
      <div className="bg-white border rounded-3xl p-5">
        <h1 className="text-lg font-extrabold g-text">Paket Saya</h1>
        <p className="text-sm text-zinc-500 mt-2">Halaman daftar paket yang diambil user. Siap sambungkan endpoint transaksi/order.</p>
      </div>
      <Link href="/akun" className="inline-flex text-sm text-primary-600">← Kembali ke Akun</Link>
    </div>
  );
}

