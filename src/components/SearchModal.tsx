"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/routing-patch";
import { ModalShell } from "@/components/ui/ModalShell";
import { fetchPrograms, type ProgramItem } from "@/lib/programs";

interface SearchModalProps {
  open: boolean;
  onClose: () => void;
  variant?: "mobile" | "desktop";
}

export function SearchModal({
  open,
  onClose,
  variant = "mobile",
}: SearchModalProps) {
  const t = useTranslations("common");
  const router = useRouter();
  const [q, setQ] = useState("");
  const [rows, setRows] = useState<ProgramItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    let active = true;
    setLoading(true);
    fetchPrograms()
      .then((items) => {
        if (!active) return;
        setRows(items);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [open]);

  const recommended = useMemo(() => {
    const mapped = rows.map((p) => {
      let price = 0;
      try {
        const cfg = typeof p.displayConfigJson === "string" ? JSON.parse(p.displayConfigJson) as { packageTypePricings?: Array<{ priceIdr?: number }>; priceIdr?: number } : {};
        const prices = (cfg.packageTypePricings ?? []).map((x) => Number(x.priceIdr || 0)).filter((x) => x > 0);
        price = prices.length > 0 ? Math.min(...prices) : Number(cfg.priceIdr || 0);
      } catch {}
      return { program: p, price };
    });
    const sorted = mapped.sort((a, b) => a.price - b.price);
    const bySearch = q.trim()
      ? sorted.filter((x) => {
          const searchable = [
            x.program.title,
            x.program.name,
            x.program.slug,
            x.program.airlineName,
            ...(x.program.packages ?? []).flatMap((pkg) => [
              pkg.packageClassName,
              pkg.makkahHotelName,
              pkg.madinahHotelName,
              ...(pkg.departures ?? []).flatMap((departure) => [
                departure.airlineName,
                departure.departureAirportName,
                departure.makkahHotelName,
                departure.madinahHotelName,
                departure.packageTypeName,
              ]),
            ]),
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();
          return searchable.includes(q.trim().toLowerCase());
        })
      : sorted;
    return bySearch.slice(0, 6);
  }, [rows, q]);

  if (!open) return null;

  if (variant === "desktop") {
    return (
      <ModalShell
        open={open}
        onBackdropClick={onClose}
        zIndexClass="z-[9999]"
        overlayClassName="bg-slate-950/70 backdrop-blur-sm"
        contentWrapperClassName="relative h-full w-full flex items-start justify-center px-8 pt-[12vh] pointer-events-none"
      >
        <div
          onClick={(e) => e.stopPropagation()}
          className="pointer-events-auto w-full max-w-4xl overflow-hidden rounded-3xl border border-white/20 bg-white shadow-2xl"
        >
          <div className="border-b border-slate-100 bg-gradient-to-r from-primary-50 via-white to-accent-50 px-8 py-6">
            <div className="flex items-start justify-between gap-6">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary-600">
                  Pencarian Paket
                </p>
                <h2 className="mt-1 text-2xl font-extrabold text-slate-900">
                  Temukan perjalanan yang paling sesuai
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Cari berdasarkan nama paket, tujuan, maskapai, atau hotel.
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Tutup pencarian"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-lg text-slate-500 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900"
              >
                ×
              </button>
            </div>

            <div className="mt-5 flex items-center gap-3 rounded-2xl border border-primary-200 bg-white px-5 py-4 shadow-sm focus-within:border-primary-400 focus-within:ring-4 focus-within:ring-primary-100">
              <svg
                className="h-5 w-5 shrink-0 text-primary-600"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
              </svg>
              <input
                type="search"
                placeholder={t("searchPlaceholder")}
                className="min-w-0 flex-1 bg-transparent text-base font-medium text-slate-900 outline-none placeholder:text-slate-400"
                autoFocus
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
              {q ? (
                <button
                  type="button"
                  onClick={() => setQ("")}
                  className="text-xs font-bold text-slate-400 hover:text-primary-600"
                >
                  Hapus
                </button>
              ) : null}
            </div>
          </div>

          <div className="max-h-[55vh] overflow-y-auto px-8 py-6">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-extrabold text-slate-900">
                  {q.trim() ? "Hasil pencarian" : "Rekomendasi paket"}
                </p>
                <p className="mt-0.5 text-xs text-slate-500">
                  {loading
                    ? "Mengambil paket terbaru..."
                    : `${recommended.length} paket ditampilkan`}
                </p>
              </div>
              <Link
                href="/pack"
                onClick={onClose}
                className="text-sm font-bold text-primary-600 hover:text-primary-700 hover:underline"
              >
                Lihat semua paket
              </Link>
            </div>

            {loading ? (
              <div className="grid grid-cols-2 gap-4">
                {[0, 1, 2, 3].map((item) => (
                  <div
                    key={item}
                    className="h-24 animate-pulse rounded-2xl bg-slate-100"
                  />
                ))}
              </div>
            ) : null}

            {!loading && recommended.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center">
                <p className="font-bold text-slate-800">
                  Paket belum ditemukan
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  Coba gunakan nama tujuan atau kata kunci yang lebih singkat.
                </p>
              </div>
            ) : null}

            {!loading && recommended.length > 0 ? (
              <div className="grid grid-cols-2 gap-4">
                {recommended.map((x) => (
                  <Link
                    key={x.program.id}
                    href={`/pack/${x.program.slug || x.program.id}`}
                    onClick={onClose}
                    className="group rounded-2xl border border-slate-200 bg-white p-5 transition hover:-translate-y-0.5 hover:border-primary-300 hover:shadow-lg hover:shadow-primary-100"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <p className="line-clamp-2 font-extrabold leading-snug text-slate-900 group-hover:text-primary-700">
                          {x.program.title || x.program.name}
                        </p>
                        <p className="mt-2 text-xs font-medium text-slate-500">
                          {x.program.durationDays
                            ? `${x.program.durationDays} hari`
                            : "Durasi menyesuaikan program"}
                          {x.program.airlineName
                            ? ` · ${x.program.airlineName}`
                            : ""}
                        </p>
                      </div>
                      <span className="shrink-0 text-lg text-primary-500 transition group-hover:translate-x-1">
                        →
                      </span>
                    </div>
                    <p className="mt-4 text-sm font-extrabold text-primary-700">
                      {x.price > 0
                        ? `Mulai Rp ${x.price.toLocaleString("id-ID")}`
                        : "Harga menyusul"}
                    </p>
                  </Link>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      </ModalShell>
    );
  }

  return (
    <ModalShell open={open} onBackdropClick={onClose} zIndexClass="z-[9999]" overlayClassName="bg-black/60" contentWrapperClassName="relative h-full w-full flex items-start pt-[max(1rem,env(safe-area-inset-top))] pointer-events-none">
      <div
        onClick={(e) => e.stopPropagation()}
        className="pointer-events-auto bg-white w-full max-w-mobile mx-auto rounded-b-3xl p-6 animate-fade-up"
      >
        <div className="flex items-center border-b pb-3 gap-3">
          <span className="text-xl">🔎</span>
          <input
            type="text"
            placeholder={t("searchPlaceholder")}
            className="flex-1 border-0 bg-transparent text-sm focus:outline-none py-1"
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <button onClick={onClose} className="text-zinc-400 text-sm">
            ✕
          </button>
        </div>
        <div className="mt-5 text-[11px] text-zinc-400 font-semibold uppercase tracking-wider">
          Rekomendasi Paket
        </div>
        {loading ? <div className="mt-3 text-xs text-zinc-500">Memuat rekomendasi...</div> : null}
        {!loading && recommended.length === 0 ? <div className="mt-3 text-xs text-zinc-500">Belum ada paket cocok.</div> : null}
        {!loading ? recommended.map((x) => (
          <div
            key={x.program.id}
            onClick={() => {
              onClose();
              router.push(`/pack/${x.program.slug || x.program.id}`);
            }}
            className="mt-2 py-3.5 px-4 bg-zinc-50 rounded-2xl text-sm cursor-pointer hover:bg-zinc-100 transition-colors"
          >
            {x.program.title || x.program.name}
            <div className="text-[11px] text-zinc-500 mt-1">{x.price > 0 ? `Mulai Rp ${x.price.toLocaleString("id-ID")}` : "Harga menyusul"}</div>
          </div>
        )) : null}
      </div>
    </ModalShell>
  );
}
