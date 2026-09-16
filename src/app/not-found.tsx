export default function RootNotFound() {
  return (
    <div className="min-h-screen p-4 flex items-center justify-center bg-zinc-50">
      <section className="w-full max-w-sm rounded-3xl bg-white border p-6 text-center space-y-3">
        <p className="text-xs font-semibold tracking-[0.2em] text-zinc-400">404</p>
        <h1 className="text-xl font-extrabold">Halaman tidak ditemukan</h1>
        <p className="text-sm text-zinc-500">Maaf, halaman yang kamu cari tidak tersedia.</p>
        <a
          href="/id"
          className="inline-flex items-center justify-center px-4 py-2 rounded-full g-main text-white text-sm font-semibold"
        >
          Kembali ke Beranda
        </a>
      </section>
    </div>
  );
}
