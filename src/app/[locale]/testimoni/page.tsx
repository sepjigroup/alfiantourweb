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
  const t = await getTranslations({ locale, namespace: "testimoni" });
  return {
    title: t("title"),
    description: t("metaDesc"),
    alternates: getLocalizedAlternates(locale, "/testimoni"),
  };
}

const gradients = [
  "from-amber-400 to-orange-500",
  "from-blue-400 to-cyan-500",
  "from-purple-400 to-pink-500",
  "from-green-400 to-emerald-500",
  "from-rose-400 to-red-500",
  "from-indigo-400 to-blue-500",
  "from-teal-400 to-green-500",
  "from-fuchsia-400 to-purple-500",
];

function getInitials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export default async function TestimoniPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "testimoni" });

  const testimonials = Array.from({ length: 8 }, (_, i) => ({
    name: t(`testi${i + 1}Name` as any),
    city: t(`testi${i + 1}City` as any),
    text: t(`testi${i + 1}Text` as any),
  }));

  return (
    <div className="p-4 space-y-5 animate-fade-up">
      <div className="flex items-center gap-3 pt-2">
        <BackButton />
        <h1 className="text-lg font-extrabold">{t("title")}</h1>
      </div>

      <div className="text-center space-y-1">
        <p className="text-sm font-semibold">{t("subtitle")}</p>
        <p className="text-[10px] text-zinc-400">{t("totalReviews")}</p>
      </div>

      <div className="space-y-3">
        {testimonials.map((item, i) => (
          <div key={i} className="rounded-3xl bg-white border p-4 space-y-3">
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-full bg-gradient-to-br ${gradients[i]} flex items-center justify-center text-white text-sm font-bold flex-shrink-0`}
              >
                {getInitials(item.name)}
              </div>
              <div className="flex-1">
                <div className="text-xs font-bold">{item.name}</div>
                <div className="text-[10px] text-zinc-400">{item.city}</div>
              </div>
              <div className="flex gap-0.5 text-xs">
                {"★★★★★".split("").map((star, j) => (
                  <span key={j}>{star}</span>
                ))}
              </div>
            </div>
            <p className="text-[11px] text-zinc-600 leading-relaxed italic">
              &ldquo;{item.text}&rdquo;
            </p>
          </div>
        ))}
      </div>

      <div className="text-center pb-4">
        <Link
          href="/contact"
          className="inline-block g-main text-white text-xs font-semibold px-6 py-3 rounded-full"
        >
          {t("title")} →
        </Link>
      </div>
    </div>
  );
}
