import { BackButton } from "@/components/BackButton";
import { getLocalizedAlternates } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  return {
    title: "Investor & Revenue Plan",
    description:
      "Operating system untuk industri umroh Indonesia: model revenue, potensi return investor, dan roadmap eksekusi.",
    alternates: getLocalizedAlternates(locale, "/information/investor-revenue"),
  };
}

export default async function InvestorRevenuePage() {
  const kpis = [
    { label: "ARR", value: "Rp 0 - isi target", note: "Annual Recurring Revenue" },
    { label: "MRR", value: "Rp 0 - isi target", note: "Monthly Recurring Revenue" },
    { label: "Gross Margin", value: "0% - isi target", note: "Margin setelah biaya langsung" },
    { label: "CAC", value: "Rp 0 - isi target", note: "Biaya akuisisi per travel" },
    { label: "LTV", value: "Rp 0 - isi target", note: "Lifetime value per akun travel" },
    { label: "NRR", value: "0% - isi target", note: "Net Revenue Retention" },
    { label: "Logo Churn", value: "0% - isi target", note: "Persentase customer churn" },
    { label: "Payback", value: "0 bulan - isi target", note: "Waktu balik modal CAC" },
  ];

  const useOfFunds = [
    "45% Product & Engineering: reliabilitas, automasi operasional, AI-assist workflow.",
    "30% Go-To-Market: sales B2B travel, partner channel, onboarding success team.",
    "15% Compliance & Risk: keamanan data, audit log, governance proses keuangan.",
    "10% Working Capital: operasional inti dan buffer scale.",
  ];

  const investmentTerms = [
    "Ronde: Seed/Pre-Series A (sesuai traction ARR).",
    "Instrumen: Equity atau SAFE dengan cap yang rasional.",
    "Governance: update KPI bulanan + board/investor review kuartalan.",
  ];

  const revenueStreams = [
    {
      title: "SaaS Subscription B2B",
      desc: "Biaya langganan bulanan/tahunan untuk travel berdasarkan tier fitur dan jumlah cabang/user.",
    },
    {
      title: "Take Rate Transaksi",
      desc: "Pendapatan dari fee pembayaran, cicilan, dan layanan transaksi digital yang diproses di platform.",
    },
    {
      title: "Add-On Operasional",
      desc: "Modul tambahan seperti CRM lanjutan, finance closing, HRD, dokumen, dan automasi marketing.",
    },
    {
      title: "Ekosistem Agen",
      desc: "Monetisasi onboarding agen, alat referral, dan performance tools untuk peningkatan conversion.",
    },
  ];

  const investorPoints = [
    "Pasar besar dan fragmented: banyak travel masih pakai proses manual dan tools terpisah.",
    "Produk platform: switching cost meningkat saat data jamaah, pembayaran, dokumen, dan operasional sudah terintegrasi.",
    "Revenue berulang: kombinasi subscription + usage-based fee meningkatkan predictability arus kas.",
    "Ekspansi vertikal: dari umroh/haji ke produk lain (oleh-oleh haji, perlengkapan, layanan tambahan).",
  ];

  const milestones = [
    "12 bulan: standardisasi operasional multi-travel dan dashboard KPI unit economics.",
    "18 bulan: integrasi payment + collection + reconciliation end-to-end di mayoritas tenant aktif.",
    "24 bulan: network effect travel-agen-jamaah, ekspansi modul komersial dan monetisasi data operasional.",
  ];

  return (
    <div className="p-4 space-y-5 animate-fade-up">
      <div className="flex items-center gap-3 pt-2">
        <BackButton />
        <h1 className="text-lg font-extrabold">Investor & Revenue</h1>
      </div>

      <section className="rounded-3xl bg-white border p-5 space-y-3 shadow-sm">
        <div className="text-xs font-semibold text-emerald-700">INVESTOR THESIS</div>
        <h2 className="text-base font-extrabold leading-snug">
          Kami sedang membangun operating system untuk industri umroh Indonesia.
        </h2>
        <p className="text-sm text-zinc-700 leading-relaxed">
          Target kami menghubungkan travel, agen, jamaah, pembayaran, dokumen, dan operasional dalam satu
          platform terintegrasi. Fokusnya bukan sekadar software pencatatan, tapi infrastruktur bisnis harian
          yang menurunkan biaya operasional dan menaikkan kecepatan scale.
        </p>
      </section>

      <section className="rounded-3xl bg-white border p-5 space-y-3 shadow-sm">
        <h3 className="text-sm font-extrabold">Revenue Engine</h3>
        <div className="space-y-2">
          {revenueStreams.map((item) => (
            <div key={item.title} className="rounded-2xl border bg-zinc-50 p-4">
              <div className="text-xs font-bold">{item.title}</div>
              <p className="text-xs text-zinc-600 mt-1 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-3xl bg-white border p-5 space-y-3 shadow-sm">
        <h3 className="text-sm font-extrabold">Investor Deck Mode: KPI Snapshot</h3>
        <p className="text-[11px] text-zinc-500">
          Isi angka aktual untuk langsung dipakai sebagai ringkasan deck dan data room awal.
        </p>
        <div className="grid grid-cols-2 gap-2">
          {kpis.map((item) => (
            <div key={item.label} className="rounded-2xl border bg-zinc-50 p-3">
              <div className="text-[10px] font-bold text-zinc-500">{item.label}</div>
              <div className="text-sm font-extrabold mt-0.5">{item.value}</div>
              <div className="text-[10px] text-zinc-500 mt-1">{item.note}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-3xl bg-white border p-5 space-y-3 shadow-sm">
        <h3 className="text-sm font-extrabold">Kenapa Menarik untuk Investor</h3>
        <ul className="space-y-2">
          {investorPoints.map((point) => (
            <li key={point} className="text-xs text-zinc-700 rounded-2xl border bg-zinc-50 p-3">
              {point}
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-3xl bg-white border p-5 space-y-3 shadow-sm">
        <h3 className="text-sm font-extrabold">Potensi Return (Scenario-Based)</h3>
        <div className="rounded-2xl border bg-zinc-50 p-4 text-xs text-zinc-700 leading-relaxed">
          Return investor ditargetkan melalui pertumbuhan ARR, margin operasional yang membaik dari automasi,
          dan multiple valuasi SaaS saat retention + net revenue expansion terbukti. Strategi exit dapat berupa
          akuisisi strategis oleh pemain travel/fintech/enterprise software atau putaran lanjutan dengan valuasi lebih tinggi.
        </div>
        <p className="text-[11px] text-zinc-500">
          Catatan: angka return final bergantung pada eksekusi, pertumbuhan pelanggan, dan kondisi pasar.
        </p>
      </section>

      <section className="rounded-3xl bg-white border p-5 space-y-3 shadow-sm">
        <h3 className="text-sm font-extrabold">Unit Economics Target</h3>
        <div className="rounded-2xl border bg-zinc-50 p-4 text-xs text-zinc-700 leading-relaxed">
          Fokus eksekusi: naikkan ARPA per travel lewat modul premium, turunkan churn dengan workflow operasional
          yang benar-benar dipakai harian, dan jaga payback CAC agar tetap pendek. Jika NRR konsisten di atas 110%
          dan churn rendah, valuasi SaaS bisa naik signifikan pada ronde berikutnya.
        </div>
      </section>

      <section className="rounded-3xl bg-white border p-5 space-y-3 shadow-sm">
        <h3 className="text-sm font-extrabold">Use of Funds</h3>
        <ul className="space-y-2">
          {useOfFunds.map((item) => (
            <li key={item} className="text-xs text-zinc-700 rounded-2xl border bg-zinc-50 p-3">
              {item}
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-3xl bg-white border p-5 space-y-3 shadow-sm">
        <h3 className="text-sm font-extrabold">Proposed Investment Terms (Draft)</h3>
        <ul className="space-y-2">
          {investmentTerms.map((item) => (
            <li key={item} className="text-xs text-zinc-700 rounded-2xl border bg-zinc-50 p-3">
              {item}
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-3xl bg-white border p-5 space-y-3 shadow-sm">
        <h3 className="text-sm font-extrabold">Milestone Eksekusi</h3>
        <ol className="space-y-2">
          {milestones.map((m, i) => (
            <li key={m} className="text-xs text-zinc-700 rounded-2xl border bg-zinc-50 p-3">
              {i + 1}. {m}
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
