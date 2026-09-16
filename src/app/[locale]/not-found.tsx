import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing-patch";

export default async function NotFoundPage() {
  const t = await getTranslations("notFound");

  return (
    <div className="h-full p-4 flex items-center justify-center">
      <section className="w-full max-w-sm rounded-3xl bg-white border p-6 text-center space-y-3">
        <p className="text-xs font-semibold tracking-[0.2em] text-zinc-400">404</p>
        <h1 className="text-xl font-extrabold">{t("title")}</h1>
        <p className="text-sm text-zinc-500">{t("desc")}</p>
        <Link
          href="/"
          className="inline-flex items-center justify-center px-4 py-2 rounded-full g-main text-white text-sm font-semibold"
        >
          {t("cta")}
        </Link>
      </section>
    </div>
  );
}
