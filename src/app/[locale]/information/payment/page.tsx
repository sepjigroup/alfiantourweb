import { getTranslations } from "next-intl/server";
import { BackButton } from "@/components/BackButton";
import { CreditCard, AlertCircle } from "lucide-react";
import { getLocalizedAlternates } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "payment" });
  return {
    title: t("title"),
    description: t("metaDesc"),
    alternates: getLocalizedAlternates(locale, "/information/payment"),
  };
}

export default async function PaymentPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "payment" });

  const banks = [
    { name: t("bankMandiri"), number: "13000.2958.7907", color: "from-blue-700 to-blue-900" },
    { name: t("bankBri"), number: "0405.01.001886.30.0", color: "from-blue-500 to-blue-700" },
    { name: t("bankMuamalat"), number: "-", color: "from-purple-700 to-purple-900" },
  ];

  return (
    <div className="p-4 space-y-5 animate-fade-up">
      <div className="flex items-center gap-3 pt-2">
        <BackButton />
        <h1 className="text-lg font-extrabold">{t("title")}</h1>
      </div>

      <p className="text-xs text-zinc-500 leading-relaxed px-1">
        {t("intro")}
      </p>

      <div className="space-y-4">
        {banks.map((bank, index) => (
          <div
            key={index}
            className={`rounded-[2rem] p-6 text-white bg-gradient-to-br ${bank.color} shadow-lg relative overflow-hidden`}
          >
            <div className="absolute top-[-10%] right-[-10%] w-32 h-32 bg-white/10 rounded-full" />
            
            <div className="relative z-10 flex flex-col h-full justify-between gap-6">
              <div className="flex justify-between items-start">
                <span className="font-bold text-lg tracking-wider italic">{bank.name}</span>
                <CreditCard className="w-8 h-8 opacity-50" />
              </div>
              
              <div className="space-y-1">
                <div className="text-[10px] uppercase tracking-[0.2em] opacity-70">Account Number</div>
                <div className="text-xl font-mono font-bold tracking-widest">{bank.number}</div>
              </div>

              <div className="space-y-0.5">
                <div className="text-[10px] uppercase tracking-[0.2em] opacity-70">Account Holder</div>
                <div className="text-sm font-bold tracking-wide uppercase">{t("accountName")}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-3xl bg-amber-50 border border-amber-100 p-5 flex gap-3">
        <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
        <p className="text-[11px] text-amber-800 leading-relaxed">
          {t("warning")}
        </p>
      </div>
    </div>
  );
}
