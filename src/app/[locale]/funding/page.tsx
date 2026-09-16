"use client";

import { useLocale } from "next-intl";
import { Link } from "@/i18n/routing-patch";
import { BackButton } from "@/components/BackButton";
import { useState, useMemo } from "react";
import { Sparkles, ArrowRight, ShieldCheck, DollarSign, Clock, Landmark, Coins, TrendingUp, HelpCircle, ChevronRight } from "lucide-react";

export default function ProjectFundingPublicPage() {
  const locale = useLocale();
  const [investmentAmount, setInvestmentAmount] = useState(10000000); // Default Rp 10 Juta
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  const presets = [5000000, 10000000, 25000000, 50000000, 100000000];

  const formattedRupiah = (value: number) => {
    return "Rp " + value.toLocaleString("id-ID");
  };

  // Calculator logic: 12% - 15% ROI per year. Let's use 14% target for calculations.
  const roiCalculations = useMemo(() => {
    const roiRate = 0.14; // 14% p.a.
    const monthlyReturnRate = roiRate / 12;
    const sixMonthsReturn = investmentAmount * (roiRate / 2);
    const totalSixMonths = investmentAmount + sixMonthsReturn;

    const twelveMonthsReturn = investmentAmount * roiRate;
    const totalTwelveMonths = investmentAmount + twelveMonthsReturn;

    return {
      rate: "12% - 15%",
      sixMonthsReturn,
      totalSixMonths,
      twelveMonthsReturn,
      totalTwelveMonths
    };
  }, [investmentAmount]);

  const activeProjects = [
    {
      title: "Pembiayaan Tiket Umrah Musim Maulid 2026",
      roi: "14.5% p.a.",
      tenor: "6 Bulan",
      minInvest: "Rp 5 Juta",
      progress: 85,
      collected: "Rp 850 Juta",
      target: "Rp 1 Miliar",
      status: "Hampir Penuh"
    },
    {
      title: "Akomodasi Hotel Bintang 5 Makkah (Ramadhan 2027)",
      roi: "15.0% p.a.",
      tenor: "8 Bulan",
      minInvest: "Rp 10 Juta",
      progress: 60,
      collected: "Rp 1.2 Miliar",
      target: "Rp 2 Miliar",
      status: "Pendanaan Dibuka"
    },
    {
      title: "Charter Armada Bus Eksekutif Saudi Transport",
      roi: "13.8% p.a.",
      tenor: "12 Bulan",
      minInvest: "Rp 5 Juta",
      progress: 95,
      collected: "Rp 475 Juta",
      target: "Rp 500 Juta",
      status: "Segera Ditutup"
    }
  ];

  return (
    <div className="space-y-8 animate-fade-up">
      {/* Header */}
      <div className="flex items-center gap-3 pt-2">
        <BackButton />
        <div>
          <h1 className="text-xl font-extrabold text-zinc-900 leading-tight">Project Funding Syariah</h1>
          <p className="text-xs text-zinc-500 font-medium">Investasi berkah, imbal hasil kompetitif & amanah bersama Alfian Tour</p>
        </div>
      </div>

      {/* Hero Banner */}
      <section className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-zinc-950 via-zinc-900 to-slate-950 border border-zinc-800 p-8 md:p-12 text-white shadow-xl flex flex-col justify-between min-h-[300px]">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(234,179,8,0.1),transparent)] pointer-events-none" />
        <div className="relative z-10 max-w-2xl space-y-4">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-[#e8c978] border border-[#e8c978]/20 shadow-sm">
            <Sparkles size={11} className="text-[#e8c978]" />
            Bagi Hasil Kompetitif & Bebas Riba
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-black leading-tight">
            Investasi Berkah Proyek Umrah Mulai <span className="text-[#e8c978]">12% - 15%</span> per Tahun
          </h2>
          <p className="text-sm text-zinc-300 leading-relaxed font-medium">
            Salurkan dana produktif Anda untuk membiayai pengadaan hotel, tiket penerbangan, dan armada transportasi jamaah umrah/haji. Dikelola 100% menggunakan skema syariah Mudharabah & Musyarakah yang transparan dan amanah.
          </p>
        </div>
        <div className="pt-6 relative z-10 flex flex-wrap gap-4 items-center">
          <Link
            href="/login"
            className="rounded-2xl bg-amber-300 hover:bg-amber-400 text-zinc-950 font-bold px-7 py-3.5 text-xs shadow-md shadow-amber-400/20 transition-all flex items-center gap-1.5 hover:scale-[1.02]"
          >
            <span>Mulai Investasi Sekarang</span>
            <ArrowRight size={14} />
          </Link>
          <a
            href="https://wa.me/6285722022786?text=Halo%20Admin,%20saya%20tertarik%20mengenai%20project%20funding%20investasi%20di%20AlfianTour"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold px-6 py-3.5 text-xs transition-colors border border-white/10"
          >
            Hubungi Advisor Funding
          </a>
        </div>
      </section>

      {/* Nilai Utama / Keamanan */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { icon: <Landmark size={22} className="text-[#e8c978]" />, title: "Amanah Syariah", desc: "Bebas dari unsur riba, maysir, dan gharar dengan pembagian hasil adil." },
          { icon: <ShieldCheck size={22} className="text-[#e8c978]" />, title: "Mitra Kemenag RI", desc: "Alfian Tour beroperasi di bawah izin resmi PPIU No. 2024-AT-0812." },
          { icon: <TrendingUp size={22} className="text-[#e8c978]" />, title: "ROI Menarik & Stabil", desc: "Bagi hasil jauh di atas tingkat inflasi dan bunga deposito perbankan." },
          { icon: <Clock size={22} className="text-[#e8c978]" />, title: "Tenor Fleksibel", desc: "Masa pendanaan singkat mulai dari 6 bulan hingga maksimal 12 bulan." }
        ].map((item, idx) => (
          <div key={idx} className="rounded-3xl border border-zinc-200 bg-white p-5 space-y-3 shadow-xs">
            <div className="h-10 w-10 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center">
              {item.icon}
            </div>
            <h4 className="text-sm font-black text-zinc-900 leading-tight">{item.title}</h4>
            <p className="text-xs leading-relaxed text-zinc-500 font-medium">{item.desc}</p>
          </div>
        ))}
      </section>

      {/* ROI Calculator */}
      <section className="rounded-[2rem] border border-zinc-200 bg-white p-6 md:p-8 space-y-6 shadow-xs grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_380px] gap-8">
        <div className="space-y-6">
          <div className="space-y-2">
            <span className="text-[10px] font-black uppercase text-amber-600 bg-amber-50 border border-amber-100 px-3 py-1 rounded-full">Kalkulator Simulasi</span>
            <h3 className="text-lg font-black text-zinc-950">Simulasi Imbal Hasil Investasi</h3>
            <p className="text-xs text-zinc-500 font-medium">Hitung perkiraan bagi hasil yang akan Anda terima berdasarkan jumlah dana investasi.</p>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="block text-[10px] font-black uppercase tracking-wider text-zinc-400">Jumlah Dana Pendanaan (IDR)</label>
              <div className="flex gap-2 items-center flex-wrap">
                {presets.map((p) => (
                  <button
                    key={p}
                    onClick={() => setInvestmentAmount(p)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all border ${
                      investmentAmount === p
                        ? "bg-amber-500 text-white border-amber-500 shadow-sm"
                        : "bg-zinc-50 text-zinc-600 border-zinc-200/80 hover:bg-zinc-100"
                    }`}
                  >
                    {formattedRupiah(p)}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <label className="block text-[10px] font-black uppercase tracking-wider text-zinc-400">Masukkan Nominal Kustom</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400 font-black text-xs">Rp</div>
                <input
                  type="number"
                  min={5000000}
                  className="w-full rounded-2xl border border-zinc-200 pl-10 pr-3.5 py-3 text-xs font-black text-zinc-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                  value={investmentAmount || ""}
                  onChange={(e) => setInvestmentAmount(Number(e.target.value || 0))}
                  placeholder="Contoh: 15000000"
                />
              </div>
              <span className="text-[10px] text-zinc-400 font-semibold leading-relaxed block">Minimal pendanaan kustom adalah Rp 5.000.000</span>
            </div>
          </div>
        </div>

        {/* Results Panel */}
        <div className="rounded-2xl border border-zinc-200 bg-zinc-50/50 p-5 space-y-4 flex flex-col justify-between shadow-2xs">
          <div className="space-y-3">
            <h4 className="text-xs font-black text-zinc-800 border-b border-zinc-200 pb-2 flex items-center gap-1.5">
              <Coins size={14} className="text-amber-500" />
              Rincian Estimasi Bagi Hasil
            </h4>

            <div className="space-y-3.5 pt-1">
              <div className="flex justify-between border-b border-dashed pb-2">
                <span className="text-[10px] font-semibold text-zinc-500">Estimasi Bagi Hasil (p.a.)</span>
                <span className="text-xs font-black text-emerald-600">{roiCalculations.rate}</span>
              </div>
              <div className="space-y-1">
                <div className="text-[9px] font-black uppercase tracking-wider text-zinc-400">Tenor 6 Bulan</div>
                <div className="text-sm font-black text-zinc-800">{formattedRupiah(roiCalculations.sixMonthsReturn)}</div>
                <div className="text-[9px] text-zinc-400 font-bold">Total Pengembalian: {formattedRupiah(roiCalculations.totalSixMonths)}</div>
              </div>
              <div className="space-y-1 pt-1">
                <div className="text-[9px] font-black uppercase tracking-wider text-zinc-400">Tenor 12 Bulan</div>
                <div className="text-sm font-black text-zinc-800">{formattedRupiah(roiCalculations.twelveMonthsReturn)}</div>
                <div className="text-[9px] text-zinc-400 font-bold">Total Pengembalian: {formattedRupiah(roiCalculations.totalTwelveMonths)}</div>
              </div>
            </div>
          </div>

          <Link
            href="/login"
            className="w-full text-center rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-black py-3 text-xs shadow-md shadow-amber-500/20 transition-all block mt-4"
          >
            Investasikan Dana Ini
          </Link>
        </div>
      </section>

      {/* Proyek Aktif Terbuka */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-extrabold text-zinc-950 flex items-center gap-2">
            <TrendingUp size={18} className="text-amber-500" />
            <span>Daftar Proyek Aktif Dibuka</span>
          </h3>
          <span className="text-[10px] font-black text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-100">3 Proyek Terbuka</span>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {activeProjects.map((proj, idx) => (
            <div key={idx} className="rounded-3xl border border-zinc-200 bg-white p-5 flex flex-col justify-between shadow-xs">
              <div className="space-y-4">
                <div className="flex justify-between items-start gap-2">
                  <span className="text-[9px] font-black uppercase tracking-wider text-amber-700 bg-amber-50 border border-amber-100 rounded px-2 py-0.5">{proj.status}</span>
                  <span className="text-xs font-black text-emerald-600">{proj.roi}</span>
                </div>
                <h4 className="text-xs font-black text-zinc-900 leading-snug">{proj.title}</h4>
                <div className="grid grid-cols-2 gap-2 text-[10px] border-t border-zinc-50 pt-2.5">
                  <div>
                    <span className="text-zinc-400 font-bold">Tenor:</span>
                    <span className="text-zinc-800 font-black ml-1">{proj.tenor}</span>
                  </div>
                  <div>
                    <span className="text-zinc-400 font-bold">Min. Investasi:</span>
                    <span className="text-zinc-800 font-black ml-1">{proj.minInvest}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2 mt-5">
                <div className="flex justify-between text-[9px] text-zinc-400 font-bold">
                  <span>Terkumpul: {proj.collected}</span>
                  <span>Target: {proj.target}</span>
                </div>
                <div className="w-full bg-zinc-100 rounded-full h-1.5 overflow-hidden">
                  <div className="bg-gradient-to-r from-amber-500 to-amber-600 h-full rounded-full" style={{ width: `${proj.progress}%` }} />
                </div>
                <div className="pt-2">
                  <Link
                    href="/login"
                    className="w-full text-center rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white font-bold py-2.5 text-[10px] block transition-colors border border-zinc-950"
                  >
                    Ikut Pendanaan
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ FAQ Accordion */}
      <section className="rounded-[2rem] border border-zinc-200 bg-white p-6 space-y-4 shadow-xs">
        <h3 className="text-sm font-black uppercase tracking-wider text-zinc-400 flex items-center gap-2">
          <HelpCircle size={16} className="text-amber-500" />
          <span>Pertanyaan Umum (FAQ) Pendanaan</span>
        </h3>
        <div className="space-y-2">
          {[
            { q: "Apakah pendanaan ini aman dan memiliki agunan?", a: "Tentu. Setiap kampanye penggalangan dana memiliki jaminan aset fisik yang jelas, seperti kontrak kursi maskapai penerbangan, voucher hotel terbayar, atau jaminan unit armada transportasi. Seluruh transaksi dicatat secara legal dengan jaminan transparansi pembukuan." },
            { q: "Bagaimana cara kerja skema bagi hasil syariah?", a: "Kami menggunakan akad Mudharabah (kerja sama modal di mana keuntungan dibagi sesuai nisbah yang disepakati) dan Musyarakah (kerja sama kongsi modal). Imbal hasil dihitung secara profesional dari laba pengadaan paket umrah yang sesungguhnya." },
            { q: "Bagaimana jika terjadi kegagalan atau pembatalan proyek?", a: "Alfian Tour bertindak sebagai pengelola profesional dengan rekam jejak keberangkatan 100% sejak 2010. Risiko kegagalan diminimalisir dengan sistem asuransi perjalanan korporat dan aliansi agen maskapai utama." }
          ].map((faq, idx) => {
            const isOpen = openFaqIndex === idx;
            return (
              <div key={idx} className="border border-zinc-150 rounded-2xl overflow-hidden transition-all bg-zinc-50/30">
                <button
                  type="button"
                  onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                  className="w-full p-4 flex items-center justify-between text-left transition hover:bg-zinc-50"
                >
                  <span className="text-xs font-bold text-zinc-800">{faq.q}</span>
                  <ChevronRight size={14} className={`text-zinc-500 transition-transform ${isOpen ? 'rotate-90' : ''}`} />
                </button>
                {isOpen && (
                  <div className="p-4 pt-0 text-[11px] leading-relaxed text-zinc-500 font-medium border-t border-zinc-100 bg-white">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
