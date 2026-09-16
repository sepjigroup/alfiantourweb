import { BackButton } from "@/components/BackButton";
import { getLocalizedAlternates } from "@/lib/seo";

const copyByLocale = {
  id: {
    title: "Compliance & Platform Verification",
    desc: "Halaman ini disediakan sebagai rujukan verifikasi kebijakan platform iklan dan mitra digital resmi Alfian Tour.",
    bullets: [
      "Layanan utama: paket umroh, haji, dan layanan perjalanan terkait.",
      "Perusahaan beroperasi atas nama PT. Alfian Sejahtera Abadi.",
      "Kebijakan layanan, privasi, pembayaran, dan penanganan komplain tersedia publik.",
      "Seluruh transaksi hanya melalui kanal resmi perusahaan.",
    ],
    tos: "Ketentuan Layanan",
    privacy: "Kebijakan Privasi",
    payment: "Metode Pembayaran Resmi",
    contact: "Kontak Resmi",
    note: "",
  },
  en: {
    title: "Compliance & Platform Verification",
    desc: "This page is provided as an official policy verification reference for advertising platforms and digital partners of Alfian Tour.",
    bullets: [
      "Primary services: Umrah, Hajj, and related travel services.",
      "The company operates under PT. Alfian Sejahtera Abadi.",
      "Service terms, privacy, payment policy, and complaint handling are publicly available.",
      "All transactions must go through the company’s official channels only.",
    ],
    tos: "Terms of Service",
    privacy: "Privacy Policy",
    payment: "Official Payment Methods",
    contact: "Official Contact",
    note: "For Meta/Google audit requirements, use this page URL as the compliance verification landing page.",
  },
  ar: {
    title: "الامتثال والتحقق من المنصات",
    desc: "تم إعداد هذه الصفحة كمرجع رسمي للتحقق من السياسات لدى منصات الإعلانات والشركاء الرقميين التابعين لألفيان تور.",
    bullets: [
      "الخدمات الأساسية: باقات العمرة والحج وخدمات السفر ذات الصلة.",
      "تعمل الشركة باسم PT. Alfian Sejahtera Abadi.",
      "سياسات الخدمة والخصوصية والدفع وآلية الشكاوى متاحة للعامة.",
      "جميع المعاملات تتم فقط عبر القنوات الرسمية للشركة.",
    ],
    tos: "شروط الخدمة",
    privacy: "سياسة الخصوصية",
    payment: "طرق الدفع الرسمية",
    contact: "قنوات الاتصال الرسمية",
    note: "لمتطلبات تدقيق Meta/Google، يُستخدم رابط هذه الصفحة كصفحة هبوط للتحقق من الامتثال.",
  },
} as const;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const lang = (locale || "id") as "id" | "en" | "ar";
  const copy = copyByLocale[lang] ?? copyByLocale.id;
  return {
    title: copy.title,
    description: copy.desc,
    alternates: getLocalizedAlternates(locale, "/information/compliance"),
  };
}

export default async function CompliancePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const lang = (locale || "id") as "id" | "en" | "ar";
  const copy = copyByLocale[lang] ?? copyByLocale.id;

  return (
    <div className="p-4 space-y-4 animate-fade-up">
      <div className="flex items-center gap-3 pt-2">
        <BackButton />
        <h1 className="text-lg font-extrabold">{copy.title}</h1>
      </div>
      <p className="text-sm text-zinc-600">{copy.desc}</p>

      <div className="bg-white border rounded-2xl p-4">
        <ul className="list-disc pl-5 text-xs text-zinc-700 space-y-1.5">
          {copy.bullets.map((x) => (
            <li key={x}>{x}</li>
          ))}
        </ul>
      </div>

      <div className="bg-white border rounded-2xl p-4 space-y-2">
        <a href={`/${locale}/information/tos`} className="block text-sm font-semibold text-primary-700 underline underline-offset-2">{copy.tos}</a>
        <a href={`/${locale}/information/privacy`} className="block text-sm font-semibold text-primary-700 underline underline-offset-2">{copy.privacy}</a>
        <a href={`/${locale}/information/payment`} className="block text-sm font-semibold text-primary-700 underline underline-offset-2">{copy.payment}</a>
        <a href={`/${locale}/contact`} className="block text-sm font-semibold text-primary-700 underline underline-offset-2">{copy.contact}</a>
      </div>

      <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-800">
        {copy.note}
      </div>
    </div>
  );
}
