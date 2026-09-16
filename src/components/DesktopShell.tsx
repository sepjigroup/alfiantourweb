"use client";

import { useState, useRef } from "react";
import { usePathname } from "@/i18n/routing-patch";
import { Header } from "@/components/Header";
import { DesktopSidebar } from "@/components/DesktopSidebar";
import { SearchModal } from "@/components/SearchModal";
import { MaintenanceGate } from "@/components/MaintenanceGate";
import { TrackingInjector } from "@/components/TrackingInjector";
import { AnalyticsHeartbeat } from "@/components/AnalyticsHeartbeat";
import DesktopLanding from "@/components/DesktopLanding";
import DesktopPackPage from "@/components/DesktopPackPage";

export default function DesktopShell({
  children,
  locale,
}: {
  children: React.ReactNode;
  locale: string;
}) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const pathname = usePathname();

  // Home route → render full landing page
  const isHome =
    pathname === "/" || pathname === `/${locale}` || pathname === "";

  // Pack catalog route
  const isPackCatalog = pathname === "/pack";

  if (isHome) {
    return (
      <>
        <DesktopLanding />
        <AnalyticsHeartbeat />
        <TrackingInjector />
        <MaintenanceGate />
      </>
    );
  }

  if (isPackCatalog) {
    return (
      <>
        <DesktopPackPage />
        <AnalyticsHeartbeat />
        <TrackingInjector />
        <MaintenanceGate />
      </>
    );
  }

  // Other routes → sidebar + content layout
  return (
    <div className="flex h-screen bg-zinc-50 overflow-hidden">
      <div className="shrink-0 h-full">
        <DesktopSidebar />
      </div>
      <div className="flex-1 flex flex-col min-w-0">
        <div className="sticky top-0 z-[140] bg-white border-b border-zinc-200">
          <Header
            onSearchOpen={() => setSearchOpen(true)}
            showBrand={false}
          />
        </div>
        <div
          ref={contentRef}
          onScroll={(e) => {
            const el = e.currentTarget;
            setShowBackToTop(el.scrollTop > el.clientHeight);
          }}
          className="flex-1 overflow-y-auto scrollbar-hide"
        >
          <div className="max-w-5xl mx-auto px-6 py-6">{children}</div>
        </div>
        <button
          onClick={() =>
            contentRef.current?.scrollTo({ top: 0, behavior: "smooth" })
          }
          className={`fixed right-6 bottom-6 z-[95] h-10 w-10 rounded-full bg-white border border-zinc-200 text-zinc-700 shadow-lg flex items-center justify-center transition-all duration-300 ${
            showBackToTop
              ? "opacity-100 translate-y-0 pointer-events-auto"
              : "opacity-0 translate-y-2 pointer-events-none"
          }`}
          aria-label="Back to top"
        >
          <svg
            viewBox="0 0 24 24"
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 19V5" />
            <path d="m5 12 7-7 7 7" />
          </svg>
        </button>
      </div>
      <SearchModal
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        variant="desktop"
      />
      <AnalyticsHeartbeat />
      <TrackingInjector />
      <MaintenanceGate />
    </div>
  );
}
