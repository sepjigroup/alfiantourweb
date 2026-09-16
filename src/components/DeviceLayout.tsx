"use client";

import { useState, useEffect, type ReactNode } from "react";

export function DeviceLayout({
  mobile,
  desktop,
}: {
  mobile: ReactNode;
  desktop: ReactNode;
}) {
  const [ready, setReady] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1280px)");
    setIsDesktop(mq.matches);
    setReady(true);
    const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  // SSR / initial render — show a clean loading state (prevents flash of wrong shell)
  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-full border-3 border-zinc-200 border-t-primary-600 animate-spin" />
          <p className="text-sm text-zinc-400 font-medium">Alfian Tour</p>
        </div>
      </div>
    );
  }

  return isDesktop ? <>{desktop}</> : <>{mobile}</>;
}
