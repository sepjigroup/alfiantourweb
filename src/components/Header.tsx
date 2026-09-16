"use client";

import { useEffect, useRef, useState } from "react";
import { useLocale } from "next-intl";
import { Link, usePathname } from "@/i18n/routing-patch";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { Globe, Search, Wallet2, Bookmark, Bell } from "lucide-react";
import Image from "next/image";
import { setPublicCurrency } from "@/lib/public-currency";
import { getWishlist, WISHLIST_EVENT } from "@/lib/wishlist";
import { useAuth } from "@/lib/auth";
import { apiGet } from "@/lib/api-client";

interface HeaderProps {
  onSearchOpen: () => void;
  showBrand?: boolean;
}

export function Header({ onSearchOpen, showBrand = true }: HeaderProps) {
  const t = useTranslations("common");
  const locale = useLocale();
  const pathname = usePathname();
  const [currencyOpen, setCurrencyOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [currency, setCurrency] = useState("IDR");
  const [wishlistCount, setWishlistCount] = useState(0);
  const headerRef = useRef<HTMLElement | null>(null);

  // Authenticated state check for notification bell
  const { user, isLoggedIn, hasRole } = useAuth();
  const isPrivilegedAdmin = isLoggedIn && user && (hasRole("superadmin") || hasRole("admin") || hasRole("manager"));

  const currencies = [
    { code: "IDR", flag: "🇮🇩", label: "IDR" },
    { code: "USD", flag: "🇺🇸", label: "USD" },
    { code: "SAR", flag: "🇸🇦", label: "SAR" },
    { code: "MYR", flag: "🇲🇾", label: "MYR" },
    { code: "AUTO", flag: "🔄", label: "Auto", separator: true },
  ];

  const languages = [
    { code: "id", flag: "🇮🇩", label: "Bahasa Indonesia" },
    { code: "en", flag: "🇬🇧", label: "English" },
    { code: "ar", flag: "🇸🇦", label: "عربي" },
  ];

  const switchLanguage = (newLocale: string) => {
    setLangOpen(false);
    setCurrencyOpen(false);
    const currentPath = pathname || "/";
    const normalized = currentPath.replace(/^\/(id|en|ar)(?=\/|$)/, "");
    const nextPath = `/${newLocale}${normalized === "/" ? "" : normalized}`;
    window.location.assign(nextPath);
  };

  useEffect(() => {
    const saved = typeof window !== "undefined" ? window.localStorage.getItem("travelapp_currency") : null;
    if (saved) setCurrency(saved.toUpperCase());
    setWishlistCount(getWishlist().length);
    const handleOutside = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node | null;
      if (!headerRef.current || !target) return;
      if (!headerRef.current.contains(target)) {
        setLangOpen(false);
        setCurrencyOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutside);
    document.addEventListener("touchstart", handleOutside);
    const onWishlistChanged = () => setWishlistCount(getWishlist().length);
    window.addEventListener("storage", onWishlistChanged);
    window.addEventListener(WISHLIST_EVENT, onWishlistChanged);
    return () => {
      document.removeEventListener("mousedown", handleOutside);
      document.removeEventListener("touchstart", handleOutside);
      window.removeEventListener("storage", onWishlistChanged);
      window.removeEventListener(WISHLIST_EVENT, onWishlistChanged);
    };
  }, []);

  return (
    <header
      ref={headerRef}
      className="bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/85 border-b border-zinc-100 px-3 pt-3 pb-2.5 min-h-[58px] shadow-[0_1px_0_rgba(0,0,0,0.04)] flex items-center gap-2.5"
    >
      {/* Brand */}
      {showBrand ? (
        <div className="flex items-center gap-2 flex-shrink-0">
          <Link href="/" aria-label="Ke Beranda" title="Ke Beranda" className="inline-flex">
            <Image
              src="/newlogo2.png"
              alt="Alfian Tour"
              width={120}
              height={67}
              className="h-8 w-auto object-contain"
              priority
            />
          </Link>
        </div>
      ) : null}

      {/* Search */}
      <button
        onClick={() => {
          setLangOpen(false);
          setCurrencyOpen(false);
          onSearchOpen();
        }}
        className="flex-1 h-9 rounded-xl bg-zinc-100 border border-zinc-200 px-3 text-left text-xs text-zinc-500 flex items-center gap-2"
      >
        <Search className="w-4 h-4 text-zinc-400" />
        <span className="truncate">{t("searchPlaceholder")}</span>
      </button>

      {/* Currency */}
      <div className="relative">
        <button
          onClick={() => {
            setCurrencyOpen(!currencyOpen);
            setLangOpen(false);
          }}
          className="h-9 w-9 rounded-xl border border-zinc-200 bg-white flex items-center justify-center text-zinc-600 hover:bg-zinc-50"
        >
          <Wallet2 className="w-4 h-4" />
        </button>
        {currencyOpen && (
          <div className="absolute right-0 mt-2 bg-white shadow-xl rounded-2xl py-2 w-36 text-xs z-[9999] border">
            {currencies.map((c) => (
              <button
                key={c.code}
                onClick={() => {
                  const next = c.code === "AUTO" ? "IDR" : c.code;
                  setCurrency(next);
                  setPublicCurrency(next);
                  setCurrencyOpen(false);
                }}
                className={cn(
                  "w-full px-5 py-2.5 text-left hover:bg-zinc-50 flex items-center gap-2",
                  c.separator && "border-t border-zinc-100 mt-1 pt-3",
                )}
              >
                <span>{c.flag}</span>
                <span
                  className={cn(
                    currency === c.code && "font-bold text-primary-600",
                  )}
                >
                  {c.label}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Language */}
      <div className="relative">
        <button
          onClick={() => {
            setLangOpen(!langOpen);
            setCurrencyOpen(false);
          }}
          className="h-9 w-9 rounded-xl border border-zinc-200 bg-white flex items-center justify-center text-zinc-600 hover:bg-zinc-50"
        >
          <Globe className="w-4 h-4" />
        </button>
        {langOpen && (
          <div className="absolute right-0 mt-2 bg-white shadow-xl rounded-2xl py-2 w-44 text-xs z-[9999] border">
            {languages.map((l) => (
              <button
                key={l.code}
                onClick={() => switchLanguage(l.code)}
                className={cn(
                  "w-full px-5 py-2.5 text-left hover:bg-zinc-50 flex items-center gap-2",
                  locale === l.code &&
                    "font-bold text-primary-600 bg-primary-50",
                )}
              >
                <span>{l.flag}</span>
                <span>{l.label}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Admin Realtime Notifications Bell */}
      {isPrivilegedAdmin && (
        <AdminNotificationsBell locale={locale} />
      )}

      {/* Wishlist */}
      <button
        onClick={() => window.location.assign(`/${locale}/akun/wishlist`)}
        className="h-9 w-9 rounded-xl g-main text-white inline-flex items-center justify-center relative"
        aria-label="Wishlist"
        title="Wishlist"
      >
        <Bookmark className="w-4 h-4" />
        {wishlistCount > 0 ? (
          <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-red-600 text-white text-[10px] leading-[18px] font-extrabold text-center ring-2 ring-white">
            {wishlistCount > 99 ? "99+" : wishlistCount}
          </span>
        ) : null}
      </button>
    </header>
  );
}

function AdminNotificationsBell({ locale }: { locale: string }) {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const bellRef = useRef<HTMLDivElement | null>(null);

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const res = await apiGet<any>("/api/system/admin-notifications");
      if (res && res.data) {
        setNotifications(res.data);
      }
    } catch (e) {
      console.error("Failed to load admin notifications", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadNotifications();

    // Poll for notifications updates every 45 seconds
    const interval = setInterval(() => {
      void loadNotifications();
    }, 45000);

    const handleOutsideClick = (e: MouseEvent) => {
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);

    return () => {
      clearInterval(interval);
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, []);

  const timeAgo = (dateStr: string) => {
    try {
      const ms = Date.now() - new Date(dateStr).getTime();
      const mins = Math.floor(ms / 60000);
      if (mins < 1) return "Baru saja";
      if (mins < 60) return `${mins}m lalu`;
      const hrs = Math.floor(mins / 60);
      if (hrs < 24) return `${hrs}j lalu`;
      const days = Math.floor(hrs / 24);
      return `${days}h lalu`;
    } catch {
      return "";
    }
  };

  return (
    <div className="relative" ref={bellRef}>
      <button
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) {
            void loadNotifications();
          }
        }}
        className="h-9 w-9 rounded-xl border border-zinc-200 bg-white flex items-center justify-center text-zinc-600 hover:bg-zinc-50 relative transition-all"
        title="Notifikasi Superadmin"
      >
        <Bell className="w-4 h-4" />
        {notifications.length > 0 && (
          <span className="absolute -top-1 -right-1 h-3.5 w-3.5 rounded-full bg-rose-600 border-2 border-white animate-pulse" />
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 bg-white shadow-2xl rounded-2xl w-80 sm:w-96 text-xs z-[9999] border border-zinc-200/80 overflow-hidden animate-fade-up">
          <div className="bg-zinc-950 text-white px-4 py-3.5 flex items-center justify-between">
            <span className="font-extrabold flex items-center gap-1.5">
              <span>🔔</span> Notifikasi Superadmin
            </span>
            <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded font-black uppercase tracking-wider">{notifications.length} Info</span>
          </div>

          <div className="max-h-[340px] overflow-y-auto divide-y divide-zinc-100">
            {loading && notifications.length === 0 ? (
              <div className="p-8 text-center text-zinc-400 font-medium">Memuat info terbaru...</div>
            ) : null}
            {!loading && notifications.length === 0 ? (
              <div className="p-8 text-center text-zinc-400 font-medium font-mono">Tidak ada notifikasi baru.</div>
            ) : null}
            {notifications.map((item) => {
              const bgMap: Record<string, string> = {
                inquiry: "bg-blue-50 text-blue-700 border-blue-100",
                booking: "bg-emerald-50 text-emerald-700 border-emerald-100",
                register: "bg-purple-50 text-purple-700 border-purple-100",
                membership: "bg-indigo-50 text-indigo-700 border-indigo-100",
                career: "bg-amber-50 text-amber-700 border-amber-100"
              };
              const iconMap: Record<string, string> = {
                inquiry: "📥",
                booking: "📦",
                register: "👤",
                membership: "💎",
                career: "💼"
              };

              return (
                <Link
                  key={item.id}
                  href={item.link}
                  onClick={() => setIsOpen(false)}
                  className="block p-3.5 hover:bg-zinc-50/80 transition-colors space-y-1.5 text-left"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className={`px-2.5 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-wider border ${bgMap[item.type] || "bg-zinc-100 text-zinc-600"}`}>
                      {iconMap[item.type] || "🔔"} {item.title}
                    </span>
                    <span className="text-[10px] text-zinc-400 font-semibold font-mono">{timeAgo(item.createdAt)}</span>
                  </div>
                  <p className="text-zinc-700 font-bold leading-relaxed break-words">{item.message}</p>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
