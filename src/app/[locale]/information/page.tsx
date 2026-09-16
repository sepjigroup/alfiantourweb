import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing-patch";
import { BackButton } from "@/components/BackButton";
import { ChevronRight } from "lucide-react";
import { getLocalizedAlternates } from "@/lib/seo";
import { RealtimeAnalyticsInfo } from "@/components/RealtimeAnalyticsInfo";

const menuItems = [
  { key: "visiMisi", icon: "🎯", slug: "visi-misi" },
  { key: "legality", icon: "⚖️", slug: "legality" },
  { key: "payment", icon: "💳", slug: "payment" },
  { key: "tos", icon: "📜", slug: "tos" },
  { key: "privacy", icon: "🔒", slug: "privacy" },
  { key: "cookies", icon: "🍪", slug: "cookies" },
  { key: "disclaimer", icon: "⚠️", slug: "disclaimer" },
  { key: "terms", icon: "📄", slug: "terms" },
  { key: "sitemap", icon: "🗺️", slug: "sitemap" },
];

const resourceItems = [
  {
    href: "/information/formulir-cetak",
    icon: "🧾",
    title: "Formulir Cetak",
    desc: "Preview formulir dan download PDF resmi.",
  },
  {
    href: "/information/investor-revenue",
    icon: "📈",
    title: "Investor & Revenue",
    desc: "Thesis investasi, engine monetisasi SaaS, dan potensi return.",
  },
  {
    href: "/information/affiliate-guide",
    icon: "📲",
    title: "Panduan Affiliate Agensi",
    desc: "Cara sebar link referral, template WhatsApp, dan alur kerja paling mudah.",
  },
  {
    href: "/information/zoom-presentation",
    icon: "🎙️",
    title: "Materi Zoom Presentasi",
    desc: "Rundown, script presenter, demo flow, affiliate, dan Q&A siap pakai.",
  },
  {
    href: "/information/compliance",
    icon: "✅",
    title: "Compliance Verification",
    desc: "Halaman rujukan verifikasi kebijakan untuk Meta/Google platform.",
  },
];

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "information" });
  return {
    title: t("title"),
    description: t("metaDesc"),
    alternates: getLocalizedAlternates(locale, "/information"),
  };
}

export default async function InformationPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "information" });

  return (
    <div className="p-4 space-y-4 animate-fade-up">
      <div className="flex items-center gap-3 pt-2">
        <BackButton />
        <h1 className="text-lg font-extrabold">{t("title")}</h1>
      </div>
      <p className="text-xs text-zinc-500">{t("subtitle")}</p>
      <div className="space-y-1">
        <Link
          href="/about"
          className="flex items-center gap-3 p-4 rounded-xl bg-white border hover:border-primary-300 transition-colors"
        >
          <span className="text-xl">ℹ️</span>
          <div className="flex-1">
            <div className="text-sm font-semibold">About</div>
            <div className="text-[11px] text-zinc-400">Informasi perusahaan dan profil singkat.</div>
          </div>
          <ChevronRight className="w-4 h-4 text-zinc-300" />
        </Link>
        <Link
          href="/contact"
          className="flex items-center gap-3 p-4 rounded-xl bg-white border hover:border-primary-300 transition-colors"
        >
          <span className="text-xl">💬</span>
          <div className="flex-1">
            <div className="text-sm font-semibold">Contact</div>
            <div className="text-[11px] text-zinc-400">Kontak resmi dan layanan bantuan.</div>
          </div>
          <ChevronRight className="w-4 h-4 text-zinc-300" />
        </Link>
        <Link
          href="/karir"
          className="flex items-center gap-3 p-4 rounded-xl bg-white border hover:border-primary-300 transition-colors"
        >
          <span className="text-xl">💼</span>
          <div className="flex-1">
            <div className="text-sm font-semibold">Karir</div>
            <div className="text-[11px] text-zinc-400">Lowongan kerja resmi dan peluang bergabung dengan tim Alfian Tour.</div>
          </div>
          <ChevronRight className="w-4 h-4 text-zinc-300" />
        </Link>
        <Link
          href="/events"
          className="flex items-center gap-3 p-4 rounded-xl bg-white border hover:border-primary-300 transition-colors"
        >
          <span className="text-xl">📅</span>
          <div className="flex-1">
            <div className="text-sm font-semibold">Event</div>
            <div className="text-[11px] text-zinc-400">Jadwal agenda acara, manasik umroh, dan pendaftaran event kami.</div>
          </div>
          <ChevronRight className="w-4 h-4 text-zinc-300" />
        </Link>
        {menuItems.map((item) => (
          <Link
            key={item.key}
            href={`/information/${item.slug}`}
            className="flex items-center gap-3 p-4 rounded-xl bg-white border hover:border-primary-300 transition-colors"
          >
            <span className="text-xl">{item.icon}</span>
            <div className="flex-1">
              <div className="text-sm font-semibold">{t(item.key as any)}</div>
              <div className="text-[11px] text-zinc-400">
                {t(`${item.key}Desc` as any)}
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-zinc-300" />
          </Link>
        ))}
      </div>
      <RealtimeAnalyticsInfo />
      <div className="space-y-1 pt-2">
        {resourceItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex items-center gap-3 p-4 rounded-xl bg-white border hover:border-primary-300 transition-colors"
          >
            <span className="text-xl">{item.icon}</span>
            <div className="flex-1">
              <div className="text-sm font-semibold">{item.title}</div>
              <div className="text-[11px] text-zinc-400">{item.desc}</div>
            </div>
            <ChevronRight className="w-4 h-4 text-zinc-300" />
          </Link>
        ))}
      </div>
    </div>
  );
}
