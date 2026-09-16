"use client";

import NextLink from "next/link";
import { useLocale } from "next-intl";
import {
  useRouter as useNextRouter,
  usePathname as useNextPathname,
} from "next/navigation";

const SUPPORTED_LOCALES = ["id", "en", "ar"] as const;

function withSingleLocalePrefix(locale: string, href: string) {
  if (!href) return href;
  if (!href.startsWith("/")) return href;

  const normalized = href.replace(/\/{2,}/g, "/");
  const segments = normalized.split("/").filter(Boolean);
  const first = segments[0];

  if (
    first &&
    SUPPORTED_LOCALES.includes(first as (typeof SUPPORTED_LOCALES)[number])
  ) {
    segments.shift();
  }

  const pathWithoutLocale = segments.join("/");
  return `/${locale}${pathWithoutLocale ? `/${pathWithoutLocale}` : ""}`;
}

export const Link = ({ href, ...props }: any) => {
  const locale = useLocale();
  let finalHref = href;

  if (typeof href === "string" && href.startsWith("/")) {
    finalHref = withSingleLocalePrefix(locale, href);
  }

  return <NextLink href={finalHref} {...props} />;
};

export const useRouter = () => {
  const router = useNextRouter();
  const locale = useLocale();

  return {
    ...router,
    push: (href: string, options?: any) => {
      let finalHref = href;
      if (href.startsWith("/")) {
        finalHref = withSingleLocalePrefix(locale, href);
      }
      router.push(finalHref, options);
    },
    replace: (href: string, options?: any) => {
      let finalHref = href;
      if (href.startsWith("/")) {
        finalHref = withSingleLocalePrefix(locale, href);
      }
      router.replace(finalHref, options);
    },
  };
};

export const usePathname = () => {
  const pathname = useNextPathname();
  // Strip locale from pathname to keep isActive logic working if it expects clean paths
  // Guard against null during SSR (Next.js may return null before hydration)
  if (pathname == null) return "/";
  return pathname.replace(/^\/(id|en|ar)/, "") || "/";
};
