import { redirect } from 'next/navigation';

export default async function LegacyKelolaLayananRedirect({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  redirect(`/${locale}/akun/master/kelola-layanan`);
}
