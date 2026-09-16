"use client";

import { useState, useRef, useEffect } from "react";
import { Header } from "@/components/Header";
import { BottomNav } from "@/components/BottomNav";
import { SearchModal } from "@/components/SearchModal";
import { MaintenanceGate } from "@/components/MaintenanceGate";
import { TrackingInjector } from "@/components/TrackingInjector";
import { AnalyticsHeartbeat } from "@/components/AnalyticsHeartbeat";

const DESKTOP_MEDIA_QUERY = "(min-width: 1280px)";
const QR_CACHE_KEY = "travelapp_desktop_qr_data_v1";
const QR_CACHE_ORIGIN_KEY = "travelapp_desktop_qr_origin_v1";

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(new Error("Gagal membaca QR blob"));
    reader.readAsDataURL(blob);
  });
}

export default function AppShell({
  children,
  locale,
}: {
  children: React.ReactNode;
  locale: string;
}) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [desktopQrUrl, setDesktopQrUrl] = useState("");
  const [showDesktopBackdrop, setShowDesktopBackdrop] = useState(false);
  const contentRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia(DESKTOP_MEDIA_QUERY);
    const sync = () => setShowDesktopBackdrop(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || !showDesktopBackdrop) return;

    const cachedData = localStorage.getItem(QR_CACHE_KEY);
    const cachedOrigin = localStorage.getItem(QR_CACHE_ORIGIN_KEY);
    if (cachedData && cachedOrigin === window.location.origin) {
      setDesktopQrUrl(cachedData);
      return;
    }

    const mobileTarget = `${window.location.origin}/id`;
    const qrEndpoint = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(mobileTarget)}`;

    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(qrEndpoint, { cache: "force-cache" });
        if (!res.ok) throw new Error("QR endpoint gagal");
        const blob = await res.blob();
        const dataUrl = await blobToDataUrl(blob);
        if (cancelled) return;
        setDesktopQrUrl(dataUrl);
        localStorage.setItem(QR_CACHE_KEY, dataUrl);
        localStorage.setItem(QR_CACHE_ORIGIN_KEY, window.location.origin);
      } catch {
        if (cancelled) return;
        setDesktopQrUrl(qrEndpoint);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [showDesktopBackdrop]);

  return (
    <div className="relative flex items-center justify-center h-[100svh] min-h-screen bg-zinc-100 p-0 sm:p-4 overflow-hidden">
      <div className={`pointer-events-none absolute inset-0 ${showDesktopBackdrop ? "block" : "hidden"}`}>
        <div className="desktopGlow desktopGlowLeft absolute inset-y-0 left-0 w-[32%] bg-[radial-gradient(75%_120%_at_25%_20%,#c084fc_0%,#8b5cf6_40%,#6d28d9_80%)]" />
        <div className="desktopGlow desktopGlowRight absolute inset-y-0 right-0 w-[32%] bg-[radial-gradient(75%_120%_at_75%_20%,#d8b4fe_0%,#a855f7_42%,#6d28d9_84%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(76,29,149,0.05),rgba(255,255,255,0)_28%,rgba(255,255,255,0)_72%,rgba(76,29,149,0.05))]" />
      </div>

      <div className={`${showDesktopBackdrop ? "flex" : "hidden"} absolute left-[max(1.25rem,calc(50%-640px))] top-1/2 -translate-y-1/2 z-10 w-[25%] max-w-[350px] text-white`}>
        <div className="rounded-3xl border border-white/35 bg-white/12 backdrop-blur-md p-6 shadow-2xl">
          <div className="text-[11px] uppercase tracking-[0.25em] font-bold text-violet-100">ALFIAN TOUR</div>
          <h2 className="mt-3 text-3xl font-black leading-tight">Spesialis Umroh & Haji Lansia, Nyaman dan Amanah.</h2>
          <p className="mt-3 text-sm text-violet-100/95 leading-relaxed">
            Fokus melayani kakek-nenek dengan pendampingan lebih sabar, ritme ibadah lebih tenang,
            serta dukungan tim berpengalaman dari persiapan hingga kepulangan.
          </p>
          <div className="mt-4 inline-flex rounded-2xl bg-white/20 px-3 py-2 text-xs font-semibold leading-relaxed">
            Cocok untuk jamaah lansia: akses mudah, alur simpel, dan bantuan cepat.
          </div>
        </div>
      </div>

      <div className={`${showDesktopBackdrop ? "flex" : "hidden"} absolute right-[max(1.25rem,calc(50%-640px))] top-1/2 -translate-y-1/2 z-10 w-[24%] max-w-[320px] text-white`}>
        <div className="w-full rounded-3xl border border-white/35 bg-white/12 backdrop-blur-md p-5 shadow-2xl text-center">
          <div className="text-sm font-extrabold">Scan & Lanjut di Android</div>
          <div className="mt-3 w-full flex justify-center">
            <div className="rounded-2xl bg-white p-2.5 inline-flex items-center justify-center shadow-[inset_0_0_0_1px_rgba(0,0,0,0.06)]">
            {desktopQrUrl ? (
              <img
                src={desktopQrUrl}
                alt="QR Buka Alfian Tour di HP"
                className="w-40 h-40 object-contain rounded-xl"
                loading="lazy"
              />
            ) : (
              <div className="w-40 h-40 rounded-xl bg-zinc-100 animate-pulse" />
            )}
            </div>
          </div>
          <p className="mt-3 text-xs text-violet-100/95 leading-relaxed">
            Arahkan kamera HP ke QR ini, lalu lanjutkan pemesanan langsung dari smartphone.
          </p>
        </div>
      </div>

      <div id="app-shell-container" className="mobile-container relative w-full h-full max-h-none sm:max-h-[900px] rounded-none sm:rounded-[2.5rem] overflow-hidden border-0 sm:border-8 border-transparent sm:border-zinc-800 shadow-none sm:shadow-2xl flex flex-col">
        <div className="sticky top-[env(safe-area-inset-top)] z-[140]">
          <Header onSearchOpen={() => setSearchOpen(true)} />
        </div>
        <div
          ref={contentRef}
          onScroll={(e) => {
            const el = e.currentTarget;
            setShowBackToTop(el.scrollTop > el.clientHeight);
          }}
          className="flex-1 overflow-y-auto scrollbar-hide pb-28 sm:pb-24"
        >
          {children}
        </div>
        <button
          onClick={() => contentRef.current?.scrollTo({ top: 0, behavior: "smooth" })}
          className={`absolute right-3 bottom-20 sm:bottom-24 z-[95] h-9 w-9 rounded-full bg-white border border-zinc-200 text-zinc-700 shadow-lg flex items-center justify-center transition-all duration-300 ${
            showBackToTop ? "opacity-100 translate-y-0 pointer-events-auto" : "opacity-0 translate-y-2 pointer-events-none"
          }`}
          aria-label="Back to top"
          title="Back to top"
        >
          <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M12 19V5" />
            <path d="m5 12 7-7 7 7" />
          </svg>
        </button>
        <BottomNav />
      </div>
      <SearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />
      <AnalyticsHeartbeat />
      <TrackingInjector />
      <MaintenanceGate />
      <style jsx global>{`
        .desktopGlow {
          filter: saturate(112%);
          will-change: transform, opacity;
          animation: desktopGlowFloat 14s ease-in-out infinite;
        }
        .desktopGlowLeft {
          animation-delay: 0s;
        }
        .desktopGlowRight {
          animation-delay: 1.8s;
        }
        @keyframes desktopGlowFloat {
          0% { transform: translate3d(0, 0, 0) scale(1); opacity: 0.92; }
          50% { transform: translate3d(0, -12px, 0) scale(1.04); opacity: 1; }
          100% { transform: translate3d(0, 0, 0) scale(1); opacity: 0.92; }
        }
      `}</style>
    </div>
  );
}
