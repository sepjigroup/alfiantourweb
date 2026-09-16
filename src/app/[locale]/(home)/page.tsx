"use client";

import { useState, useEffect, useMemo } from "react";
import { useRef } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useRouter } from "@/i18n/routing-patch";
import { heroSlides, categories, dummyPacks, galleryImages } from "@/lib/utils";
import { PackCard } from "@/components/PackCard";
import { GalleryModal } from "@/components/GalleryModal";
import { cn } from "@/lib/utils";
import { Flame } from "lucide-react";
import { API_BASE_URL } from "@/lib/api-client";
import { HeroSkeleton, PackCardSkeleton, Skeleton } from "@/components/Skeleton";
import { usePublicCurrency } from "@/lib/public-currency";

const facilitiesByLocale = {
  id: {
    title: "Fasilitas Yang Disediakan",
    items: [
      {
        icon: "🍽️",
        title: "Konsumsi",
        description: "Konsumsi terjamin dari berangkat hingga pulang.",
      },
      {
        icon: "🛂",
        title: "Visa Haji & Umrah",
        description: "Pengurusan visa lengkap untuk keperluan ibadah.",
      },
      {
        icon: "🎒",
        title: "Perlengkapan Umrah",
        description: "Paket lengkap kebutuhan ibadah jamaah.",
      },
      {
        icon: "✈️",
        title: "Tiket Pesawat",
        description: "Tiket PP keberangkatan ke tanah suci.",
      },
      {
        icon: "🧑‍🏫",
        title: "TL / Muthawif",
        description: "Tour leader & muthawif tersertifikasi.",
      },
      {
        icon: "🏨",
        title: "Hotel Penginapan",
        description: "Akomodasi terbaik & ternyaman.",
      },
      {
        icon: "🚌",
        title: "Transportasi",
        description: "Memudahkan perjalanan jamaah.",
      },
      {
        icon: "📸",
        title: "Dokumentasi",
        description: "Dokumentasi profesional selama ibadah.",
      },
      {
        icon: "🛡️",
        title: "Asuransi Perjalanan",
        description: "Perlindungan jamaah selama perjalanan ibadah.",
      },
      {
        icon: "📘",
        title: "Bimbingan Manasik",
        description: "Pembekalan manasik sebelum keberangkatan.",
      },
    ],
  },
  en: {
    title: "Facilities Provided",
    items: [
      {
        icon: "🍽️",
        title: "Meals",
        description: "Guaranteed meals from departure until return.",
      },
      {
        icon: "🛂",
        title: "Hajj & Umrah Visa",
        description: "Complete visa processing for worship needs.",
      },
      {
        icon: "🎒",
        title: "Umrah Equipment",
        description: "Complete package of worship essentials for pilgrims.",
      },
      {
        icon: "✈️",
        title: "Flight Tickets",
        description: "Round-trip flight tickets to the Holy Land.",
      },
      {
        icon: "🧑‍🏫",
        title: "TL / Mutawwif",
        description: "Certified tour leader and mutawwif.",
      },
      {
        icon: "🏨",
        title: "Hotel Accommodation",
        description: "Best and most comfortable accommodation.",
      },
      {
        icon: "🚌",
        title: "Transportation",
        description: "Makes pilgrims' travel easier.",
      },
      {
        icon: "📸",
        title: "Documentation",
        description: "Professional documentation during worship.",
      },
      {
        icon: "🛡️",
        title: "Travel Insurance",
        description: "Pilgrim protection during worship travel.",
      },
      {
        icon: "📘",
        title: "Manasik Guidance",
        description: "Manasik briefing before departure.",
      },
    ],
  },
  ar: {
    title: "المرافق المتوفرة",
    items: [
      {
        icon: "🍽️",
        title: "الوجبات",
        description: "وجبات مضمونة من وقت المغادرة حتى العودة.",
      },
      {
        icon: "🛂",
        title: "تأشيرة الحج والعمرة",
        description: "إجراءات تأشيرة كاملة لمتطلبات العبادة.",
      },
      {
        icon: "🎒",
        title: "مستلزمات العمرة",
        description: "باقة كاملة من احتياجات العبادة للحجاج.",
      },
      {
        icon: "✈️",
        title: "تذاكر الطيران",
        description: "تذاكر ذهاب وعودة إلى الأراضي المقدسة.",
      },
      {
        icon: "🧑‍🏫",
        title: "المرشد / المطوف",
        description: "مرشد سياحي ومطوف معتمد.",
      },
      {
        icon: "🏨",
        title: "الإقامة الفندقية",
        description: "أفضل إقامة وأكثرها راحة.",
      },
      {
        icon: "🚌",
        title: "المواصلات",
        description: "تسهيل تنقل الحجاج.",
      },
      {
        icon: "📸",
        title: "التوثيق",
        description: "توثيق احترافي طوال فترة العبادة.",
      },
      {
        icon: "🛡️",
        title: "تأمين السفر",
        description: "حماية الحجاج أثناء رحلة العبادة.",
      },
      {
        icon: "📘",
        title: "إرشاد المناسك",
        description: "تهيئة المناسك قبل موعد المغادرة.",
      },
    ],
  },
} as const;

const serviceCatalog = [
  { key: "umroh-haji", icon: "🕋", gradient: "from-[#7C3AED] to-[#3B82F6]", slug: "umroh-haji", label: { id: "Umroh & Haji", en: "Umrah & Hajj", ar: "العمرة والحج" } },
  { key: "tour-domestik-internasional", icon: "✈️", gradient: "from-sky-500 to-blue-700", slug: "tour-domestik-internasional", label: { id: "Tour Domestik & Internasional", en: "Domestic & International Tours", ar: "جولات محلية ودولية" } },
  { key: "tiket-pesawat-kereta-kapal", icon: "🎫", gradient: "from-cyan-500 to-teal-600", slug: "tiket-pesawat-kereta-kapal", label: { id: "Tiket Pesawat, Kereta & Kapal", en: "Flight, Train & Ship Tickets", ar: "تذاكر الطيران والقطار والسفن" } },
  { key: "reservasi-hotel-akomodasi", icon: "🏨", gradient: "from-amber-500 to-orange-600", slug: "reservasi-hotel-akomodasi", label: { id: "Reservasi Hotel & Akomodasi", en: "Hotel & Accommodation", ar: "حجز الفنادق والإقامة" } },
  { key: "visa-dokumen-perjalanan", icon: "🛂", gradient: "from-indigo-500 to-violet-700", slug: "visa-dokumen-perjalanan", label: { id: "Visa & Dokumen Perjalanan", en: "Visa & Travel Documents", ar: "التأشيرات ووثائق السفر" } },
  { key: "transportasi-rental-kendaraan", icon: "🚌", gradient: "from-emerald-500 to-green-700", slug: "transportasi-rental-kendaraan", label: { id: "Transportasi & Rental Kendaraan", en: "Transport & Vehicle Rental", ar: "النقل وتأجير المركبات" } },
  { key: "gathering-outbound-corporate-trip", icon: "🏕️", gradient: "from-lime-500 to-emerald-700", slug: "gathering-outbound-corporate-trip", label: { id: "Gathering, Outbound & Corporate Trip", en: "Gathering, Outbound & Corporate Trip", ar: "رحلات الشركات والأنشطة الجماعية" } },
  { key: "study-tour-wisata-edukasi", icon: "🎓", gradient: "from-blue-500 to-indigo-700", slug: "study-tour-wisata-edukasi", label: { id: "Study Tour & Wisata Edukasi", en: "Study Tour & Educational Trip", ar: "رحلات تعليمية" } },
  { key: "wisata-religi-ziarah", icon: "🕌", gradient: "from-rose-500 to-red-700", slug: "wisata-religi-ziarah", label: { id: "Wisata Religi & Ziarah", en: "Religious & Pilgrimage Tour", ar: "السياحة الدينية والزيارة" } },
  { key: "event-perjalanan-mice", icon: "🎤", gradient: "from-fuchsia-500 to-purple-700", slug: "event-perjalanan-mice", label: { id: "Event Perjalanan (MICE)", en: "Travel Events (MICE)", ar: "فعاليات السفر والمؤتمرات" } },
] as const;

const homeCategories = [
  { key: "umrah", icon: "🕋", gradient: "from-violet-600 to-indigo-700", label: { id: "Umrah", en: "Umrah", ar: "عمرة" } },
  { key: "haji", icon: "🕌", gradient: "from-emerald-600 to-green-700", label: { id: "Haji", en: "Hajj", ar: "حج" } },
  { key: "wisata", icon: "✈️", gradient: "from-sky-500 to-blue-700", label: { id: "Wisata", en: "Tour", ar: "سياحة" } },
  { key: "tiket", icon: "🎫", gradient: "from-cyan-500 to-teal-600", label: { id: "Tiket", en: "Ticket", ar: "تذاكر" } },
  { key: "hotel", icon: "🏨", gradient: "from-amber-500 to-orange-600", label: { id: "Hotel", en: "Hotel", ar: "فندق" } },
  { key: "visa", icon: "🛂", gradient: "from-indigo-500 to-violet-700", label: { id: "Visa", en: "Visa", ar: "تأشيرة" } },
  { key: "guide", icon: "🧑‍🏫", gradient: "from-rose-500 to-red-700", label: { id: "Muthawif", en: "Guide", ar: "مرشد" } },
  { key: "transport", icon: "🚌", gradient: "from-lime-500 to-emerald-700", label: { id: "Transport", en: "Transport", ar: "نقل" } },
  { key: "corporate", icon: "💼", gradient: "from-slate-600 to-zinc-700", label: { id: "Corporate", en: "Corporate", ar: "شركات" } },
  { key: "edukasi", icon: "🎓", gradient: "from-blue-500 to-indigo-700", label: { id: "Edukasi", en: "Education", ar: "تعليمي" } },
  { key: "religi", icon: "🕌", gradient: "from-rose-500 to-red-700", label: { id: "Religi", en: "Religious", ar: "ديني" } },
  { key: "mice", icon: "🎤", gradient: "from-fuchsia-500 to-purple-700", label: { id: "MICE", en: "MICE", ar: "فعاليات" } },
];

export default function HomePage() {
  type ServiceItem = { key: string; icon: string; gradient: string };
  type DynamicServiceItem = ServiceItem & { label: string; slug: string };
  type HomePackItem = {
    id: number;
    slug?: string;
    title: string;
    date: string;
    duration: string;
    priceIdr: number;
    price: string;
    seats: number;
    totalSeats?: number;
    image: string;
    badge?: "flash" | "promo" | "hot";
    flashSaleEndsAt?: string;
  };
  type BusinessIdentity = {
    companyName: string;
    address: string;
    website: string;
    instagram: string;
    facebook: string;
    tiktok: string;
    youtube: string;
    threads: string;
    x: string;
    linkedin: string;
    pinterest: string;
  };
  const t = useTranslations("home");
  const locale = useLocale();
  const router = useRouter();
  const { formatPrice } = usePublicCurrency(locale);
  const [slideIndex, setSlideIndex] = useState(0);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [flashIndex, setFlashIndex] = useState(0);
  const [countdown, setCountdown] = useState({ h: "11", m: "59", s: "50" });
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [mouseStartX, setMouseStartX] = useState<number | null>(null);
  const [dynamicSlides, setDynamicSlides] = useState<typeof heroSlides>(heroSlides);
  const [serviceItems, setServiceItems] = useState<DynamicServiceItem[]>(
    serviceCatalog.map((x) => ({ key: x.key, icon: x.icon, gradient: x.gradient, label: x.label[locale as "id" | "en" | "ar"] ?? x.label.id, slug: x.slug })),
  );
  const [flashItems, setFlashItems] = useState<HomePackItem[]>([]);
  const [featuredItems, setFeaturedItems] = useState<HomePackItem[]>([]);
  const [latestItems, setLatestItems] = useState<HomePackItem[]>([]);
  const [loadingState, setLoadingState] = useState({
    hero: true,
    services: true,
    flash: true,
    featured: true,
    latest: true,
    identity: true,
  });
  const [identity, setIdentity] = useState<BusinessIdentity>({
    companyName: "Alfian Tour",
    address: "Jl. Raden Dewi Sartika No.54, Bandung, Jawa Barat",
    website: "",
    instagram: "",
    facebook: "",
    tiktok: "",
    youtube: "",
    threads: "",
    x: "",
    linkedin: "",
    pinterest: "",
  });
  const [queueStatus, setQueueStatus] = useState("Menyiapkan data...");
  const latestScrollRef = useRef<HTMLDivElement | null>(null);
  const HOME_CACHE_KEY = `travelapp_home_cache_${locale}`;
  const HOME_CACHE_TTL_MS = 5 * 60 * 1000;

  useEffect(() => {
    setFlashItems((prev) => prev.map((x) => ({ ...x, price: formatPrice(x.priceIdr) })));
    setFeaturedItems((prev) => prev.map((x) => ({ ...x, price: formatPrice(x.priceIdr) })));
    setLatestItems((prev) => prev.map((x) => ({ ...x, price: formatPrice(x.priceIdr) })));
  }, [formatPrice]);

  const parseItems = (payload: unknown): Record<string, unknown>[] => {
    const root = (payload ?? {}) as Record<string, unknown>;
    const fromRoot = root.items;
    const fromData = (root.data as Record<string, unknown> | undefined)?.items;
    if (Array.isArray(fromRoot)) return fromRoot as Record<string, unknown>[];
    if (Array.isArray(fromData)) return fromData as Record<string, unknown>[];
    return [];
  };

  const toAbsoluteMediaUrl = (raw: unknown, fallback: string): string => {
    const val = String(raw ?? '').trim();
    if (!val) return fallback;
    if (val.startsWith('http://') || val.startsWith('https://')) return val;
    return `${API_BASE_URL}${val.startsWith('/') ? '' : '/'}${val}`;
  };
  const formatShortDate = (raw: unknown): string => {
    const d = new Date(String(raw ?? ""));
    if (Number.isNaN(d.getTime())) return "-";
    const day = String(d.getDate()).padStart(2, "0");
    const month = d.toLocaleDateString(locale, { month: "short" });
    const year = d.getFullYear();
    return `${day} ${month} ${year}`;
  };
  const lowestPackageTypePrice = (program: Record<string, unknown>): number => {
    try {
      const cfg = typeof program.displayConfigJson === "string"
        ? JSON.parse(program.displayConfigJson) as { packageTypePricings?: Array<{ priceIdr?: number }>; priceIdr?: number }
        : {};
      const rows = Array.isArray(cfg.packageTypePricings) ? cfg.packageTypePricings : [];
      const prices = rows.map((x) => Number(x?.priceIdr || 0)).filter((v) => v > 0);
      if (prices.length > 0) return Math.min(...prices);
      return Number(cfg.priceIdr || 0);
    } catch {
      return 0;
    }
  };

  const toPackFromMaster = (items: Record<string, unknown>[], badge: "flash" | "promo" | "hot") =>
    items.slice(0, 8).map((x, i) => ({
      id: Number(x.id ?? i + 1),
      title: String(x.name ?? "Paket"),
      date: formatShortDate(x.createdAt ?? "Update Terbaru"),
      duration: `${Number(x.durationDays ?? 12)} Hari`,
      priceIdr: 0,
      price: formatPrice(0),
      seats: 120,
      totalSeats: 200,
      image: toAbsoluteMediaUrl(x.fileUrl ?? x.thumbnailUrl, `https://picsum.photos/id/${200 + i}/400/300`),
      badge,
    }));

  const toPackFromPrograms = (items: Record<string, unknown>[], badge: "flash" | "promo" | "hot") =>
    items.slice(0, 8).map((x, i) => {
      const programMeta = (() => {
        try {
          return typeof x.metadata === "string"
            ? JSON.parse(x.metadata) as { defaultSeatCapacity?: number; defaultSeatAvailable?: number }
            : {};
        } catch {
          return {};
        }
      })();
      const packages = Array.isArray(x.packages) ? x.packages as Record<string, unknown>[] : [];
      const firstPackage = packages[0] ?? null;
      const departures = Array.isArray(firstPackage?.departures)
        ? (firstPackage.departures as Record<string, unknown>[])
            .slice()
            .sort((a, b) => new Date(String(a.departureDate ?? "")).getTime() - new Date(String(b.departureDate ?? "")).getTime())
        : [];
      const now = Date.now();
      const firstUpcomingDeparture =
        departures.find((d) => new Date(String(d.departureDate ?? "")).getTime() >= now && Number(d.seatAvailable ?? 0) > 0)
        ?? departures.find((d) => new Date(String(d.departureDate ?? "")).getTime() >= now)
        ?? departures[0]
        ?? null;
      const metaSeatCapacity = Math.max(0, Number(programMeta.defaultSeatCapacity ?? 0));
      const metaSeatAvailableRaw = Number(programMeta.defaultSeatAvailable ?? metaSeatCapacity);
      const metaSeatAvailable = Math.max(0, Math.min(metaSeatAvailableRaw, Math.max(0, metaSeatCapacity)));
      const seatAvailableRaw = Number(firstUpcomingDeparture?.seatAvailable ?? metaSeatAvailable);
      const seatCapacityRaw = Number(firstUpcomingDeparture?.seatCapacity ?? metaSeatCapacity);
      const seatCapacity = Math.max(0, seatCapacityRaw);
      const seatAvailable = Math.max(0, Math.min(seatAvailableRaw, seatCapacity > 0 ? seatCapacity : Math.max(0, seatAvailableRaw)));
      const minPriceIdr = Math.max(0, lowestPackageTypePrice(x));
      let flashSaleEndsAt = "";
      try {
        const cfg = typeof x.displayConfigJson === "string" ? JSON.parse(x.displayConfigJson) as { flashSaleEndsAt?: string; flashSaleEnabled?: boolean } : {};
        if (cfg.flashSaleEnabled !== false && typeof cfg.flashSaleEndsAt === "string") {
          flashSaleEndsAt = cfg.flashSaleEndsAt;
        }
      } catch {
        flashSaleEndsAt = "";
      }
      return {
        id: Number(x.id ?? i + 1),
        slug: String(x.slug ?? "").trim() || undefined,
        title: String(x.title ?? x.name ?? "Paket"),
        date: formatShortDate(firstUpcomingDeparture?.departureDate ?? x.departurePeriodStart ?? x.createdAt ?? x.modifiedAt),
        duration: `${Number(x.durationDays ?? 12)} Hari`,
        priceIdr: minPriceIdr,
        price: formatPrice(minPriceIdr),
        seats: seatAvailable,
        totalSeats: seatCapacity > 0 ? seatCapacity : Math.max(seatAvailable, 1),
        image: toAbsoluteMediaUrl(x.coverImageUrl, `https://picsum.photos/id/${300 + i}/400/300`),
        badge,
        flashSaleEndsAt,
      };
    });

  const fetchJsonWithRetry = async (url: string, retries = 1): Promise<unknown> => {
    let lastError: unknown;
    for (let i = 0; i <= retries; i++) {
      try {
        const res = await fetch(url, { cache: "no-store" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return await res.json();
      } catch (err) {
        lastError = err;
        if (i < retries) await new Promise((r) => setTimeout(r, 350 * (i + 1)));
      }
    }
    throw lastError instanceof Error ? lastError : new Error("Fetch gagal");
  };

  useEffect(() => {
    let active = true;
    const hydrateFromCache = () => {
      if (typeof window === "undefined") return false;
      const raw = window.sessionStorage.getItem(HOME_CACHE_KEY);
      if (!raw) return false;
      try {
        const parsed = JSON.parse(raw) as {
          ts: number;
          slides?: typeof heroSlides;
          services?: DynamicServiceItem[];
          featured?: HomePackItem[];
          flash?: HomePackItem[];
          latest?: HomePackItem[];
          identity?: BusinessIdentity;
        };
        if (!parsed.ts || Date.now() - parsed.ts > HOME_CACHE_TTL_MS) return false;
        if (parsed.slides?.length) setDynamicSlides(parsed.slides);
        if (parsed.services?.length) setServiceItems(parsed.services);
        if (Array.isArray(parsed.featured)) setFeaturedItems(parsed.featured);
        if (Array.isArray(parsed.flash)) setFlashItems(parsed.flash);
        if (Array.isArray(parsed.latest)) setLatestItems(parsed.latest);
        if (parsed.identity) setIdentity(parsed.identity);
        setLoadingState({ hero: false, services: false, flash: false, featured: false, latest: false, identity: false });
        setQueueStatus("Memuat pembaruan data...");
        return true;
      } catch {
        return false;
      }
    };

    const runQueue = async () => {
      hydrateFromCache();
      setQueueStatus("Memuat data utama...");
      const [
        heroRes,
        servicesRes,
        promoLabelRes,
        latestRes,
        flashRes,
        companyRes,
      ] = await Promise.allSettled([
        fetchJsonWithRetry(`${API_BASE_URL}/api/v1/content/hero-banners/public?locale=${locale}`),
        fetchJsonWithRetry(`${API_BASE_URL}/api/ServiceMarketplace/public/categories`),
        fetchJsonWithRetry(`${API_BASE_URL}/api/v1/master/PackageLabelTags?page=1&pageSize=50&isPromotional=true&isActive=true`),
        fetchJsonWithRetry(`${API_BASE_URL}/api/v1/master/programs?page=1&pageSize=4&publicMode=true`),
        fetchJsonWithRetry(`${API_BASE_URL}/api/v1/master/programs?page=1&pageSize=50&publicMode=true`),
        fetchJsonWithRetry(`${API_BASE_URL}/api/v1/master/company-profiles?page=1&pageSize=50`),
      ]);

      let nextSlides = dynamicSlides;
      let nextServices = serviceItems;
      let nextFeatured = featuredItems;
      let nextFlash = flashItems;
      let nextLatest = latestItems;
      let nextIdentity = identity;
      let promoLabelId = 0;

      if (heroRes.status === "fulfilled") {
        const heroData = parseItems(heroRes.value);
        if (heroData.length > 0) {
          nextSlides = heroData.map((x) => ({
            title: { id: String(x.name ?? x.Name ?? "Promo"), en: String(x.name ?? x.Name ?? "Promo"), ar: String(x.name ?? x.Name ?? "Promo") },
            subtitle: { id: String(x.description ?? x.Description ?? ""), en: String(x.description ?? x.Description ?? ""), ar: String(x.description ?? x.Description ?? "") },
            gradient: "from-blue-700 via-indigo-700 to-fuchsia-700",
            icon: "🕌",
            imageUrl: toAbsoluteMediaUrl(x.imageUrl ?? x.ImageUrl, ""),
            actionUrl: String(x.actionUrl ?? x.ActionUrl ?? "/pack"),
            actionLabel: String(x.actionLabel ?? x.ActionLabel ?? "View"),
          }));
          if (active) setDynamicSlides(nextSlides);
        }
      }
      if (active) setLoadingState((p) => ({ ...p, hero: false }));

      if (servicesRes.status === "fulfilled") {
        const services = parseItems(servicesRes.value);
        if (services.length > 0) {
          const mapped = services
            .filter((x) => (x.isActive ?? x.IsActive ?? true) !== false)
            .slice(0, 10)
            .map((x, i) => ({
              key: String(x.slug ?? x.Slug ?? x.code ?? x.name ?? `service-${i}`).toLowerCase().replace(/\s+/g, "-"),
              icon: serviceCatalog[i]?.icon ?? categories[i % categories.length]?.icon ?? "🧳",
              gradient: serviceCatalog[i]?.gradient ?? categories[i % categories.length]?.gradient ?? "from-[#7C3AED] to-[#60A5FA]",
              label: String(x.name ?? x.Name ?? "Layanan"),
              slug: String(x.slug ?? x.Slug ?? x.code ?? x.name ?? `service-${i}`).toLowerCase().replace(/\s+/g, "-"),
            }));
          const fallback = serviceCatalog.map((x) => ({ key: x.key, icon: x.icon, gradient: x.gradient, label: x.label[locale as "id" | "en" | "ar"] ?? x.label.id, slug: x.slug }));
          const merged = [
            ...mapped,
            ...fallback.filter((fallbackItem) => !mapped.some((item) => item.slug === fallbackItem.slug || item.label.toLowerCase() === fallbackItem.label.toLowerCase())),
          ].slice(0, 10);
          if (merged.length > 0) {
            nextServices = merged;
            if (active) setServiceItems(merged);
          }
        }
      }
      if (active) setLoadingState((p) => ({ ...p, services: false }));

      if (promoLabelRes.status === "fulfilled") {
        const promoLabels = parseItems(promoLabelRes.value);
        promoLabelId = Number(promoLabels[0]?.id ?? 0);
      }

      if (latestRes.status === "fulfilled") {
        const latest = parseItems(latestRes.value);
        nextLatest = toPackFromPrograms(latest, "hot").slice(0, 4);
        if (active) setLatestItems(nextLatest);
      }
      if (active) setLoadingState((p) => ({ ...p, latest: false }));

      if (flashRes.status === "fulfilled") {
        const rows = parseItems(flashRes.value);
        nextFlash = toPackFromPrograms(rows, "flash").filter((x) => {
          const endAt = x.flashSaleEndsAt ? new Date(x.flashSaleEndsAt).getTime() : 0;
          return Number.isFinite(endAt) && endAt > Date.now();
        });
        if (active) setFlashItems(nextFlash);
      }

      if (companyRes.status === "fulfilled") {
        const rows = parseItems(companyRes.value);
        const sorted = rows
          .filter((x) => {
            const deleted = Boolean(x.isDeleted ?? x.IsDeleted ?? false);
            const isActive = (x.isActive ?? x.IsActive ?? true) as boolean;
            return !deleted && isActive;
          })
          .slice()
          .sort((a, b) => {
            const aTime = new Date(String(a.modifiedAt ?? a.ModifiedAt ?? a.createdAt ?? a.CreatedAt ?? 0)).getTime();
            const bTime = new Date(String(b.modifiedAt ?? b.ModifiedAt ?? b.createdAt ?? b.CreatedAt ?? 0)).getTime();
            return bTime - aTime;
          });
        const row = sorted[0] ?? {};
        if (sorted.length > 0) {
          nextIdentity = {
            companyName: String(row.name ?? row.companyName ?? "Alfian Tour"),
            address: String(row.address ?? "Jl. Raden Dewi Sartika No.54, Bandung, Jawa Barat"),
            website: String(row.website ?? ""),
            instagram: String(row.instagramUrl ?? row.InstagramUrl ?? row.instagram ?? ""),
            facebook: String(row.facebookUrl ?? row.facebook ?? ""),
            tiktok: String(row.tikTokUrl ?? row.tiktokUrl ?? row.TikTokUrl ?? row.tiktok ?? ""),
            youtube: String(row.youTubeUrl ?? row.youtubeUrl ?? row.YouTubeUrl ?? row.youtube ?? ""),
            threads: String(row.threadsUrl ?? row.ThreadsUrl ?? ""),
            x: String(row.xUrl ?? row.XUrl ?? ""),
            linkedin: String(row.linkedInUrl ?? row.LinkedInUrl ?? ""),
            pinterest: String(row.pinterestUrl ?? row.PinterestUrl ?? ""),
          };
          if (active) setIdentity(nextIdentity);
        }
      }
      if (active) setLoadingState((p) => ({ ...p, identity: false }));

      if (promoLabelId > 0) {
        try {
          const featuredJson = await fetchJsonWithRetry(`${API_BASE_URL}/api/v1/master/programs?page=1&pageSize=8&publicMode=true&packageLabelTagId=${promoLabelId}`);
          const featured = parseItems(featuredJson);
          nextFeatured = toPackFromPrograms(featured, "promo");
          if (active) {
            setFeaturedItems(nextFeatured);
          }
        } catch {
          // no-op
        }
      } else if (nextLatest.length > 0) {
        nextFeatured = nextLatest.slice(0, 2).map((x) => ({ ...x, badge: "promo" as const }));
        if (active) setFeaturedItems(nextFeatured);
      }
      if (active) setLoadingState((p) => ({ ...p, featured: false, flash: false }));

      if (typeof window !== "undefined") {
        window.sessionStorage.setItem(
          HOME_CACHE_KEY,
          JSON.stringify({
            ts: Date.now(),
            slides: nextSlides,
            services: nextServices,
            featured: nextFeatured,
            flash: nextFlash,
            latest: nextLatest,
            identity: nextIdentity,
          })
        );
      }

      if (active) setQueueStatus("Semua data siap");
    };
    void runQueue();
    return () => {
      active = false;
    };
  }, [locale]);

  useEffect(() => {
    const interval = setInterval(() => {
      setSlideIndex((prev) => (prev + 1) % dynamicSlides.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [dynamicSlides.length]);

  const flashPacks = useMemo(
    () =>
      flashItems.filter((p) => {
        if (!(p.badge === "flash" || p.badge === "promo")) return false;
        const endAt = p.flashSaleEndsAt ? new Date(p.flashSaleEndsAt).getTime() : 0;
        return Number.isFinite(endAt) && endAt > Date.now();
      }),
    [flashItems]
  );
  useEffect(() => {
    if (flashPacks.length === 0) return;
    const timer = setInterval(() => {
      const active = flashPacks[flashIndex % flashPacks.length];
      const endAt = active?.flashSaleEndsAt ? new Date(active.flashSaleEndsAt).getTime() : 0;
      const diffMs = Math.max(0, endAt - Date.now());
      const h = Math.floor(diffMs / (1000 * 60 * 60));
      const m = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      const s = Math.floor((diffMs % (1000 * 60)) / 1000);
      setCountdown({
        h: String(h).padStart(2, "0"),
        m: String(m).padStart(2, "0"),
        s: String(s).padStart(2, "0"),
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [flashPacks, flashIndex]);

  const keyOf = (x: { id?: number; slug?: string }) => String(x.slug || x.id || "").trim().toLowerCase();
  const flashItemsDedup = useMemo(() => {
    const seen = new Set<string>();
    return flashPacks.filter((x) => {
      const k = keyOf(x);
      if (!k || seen.has(k)) return false;
      seen.add(k);
      return true;
    });
  }, [flashPacks]);
  const featuredItemsDedup = useMemo(() => {
    const seen = new Set<string>(flashItemsDedup.map((x) => keyOf(x)).filter(Boolean));
    return featuredItems.filter((x) => {
      const k = keyOf(x);
      if (!k || seen.has(k)) return false;
      seen.add(k);
      return true;
    });
  }, [featuredItems, flashItemsDedup]);
  const latestItemsDedup = useMemo(() => {
    const seen = new Set<string>([
      ...flashItemsDedup.map((x) => keyOf(x)),
      ...featuredItemsDedup.map((x) => keyOf(x)),
    ].filter(Boolean));
    return latestItems.filter((x) => {
      const k = keyOf(x);
      if (!k || seen.has(k)) return false;
      seen.add(k);
      return true;
    });
  }, [latestItems, flashItemsDedup, featuredItemsDedup]);
  const activeFlash = flashItemsDedup.length > 0 ? flashItemsDedup[flashIndex % flashItemsDedup.length] : undefined;
  const activeFlashTotalSeats = activeFlash ? ((activeFlash as { totalSeats?: number; seats: number }).totalSeats ?? activeFlash.seats) : 0;
  const soldSeats = activeFlash ? Math.max(0, activeFlashTotalSeats - activeFlash.seats) : 0;
  const soldPercent = Math.min(100, Math.round((soldSeats / Math.max(1, activeFlashTotalSeats)) * 100));
  const facilities = facilitiesByLocale[locale as "id" | "en" | "ar"] ?? facilitiesByLocale.id;
  const shouldShowFeaturedSection = loadingState.featured || featuredItemsDedup.length > 0;
  const shouldShowLatestSection = loadingState.latest || latestItemsDedup.length > 0;

  return (
    <div className="p-4 space-y-5 animate-fade-up">
      {/* Hero Carousel */}
      <div className="text-[11px] text-zinc-500 -mt-2">{queueStatus}</div>
      {loadingState.hero ? <HeroSkeleton /> : (
      <div
        className={cn(
          "relative h-48 rounded-3xl overflow-hidden bg-gradient-to-r",
          dynamicSlides[slideIndex].gradient,
        )}
      >
        <div
          className="flex h-full transition-transform duration-700"
          style={{ transform: `translateX(-${slideIndex * 100}%)` }}
        >
          {dynamicSlides.map((slide, i) => (
            <div key={i} className="relative min-w-full h-full text-white">
              {(slide as { imageUrl?: string }).imageUrl ? (
                <div
                  className="absolute inset-0 bg-cover bg-center"
                  style={{ backgroundImage: `url(${(slide as { imageUrl?: string }).imageUrl})` }}
                />
              ) : null}
              <div className="absolute inset-0 bg-black/35" />
              <div className="relative z-10 flex h-full items-end justify-between gap-3 p-4 sm:p-5">
                <div className="max-w-[72%] space-y-2">
                  <div className="rounded-xl bg-black/60 px-3 py-2">
                    <div className="text-lg font-bold leading-tight text-white break-words">
                      {slide.title[locale as "id" | "en" | "ar"]}
                    </div>
                    <div className="text-[11px] mt-1 text-white/95">
                      {slide.subtitle[locale as "id" | "en" | "ar"]}
                    </div>
                  </div>
                  <button
                    onClick={() => router.push((slide as { actionUrl?: string }).actionUrl || "/pack")}
                    className="inline-flex bg-white text-primary-700 px-5 py-2 rounded-full text-[11px] font-extrabold shadow-md hover:shadow-lg transition-all"
                  >
                    {t("heroCta2")}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
          {dynamicSlides.map((_, i) => (
            <button
              key={i}
              onClick={(e) => {
                e.stopPropagation();
                setSlideIndex(i);
              }}
              className={cn(
                "w-2 h-2 rounded-full transition-all",
                i === slideIndex ? "bg-white w-5" : "bg-white/50",
              )}
            />
          ))}
        </div>
      </div>
      )}

      {/* Categories */}
      <div>
        <div className="flex justify-between text-[11px] font-bold mb-3">
          <span>{t("services")}</span>
          <button
            onClick={() => router.push("/layanan")}
            className="text-primary-600"
          >
            {t("seeAll")} →
          </button>
        </div>
        <div className="grid grid-cols-4 sm:grid-cols-6 gap-3 text-center">
          {homeCategories.map((cat) => (
            <button
              key={cat.key}
              onClick={() => router.push(`/layanan?category=${cat.key}`)}
              className="flex flex-col items-center gap-1.5 p-2 rounded-2xl transition hover:bg-zinc-50/50"
            >
              <div
                className={cn(
                  "w-12 h-12 rounded-2xl bg-gradient-to-br flex items-center justify-center text-2xl shadow-sm transition hover:scale-105 duration-300",
                  cat.gradient,
                )}
              >
                {cat.icon}
              </div>
              <span className="text-[10px] font-bold text-zinc-700 leading-tight">
                {cat.label[locale as "id" | "en" | "ar"] ?? cat.label.id}
              </span>
            </button>
          ))}
        </div>
      </div>

      <button
        type="button"
        onClick={() => router.push("/toko")}
        className="w-full rounded-3xl border border-emerald-100 bg-gradient-to-br from-emerald-50 via-white to-amber-50 p-4 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white text-2xl shadow-sm">
            🛒
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-extrabold text-zinc-900">{t("marketplaceTitle")}</div>
            <div className="mt-1 text-[11px] leading-relaxed text-zinc-600">{t("marketplaceDesc")}</div>
          </div>
          <div className="rounded-full bg-emerald-600 px-3 py-1.5 text-[11px] font-bold text-white">
            {t("marketplaceCta")}
          </div>
        </div>
      </button>

      {/* Featured Packages */}
      {shouldShowFeaturedSection ? (
      <div>
        <div className="flex justify-between text-[11px] font-bold mb-3">
          <span>{t("featuredPackages")}</span>
          <button
            onClick={() => router.push("/layanan")}
            className="text-primary-600"
          >
            {t("seeAll")} →
          </button>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {loadingState.featured ? [...Array(2)].map((_, i) => <PackCardSkeleton key={i} />) : featuredItemsDedup.slice(0, 2).map((pack) => (
            <PackCard
              key={pack.id}
              {...pack}
              onDetail={() => router.push(`/pack/${pack.slug || pack.id}`)}
            />
          ))}
        </div>
      </div>
      ) : null}

      {/* Flash Sale */}
      {loadingState.flash ? (
        <Skeleton className="h-56 w-full rounded-3xl" />
      ) : flashItemsDedup.length > 0 && activeFlash ? (
      <div
        onTouchStart={(e) => setTouchStartX(e.touches[0]?.clientX ?? null)}
        onTouchEnd={(e) => {
          if (touchStartX == null) return;
          const endX = e.changedTouches[0]?.clientX ?? touchStartX;
          const diff = endX - touchStartX;
          if (Math.abs(diff) > 40) {
            setFlashIndex((prev) =>
              diff < 0
                ? (prev + 1) % flashItemsDedup.length
                : (prev - 1 + flashItemsDedup.length) % flashItemsDedup.length,
            );
          }
          setTouchStartX(null);
        }}
        onMouseDown={(e) => setMouseStartX(e.clientX)}
        onMouseUp={(e) => {
          if (mouseStartX == null) return;
          const diff = e.clientX - mouseStartX;
          if (Math.abs(diff) > 40) {
            setFlashIndex((prev) =>
              diff < 0
                ? (prev + 1) % flashItemsDedup.length
                : (prev - 1 + flashItemsDedup.length) % flashItemsDedup.length,
            );
          }
          setMouseStartX(null);
        }}
        onMouseLeave={() => setMouseStartX(null)}
        onClick={() => router.push(`/pack/${activeFlash.slug || activeFlash.id}`)}
        className="g-main text-white rounded-3xl p-5 cursor-default select-none hover:opacity-95 transition-opacity space-y-3"
      >
        <div className="flex items-start justify-between">
          <div>
            <div className="uppercase text-[10px] tracking-widest font-bold opacity-90 inline-flex items-center gap-1.5">
              <Flame className="w-3.5 h-3.5" />
              {t("flashSale")}
            </div>
            <div className="text-lg font-bold mt-0.5">{activeFlash.title}</div>
            <div className="text-[10px] opacity-90 mt-0.5">
              {activeFlash.priceIdr > 0 ? `${activeFlash.price} • ` : ''}{activeFlash.duration}
            </div>
          </div>
          <div className="text-4xl">🕌</div>
        </div>
        <div className="rounded-xl bg-white/15 px-3 py-2 text-center">
          <div className="text-[10px] opacity-80">Berakhir dalam</div>
          <div className="text-lg font-extrabold tracking-widest mt-0.5">
            {countdown.h}:{countdown.m}:{countdown.s}
          </div>
        </div>
        <div className="flex items-center justify-between text-[11px]">
          <span>Kursi tersisa: {activeFlash.seats}</span>
          <span>Total kursi: {activeFlashTotalSeats}</span>
        </div>
        <div className="space-y-1">
          <div className="h-2 w-full rounded-full bg-white/25 overflow-hidden">
            <div
              className="h-full bg-white rounded-full transition-all duration-500"
              style={{ width: `${soldPercent}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-[10px] opacity-90">
            <span>Terjual: {soldSeats}</span>
            <span>{soldPercent}%</span>
          </div>
        </div>
        <div className="flex gap-1.5 justify-center">
          {flashItemsDedup.map((_, i) => (
            <span
              key={i}
              className={cn(
                "h-1.5 rounded-full transition-all",
                i === flashIndex ? "w-5 bg-white" : "w-2 bg-white/50",
              )}
            />
          ))}
        </div>
      </div>
      ) : null}

      {/* Latest */}
      {shouldShowLatestSection ? (
      <div>
        <div className="flex justify-between text-[11px] font-bold mb-3">
          <span>{t("latestPackages")}</span>
        </div>
        <div
          ref={latestScrollRef}
          onWheel={(e) => {
            const el = latestScrollRef.current;
            if (!el) return;
            if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return;
            el.scrollLeft += e.deltaY;
          }}
          className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-hide"
        >
          {loadingState.latest ? [...Array(3)].map((_, i) => (
            <div key={i} className="w-40 flex-shrink-0 snap-start"><PackCardSkeleton /></div>
          )) : latestItemsDedup.map((pack) => (
            <div key={pack.id} className="w-64 flex-shrink-0 snap-start">
              <PackCard
                {...pack}
                onDetail={() => router.push(`/pack/${pack.slug || pack.id}`)}
              />
            </div>
          ))}
        </div>
      </div>
      ) : null}

      <GalleryModal
        open={galleryOpen}
        onClose={() => setGalleryOpen(false)}
        images={galleryImages}
      />

      <section className="space-y-3 pb-3">
        <h2 className="text-sm font-bold">{facilities.title}</h2>
        <div className="grid grid-cols-2 gap-2.5">
          {facilities.items.map((item) => (
            <div key={item.title} className="rounded-2xl border bg-white p-3 text-center flex flex-col items-center">
              <div className="text-xl">{item.icon}</div>
              <p className="text-xs font-semibold text-zinc-900 mt-1">{item.title}</p>
              <p className="text-[11px] text-zinc-600 mt-1">{item.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-3 pb-4">
        {loadingState.identity ? (
          <div className="rounded-2xl border bg-white p-3 space-y-2">
            <Skeleton className="h-3 w-40 rounded-full" />
            <Skeleton className="h-3 w-full rounded-full" />
            <div className="grid grid-cols-2 gap-2 pt-1">
              <Skeleton className="h-8 w-full rounded-xl" />
              <Skeleton className="h-8 w-full rounded-xl" />
              <Skeleton className="h-8 w-full rounded-xl" />
              <Skeleton className="h-8 w-full rounded-xl" />
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border bg-white p-3 space-y-3">
            <div>
              <p className="text-xs font-semibold text-zinc-900">{identity.companyName}</p>
              <p className="text-[11px] text-zinc-600 mt-1">{identity.address}</p>
              {identity.website ? (
                <a href={identity.website} target="_blank" rel="noopener noreferrer" className="text-[11px] text-blue-600 mt-1 inline-block">
                  {identity.website}
                </a>
              ) : null}
            </div>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              {identity.instagram ? <a href={identity.instagram} target="_blank" rel="noopener noreferrer" className="rounded-xl border px-3 py-2 text-center font-semibold">Instagram</a> : null}
              {identity.facebook ? <a href={identity.facebook} target="_blank" rel="noopener noreferrer" className="rounded-xl border px-3 py-2 text-center font-semibold">Facebook</a> : null}
              {identity.tiktok ? <a href={identity.tiktok} target="_blank" rel="noopener noreferrer" className="rounded-xl border px-3 py-2 text-center font-semibold">TikTok</a> : null}
              {identity.youtube ? <a href={identity.youtube} target="_blank" rel="noopener noreferrer" className="rounded-xl border px-3 py-2 text-center font-semibold">YouTube</a> : null}
              {identity.threads ? <a href={identity.threads} target="_blank" rel="noopener noreferrer" className="rounded-xl border px-3 py-2 text-center font-semibold">Threads</a> : null}
              {identity.x ? <a href={identity.x} target="_blank" rel="noopener noreferrer" className="rounded-xl border px-3 py-2 text-center font-semibold">X</a> : null}
              {identity.linkedin ? <a href={identity.linkedin} target="_blank" rel="noopener noreferrer" className="rounded-xl border px-3 py-2 text-center font-semibold">LinkedIn</a> : null}
              {identity.pinterest ? <a href={identity.pinterest} target="_blank" rel="noopener noreferrer" className="rounded-xl border px-3 py-2 text-center font-semibold">Pinterest</a> : null}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
