"use client";

import { useLocale } from "next-intl";
import { Link } from "@/i18n/routing-patch";
import { BackButton } from "@/components/BackButton";
import { useState } from "react";
import { Sparkles, Trophy, Users, ArrowRight, ShieldCheck, Check, DollarSign, Gift, Briefcase, Award } from "lucide-react";

export default function AffiliateProgramPage() {
  const locale = useLocale();
  const [activeTier, setActiveTier] = useState<"bronze" | "silver" | "gold">("bronze");

  const commissionTiers = {
    bronze: {
      name: "Mitra Perunggu (Bronze)",
      quota: "1 - 5 Jamaah / Bulan",
      commission: "Rp 500.000",
      bonus: "Akses Akun Agen & Brosur Digital",
      icon: "🥉",
      color: "border-amber-700 bg-amber-50/5 text-amber-900"
    },
    silver: {
      name: "Mitra Perak (Silver)",
      quota: "6 - 15 Jamaah / Bulan",
      commission: "Rp 750.000",
      bonus: "Peralatan Marketing (Banner & Jaket) + Prioritas Seat",
      icon: "🥈",
      color: "border-zinc-400 bg-zinc-50/10 text-zinc-800"
    },
    gold: {
      name: "Mitra Emas (Gold)",
      quota: "16+ Jamaah / Bulan",
      commission: "Rp 1.000.000",
      bonus: "Tiket Umrah Gratis (Fasilitas Khusus) + Pendampingan Penuh",
      icon: "🥇",
      color: "border-yellow-400 bg-yellow-50/10 text-yellow-700"
    }
  };

  return (
    <div className="space-y-8 animate-fade-up">
      {/* Header */}
      <div className="flex items-center gap-3 pt-2">
        <BackButton />
        <div>
          <h1 className="text-xl font-extrabold text-zinc-900 leading-tight">Program Kemitraan & Agen</h1>
          <p className="text-xs text-zinc-500 font-medium">Bantu jamaah beribadah, raih bagi hasil berkah & melimpah</p>
        </div>
      </div>

      {/* Hero Banner */}
      <section className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-zinc-950 via-zinc-900 to-slate-950 border border-zinc-800 p-8 md:p-12 text-white shadow-xl flex flex-col justify-between min-h-[300px]">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(124,58,237,0.15),transparent)] pointer-events-none" />
        <div className="relative z-10 max-w-2xl space-y-4">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-[#e8c978] border border-[#e8c978]/20 shadow-sm">
            <Sparkles size={11} className="text-[#e8c978]" />
            Program Syariah Resmi
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-black leading-tight">
            Penghasilan Berkah Mulai <span className="text-[#e8c978] bg-gradient-to-r from-[#e8c978] to-amber-200 bg-clip-text text-transparent">Rp 15 Juta</span> Per Bulan
          </h2>
          <p className="text-sm text-zinc-300 leading-relaxed font-medium">
            Bergabunglah dengan ekosistem kemitraan travel terbesar. Dapatkan komisi transparan, pendampingan pemasaran penuh, dan akses dasbor penjualan digital canggih untuk membantu kakek-nenek serta kerabat berangkat ke Tanah Suci dengan nyaman.
          </p>
        </div>
        <div className="pt-6 relative z-10 flex flex-wrap gap-4 items-center">
          <Link
            href="/register"
            className="rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold px-7 py-3.5 text-xs shadow-md shadow-emerald-950/20 transition-all flex items-center gap-1.5 hover:scale-[1.02]"
          >
            <span>Daftar Jadi Agen Sekarang</span>
            <ArrowRight size={14} />
          </Link>
          <a
            href="https://wa.me/6285722022786?text=Halo%20Admin,%20saya%20tertarik%20mendaftar%20kemitraan%20agen%20di%20AlfianTour"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold px-6 py-3.5 text-xs transition-colors border border-white/10"
          >
            Hubungi Konsultan
          </a>
        </div>
      </section>

      {/* Keuntungan Agen */}
      <section className="space-y-4">
        <h3 className="text-base font-extrabold text-zinc-950 flex items-center gap-2">
          <Trophy size={18} className="text-amber-500" />
          <span>Keuntungan Bergabung Bersama Kami</span>
        </h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { icon: <DollarSign size={20} className="text-emerald-600" />, title: "Bagi Hasil Tertinggi", desc: "Dapatkan komisi transparan hingga Rp 1.000.000 per jamaah yang berhasil berangkat." },
            { icon: <Briefcase size={20} className="text-emerald-600" />, title: "Alat Pemasaran Lengkap", desc: "Akses flyer promosi, video, brosur digital kustom, serta banner fisik untuk promosi Anda." },
            { icon: <Users size={20} className="text-emerald-600" />, title: "Bimbingan & Pelatihan", desc: "Dukungan grup eksklusif, webinar strategi marketing, dan panduan produk oleh tim ahli." },
            { icon: <ShieldCheck size={20} className="text-emerald-600" />, title: "Legalitas Kemenag Resmi", desc: "Bekerja tenang dengan izin travel resmi PPIU No. 2024-AT-0812 terdaftar di Kemenag RI." },
            { icon: <Award size={20} className="text-emerald-600" />, title: "Bonus Tiket Umrah", desc: "Kesempatan meraih tiket umrah gratis setiap pencapaian kuota tahunan tertentu." },
            { icon: <Gift size={20} className="text-emerald-600" />, title: "Fasilitas Lansia Terbaik", desc: "Produk ramah lansia yang sangat mudah dipasarkan karena mengutamakan kenyamanan." }
          ].map((benefit, idx) => (
            <div key={idx} className="rounded-3xl border border-zinc-200 bg-white p-5 space-y-3 shadow-xs">
              <div className="h-10 w-10 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center">
                {benefit.icon}
              </div>
              <h4 className="text-sm font-black text-zinc-900 leading-tight">{benefit.title}</h4>
              <p className="text-xs leading-relaxed text-zinc-500 font-medium">{benefit.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Skema Komisi (Interactive Tabs) */}
      <section className="rounded-[2rem] border border-zinc-200 bg-white p-6 space-y-6 shadow-xs">
        <div className="space-y-2">
          <h3 className="text-base font-extrabold text-zinc-950">Skema Komisi & Bonus Keberangkatan</h3>
          <p className="text-xs text-zinc-500 font-medium">Bagi hasil yang meningkat seiring dengan jumlah jamaah yang Anda bantu.</p>
        </div>

        {/* Tab Buttons */}
        <div className="flex gap-2 border-b border-zinc-100 pb-3 overflow-x-auto scrollbar-hide">
          {(["bronze", "silver", "gold"] as const).map((tier) => (
            <button
              key={tier}
              onClick={() => setActiveTier(tier)}
              className={`px-5 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 shrink-0 ${
                activeTier === tier
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "bg-zinc-50 text-zinc-500 hover:bg-zinc-100 border border-zinc-200/50"
              }`}
            >
              <span>{commissionTiers[tier].icon}</span>
              <span>{commissionTiers[tier].name.split(" ")[1]}</span>
            </button>
          ))}
        </div>

        {/* Tab Content Card */}
        <div className={`rounded-2xl border p-5 space-y-4 bg-zinc-50/20 shadow-2xs ${commissionTiers[activeTier].color}`}>
          <div className="flex items-center justify-between gap-4 border-b border-zinc-200 pb-3 flex-wrap">
            <div>
              <div className="text-[10px] font-black uppercase tracking-wider opacity-60">Kategori Kemitraan</div>
              <h4 className="text-base font-black flex items-center gap-2 mt-1">
                <span>{commissionTiers[activeTier].icon}</span>
                <span>{commissionTiers[activeTier].name}</span>
              </h4>
            </div>
            <div className="bg-white border border-zinc-200 rounded-xl px-3 py-2 text-right shadow-2xs">
              <div className="text-[9px] font-black uppercase tracking-wider text-zinc-400">Target Kuota</div>
              <div className="text-xs font-black text-zinc-800 mt-0.5">{commissionTiers[activeTier].quota}</div>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <div className="text-[10px] font-black uppercase tracking-wider text-zinc-400">Komisi Pokok / Jamaah</div>
              <div className="text-2xl font-black text-emerald-700">{commissionTiers[activeTier].commission} <span className="text-xs font-bold text-zinc-500">/ orang</span></div>
            </div>
            <div className="space-y-1">
              <div className="text-[10px] font-black uppercase tracking-wider text-zinc-400">Bonus & Fasilitas Tambahan</div>
              <p className="text-xs font-bold text-zinc-700 leading-relaxed">{commissionTiers[activeTier].bonus}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Cara Mulai Kemitraan */}
      <section className="rounded-[2.5rem] bg-gradient-to-br from-emerald-950 via-emerald-900 to-teal-950 border border-emerald-900/50 p-6 md:p-8 text-white shadow-md relative overflow-hidden">
        <div className="absolute top-0 right-0 w-52 h-52 bg-white/5 rounded-full translate-x-12 -translate-y-12 pointer-events-none" />
        <div className="relative z-10 space-y-6">
          <div className="space-y-2">
            <h3 className="text-lg font-black">Langkah Mudah Memulai Bisnis Agen Anda</h3>
            <p className="text-xs text-emerald-200/90 leading-relaxed font-semibold">Hanya perlu 4 langkah sederhana untuk resmi menjadi mitra perjalanan kami.</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { step: "01", title: "Registrasi Akun", desc: "Isi data formulir pendaftaran kemitraan dengan lengkap." },
              { step: "02", title: "Verifikasi Profil", desc: "Tim internal kami akan memverifikasi permohonan Anda." },
              { step: "03", title: "Unduh Alat Promosi", desc: "Dapatkan akses ke materi marketing digital & banner khusus." },
              { step: "04", title: "Mulai Dapatkan Hasil", desc: "Gunakan link referral, bantu jamaah, cairkan bagi hasil." }
            ].map((step, idx) => (
              <div key={idx} className="rounded-2xl bg-white/10 p-4 border border-white/15 space-y-2 flex flex-col justify-between shadow-2xs">
                <span className="text-2xl font-black text-amber-300 leading-none">{step.step}</span>
                <div className="space-y-1 mt-3">
                  <h4 className="text-xs font-black">{step.title}</h4>
                  <p className="text-[10px] text-emerald-100/80 leading-normal font-medium">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-2 text-center">
            <Link
              href="/register"
              className="inline-flex items-center gap-1.5 rounded-2xl bg-amber-300 hover:bg-amber-400 text-primary-950 font-black px-8 py-3.5 text-xs shadow-md shadow-amber-950/20 transition-all hover:scale-105"
            >
              <span>Bergabung Jadi Agen Sekarang</span>
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
