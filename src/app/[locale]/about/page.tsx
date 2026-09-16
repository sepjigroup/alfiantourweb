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
  const t = await getTranslations({ locale, namespace: "about" });
  return {
    title: t("title"),
    description: t("metaDesc"),
    alternates: getLocalizedAlternates(locale, "/about"),
  };
}

export default async function AboutPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "about" });

  const reasons = [
    { key: "reason1", icon: "🎖️", gradient: "from-amber-400 to-amber-600" },
    { key: "reason2", icon: "👴", gradient: "from-blue-400 to-blue-600" },
    { key: "reason3", icon: "🌐", gradient: "from-purple-400 to-purple-600" },
    { key: "reason4", icon: "👨‍💼", gradient: "from-green-400 to-green-600" },
    { key: "reason5", icon: "📖", gradient: "from-pink-400 to-pink-600" },
  ];

  return (
    <div className="p-4 space-y-5 animate-fade-up">
      <div className="flex items-center gap-3 pt-2">
        <BackButton />
        <h1 className="text-lg font-extrabold">{t("title")}</h1>
      </div>

      {/* Our Story */}
      <section className="rounded-3xl bg-white border p-5 space-y-3">
        <div className="flex items-center gap-2">
          <span className="text-xl">📖</span>
          <h2 className="text-sm font-extrabold">{t("ourStory")}</h2>
        </div>
        <p className="text-[11px] text-zinc-600 leading-relaxed">
          {t("story1")}
        </p>
        <p className="text-[11px] text-zinc-600 leading-relaxed">
          {t("story2")}
        </p>
        <p className="text-[11px] text-zinc-600 leading-relaxed">
          {t("story3")}
        </p>
      </section>

      {/* Why Choose Us */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <span className="text-xl">🏆</span>
          <h2 className="text-sm font-extrabold">{t("whyUs")}</h2>
        </div>
        <div className="space-y-2">
          {reasons.map((reason) => (
            <div
              key={reason.key}
              className="rounded-3xl bg-white border p-4 flex items-center gap-3"
            >
              <div
                className={`w-10 h-10 rounded-2xl bg-gradient-to-br ${reason.gradient} flex items-center justify-center text-lg flex-shrink-0`}
              >
                {reason.icon}
              </div>
              <div>
                <div className="text-[11px] font-semibold">
                  {t(`${reason.key}Title` as any)}
                </div>
                <div className="text-[10px] text-zinc-500 mt-0.5 leading-relaxed">
                  {t(`${reason.key}Desc` as any)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Vision & Mission */}
      <section className="rounded-3xl g-main p-5 text-white space-y-3">
        <div className="flex items-center gap-2">
          <span className="text-xl">🎯</span>
          <h2 className="text-sm font-extrabold">{t("visionMission")}</h2>
        </div>
        <div className="bg-white/10 rounded-2xl p-4">
          <p className="text-xs leading-relaxed">{t("vision")}</p>
        </div>
        <Link
          href="/information/visi-misi"
          className="block text-center text-[10px] font-semibold bg-white/20 rounded-full py-2.5 hover:bg-white/30 transition-all"
        >
          {t("visionMission")} →
        </Link>
      </section>
    </div>
  );
}
