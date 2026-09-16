import { Link } from '@/i18n/routing-patch';

export default async function UnauthorizedPage({
  searchParams,
}: {
  searchParams?: Promise<{ returnUrl?: string }>;
}) {
  const sp = (await searchParams) ?? {};
  const returnUrl = sp.returnUrl;

  return (
    <div className="p-4 min-h-[70vh] flex items-center justify-center">
      <div className="w-full max-w-md bg-white border rounded-3xl p-6 text-center space-y-3">
        <div className="text-2xl font-extrabold text-red-600">401</div>
        <h1 className="text-base font-bold">Anda Tidak Memiliki Akses</h1>
        {returnUrl ? <p className="text-[11px] text-zinc-500 break-all">Target: {returnUrl}</p> : null}
        <div className="flex gap-2 justify-center pt-2">
          <Link href="/akun" className="rounded-xl border px-4 py-2 text-xs font-semibold">Kembali ke Akun</Link>
          <Link href="/" className="rounded-xl bg-primary-600 text-white px-4 py-2 text-xs font-semibold">Ke Beranda</Link>
        </div>
      </div>
    </div>
  );
}
