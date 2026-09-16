const SUPPORTED_LOCALES = ["id", "en", "ar"] as const;

type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];

export function getLocalizedAlternates(locale: string, path: string) {
  const normalizedPath = path === "/" ? "" : path;
  const safeLocale = SUPPORTED_LOCALES.includes(locale as SupportedLocale)
    ? locale
    : "id";

  return {
    canonical: `/${safeLocale}${normalizedPath}`,
    languages: {
      id: `/id${normalizedPath}`,
      en: `/en${normalizedPath}`,
      ar: `/ar${normalizedPath}`,
    },
  };
}
