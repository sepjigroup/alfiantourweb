import { getTranslations } from "next-intl/server";
import { BackButton } from "@/components/BackButton";
import { getLocalizedAlternates } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "legality" });
  return {
    title: t("title"),
    description: t("metaDesc"),
    alternates: getLocalizedAlternates(locale, "/information/legality"),
  };
}

export default async function LegalityPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "legality" });

  const sections = [
    { key: "section1", icon: "🏛️" },
    { key: "section2", icon: "📋" },
    { key: "section3", icon: "💳" },
    { key: "section4", icon: "🔑" },
    { key: "section5", icon: "🏢" },
  ];

  return (
    <div className="p-4 space-y-5 animate-fade-up">
      <div className="flex items-center gap-3 pt-2">
        <BackButton />
        <h1 className="text-lg font-extrabold">{t("title")}</h1>
      </div>

      <div className="space-y-3">
        {sections.map((section) => (
          <section
            key={section.key}
            className="rounded-3xl bg-white border p-5 space-y-2 shadow-sm"
          >
            <div className="flex items-center gap-2">
              <span className="text-xl">{section.icon}</span>
              <h2 className="text-sm font-extrabold">{t(`${section.key}Title` as any)}</h2>
            </div>
            <div className="bg-zinc-50 rounded-2xl p-4 border border-zinc-100">
              <p className="text-xs text-zinc-600 leading-relaxed whitespace-pre-line">
                {t(`${section.key}Desc` as any)}
              </p>
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
