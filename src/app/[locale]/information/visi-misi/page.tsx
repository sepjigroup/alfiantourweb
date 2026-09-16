import { getTranslations } from "next-intl/server";
import { BackButton } from "@/components/BackButton";
import { getLocalizedAlternates } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "visiMisi" });
  return {
    title: t("title"),
    description: t("metaDesc"),
    alternates: getLocalizedAlternates(locale, "/information/visi-misi"),
  };
}

export default async function VisiMisiPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "visiMisi" });

  const values = [
    { key: "value1", color: "border-l-amber-500 bg-amber-50/50" },
    { key: "value2", color: "border-l-blue-500 bg-blue-50/50" },
    { key: "value3", color: "border-l-purple-500 bg-purple-50/50" },
    { key: "value4", color: "border-l-green-500 bg-green-50/50" },
    { key: "value5", color: "border-l-rose-500 bg-rose-50/50" },
  ];

  return (
    <div className="p-4 space-y-5 animate-fade-up">
      <div className="flex items-center gap-3 pt-2">
        <BackButton />
        <h1 className="text-lg font-extrabold">{t("title")}</h1>
      </div>

      {/* Vision */}
      <section className="rounded-3xl g-main p-5 text-white space-y-3">
        <div className="flex items-center gap-2">
          <span className="text-xl">👁️</span>
          <h2 className="text-sm font-extrabold">{t("visionTitle")}</h2>
        </div>
        <div className="bg-white/10 rounded-2xl p-4">
          <p className="text-xs leading-relaxed">{t("visionContent")}</p>
        </div>
      </section>

      {/* Mission */}
      <section className="rounded-3xl bg-white border p-5 space-y-3">
        <div className="flex items-center gap-2">
          <span className="text-xl">🎯</span>
          <h2 className="text-sm font-extrabold">{t("missionTitle")}</h2>
        </div>
        <ol className="space-y-2 list-decimal list-inside">
          {[1, 2, 3, 4, 5].map((n) => (
            <li
              key={n}
              className="text-[11px] text-zinc-600 leading-relaxed marker:text-primary-600 marker:font-bold"
            >
              {t(`mission${n}` as any)}
            </li>
          ))}
        </ol>
      </section>

      {/* Company Values */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <span className="text-xl">💎</span>
          <h2 className="text-sm font-extrabold">{t("valuesTitle")}</h2>
        </div>
        <div className="space-y-2">
          {values.map((value) => (
            <div
              key={value.key}
              className={`rounded-xl border-l-4 p-4 ${value.color}`}
            >
              <div className="text-sm font-bold mb-0.5">
                {t(`${value.key}Title` as any)}
              </div>
              <div className="text-[11px] text-zinc-500 leading-relaxed">
                {t(`${value.key}Desc` as any)}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
