import { getTranslations } from "next-intl/server";
import { BackButton } from "@/components/BackButton";
import { getLocalizedAlternates } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "terms" });
  return {
    title: t("title"),
    description: t("metaDesc"),
    alternates: getLocalizedAlternates(locale, "/information/terms"),
  };
}

export default async function TermsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "terms" });

  return (
    <div className="p-4 space-y-4 animate-fade-up">
      <div className="flex items-center gap-3 pt-2">
        <BackButton />
        <h1 className="text-lg font-extrabold">{t("title")}</h1>
      </div>
      <p className="text-xs text-zinc-500">{t("subtitle")}</p>
      <p className="text-sm text-zinc-600">{t("intro")}</p>
      <div className="space-y-4">
        {Array.from({ length: 12 }, (_, i) => i + 1).map((n) => {
          const titleKey = `section${n}Title` as any;
          const descKey = `section${n}Desc` as any;
          if (!t.has(titleKey)) return null;
          const sectionTitle = t(titleKey);
          const sectionDesc = t.has(descKey) ? t(descKey) : "";
          return (
            <div key={n} className="bg-white rounded-xl p-4 border">
              <h3 className="text-sm font-bold mb-1">{sectionTitle}</h3>
              <p className="text-xs text-zinc-500">{sectionDesc}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
