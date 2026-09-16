import { getTranslations } from "next-intl/server";
import { BackButton } from "@/components/BackButton";
import { getLocalizedAlternates } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "cookies" });
  return {
    title: t("title"),
    description: t("metaDesc"),
    alternates: getLocalizedAlternates(locale, "/information/cookies"),
  };
}

export default async function CookiesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "cookies" });

  return (
    <div className="p-4 space-y-4 animate-fade-up">
      <div className="flex items-center gap-3 pt-2">
        <BackButton />
        <h1 className="text-lg font-extrabold">{t("title")}</h1>
      </div>
      <p className="text-xs text-zinc-500">{t("subtitle")}</p>
      <p className="text-sm text-zinc-600">{t("intro")}</p>
      <div className="space-y-4">
        {[1, 2, 3].map((n) => {
          const sectionTitle = t(`section${n}Title` as any);
          const sectionDesc = t(`section${n}Desc` as any);
          if (!sectionTitle || sectionTitle === `section${n}Title`) return null;
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
