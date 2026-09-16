"use client";

import { usePathname, Link } from "@/i18n/routing-patch";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

const navItems = [
  { key: "home", icon: "🏠", href: "/" },
  { key: "feeds", icon: "📰", href: "/feeds" },
  { key: "pack", icon: "📦", href: "/pack" },
  { key: "agen", icon: "👥", href: "/agen" },
];

export function BottomNav() {
  const pathname = usePathname();
  const t = useTranslations("nav");
  const locale = useLocale();
  const [highlightPack, setHighlightPack] = useState(false);
  const [showPackHint, setShowPackHint] = useState(false);
  const navRef = useRef<HTMLElement | null>(null);
  const packLinkRef = useRef<HTMLAnchorElement | null>(null);
  const [packHintLeft, setPackHintLeft] = useState<number | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const now = Date.now();
    const seen = window.localStorage.getItem("pack_nav_seen_v1") === "1";
    const mutedUntilRaw = window.localStorage.getItem("pack_nav_hint_muted_until_v1") || "0";
    const mutedUntil = Number(mutedUntilRaw) || 0;
    const onPackPage = pathname.startsWith("/pack");
    if (seen || onPackPage) {
      if (onPackPage) window.localStorage.setItem("pack_nav_seen_v1", "1");
      setHighlightPack(false);
      setShowPackHint(false);
      return;
    }
    const canShowHint = now >= mutedUntil;
    setHighlightPack(canShowHint);
    setShowPackHint(canShowHint);
  }, [pathname]);

  useEffect(() => {
    if (!showPackHint) return;
    const updateHintPosition = () => {
      const navEl = navRef.current;
      const packEl = packLinkRef.current;
      if (!navEl || !packEl) return;
      const navRect = navEl.getBoundingClientRect();
      const packRect = packEl.getBoundingClientRect();
      const centerLeft = packRect.left - navRect.left + (packRect.width / 2);
      setPackHintLeft(centerLeft);
    };
    updateHintPosition();
    window.addEventListener("resize", updateHintPosition);
    return () => {
      window.removeEventListener("resize", updateHintPosition);
    };
  }, [showPackHint]);

  const markPackSeen = () => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem("pack_nav_seen_v1", "1");
    }
    setHighlightPack(false);
    setShowPackHint(false);
  };

  const closePackHint24h = () => {
    if (typeof window !== "undefined") {
      const mutedUntil = Date.now() + 24 * 60 * 60 * 1000;
      window.localStorage.setItem("pack_nav_hint_muted_until_v1", String(mutedUntil));
    }
    setHighlightPack(false);
    setShowPackHint(false);
  };

  const packHintText =
    locale === "ar"
      ? "تحقق من أحدث الباقات في قائمة الباقات"
      : locale === "en"
        ? "Check the latest packages in Pack menu"
        : "Cek paket terbaru di menu Pack";
  const isArabic = locale === "ar";

  // pathname from next-intl does NOT include the locale prefix
  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  return (
    <>
      <nav ref={navRef} className="fixed bottom-0 left-0 right-0 z-[90] bg-white/95 backdrop-blur border-t border-zinc-100 rounded-t-2xl shadow-[0_-8px_24px_rgba(0,0,0,0.12)] pb-[max(env(safe-area-inset-bottom),0.75rem)] sm:absolute sm:bottom-0 sm:left-0 sm:right-0">
        <div className="flex justify-around pt-2.5 pb-1.5">
          {navItems.map((item) => (
            <Link
              key={item.key}
              ref={item.key === "pack" ? packLinkRef : undefined}
              href={item.href}
              onClick={item.key === "pack" ? markPackSeen : undefined}
              className={cn(
                "flex flex-col items-center gap-1.5 px-3 py-1.5 rounded-2xl transition-all duration-200 min-w-[58px]",
                isActive(item.href)
                  ? "text-primary-600"
                  : item.key === "pack" && highlightPack
                    ? "text-amber-600 bg-amber-50 ring-1 ring-amber-200"
                  : "text-zinc-400 hover:text-zinc-600",
              )}
            >
              <div className="text-2xl leading-none relative">
                {item.icon}
                {item.key === "pack" && highlightPack && !isActive(item.href) && (
                  <>
                    <span className="absolute -top-1.5 -right-2.5 inline-flex h-2.5 w-2.5 rounded-full bg-amber-500 animate-ping" />
                    <span className="absolute -top-1.5 -right-2.5 inline-flex h-2.5 w-2.5 rounded-full bg-amber-500" />
                  </>
                )}
                {isActive(item.href) && (
                  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-5 h-0.5 g-main rounded-full" />
                )}
              </div>
              <span className="text-[11px] sm:text-xs font-extrabold leading-none tracking-[0.015em] whitespace-nowrap">
                {t(item.key as "home" | "feeds" | "pack" | "agen")}
              </span>
            </Link>
          ))}

          {/* Info Button */}
          <Link
            href="/information"
            className={cn(
              "flex flex-col items-center gap-1.5 px-3 py-1.5 rounded-2xl transition-all duration-200 min-w-[58px]",
              isActive("/information")
                ? "text-primary-600"
                : "text-zinc-400 hover:text-zinc-600",
            )}
          >
            <div className="text-2xl leading-none relative">
              ℹ️
              {isActive("/information") && (
                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-5 h-0.5 g-main rounded-full" />
              )}
            </div>
            <span className="text-[11px] sm:text-xs font-extrabold leading-none tracking-[0.015em] whitespace-nowrap">
              {t("info" as any)}
            </span>
          </Link>

          {/* Akun Button */}
          <Link
            href="/akun"
            className={cn(
              "flex flex-col items-center gap-1.5 px-3 py-1.5 rounded-2xl transition-all duration-200 min-w-[58px]",
              isActive("/akun")
                ? "text-primary-600"
                : "text-zinc-400 hover:text-zinc-600",
            )}
          >
            <div className="text-2xl leading-none relative">
              👤
              {isActive("/akun") && (
                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-5 h-0.5 g-main rounded-full" />
              )}
            </div>
            <span className="text-[11px] sm:text-xs font-extrabold leading-none tracking-[0.015em] whitespace-nowrap">
              {t("akun" as any)}
            </span>
          </Link>
        </div>

        {showPackHint && !pathname.startsWith("/pack") && packHintLeft !== null ? (
          <div className="absolute -top-12 z-[95]" style={{ left: `${packHintLeft}px`, transform: "translateX(-50%)" }}>
            <div
              className="relative rounded-xl bg-amber-50 border border-amber-200 px-3 py-1.5 pr-7 shadow-md text-[11px] font-semibold text-amber-800 whitespace-nowrap"
              style={isArabic ? { fontFamily: "'Arabic Typesetting', 'Amiri', serif", fontSize: "14px", lineHeight: "1.1" } : undefined}
            >
              {packHintText}
              <button
                type="button"
                onClick={closePackHint24h}
                className="absolute right-0.5 top-1/2 -translate-y-1/2 h-8 w-8 inline-flex items-center justify-center rounded-full text-amber-700/80 hover:text-amber-900 hover:bg-amber-100 active:bg-amber-200 text-sm"
                aria-label="Tutup petunjuk"
              >
                x
              </button>
              <span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-2.5 h-2.5 bg-amber-50 border-r border-b border-amber-200 rotate-45" />
            </div>
          </div>
        ) : null}
      </nav>
    </>
  );
}
