"use client";

import { Link } from "@/i18n/routing-patch";
import Image from "next/image";

const NAV_LINKS = [
  { href: "/", label: "Beranda" },
  { href: "/layanan", label: "Layanan" },
  { href: "/toko", label: "Toko" },
  { href: "/pack", label: "Paket Alfian" },
  { href: "/#feeds", label: "Feeds" },
  { href: "/#kemitraan", label: "Kemitraan" },
  { href: "/#karir", label: "Karir" },
] as const;

export function DesktopNavbar({ activeHref }: { activeHref?: string }) {
  return (
    <>
      <style>{NAVBAR_STYLES}</style>
      <header className="fixed top-0 left-0 right-0 z-50 glass border-b border-white/30 shadow-sm">
        <nav className="max-w-7xl mx-auto px-6 lg:px-8 h-14 flex items-center justify-between">
          {/* Logo */}
          <Link
            href="/"
            aria-label="Alfian Tour - Beranda"
            className="group inline-flex items-center"
          >
            <Image
              src="/newlogo2.png"
              alt="Alfian Tour"
              width={668}
              height={373}
              className="h-10 w-auto object-contain transition-transform duration-300 group-hover:scale-[1.02]"
              priority
            />
          </Link>

          {/* Nav Links */}
          <div className="hidden lg:flex items-center gap-8">
            {NAV_LINKS.map((link) => {
              const isActive = activeHref
                ? activeHref === link.href ||
                  (link.href !== "/" && activeHref.startsWith(link.href))
                : false;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={
                    isActive
                      ? "text-sm font-extrabold text-primary-600 relative after:content-[''] after:absolute after:-bottom-1 after:left-0 after:w-full after:h-0.5 after:bg-gradient-to-r after:from-primary-600 after:to-accent-500 after:rounded-full"
                      : "nav-link text-sm font-semibold text-gray-700 hover:text-primary-600 transition-colors duration-200"
                  }
                >
                  {link.label}
                </Link>
              );
            })}
          </div>

          {/* CTA */}
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="hidden sm:inline-flex text-sm font-semibold text-primary-600 border border-primary-200 px-5 py-2 rounded-full hover:bg-primary-50 transition-all duration-200"
            >
              Masuk
            </Link>
            <Link
              href="/register"
              className="inline-flex items-center gap-1.5 text-sm font-bold text-white bg-primary-600 px-5 py-2 rounded-full shadow-md shadow-primary-200 hover:bg-primary-700 hover:shadow-primary-300 hover:shadow-lg transition-all duration-300"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
              Daftar Agen
            </Link>
          </div>
        </nav>
      </header>
    </>
  );
}

/* Nav link underline animation */
const NAVBAR_STYLES = `
.nav-link { position: relative; }
.nav-link::after {
  content: ''; position: absolute; bottom: -4px; left: 0; width: 0; height: 2px;
  background: linear-gradient(90deg, #7C3AED, #3B82F6);
  transition: width 0.3s ease; border-radius: 2px;
}
.nav-link:hover::after { width: 100%; }
.glass {
  background: rgba(255,255,255,0.88);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
}
`;
