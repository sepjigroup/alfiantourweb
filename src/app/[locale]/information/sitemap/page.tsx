import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing-patch";
import { BackButton } from "@/components/BackButton";
import { getLocalizedAlternates } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "sitemap" });
  return {
    title: t("title"),
    description: t("metaDesc"),
    alternates: getLocalizedAlternates(locale, "/information/sitemap"),
  };
}

export default async function SitemapPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "sitemap" });

  const mainPages: Array<{ key?: string; label?: string; href: string }> = [
    { key: "home", href: "/" },
    { key: "feeds", href: "/feeds" },
    { key: "packages", href: "/pack" },
    { key: "agents", href: "/agen" },
    { key: "account", href: "/akun" },
  ];

  const infoPages: Array<{ key?: string; label?: string; href: string }> = [
    { key: "about", href: "/about" },
    { key: "contact", href: "/contact" },
    { key: "testimoni", href: "/testimoni" },
    { key: "visiMisi", href: "/information/visi-misi" },
    { key: "tos", href: "/information/tos" },
    { key: "privacy", href: "/information/privacy" },
    { key: "cookies", href: "/information/cookies" },
    { key: "disclaimer", href: "/information/disclaimer" },
    { key: "terms", href: "/information/terms" },
    { label: "Investor & Revenue", href: "/information/investor-revenue" },
  ];

  return (
    <div className="p-4 space-y-5 animate-fade-up">
      <div className="flex items-center gap-3 pt-2">
        <BackButton />
        <h1 className="text-lg font-extrabold">{t("title")}</h1>
      </div>
      <p className="text-xs text-zinc-500">{t("subtitle")}</p>
      <p className="text-sm text-zinc-600">{t("intro")}</p>

      {/* Main Pages */}
      <div>
        <h2 className="text-sm font-extrabold mb-2">{t("mainPages")}</h2>
        <div className="space-y-1">
          {mainPages.map((page) => (
            <Link
              key={page.key ?? page.href}
              href={page.href}
              className="flex items-center gap-3 p-3 rounded-xl bg-white border hover:border-primary-300 transition-colors"
            >
              <span className="text-zinc-400 text-sm">›</span>
              <span className="text-sm font-medium">{page.label ?? t(page.key as any)}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Information Pages */}
      <div>
        <h2 className="text-sm font-extrabold mb-2">{t("infoPages")}</h2>
        <div className="space-y-1">
          {infoPages.map((page) => (
            <Link
              key={page.key}
              href={page.href}
              className="flex items-center gap-3 p-3 rounded-xl bg-white border hover:border-primary-300 transition-colors"
            >
              <span className="text-zinc-400 text-sm">›</span>
              <span className="text-sm font-medium">{page.label ?? t(page.key as any)}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
