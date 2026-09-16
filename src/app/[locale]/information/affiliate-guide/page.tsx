'use client';

import { useMemo, useState } from 'react';
import { BackButton } from '@/components/BackButton';

const LOGIN_URL = 'https://alfiantour.com/login';
type TemplateItem = { title: string; body: string };

export default function AffiliateGuidePage() {
  const [copyMsg, setCopyMsg] = useState('');
  const templates = useMemo<TemplateItem[]>(
    () => [
      {
        title: 'Template 1 - Broadcast Pembuka (Warm Leads)',
        body: `Assalamu'alaikum Bapak/Ibu 🙏

InsyaAllah kami sedang membuka pendaftaran Program Umrah dengan pendampingan dari awal sampai keberangkatan.
Jika Bapak/Ibu berkenan, silakan lihat pilihan paket terbaru melalui link resmi berikut:
(tempel link referral Anda)

Jika ada yang ingin ditanyakan (jadwal, biaya, atau pendampingan), saya siap bantu jelaskan dengan nyaman, tanpa komitmen dulu 😊

Jazakumullahu khairan.`,
      },
      {
        title: 'Template 2 - Follow Up (H+1 / H+2)',
        body: `Assalamu'alaikum Bapak/Ibu, izin follow up ya 🙏

Kemarin saya sempat kirim info paket umrah ini:
(tempel link referral Anda)

Kalau berkenan, saya bantu rekomendasikan 2-3 paket yang paling sesuai dengan:
1) Budget Bapak/Ibu
2) Waktu keberangkatan yang diinginkan
3) Preferensi kamar dan fasilitas

Tinggal balas: "Mau rekomendasi", nanti saya kirim rinciannya.`,
      },
      {
        title: 'Template 3 - Closing Halus',
        body: `Assalamu'alaikum Bapak/Ibu 🙏

Terima kasih sudah meluangkan waktu melihat program yang saya kirim.
Jika Bapak/Ibu sudah cocok, kita bisa lanjut proses pengamanan seat terlebih dahulu.

Langkahnya sederhana:
1) Konfirmasi paket pilihan
2) Isi data jamaah awal
3) Tim kami bantu proses berikutnya sampai tuntas

Untuk mulai, silakan pilih paket dari link ini:
(tempel link referral Anda)

InsyaAllah saya dampingi sampai selesai.`,
      },
      {
        title: 'Template 4 - Reaktivasi Kontak Lama',
        body: `Assalamu'alaikum Bapak/Ibu, semoga sehat selalu.

Izin update, saat ini ada beberapa pilihan program umrah terbaru dengan jadwal keberangkatan yang lebih fleksibel.
Jika Bapak/Ibu masih berencana berangkat, silakan cek melalui link berikut:
(tempel link referral Anda)

Jika berkenan, saya siap bantu bandingkan opsi paket agar lebih pas dengan kebutuhan keluarga.`,
      },
      {
        title: 'Template 5 - Soft Selling Umroh Ramah Lansia',
        body: `Assalamu'alaikum Bapak/Ibu 🙏

Ada kabar baik, kami membuka Program Umroh Ramah Lansia yang dirancang khusus untuk Ayah/Bunda, kakek-nenek, dan jamaah yang membutuhkan pendampingan lebih tenang.

Program ini biasanya cepat diminati karena:
1) Pendampingan lebih intens
2) Ritme perjalanan lebih nyaman
3) Fokus ibadah dengan layanan yang lebih perhatian

Silakan cek detail programnya di sini:
(tempel link referral Anda)

Jika berkenan, saya bantu pilihkan opsi paling sesuai untuk keluarga.`,
      },
      {
        title: 'Template 6 - Soft Selling Story-Based',
        body: `Assalamu'alaikum 🙏

Banyak keluarga yang punya niat memberangkatkan orang tua, tapi masih bingung soal kenyamanan selama perjalanan.

Karena itu, kami siapkan Program Umroh Ramah Lansia dengan pola pendampingan yang lebih hangat dan terarah, agar Ayah/Bunda bisa ibadah lebih tenang.

Detail paket bisa dilihat di:
(tempel link referral Anda)

Kalau Bapak/Ibu mau, saya bantu jelaskan perbandingan paketnya secara ringkas.`,
      },
      {
        title: 'Template 7 - Soft Selling untuk Follow Up Minat',
        body: `Assalamu'alaikum Bapak/Ibu, izin follow up ya 🙏

Untuk rencana umroh orang tua, saat ini ada opsi Program Umroh Ramah Lansia yang cukup banyak ditanyakan karena pendampingannya lebih nyaman.

Kalau Bapak/Ibu berkenan, saya kirim 2 rekomendasi terbaik sesuai:
1) Budget keluarga
2) Waktu keberangkatan
3) Kebutuhan pendampingan

Link program:
(tempel link referral Anda)`,
      },
    ],
    []
  );

  const copyText = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopyMsg(`${label} berhasil disalin`);
      setTimeout(() => setCopyMsg(''), 1800);
    } catch {
      setCopyMsg('Gagal menyalin teks');
      setTimeout(() => setCopyMsg(''), 1800);
    }
  };

  return (
    <div className="p-4 space-y-4 animate-fade-up">
      <div className="flex items-center gap-3 pt-2">
        <BackButton />
        <h1 className="text-lg font-extrabold">Panduan Affiliate Kepala Cabang</h1>
      </div>

      <div className="rounded-2xl p-4 space-y-2 border bg-gradient-to-r from-amber-50 via-orange-50 to-rose-50">
        <p className="text-sm font-semibold text-zinc-900">Skema Kerja Affiliate Agensi</p>
        <ol className="text-xs text-zinc-700 space-y-1 list-decimal pl-4">
          <li>Login ke akun agen: <span className="font-mono">{LOGIN_URL}</span></li>
          <li>Masuk menggunakan username dan password Anda yang sudah kami informasikan.</li>
          <li>Ambil link referral pribadi dari akun Anda.</li>
          <li>Sebarkan link melalui WhatsApp personal, grup komunitas, status, dan media sosial.</li>
          <li>Saat calon jamaah klik link, sistem menandai referral ke akun Anda selama 15 hari.</li>
          <li>Jika terjadi order dalam masa aktif referral, order tetap tercatat ke akun agen Anda.</li>
        </ol>
      </div>

      <div className="rounded-2xl p-4 space-y-2 border bg-gradient-to-r from-sky-50 via-cyan-50 to-teal-50">
        <p className="text-sm font-semibold text-zinc-900">Strategi Eksekusi Step-by-Step</p>
        <ol className="text-xs text-zinc-700 space-y-1 list-decimal pl-4">
          <li>Hari 1: Kirim Template Broadcast Pembuka ke kontak prioritas.</li>
          <li>Hari 2: Follow up hanya ke kontak yang sudah membaca/merespons.</li>
          <li>Hari 3-4: Kirim rekomendasi paket personal (sesuai budget dan jadwal).</li>
          <li>Hari 5+: Lakukan closing halus, ajak calon jamaah amankan seat.</li>
          <li>Catat hasil: jumlah chat, jumlah klik link, jumlah calon jamaah serius, jumlah closing.</li>
        </ol>
      </div>

      <div className="rounded-2xl p-4 space-y-2 border bg-gradient-to-r from-violet-50 via-fuchsia-50 to-pink-50">
        <p className="text-sm font-semibold text-zinc-900">Panduan Follow Up</p>
        <ol className="text-xs text-zinc-700 space-y-1 list-decimal pl-4">
          <li>Jangan langsung hard selling di pesan pertama.</li>
          <li>Tanyakan kebutuhan utama: jadwal, budget, dan jumlah jamaah.</li>
          <li>Berikan maksimal 2-3 opsi paket agar calon jamaah tidak bingung.</li>
          <li>Gunakan kalimat pendampingan: “saya bantu sampai proses selesai”.</li>
          <li>Jika belum siap, minta izin follow up ulang 3-5 hari kemudian.</li>
        </ol>
      </div>

      <div className="rounded-2xl p-4 space-y-2 border bg-gradient-to-r from-emerald-50 via-lime-50 to-green-50">
        <p className="text-sm font-semibold text-zinc-900">Panduan Closing</p>
        <ol className="text-xs text-zinc-700 space-y-1 list-decimal pl-4">
          <li>Rangkum benefit paket secara singkat dan jelas.</li>
          <li>Berikan opsi langkah kecil: “amankan seat dulu”.</li>
          <li>Sampaikan bahwa Anda akan dampingi proses administrasi.</li>
          <li>Tutup dengan CTA tunggal: pilih paket dan lanjutkan proses.</li>
        </ol>
      </div>

      <div className="rounded-2xl p-4 space-y-3 border bg-white">
        <p className="text-sm font-semibold text-zinc-900">Template WhatsApp Siap Pakai</p>
        {templates.map((t, i) => (
          <div key={i} className="border rounded-xl p-3 space-y-2 bg-zinc-50">
            <div className="text-[12px] font-bold text-zinc-800">{t.title}</div>
            <pre className="text-[11px] whitespace-pre-wrap font-sans text-zinc-800">{t.body}</pre>
            <button
              type="button"
              onClick={() => copyText(t.body, `Template ${i + 1}`)}
              className="h-8 px-3 rounded-lg border bg-white text-[11px] font-semibold"
            >
              Copy Template {i + 1}
            </button>
          </div>
        ))}
        {copyMsg ? <div className="text-[11px] text-emerald-600">{copyMsg}</div> : null}
      </div>

      <div className="rounded-2xl p-4 space-y-1 border bg-gradient-to-r from-blue-50 via-indigo-50 to-cyan-50">
        <p className="text-sm font-semibold text-zinc-900">Simulasi Percakapan (Promosi sampai Closing)</p>
        <ol className="text-xs text-zinc-700 space-y-1 list-decimal pl-4">
          <li>Agen: kirim Template 1 + link referral.</li>
          <li>Calon jamaah: “Ada paket berangkat akhir tahun?”</li>
          <li>Agen: kirim 2 opsi paket + tanya budget dan jumlah jamaah.</li>
          <li>Calon jamaah: “Kami 2 orang, budget menengah.”</li>
          <li>Agen: kirim rekomendasi paling pas + benefit inti.</li>
          <li>Agen: kirim Template 3 (Closing Halus) untuk ajak amankan seat.</li>
          <li>Calon jamaah setuju lanjut proses.</li>
        </ol>
      </div>

      <div className="rounded-2xl p-4 border bg-gradient-to-r from-yellow-50 via-amber-50 to-orange-50 space-y-2">
        <p className="text-sm font-bold text-zinc-900">Benefit Komisi Affiliate</p>
        <ul className="text-xs text-zinc-800 space-y-1 list-disc pl-4">
          <li>Komisi menarik dari setiap transaksi valid melalui link referral Anda.</li>
          <li>Jika jamaah melakukan order kedua kali, agen tetap mendapatkan komisi lagi.</li>
          <li>Pencarian komisi dari akun alfiantour.com dapat dilakukan penarikan minimal saldo Rp50.000 dan maksimal penarikan tidak terbatas.</li>
          <li>Tidak dibatasi jumlah referral: semakin aktif promosi, semakin besar potensi komisi.</li>
          <li>Potensi penghasilan besar: dari satu penjualan yang tepat, komisi bisa mencapai jutaan rupiah.</li>
        </ul>
      </div>

      <div className="rounded-2xl p-4 border bg-gradient-to-r from-rose-50 via-pink-50 to-purple-50 space-y-2">
        <p className="text-sm font-bold text-zinc-900">Peluang Tambahan Selain Paket Umroh</p>
        <ul className="text-xs text-zinc-800 space-y-1 list-disc pl-4">
          <li>Anda juga bisa promosi produk marketplace yang tersedia di ekosistem platform.</li>
          <li>Gunakan pendekatan bundling: kebutuhan ibadah + produk pendukung perjalanan.</li>
          <li>Fokuskan promosi pada manfaat dan kemudahan pembelian untuk calon jamaah.</li>
        </ul>
      </div>

      <div className="rounded-2xl p-4 border bg-gradient-to-r from-cyan-50 via-sky-50 to-blue-50 space-y-2">
        <p className="text-sm font-bold text-zinc-900">Format Link Referral dengan Username</p>
        <p className="text-xs text-zinc-800">
          Untuk promosi detail paket, Anda bisa gunakan format link berikut:
        </p>
        <p className="text-xs font-mono text-zinc-900 bg-white border rounded-lg px-2 py-1">
          https://alfiantour.com/id/pack/nama-slug-paket@username-anda
        </p>
        <p className="text-xs text-zinc-800">
          Contoh:
        </p>
        <p className="text-xs font-mono text-zinc-900 bg-white border rounded-lg px-2 py-1">
          https://alfiantour.com/id/pack/umrah-plus-thaif-12-hari-2027@superadmin
        </p>
        <p className="text-xs text-zinc-800">
          Jika posisi Anda sedang login, sistem juga otomatis menanamkan referral pada alur yang didukung.
        </p>
      </div>
    </div>
  );
}
