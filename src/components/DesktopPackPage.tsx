"use client";

import { useEffect, useState, useMemo } from "react";
import { useLocale } from "next-intl";
import { Link, useRouter } from "@/i18n/routing-patch";
import { DesktopNavbar } from "@/components/DesktopNavbar";
import { fetchPrograms, type ProgramItem } from "@/lib/programs";
import {
  fetchPackageTypes,
  getPackageTypeSlug,
  type PackageTypeItem,
} from "@/lib/package-types";
import { useDesktopPackData } from "@/lib/desktop-pack-data";
import { usePublicCurrency } from "@/lib/public-currency";
import { PackCard } from "@/components/PackCard";
import { PackCardSkeleton } from "@/components/Skeleton";

export default function DesktopPackPage() {
  const locale = useLocale();
  const router = useRouter();
  const { formatPrice } = usePublicCurrency(locale);
  const [programs, setPrograms] = useState<ProgramItem[]>([]);
  const [packageTypes, setPackageTypes] = useState<PackageTypeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("terbaru");
  const [activeCategory, setActiveCategory] = useState("semua");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [progs, types] = await Promise.all([
          fetchPrograms(),
          fetchPackageTypes(),
        ]);
        if (!cancelled) {
          setPrograms(progs);
          setPackageTypes(types);
        }
      } catch {
        /* silent */
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Same data mapping as mobile /id/pack
  const baseItems = useDesktopPackData(programs, formatPrice, locale);

  // Attach category
  const allItems = useMemo(() => {
    return baseItems.map((item) => {
      const firstPkg = programs.find((p) => p.id === item.id)?.packages?.[0];
      const dep = firstPkg?.departures?.[0];
      const depRaw = dep as Record<string, unknown> | undefined;
      const pkgTypeId = (depRaw?.PackageTypeId ??
        depRaw?.packageTypeId ??
        (firstPkg as Record<string, unknown>)?.PackageTypeId ??
        (firstPkg as Record<string, unknown>)?.packageTypeId) as
        | number
        | undefined;
      const pkgType = pkgTypeId
        ? packageTypes.find((t) => t.id === Number(pkgTypeId))
        : undefined;
      return {
        ...item,
        category: pkgType ? getPackageTypeSlug(pkgType) : "reguler",
      };
    });
  }, [baseItems, programs, packageTypes]);

  // Filter & sort
  const filteredItems = useMemo(() => {
    let result = allItems;
    if (activeCategory !== "semua")
      result = result.filter((c) => c.category === activeCategory);
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((c) => c.title.toLowerCase().includes(q));
    }
    switch (sort) {
      case "termurah":
        return [...result].sort((a, b) => a.priceIdr - b.priceIdr);
      case "termahal":
        return [...result].sort((a, b) => b.priceIdr - a.priceIdr);
      default:
        return [...result].sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
        );
    }
  }, [allItems, activeCategory, search, sort]);

  return (
    <div className="min-h-screen bg-gray-50">
      <style>{STYLES}</style>
      <DesktopNavbar activeHref="/pack" />

      {/* Header */}
      <section className="pt-16 bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-12">
          <nav className="flex items-center gap-2 text-xs font-medium mb-6">
            <Link
              href="/"
              className="text-gray-400 hover:text-primary-600 transition-colors flex items-center gap-1"
            >
              <svg
                className="w-3.5 h-3.5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                />
              </svg>
              Beranda
            </Link>
            <svg
              className="w-3 h-3 text-gray-300"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 5l7 7-7 7"
              />
            </svg>
            <span className="text-primary-600 font-bold">
              Paket Alfian Tour
            </span>
          </nav>
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
            <div>
              <span className="text-xs font-bold tracking-widest text-primary-600 uppercase bg-primary-50 px-4 py-1.5 rounded-full">
                Katalog Lengkap
              </span>
              <h1 className="text-4xl lg:text-5xl font-extrabold text-gray-900 mt-4 tracking-tight">
                <span className="bg-gradient-to-r from-primary-600 to-accent-500 bg-clip-text text-transparent">
                  Temukan Paket Perjalanan
                </span>
              </h1>
              <p className="text-gray-500 text-lg mt-3 max-w-xl">
                Banyak pilihan <strong className="text-gray-700">paket</strong>{" "}
                umrah & haji tersedia.
              </p>
            </div>
            <div className="flex flex-wrap gap-3 lg:flex-col lg:items-end">
              <span className="flex items-center gap-2 bg-emerald-50 border border-emerald-100 px-4 py-2 rounded-xl text-xs font-bold text-emerald-700">
                ✅ Terdaftar Kemenag RI
              </span>
              <span className="flex items-center gap-2 bg-primary-50 border border-primary-100 px-4 py-2 rounded-xl text-xs font-bold text-primary-700">
                ⭐ Rating 4.9/5
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Control Bar */}
      <div className="sticky top-16 z-40 glass-bar border-b border-gray-200/70 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setActiveCategory("semua")}
              className={`text-sm font-bold px-5 py-2 rounded-full border transition-all ${activeCategory === "semua" ? "pill-active border-transparent" : "border-gray-200 bg-white text-gray-600 hover:border-primary-300"}`}
            >
              Semua{" "}
              <span className="ml-1.5 text-xs bg-white/25 px-1.5 py-0.5 rounded-full font-extrabold">
                {filteredItems.length}
              </span>
            </button>
            {packageTypes.slice(0, 5).map((pt) => (
              <button
                key={pt.id}
                onClick={() => setActiveCategory(pt.slug || "")}
                className={`text-sm font-semibold px-5 py-2 rounded-full border transition-all ${activeCategory === pt.slug ? "pill-active border-transparent" : "border-gray-200 bg-white text-gray-600 hover:border-primary-300"}`}
              >
                {pt.name}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <input
                type="search"
                placeholder="Cari nama paket..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-52 bg-white border border-gray-200 text-sm pl-9 pr-4 py-2.5 rounded-xl outline-none focus:border-primary-400"
              />
            </div>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="bg-white border border-gray-200 text-sm font-semibold px-3 py-2.5 rounded-xl outline-none cursor-pointer"
            >
              <option value="terbaru">Terbaru</option>
              <option value="termurah">Termurah</option>
              <option value="termahal">Termahal</option>
            </select>
            <span className="hidden sm:flex items-center gap-1.5 text-xs font-medium text-gray-500 bg-gray-100 px-3 py-2 rounded-xl">
              {filteredItems.length} paket
            </span>
          </div>
        </div>
      </div>

      {/* Grid — using mobile PackCard for consistent rendering */}
      <section className="max-w-7xl mx-auto px-6 lg:px-8 py-12">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <PackCardSkeleton key={i} />
            ))}
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <p className="text-lg font-semibold">Tidak ada paket ditemukan</p>
            <p className="text-sm mt-1">
              Coba ubah filter atau kata kunci pencarian
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredItems.map((item) => (
              <PackCard
                key={item.id}
                id={item.id}
                title={item.title}
                date={item.date}
                duration={item.duration}
                price={item.price}
                priceIdr={item.priceIdr}
                seats={item.seats}
                totalSeats={item.totalSeats}
                image={item.image}
                airline={item.airline}
                showPriceStartLabel
                onDetail={() => router.push(`/pack/${item.slug}`)}
              />
            ))}
          </div>
        )}
      </section>

      {/* Footer */}
      <footer className="bg-gray-950 text-gray-400 pt-20 pb-8">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 text-center">
          <p className="text-sm">
            © {new Date().getFullYear()} Alfian Tour. Semua hak dilindungi.
          </p>
        </div>
      </footer>
    </div>
  );
}

const STYLES = `
.glass-bar { background: rgba(255,255,255,0.92); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); }
.pill-active { background: linear-gradient(135deg, #7C3AED, #3B82F6); color: white; }
`;
