import { getTranslations } from "next-intl/server";
import Script from "next/script";
import { BackButton } from "@/components/BackButton";
import { getLocalizedAlternates } from "@/lib/seo";
import { API_BASE_URL } from "@/lib/api-client";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "contact" });
  return {
    title: t("title"),
    description: t("metaDesc"),
    alternates: getLocalizedAlternates(locale, "/contact"),
  };
}

export default async function ContactPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "contact" });

  // Load dynamic company profile data
  let companyProfile: any = null;
  try {
    const res = await fetch(`${API_BASE_URL}/api/v1/master/company-profiles?page=1&pageSize=1`, { cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      companyProfile = data?.items?.[0] || null;
    }
  } catch (err) {
    console.error("Gagal memuat profil perusahaan:", err);
  }

  const centralWhatsApp = companyProfile?.centralWhatsApp
    ? (String(companyProfile.centralWhatsApp).startsWith("http")
        ? companyProfile.centralWhatsApp
        : `https://wa.me/${String(companyProfile.centralWhatsApp).replace(/[^0-9]/g, "")}`)
    : "https://wa.me/6285722022786";

  const centralPhone = companyProfile?.centralOfficePhone
    ? `tel:${String(companyProfile.centralOfficePhone).replace(/[^0-9+]/g, "")}`
    : "tel:+6281320758493";

  const contactMethods = [
    {
      key: "whatsapp",
      icon: "💬",
      gradient: "from-green-400 to-green-600",
      href: centralWhatsApp,
    },
    {
      key: "email",
      icon: "✉️",
      gradient: "from-blue-400 to-blue-600",
      href: "mailto:info@alfiantour.com",
    },
    {
      key: "phone",
      icon: "📞",
      gradient: "from-purple-400 to-purple-600",
      href: centralPhone,
    },
    {
      key: "address",
      icon: "📍",
      gradient: "from-red-400 to-red-600",
    },
  ];

  const socialLinks = [
    {
      icon: "📸",
      label: "Instagram",
      href: companyProfile?.instagramUrl || "https://instagram.com/alfiantour",
    },
    { 
      icon: "📘", 
      label: "Facebook", 
      href: companyProfile?.facebookUrl || "https://facebook.com/alfiantour" 
    },
    { 
      icon: "🎵", 
      label: "TikTok", 
      href: companyProfile?.tikTokUrl || "https://tiktok.com/@alfiantour" 
    },
    { 
      icon: "▶️", 
      label: "YouTube", 
      href: companyProfile?.youTubeUrl || "https://youtube.com/@alfiantour" 
    },
  ];

  const hoursString = companyProfile?.openTime && companyProfile?.closeTime
    ? `Senin - Jumat: ${companyProfile.openTime} - ${companyProfile.closeTime}`
    : t("hoursDetail");

  return (
    <>
      <Script id="google-ads-kontak-conversion" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          window.gtag = window.gtag || function(){window.dataLayer.push(arguments);}
          window.gtag('event', 'conversion', {
              'send_to': 'AW-18205195766/k-4FCI7FsLccEPb79OhD',
              'value': 1.0,
              'currency': 'IDR'
          });
        `}
      </Script>
      <div className="p-4 space-y-5 animate-fade-up">
        <div className="flex items-center gap-3 pt-2">
          <BackButton />
          <h1 className="text-lg font-extrabold">{t("title")}</h1>
        </div>

        {/* Contact Methods */}
        <div className="grid grid-cols-2 gap-3">
          {contactMethods.map((method) => (
            <a
              key={method.key}
              href={method.href || "#"}
              target={method.href ? "_blank" : undefined}
              rel={method.href ? "noopener noreferrer" : undefined}
              className="rounded-2xl bg-white border p-4 flex flex-col items-center gap-2 text-center hover:border-primary-300 transition-colors"
            >
              <div
                className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${method.gradient} flex items-center justify-center text-2xl`}
              >
                {method.icon}
              </div>
              <div className="text-[11px] font-semibold">
                {t(method.key as any)}
              </div>
              {method.key === "address" && (
                <div className="text-[10px] text-zinc-500 leading-relaxed">
                  {companyProfile?.address || t("addressFull")}
                </div>
              )}
            </a>
          ))}
        </div>

        {/* Office Hours */}
        <section className="rounded-2xl bg-white border p-4 space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-lg">🕐</span>
            <h2 className="text-sm font-extrabold">{t("officeHours")}</h2>
          </div>
          <p className="text-[10px] text-zinc-500 whitespace-pre-line">
            {hoursString}
          </p>
        </section>

        {/* Contact Notice Card (replaced contact form) */}
        <section className="rounded-2xl border border-dashed border-zinc-300 bg-white p-6 text-center space-y-2 shadow-sm">
          <div className="text-3xl">✉️</div>
          <h2 className="text-xs font-bold text-zinc-900">Hubungi Kami Secara Langsung</h2>
          <p className="text-[10px] text-zinc-500 max-w-sm mx-auto leading-relaxed">
            Formulir pesan otomatis saat ini dinonaktifkan untuk mencegah penyalahgunaan spam. Silakan kirimkan email resmi Anda ke tombol di atas atau hubungi Customer Service kami via WhatsApp.
          </p>
        </section>

        {/* Social Media */}
        <section className="space-y-3">
          <h2 className="text-sm font-extrabold">{t("socialMedia")}</h2>
          <div className="flex flex-wrap gap-2.5">
            {socialLinks.map((social) => (
              <a
                key={social.label}
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-full bg-white border text-[11px] font-medium hover:border-primary-300 transition-colors"
              >
                <span className="text-base">{social.icon}</span>
                {social.label}
              </a>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}
