'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Link } from '@/i18n/routing-patch';
import { useToast } from '@/components/Toast';
import { fetchPublicCareerDetail, submitCareerApplication, type CareerJobItem } from '@/lib/careers-api';
import { BackButton } from '@/components/BackButton';

export default function ApplyJobPage() {
  const params = useParams();
  const router = useRouter();
  const { show } = useToast();
  const slug = String(params?.slug || '');

  const [job, setJob] = useState<CareerJobItem | null>(null);
  const [loadingJob, setLoadingJob] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Form states
  const [fullName, setFullName] = useState('');
  const [gender, setGender] = useState('Laki-laki');
  const [whatsAppNumber, setWhatsAppNumber] = useState('');
  const [email, setEmail] = useState('');
  const [age, setAge] = useState('');
  const [lastEducation, setLastEducation] = useState('S1');
  const [cvUrl, setCvUrl] = useState('');
  const [motivation, setMotivation] = useState('');
  const [goal, setGoal] = useState('');
  const [isWillingToConsiderOtherPositions, setIsWillingToConsiderOtherPositions] = useState(false);
  const [whyInterested, setWhyInterested] = useState('');
  const [strengths, setStrengths] = useState('');
  const [weaknesses, setWeaknesses] = useState('');
  const [hasOwnVehicle, setHasOwnVehicle] = useState(false);
  const [infoSource, setInfoSource] = useState('Sosial Media');
  const [startDate, setStartDate] = useState('');
  const [consentKualifikasi, setConsentKualifikasi] = useState(false);
  const [consentKebenaranData, setConsentKebenaranData] = useState(false);

  useEffect(() => {
    if (!slug) return;
    void (async () => {
      try {
        const data = await fetchPublicCareerDetail(slug);
        setJob(data);
      } catch (e) {
        show('Gagal memuat detail pekerjaan.');
      } finally {
        setLoadingJob(false);
      }
    })();
  }, [slug]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!fullName.trim()) return show('Nama Lengkap wajib diisi');
    if (!whatsAppNumber.trim()) return show('Nomor WhatsApp wajib diisi');
    if (!email.trim() || !email.includes('@')) return show('Email tidak valid');
    if (!age || Number(age) <= 0) return show('Umur harus valid');
    if (!cvUrl.trim()) return show('Link akses CV wajib dicantumkan');
    if (!consentKualifikasi) return show('Anda harus menyetujui pernyataan kualifikasi');
    if (!consentKebenaranData) return show('Anda harus menyatakan kebenaran data');

    setSubmitting(true);
    try {
      await submitCareerApplication(slug, {
        fullName,
        gender,
        whatsAppNumber,
        email,
        age: Number(age),
        lastEducation,
        cvUrl,
        motivation,
        goal,
        isWillingToConsiderOtherPositions,
        whyInterested,
        strengths,
        weaknesses,
        hasOwnVehicle,
        infoSource,
        startDate,
        consentKualifikasi,
        consentKebenaranData,
      });

      setIsSuccess(true);
    } catch (err) {
      show(err instanceof Error ? err.message : 'Gagal mengirim lamaran');
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingJob) {
    return (
      <div className="p-4 space-y-4 animate-fade-up">
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="w-16 h-16 rounded-full border-4 border-primary-500 border-t-transparent animate-spin" />
          <p className="text-sm text-zinc-500 font-medium">Memuat formulir lamaran...</p>
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="p-6 text-center space-y-4">
        <h2 className="text-lg font-bold text-red-600">Pekerjaan Tidak Ditemukan</h2>
        <p className="text-sm text-zinc-500">Lowongan pekerjaan ini mungkin sudah ditutup atau tidak aktif lagi.</p>
        <Link href="/karir" className="inline-block rounded-xl bg-primary-600 text-white px-4 py-2 text-xs font-bold">
          Kembali ke Karir
        </Link>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="max-w-2xl mx-auto p-4 space-y-6 animate-fade-up">
        <div className="bg-white border rounded-3xl p-6 text-center space-y-4 shadow-lg shadow-zinc-100">
          <div className="mx-auto w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center text-3xl">
            ✓
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-zinc-900">Terima Kasih, Lamaran Terkirim!</h1>
            <p className="mt-2 text-sm text-zinc-600">
              Lamaran Anda untuk posisi <strong className="text-zinc-900">{job.title}</strong> telah berhasil kami terima. Tim kami akan melakukan review dan menghubungi Anda jika Anda memenuhi kualifikasi rekrutmen.
            </p>
          </div>
          <div className="pt-2">
            <Link
              href="/karir"
              className="inline-block rounded-2xl bg-zinc-900 text-white hover:bg-black px-6 py-3 text-xs font-bold transition-all shadow-md"
            >
              Lihat Lowongan Lain
            </Link>
          </div>
        </div>

        {/* Freelance Agent Promotional Card */}
        <div className="g-main text-white rounded-3xl p-6 space-y-4 shadow-xl shadow-primary-100">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🤝</span>
            <div>
              <h2 className="text-base font-extrabold">Tertarik Mendapatkan Penghasilan Tambahan?</h2>
              <p className="text-xs text-white/80">Gabung sebagai Agen Freelance Alfian Tour!</p>
            </div>
          </div>
          <p className="text-xs leading-relaxed text-white/90">
            Sembari menunggu kabar dari kami, Anda bisa mendaftar secara mandiri untuk menjadi agen lepas kami. Bantu jamaah umroh & haji lansia di sekitar Anda untuk berangkat ibadah dengan hangat, sabar, dan amanah, serta dapatkan komisi referral yang kompetitif langsung di saldo dompet Anda.
          </p>
          <div className="pt-2">
            <Link
              href="/akun"
              className="inline-block w-full text-center rounded-2xl bg-white text-primary-700 hover:bg-zinc-50 px-6 py-3 text-xs font-bold transition-all shadow-md"
            >
              Daftar Agen Freelance Sekarang
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-4 animate-fade-up">
      <div className="flex items-center gap-3 pt-2">
        <BackButton />
        <div className="min-w-0">
          <h1 className="text-lg font-extrabold leading-tight">Formulir Lamaran</h1>
          <p className="text-xs text-zinc-500">Posisi: {job.title}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white border rounded-3xl p-5 space-y-4 shadow-sm">
        <div className="space-y-3">
          <h3 className="text-sm font-extrabold text-zinc-900 border-b pb-2">Informasi Pribadi</h3>
          
          <label className="block space-y-1">
            <span className="text-xs font-bold text-zinc-700">Posisi yang Dilamar</span>
            <input
              type="text"
              value={job.title}
              disabled
              className="w-full border rounded-xl px-3 py-2 text-xs bg-zinc-50 text-zinc-500 font-semibold cursor-not-allowed"
            />
          </label>

          <label className="block space-y-1">
            <span className="text-xs font-bold text-zinc-700">Nama Lengkap (sesuai KTP) *</span>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Masukkan nama lengkap Anda"
              className="w-full border rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-primary-500 outline-none"
              required
            />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="block space-y-1">
              <span className="text-xs font-bold text-zinc-700">Jenis Kelamin *</span>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="w-full border rounded-xl px-3 py-2 text-xs bg-white focus:ring-1 focus:ring-primary-500 outline-none"
              >
                <option value="Laki-laki">Laki-laki</option>
                <option value="Perempuan">Perempuan</option>
              </select>
            </label>

            <label className="block space-y-1">
              <span className="text-xs font-bold text-zinc-700">Umur (tahun) *</span>
              <input
                type="number"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                placeholder="Contoh: 25"
                className="w-full border rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-primary-500 outline-none"
                required
              />
            </label>
          </div>

          <label className="block space-y-1">
            <span className="text-xs font-bold text-zinc-700">Nomor WhatsApp Aktif *</span>
            <input
              type="tel"
              value={whatsAppNumber}
              onChange={(e) => setWhatsAppNumber(e.target.value)}
              placeholder="Contoh: 081234567890"
              className="w-full border rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-primary-500 outline-none"
              required
            />
          </label>

          <label className="block space-y-1">
            <span className="text-xs font-bold text-zinc-700">Alamat Email Aktif *</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nama@email.com"
              className="w-full border rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-primary-500 outline-none"
              required
            />
          </label>

          <label className="block space-y-1">
            <span className="text-xs font-bold text-zinc-700">Pendidikan Terakhir *</span>
            <select
              value={lastEducation}
              onChange={(e) => setLastEducation(e.target.value)}
              className="w-full border rounded-xl px-3 py-2 text-xs bg-white focus:ring-1 focus:ring-primary-500 outline-none"
            >
              <option value="SMA/SMK">SMA/SMK</option>
              <option value="D3">D3</option>
              <option value="S1">S1</option>
              <option value="S2">S2</option>
              <option value="S3">S3</option>
            </select>
          </label>

          <label className="block space-y-1">
            <span className="text-xs font-bold text-zinc-700">Link Akses CV / Portofolio *</span>
            <span className="block text-[10px] text-zinc-400">Gunakan link Google Drive, OneDrive, atau Dropbox yang bisa diakses publik</span>
            <input
              type="url"
              value={cvUrl}
              onChange={(e) => setCvUrl(e.target.value)}
              placeholder="https://drive.google.com/..."
              className="w-full border rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-primary-500 outline-none"
              required
            />
          </label>
        </div>

        <div className="space-y-3 pt-3">
          <h3 className="text-sm font-extrabold text-zinc-900 border-b pb-2">Kuesioner Rekrutmen</h3>

          <label className="block space-y-1">
            <span className="text-xs font-bold text-zinc-700">Tuliskan mengapa Anda tertarik melamar di Alfian Tour</span>
            <textarea
              value={whyInterested}
              onChange={(e) => setWhyInterested(e.target.value)}
              placeholder="Jelaskan ketertarikan Anda melamar di travel spesialis lansia ini..."
              className="w-full border rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-primary-500 outline-none min-h-20"
            />
          </label>

          <label className="block space-y-1">
            <span className="text-xs font-bold text-zinc-700">Jelaskan apa saja kelebihan utama Anda yang relevan dengan posisi yang dilamar</span>
            <textarea
              value={strengths}
              onChange={(e) => setStrengths(e.target.value)}
              placeholder="Kelebihan utama yang bisa berkontribusi pada kemajuan tim..."
              className="w-full border rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-primary-500 outline-none min-h-20"
            />
          </label>

          <label className="block space-y-1">
            <span className="text-xs font-bold text-zinc-700">Apa kekurangan Anda yang sedang Anda perbaiki?</span>
            <textarea
              value={weaknesses}
              onChange={(e) => setWeaknesses(e.target.value)}
              placeholder="Jawab dengan jujur serta upaya perbaikan Anda..."
              className="w-full border rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-primary-500 outline-none min-h-20"
            />
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="block space-y-1">
              <span className="text-xs font-bold text-zinc-700">Motivasi Kerja</span>
              <input
                type="text"
                value={motivation}
                onChange={(e) => setMotivation(e.target.value)}
                placeholder="Contoh: Mengembangkan karir, membantu orangtua"
                className="w-full border rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-primary-500 outline-none"
              />
            </label>

            <label className="block space-y-1">
              <span className="text-xs font-bold text-zinc-700">Tujuan Karir Jangka Panjang</span>
              <input
                type="text"
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                placeholder="Contoh: Menjadi kepala tim dalam 3 tahun"
                className="w-full border rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-primary-500 outline-none"
              />
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="block space-y-1">
              <span className="text-xs font-bold text-zinc-700">Apakah Anda memiliki kendaraan pribadi?</span>
              <select
                value={hasOwnVehicle ? 'Ya' : 'Tidak'}
                onChange={(e) => setHasOwnVehicle(e.target.value === 'Ya')}
                className="w-full border rounded-xl px-3 py-2 text-xs bg-white focus:ring-1 focus:ring-primary-500 outline-none"
              >
                <option value="Tidak">Tidak</option>
                <option value="Ya">Ya</option>
              </select>
            </label>

            <label className="block space-y-1">
              <span className="text-xs font-bold text-zinc-700">Dari mana Anda mengetahui lowongan ini?</span>
              <select
                value={infoSource}
                onChange={(e) => setInfoSource(e.target.value)}
                className="w-full border rounded-xl px-3 py-2 text-xs bg-white focus:ring-1 focus:ring-primary-500 outline-none"
              >
                <option value="Website Resmi">Website Resmi</option>
                <option value="Sosial Media">Sosial Media</option>
                <option value="Teman/Rekomendasi">Teman/Rekomendasi</option>
                <option value="Job Board/LinkedIn">Job Board/LinkedIn</option>
              </select>
            </label>
          </div>

          <label className="block space-y-1">
            <span className="text-xs font-bold text-zinc-700">Jika diterima, kapan Anda dapat mulai bekerja?</span>
            <input
              type="text"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              placeholder="Contoh: Secepatnya, atau 1 bulan setelah diterima"
              className="w-full border rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-primary-500 outline-none"
            />
          </label>

          <label className="flex items-start gap-2 border rounded-xl p-3 bg-zinc-50 cursor-pointer">
            <input
              type="checkbox"
              checked={isWillingToConsiderOtherPositions}
              onChange={(e) => setIsWillingToConsiderOtherPositions(e.target.checked)}
              className="mt-0.5"
            />
            <span className="text-[11px] text-zinc-700">Saya Bersedia dipertimbangkan untuk posisi lain yang sesuai dengan kemampuan saya.</span>
          </label>
        </div>

        <div className="space-y-2 pt-3 border-t">
          <label className="flex items-start gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={consentKualifikasi}
              onChange={(e) => setConsentKualifikasi(e.target.checked)}
              className="mt-0.5"
              required
            />
            <span className="text-[11px] text-zinc-600 leading-relaxed">
              Saya memahami bahwa hanya kandidat yang memenuhi kualifikasi yang akan dihubungi untuk proses seleksi berikutnya. *
            </span>
          </label>

          <label className="flex items-start gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={consentKebenaranData}
              onChange={(e) => setConsentKebenaranData(e.target.checked)}
              className="mt-0.5"
              required
            />
            <span className="text-[11px] text-zinc-600 leading-relaxed">
              Dengan ini saya menyatakan bahwa seluruh data yang saya isi adalah benar dan saya bersedia mengikuti seluruh proses rekrutmen. *
            </span>
          </label>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-2xl bg-primary-600 text-white py-3.5 text-center text-xs font-bold shadow-lg disabled:opacity-60 transition-all inline-flex items-center justify-center gap-2"
        >
          {submitting ? <span className="h-3.5 w-3.5 rounded-full border-2 border-white/40 border-t-white animate-spin" /> : null}
          {submitting ? 'Mengirim Lamaran...' : 'Kirim Lamaran'}
        </button>
      </form>
    </div>
  );
}
