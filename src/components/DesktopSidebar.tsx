"use client";

import { usePathname, Link } from "@/i18n/routing-patch";
import { useLocale, useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import Image from "next/image";

const menuItems = [
  { key: "home", icon: "🏠", href: "/" },
  { key: "layanan", icon: "💼", href: "/layanan" },
  { key: "marketplace", icon: "🛒", href: "/toko" },
  { key: "pack", icon: "📦", href: "/pack" },
  { key: "feeds", icon: "📰", href: "/feeds" },
  { key: "agen", icon: "👥", href: "/agen" },
];

const bottomItems = [
  { key: "akun", icon: "👤", href: "/akun" },
  { key: "information", icon: "ℹ️", href: "/information" },
  { key: "contact", icon: "📞", href: "/contact" },
];

export function DesktopSidebar() {
  const pathname = usePathname();
  const t = useTranslations("nav");
  const tm = useTranslations("more");
  const locale = useLocale();
  const isActive = (href: string) => {
    if (href === "/") return pathname === "/" || pathname === `/${locale}`;
    return pathname.startsWith(href);
  };

  return (
    <aside className="flex flex-col h-full w-64 bg-white border-r border-zinc-200">
      {/* Logo / Brand */}
      <div className="h-[58px] px-5 border-b border-zinc-100">
        <Link
          href="/"
          aria-label="Alfian Tour - Beranda"
          className="flex h-full items-center justify-center rounded-xl px-2 transition hover:bg-zinc-50"
        >
          <Image
            src="/newlogo2.png"
            alt="Alfian Tour"
            width={668}
            height={373}
            className="h-10 w-auto max-w-full object-contain"
            priority
          />
        </Link>
      </div>

      {/* Main Menu */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <div className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider px-2 mb-2">
          Menu
        </div>
        {menuItems.map((item) => {
          const getLabel = () => {
            if (item.key === "layanan") {
              const labels = { id: "Layanan", en: "Services", ar: "الخدمات" };
              return labels[locale as "id" | "en" | "ar"] ?? labels.id;
            }
            if (item.key === "marketplace") {
              const labels = { id: "Marketplace", en: "Marketplace", ar: "السوق" };
              return labels[locale as "id" | "en" | "ar"] ?? labels.id;
            }
            return item.key === "home"
              ? t("home")
              : item.key === "feeds"
                ? t("feeds")
                : item.key === "pack"
                  ? t("pack")
                  : t("agen");
          };
          return (
            <Link
              key={item.key}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors",
                isActive(item.href)
                  ? "bg-primary-50 text-primary-700"
                  : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900",
              )}
            >
              <span className="text-lg">{item.icon}</span>
              <span>{getLabel()}</span>
            </Link>
          );
        })}
      </nav>

      {/* Bottom Menu */}
      <div className="px-3 py-3 border-t border-zinc-100 space-y-1">
        {bottomItems.map((item) => (
          <Link
            key={item.key}
            href={item.href}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors",
              isActive(item.href)
                ? "bg-primary-50 text-primary-700"
                : "text-zinc-500 hover:bg-zinc-50 hover:text-zinc-700",
            )}
          >
            <span className="text-base">{item.icon}</span>
            <span>
              {item.key === "akun"
                ? t("akun")
                : item.key === "information"
                  ? tm("information")
                  : tm("contact")}
            </span>
          </Link>
        ))}
      </div>

      {/* Footer */}
      <div className="px-5 py-3 border-t border-zinc-100">
        <p className="text-[10px] text-zinc-400 text-center">
          © {new Date().getFullYear()} Alfian Tour
        </p>
      </div>
    </aside>
  );
}
