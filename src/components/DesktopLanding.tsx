"use client";

import { useEffect, useState, useMemo } from "react";
import { Link } from "@/i18n/routing-patch";
import Image from "next/image";
import { fetchPublicFeeds, type FeedPostItem } from "@/lib/feeds-api";
import { fetchPrograms, type ProgramItem } from "@/lib/programs";
import { DesktopNavbar } from "@/components/DesktopNavbar";
import { API_BASE_URL } from "@/lib/api-client";
import { fetchPublicCareers } from "@/lib/careers-api";
import { toAbsoluteUrl } from "@/lib/utils";

export default function DesktopLanding() {
  const [packageQuery, setPackageQuery] = useState("");
  const [departureMonth, setDepartureMonth] = useState("");
  const [searchActive, setSearchActive] = useState(false);

  // Scroll reveal animation
  useEffect(() => {
    const reveals = document.querySelectorAll(".reveal");
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) entry.target.classList.add("visible");
        });
      },
      { threshold: 0.08 },
    );
    reveals.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  // Smooth active nav link
  useEffect(() => {
    const handleScroll = () => {
      const sections = document.querySelectorAll(
        "section[id]",
      ) as NodeListOf<HTMLElement>;
      const y = window.scrollY + 100;
      sections.forEach((section) => {
        const navLinks = document.querySelectorAll("nav a.nav-link");
        if (
          y >= section.offsetTop &&
          y < section.offsetTop + section.offsetHeight
        ) {
          navLinks.forEach((link) => {
            const match = link.getAttribute("href") === "#" + section.id;
            link.classList.toggle("text-primary-600", match);
            link.classList.toggle("text-gray-700", !match);
          });
        }
      });
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Fetch real feeds from API
  const [feeds, setFeeds] = useState<FeedPostItem[]>([]);
  const [feedsLoading, setFeedsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await fetchPublicFeeds(1, 6);
        if (!cancelled) setFeeds(data.items ?? []);
      } catch {
        // Silently fail — feeds section just shows skeleton/empty
      } finally {
        if (!cancelled) setFeedsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Fetch real packages from API
  const [programs, setPrograms] = useState<ProgramItem[]>([]);
  const [packagesLoading, setPackagesLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await fetchPrograms();
        if (!cancelled) setPrograms(data ?? []);
      } catch {
        // Silently fail
      } finally {
        if (!cancelled) setPackagesLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Fetch real careers from API for statistics
  const [openPositionsCount, setOpenPositionsCount] = useState(24);
  const [citiesCount, setCitiesCount] = useState(7);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await fetchPublicCareers(1, 100);
        if (!cancelled) {
          setOpenPositionsCount(data.totalCount || 0);
          const locations = (data.items || [])
            .map((item) => item.location?.trim())
            .filter((loc): loc is string => !!loc);
          const uniqueLocations = new Set(locations);
          setCitiesCount(uniqueLocations.size || 7);
        }
      } catch {
        // no-op
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Fetch real company profiles from API for footer
  const [identity, setIdentity] = useState({
    companyName: "Alfian Tour",
    address: "Jl. Raden Dewi Sartika No.54, Bandung, Jawa Barat",
    email: "info@alfiantour.co.id",
    phone: "",
    website: "",
    instagram: "",
    facebook: "",
    tiktok: "",
    youtube: "",
    x: "",
  });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/v1/master/company-profiles?page=1&pageSize=50`);
        if (!res.ok) return;
        const json = await res.json();
        const data = json?.data;
        const rows = Array.isArray(data) ? data : Array.isArray(data?.items) ? data.items : [];
        const sorted = rows
          .filter((x: any) => !x.isDeleted && x.isActive !== false)
          .sort((a: any, b: any) => {
            const aTime = new Date(a.modifiedAt || a.createdAt || 0).getTime();
            const bTime = new Date(b.modifiedAt || b.createdAt || 0).getTime();
            return bTime - aTime;
          });
        const row = sorted[0];
        if (row && !cancelled) {
          setIdentity({
            companyName: String(row.name || row.companyName || "Alfian Tour"),
            address: String(row.address || "Jl. Raden Dewi Sartika No.54, Bandung, Jawa Barat"),
            email: String(row.email || "info@alfiantour.co.id"),
            phone: String(row.phone || row.telephone || ""),
            website: String(row.website || ""),
            instagram: String(row.instagramUrl || row.instagram || ""),
            facebook: String(row.facebookUrl || row.facebook || ""),
            tiktok: String(row.tiktokUrl || row.tikTokUrl || row.tiktok || ""),
            youtube: String(row.youtubeUrl || row.youTubeUrl || row.youtube || ""),
            x: String(row.xUrl || row.twitter || ""),
          });
        }
      } catch {
        // no-op
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Map program API data to card-friendly format
  const programCards = useMemo(() => {
    return programs.slice(0, 4).map((p) => {
      const allDepartures = (p.packages ?? []).flatMap(
        (pk) => pk.departures ?? [],
      );
      // Also check top-level departures (some API versions put them directly on ProgramItem)
      const topLevelDepartures =
        ((p as Record<string, unknown>).departures as Array<
          Record<string, unknown>
        >) ?? [];
      const combined = [
        ...allDepartures.map((d) => ({
          departureDate: String(
            (d as Record<string, unknown>).DepartureDate ??
              d.departureDate ??
              "",
          ),
          seatCapacity: Number(
            (d as Record<string, unknown>).SeatCapacity ?? d.seatCapacity ?? 0,
          ),
          seatAvailable: Number(
            (d as Record<string, unknown>).SeatAvailable ??
              d.seatAvailable ??
              0,
          ),
          airlineName: String(
            (d as Record<string, unknown>).AirlineName ?? d.airlineName ?? "",
          ),
        })),
        ...topLevelDepartures.map((d) => ({
          departureDate: String(d.DepartureDate ?? d.departureDate ?? ""),
          seatCapacity: Number(d.SeatCapacity ?? d.seatCapacity ?? 0),
          seatAvailable: Number(d.SeatAvailable ?? d.seatAvailable ?? 0),
          airlineName: String(d.AirlineName ?? d.airlineName ?? ""),
        })),
      ];
      const firstDeparture = combined
        .filter((d) => d.departureDate)
        .sort(
          (a, b) =>
            new Date(a.departureDate).getTime() -
            new Date(b.departureDate).getTime(),
        )[0];
      const lowestPrice = (p.packages ?? []).reduce((min, pk) => {
        const raw = pk as Record<string, unknown>;
        const priceVal = (raw.PriceQuad ?? raw.priceQuad ?? Infinity) as number;
        return priceVal < min ? priceVal : min;
      }, Infinity);
      return {
        id: p.id,
        slug: p.slug || String(p.id),
        title: p.title || p.name,
        date: firstDeparture
          ? new Date(firstDeparture.departureDate).toLocaleDateString("id-ID", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })
          : formatDateSafe(p.departurePeriodStart),
        airline:
          firstDeparture?.airlineName ||
          p.airlineName ||
          ((p as Record<string, unknown>).AirlineName as string) ||
          "",
        price: Number.isFinite(lowestPrice)
          ? isWholeNumber(lowestPrice)
            ? `${(lowestPrice / 1_000_000).toFixed(0)} Jt`
            : `${(lowestPrice / 1_000_000).toFixed(1).replace(".0", "")} Jt`
          : "",
        days: `${p.durationDays} Hari`,
        image: toAbsoluteUrl(
          p.coverImageUrl ||
          ((p as Record<string, unknown>).CoverImageUrl as string)
        ) || "https://placehold.co/600x400/BE40DD/FFFFFF.png?text=AlfianTour.Com",
        seats: firstDeparture?.seatAvailable ?? 0,
        totalSeats: firstDeparture?.seatCapacity ?? 0,
      };
    });
  }, [programs]);

  const departureMonths = useMemo(() => {
    const values = new Set<string>();
    programs.forEach((program) => {
      if (program.departurePeriodStart) {
        const date = new Date(program.departurePeriodStart);
        if (!Number.isNaN(date.getTime())) {
          values.add(
            `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`,
          );
        }
      }
      (program.packages ?? []).forEach((pkg) => {
        (pkg.departures ?? []).forEach((departure) => {
          const date = new Date(departure.departureDate);
          if (!Number.isNaN(date.getTime())) {
            values.add(
              `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`,
            );
          }
        });
      });
    });
    return Array.from(values)
      .sort()
      .map((value) => {
        const [year, month] = value.split("-").map(Number);
        return {
          value,
          label: new Date(year, month - 1, 1).toLocaleDateString("id-ID", {
            month: "long",
            year: "numeric",
          }),
        };
      });
  }, [programs]);

  const searchResults = useMemo(() => {
    const query = packageQuery.trim().toLowerCase();
    return programs
      .filter((program) => {
        const searchable = [
          program.title,
          program.name,
          program.slug,
          program.airlineName,
          ...(program.packages ?? []).flatMap((pkg) => [
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

        if (query && !searchable.includes(query)) return false;
        if (!departureMonth) return true;

        const dates = [
          program.departurePeriodStart,
          ...(program.packages ?? []).flatMap((pkg) =>
            (pkg.departures ?? []).map((departure) => departure.departureDate),
          ),
        ];
        return dates.some((rawDate) => {
          if (!rawDate) return false;
          const date = new Date(rawDate);
          if (Number.isNaN(date.getTime())) return false;
          return (
            `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}` ===
            departureMonth
          );
        });
      })
      .slice(0, 5);
  }, [departureMonth, packageQuery, programs]);

  return (
    <main className="overflow-x-hidden">
      <style>{`
        html { scroll-behavior: smooth; }
        .reveal { opacity: 0; transform: translateY(32px); transition: opacity 0.7s ease, transform 0.7s ease; }
        .reveal.visible { opacity: 1; transform: translateY(0); }
        .hero-bg {
          background-image: linear-gradient(to bottom, rgba(0,0,0,0.55) 0%, rgba(20,0,60,0.72) 60%, rgba(0,0,0,0.85) 100%),
            url('https://images.unsplash.com/photo-1591604129939-f1efa4d9f7fa?w=1800&auto=format&fit=crop&q=80');
          background-size: cover;
          background-position: center top;
          background-attachment: fixed;
        }
        .glass {
          background: rgba(255,255,255,0.88);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
        }
        .nav-link { position: relative; }
        .nav-link::after {
          content: ''; position: absolute; bottom: -4px; left: 0; width: 0; height: 2px;
          background: linear-gradient(90deg, #7C3AED, #3B82F6);
          transition: width 0.3s ease; border-radius: 2px;
        }
        .nav-link:hover::after { width: 100%; }
        .card-lift {
          transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.3s ease;
        }
        .card-lift:hover {
          transform: translateY(-8px);
          box-shadow: 0 25px 60px rgba(124, 58, 237, 0.18);
        }
        @keyframes pulse-badge { 0%, 100% { opacity: 1; } 50% { opacity: 0.7; } }
        .badge-pulse { animation: pulse-badge 2s ease-in-out infinite; }
        .masonry-grid { columns: 3; column-gap: 1.5rem; }
        .masonry-item { break-inside: avoid; margin-bottom: 1.5rem; }
        @media (max-width: 1280px) { .masonry-grid { columns: 2; } }
        @media (max-width: 768px) { .masonry-grid { columns: 1; } }
      `}</style>

      <DesktopNavbar activeHref="/" />

      {/* ==================== HERO ==================== */}
      <section className="hero-bg min-h-screen flex flex-col items-center justify-center text-center relative pt-16">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/3 right-1/4 w-64 h-64 bg-accent-500/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-5xl mx-auto px-6 lg:px-8 flex flex-col items-center">
          <span className="inline-flex items-center gap-2 bg-white/10 border border-white/20 text-white/90 text-xs font-semibold px-4 py-1.5 rounded-full mb-6 backdrop-blur-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 badge-pulse" />
            ✦ Terdaftar & Diawasi Kemenag RI · PPIU No. 2024-AT-0812
          </span>

          <h1 className="text-5xl lg:text-7xl font-extrabold text-white leading-tight tracking-tight mb-5">
            Perjalanan Nyaman,
            <br />
            <span className="bg-gradient-to-r from-amber-300 to-amber-600 bg-clip-text text-transparent">
              Ibadah Tenang.
            </span>
          </h1>

          <p className="text-lg lg:text-xl text-white/75 font-medium max-w-2xl leading-relaxed mb-12">
            Ekosistem travel umrah terlengkap dengan layanan ekstra ramah lansia
            — dari pendaftaran digital hingga pendampingan di Tanah Suci.
          </p>

          {/* Search Bar */}
          <div className="relative w-full max-w-4xl glass rounded-2xl shadow-2xl shadow-black/30 p-4 border border-white/40">
            <div className="flex flex-col sm:flex-row gap-3 items-stretch">
              <div className="flex-1 flex items-center gap-3 bg-white/80 rounded-xl px-4 py-3 border border-gray-100">
                <svg
                  className="w-5 h-5 text-primary-500 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                <input
                  type="text"
                  placeholder="Destinasi (Makkah / Madinah / Turki...)"
                  className="bg-transparent text-sm font-medium text-gray-800 placeholder-gray-400 outline-none w-full"
                  value={packageQuery}
                  onFocus={() => setSearchActive(true)}
                  onChange={(event) => {
                    setPackageQuery(event.target.value);
                    setSearchActive(true);
                  }}
                />
              </div>
              <div className="flex items-center gap-3 bg-white/80 rounded-xl px-4 py-3 border border-gray-100 min-w-[180px]">
                <svg
                  className="w-5 h-5 text-primary-500 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                <select
                  className="bg-transparent text-sm font-medium text-gray-700 outline-none w-full cursor-pointer"
                  value={departureMonth}
                  onChange={(event) => {
                    setDepartureMonth(event.target.value);
                    setSearchActive(true);
                  }}
                >
                  <option value="">Pilih Bulan</option>
                  {departureMonths.map((month) => (
                    <option key={month.value} value={month.value}>
                      {month.label}
                    </option>
                  ))}
                </select>
              </div>
              <button
                type="button"
                onClick={() => setSearchActive(true)}
                className="flex-shrink-0 bg-primary-600 hover:bg-primary-700 text-white font-bold px-7 py-3 rounded-xl transition-all duration-300 hover:shadow-lg hover:shadow-primary-400/40 hover:scale-105 active:scale-95"
              >
                Cari Paket
              </button>
            </div>
            <div className="flex items-center gap-4 mt-3 px-1">
              <span className="text-xs text-gray-500 font-medium">
                Populer:
              </span>
              <Link
                href="/pack"
                className="text-xs font-semibold text-primary-600 hover:underline"
              >
                Umrah Reguler
              </Link>
              <Link
                href="/pack"
                className="text-xs font-semibold text-primary-600 hover:underline"
              >
                Umrah Plus Turki
              </Link>
              <Link
                href="/pack"
                className="text-xs font-semibold text-primary-600 hover:underline"
              >
                Haji Furoda
              </Link>
            </div>

            {searchActive ? (
              <div className="absolute left-0 right-0 top-[calc(100%+0.75rem)] z-30 overflow-hidden rounded-2xl border border-gray-200 bg-white text-left shadow-2xl">
                <div className="flex items-center justify-between border-b border-gray-100 px-5 py-3">
                  <div>
                    <p className="text-sm font-extrabold text-gray-900">
                      Hasil pencarian
                    </p>
                    <p className="text-xs text-gray-500">
                      {packagesLoading
                        ? "Memuat paket..."
                        : `${searchResults.length} paket ditemukan`}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSearchActive(false)}
                    aria-label="Tutup hasil pencarian"
                    className="flex h-8 w-8 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                  >
                    ×
                  </button>
                </div>

                {!packagesLoading && searchResults.length === 0 ? (
                  <div className="px-5 py-8 text-center">
                    <p className="font-bold text-gray-800">
                      Paket belum ditemukan
                    </p>
                    <p className="mt-1 text-sm text-gray-500">
                      Ubah kata kunci atau pilih bulan keberangkatan lain.
                    </p>
                  </div>
                ) : null}

                {!packagesLoading
                  ? searchResults.map((program) => (
                      <Link
                        key={program.id}
                        href={`/pack/${program.slug || program.id}`}
                        className="group flex items-center justify-between gap-5 border-b border-gray-100 px-5 py-4 last:border-b-0 hover:bg-primary-50"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-extrabold text-gray-900 group-hover:text-primary-700">
                            {program.title || program.name}
                          </p>
                          <p className="mt-1 text-xs text-gray-500">
                            {program.durationDays
                              ? `${program.durationDays} hari`
                              : "Durasi menyesuaikan program"}
                            {program.airlineName
                              ? ` · ${program.airlineName}`
                              : ""}
                          </p>
                        </div>
                        <span className="shrink-0 text-sm font-bold text-primary-600">
                          Lihat paket →
                        </span>
                      </Link>
                    ))
                  : null}

                <Link
                  href="/pack"
                  className="block bg-gray-50 px-5 py-3 text-center text-sm font-bold text-primary-600 hover:bg-primary-50"
                >
                  Buka katalog semua paket
                </Link>
              </div>
            ) : null}
          </div>

          {/* Stats Row */}
          <div className="flex flex-wrap justify-center gap-8 mt-12">
            {[
              ["12.400+", "Jamaah Diberangkatkan"],
              ["98%", "Tingkat Kepuasan"],
              ["850+", "Mitra Agen Aktif"],
              ["14", "Tahun Berpengalaman"],
            ].map(([value, label], i) => (
              <div key={i} className="flex items-center gap-8">
                {i > 0 && (
                  <div className="w-px h-10 bg-white/20 hidden sm:block" />
                )}
                <div className="text-center">
                  <p className="text-3xl font-extrabold text-white">{value}</p>
                  <p className="text-sm text-white/60 font-medium mt-0.5">
                    {label}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Wave */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg
            viewBox="0 0 1440 80"
            preserveAspectRatio="none"
            className="w-full h-16 fill-white"
          >
            <path d="M0,40 C360,80 1080,0 1440,40 L1440,80 L0,80 Z" />
          </svg>
        </div>
      </section>

      {/* ==================== VALUE PROPOSITION ==================== */}
      <section className="py-24 bg-white reveal" id="fasilitas">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="text-xs font-bold tracking-widest text-primary-600 uppercase bg-primary-50 px-4 py-1.5 rounded-full">
              Keunggulan Kami
            </span>
            <h2 className="text-4xl lg:text-5xl font-extrabold text-gray-900 mt-4 tracking-tight">
              Layanan yang Benar-Benar{" "}
              <span className="bg-gradient-to-r from-primary-600 to-accent-500 bg-clip-text text-transparent">
                Berbeda
              </span>
            </h2>
            <p className="text-gray-500 text-lg mt-3 max-w-xl mx-auto">
              Bukan sekadar travel. Kami hadir sebagai mitra ibadah yang
              memahami kebutuhan setiap jamaah.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Card 1 */}
            <div className="card-lift group bg-gradient-to-br from-primary-50 to-white border border-primary-100 rounded-3xl p-8 text-center">
              <div className="w-16 h-16 rounded-2xl bg-primary-100 flex items-center justify-center mx-auto mb-5 group-hover:bg-primary-600 transition-colors duration-300">
                <svg
                  className="w-8 h-8 text-primary-600 group-hover:text-white transition-colors duration-300"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-extrabold text-gray-900 mb-2">
                Ramah Lansia
              </h3>
              <p className="text-gray-500 text-sm leading-relaxed">
                Kursi roda tersedia, pendamping khusus, kamar hotel dekat
                Masjid, dan makanan diet medis. Orang tua Anda aman bersama
                kami.
              </p>
              <div className="mt-5 flex flex-wrap gap-2 justify-center">
                <span className="text-xs font-semibold bg-primary-100 text-primary-700 px-3 py-1 rounded-full">
                  Kursi Roda
                </span>
                <span className="text-xs font-semibold bg-primary-100 text-primary-700 px-3 py-1 rounded-full">
                  Pendamping 24 Jam
                </span>
              </div>
            </div>

            {/* Card 2 — Featured */}
            <div className="card-lift group bg-gradient-to-br from-primary-600 to-primary-800 rounded-3xl p-8 text-center shadow-2xl shadow-primary-200 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-8 translate-x-8" />
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-8 -translate-x-8" />
              <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center mx-auto mb-5">
                <svg
                  className="w-8 h-8 text-white"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-extrabold text-white mb-2">
                Pembimbing Tersertifikasi
              </h3>
              <p className="text-white/75 text-sm leading-relaxed">
                Semua muthowif kami bersertifikat Kemenag, hafiz Quran, dan
                memiliki pengalaman minimal 5 tahun mendampingi ibadah di Makkah
                & Madinah.
              </p>
              <div className="mt-5 flex flex-wrap gap-2 justify-center">
                <span className="text-xs font-semibold bg-white/20 text-white px-3 py-1 rounded-full">
                  Bersertifikat Kemenag
                </span>
                <span className="text-xs font-semibold bg-white/20 text-white px-3 py-1 rounded-full">
                  Hafiz Quran
                </span>
              </div>
            </div>

            {/* Card 3 */}
            <div className="card-lift group bg-gradient-to-br from-accent-50 to-white border border-accent-100 rounded-3xl p-8 text-center">
              <div className="w-16 h-16 rounded-2xl bg-accent-100 flex items-center justify-center mx-auto mb-5 group-hover:bg-accent-500 transition-colors duration-300">
                <svg
                  className="w-8 h-8 text-accent-500 group-hover:text-white transition-colors duration-300"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-extrabold text-gray-900 mb-2">
                Ekosistem Digital Transparan
              </h3>
              <p className="text-gray-500 text-sm leading-relaxed">
                Lacak dokumen, status visa, posisi jamaah, dan laporan keuangan
                proyek secara real-time. Tidak ada yang tersembunyi.
              </p>
              <div className="mt-5 flex flex-wrap gap-2 justify-center">
                <span className="text-xs font-semibold bg-accent-100 text-accent-700 px-3 py-1 rounded-full">
                  Tracking Real-time
                </span>
                <span className="text-xs font-semibold bg-accent-100 text-accent-700 px-3 py-1 rounded-full">
                  Laporan Transparan
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ==================== PAKET KATALOG ==================== */}
      <section id="paket" className="py-24 bg-gray-50 reveal">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-14">
            <div>
              <span className="text-xs font-bold tracking-widest text-primary-600 uppercase bg-primary-50 px-4 py-1.5 rounded-full">
                Keberangkatan Terdekat
              </span>
              <h2 className="text-4xl lg:text-5xl font-extrabold text-gray-900 mt-4 tracking-tight">
                Paket Pilihan{" "}
                <span className="bg-gradient-to-r from-primary-600 to-accent-500 bg-clip-text text-transparent">
                  Terbaik
                </span>
              </h2>
            </div>
            <Link
              href="/pack"
              className="inline-flex items-center gap-2 text-sm font-bold text-primary-600 hover:text-primary-700 transition-colors group whitespace-nowrap"
            >
              Lihat semua paket
              <svg
                className="w-4 h-4 group-hover:translate-x-1 transition-transform"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M17 8l4 4m0 0l-4 4m4-4H3"
                />
              </svg>
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Loading skeletons */}
            {packagesLoading &&
              [...Array(4)].map((_, i) => (
                <PackageCardSkeleton key={`pks-${i}`} />
              ))}

            {/* Real programs from API */}
            {!packagesLoading &&
              programCards.map((pkg, i) => (
                <PackageCard key={pkg.id} pkg={pkg} />
              ))}

            {/* Fallback if no programs */}
            {!packagesLoading && programCards.length === 0 && (
              <p className="col-span-full text-center text-gray-400 text-sm py-8">
                Belum ada paket tersedia saat ini.
              </p>
            )}
          </div>
        </div>
      </section>

      {/* ==================== FEEDS ==================== */}
      <section id="feeds" className="py-24 bg-white reveal">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-14">
            <span className="text-xs font-bold tracking-widest text-primary-600 uppercase bg-primary-50 px-4 py-1.5 rounded-full">
              Komunitas Jamaah
            </span>
            <h2 className="text-4xl lg:text-5xl font-extrabold text-gray-900 mt-4 tracking-tight">
              Kabar & Momen{" "}
              <span className="bg-gradient-to-r from-primary-600 to-accent-500 bg-clip-text text-transparent">
                Jamaah
              </span>
            </h2>
            <p className="text-gray-500 text-lg mt-3 max-w-xl mx-auto">
              Ribuan cerita nyata dari jamaah yang telah merasakan indahnya
              beribadah bersama Alfian Tour.
            </p>
          </div>

          <div className="masonry-grid">
            {/* Loading skeletons */}
            {feedsLoading &&
              [...Array(6)].map((_, i) => <FeedCardSkeleton key={`sk-${i}`} />)}

            {/* Real feeds from API */}
            {!feedsLoading &&
              feeds.slice(0, 5).map((item) => {
                const initials = getInitials(item.authorName);
                const initialsBg = GRADIENTS[item.id % GRADIENTS.length];
                return (
                  <FeedCard
                    key={item.id}
                    initials={initials}
                    initialsBg={initialsBg}
                    name={item.authorName || "Jamaah Alfian Tour"}
                    time={formatRelativeTime(item.publishedAt)}
                    text={
                      item.excerpt ||
                      stripHtml(item.content).slice(0, 180) ||
                      ""
                    }
                    img={item.coverImageUrl ?? undefined}
                    likes={item.likes ?? 0}
                    comments={item.comments ?? 0}
                    slug={item.slug}
                    id={item.id}
                  />
                );
              })}

            {/* Info Card — always shown */}
            <article className="masonry-item card-lift bg-gradient-to-br from-primary-50 to-white border border-primary-100 rounded-3xl p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <svg
                  className="w-5 h-5 text-primary-600"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span className="text-xs font-bold text-primary-600 uppercase tracking-wide">
                  Info Resmi Alfian Tour
                </span>
              </div>
              <p className="text-sm font-semibold text-gray-800 leading-relaxed mb-2">
                📢 Pendaftaran Paket Ramadhan 2026 resmi dibuka hari ini!
                Dapatkan Early Bird discount 15% untuk 50 pendaftar pertama.
              </p>
              <p className="text-xs text-gray-500">
                Konfirmasi pendaftaran melalui WhatsApp atau langsung ke kantor
                kami. Kuota sangat terbatas.
              </p>
              <Link
                href="/pack"
                className="inline-flex items-center gap-1.5 mt-4 text-xs font-bold text-primary-600 bg-primary-100 hover:bg-primary-200 px-4 py-2 rounded-xl transition-colors"
              >
                Daftar Sekarang →
              </Link>
            </article>
          </div>

          <div className="text-center mt-10">
            <Link
              href="/feeds"
              className="inline-flex items-center gap-2 text-sm font-bold text-primary-600 border-2 border-primary-200 px-8 py-3 rounded-full hover:bg-primary-50 transition-all duration-200 hover:border-primary-400"
            >
              Lihat Semua Cerita Jamaah
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
                  d="M17 8l4 4m0 0l-4 4m4-4H3"
                />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* ==================== KEMITRAAN ==================== */}
      <section id="kemitraan" className="py-24 bg-gray-50 reveal">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-14">
            <span className="text-xs font-bold tracking-widest text-primary-600 uppercase bg-primary-50 px-4 py-1.5 rounded-full">
              Ekosistem Bisnis
            </span>
            <h2 className="text-4xl lg:text-5xl font-extrabold text-gray-900 mt-4 tracking-tight">
              Tumbuh Bersama{" "}
              <span className="bg-gradient-to-r from-primary-600 to-accent-500 bg-clip-text text-transparent">
                Alfian Tour
              </span>
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Afiliasi */}
            <div className="card-lift bg-white border border-gray-200 rounded-3xl p-10 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-40 h-40 bg-gray-50 rounded-full translate-x-12 -translate-y-12 pointer-events-none" />
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-600 bg-gray-100 px-3 py-1.5 rounded-full mb-5">
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
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                Program Afiliasi & Agen
              </span>
              <h3 className="text-3xl font-extrabold text-gray-900 leading-tight mb-4">
                Raih Penghasilan Tak Terbatas bersama Kami
              </h3>
              <p className="text-gray-500 leading-relaxed mb-6">
                Bergabunglah dengan 850+ mitra agen aktif kami dan nikmati
                komisi transparan yang dibayar tepat waktu. Tidak perlu modal
                besar — cukup semangat dan jaringan Anda.
              </p>
              <div className="space-y-3 mb-8">
                {[
                  "Komisi hingga 8% per paket",
                  "Dashboard Agen Digital Real-time",
                  "Materi Marketing Lengkap",
                ].map((title, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <svg
                        className="w-3.5 h-3.5 text-emerald-600"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    </div>
                    <p className="text-sm font-bold text-gray-800">{title}</p>
                  </div>
                ))}
              </div>
              <Link
                href="/affiliate"
                className="inline-flex items-center gap-2 font-bold text-white bg-gray-900 hover:bg-gray-700 px-7 py-3.5 rounded-2xl transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5"
              >
                Gabung Mitra Agen
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
                    d="M17 8l4 4m0 0l-4 4m4-4H3"
                  />
                </svg>
              </Link>
            </div>

            {/* Funding */}
            <div className="card-lift bg-gradient-to-br from-primary-600 via-primary-700 to-primary-900 rounded-3xl p-10 relative overflow-hidden text-white">
              <div className="absolute top-0 right-0 w-60 h-60 bg-white/5 rounded-full translate-x-16 -translate-y-16 pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-40 h-40 bg-white/5 rounded-full -translate-x-12 translate-y-12 pointer-events-none" />
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-primary-200 bg-white/15 px-3 py-1.5 rounded-full mb-5">
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
                    d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                  />
                </svg>
                Project Funding & Investasi
              </span>
              <h3 className="text-3xl font-extrabold leading-tight mb-4">
                Investasi Bermakna,{" "}
                <span className="text-amber-300">ROI Nyata</span>
              </h3>
              <p className="text-white/75 leading-relaxed mb-6">
                Jadilah bagian dari ekosistem haji & umrah yang berkembang
                pesat. Dana Anda membantu ribuan jamaah berangkat ke Tanah Suci,
                sekaligus menghasilkan imbal hasil yang kompetitif.
              </p>
              <div className="bg-white/10 rounded-2xl p-5 mb-8 border border-white/10">
                <div className="grid grid-cols-3 gap-4 text-center">
                  {[
                    ["12-15%", "Target ROI / Tahun", "text-amber-300"],
                    ["6 Bln", "Tenor Proyek", "text-white"],
                    ["Rp 5 Jt", "Min. Pendanaan", "text-white"],
                  ].map(([v, l, c], i) => (
                    <div
                      key={i}
                      className={i > 0 ? "border-l border-white/15" : ""}
                    >
                      <p className={`text-2xl font-extrabold ${c}`}>{v}</p>
                      <p className="text-xs text-white/60 mt-1">{l}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="space-y-3 mb-8">
                {[
                  "Diawasi OJK & Kemenag RI",
                  "Laporan keuangan real-time & transparan",
                  "Rekam jejak 14 tahun keberangkatan",
                ].map((text, i) => (
                  <div key={i} className="flex items-center gap-2.5">
                    <div className="w-5 h-5 rounded-full bg-amber-400/20 flex items-center justify-center flex-shrink-0">
                      <svg
                        className="w-3 h-3 text-amber-300"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    </div>
                    <p className="text-sm text-white/80 font-medium">{text}</p>
                  </div>
                ))}
              </div>
              <Link
                href="/funding"
                className="inline-flex items-center gap-2 font-bold text-primary-900 bg-amber-300 hover:bg-amber-400 px-7 py-3.5 rounded-2xl transition-all duration-300 hover:shadow-xl hover:shadow-amber-400/30 hover:-translate-y-0.5"
              >
                Pelajari Pendanaan
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
                    d="M17 8l4 4m0 0l-4 4m4-4H3"
                  />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ==================== KARIR ==================== */}
      <section id="karir" className="reveal">
        <div className="bg-gradient-to-r from-accent-600 via-accent-500 to-primary-600 py-16 relative overflow-hidden">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-0 left-1/4 w-64 h-64 bg-white/5 rounded-full -translate-y-32" />
            <div className="absolute bottom-0 right-1/4 w-48 h-48 bg-white/5 rounded-full translate-y-24" />
          </div>
          <div className="max-w-7xl mx-auto px-6 lg:px-8 flex flex-col lg:flex-row items-center justify-between gap-8 relative z-10">
            <div className="text-center lg:text-left">
              <p className="text-accent-100 text-sm font-bold uppercase tracking-widest mb-2">
                Portal Karir Alfian Tour
              </p>
              <h2 className="text-3xl lg:text-4xl font-extrabold text-white leading-tight">
                Mari Berkembang Bersama Kami.
                <br />
                <span className="text-amber-300">Talenta Anda</span> Adalah Aset
                Kami.
              </h2>
              <p className="text-white/75 mt-3 max-w-lg">
                Kami sedang mencari talenta terbaik di bidang teknologi,
                operasional, pemasaran, dan pembimbingan ibadah.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 items-center flex-shrink-0">
              <div className="text-center">
                <p className="text-3xl font-extrabold text-white">{openPositionsCount}</p>
                <p className="text-white/60 text-xs font-medium">
                  Posisi Terbuka
                </p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-extrabold text-white">{citiesCount}</p>
                <p className="text-white/60 text-xs font-medium">
                  Kota di Indonesia
                </p>
              </div>
              <Link
                href="/karir"
                className="inline-flex items-center gap-2 font-bold text-accent-700 bg-white hover:bg-amber-50 px-8 py-4 rounded-2xl shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-xl whitespace-nowrap"
              >
                Lihat Lowongan
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
                    d="M17 8l4 4m0 0l-4 4m4-4H3"
                  />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ==================== FOOTER ==================== */}
      <footer className="bg-gray-950 text-gray-400 pt-20 pb-8">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
            <div className="col-span-2 lg:col-span-1">
              <Link href="/" className="flex items-center gap-2 mb-4">
                <Image
                  src="/newlogo2.png"
                  alt={identity.companyName}
                  width={150}
                  height={80}
                  className="h-10 w-auto object-contain brightness-0 invert"
                  priority
                />
              </Link>
              <p className="text-sm leading-relaxed text-gray-500 mb-5">
                Ekosistem digital travel umrah & haji terlengkap di Indonesia.
                Melayani dengan hati dan amanah.
              </p>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-5 h-5 rounded bg-emerald-900 flex items-center justify-center flex-shrink-0">
                  <svg
                    className="w-3 h-3 text-emerald-400"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <span className="text-xs text-gray-500">
                  PPIU No. 2024-AT-0812 · Kemenag RI
                </span>
              </div>
            </div>
            <div>
              <h4 className="text-sm font-extrabold text-white uppercase tracking-wider mb-5">
                Perusahaan
              </h4>
              <ul className="space-y-3">
                {[
                  "Tentang Kami",
                  "Karir",
                  "Legalitas & Izin",
                  "Blog & Berita",
                  "Kebijakan Privasi",
                ].map((t, i) => (
                  <li key={i}>
                    <Link
                      href={`/${["about", "karir", "information/legality", "feeds", "information/privacy"][i]}`}
                      className="text-sm hover:text-white hover:translate-x-1 transition-all duration-200 inline-block"
                    >
                      {t}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-extrabold text-white uppercase tracking-wider mb-5">
                Layanan
              </h4>
              <ul className="space-y-3">
                {[
                  "Paket Umrah & Haji",
                  "Semua Layanan",
                  "Marketplace",
                  "Program Afiliasi",
                  "Project Funding Syariah",
                ].map((t, i) => (
                  <li key={i}>
                    <Link
                      href={`/${["pack", "layanan", "toko", "affiliate", "funding"][i]}`}
                      className="text-sm hover:text-white hover:translate-x-1 transition-all duration-200 inline-block"
                    >
                      {t}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-extrabold text-white uppercase tracking-wider mb-5">
                Hubungi Kami
              </h4>
              <p className="text-sm text-gray-500 leading-relaxed whitespace-pre-line">
                {identity.address}
              </p>
              <p className="text-sm text-gray-500 mt-2">
                {identity.email}
              </p>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-center">
            <p className="text-xs text-gray-600">
              © {new Date().getFullYear()} {identity.companyName}. Semua hak dilindungi.
              PPIU No. 2024-AT-0812 · Terdaftar di Kemenag RI.
            </p>
          </div>
        </div>
      </footer>
    </main>
  );
}

/* ==================== PACKAGE CARD ==================== */

function PackageCardSkeleton() {
  return (
    <div className="card-lift bg-white rounded-3xl overflow-hidden border border-gray-100 shadow-sm animate-pulse">
      <div className="h-48 bg-zinc-200" />
      <div className="p-5 space-y-3">
        <div className="h-4 bg-zinc-200 rounded-full w-3/4" />
        <div className="h-3 bg-zinc-100 rounded-full w-1/2" />
        <div className="h-3 bg-zinc-100 rounded-full w-1/3" />
        <div className="flex items-end justify-between pt-2">
          <div className="space-y-1.5">
            <div className="h-2.5 bg-zinc-100 rounded-full w-12" />
            <div className="h-6 bg-zinc-200 rounded-full w-20" />
          </div>
          <div className="h-8 bg-zinc-200 rounded-xl w-24" />
        </div>
      </div>
    </div>
  );
}

function PackageCard({
  pkg,
}: {
  pkg: {
    id: number;
    slug: string;
    title: string;
    date: string;
    airline: string;
    price: string;
    days: string;
    image: string;
    seats: number;
    totalSeats: number;
  };
}) {
  const [imgError, setImgError] = useState(false);
  const isLowStock = pkg.seats > 0 && pkg.seats <= 5;
  const remainingPercent = Math.max(
    0,
    Math.min(100, Math.round((pkg.seats / Math.max(1, pkg.totalSeats)) * 100)),
  );
  const hasPrice = pkg.price && pkg.price !== "0 Jt" && pkg.price !== "0";
  const fallbackImg =
    "https://placehold.co/600x400/BE40DD/FFFFFF.png?text=AlfianTour.Com";

  const badge = isLowStock
    ? { text: `🔥 Sisa ${pkg.seats} Kursi`, color: "bg-rose-600 badge-pulse" }
    : pkg.seats <= 0
      ? { text: "🕐 Menunggu Jadwal", color: "bg-zinc-500" }
      : { text: "✨ Tersedia", color: "bg-emerald-600" };

  return (
    <article className="card-lift bg-white rounded-3xl overflow-hidden border border-gray-100 shadow-sm group">
      <figure className="relative overflow-hidden h-48">
        <img
          src={imgError ? fallbackImg : pkg.image}
          alt={pkg.title}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
          loading="lazy"
          onError={() => setImgError(true)}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
        <span
          className={`absolute top-3 left-3 ${badge.color} text-white text-xs font-extrabold px-3 py-1 rounded-full shadow`}
        >
          {badge.text}
        </span>
        <div className="absolute bottom-3 right-3 bg-black/50 text-white text-xs font-semibold px-2.5 py-1 rounded-full backdrop-blur-sm">
          {pkg.days}
        </div>
      </figure>
      <div className="p-5">
        <h3 className="font-extrabold text-gray-900 text-base leading-snug line-clamp-2">
          {pkg.title}
        </h3>
        <div className="mt-2 flex items-center gap-2 text-xs text-gray-500">
          📅 Berangkat: {pkg.date}
        </div>
        {pkg.airline && (
          <div className="mt-1 flex items-center gap-2 text-xs text-gray-500">
            ✈️ {pkg.airline}
          </div>
        )}
        {pkg.seats > 0 && (
          <>
            <div className="text-[10px] text-emerald-600 mt-1 font-semibold">
              Sisa Seat : {pkg.seats}
            </div>
            <div className="mt-1 h-1.5 w-full rounded-full bg-zinc-200 overflow-hidden">
              <div
                className="h-full rounded-full bg-emerald-500 transition-all"
                style={{ width: `${remainingPercent}%` }}
              />
            </div>
          </>
        )}
        <div className="mt-4 flex items-end justify-between">
          <div>
            {hasPrice && (
              <>
                <p className="text-xs text-gray-400 font-medium">Mulai dari</p>
                <p className="text-2xl font-extrabold bg-gradient-to-r from-primary-600 to-accent-500 bg-clip-text text-transparent">
                  {pkg.price}
                </p>
              </>
            )}
          </div>
          <Link
            href={`/pack/${pkg.slug}`}
            className="text-xs font-bold bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-xl transition-all duration-200 hover:shadow-md active:scale-95"
          >
            Lihat Detail
          </Link>
        </div>
      </div>
    </article>
  );
}

/* ==================== HELPERS ==================== */

const GRADIENTS = [
  "from-primary-400 to-accent-500",
  "from-amber-400 to-orange-500",
  "from-rose-400 to-pink-500",
  "from-cyan-400 to-teal-500",
  "from-violet-400 to-purple-600",
  "from-emerald-400 to-green-500",
  "from-red-400 to-rose-500",
  "from-sky-400 to-blue-500",
];

function getInitials(name?: string | null): string {
  const n = (name || "").trim();
  if (!n) return "AN";
  const parts = n.split(/\s+/);
  if (parts.length === 1) return n.slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function stripHtml(html?: string | null): string {
  if (!html) return "";
  return html
    .replace(/<[^>]*>/g, "")
    .replace(/&[^;]+;/g, " ")
    .trim();
}

function formatRelativeTime(dateStr?: string | null): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (!Number.isFinite(d.getTime())) return "";
  const diffMs = Date.now() - d.getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "Baru saja";
  if (mins < 60) return `${mins} menit lalu`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} jam lalu`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} hari lalu`;
  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `${weeks} minggu lalu`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} bulan lalu`;
  return d.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatDateSafe(dateStr?: string | null): string {
  if (!dateStr) return "";
  // If already human-readable (e.g. "15 Agustus 2025"), return as-is
  if (!/^\d{4}-\d{2}-\d{2}/.test(dateStr.trim())) return dateStr;
  const d = new Date(dateStr);
  if (!Number.isFinite(d.getTime())) return dateStr;
  return d.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function isWholeNumber(n: number): boolean {
  return n % 1_000_000 === 0;
}

function FeedCardSkeleton() {
  return (
    <div className="masonry-item card-lift bg-white border border-gray-100 rounded-3xl p-5 shadow-sm animate-pulse">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-full bg-zinc-200" />
        <div className="space-y-1.5 flex-1">
          <div className="h-3 bg-zinc-200 rounded-full w-24" />
          <div className="h-2.5 bg-zinc-100 rounded-full w-32" />
        </div>
      </div>
      <div className="space-y-2 mb-4">
        <div className="h-3 bg-zinc-100 rounded-full w-full" />
        <div className="h-3 bg-zinc-100 rounded-full w-3/4" />
      </div>
      <div className="w-full h-44 bg-zinc-100 rounded-2xl" />
    </div>
  );
}

/* ==================== FEED CARD SUB-COMPONENT ==================== */
function FeedCard({
  initials,
  initialsBg,
  name,
  time,
  verified,
  tag,
  tagColor,
  text,
  img,
  imgs,
  likes,
  comments,
  slug,
  id,
}: {
  initials: string;
  initialsBg: string;
  name: string;
  time: string;
  verified?: boolean;
  tag?: string;
  tagColor?: string;
  text: string;
  img?: string;
  imgs?: string[];
  likes: number;
  comments: number;
  slug?: string;
  id?: number;
}) {
  const detailHref = slug ? `/feeds/${slug}` : id ? `/feeds/${id}` : "/feeds";

  return (
    <Link
      href={detailHref}
      className="masonry-item card-lift bg-white border border-gray-100 rounded-3xl p-5 shadow-sm block hover:no-underline"
    >
      <header className="flex items-center gap-3 mb-3">
        <div
          className={`w-10 h-10 rounded-full bg-gradient-to-br ${initialsBg} flex items-center justify-center text-white font-bold text-sm flex-shrink-0`}
        >
          {initials}
        </div>
        <div>
          <p className="font-bold text-sm text-gray-900">{name}</p>
          <time className="text-xs text-gray-400">{time}</time>
        </div>
        {verified && (
          <span className="ml-auto text-xs font-semibold bg-emerald-100 text-emerald-700 px-2.5 py-0.5 rounded-full">
            Terverifikasi ✓
          </span>
        )}
        {tag && (
          <span
            className={`ml-auto text-xs font-semibold px-2.5 py-0.5 rounded-full ${tagColor}`}
          >
            {tag}
          </span>
        )}
      </header>
      <p className="text-sm text-gray-600 leading-relaxed mb-4">{text}</p>
      {img && (
        <figure>
          <img
            src={img}
            alt=""
            className="w-full rounded-2xl object-cover h-44"
            loading="lazy"
          />
        </figure>
      )}
      {imgs && (
        <figure className="grid grid-cols-2 gap-2 mb-3">
          {imgs.map((src, i) => (
            <img
              key={i}
              src={src}
              alt=""
              className="w-full rounded-xl object-cover h-28"
              loading="lazy"
            />
          ))}
        </figure>
      )}
      <div className="flex items-center gap-5 mt-4">
        <button className="flex items-center gap-1.5 text-gray-400 hover:text-primary-600 transition-colors">
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
            />
          </svg>
          <span className="text-xs font-semibold">{likes}</span>
        </button>
        <button className="flex items-center gap-1.5 text-gray-400 hover:text-accent-500 transition-colors">
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
            />
          </svg>
          <span className="text-xs font-semibold">{comments}</span>
        </button>
        <button className="flex items-center gap-1.5 text-gray-400 hover:text-emerald-500 transition-colors ml-auto">
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316"
            />
          </svg>
          <span className="text-xs font-semibold">Bagikan</span>
        </button>
      </div>
    </Link>
  );
}
