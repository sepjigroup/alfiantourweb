import { BackButton } from "@/components/BackButton";
import { getLocalizedAlternates } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  return {
    title: "Materi Zoom Presentasi",
    description:
      "Materi presentasi Zoom lengkap untuk demo web client: alur bisnis, fitur utama, script presenter, dan Q&A.",
    alternates: getLocalizedAlternates(locale, "/information/zoom-presentation"),
  };
}

export default function ZoomPresentationPage() {
  const agenda = [
    "Pembukaan dan positioning bisnis (3 menit)",
    "Demo publik: home, pack, detail iklan, form order (10 menit)",
    "Demo akun internal: kelola paket, master data, feeds/gallery/video, tracking (12 menit)",
    "Affiliate flow: referral, broadcast, follow up, closing (8 menit)",
    "Sesi tanya jawab dan next step onboarding (7 menit)",
  ];

  const publicDemo = [
    "Buka halaman Home: tunjukkan section unggulan, flash sale, dan paket terbaru.",
    "Masuk ke /pack: jelaskan filter layanan, kartu paket, dan indikator kursi tersedia.",
    "Klik detail paket: tunjukkan itinerary, include/exclude, seat, dan form pemesanan.",
    "Tekankan disclaimer pembayaran resmi PT di detail paket.",
    "Tunjukkan share link detail paket + format referral @username.",
  ];

  const adminDemo = [
    "Masuk /akun: jelaskan dashboard menu berbasis role.",
    "Buka Kelola Paket: create/edit wizard, harga, jadwal keberangkatan, kursi.",
    "Buka Master Data: user management, branch, package type, duration type, dll.",
    "Buka Kelola Feeds/Gallery/Video: alur konten promosi terpusat.",
    "Buka Tracking Settings: sinkron pixel/ads untuk akuisisi digital.",
  ];

  const affiliateNarrative = [
    "Setiap agen punya link referral pribadi untuk promosi.",
    "Ketika calon jamaah klik link referral, sistem menyimpan atribusi selama 15 hari.",
    "Order yang valid pada masa tersebut tetap terhubung ke agen pemilik referral.",
    "Agen bisa gunakan materi broadcast + follow-up + closing dari panduan affiliate.",
  ];

  const presenterScript = [
    "Opening: Kami membangun operating system untuk travel umroh agar proses penjualan sampai operasional berjalan dalam satu platform.",
    "Pain Point: Sebelumnya proses tersebar di chat, spreadsheet, dan tools terpisah sehingga lambat dan rawan miss.",
    "Solution: Di platform ini, data produk, jadwal, kursi, konten promosi, tracking, sampai referral agen terintegrasi.",
    "Value: Dampaknya adalah akuisisi lebih terukur, operasional lebih rapi, dan potensi repeat order lebih tinggi.",
    "CTA: Setelah sesi ini, kami bisa lanjutkan onboarding akun dan setup awal sesuai kebutuhan tim Anda.",
  ];

  const qa = [
    { q: "Apakah ini bisa dipakai multi-cabang?", a: "Bisa. Struktur user dan branch sudah dipisahkan, termasuk pengaturan akses menu per role." },
    { q: "Bagaimana keamanan pembayaran?", a: "Sistem menegaskan pembayaran hanya ke rekening resmi PT di halaman informasi pembayaran." },
    { q: "Apakah bisa dipakai untuk promosi agen?", a: "Bisa. Sudah ada skema referral, link @username, dan materi broadcast siap pakai." },
    { q: "Kalau konten promosi banyak, apakah tetap rapi?", a: "Bisa. Feeds, gallery, dan video sudah dipisahkan agar tim marketing lebih terstruktur." },
  ];

  return (
    <div className="p-4 space-y-4 animate-fade-up">
      <div className="flex items-center gap-3 pt-2">
        <BackButton />
        <h1 className="text-lg font-extrabold">Materi Zoom Presentasi</h1>
      </div>

      <section className="rounded-3xl border bg-gradient-to-r from-sky-50 via-blue-50 to-indigo-50 p-4">
        <p className="text-sm font-bold text-zinc-900">Tujuan Presentasi</p>
        <p className="text-xs text-zinc-700 mt-1 leading-relaxed">
          Menjelaskan nilai bisnis, mendemokan fitur inti web client, dan mengarahkan peserta ke keputusan onboarding.
        </p>
      </section>

      <section className="rounded-3xl border bg-white p-4 space-y-2">
        <p className="text-sm font-bold text-zinc-900">1. Rundown (40 Menit)</p>
        <ol className="list-decimal pl-4 text-xs text-zinc-700 space-y-1">
          {agenda.map((x) => <li key={x}>{x}</li>)}
        </ol>
      </section>

      <section className="rounded-3xl border bg-white p-4 space-y-2">
        <p className="text-sm font-bold text-zinc-900">2. Demo Alur Publik</p>
        <ol className="list-decimal pl-4 text-xs text-zinc-700 space-y-1">
          {publicDemo.map((x) => <li key={x}>{x}</li>)}
        </ol>
      </section>

      <section className="rounded-3xl border bg-white p-4 space-y-2">
        <p className="text-sm font-bold text-zinc-900">3. Demo Alur Internal (Akun)</p>
        <ol className="list-decimal pl-4 text-xs text-zinc-700 space-y-1">
          {adminDemo.map((x) => <li key={x}>{x}</li>)}
        </ol>
      </section>

      <section className="rounded-3xl border bg-white p-4 space-y-2">
        <p className="text-sm font-bold text-zinc-900">4. Narasi Affiliate (Saat Presentasi)</p>
        <ul className="list-disc pl-4 text-xs text-zinc-700 space-y-1">
          {affiliateNarrative.map((x) => <li key={x}>{x}</li>)}
        </ul>
      </section>

      <section className="rounded-3xl border bg-gradient-to-r from-emerald-50 via-lime-50 to-green-50 p-4 space-y-2">
        <p className="text-sm font-bold text-zinc-900">5. Script Presenter (Siap Baca)</p>
        <ol className="list-decimal pl-4 text-xs text-zinc-800 space-y-1">
          {presenterScript.map((x) => <li key={x}>{x}</li>)}
        </ol>
      </section>

      <section className="rounded-3xl border bg-white p-4 space-y-2">
        <p className="text-sm font-bold text-zinc-900">6. Q&A Cepat</p>
        <div className="space-y-2">
          {qa.map((item) => (
            <div key={item.q} className="rounded-xl border bg-zinc-50 p-3">
              <p className="text-xs font-semibold text-zinc-900">Q: {item.q}</p>
              <p className="text-xs text-zinc-700 mt-1">A: {item.a}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-3xl border bg-amber-50 p-4">
        <p className="text-sm font-bold text-amber-900">7. Closing Yang Disarankan</p>
        <p className="text-xs text-amber-800 mt-1 leading-relaxed">
          Jika Bapak/Ibu berkenan, setelah sesi ini kita lanjut onboarding singkat: setup role user, input paket unggulan, aktivasi tracking, dan simulasi referral pertama.
        </p>
      </section>
    </div>
  );
}

