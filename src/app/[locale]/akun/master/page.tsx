'use client';

import { Link } from '@/i18n/routing-patch';

const masterGroups = [
  {
    title: 'Organisasi & Akses',
    description: 'Data internal untuk cabang, user, dan hak akses.',
    tone: 'from-slate-50 to-zinc-50',
    items: [
      { icon: '🏢', label: 'Branch', href: '/akun/master/branch', hint: 'Cabang dan struktur operasional' },
      { icon: '👥', label: 'User Management', href: '/akun/master/user-management', hint: 'Akun tim dan admin' },
      { icon: '🪪', label: 'Roles', href: '/akun/master/roles', hint: 'Role dan permission' },
      { icon: '🏛️', label: 'Company Profiles', href: '/akun/master/company-profiles', hint: 'Profil legal dan brand' },
    ],
  },
  {
    title: 'Produk & Paket',
    description: 'Master utama untuk membuat paket perjalanan.',
    tone: 'from-amber-50 to-orange-50',
    items: [
      { icon: '📦', label: 'Programs (Paket)', href: '/akun/kelola-paket', hint: 'Kelola paket aktif' },
      { icon: '🧩', label: 'Kelola Layanan', href: '/akun/master/kelola-layanan', hint: 'Kategori dan layanan paket' },
      { icon: '🧳', label: 'Package Types', href: '/akun/master/package-types', hint: 'Tipe paket' },
      { icon: '🎫', label: 'Package Class Masters', href: '/akun/master/package-class-masters', hint: 'Kelas paket dan harga' },
      { icon: '🔖', label: 'Package Label Tags', href: '/akun/master/package-label-tags', hint: 'Label promo dan badge' },
      { icon: '📄', label: 'Terms Templates', href: '/akun/master/terms-templates', hint: 'Template syarat dan ketentuan' },
    ],
  },
  {
    title: 'Akomodasi & Perjalanan',
    description: 'Referensi maskapai, bandara, hotel, durasi, dan musim.',
    tone: 'from-sky-50 to-cyan-50',
    items: [
      { icon: '🛫', label: 'Airlines', href: '/akun/master/airlines', hint: 'Maskapai penerbangan' },
      { icon: '🛬', label: 'Airports', href: '/akun/master/airports', hint: 'Bandara asal dan tujuan' },
      { icon: '🏨', label: 'Hotels', href: '/akun/master/hotels', hint: 'Hotel Makkah, Madinah, dan lainnya' },
      { icon: '🛏️', label: 'Room Type Masters', href: '/akun/master/room-type-masters', hint: 'Tipe kamar' },
      { icon: '⏱️', label: 'Duration Types', href: '/akun/master/duration-types', hint: 'Durasi perjalanan' },
      { icon: '🗓️', label: 'Departure Seasons', href: '/akun/master/departure-seasons', hint: 'Musim keberangkatan' },
    ],
  },
  {
    title: 'Aturan, Fasilitas & Keuangan',
    description: 'Kebutuhan jamaah, fasilitas, asuransi, dan mata uang.',
    tone: 'from-emerald-50 to-teal-50',
    items: [
      { icon: '🛡️', label: 'Insurance Types', href: '/akun/master/insurance-types', hint: 'Jenis asuransi' },
      { icon: '🧱', label: 'Facility Masters', href: '/akun/master/facility-masters', hint: 'Fasilitas layanan' },
      { icon: '📋', label: 'Requirement Masters', href: '/akun/master/requirement-masters', hint: 'Persyaratan dokumen dan layanan' },
      { icon: '💱', label: 'Currency Masters', href: '/akun/master/currency-masters', hint: 'Mata uang dan kurs' },
    ],
  },
  {
    title: 'Konten & Marketing',
    description: 'Aset visual, template program, banner, dan kebutuhan promosi.',
    tone: 'from-rose-50 to-pink-50',
    items: [
      { icon: '🖼️', label: 'Media Assets', href: '/akun/master/media-assets', hint: 'Gambar dan media' },
      { icon: '🗂️', label: 'Program Templates', href: '/akun/master/program-templates', hint: 'Template konten paket' },
      { icon: '🎨', label: 'Design Theme Masters', href: '/akun/master/design-theme-masters', hint: 'Tema desain promosi' },
      { icon: '📰', label: 'Poster Type Masters', href: '/akun/master/poster-type-masters', hint: 'Jenis poster' },
      { icon: '🖥️', label: 'Hero Banners', href: '/akun/master/hero-banners', hint: 'Banner halaman publik' },
    ],
  },
  {
    title: 'Sistem',
    description: 'Pengaturan teknis dan maintenance.',
    tone: 'from-violet-50 to-indigo-50',
    items: [
      { icon: '⚙️', label: 'Tracking & Maintenance', href: '/akun/tracking-settings', hint: 'Tracking, SEO, dan perawatan' },
    ],
  },
];

export default function MasterDataIndexPage() {
  const totalMenus = masterGroups.reduce((total, group) => total + group.items.length, 0);

  return (
    <div className="p-4 md:p-6 space-y-5 animate-fade-up">
      <div className="relative overflow-hidden rounded-3xl border border-zinc-200 bg-gradient-to-br from-zinc-950 via-zinc-900 to-slate-800 p-5 text-white shadow-sm md:p-6">
        <div className="absolute -right-12 -top-16 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute -bottom-20 left-12 h-44 w-44 rounded-full bg-amber-300/20 blur-3xl" />
        <div className="relative flex items-start justify-between gap-4">
          <div className="space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-amber-200">Pusat konfigurasi</p>
            <h1 className="text-xl font-extrabold md:text-2xl">Master Data</h1>
            <p className="max-w-xl text-xs leading-5 text-zinc-300 md:text-sm">
              Menu sudah dikelompokkan berdasarkan alur kerja supaya tim lebih cepat menemukan data yang ingin dikelola.
            </p>
          </div>
          <Link href="/akun" className="shrink-0 rounded-full border border-white/20 bg-white/10 px-3 py-2 text-xs font-semibold text-white backdrop-blur hover:bg-white/15">
            Akun
          </Link>
        </div>
        <div className="relative mt-5 grid grid-cols-2 gap-3 md:max-w-md">
          <div className="rounded-2xl border border-white/10 bg-white/10 p-3 backdrop-blur">
            <p className="text-2xl font-black">{masterGroups.length}</p>
            <p className="text-[11px] text-zinc-300">Kelompok</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/10 p-3 backdrop-blur">
            <p className="text-2xl font-black">{totalMenus}</p>
            <p className="text-[11px] text-zinc-300">Menu master</p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {masterGroups.map((group) => (
          <section key={group.title} className={`rounded-3xl border border-zinc-200 bg-gradient-to-br ${group.tone} p-4 shadow-sm md:p-5`}>
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-sm font-extrabold text-zinc-900 md:text-base">{group.title}</h2>
                <p className="mt-1 text-xs leading-5 text-zinc-600">{group.description}</p>
              </div>
              <span className="rounded-full border border-white/70 bg-white/70 px-3 py-1 text-[11px] font-bold text-zinc-600 shadow-sm">
                {group.items.length} item
              </span>
            </div>

            <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
              {group.items.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="group flex min-h-[82px] items-center gap-3 rounded-2xl border border-white/80 bg-white/85 px-4 py-3 shadow-sm transition-all hover:-translate-y-0.5 hover:border-zinc-300 hover:bg-white hover:shadow-md"
                >
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-zinc-100 text-xl ring-1 ring-zinc-200 transition-colors group-hover:bg-zinc-900 group-hover:ring-zinc-900">
                    <span className="transition-transform group-hover:scale-110">{item.icon}</span>
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-extrabold text-zinc-900">{item.label}</span>
                    <span className="mt-0.5 block line-clamp-2 text-[11px] leading-4 text-zinc-500">{item.hint}</span>
                  </span>
                  <span className="text-lg font-semibold text-zinc-300 transition-transform group-hover:translate-x-1 group-hover:text-zinc-800">›</span>
                </Link>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

