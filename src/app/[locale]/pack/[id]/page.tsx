'use client';

import { useEffect, useState, useMemo } from 'react';
import { useParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import { useTranslations, useLocale } from 'next-intl';
import { Link, useRouter } from '@/i18n/routing-patch';
import { useToast } from '@/components/Toast';
import { Skeleton } from '@/components/Skeleton';
import Image from 'next/image';
import { useLeadsTrack } from '@/hooks/useLeadsTrack';
import { SUPERADMIN_WHATSAPP, buildSuperadminWaUrl } from '@/lib/leads';
import { fetchProgramByCode, fetchPrograms, type ProgramItem } from '@/lib/programs';
import { PackCard } from '@/components/PackCard';
import { API_BASE_URL } from '@/lib/api-client';
import { fetchPackageTypes, getPackageTypeSlug, normalizeServiceSlug } from '@/lib/package-types';
import { ModalShell } from '@/components/ui/ModalShell';
import { usePublicCurrency } from '@/lib/public-currency';
import { addToWishlist, getWishlist, isInWishlist, removeFromWishlist, type WishlistItem } from '@/lib/wishlist';
import { getAuthState } from '@/lib/auth';

const GalleryModal = dynamic(
  () => import('@/components/GalleryModal').then((m) => m.GalleryModal),
  { ssr: false }
);
const PackCatalog = dynamic(
  () => import('@/components/pack/PackCatalog').then((m) => m.PackCatalog),
  { ssr: false }
);

export default function PackDetailPage() {
  type WaTargetResponse = { userName?: string; whatsApp?: string };
  type ItineraryRow = { day: number; title: string; description: string };
  type ProductItem = {
    fileId: string;
    name?: string | null;
    price?: number | null;
    stock?: number | null;
    category?: string | null;
    productType?: string | null;
    marketplace?: string | null;
    mainImageUrl?: string | null;
  };

  const [relatedPrograms, setRelatedPrograms] = useState<ProgramItem[]>([]);
  const [marketplaceProducts, setMarketplaceProducts] = useState<ProductItem[]>([]);
  const [loadingRelated, setLoadingRelated] = useState(true);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [refUsername, setRefUsername] = useState('');

  const getCoverImageUrl = (item: ProgramItem) => {
    if (item.coverImageUrl?.trim()) {
      const url = item.coverImageUrl.trim();
      if (url.startsWith('http://') || url.startsWith('https://')) return url;
      return `${API_BASE_URL}${url.startsWith('/') ? '' : '/'}${url}`;
    }
    try {
      const raw = item.metadata;
      if (!raw) return `https://picsum.photos/seed/program-${item.id}/800/500`;
      const obj = JSON.parse(raw) as {
        images?: Array<{ url?: string; isCover?: boolean; Url?: string; IsCover?: boolean }>;
      };
      const rows = Array.isArray(obj.images) ? obj.images : [];
      const cover = rows.find((x) => x?.isCover || x?.IsCover) ?? rows[0];
      const coverUrl = String(cover?.url ?? cover?.Url ?? '').trim();
      if (!coverUrl) return `https://picsum.photos/seed/program-${item.id}/800/500`;
      if (coverUrl.startsWith('http://') || coverUrl.startsWith('https://')) return coverUrl;
      return `${API_BASE_URL}${coverUrl.startsWith('/') ? '' : '/'}${coverUrl}`;
    } catch {
      return `https://picsum.photos/seed/program-${item.id}/800/500`;
    }
  };

  const getProductImageUrl = (url?: string | null) => {
    const v = String(url || '').trim();
    if (!v) return 'https://placehold.co/600x400/BE40DD/FFFFFF.png?text=AlfianTour.Com';
    if (v.startsWith('http://') || v.startsWith('https://')) return v;
    return `${API_BASE_URL}${v.startsWith('/') ? '' : '/'}${v}`;
  };

  type DisplayConfig = {
    packageTypeId?: number;
    priceIdr?: number;
    packageTypePricings?: Array<{ id?: string; packageTypeId: number; priceIdr: number; packageTypeName?: string; name?: string; packageType?: string; isAllInDefault?: boolean }>;
    seoTitle?: string;
    seoDescription?: string;
    departureDate?: string;
    returnDate?: string;
    airlineId?: number;
    departureAirportId?: number;
    airportIds?: number[];
    itineraries?: ItineraryRow[];
    itineraryByDeparture?: Array<{
      departureDate: string;
      returnDate?: string;
      items: ItineraryRow[];
    }>;
    flightInfos?: Array<{ day: number; route: string; airlineId?: number; note?: string }>;
    departureAirlineMappings?: Array<{ departureDate: string; airlineIds: number[] }>;
    departureHotelMappings?: Array<{
      departureDate: string;
      hotelIds: number[];
      hotelStays: Array<{ hotelId: number; nights: number }>;
      hotelOccupancyPrices: Array<{ hotelId: number; priceQuad?: number; priceTripleAdditional?: number; priceDoubleAdditional?: number }>;
    }>;
    termsTemplateId?: number;
    termsTemplateIds?: number[];
    excludePricings?: Array<{ id: string; name: string; price: number }>;
    insuranceOptions?: Array<{ insuranceTypeId: number; name: string; pricePerPax: number; claimWebsite?: string }>;
    insuranceMode?: 'required' | 'optional';
    discountLabel?: string;
    discountType?: 'fixed' | 'percent';
    discountValue?: number;
    includePricings?: Array<{ id: string; name: string; price: number }>;
    voucherRules?: Array<{ id: string; code: string; type: 'fixed' | 'percent'; value: number; isActive: boolean; startAt?: string; endAt?: string; minOrder?: number; maxUsage?: number }>;
    jamaahDataMode?: 'required_full' | 'optional_after_checkout' | 'pic_only' | 'required_minimal';
    facilities?: Array<{ facilityMasterId: number; name: string; icon?: string }>;
    flashSaleEnabled?: boolean;
    flashSaleEndsAt?: string;
  };
  const params = useParams();
  const t = useTranslations('pack');
  const tc = useTranslations('common');
  const locale = useLocale();
  const router = useRouter();
  const { show } = useToast();
  const { formatPrice } = usePublicCurrency(locale);
  const lang = String(locale || 'id').toLowerCase();
  const isEn = lang.startsWith('en');
  const isAr = lang.startsWith('ar');
  const i18nText = {
    pickDeparture: isEn ? 'Choose Departure' : isAr ? 'اختر موعد المغادرة' : 'Pilih Keberangkatan',
    seatsAvailable: isEn ? 'Seats available' : isAr ? 'المقاعد المتاحة' : 'Kursi tersedia',
    notIncluded: isEn ? 'Not Included' : isAr ? 'غير مشمول' : 'Tidak Termasuk',
    flightInfo: isEn ? 'Flight Information' : isAr ? 'معلومات الرحلة' : 'Informasi Pesawat',
    orderForm: isEn ? 'Package Order Form' : isAr ? 'نموذج حجز الباقة' : 'Form Pemesanan Paket',
    paxCount: isEn ? 'Number of Travelers' : isAr ? 'عدد المسافرين' : 'Jumlah Orang Berangkat',
    maxSeat: isEn ? 'Maximum by available seats' : isAr ? 'الحد الأقصى حسب المقاعد المتاحة' : 'Maksimal sesuai sisa seat',
    pickInsurance: isEn ? 'Choose Insurance' : isAr ? 'اختر التأمين' : 'Pilih Asuransi',
    terms: isEn ? 'Terms & Conditions' : isAr ? 'الشروط والأحكام' : 'Syarat & Ketentuan',
    agreeTerms: isEn ? 'I agree to Terms & Conditions' : isAr ? 'أوافق على الشروط والأحكام' : 'Saya setuju Syarat & Ketentuan',
    previewOrder: isEn ? 'Order Preview' : isAr ? 'معاينة الطلب' : 'Preview Pemesanan',
  };
  const { trackEvent } = useLeadsTrack();
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [wishlisted, setWishlisted] = useState(false);
  const [orderOpen, setOrderOpen] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [orderTermsOpen, setOrderTermsOpen] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [program, setProgram] = useState<ProgramItem | null>(null);
  const [programResolved, setProgramResolved] = useState(false);
  const [serviceMode, setServiceMode] = useState(false);
  const [packageTypeMasters, setPackageTypeMasters] = useState<Array<{ id: number; name: string }>>([]);
  const [roomTypeMasters, setRoomTypeMasters] = useState<Array<{ id: number; name: string; code?: string; baseCapacity?: number }>>([]);
  const [redirectingInvalid, setRedirectingInvalid] = useState(false);
  const [airportNameMap, setAirportNameMap] = useState<Record<number, string>>({});
  const [hotelNameMap, setHotelNameMap] = useState<Record<number, string>>({});
  const [airlineNameMap, setAirlineNameMap] = useState<Record<number, string>>({});
  const [insuranceMasterOptions, setInsuranceMasterOptions] = useState<Array<{ insuranceTypeId: number; name: string; providerName?: string; pricePerPax: number; claimWebsite?: string }>>([]);
  const [insuranceInfoMap, setInsuranceInfoMap] = useState<Record<number, { name?: string; coverageDetails?: string; coverageAmount?: number; coverageDays?: number; providerName?: string; basePremium?: number; claimWebsite?: string }>>({});
  const [programImageUrls, setProgramImageUrls] = useState<string[]>([]);
  const [flightInfoOpen, setFlightInfoOpen] = useState(false);
  const [itineraryOpen, setItineraryOpen] = useState(true);
  const [selectedDepartureId, setSelectedDepartureId] = useState<number | null>(null);
  const [termsContent, setTermsContent] = useState('');
  const [voucherOpen, setVoucherOpen] = useState(false);
  const [appliedVoucherCode, setAppliedVoucherCode] = useState('');
  const [voucherNotice, setVoucherNotice] = useState('');
  const [waActionLoading, setWaActionLoading] = useState(false);
  const [wishlistCount, setWishlistCount] = useState(0);
  const [itineraryLoading, setItineraryLoading] = useState(true);
  const [orderForm, setOrderForm] = useState({
    offerMode: 'all_in',
    selectedPackageTypeId: 0,
    departureDate: '',
    programDays: '9 Hari',
    departureAirport: 'CGK - Soekarno Hatta',
    makkahHotel: '',
    madinahHotel: '',
    airline: 'Garuda Indonesia',
    roomType: 'Quad',
    roomCount: 1,
    paxCount: 1,
    insurance: 'Asuransi Umrah Basic',
    includeType: 'All-In Package',
    excludeType: 'Exclude Pengeluaran Pribadi',
    notes: '',
    selectedExcludeIds: [] as string[],
    selectedIncludeIds: [] as string[],
    selectedHotelIds: [] as number[],
    selectedInsuranceTypeId: 0,
    insurancePaxCount: 1,
    voucherCode: '',
    customIncludeName: '',
    customIncludePrice: 0,
    customExcludeName: '',
    customExcludePrice: 0,
    jamaahs: [{ fullName: '', gender: '', passportNo: '', birthDate: '', phone: '', email: '' }],
  });

  const rawParamId = Array.isArray((params as any).id) ? (params as any).id.join('/') : String((params as any).id ?? '');
  const rawCode = decodeURIComponent(rawParamId || '').trim();
  const atIndex = rawCode.lastIndexOf('@');
  const refPart = atIndex > 0 ? rawCode.slice(atIndex + 1).trim() : '';
  const cleanCode = atIndex > 0 ? rawCode.slice(0, atIndex).trim() : rawCode;
  const fallbackPack = { id: 0, title: 'Program Umrah', date: '-', duration: '0 Hari', seats: 0, image: '/newlogo2.png' };
  const metadataImages = useMemo(() => {
    try {
      const md = program?.metadata ? JSON.parse(program.metadata) as { images?: Array<{ Url?: string; url?: string; IsCover?: boolean; isCover?: boolean }> } : {};
      return Array.isArray(md.images) ? md.images : [];
    } catch {
      return [] as Array<{ Url?: string; url?: string; IsCover?: boolean; isCover?: boolean }>;
    }
  }, [program?.metadata]);
  const heroImage = useMemo(() => {
    if (!program) return fallbackPack.image;
    if (program.coverImageUrl) return `${API_BASE_URL}${program.coverImageUrl.startsWith('/') ? '' : '/'}${program.coverImageUrl}`;
    const cover = metadataImages.find((x) => x.IsCover || x.isCover) ?? metadataImages[0];
    const url = String(cover?.Url ?? cover?.url ?? '').trim();
    if (!url) return fallbackPack.image;
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    return `${API_BASE_URL}${url.startsWith('/') ? '' : '/'}${url}`;
  }, [program, metadataImages]);

  const [heroImageSrc, setHeroImageSrc] = useState(heroImage);
  useEffect(() => {
    setHeroImageSrc(heroImage);
  }, [heroImage]);
  const shareUrl = useMemo(() => {
    const basePath = `/${locale}/pack/${program?.slug || cleanCode}`;
    let suffix = '';
    const authUserName = getAuthState()?.user?.userName;
    const userName = String(authUserName || '').trim();
    if (userName) suffix = `@${userName}`;
    const finalPath = `${basePath}${suffix}`;
    if (typeof window === 'undefined') return finalPath;
    return `${window.location.origin}${finalPath}`;
  }, [locale, program?.slug, cleanCode]);
  const shareText = useMemo(() => {
    const title = String(program?.title || program?.name || fallbackPack.title || 'Paket Umrah/Haji').trim();
    const packageRows = Array.isArray(program?.packages) ? program.packages : [];
    const minPrice = packageRows
      .map((x) => Number(x?.priceQuad || 0))
      .filter((x) => x > 0)
      .sort((a, b) => a - b)[0] ?? 0;
    const price = minPrice > 0 ? `Mulai Rp ${Number(minPrice).toLocaleString('id-ID')}` : '';
    return price ? `${title} - ${price}` : title;
  }, [program?.title, program?.name, program?.packages]);
  const allImages = useMemo(() => {
    const urls: string[] = [];
    if (heroImage) urls.push(heroImage);
    programImageUrls.forEach((x) => {
      const u = String(x || '').trim();
      if (u) urls.push(u);
    });
    metadataImages.forEach((row) => {
      const raw = String(row?.Url ?? row?.url ?? '').trim();
      if (!raw) return;
      const abs = raw.startsWith('http://') || raw.startsWith('https://')
        ? raw
        : `${API_BASE_URL}${raw.startsWith('/') ? '' : '/'}${raw}`;
      urls.push(abs);
    });
    const uniq = Array.from(new Set(urls.filter(Boolean)));
    return uniq.length > 0 ? uniq : [heroImage];
  }, [heroImage, metadataImages, programImageUrls]);
  const displayConfig: DisplayConfig = useMemo(() => {
    try {
      return program?.displayConfigJson ? (JSON.parse(program.displayConfigJson) as DisplayConfig) : {};
    } catch {
      return {};
    }
  }, [program?.displayConfigJson]);
  const [flashNowMs, setFlashNowMs] = useState(() => Date.now());
  const flashSaleEndMs = useMemo(() => {
    const raw = String(displayConfig?.flashSaleEndsAt || '').trim();
    if (!raw || displayConfig?.flashSaleEnabled === false) return 0;
    const t = new Date(raw).getTime();
    return Number.isFinite(t) ? t : 0;
  }, [displayConfig?.flashSaleEndsAt, displayConfig?.flashSaleEnabled]);
  const isFlashSaleActive = flashSaleEndMs > flashNowMs;
  const flashSaleCountdown = useMemo(() => {
    if (!isFlashSaleActive) return '';
    const diff = Math.max(0, flashSaleEndMs - flashNowMs);
    const totalSec = Math.floor(diff / 1000);
    const days = Math.floor(totalSec / 86400);
    const hours = Math.floor((totalSec % 86400) / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    const secs = totalSec % 60;
    const hh = String(hours).padStart(2, '0');
    const mm = String(mins).padStart(2, '0');
    const ss = String(secs).padStart(2, '0');
    return days > 0 ? `${days}d ${hh}:${mm}:${ss}` : `${hh}:${mm}:${ss}`;
  }, [isFlashSaleActive, flashSaleEndMs, flashNowMs]);

  useEffect(() => {
    trackEvent('page_view');
  }, [trackEvent]);

  useEffect(() => {
    if (!isFlashSaleActive) return;
    const id = window.setInterval(() => setFlashNowMs(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [isFlashSaleActive]);

  useEffect(() => {
    const refUser = String(refPart || '').trim().replace(/^@/, '');
    if (!refUser || typeof document === 'undefined') return;
    const maxAge = 60 * 60 * 24 * 15;
    document.cookie = `ref_agent=${encodeURIComponent(refUser)}; Max-Age=${maxAge}; Path=/; SameSite=Lax`;
  }, [refPart]);

  useEffect(() => {
    const userName = String(getAuthState()?.user?.userName || '').trim();
    const cookieRef = String(getCookie('ref_agent') || '').trim();
    setRefUsername((userName || cookieRef).replace(/^@/, ''));
  }, []);

  useEffect(() => {
    let mounted = true;
    setLoadingRelated(true);
    fetchPrograms()
      .then((list) => {
        if (!mounted) return;
        const currentId = Number(program?.id || 0);
        let filtered = list.filter((p) => Number(p.id) !== currentId);
        const currentTitleLower = String(program?.title || program?.name || '').toLowerCase();
        const isUmrah = currentTitleLower.includes('umrah') || currentTitleLower.includes('umroh');
        const isHaji = currentTitleLower.includes('haji');
        if (isUmrah || isHaji) {
          const categoryFiltered = filtered.filter((p) => {
            const titleLower = String(p.title || p.name || '').toLowerCase();
            if (isUmrah) return titleLower.includes('umrah') || titleLower.includes('umroh');
            if (isHaji) return titleLower.includes('haji');
            return false;
          });
          if (categoryFiltered.length > 0) {
            filtered = categoryFiltered;
          }
        }
        setRelatedPrograms(filtered.slice(0, 4));
        setLoadingRelated(false);
      })
      .catch(() => {
        if (mounted) setLoadingRelated(false);
      });
    return () => { mounted = false; };
  }, [program?.id]);

  useEffect(() => {
    let mounted = true;
    setLoadingProducts(true);
    fetch(`${API_BASE_URL}/api/Products?page=1&pageSize=6`, { cache: 'no-store' })
      .then((res) => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then((json: any) => {
        if (!mounted) return;
        const list = (json?.data?.items || json?.items || []) as ProductItem[];
        setMarketplaceProducts(list);
        setLoadingProducts(false);
      })
      .catch(() => {
        if (mounted) setLoadingProducts(false);
      });
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    let mounted = true;
    const programId = Number(program?.id || 0);
    if (programId <= 0) {
      setProgramImageUrls([]);
      return () => {
        mounted = false;
      };
    }

    const toAbsoluteUrl = (raw: string) => {
      const v = String(raw || '').trim();
      if (!v) return '';
      if (v.startsWith('http://') || v.startsWith('https://')) return v;
      return `${API_BASE_URL}${v.startsWith('/') ? '' : '/'}${v}`;
    };

    (async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/v1/master/programs/${programId}/images`, { cache: 'no-store' });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        const rows = Array.isArray((json as any)?.items)
          ? (json as any).items
          : Array.isArray((json as any)?.data?.items)
            ? (json as any).data.items
            : Array.isArray(json)
              ? json
              : [];
        const urls = rows
          .map((x: any) => toAbsoluteUrl(String(x?.url ?? x?.Url ?? x?.fileUrl ?? x?.FileUrl ?? x?.imageUrl ?? x?.ImageUrl ?? '')))
          .filter(Boolean);
        if (mounted) setProgramImageUrls(Array.from(new Set(urls)));
      } catch {
        if (mounted) setProgramImageUrls([]);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [program?.id]);

  // Defensive fix: restore page scroll if any stale modal body-lock remains.
  useEffect(() => {
    if (orderOpen || galleryOpen) return;
    if (typeof document === 'undefined') return;
    const body = document.body;
    body.style.overflow = '';
    body.removeAttribute('data-modal-open-count');
  }, [orderOpen, galleryOpen]);

  useEffect(() => {
    const id = String(program?.slug || cleanCode || '');
    if (!id) return;
    setWishlisted(isInWishlist(id));
    setWishlistCount(getWishlist().length);
  }, [program?.slug, cleanCode]);

  useEffect(() => {
    const onStorage = () => setWishlistCount(getWishlist().length);
    if (typeof window !== 'undefined') window.addEventListener('storage', onStorage);
    return () => {
      if (typeof window !== 'undefined') window.removeEventListener('storage', onStorage);
    };
  }, []);

  useEffect(() => {
    let mounted = true;
    setProgramResolved(false);
    Promise.all([fetchProgramByCode(cleanCode), fetchPackageTypes()]).then(([item, services]) => {
      if (!mounted) return;
      setProgram(item);
      setPackageTypeMasters((services ?? []).map((s: any) => ({ id: Number(s.id || 0), name: String(s.name || '') })).filter((x) => x.id > 0));
      if (!item) {
        const normalized = normalizeServiceSlug(cleanCode);
        const serviceSlugs = services.map((x) => getPackageTypeSlug(x));
        setServiceMode(serviceSlugs.includes(normalized));
      } else {
        setServiceMode(false);
      }
      setProgramResolved(true);
    });
    return () => {
      mounted = false;
    };
  }, [cleanCode]);

  useEffect(() => {
    const slug = String(program?.slug || '').trim();
    if (!slug) return;
    if (slug.toLowerCase() === String(cleanCode || '').trim().toLowerCase()) return;
    const suffix = refPart ? `@${refPart}` : '';
    router.replace(`/pack/${slug}${suffix}`);
  }, [program?.slug, cleanCode, refPart, router]);

  useEffect(() => {
    if (!programResolved) return;
    if (program || serviceMode) return;
    setRedirectingInvalid(true);
    router.replace('/pack');
  }, [programResolved, program, serviceMode, router]);

  useEffect(() => {
    let mounted = true;
    const CACHE_KEY = 'pack_detail_master_v1';
    const CACHE_TTL_MS = 1000 * 60 * 30; // 30 menit
    const toRows = (json: any) => (json?.items ?? json?.data?.items ?? []) as any[];
    const fetchJson = async (path: string) => {
      const res = await fetch(`${API_BASE_URL}${path}`, { cache: 'no-store' });
      return res.ok ? res.json() : null;
    };

    const applyMasterData = (payload: any) => {
      if (!mounted || !payload) return;
      setAirportNameMap(payload.airportMap ?? {});
      setHotelNameMap(payload.hotelMap ?? {});
      setAirlineNameMap(payload.airlineMap ?? {});
      setInsuranceMasterOptions(Array.isArray(payload.insuranceOptions) ? payload.insuranceOptions : []);
      setInsuranceInfoMap(payload.insuranceMap ?? {});
      if (Array.isArray(payload.pkgTypes) && payload.pkgTypes.length > 0) setPackageTypeMasters(payload.pkgTypes);
      if (Array.isArray(payload.roomTypes)) setRoomTypeMasters(payload.roomTypes);
    };

    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem(CACHE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as { at?: number; data?: any };
          if (Number(parsed?.at || 0) > 0 && Date.now() - Number(parsed.at) < CACHE_TTL_MS) {
            applyMasterData(parsed?.data);
          }
        }
      } catch {
        // ignore cache parse issues
      }
    }

    const loadCritical = async () => {
      const [airportJson, hotelJson, airlineJson] = await Promise.all([
        fetchJson('/api/v1/master/airports?page=1&pageSize=300'),
        fetchJson('/api/v1/master/hotels?page=1&pageSize=300'),
        fetchJson('/api/v1/master/airlines?page=1&pageSize=300'),
      ]);
      if (!mounted) return { airportMap: {}, hotelMap: {}, airlineMap: {} };
      const airportMap: Record<number, string> = {};
      toRows(airportJson).forEach((x: any) => { airportMap[Number(x.id)] = String(x.name || ''); });
      setAirportNameMap(airportMap);
      const hotelMap: Record<number, string> = {};
      toRows(hotelJson).forEach((x: any) => { hotelMap[Number(x.id)] = String(x.name || ''); });
      setHotelNameMap(hotelMap);
      const airlineMap: Record<number, string> = {};
      toRows(airlineJson).forEach((x: any) => { airlineMap[Number(x.id)] = String(x.name || ''); });
      setAirlineNameMap(airlineMap);
      return { airportMap, hotelMap, airlineMap };
    };

    const loadNonCritical = async () => {
      const [insuranceJson, packageTypeJson, roomTypeJson] = await Promise.all([
        fetchJson('/api/v1/master/InsuranceTypes?page=1&pageSize=300'),
        fetchJson('/api/v1/master/PackageTypes?page=1&pageSize=300'),
        fetchJson('/api/v1/master/RoomTypeMasters?page=1&pageSize=300'),
      ]);
      if (!mounted) return { insuranceOptions: [], insuranceMap: {}, pkgTypes: [], roomTypes: [] };

      const insuranceRows = toRows(insuranceJson);
      const insuranceMap: Record<number, { name?: string; coverageDetails?: string; coverageAmount?: number; coverageDays?: number; providerName?: string; basePremium?: number; claimWebsite?: string }> = {};
      const insuranceOptions: Array<{ insuranceTypeId: number; name: string; providerName?: string; pricePerPax: number; claimWebsite?: string }> = [];
      insuranceRows.forEach((x: any) => {
        const id = Number(x.id || 0);
        if (!id) return;
        const active = x.isActive !== false;
        if (active) {
          insuranceOptions.push({
            insuranceTypeId: id,
            name: String(x.name ?? '').trim() || `Asuransi #${id}`,
            providerName: String(x.providerName ?? '').trim(),
            pricePerPax: Number(x.basePremium ?? 0),
            claimWebsite: String(x.claimWebsite ?? '').trim(),
          });
        }
        insuranceMap[id] = {
          name: String(x.name ?? '').trim(),
          coverageDetails: String(x.coverageDetails ?? '').trim(),
          coverageAmount: Number(x.coverageAmount ?? 0),
          coverageDays: Number(x.coverageDays ?? 0),
          providerName: String(x.providerName ?? '').trim(),
          basePremium: Number(x.basePremium ?? 0),
          claimWebsite: String(x.claimWebsite ?? '').trim(),
        };
      });
      setInsuranceMasterOptions(insuranceOptions);
      setInsuranceInfoMap(insuranceMap);

      const pkgTypes = toRows(packageTypeJson)
        .map((x: any) => ({ id: Number(x.id || 0), name: String(x.name || '').trim() }))
        .filter((x: any) => x.id > 0 && x.name.length > 0);
      if (pkgTypes.length > 0) setPackageTypeMasters(pkgTypes);

      const roomTypes = toRows(roomTypeJson)
        .map((x: any) => ({
          id: Number(x.id || 0),
          name: String(x.name || '').trim(),
          code: String(x.code || '').trim(),
          baseCapacity: Number(x.baseCapacity || 0),
        }))
        .filter((x: any) => x.id > 0 && x.name.length > 0);
      setRoomTypeMasters(roomTypes);
      return { insuranceOptions, insuranceMap, pkgTypes, roomTypes };
    };

    (async () => {
      try {
        const critical = await loadCritical();
        const schedule = (cb: () => void) => {
          if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
            (window as any).requestIdleCallback(cb, { timeout: 1200 });
          } else {
            setTimeout(cb, 200);
          }
        };
        schedule(() => {
          void (async () => {
            try {
              const nonCritical = await loadNonCritical();
              if (typeof window !== 'undefined') {
                try {
                  localStorage.setItem(CACHE_KEY, JSON.stringify({
                    at: Date.now(),
                    data: {
                      ...critical,
                      ...nonCritical,
                    },
                  }));
                } catch {
                  // ignore cache write failure
                }
              }
            } catch {
              // noop
            }
          })();
        });
      } catch {
        // noop
      }
    })();
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    const ids = Array.from(new Set(
      ((displayConfig.termsTemplateIds ?? []).map((v) => Number(v)).filter((v) => Number.isFinite(v) && v > 0))
    ));
    const fallback = Number(displayConfig.termsTemplateId || 0);
    const targetIds = ids.length > 0 ? ids : (fallback > 0 ? [fallback] : []);
    if (targetIds.length === 0) {
      setTermsContent('');
      return;
    }
    let mounted = true;
    const fetchTermsTemplateDetail = async (id: number) => {
      const paths = [
        `/api/v1/master/TermsTemplates/${id}`,
        `/api/v1/master/terms-templates/${id}`,
      ];
      for (const p of paths) {
        try {
          const r = await fetch(`${API_BASE_URL}${p}`, { cache: 'no-store' });
          if (!r.ok) continue;
          const json = await r.json();
          return {
            id,
            name: String(json?.name ?? `Template #${id}`),
            content: String(json?.content ?? json?.data?.content ?? ''),
          };
        } catch {
          // try next path
        }
      }
      return {
        id,
        name: `Template #${id}`,
        content: '',
      };
    };
    Promise.all(
      targetIds.map((id) =>
        fetchTermsTemplateDetail(id)
      )
    )
      .then((rows) => {
        if (!mounted) return;
        const merged = rows
          .map((x, idx) => `# ${idx + 1}. ${x.name}\n${x.content.trim()}`)
          .join('\n\n');
        setTermsContent(merged.trim());
      })
      .catch(() => setTermsContent(''));
    return () => { mounted = false; };
  }, [displayConfig.termsTemplateId, displayConfig.termsTemplateIds]);

  const packMeta = useMemo(() => {
    try { return program?.metadata ? JSON.parse(program.metadata) as { defaultSeatCapacity?: number; defaultSeatAvailable?: number } : {}; }
    catch { return {}; }
  }, [program?.metadata]);
  const packTitle = program?.title || program?.name || fallbackPack.title;
  const packDuration = program ? `${program.durationDays} Hari` : fallbackPack.duration;
  const seoPackTitle = String(displayConfig.seoTitle || '').trim() || packTitle;
  const seoPackDescription = String(displayConfig.seoDescription || '').trim() || `Paket ${packTitle} durasi ${packDuration}`;
  const formatPeriodLabel = (startRaw?: string, endRaw?: string): string => {
    if (!startRaw || !endRaw) return '';
    const start = new Date(startRaw);
    const end = new Date(endRaw);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return '';
    const sameMonth = start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear();
    const startDay = start.getDate();
    const startMonth = start.toLocaleString(locale, { month: 'long' });
    const endMonth = end.toLocaleString(locale, { month: 'long' });
    const startYear = start.getFullYear();
    const endYear = end.getFullYear();
    if (sameMonth) {
      return `Berangkat mulai ${startDay} ${startMonth} ${startYear}`;
    }
    if (startYear === endYear) {
      return `Mulai ${startDay} ${startMonth}-${endMonth} ${startYear}`;
    }
    return `Mulai ${startDay} ${startMonth} ${startYear}-${endMonth} ${endYear}`;
  };
  const formatDeparturesRangeLabel = (rows: Array<{ departureDate: string }>): string => {
    if (!Array.isArray(rows) || rows.length === 0) return '';
    const sorted = rows
      .map((x) => new Date(x.departureDate))
      .filter((d) => !Number.isNaN(d.getTime()))
      .sort((a, b) => a.getTime() - b.getTime());
    if (sorted.length === 0) return '';
    const start = sorted[0];
    const end = sorted[sorted.length - 1];
    return formatPeriodLabel(start.toISOString(), end.toISOString());
  };
  const departureOptions = useMemo(
    () => (program?.packages ?? [])
      .flatMap((pkg) => (pkg.departures ?? []).map((d) => ({
        ...d,
        programPackageId: pkg.id,
        packageClassName: pkg.packageClassName,
        defaultPriceQuad: pkg.priceQuad,
        defaultPriceTripleAdditional: pkg.priceTripleAdditional,
        defaultPriceDoubleAdditional: pkg.priceDoubleAdditional,
      })))
      .sort((a, b) => new Date(a.departureDate).getTime() - new Date(b.departureDate).getTime()),
    [program]
  );
  const selectedDeparture = departureOptions.find((d) => d.id === selectedDepartureId) ?? departureOptions[0];
  const packDateRaw = selectedDeparture?.departureDate || displayConfig.departureDate || program?.departurePeriodStart;
  const periodLabel = departureOptions.length > 0
    ? formatDeparturesRangeLabel(departureOptions)
    : formatPeriodLabel(program?.departurePeriodStart, program?.departurePeriodEnd);
  const packDate = packDateRaw ? new Date(packDateRaw).toLocaleDateString(locale) : fallbackPack.date;
  const packDescriptionHtml = useMemo(() => {
    const raw = String(
      (program as any)?.description ??
      (program as any)?.shortDescription ??
      displayConfig.seoDescription ??
      `Paket ${packTitle} premium. Termasuk tiket PP, hotel 5★ di Makkah & Madinah, transportasi VIP, dan bimbingan umrah lengkap. Keberangkatan ${periodLabel || packDate} selama ${packDuration}.`
    ).trim();
    if (!raw) return '';
    const hasHtmlTag = /<\/?[a-z][\s\S]*>/i.test(raw);
    const toHtml = hasHtmlTag ? raw : raw.replace(/\r?\n/g, '<br/>');
    return toHtml
      .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, '')
      .replace(/\son\w+="[^"]*"/gi, '')
      .replace(/\son\w+='[^']*'/gi, '')
      .replace(/javascript:/gi, '');
  }, [program, displayConfig.seoDescription, packTitle, periodLabel, packDate, packDuration]);
  const lowestPackageTypePriceIdr = (() => {
    const rawRows = Array.isArray(displayConfig.packageTypePricings) ? displayConfig.packageTypePricings : [];
    const rows = rawRows
      .map((x) => Number(x.priceIdr || 0))
      .filter((v) => Number.isFinite(v) && v > 0);
    if (rows.length > 0) return Math.min(...rows);
    if (Number(displayConfig.priceIdr || 0) > 0) return Number(displayConfig.priceIdr || 0);
    return 0;
  })();
  const packPrice = formatPrice(lowestPackageTypePriceIdr, true);
  const shouldShowPromoPrice = lowestPackageTypePriceIdr > 0;
  const metaSeatCapacity = Math.max(0, Number(packMeta.defaultSeatCapacity ?? 0));
  const metaSeatAvailableRaw = Number(packMeta.defaultSeatAvailable ?? metaSeatCapacity);
  const metaSeatAvailable = Math.max(0, Math.min(metaSeatAvailableRaw, Math.max(0, metaSeatCapacity)));
  const seatAvailable = Number(selectedDeparture?.seatAvailable ?? metaSeatAvailable);
  const seatCapacity = Number(selectedDeparture?.seatCapacity ?? metaSeatCapacity);
  const unitPriceQuad = Number(selectedDeparture?.priceQuad ?? selectedDeparture?.defaultPriceQuad ?? program?.packages?.[0]?.priceQuad ?? 0);
  const unitPriceTriple = unitPriceQuad + Number(selectedDeparture?.priceTripleAdditional ?? selectedDeparture?.defaultPriceTripleAdditional ?? program?.packages?.[0]?.priceTripleAdditional ?? 0);
  const unitPriceDouble = unitPriceQuad + Number(selectedDeparture?.priceDoubleAdditional ?? selectedDeparture?.defaultPriceDoubleAdditional ?? program?.packages?.[0]?.priceDoubleAdditional ?? 0);
  const depDateKeyForRoom = String(selectedDeparture?.departureDate || '').slice(0, 10);
  const hotelMapCfgForRoom = (Array.isArray(displayConfig.departureHotelMappings) ? displayConfig.departureHotelMappings : [])
    .find((x) => String(x.departureDate || '').slice(0, 10) === depDateKeyForRoom);
  const roomPriceRowsFromConfig = Array.isArray((selectedDeparture as any)?.hotelRoomPrices)
    ? ((selectedDeparture as any).hotelRoomPrices as Array<{ hotelId?: number; roomTypeMasterId?: number; price?: number }>)
    : (Array.isArray((hotelMapCfgForRoom as any)?.hotelRoomPrices) ? ((hotelMapCfgForRoom as any).hotelRoomPrices as Array<{ hotelId?: number; roomTypeMasterId?: number; price?: number }>) : []);
  const selectedRoomTypeMasterId = roomTypeMasters.find((x) => String(x.name || '').trim().toLowerCase() === String(orderForm.roomType || '').trim().toLowerCase())?.id;
  const selectedHotelIdsForRoom = (orderForm.selectedHotelIds ?? []).filter((id) => Number(id) > 0);
  const dynamicRoomTypePrice = selectedRoomTypeMasterId
    ? roomPriceRowsFromConfig
      .filter((r) => Number(r.roomTypeMasterId || 0) === Number(selectedRoomTypeMasterId))
      .filter((r) => selectedHotelIdsForRoom.length === 0 || selectedHotelIdsForRoom.includes(Number(r.hotelId || 0)))
      .map((r) => Number(r.price || 0))
      .filter((p) => p > 0)
      .sort((a, b) => a - b)[0]
    : undefined;
  const unitPriceByRoomType = Number(dynamicRoomTypePrice || 0) > 0
    ? Number(dynamicRoomTypePrice || 0)
    : (orderForm.roomType === 'Double' ? unitPriceDouble : orderForm.roomType === 'Triple' ? unitPriceTriple : unitPriceQuad);
  const safePaxCount = Math.max(1, Math.min(Number(orderForm.paxCount || 1), Math.max(1, seatAvailable)));
  const packageTypeRowsRaw = Array.isArray(displayConfig.packageTypePricings) && displayConfig.packageTypePricings.length > 0
    ? displayConfig.packageTypePricings
    : (displayConfig.packageTypeId
      ? [{ packageTypeId: Number(displayConfig.packageTypeId), priceIdr: Number(displayConfig.priceIdr || 0) }]
      : []);
  const packageTypeRowsFromDisplayConfig = packageTypeRowsRaw
    .map((x) => ({
      packageTypeId: Number(x.packageTypeId || 0),
      priceIdr: Number(x.priceIdr || 0),
      packageTypeName: String(x.packageTypeName || x.name || x.packageType || '').trim(),
      isAllInDefault: Boolean(x.isAllInDefault),
    }))
    .filter((x) => x.packageTypeId > 0);
  const packageTypeRowsFromDepartures = Array.from(
    departureOptions.reduce((acc, d) => {
      const id = Number(d.packageTypeId || 0);
      if (!id) return acc;
      const price = Number(d.priceQuad ?? d.defaultPriceQuad ?? 0);
      const prev = acc.get(id);
      if (!prev) {
        acc.set(id, { packageTypeId: id, priceIdr: price });
        return acc;
      }
      if (price > 0 && (prev.priceIdr <= 0 || price < prev.priceIdr)) {
        acc.set(id, { packageTypeId: id, priceIdr: price });
      }
      return acc;
    }, new Map<number, { packageTypeId: number; priceIdr: number }>())
      .values()
  );
  const packageTypeRows = (packageTypeRowsFromDisplayConfig.length > 0 ? packageTypeRowsFromDisplayConfig : packageTypeRowsFromDepartures)
    .sort((a, b) => a.priceIdr - b.priceIdr);
  const packageTypeRowsForOfferMode = orderForm.offerMode === 'custom'
    ? packageTypeRowsFromDisplayConfig
      .filter((x) => Number(x.priceIdr || 0) > 0)
      .sort((a, b) => a.priceIdr - b.priceIdr)
    : packageTypeRows;
  const allInDefaultPackageTypeId = packageTypeRowsFromDisplayConfig.find((x) => x.isAllInDefault)?.packageTypeId || 0;
  const selectedPackageTypeRow =
    packageTypeRowsForOfferMode.find((x) => x.packageTypeId === Number(orderForm.selectedPackageTypeId || 0))
    ?? packageTypeRowsForOfferMode[0];
  const packageTypeNameByIdFromConfig = useMemo(() => {
    const map = new Map<number, string>();
    packageTypeRowsFromDisplayConfig.forEach((row) => {
      const nm = String(row.packageTypeName || '').trim();
      if (row.packageTypeId > 0 && nm) map.set(row.packageTypeId, nm);
    });
    return map;
  }, [packageTypeRowsFromDisplayConfig]);
  const getPackageTypeName = (id: number) =>
    packageTypeNameByIdFromConfig.get(id)
    ?? packageTypeMasters.find((x) => x.id === id)?.name
    ?? `Kelas Paket ${id}`;
  const asIdr = (v: unknown) => Math.max(0, Math.round(Number(v || 0)));
  const departureCustomAdditionalPerPax = asIdr((selectedDeparture as any)?.customAdditionalPrice ?? 0);
  const withDepartureCustom = (base: unknown) => asIdr(base) + departureCustomAdditionalPerPax;
  const selectedPackageTypePrice = asIdr(selectedPackageTypeRow?.priceIdr || displayConfig.priceIdr || 0);
  const selectedRoomTypePrice = asIdr(dynamicRoomTypePrice || unitPriceByRoomType || 0);
  const basePricePerPax = selectedPackageTypePrice + selectedRoomTypePrice;
  const promoBasePerPax = basePricePerPax + departureCustomAdditionalPerPax;
  const hasPublishedPrice = lowestPackageTypePriceIdr > 0;
  const includeRows = Array.isArray(displayConfig.includePricings) ? displayConfig.includePricings : [];
  const excludeRows = Array.isArray(displayConfig.excludePricings) ? displayConfig.excludePricings : [];
  const selectedExcludes = excludeRows.filter((x) => orderForm.selectedExcludeIds.includes(x.id));
  const selectedIncludes = includeRows.filter((x) => orderForm.selectedIncludeIds.includes(x.id));
  const excludesTotal = selectedExcludes.reduce((s, x) => s + Number(x.price || 0), 0);
  const insuranceRowsRaw = Array.isArray(displayConfig.insuranceOptions) ? displayConfig.insuranceOptions : [];
  const insuranceRows = (() => {
    const byConfig = new Map<number, { insuranceTypeId: number; name: string; pricePerPax: number; providerName?: string; claimWebsite?: string }>();
    insuranceRowsRaw.forEach((x) => {
      const id = Number(x.insuranceTypeId || 0);
      if (!id) return;
      const master = insuranceInfoMap[id];
      byConfig.set(id, {
        insuranceTypeId: id,
        name: master?.name || x.name || `Asuransi #${id}`,
        providerName: master?.providerName || '',
        pricePerPax: Number(x.pricePerPax || 0) > 0 ? Number(x.pricePerPax || 0) : Number(master?.basePremium || 0),
        claimWebsite: String(x.claimWebsite ?? '').trim() || master?.claimWebsite || '',
      });
    });

    const merged = insuranceMasterOptions.map((m) => {
      const cfg = byConfig.get(m.insuranceTypeId);
      return cfg ?? m;
    });

    // If package config has insurance not present in master list, keep it visible.
    byConfig.forEach((cfg, id) => {
      if (!merged.some((m) => m.insuranceTypeId === id)) merged.push(cfg);
    });

    return merged;
  })();
  const insuranceMode = displayConfig.insuranceMode ?? 'optional';
  const insuranceModeLabel = insuranceMode === 'required' ? 'Asuransi Wajib' : 'Asuransi Opsional';
  const selectedInsurance = insuranceRows.find((x) => Number(x.insuranceTypeId) === Number(orderForm.selectedInsuranceTypeId));
  const selectedInsuranceInfo = selectedInsurance ? insuranceInfoMap[Number(selectedInsurance.insuranceTypeId)] : undefined;
  const insuranceDetailRawLink = String((selectedInsurance as { claimWebsite?: string } | undefined)?.claimWebsite || selectedInsuranceInfo?.claimWebsite || '').trim();
  const insuranceDetailHref = insuranceDetailRawLink
    ? (insuranceDetailRawLink.startsWith('http://') || insuranceDetailRawLink.startsWith('https://')
      ? insuranceDetailRawLink
      : `${API_BASE_URL}${insuranceDetailRawLink.startsWith('/') ? '' : '/'}${insuranceDetailRawLink}`)
    : '';
  const insurancePax = Math.max(0, Math.min(Number(orderForm.insurancePaxCount || 0), safePaxCount));
  const insuranceTotal = selectedInsurance ? Number(selectedInsurance.pricePerPax || 0) * insurancePax : 0;
  const rawDiscount = Number(displayConfig.discountValue || 0);
  const discountPerPax = displayConfig.discountType === 'percent'
    ? Math.round((promoBasePerPax * Math.max(0, Math.min(rawDiscount, 100))) / 100)
    : asIdr(rawDiscount);
  const includeTotal = selectedIncludes.reduce((s, x) => s + asIdr(x.price), 0);
  const allInPerPax = Math.max(0, promoBasePerPax - Math.min(discountPerPax, promoBasePerPax)) + includeTotal;
  const totalPayable = (orderForm.offerMode === 'all_in' ? allInPerPax : promoBasePerPax) * safePaxCount;
  const discountAmount = orderForm.offerMode === 'all_in'
    ? 0
    : (displayConfig.discountType === 'percent'
      ? Math.round((totalPayable * Math.max(0, Math.min(rawDiscount, 100))) / 100)
      : Math.max(0, rawDiscount));
  const cappedDiscount = Math.min(discountAmount, totalPayable);
  const voucherRules = (displayConfig.voucherRules ?? []).filter((x) => x.isActive);
  const voucherMatched = voucherRules.find((x) => x.code.trim().toLowerCase() === String(appliedVoucherCode || '').trim().toLowerCase());
  const voucherAmountRaw = voucherMatched ? (voucherMatched.type === 'percent'
    ? Math.round((Math.max(0, totalPayable - cappedDiscount) * Math.max(0, Math.min(Number(voucherMatched.value || 0), 100))) / 100)
    : Number(voucherMatched.value || 0)) : 0;
  const voucherAmount = Math.min(voucherAmountRaw, Math.max(0, totalPayable - cappedDiscount));
  const grandTotal = orderForm.offerMode === 'all_in'
    ? Math.max(0, totalPayable - voucherAmount) + excludesTotal + insuranceTotal
    : Math.max(0, totalPayable - cappedDiscount - voucherAmount) + excludesTotal + insuranceTotal + includeTotal;
  const effectiveTotal = Number(grandTotal);
  const scheduleOptions = departureOptions.length > 0
    ? departureOptions.map((d) => ({
      value: String(d.id),
      label: `${new Date(d.departureDate).toLocaleString(locale, { month: 'long', year: 'numeric' })}`,
    }))
    : [{
      value: 'period-default',
      label: periodLabel || (packDateRaw ? new Date(packDateRaw).toLocaleDateString(locale) : fallbackPack.date),
    }];
  const selectedScheduleLabel = selectedDeparture?.departureDate
    ? new Date(selectedDeparture.departureDate).toLocaleString(locale, { month: 'long', year: 'numeric' })
    : (scheduleOptions[0]?.label ?? '-');
  const selectedDepartureAirlineNames = useMemo(() => {
    const idsFromDeparture = Array.isArray((selectedDeparture as any)?.airlineIds)
      ? ((selectedDeparture as any).airlineIds as number[])
      : [];
    const depDate = String(selectedDeparture?.departureDate || '').slice(0, 10);
    const idsFromConfig = (Array.isArray(displayConfig.departureAirlineMappings) ? displayConfig.departureAirlineMappings : [])
      .find((x) => String(x.departureDate || '').slice(0, 10) === depDate)?.airlineIds ?? [];
    const mergedIds = Array.from(new Set(
      [...idsFromDeparture, ...idsFromConfig, Number(selectedDeparture?.airlineId || 0)]
        .map((id) => Number(id))
        .filter((id) => Number.isFinite(id) && id > 0)
    ));
    const names = mergedIds.map((id) => airlineNameMap[id]).filter((x): x is string => Boolean(x));
    if (names.length > 0) return names;
    if (selectedDeparture?.airlineName) return [selectedDeparture.airlineName];
    if (orderForm.airline) return [orderForm.airline];
    return [];
  }, [selectedDeparture, displayConfig.departureAirlineMappings, airlineNameMap, orderForm.airline]);
  const allInHotelNames = useMemo(() => {
    const ids = orderForm.selectedHotelIds ?? [];
    if (ids.length > 0) {
      return ids.map((id) => hotelNameMap[id]).filter((x): x is string => Boolean(x));
    }
    return [orderForm.makkahHotel, orderForm.madinahHotel].filter((x, i, arr): x is string => Boolean(x) && arr.indexOf(x) === i);
  }, [orderForm.selectedHotelIds, orderForm.makkahHotel, orderForm.madinahHotel, hotelNameMap]);
  const selectedProgramPackage = useMemo(
    () => program?.packages?.find((p) => Number(p.id) === Number(selectedDeparture?.programPackageId)) ?? program?.packages?.[0],
    [program?.packages, selectedDeparture?.programPackageId]
  );
  const selectedStayRows = useMemo(() => {
    const ids = (orderForm.selectedHotelIds ?? []).filter((id) => Number(id) > 0);
    const depDate = String(selectedDeparture?.departureDate || '').slice(0, 10);
    const hotelMapCfg = (Array.isArray(displayConfig.departureHotelMappings) ? displayConfig.departureHotelMappings : [])
      .find((x) => String(x.departureDate || '').slice(0, 10) === depDate);
    const fromDepartureStays = Array.isArray((selectedDeparture as any)?.hotelStays)
      ? ((selectedDeparture as any).hotelStays as Array<{ hotelId?: number; nights?: number }>)
      : (hotelMapCfg?.hotelStays ?? []);
    const fromDepartureOcc = Array.isArray((selectedDeparture as any)?.hotelOccupancyPrices)
      ? ((selectedDeparture as any).hotelOccupancyPrices as Array<{ hotelId?: number; priceQuad?: number; priceTripleAdditional?: number; priceDoubleAdditional?: number }>)
      : (hotelMapCfg?.hotelOccupancyPrices ?? []);
    const fromDepartureRoomPrices = Array.isArray((selectedDeparture as any)?.hotelRoomPrices)
      ? ((selectedDeparture as any).hotelRoomPrices as Array<{ hotelId?: number; roomTypeMasterId?: number; price?: number }>)
      : (Array.isArray((hotelMapCfg as any)?.hotelRoomPrices) ? ((hotelMapCfg as any).hotelRoomPrices as Array<{ hotelId?: number; roomTypeMasterId?: number; price?: number }>) : []);
    const pickPrice = (row: { priceQuad?: number; priceTripleAdditional?: number; priceDoubleAdditional?: number }) => {
      const quad = Number(row.priceQuad ?? unitPriceQuad ?? 0);
      const tripleDelta = Number(row.priceTripleAdditional ?? (unitPriceTriple - unitPriceQuad));
      const doubleDelta = Number(row.priceDoubleAdditional ?? (unitPriceDouble - unitPriceQuad));
      const triple = quad + tripleDelta;
      const dbl = quad + doubleDelta;
      return { quad, triple, double: dbl };
    };
    if (ids.length > 0) {
      return ids.map((hotelId, idx) => {
        const stay = fromDepartureStays.find((x) => Number(x.hotelId) === Number(hotelId));
        const occ = fromDepartureOcc.find((x) => Number(x.hotelId) === Number(hotelId));
        const dynamicRoomPrices = roomTypeMasters
          .map((rt) => {
            const price = Number(
              fromDepartureRoomPrices.find((rp) => Number(rp.hotelId) === Number(hotelId) && Number(rp.roomTypeMasterId) === Number(rt.id))?.price ?? 0
            );
            return { roomTypeName: rt.name, price };
          })
          .filter((x) => x.price > 0);
        const fallbackNights = Number(hotelId) === Number(selectedDeparture?.makkahHotelId)
          ? Number(selectedProgramPackage?.makkahNights || 0)
          : Number(hotelId) === Number(selectedDeparture?.madinahHotelId)
            ? Number(selectedProgramPackage?.madinahNights || 0)
            : 0;
        const prices = pickPrice(occ ?? {});
        return {
          hotelId,
          hotelName: hotelNameMap[hotelId] ?? `Hotel #${hotelId}`,
          nights: Number(stay?.nights ?? fallbackNights ?? 0),
          roomPrices: dynamicRoomPrices,
          ...prices,
          order: idx,
        };
      });
    }
    const fallback: Array<{ hotelId: number; hotelName: string; nights: number; quad: number; triple: number; double: number; order: number }> = [];
    if (selectedDeparture?.makkahHotelName) {
      fallback.push({
        hotelId: Number(selectedDeparture?.makkahHotelId || 0),
        hotelName: selectedDeparture.makkahHotelName,
        nights: Number(selectedProgramPackage?.makkahNights || 0),
        quad: unitPriceQuad,
        triple: unitPriceTriple,
        double: unitPriceDouble,
        order: 0,
      });
    }
    if (selectedDeparture?.madinahHotelName) {
      fallback.push({
        hotelId: Number(selectedDeparture?.madinahHotelId || 0),
        hotelName: selectedDeparture.madinahHotelName,
        nights: Number(selectedProgramPackage?.madinahNights || 0),
        quad: unitPriceQuad,
        triple: unitPriceTriple,
        double: unitPriceDouble,
        order: 1,
      });
    }
    return fallback;
  }, [orderForm.selectedHotelIds, selectedDeparture, selectedProgramPackage, hotelNameMap, unitPriceQuad, unitPriceTriple, unitPriceDouble, displayConfig.departureHotelMappings, roomTypeMasters]);
  const customHotelOptions = useMemo(() => {
    const fromMaster = Object.entries(hotelNameMap)
      .map(([id, name]) => ({ id: Number(id), name: String(name || '').trim() }))
      .filter((x) => x.id > 0 && x.name.length > 0)
      .sort((a, b) => a.name.localeCompare(b.name, 'id'));
    if (fromMaster.length > 0) return fromMaster;
    return allInHotelNames.map((name, idx) => ({ id: idx + 1, name }));
  }, [hotelNameMap, allInHotelNames]);
  const roomTypeOptions = useMemo(() => {
    const fromStayRows = new Map<string, number[]>();
    selectedStayRows.forEach((h: any) => {
      const rows = Array.isArray(h?.roomPrices) ? h.roomPrices : [];
      rows.forEach((rp: any) => {
        const name = String(rp?.roomTypeName || '').trim();
        const price = Number(rp?.price || 0);
        if (!name || price <= 0) return;
        const prev = fromStayRows.get(name) ?? [];
        prev.push(price);
        fromStayRows.set(name, prev);
      });
    });
    if (fromStayRows.size > 0) {
      return Array.from(fromStayRows.entries())
        .map(([name, prices]) => ({ value: name, label: name, price: Math.min(...prices) }))
        .sort((a, b) => a.price - b.price);
    }

    const depDate = String(selectedDeparture?.departureDate || '').slice(0, 10);
    const hotelMapCfg = (Array.isArray(displayConfig.departureHotelMappings) ? displayConfig.departureHotelMappings : [])
      .find((x) => String(x.departureDate || '').slice(0, 10) === depDate);
    const fromDepartureRoomPrices = Array.isArray((selectedDeparture as any)?.hotelRoomPrices)
      ? ((selectedDeparture as any).hotelRoomPrices as Array<{ hotelId?: number; roomTypeMasterId?: number; price?: number }>)
      : (Array.isArray((hotelMapCfg as any)?.hotelRoomPrices) ? ((hotelMapCfg as any).hotelRoomPrices as Array<{ hotelId?: number; roomTypeMasterId?: number; price?: number }>) : []);
    const chosenHotelIds = (orderForm.selectedHotelIds ?? []).filter((id) => Number(id) > 0);
    const relevantRows = fromDepartureRoomPrices.filter((r) => {
      const hid = Number(r.hotelId || 0);
      if (chosenHotelIds.length === 0) return hid > 0;
      return chosenHotelIds.includes(hid);
    });
    if (relevantRows.length > 0 && roomTypeMasters.length > 0) {
      const byType = new Map<number, number[]>();
      relevantRows.forEach((r) => {
        const typeId = Number(r.roomTypeMasterId || 0);
        const price = Number(r.price || 0);
        if (typeId <= 0 || price <= 0) return;
        const prev = byType.get(typeId) ?? [];
        prev.push(price);
        byType.set(typeId, prev);
      });
      const dynamicOptions = roomTypeMasters
        .map((rt) => {
          const prices = byType.get(Number(rt.id)) ?? [];
          if (prices.length === 0) return null;
          return {
            value: rt.name,
            label: rt.name,
            price: Math.min(...prices),
          };
        })
        .filter((x): x is { value: string; label: string; price: number } => Boolean(x));
      if (dynamicOptions.length > 0) return dynamicOptions;
    }
    if (orderForm.offerMode === 'all_in') return [];
    const match = (finder: (x: { id: number; name: string; code?: string; baseCapacity?: number }) => boolean, fallbackLabel: string, value: 'Quad' | 'Triple' | 'Double', price: number) => {
      const found = roomTypeMasters.find(finder);
      return {
        value,
        label: found?.name || fallbackLabel,
        price,
      };
    };
    const quad = match((x) => (x.code || '').toLowerCase() === 'quad' || x.baseCapacity === 4 || x.name.toLowerCase().includes('quad'), 'Quad', 'Quad', unitPriceQuad);
    const triple = match((x) => (x.code || '').toLowerCase() === 'triple' || x.baseCapacity === 3 || x.name.toLowerCase().includes('triple'), 'Triple', 'Triple', unitPriceTriple);
    const dbl = match((x) => (x.code || '').toLowerCase() === 'double' || x.baseCapacity === 2 || x.name.toLowerCase().includes('double'), 'Double', 'Double', unitPriceDouble);
    return [quad, triple, dbl];
  }, [selectedStayRows, roomTypeMasters, unitPriceQuad, unitPriceTriple, unitPriceDouble, selectedDeparture, displayConfig.departureHotelMappings, orderForm.selectedHotelIds, orderForm.offerMode]);
  const activeRoomTypeLabel = roomTypeOptions.find((x) => x.value === orderForm.roomType)?.label || orderForm.roomType;
  const jamaahDataMode = displayConfig.jamaahDataMode ?? 'required_full';
  const isPicOnlyMode = jamaahDataMode === 'pic_only';
  const isJamaahDeferredMode = jamaahDataMode === 'optional_after_checkout';
  const isJamaahMinimalMode = jamaahDataMode === 'required_minimal';
  const jamaahSectionTitle = isPicOnlyMode ? 'Data PIC (Penanggung Jawab)' : 'Data Jamaah';
  const packageFacilities = (Array.isArray(displayConfig.facilities) ? displayConfig.facilities : [])
    .map((x) => ({ facilityMasterId: Number(x?.facilityMasterId || 0), name: String(x?.name || '').trim() }))
    .filter((x) => x.facilityMasterId > 0 && x.name.length > 0);

  useEffect(() => {
    if (roomTypeOptions.length === 0) return;
    const exists = roomTypeOptions.some((x) => x.value === orderForm.roomType);
    if (exists) return;
    setOrderForm((v) => ({ ...v, roomType: roomTypeOptions[0].value }));
  }, [roomTypeOptions, orderForm.roomType]);

  useEffect(() => {
    if (!selectedDeparture) return;
    setOrderForm((v) => {
      const nextDepartureDate = String(selectedDeparture.departureDate).slice(0, 10);
      const nextAirline = selectedDeparture.airlineName || v.airline;
      const nextAirport = selectedDeparture.departureAirportName || v.departureAirport;
      const nextMakkah = selectedDeparture.makkahHotelName || v.makkahHotel;
      const nextMadinah = selectedDeparture.madinahHotelName || v.madinahHotel;
      const nextHotelIdsRaw = Array.isArray((selectedDeparture as any).hotelIds)
        ? ((selectedDeparture as any).hotelIds as number[])
        : [selectedDeparture.makkahHotelId, selectedDeparture.madinahHotelId].filter((id): id is number => Number(id) > 0);
      const nextHotelIds = Array.from(new Set(nextHotelIdsRaw.map((id) => Number(id)).filter((id) => Number.isFinite(id) && id > 0)));
      const nextPax = Math.max(1, Math.min(v.paxCount, Math.max(1, selectedDeparture.seatAvailable)));
      if (
        v.departureDate === nextDepartureDate &&
        v.airline === nextAirline &&
        v.departureAirport === nextAirport &&
        v.makkahHotel === nextMakkah &&
        v.madinahHotel === nextMadinah &&
        v.selectedHotelIds.length === nextHotelIds.length &&
        v.selectedHotelIds.every((id, i) => id === nextHotelIds[i]) &&
        v.paxCount === nextPax
      ) {
        return v;
      }
      return {
        ...v,
        departureDate: nextDepartureDate,
        airline: nextAirline,
        departureAirport: nextAirport,
        makkahHotel: nextMakkah,
        madinahHotel: nextMadinah,
        selectedHotelIds: nextHotelIds,
        paxCount: nextPax,
      };
    });
  }, [selectedDeparture]);

  useEffect(() => {
    if (selectedDeparture) return;
    if (!packDateRaw) return;
    const nextDate = String(packDateRaw).slice(0, 10);
    setOrderForm((v) => (v.departureDate ? v : { ...v, departureDate: nextDate }));
  }, [selectedDeparture, packDateRaw]);

  useEffect(() => {
    if (insuranceRows.length === 0) return;
    const firstId = Number(insuranceRows[0].insuranceTypeId || 0);
    if (!firstId) return;
    setOrderForm((v) => {
      const hasCurrent = insuranceRows.some((x) => Number(x.insuranceTypeId) === Number(v.selectedInsuranceTypeId));
      if (insuranceMode === 'required') {
        if (hasCurrent && Number(v.selectedInsuranceTypeId || 0) > 0) return v;
        return { ...v, selectedInsuranceTypeId: firstId, insurancePaxCount: Math.max(1, v.insurancePaxCount || 1) };
      }
      if (hasCurrent || Number(v.selectedInsuranceTypeId || 0) === 0) return v;
      return { ...v, selectedInsuranceTypeId: 0 };
    });
  }, [insuranceMode, insuranceRows]);

  useEffect(() => {
    if (!selectedInsurance) return;
    setOrderForm((v) => {
      const next = Math.max(1, Math.min(Number(v.paxCount || 1), safePaxCount));
      if (Number(v.insurancePaxCount || 0) === next) return v;
      return { ...v, insurancePaxCount: next };
    });
  }, [selectedInsurance?.insuranceTypeId, safePaxCount, orderForm.paxCount]);

  useEffect(() => {
    setOrderForm((v) => {
      const nextInclude = v.selectedIncludeIds.filter((id) => includeRows.some((x) => x.id === id));
      const nextExclude = v.selectedExcludeIds.filter((id) => excludeRows.some((x) => x.id === id));
      if (nextInclude.length === v.selectedIncludeIds.length && nextExclude.length === v.selectedExcludeIds.length) return v;
      return { ...v, selectedIncludeIds: nextInclude, selectedExcludeIds: nextExclude };
    });
  }, [includeRows, excludeRows]);

  useEffect(() => {
    if (packageTypeRowsForOfferMode.length === 0) return;
    const defaultTypeId = orderForm.offerMode === 'all_in' && allInDefaultPackageTypeId > 0
      ? allInDefaultPackageTypeId
      : (packageTypeRowsForOfferMode[0]?.packageTypeId || 0);
    if (!defaultTypeId) return;
    setOrderForm((v) => {
      const currentOk = packageTypeRowsForOfferMode.some((x) => x.packageTypeId === Number(v.selectedPackageTypeId || 0));
      if (currentOk && (orderForm.offerMode !== 'all_in' || !allInDefaultPackageTypeId || Number(v.selectedPackageTypeId || 0) === allInDefaultPackageTypeId)) return v;
      return { ...v, selectedPackageTypeId: defaultTypeId };
    });
  }, [packageTypeRowsForOfferMode, allInDefaultPackageTypeId, orderForm.offerMode]);

  useEffect(() => {
    if (!isPicOnlyMode) return;
    setOrderForm((v) => {
      const first = v.jamaahs[0] ?? { fullName: '', gender: '', passportNo: '', birthDate: '', phone: '', email: '' };
      if (v.jamaahs.length === 1 && v.paxCount >= 1) return v;
      return {
        ...v,
        jamaahs: [first],
      };
    });
  }, [isPicOnlyMode]);

  const openSuperadminWaWithLead = (message: string) => {
    trackEvent('wa_click', SUPERADMIN_WHATSAPP);
    window.open(buildSuperadminWaUrl(message), '_blank', 'noopener,noreferrer');
  };
  const submitOrderDirect = async () => {
    if (submitLoading) return;
    const validation = validateOrderForm();
    if (validation) {
      show(validation);
      return;
    }
    if (!agreeTerms) {
      show('Silakan setujui Syarat & Ketentuan terlebih dahulu.');
      return;
    }
    setSubmitLoading(true);
    try {
      const payload = buildBookingPayload();
      const res = await fetch(`${API_BASE_URL}/api/BusinessInsights/pack/booking-submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const json = await res.json().catch(() => null) as any;
      if (res.ok) {
        const bookingId = json?.data?.bookingId;
        const detailUrl = `${window.location.origin}/${locale}/akun/orders/${bookingId}`;
        const waMsg = `(#${bookingId}) ${detailUrl} , paket: ${packTitle}, Assalamu'alaikum, Kami order ini, mohon di proses.\nTerimakasih.`;
        trackEvent('booking_submit', undefined, {
          bookingId: Number(bookingId || 0),
          paxCount: Number(orderForm.paxCount || 1),
          value: Number(effectiveTotal || 0),
          currency: 'IDR',
        });
        setOrderOpen(false);
        openSuperadminWaWithLead(waMsg);
        show(`Pemesanan tersimpan. ID Order: #${bookingId}`);
      } else {
        show(readApiErrorMessage(json) || 'Gagal menyimpan pemesanan');
      }
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleHubungiWaClick = async () => {
    if (waActionLoading) return;
    setWaActionLoading(true);
    try {
      const waTargetRes = await fetch(`${API_BASE_URL}/api/Leads/wa-target`, { cache: 'no-store' });
      const waTargetJson = await waTargetRes.json().catch(() => null) as any;
      const waTarget = (waTargetJson?.data ?? null) as WaTargetResponse | null;
      const targetWa = String(waTarget?.whatsApp || SUPERADMIN_WHATSAPP).replace(/\D/g, '');
      const refUser = getCookie('ref_agent');
      const link = typeof window !== 'undefined' ? window.location.href : '';
      const message = refUser
        ? `Id: ${refUser}\nAssalamualaikum..${link} kami tertarik paket ${packTitle}`
        : `Assalamualaikum..${link} kami tertarik paket ${packTitle}`;
      trackEvent('wa_click', targetWa);
      window.open(`https://wa.me/${targetWa}?text=${encodeURIComponent(message)}`, '_blank', 'noopener,noreferrer');
      show('Menghubungkan ke WhatsApp...');
    } catch {
      show('Gagal membuka WhatsApp, silakan coba lagi');
    } finally {
      setWaActionLoading(false);
    }
  };

  const itineraryRows = (() => {
    const groups = Array.isArray(displayConfig.itineraryByDeparture) ? displayConfig.itineraryByDeparture : [];
    if (groups.length > 0 && selectedDeparture?.departureDate) {
      const depKey = String(selectedDeparture.departureDate).slice(0, 10);
      const selected = groups.find((g) => String(g.departureDate || '').slice(0, 10) === depKey);
      if (selected && Array.isArray(selected.items) && selected.items.length > 0) return selected.items;
    }
    return Array.isArray(displayConfig.itineraries) ? displayConfig.itineraries : [];
  })();
  const wishlistPayload: WishlistItem = {
    id: String(program?.slug || cleanCode || ''),
    slug: String(program?.slug || cleanCode || ''),
    title: packTitle,
    image: heroImage,
    duration: packDuration,
    priceFrom: Number(lowestPackageTypePriceIdr || 0),
    savedAt: new Date().toISOString(),
  };
  const toggleWishlist = () => {
    if (wishlisted) {
      removeFromWishlist(wishlistPayload.id);
      setWishlisted(false);
      setWishlistCount(getWishlist().length);
      show('Dihapus dari Wishlist');
      return;
    }
    addToWishlist(wishlistPayload);
    setWishlisted(true);
    setWishlistCount(getWishlist().length);
    show('Ditambahkan ke Wishlist');
  };
  const handleSharePack = async () => {
    const text = `${shareText}\n${shareUrl}`;
    trackEvent('share_click');
    try {
      if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
        await navigator.share({
          title: shareText,
          text: shareText,
          url: shareUrl,
        });
        return;
      }
      if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareUrl);
        show('Link paket berhasil disalin');
        return;
      }
      window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
    } catch {
      // abaikan cancel share oleh user
    }
  };

  useEffect(() => {
    setItineraryLoading(true);
    const raf = window.requestAnimationFrame(() => setItineraryLoading(false));
    return () => window.cancelAnimationFrame(raf);
  }, [program?.id, selectedDeparture?.departureDate, itineraryOpen]);
  const packIncludes = (() => {
    if (includeRows.length > 0) {
      return includeRows
        .map((x) => {
          const label = String(x.name || '').trim();
          if (!label) return '';
          return label;
        })
        .filter((x) => x.length > 0);
    }
    if (program?.includedItems && program.includedItems.length > 0) {
      return program.includedItems.map((x) => String(x || '').trim()).filter((x) => x.length > 0);
    }
    return [];
  })();
  const packExcludes = (() => {
    if (excludeRows.length > 0) {
      return excludeRows
        .map((x) => {
          const label = String(x.name || '').trim();
          if (!label) return '';
          return label;
        })
        .filter((x) => x.length > 0);
    }
    if (program?.excludedItems && program.excludedItems.length > 0) {
      return program.excludedItems.map((x) => String(x || '').trim()).filter((x) => x.length > 0);
    }
    return [];
  })();
  const serviceLabel = (() => {
    const s = `${program?.name || ''} ${program?.title || ''} ${program?.slug || cleanCode}`.toLowerCase();
    if (s.includes('haji')) return isEn ? 'Hajj Service' : isAr ? 'خدمة الحج' : 'Layanan Haji';
    if (s.includes('umrah') || s.includes('umroh')) return isEn ? 'Umrah Service' : isAr ? 'خدمة العمرة' : 'Layanan Umrah';
    return isEn ? 'Travel Service' : isAr ? 'خدمة السفر' : 'Layanan Travel';
  })();
  const structuredData = useMemo(() => ({
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: seoPackTitle,
    description: seoPackDescription,
    offers: {
      '@type': 'Offer',
      priceCurrency: 'IDR',
      price: String((program?.packages?.[0]?.priceQuad ?? 0) || 0),
      availability: 'https://schema.org/InStock',
    },
    image: heroImage,
  }), [seoPackTitle, seoPackDescription, program?.packages, heroImage]);
  const breadcrumbData = useMemo(() => ({
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: locale === 'en' ? 'Home' : locale === 'ar' ? 'الرئيسية' : 'Beranda', item: `/${locale}` },
      { '@type': 'ListItem', position: 2, name: serviceLabel, item: `/${locale}/layanan` },
      { '@type': 'ListItem', position: 3, name: packTitle, item: `/${locale}/pack/${program?.slug || cleanCode}` },
    ],
  }), [locale, serviceLabel, packTitle, program?.slug, cleanCode]);

  const getCookie = (name: string): string | null => {
    if (typeof document === 'undefined') return null;
    const found = document.cookie.split(';').map((x) => x.trim()).find((x) => x.startsWith(`${name}=`));
    return found ? decodeURIComponent(found.slice(name.length + 1)) : null;
  };

  const readApiErrorMessage = (raw: any): string => {
    const firstErr = Array.isArray(raw?.errors) ? raw.errors[0] : null;
    const errMsg = typeof firstErr?.message === 'string' ? firstErr.message : '';
    const msg = typeof raw?.message === 'string' ? raw.message : '';
    return errMsg || msg || 'Terjadi kesalahan pada server';
  };

  const buildBookingPayload = () => {
    const refAgent = getCookie('ref_agent');
    const refCookie = getCookie('ref_code') || getCookie('ref') || refAgent;
    const sessionId = typeof window !== 'undefined' ? sessionStorage.getItem('leads_session') : null;
    const excludesPayload = selectedExcludes.map((x) => ({ id: null, name: x.name, price: Number(x.price || 0), qty: 1, subtotal: Number(x.price || 0) }));
    const includePayload = selectedIncludes.map((x) => ({ id: null, name: x.name, price: Number(x.price || 0), qty: 1, subtotal: Number(x.price || 0) }));
    const insurancesPayload = selectedInsurance ? [{
      id: selectedInsurance.insuranceTypeId,
      name: selectedInsurance.name,
      price: Number(selectedInsurance.pricePerPax || 0),
      qty: insurancePax,
      subtotal: insuranceTotal,
    }] : [];
    return {
      programCode: program?.slug || cleanCode,
      programPackageId: selectedDeparture?.programPackageId ?? program?.packages?.[0]?.id ?? null,
      programPackageDepartureId: selectedDeparture?.id ?? null,
      departureDate: selectedDeparture?.departureDate ?? (orderForm.departureDate ? new Date(orderForm.departureDate).toISOString() : null),
      refAgentUsername: refAgent,
      refCookie,
      pageUrl: window.location.pathname,
      sessionId,
      customerName: 'Pelanggan Website',
      customerEmail: '',
      customerWhatsApp: '',
      paxCount: Number(safePaxCount || 1),
      jamaahCount: Number(isJamaahDeferredMode ? 0 : (isPicOnlyMode ? 1 : (orderForm.jamaahs.length || safePaxCount || 1))),
      roomType: orderForm.roomType,
      roomCount: 1,
      unitPrice: Number(unitPriceByRoomType || 0),
      totalAmount: Number(effectiveTotal || 0),
      termsTemplateId: displayConfig.termsTemplateId ?? null,
      termsTemplateName: '',
      discountLabel: displayConfig.discountLabel ?? null,
      discountType: displayConfig.discountType ?? null,
      discountValue: Number(displayConfig.discountValue || 0),
      discountAmount: Number(cappedDiscount || 0),
      voucherCode: appliedVoucherCode || null,
      voucherAmount: Number(voucherAmount || 0),
      includeType: orderForm.includeType || null,
      excludeType: orderForm.excludeType || null,
      notes: orderForm.notes || null,
      revenueAmount: Number(effectiveTotal || 0),
      costAmount: 0,
      includes: includePayload,
      excludes: excludesPayload,
      insurances: insurancesPayload,
      jamaahs: (isJamaahDeferredMode ? [] : (isPicOnlyMode ? orderForm.jamaahs.slice(0, 1) : orderForm.jamaahs)).map((x) => ({
        fullName: x.fullName || 'Jamaah',
        gender: x.gender || null,
        passportNo: x.passportNo || null,
        birthDate: x.birthDate ? new Date(x.birthDate).toISOString() : null,
        phone: x.phone || null,
        email: x.email || null,
      }))
    };
  };
  const validateOrderForm = (): string | null => {
    if (seatAvailable <= 0) return 'Seat untuk jadwal ini sudah habis';
    if (!agreeTerms) return 'Centang persetujuan Syarat & Ketentuan terlebih dahulu';
    if (orderForm.offerMode !== 'all_in' && !orderForm.selectedPackageTypeId) return 'Package Type wajib dipilih';
    if (insuranceMode === 'required' && !orderForm.selectedInsuranceTypeId) return 'Asuransi wajib dipilih untuk paket ini';
    if (isJamaahDeferredMode) {
      return null;
    }
    if (isPicOnlyMode) {
      const pic = orderForm.jamaahs[0];
      if (!pic?.fullName.trim() || !pic?.phone.trim()) return 'Data PIC (nama & no HP) wajib diisi';
      return null;
    }
    if (isJamaahMinimalMode) {
      const invalidJamaah = orderForm.jamaahs.findIndex((j) =>
        !j.fullName.trim() || !j.gender
      );
      if (invalidJamaah >= 0) return `Data Jamaah #${invalidJamaah + 1} (nama & gender) belum lengkap`;
      return null;
    }
    const invalidJamaah = orderForm.jamaahs.findIndex((j) =>
      !j.fullName.trim() || !j.gender || !j.passportNo.trim() || !j.phone.trim()
    );
    if (invalidJamaah >= 0) return `Data Jamaah #${invalidJamaah + 1} belum lengkap`;
    return null;
  };

  if (!programResolved) {
    return (
      <div className="relative min-h-full pb-20 animate-fade-up">
        <div className="px-4 pt-2">
          <Skeleton className="h-3 w-56 rounded-full" />
        </div>
        <div className="relative h-64 mt-2 overflow-hidden">
          <Skeleton className="h-full w-full rounded-none" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/25 to-transparent" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="rounded-2xl bg-white/92 border border-white shadow-lg px-4 py-3 flex items-center gap-3">
              <span className="h-7 w-7 rounded-full border-2 border-primary-200 border-t-primary-600 animate-spin" />
              <div className="leading-tight">
                <div className="text-xs font-semibold text-zinc-800">Memuat Detail Paket</div>
                <div className="text-[11px] text-zinc-500">Menyiapkan harga, jadwal, dan fasilitas...</div>
              </div>
            </div>
          </div>
        </div>
        <div className="p-4 space-y-3">
          <Skeleton className="h-7 w-4/5" />
          <Skeleton className="h-3 w-2/5 rounded-full" />
          <div className="grid grid-cols-3 gap-2">
            <Skeleton className="h-14 rounded-xl" />
            <Skeleton className="h-14 rounded-xl" />
            <Skeleton className="h-14 rounded-xl" />
          </div>
          <Skeleton className="h-24 rounded-2xl" />
          <Skeleton className="h-24 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (serviceMode) {
    return <PackCatalog initialServiceSlug={cleanCode} />;
  }

  if (!program && redirectingInvalid) {
    return <div className="p-4 text-xs text-zinc-500">Layanan/paket tidak ditemukan, mengarahkan ke semua paket...</div>;
  }

  return (
    <div className="relative min-h-full pb-28">
      {isFlashSaleActive ? (
        <div className="sticky top-0 z-[90] w-full bg-red-600 text-white border-b border-red-500 shadow-lg">
          <div className="px-3 py-2 space-y-1">
            <div className="flex items-center gap-2">
              <div className="text-[11px] font-extrabold tracking-wide">⚡ FLASH SALE BERAKHIR DALAM</div>
              <span className="shrink-0 rounded-md bg-white/20 px-2 py-0.5 text-[11px] font-extrabold tabular-nums">{flashSaleCountdown}</span>
            </div>
            <div className="text-[10px] text-white/90 truncate">Harga spesial terbatas. Langsung order sekarang atau chat WhatsApp sebelum habis.</div>
          </div>
        </div>
      ) : null}
      <div className="px-4 pt-2">
        <nav aria-label="Breadcrumb" className="text-[11px] text-zinc-500 flex flex-wrap items-center gap-1">
          <Link href="/" className="hover:text-primary-600">Home</Link>
          <span>›</span>
          <Link href="/layanan" className="hover:text-primary-600">{serviceLabel}</Link>
          <span>›</span>
          <span className="text-zinc-700 font-semibold line-clamp-1">{packTitle}</span>
        </nav>
      </div>

      {/* Hero Image */}
      <div className="max-w-7xl mx-auto px-0 sm:px-4 md:px-6 lg:px-8 mt-2">
        <div
          onClick={() => setGalleryOpen(true)}
          className="h-64 md:h-96 lg:h-[420px] cursor-pointer relative overflow-hidden sm:rounded-3xl shadow-md transition-all hover:shadow-lg"
        >
          <Image
            src={heroImageSrc || heroImage}
            alt={packTitle}
            fill
            priority
            unoptimized
            className="object-cover"
            sizes="100vw"
            onError={() => setHeroImageSrc('https://placehold.co/600x400/BE40DD/FFFFFF.png?text=AlfianTour.Com')}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
          {/* Badge */}
          <div className="absolute top-3 left-3">
            {isFlashSaleActive && <span className="badge-sale">⚡ Flash Sale</span>}
          </div>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); void handleSharePack(); }}
            className="absolute top-3 right-3 h-9 px-3 rounded-full bg-white/95 text-zinc-700 border border-white shadow-md text-[11px] font-semibold inline-flex items-center gap-1.5 hover:bg-white"
            title="Share paket"
            aria-label="Share paket"
          >
            ⤴
            <span>Share</span>
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); setGalleryOpen(true); }}
            className="absolute bottom-3 right-3 text-[10px] bg-white/90 text-primary-700 px-3 py-1 rounded-full font-bold shadow"
          >
            🖼️ Semua Foto
          </button>
        </div>
      </div>

      {/* Main Grid Layout */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          
          {/* Left Column (Span 2) */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Title Block */}
            <div className="flex justify-between items-start border-b pb-4">
              <div className="flex-1">
                <h1 className="text-xl md:text-3xl font-extrabold g-text">{packTitle}</h1>
                <p className="text-xs md:text-sm text-zinc-500 mt-2">{periodLabel || packDate} • {packDuration}</p>
              </div>
              <div className="text-right ml-4">
                {shouldShowPromoPrice ? (
                  <div className="text-2xl md:text-3xl font-extrabold text-primary-600">{packPrice}</div>
                ) : null}
                {seatAvailable > 0 ? (
                  <div className="text-[10px] md:text-xs text-emerald-500 font-semibold mt-1">{seatAvailable} {t('seatsLeft')}</div>
                ) : null}
                <div className={`mt-2 inline-flex text-[9px] md:text-xs px-2.5 py-1 rounded-full border font-semibold ${insuranceMode === 'required' ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'}`}>
                  {insuranceModeLabel}
                </div>
              </div>
            </div>

            {/* Seat bar */}
            {seatAvailable > 0 ? (
              <div className="bg-white border rounded-2xl p-4">
                <div className="flex justify-between text-xs font-semibold mb-1.5">
                  <span className="text-zinc-500">{i18nText.seatsAvailable}</span>
                  <span className="text-primary-600">{seatAvailable} kursi tersedia dari {seatCapacity} kursi</span>
                </div>
                <div className="seat-bar">
                  <div className="seat-fill" style={{ width: `${Math.min((seatAvailable / Math.max(1, seatCapacity)) * 100, 100)}%` }} />
                </div>
              </div>
            ) : null}

            {/* Description */}
            <div className="bg-white border rounded-2xl p-6">
              <h3 className="text-sm font-extrabold text-zinc-800 mb-3">Tentang Paket Perjalanan</h3>
              <div
                className="text-sm text-zinc-700 leading-relaxed space-y-2 prose max-w-none"
                dangerouslySetInnerHTML={{ __html: packDescriptionHtml }}
              />
            </div>

            {/* Inclusions */}
            {packIncludes.length > 0 ? (
              <div className="bg-white border rounded-2xl p-6">
                <h3 className="text-sm font-extrabold text-zinc-800 mb-3">{t('packInclude')}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {packIncludes.map((item) => (
                    <div key={item} className="text-xs text-zinc-600 flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full g-main flex-shrink-0" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {/* Facilities */}
            {packageFacilities.length > 0 ? (
              <div className="bg-white border rounded-2xl p-6">
                <h3 className="text-sm font-extrabold text-zinc-800 mb-3">Fasilitas Utama</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {packageFacilities.map((f) => (
                    <div key={f.facilityMasterId} className="text-xs text-zinc-600 flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-sky-500 flex-shrink-0" />
                      <span>{f.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {/* Exclusions */}
            {packExcludes.length > 0 ? (
              <div className="bg-white border rounded-2xl p-6">
                <h3 className="text-sm font-extrabold text-zinc-800 mb-3">{i18nText.notIncluded}</h3>
                <div className="grid grid-cols-1 gap-3">
                  {packExcludes.map((item) => (
                    <div key={item} className="text-xs text-zinc-600 flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-red-400 flex-shrink-0" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {/* Info Perjalanan */}
            {selectedDeparture?.airlineId || selectedDeparture?.departureAirportId || displayConfig.airlineId || displayConfig.departureAirportId || (displayConfig.airportIds && displayConfig.airportIds.length > 0) ? (
              <div className="bg-white border rounded-2xl p-6">
                <h3 className="text-sm font-extrabold text-zinc-800 mb-3">Info Penerbangan & Bandara</h3>
                <div className="space-y-2 text-xs text-zinc-700">
                  {(selectedDeparture?.airlineName || program?.airlineName) ? (
                    <div className="flex items-center gap-2">
                      <span>✈️</span>
                      <span>Maskapai: <strong className="text-zinc-900">{selectedDeparture?.airlineName || program?.airlineName}</strong></span>
                    </div>
                  ) : null}
                  {selectedDeparture?.departureAirportId ? (
                    <div className="flex items-center gap-2">
                      <span>🛫</span>
                      <span>Airport Keberangkatan: <strong className="text-zinc-900">{(selectedDeparture?.departureAirportName || airportNameMap[selectedDeparture.departureAirportId]) ?? `ID ${selectedDeparture.departureAirportId}`}</strong></span>
                    </div>
                  ) : null}
                  {!selectedDeparture?.departureAirportId && displayConfig.departureAirportId ? (
                    <div className="flex items-center gap-2">
                      <span>🛫</span>
                      <span>Airport Keberangkatan: <strong className="text-zinc-900">{airportNameMap[displayConfig.departureAirportId] ?? `ID ${displayConfig.departureAirportId}`}</strong></span>
                    </div>
                  ) : null}
                  {!displayConfig.departureAirportId && displayConfig.airportIds && displayConfig.airportIds.length > 0 ? (
                    <div className="flex items-center gap-2">
                      <span>🛫</span>
                      <span>Airport Keberangkatan: <strong className="text-zinc-900">{airportNameMap[displayConfig.airportIds[0]] ?? `ID ${displayConfig.airportIds[0]}`}</strong></span>
                    </div>
                  ) : null}
                </div>
              </div>
            ) : null}

            {/* Flight info */}
            {Array.isArray(displayConfig.flightInfos) && displayConfig.flightInfos.length > 0 ? (
              <div className="bg-white border rounded-2xl p-6">
                <button
                  type="button"
                  onClick={() => setFlightInfoOpen((v) => !v)}
                  className="w-full flex items-center justify-between"
                >
                  <h3 className="text-sm font-extrabold text-zinc-800">{i18nText.flightInfo}</h3>
                  <span className="text-xs text-zinc-500 font-semibold">{flightInfoOpen ? 'Sembunyikan' : 'Tampilkan'}</span>
                </button>
                {flightInfoOpen ? (
                  <div className="mt-4 space-y-3">
                    {displayConfig.flightInfos.map((f, idx) => (
                      <div key={idx} className="rounded-xl border p-3 text-xs bg-zinc-50/50">
                        <div className="font-bold text-zinc-800">Hari Ke-{f.day}</div>
                        <div className="text-zinc-700 mt-1">Rute Penerbangan: {f.route}</div>
                        <div className="text-zinc-600 mt-0.5">Maskapai: {f.airlineId ? (airlineNameMap[f.airlineId] ?? `ID ${f.airlineId}`) : '-'}</div>
                        {f.note ? <div className="text-zinc-500 mt-1 italic">{f.note}</div> : null}
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            ) : null}

            {/* Itinerary */}
            {itineraryRows.length > 0 ? (
              <div className="bg-white border rounded-2xl p-6">
                <button
                  type="button"
                  onClick={() => setItineraryOpen((v) => !v)}
                  className="w-full flex items-center justify-between"
                >
                  <h3 className="text-sm font-extrabold text-zinc-800">{t('itinerary')}</h3>
                  <span className={`text-[11px] px-3 py-1 rounded-full font-bold border transition-colors ${itineraryOpen ? 'bg-zinc-100 text-zinc-700 border-zinc-300' : 'bg-primary-600 text-white border-primary-600 shadow-sm'}`}>
                    {itineraryOpen ? 'Sembunyikan' : 'Tampilkan'}
                  </span>
                </button>
                {itineraryOpen ? (
                  <div className="space-y-4 mt-4 relative border-l border-zinc-100 pl-4 ml-2">
                    {itineraryLoading ? (
                      <div className="flex items-center gap-2 text-xs text-zinc-500">
                        <span className="inline-block w-4 h-4 border-2 border-zinc-300 border-t-primary-600 rounded-full animate-spin" />
                        <span>Memuat itinerary...</span>
                      </div>
                    ) : itineraryRows.map((item) => (
                      <div key={item.day} className="relative">
                        <div className="absolute -left-[21px] top-1.5 w-2.5 h-2.5 rounded-full g-main ring-4 ring-white" />
                        <div>
                          <div className="text-xs font-bold text-zinc-800">{item.title || `Hari ${item.day}`}</div>
                          <div className="text-xs text-zinc-600 mt-1 leading-relaxed">{item.description || '-'}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            ) : null}

            {/* Mobile Action Buttons (Visible only on mobile/tablet) */}
            <div className="lg:hidden space-y-3 pt-4 border-t">
              {!hasPublishedPrice ? (
                <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs text-amber-700 leading-relaxed">
                  Harga belum dipublikasikan. Tim kami akan bantu cek harga terbaik sesuai tanggal, seat, dan kebutuhan jamaah.
                </div>
              ) : null}
              <div className="flex gap-3">
                <button
                  onClick={toggleWishlist}
                  className="flex-1 border-2 border-primary-200 text-primary-600 py-3.5 rounded-2xl text-xs font-bold hover:bg-primary-50 transition-colors"
                >
                  {wishlisted ? '❤️ Di Wishlist' : '♡ Tambah Wishlist'}
                </button>
                <button
                  onClick={() => void handleHubungiWaClick()}
                  disabled={waActionLoading}
                  className="flex-1 min-h-[52px] g-main text-white px-4 py-3.5 rounded-2xl text-xs font-bold hover:opacity-95 transition-opacity disabled:opacity-60 disabled:cursor-not-allowed active:scale-[0.99]"
                >
                  {waActionLoading ? 'Memproses...' : (hasPublishedPrice ? '💬 Hubungi WA' : '💬 Langsung WhatsApp')}
                </button>
              </div>
            </div>

            {/* Payment Warning Box */}
            <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-6 text-xs text-amber-800 leading-relaxed space-y-2">
              <div className="font-extrabold text-amber-900 flex items-center gap-1.5">
                <span>⚠️</span>
                <span>INFORMASI PENTING PEMBAYARAN</span>
              </div>
              <p>
                Pembayaran hanya sah ke rekening resmi atas nama PT yang tercantum pada halaman informasi pembayaran.
                Selain rekening resmi tersebut, kami tidak bertanggung jawab atas transaksi yang terjadi.
              </p>
              <div className="pt-1">
                <Link href="/information/payment" className="font-bold text-amber-900 underline underline-offset-2 hover:text-amber-950">
                  Lihat Rekening Resmi Pembayaran &rarr;
                </Link>
              </div>
            </div>

          </div>

          {/* Right Column: Sticky Booking Sidebar Widget (Desktop Only) */}
          <div className="hidden lg:block lg:sticky lg:top-24 space-y-6">
            <div className="bg-white rounded-3xl border shadow-md p-6 space-y-6">
              <div>
                <span className="text-[10px] text-zinc-400 font-extrabold uppercase tracking-wider block">Harga Mulai Dari</span>
                {shouldShowPromoPrice ? (
                  <div className="text-3xl font-extrabold text-primary-600 mt-1">{packPrice}</div>
                ) : (
                  <div className="text-lg font-bold text-zinc-400 mt-1">Hubungi WA untuk Harga Terbaik</div>
                )}
                {seatAvailable > 0 ? (
                  <div className="text-xs text-emerald-600 font-bold mt-1.5 flex items-center gap-1">
                    <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    Tersisa {seatAvailable} dari {seatCapacity} kursi
                  </div>
                ) : (
                  <div className="text-xs text-red-500 font-bold mt-1.5">❌ Seat Terjual Habis</div>
                )}
              </div>

              {/* Progress bar */}
              {seatAvailable > 0 ? (
                <div className="h-1.5 w-full rounded-full bg-zinc-200 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                    style={{ width: `${Math.min((seatAvailable / Math.max(1, seatCapacity)) * 100, 100)}%` }}
                  />
                </div>
              ) : null}

              <div className="border-t pt-4 space-y-4">
                {/* Selectors */}
                {departureOptions.length > 1 ? (
                  <div>
                    <label className="block text-[11px] font-extrabold text-zinc-700 uppercase tracking-wide mb-1.5">Jadwal Keberangkatan</label>
                    <select
                      value={departureOptions.length > 0 ? String(selectedDeparture?.id ?? '') : 'period-default'}
                      onChange={(e) => {
                        if (departureOptions.length > 0) {
                          setSelectedDepartureId(e.target.value ? Number(e.target.value) : null);
                        }
                      }}
                      className="w-full border border-zinc-200 rounded-xl px-3 py-2 bg-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      {scheduleOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div>
                    <div className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-wide">Keberangkatan</div>
                    <div className="text-xs font-bold text-zinc-800 mt-1">{selectedScheduleLabel}</div>
                  </div>
                )}

                <div>
                  <label className="block text-[11px] font-extrabold text-zinc-700 uppercase tracking-wide mb-1.5">
                    {orderForm.offerMode === 'all_in' ? 'Tipe Kamar (All-In)' : 'Pilih Tipe Kamar'}
                  </label>
                  <div className="flex gap-2 flex-wrap">
                    {roomTypeOptions.length === 0 ? (
                      <div className="text-[11px] text-amber-700 font-semibold">Belum ada harga kamar terisi</div>
                    ) : roomTypeOptions.map((r) => (
                      <button
                        key={r.value}
                        type="button"
                        onClick={() => setOrderForm((v) => ({ ...v, roomType: r.value }))}
                        className={`px-3 py-1.5 rounded-full border text-[11px] font-bold transition-all ${
                          orderForm.roomType === r.value
                            ? 'bg-primary-600 text-white border-primary-600 shadow-sm'
                            : 'bg-white text-zinc-600 border-zinc-200 hover:bg-zinc-50'
                        }`}
                      >
                        {r.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-extrabold text-zinc-700 uppercase tracking-wide mb-1.5">{i18nText.paxCount}</label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setOrderForm((v) => {
                          const pax = Math.max(1, v.paxCount - 1);
                          const rows = isPicOnlyMode ? [v.jamaahs[0] ?? { fullName: '', gender: '', passportNo: '', birthDate: '', phone: '', email: '' }] : v.jamaahs.slice(0, pax);
                          return { ...v, paxCount: pax, jamaahs: rows };
                        })
                      }
                      className="h-8 w-8 border border-zinc-200 rounded-xl text-sm font-bold flex items-center justify-center hover:bg-zinc-50 active:scale-95 transition-all"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      readOnly
                      value={orderForm.paxCount}
                      className="w-10 border border-zinc-200 rounded-xl py-1 text-center bg-zinc-50 text-xs font-extrabold"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setOrderForm((v) => {
                          const pax = Math.max(1, Math.min(v.paxCount + 1, Math.max(1, seatAvailable)));
                          if (isPicOnlyMode) {
                            return { ...v, paxCount: pax, jamaahs: [v.jamaahs[0] ?? { fullName: '', gender: '', passportNo: '', birthDate: '', phone: '', email: '' }] };
                          }
                          const rows = [...v.jamaahs];
                          while (rows.length < pax) rows.push({ fullName: '', gender: '', passportNo: '', birthDate: '', phone: '', email: '' });
                          return { ...v, paxCount: pax, jamaahs: rows.slice(0, pax) };
                        })
                      }
                      className="h-8 w-8 border border-zinc-200 rounded-xl text-sm font-bold flex items-center justify-center hover:bg-zinc-50 active:scale-95 transition-all"
                    >
                      +
                    </button>
                    <span className="text-[10px] text-zinc-400 font-semibold">pax</span>
                  </div>
                </div>
              </div>

              {/* Dynamic total price summary box */}
              <div className="bg-zinc-50 rounded-2xl p-4 border border-zinc-100 space-y-1.5">
                <div className="flex justify-between text-[11px] text-zinc-500">
                  <span>Harga per orang:</span>
                  <span className="font-semibold text-zinc-800">Rp {promoBasePerPax.toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between text-[11px] text-zinc-500">
                  <span>Jumlah orang:</span>
                  <span className="font-semibold text-zinc-800">{safePaxCount} pax</span>
                </div>
                <div className="flex justify-between text-xs text-zinc-600 border-t pt-1.5 mt-1 font-bold">
                  <span>Subtotal:</span>
                  <span className="font-extrabold text-primary-600 text-sm">Rp {totalPayable.toLocaleString('id-ID')}</span>
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    if (hasPublishedPrice) {
                      trackEvent('init_checkout', undefined, {
                        value: Number(effectiveTotal || 0),
                        currency: 'IDR',
                        paxCount: Number(orderForm.paxCount || 1),
                      });
                      setOrderOpen(true);
                      return;
                    }
                    void handleHubungiWaClick();
                  }}
                  className="w-full g-main text-white py-3.5 rounded-2xl text-xs font-extrabold shadow-md hover:opacity-95 transition-all active:scale-[0.99]"
                >
                  {hasPublishedPrice ? 'Pesan Sekarang' : 'Cek Harga via WhatsApp'}
                </button>
                <button
                  type="button"
                  onClick={() => void handleHubungiWaClick()}
                  disabled={waActionLoading}
                  className="w-full border border-zinc-200 text-zinc-700 bg-white py-3.5 rounded-2xl text-xs font-extrabold shadow-sm hover:bg-zinc-50 transition-all flex items-center justify-center gap-1.5 disabled:opacity-60"
                >
                  💬 Hubungi WA Tanya Paket
                </button>
                <button
                  type="button"
                  onClick={toggleWishlist}
                  className="w-full border border-zinc-200 text-zinc-500 bg-white py-2 rounded-2xl text-[10px] font-bold hover:bg-zinc-50 transition-all"
                >
                  {wishlisted ? '❤️ Di Wishlist' : '♡ Simpan ke Wishlist'}
                </button>
              </div>
            </div>
          </div>

        </div>

        {/* Divider */}
        {(loadingRelated || relatedPrograms.length > 0) && <div className="border-t my-12" />}

        {/* Related Packages (Paket Terkait) */}
        {(loadingRelated || relatedPrograms.length > 0) && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl md:text-2xl font-extrabold text-zinc-800">Paket Terkait</h2>
              <p className="text-xs text-zinc-500 mt-1">Rekomendasi pilihan paket serupa untuk referensi perjalanan Anda.</p>
            </div>
            {loadingRelated ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[...Array(4)].map((_, i) => (
                  <Skeleton key={i} className="h-72 rounded-3xl" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {relatedPrograms.map((p) => {
                  const pPrice = (() => {
                    try {
                      const cfg = typeof p.displayConfigJson === 'string' ? JSON.parse(p.displayConfigJson) as { packageTypePricings?: Array<{ priceIdr?: number }>; priceIdr?: number } : {};
                      const rows = Array.isArray(cfg.packageTypePricings) ? cfg.packageTypePricings : [];
                      const prices = rows.map((x) => Number(x?.priceIdr || 0)).filter((v) => v > 0);
                      if (prices.length > 0) return Math.min(...prices);
                      return Number(cfg.priceIdr || 0);
                    } catch {
                      return 0;
                    }
                  })();
                  const pFirstPackage = p.packages?.[0];
                  const pDepartures = (pFirstPackage?.departures ?? [])
                    .slice()
                    .sort((a, b) => new Date(a.departureDate).getTime() - new Date(b.departureDate).getTime());
                  const nowMs = Date.now();
                  const pFirstUpcomingDeparture =
                    pDepartures.find((d) => new Date(d.departureDate).getTime() >= nowMs && Number(d.seatAvailable || 0) > 0)
                    ?? pDepartures.find((d) => new Date(d.departureDate).getTime() >= nowMs)
                    ?? pDepartures[0];
                  const pAirline = Number(pFirstUpcomingDeparture?.airlineId || 0) > 0
                    ? String(pFirstUpcomingDeparture?.airlineName || '').trim()
                    : '';
                  const pSeats = Number(pFirstUpcomingDeparture?.seatAvailable ?? 10);
                  const pDateText = pFirstUpcomingDeparture?.departureDate
                    ? new Date(pFirstUpcomingDeparture.departureDate).toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric' })
                    : '-';
                  return (
                    <PackCard
                      key={p.id}
                      id={Number(p.id)}
                      title={p.title || p.name}
                      date={pDateText}
                      duration={`${p.durationDays} Hari`}
                      price={formatPrice(pPrice)}
                      priceIdr={pPrice}
                      seats={pSeats}
                      totalSeats={Number(pFirstUpcomingDeparture?.seatCapacity ?? pSeats)}
                      image={getCoverImageUrl(p)}
                      images={[]}
                      airline={pAirline || undefined}
                      showPriceStartLabel
                      onDetail={() => {
                        router.push(`/${locale}/pack/${p.slug || p.id}`);
                      }}
                    />
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Divider */}
        {(loadingProducts || marketplaceProducts.length > 0) && <div className="border-t my-12" />}

        {/* Marketplace Offers (Penawaran Produk Marketplace) */}
        {(loadingProducts || marketplaceProducts.length > 0) && (
          <div className="space-y-6">
            <div className="flex justify-between items-end">
              <div>
                <h2 className="text-xl md:text-2xl font-extrabold text-zinc-800">Penawaran Produk Marketplace</h2>
                <p className="text-xs text-zinc-500 mt-1">Perlengkapan ibadah, kurma premium, air zam-zam, dan oleh-oleh khas Umroh & Haji.</p>
              </div>
              <Link
                href={`/${locale}/toko`}
                className="text-xs font-bold text-primary-600 hover:text-primary-700 underline underline-offset-4 shrink-0"
              >
                Lihat Semua Produk &rarr;
              </Link>
            </div>
            {loadingProducts ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-64 rounded-2xl animate-pulse" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {marketplaceProducts.map((product) => (
                  <Link
                    key={product.fileId}
                    href={`/${locale}/toko/${product.fileId}${refUsername ? `@${encodeURIComponent(refUsername)}` : ''}`}
                    className="group flex flex-col overflow-hidden rounded-2xl border bg-white shadow-sm transition-all hover:shadow-md hover:border-primary-200"
                  >
                    <div className="relative h-44 bg-zinc-100 overflow-hidden">
                      <img
                        src={getProductImageUrl(product.mainImageUrl)}
                        alt={product.name || 'Produk'}
                        className="h-full w-full object-cover transition-transform duration-350 group-hover:scale-105"
                        onError={(e) => {
                          e.currentTarget.src = 'https://placehold.co/600x400/BE40DD/FFFFFF.png?text=AlfianTour.Com';
                        }}
                      />
                    </div>
                    <div className="space-y-1 p-3 flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-start gap-2">
                          <div className="text-sm font-bold text-zinc-800 line-clamp-2 leading-tight group-hover:text-primary-700">
                            {product.name}
                          </div>
                          <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[9px] font-semibold ${
                            String(product.productType || '').toUpperCase() === 'AFFILIATE_PRODUCT'
                              ? 'bg-amber-50 text-amber-700 border-amber-200'
                              : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          }`}>
                            {String(product.productType || '').toUpperCase() === 'AFFILIATE_PRODUCT' ? 'Marketplace' : 'Produk Resmi'}
                          </span>
                        </div>
                        <div className="text-[10px] text-zinc-500 mt-1">
                          {product.category || '-'} {product.marketplace ? `• ${product.marketplace}` : ''}
                        </div>
                      </div>
                      <div className="text-sm font-extrabold text-primary-600 mt-2">
                        Rp {Number(product.price || 0).toLocaleString('id-ID')}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}

      </div>

      {/* Floating CTA (Visible only on mobile/tablet) */}
      {seatAvailable > 0 ? (
      <div className="fixed bottom-[10.25rem] right-[max(0.75rem,calc((100vw-430px)/2+0.75rem))] z-30 pointer-events-none lg:hidden">
        <div className="flex flex-col items-end gap-1.5">
          <span className="pointer-events-auto text-[11px] leading-none font-bold text-purple-700 bg-white/95 border border-purple-200 rounded-full px-2.5 py-1 shadow">
            {hasPublishedPrice ? 'Order here' : 'WhatsApp'}
          </span>
          <button
            onClick={() => {
              if (hasPublishedPrice) {
                trackEvent('init_checkout', undefined, {
                  value: Number(effectiveTotal || 0),
                  currency: 'IDR',
                  paxCount: Number(orderForm.paxCount || 1),
                });
                setOrderOpen(true);
                return;
              }
              void handleHubungiWaClick();
            }}
            aria-label={hasPublishedPrice ? 'Order here' : 'Hubungi WhatsApp'}
            className="pointer-events-auto w-12 h-12 rounded-full bg-purple-600 hover:bg-purple-700 text-white shadow-xl flex items-center justify-center animate-[pulse_2.2s_ease-in-out_infinite]"
          >
            <svg
              viewBox="0 0 24 24"
              className="w-5 h-5 text-white"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <circle cx="9" cy="20" r="1" />
              <circle cx="18" cy="20" r="1" />
              <path d="M2 3h2l2.4 11.2a2 2 0 0 0 2 1.6h8.8a2 2 0 0 0 2-1.6L21 7H7" />
            </svg>
          </button>
        </div>
      </div>
      ) : null}

      {/* Order Modal */}
      {orderOpen ? (
      <ModalShell open={orderOpen} onBackdropClick={() => setOrderOpen(false)} zIndexClass="z-[1300]" overlayClassName="bg-black/50">
          <div className="bg-white w-full max-w-md mx-auto rounded-3xl p-4 max-h-[76vh] flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-extrabold">{i18nText.orderForm}</h2>
              <button onClick={() => setOrderOpen(false)} className="text-zinc-500 text-lg">✕</button>
            </div>
            <div className="mb-3 rounded-xl bg-amber-50 border border-amber-200 px-3 py-2">
              <div className="text-[10px] text-amber-700 font-semibold">Jumlah Total</div>
              <div className="text-sm font-extrabold text-amber-800">Rp {Number(effectiveTotal || 0).toLocaleString('id-ID')}</div>
            </div>

            <div className="space-y-2 text-xs overflow-y-auto pr-1 [scrollbar-width:thin]">
              <label className="block">
                <div className="mb-1 font-semibold">Pilih Jenis Pemesanan</div>
                <select value={orderForm.offerMode} onChange={(e) => setOrderForm((v) => ({ ...v, offerMode: e.target.value as 'all_in' | 'custom' }))} className="w-full border rounded-xl px-3 py-2 bg-white">
                  <option value="all_in">Paket All-In (siap berangkat)</option>
                  <option value="custom">Custom dari Harga Promo</option>
                </select>
                {orderForm.offerMode === 'all_in' ? (
                  <div className="mt-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-[11px] text-emerald-700">
                    Paket All-In dipilih. Tinggal berangkat, semua kebutuhan utama perjalanan sudah dirangkum dalam satu harga terbaik.
                  </div>
                ) : null}
              </label>

              <label className="block">
                <div className="mb-1 font-semibold">{i18nText.paxCount}</div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setOrderForm((v) => {
                        const pax = Math.max(1, v.paxCount - 1);
                        const rows = isPicOnlyMode ? [v.jamaahs[0] ?? { fullName: '', gender: '', passportNo: '', birthDate: '', phone: '', email: '' }] : v.jamaahs.slice(0, pax);
                        return { ...v, paxCount: pax, jamaahs: rows };
                      })
                    }
                    className="h-10 w-10 border rounded-xl text-lg font-bold"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    readOnly
                    min={1}
                    max={Math.max(1, seatAvailable)}
                    value={orderForm.paxCount}
                    className="w-full border rounded-xl px-3 py-2 text-center bg-zinc-50"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setOrderForm((v) => {
                        const pax = Math.max(1, Math.min(v.paxCount + 1, Math.max(1, seatAvailable)));
                        if (isPicOnlyMode) {
                          return { ...v, paxCount: pax, jamaahs: [v.jamaahs[0] ?? { fullName: '', gender: '', passportNo: '', birthDate: '', phone: '', email: '' }] };
                        }
                        const rows = [...v.jamaahs];
                        while (rows.length < pax) rows.push({ fullName: '', gender: '', passportNo: '', birthDate: '', phone: '', email: '' });
                        return { ...v, paxCount: pax, jamaahs: rows.slice(0, pax) };
                      })
                    }
                    className="h-10 w-10 border rounded-xl text-lg font-bold"
                  >
                    +
                  </button>
                </div>
                <div className="mt-1 text-[11px] text-zinc-500">{i18nText.maxSeat}: {seatAvailable}</div>
              </label>

              <label className="block">
                <div className="mb-1 font-semibold">Pilih Kelas Paket Umroh</div>
                {orderForm.offerMode === 'all_in' ? (
                  <div className="w-full border rounded-xl px-3 py-2 bg-zinc-50 text-zinc-800">
                    {selectedPackageTypeRow
                      ? `${getPackageTypeName(selectedPackageTypeRow.packageTypeId)}`
                      : 'Belum ada kelas paket default All-In'}
                  </div>
                ) : (
                  <select
                    value={orderForm.selectedPackageTypeId || ''}
                    onChange={(e) => setOrderForm((v) => ({ ...v, selectedPackageTypeId: Number(e.target.value || 0) }))}
                    className="w-full border rounded-xl px-3 py-2 bg-white"
                    disabled={packageTypeRowsForOfferMode.length === 0}
                  >
                    {packageTypeRowsForOfferMode.length === 0 ? (
                      <option value="">Belum ada Package Type di paket ini</option>
                    ) : packageTypeRowsForOfferMode.map((r) => (
                      <option key={r.packageTypeId} value={r.packageTypeId}>
                        {getPackageTypeName(r.packageTypeId)}
                        {r.packageTypeId === allInDefaultPackageTypeId ? ' (Default All-In)' : ''}
                        {' • Tersedia'}
                      </option>
                    ))}
                  </select>
                )}
                {allInDefaultPackageTypeId > 0 ? (
                  <div className="mt-1 text-[11px] text-emerald-700">
                    Default All-In: <span className="font-semibold">{getPackageTypeName(allInDefaultPackageTypeId)}</span>
                  </div>
                ) : null}
                {orderForm.offerMode === 'all_in' ? (
                  <div className="text-[11px] text-zinc-500 mt-0.5">Mode All-In mengikuti kelas default dari Kelola Paket.</div>
                ) : null}
              </label>

              {departureOptions.length > 1 ? (
                <label className="block">
                  <div className="mb-1 font-semibold">Pilih Jadwal Keberangkatan</div>
                  <select
                    value={departureOptions.length > 0 ? String(selectedDeparture?.id ?? '') : 'period-default'}
                    onChange={(e) => {
                      if (departureOptions.length > 0) {
                        setSelectedDepartureId(e.target.value ? Number(e.target.value) : null);
                      }
                    }}
                    className="w-full border rounded-xl px-3 py-2 bg-white"
                  >
                    {scheduleOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </label>
              ) : (
                <div className="rounded-xl border px-3 py-2 text-[11px] bg-zinc-50">
                  <div className="font-semibold mb-0.5">Keberangkatan</div>
                  <div>{selectedScheduleLabel}</div>
                </div>
              )}

              <label className="block">
                <div className="mb-1 font-semibold">Durasi Program</div>
                <div className="w-full border rounded-xl px-3 py-2 bg-zinc-50 text-zinc-700">
                  {packDuration}
                </div>
              </label>

              <label className="block">
                <div className="mb-1 font-semibold">Bandara Keberangkatan Jamaah</div>
                <div className="w-full border rounded-xl px-3 py-2 bg-zinc-50 text-zinc-700">
                  {orderForm.departureAirport || '-'}
                </div>
              </label>

              <div className="rounded-xl border px-3 py-2 bg-white">
                <div className="mb-1 font-semibold">Fasilitas Paket (dari Master)</div>
                {packageFacilities.length > 0 ? (
                  <div className="space-y-1 text-[11px] text-zinc-700">
                    {packageFacilities.map((f) => (
                      <div key={f.facilityMasterId}>• {f.name}</div>
                    ))}
                  </div>
                ) : (
                  <div className="text-[11px] text-zinc-500">Belum ada fasilitas dipilih.</div>
                )}
              </div>

              {orderForm.offerMode !== 'custom' ? (
                allInHotelNames.length > 0 ? (
                <div className="rounded-xl border px-3 py-2 bg-zinc-50">
                  <div className="mb-1 font-semibold">Daftar Hotel Sesuai Paket (All-In)</div>
                  <div className="space-y-1 text-[11px] text-zinc-700">
                    {allInHotelNames.map((h, idx) => <div key={`${h}-${idx}`}>• {h}</div>)}
                  </div>
                </div>
                ) : null
              ) : (
                <div className="rounded-xl border px-3 py-2 bg-white">
                  <div className="mb-1 font-semibold">Pilih Hotel Menginap (Custom)</div>
                  <div className="max-h-32 overflow-y-auto space-y-1">
                    {customHotelOptions.map((h) => (
                      <label key={h.id} className="flex items-center justify-between gap-2 text-xs border rounded-xl px-3 py-2">
                        <span>{h.name}</span>
                        <input
                          type="checkbox"
                          checked={orderForm.selectedHotelIds.includes(h.id)}
                          onChange={(e) => setOrderForm((v) => {
                            const nextIds = e.target.checked
                              ? [...v.selectedHotelIds, h.id]
                              : v.selectedHotelIds.filter((id) => id !== h.id);
                            const uniqIds = Array.from(new Set(nextIds));
                            const nextNames = uniqIds.map((id) => hotelNameMap[id]).filter((x): x is string => Boolean(x));
                            return {
                              ...v,
                              selectedHotelIds: uniqIds,
                              makkahHotel: nextNames[0] ?? '',
                              madinahHotel: nextNames[1] ?? '',
                            };
                          })}
                        />
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {selectedStayRows.length > 0 ? (
                <div className="rounded-xl border px-3 py-2 bg-white">
                  <div className="mb-1 font-semibold">Daftar Hotel Sesuai Jadwal</div>
                  <div className="space-y-2">
                    {selectedStayRows.map((h, idx) => (
                      <div key={`${h.hotelId}-${idx}`} className="border rounded-xl px-3 py-2 text-[11px]">
                        <div className="font-semibold">{h.hotelName}</div>
                        <div className="text-zinc-600">Malam menginap: {Number(h.nights || 0)} malam</div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              <label className="block">
                <div className="mb-1 font-semibold">{i18nText.flightInfo}</div>
                {selectedDepartureAirlineNames.length > 0 ? (
                  <div className="w-full border rounded-xl px-3 py-2 bg-zinc-50 text-zinc-700">
                    <div className="text-[11px] font-semibold mb-1">Maskapai yang akan ditumpangi</div>
                    <div className="space-y-1 text-[11px]">
                      {selectedDepartureAirlineNames.map((name, idx) => <div key={`${name}-${idx}`}>• {name}</div>)}
                    </div>
                  </div>
                ) : (
                  <div className="w-full border rounded-xl px-3 py-2 bg-zinc-50 text-zinc-500 text-[11px]">
                    Belum ada maskapai diatur untuk jadwal ini.
                  </div>
                )}
              </label>

                <div className="rounded-xl border px-3 py-2 bg-zinc-50">
                  <div className="mb-1 font-semibold">{orderForm.offerMode === 'all_in' ? 'Tipe Kamar (All-In)' : 'Pilih Tipe Kamar'}</div>
                  <div className="grid grid-cols-1 gap-1">
                  {roomTypeOptions.length === 0 ? (
                    <div className="text-[11px] text-amber-700">Belum ada harga tipe kamar terisi untuk jadwal ini.</div>
                  ) : roomTypeOptions.map((r) => (
                    <label key={r.value} className="inline-flex items-center gap-2 text-[12px] text-zinc-700">
                      <input
                        type="radio"
                        name="roomType"
                        checked={orderForm.roomType === r.value}
                        onChange={() => setOrderForm((v) => ({ ...v, roomType: r.value }))}
                      />
                      <span>{r.label}</span>
                    </label>
                  ))}
                  </div>
                <div className="mt-1 text-[11px] text-zinc-500">
                  Jumlah orang diatur dari "{i18nText.paxCount}". Pilihan kamar mengubah harga per orang.
                </div>
              </div>

              <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2">
                <div className="text-[11px] text-emerald-700">Harga per orang ({activeRoomTypeLabel}): <span className="font-semibold">Rp {promoBasePerPax.toLocaleString('id-ID')}</span></div>
                <div className="text-sm font-extrabold text-emerald-800 mt-0.5">Total Bayar: Rp {totalPayable.toLocaleString('id-ID')}</div>
              </div>

              {isJamaahDeferredMode ? (
                <div className="rounded-xl border border-sky-200 bg-sky-50 px-3 py-2 text-[11px] text-sky-700">
                  Data jamaah tidak perlu diisi saat ini. Pengisian dilakukan setelah checkout.
                </div>
              ) : isPicOnlyMode ? (
                <div className="space-y-2">
                  <div className="font-semibold">Data PIC (Penanggung Jawab)</div>
                  <div className="border rounded-xl p-2 grid grid-cols-1 gap-2">
                    <input
                      className="border rounded-lg px-2 py-1.5"
                      placeholder="Nama PIC"
                      value={orderForm.jamaahs[0]?.fullName ?? ''}
                      onChange={(e) =>
                        setOrderForm((v) => {
                          const first = v.jamaahs[0] ?? { fullName: '', gender: '', passportNo: '', birthDate: '', phone: '', email: '' };
                          return { ...v, jamaahs: [{ ...first, fullName: e.target.value }] };
                        })
                      }
                    />
                    <input
                      className="border rounded-lg px-2 py-1.5"
                      placeholder="No HP PIC"
                      value={orderForm.jamaahs[0]?.phone ?? ''}
                      onChange={(e) =>
                        setOrderForm((v) => {
                          const first = v.jamaahs[0] ?? { fullName: '', gender: '', passportNo: '', birthDate: '', phone: '', email: '' };
                          return { ...v, jamaahs: [{ ...first, phone: e.target.value }] };
                        })
                      }
                    />
                    <input
                      className="border rounded-lg px-2 py-1.5"
                      placeholder="Email PIC (opsional)"
                      value={orderForm.jamaahs[0]?.email ?? ''}
                      onChange={(e) =>
                        setOrderForm((v) => {
                          const first = v.jamaahs[0] ?? { fullName: '', gender: '', passportNo: '', birthDate: '', phone: '', email: '' };
                          return { ...v, jamaahs: [{ ...first, email: e.target.value }] };
                        })
                      }
                    />
                  </div>
                </div>
              ) : (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="font-semibold">{jamaahSectionTitle}</div>
                  <button
                    type="button"
                    onClick={() =>
                      setOrderForm((v) => ({
                        ...v,
                        jamaahs: [...v.jamaahs, { fullName: '', gender: '', passportNo: '', birthDate: '', phone: '', email: '' }],
                        paxCount: v.paxCount + 1,
                      }))
                    }
                    className="text-[11px] border rounded-xl px-2 py-1"
                  >
                    + Tambah Jamaah
                  </button>
                </div>
                {orderForm.jamaahs.map((j, idx) => (
                  <div key={idx} className="border rounded-xl p-2 grid grid-cols-2 gap-2">
                    <input
                      className="border rounded-lg px-2 py-1.5"
                      placeholder={`Nama Jamaah #${idx + 1}`}
                      value={j.fullName}
                      onChange={(e) => setOrderForm((v) => ({ ...v, jamaahs: v.jamaahs.map((x, i) => (i === idx ? { ...x, fullName: e.target.value } : x)) }))}
                    />
                    <select
                      className="border rounded-lg px-2 py-1.5 bg-white"
                      value={j.gender}
                      onChange={(e) => setOrderForm((v) => ({ ...v, jamaahs: v.jamaahs.map((x, i) => (i === idx ? { ...x, gender: e.target.value } : x)) }))}
                    >
                      <option value="">Gender</option>
                      <option value="L">Laki-laki</option>
                      <option value="P">Perempuan</option>
                    </select>
                    <input
                      className="border rounded-lg px-2 py-1.5"
                      placeholder="No Passport"
                      value={j.passportNo}
                      disabled={isJamaahMinimalMode || isJamaahDeferredMode}
                      onChange={(e) => setOrderForm((v) => ({ ...v, jamaahs: v.jamaahs.map((x, i) => (i === idx ? { ...x, passportNo: e.target.value } : x)) }))}
                    />
                    <input
                      type="date"
                      className="border rounded-lg px-2 py-1.5"
                      value={j.birthDate}
                      disabled={isJamaahDeferredMode}
                      onChange={(e) => setOrderForm((v) => ({ ...v, jamaahs: v.jamaahs.map((x, i) => (i === idx ? { ...x, birthDate: e.target.value } : x)) }))}
                    />
                    <input
                      className="border rounded-lg px-2 py-1.5"
                      placeholder="No HP"
                      value={j.phone}
                      onChange={(e) => setOrderForm((v) => ({ ...v, jamaahs: v.jamaahs.map((x, i) => (i === idx ? { ...x, phone: e.target.value } : x)) }))}
                    />
                    <div className="flex gap-1">
                      <input
                        className="border rounded-lg px-2 py-1.5 w-full"
                        placeholder="Email"
                        value={j.email}
                        onChange={(e) => setOrderForm((v) => ({ ...v, jamaahs: v.jamaahs.map((x, i) => (i === idx ? { ...x, email: e.target.value } : x)) }))}
                      />
                      {orderForm.jamaahs.length > 1 && !isPicOnlyMode ? (
                        <button
                          type="button"
                          className="border rounded-lg px-2 text-red-600"
                          onClick={() =>
                            setOrderForm((v) => {
                              const next = v.jamaahs.filter((_, i) => i !== idx);
                              return { ...v, jamaahs: next, paxCount: Math.max(1, next.length) };
                            })
                          }
                        >
                          ✕
                        </button>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
              )}

              <label className="block">
                <div className="mb-1 font-semibold">{i18nText.pickInsurance}</div>
                <select value={orderForm.selectedInsuranceTypeId || ''} onChange={(e) => setOrderForm((v) => ({ ...v, selectedInsuranceTypeId: Number(e.target.value || 0) }))} className="w-full border rounded-xl px-3 py-2 bg-white">
                  {insuranceMode === 'optional' ? <option value="">Tanpa Asuransi</option> : null}
                  {insuranceRows.map((x) => <option key={x.insuranceTypeId} value={x.insuranceTypeId}>{x.name}</option>)}
                </select>
                <div className="mt-1 text-[11px] text-zinc-500">
                  {insuranceMode === 'required' ? 'Asuransi wajib dipilih untuk paket ini.' : 'Asuransi bersifat opsional, boleh tanpa asuransi.'}
                </div>
                {selectedInsurance?.providerName ? <div className="mt-1 text-[11px] text-zinc-500">Provider: {selectedInsurance.providerName}</div> : null}
                {insuranceDetailHref ? (
                  <div className="mt-1">
                    <a
                      href={insuranceDetailHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] text-blue-700 underline underline-offset-2"
                    >
                      Unduh/Buka dokumen detail asuransi
                    </a>
                  </div>
                ) : null}
                {selectedInsurance && selectedInsuranceInfo ? (
                  <div className="mt-2 rounded-xl border border-sky-200 bg-sky-50 px-3 py-2 text-[11px] text-sky-800 space-y-1">
                    <div className="font-semibold">Manfaat & Jaminan Asuransi</div>
                    {selectedInsuranceInfo.providerName ? <div>Provider: {selectedInsuranceInfo.providerName}</div> : null}
                    {Number(selectedInsuranceInfo.coverageAmount || 0) > 0 ? <div>Nilai Pertanggungan: Rp {Number(selectedInsuranceInfo.coverageAmount || 0).toLocaleString('id-ID')}</div> : null}
                    {Number(selectedInsuranceInfo.coverageDays || 0) > 0 ? <div>Masa Berlaku: {Number(selectedInsuranceInfo.coverageDays || 0)} hari</div> : null}
                    {selectedInsuranceInfo.coverageDetails ? <div>Cakupan: {selectedInsuranceInfo.coverageDetails}</div> : <div>Cakupan detail belum tersedia.</div>}
                  </div>
                ) : null}
                {selectedInsurance ? (
                  <div className="mt-2">
                    <div className="mb-1 text-[11px] font-semibold">Jumlah yang Diasuransikan</div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          setOrderForm((v) => ({ ...v, insurancePaxCount: Math.max(1, Number(v.insurancePaxCount || 1) - 1) }))
                        }
                        className="h-9 w-9 border rounded-lg text-base font-bold"
                      >
                        -
                      </button>
                      <input
                        type="number"
                        readOnly
                        min={1}
                        max={safePaxCount}
                        value={insurancePax || Math.max(1, safePaxCount)}
                        className="w-full border rounded-lg px-3 py-2 text-center bg-zinc-50"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setOrderForm((v) => ({ ...v, insurancePaxCount: Math.min(safePaxCount, Number(v.insurancePaxCount || 1) + 1) }))
                        }
                        className="h-9 w-9 border rounded-lg text-base font-bold"
                      >
                        +
                      </button>
                    </div>
                    <div className="mt-1 text-[11px] text-zinc-500">Default mengikuti jumlah orang berangkat ({safePaxCount} orang).</div>
                  </div>
                ) : null}
              </label>

              <div className="grid grid-cols-2 gap-2">
                <label className="block">
                  <div className="mb-1 font-semibold">Pilih Include Tambahan (Berbiaya)</div>
                  {includeRows.length > 0 ? (
                    <div className="space-y-1">
                      {includeRows.map((x) => (
                        <label key={x.id} className="flex items-center justify-between gap-2 text-xs border rounded-xl px-3 py-2">
                          <span>{x.name}</span>
                          <input
                            type="checkbox"
                            checked={orderForm.selectedIncludeIds.includes(x.id)}
                            onChange={(e) => setOrderForm((v) => ({
                              ...v,
                              selectedIncludeIds: e.target.checked ? [...v.selectedIncludeIds, x.id] : v.selectedIncludeIds.filter((id) => id !== x.id)
                            }))}
                          />
                        </label>
                      ))}
                    </div>
                  ) : <div className="text-[11px] text-zinc-500 border rounded-xl px-3 py-2">Tidak ada include berbiaya.</div>}
                </label>
                <label className="block">
                  <div className="mb-1 font-semibold">Pilih Exclude Tambahan (Berbiaya)</div>
                  {excludeRows.length > 0 ? (
                    <div className="space-y-1">
                      {excludeRows.map((x) => (
                        <label key={x.id} className="flex items-center justify-between gap-2 text-xs border rounded-xl px-3 py-2">
                          <span>{x.name}</span>
                          <input
                            type="checkbox"
                            checked={orderForm.selectedExcludeIds.includes(x.id)}
                            onChange={(e) => setOrderForm((v) => ({
                              ...v,
                              selectedExcludeIds: e.target.checked ? [...v.selectedExcludeIds, x.id] : v.selectedExcludeIds.filter((id) => id !== x.id)
                            }))}
                          />
                        </label>
                      ))}
                    </div>
                  ) : <div className="text-[11px] text-zinc-500 border rounded-xl px-3 py-2">Tidak ada exclude berbiaya.</div>}
                </label>
              </div>

              <div className="rounded-xl border bg-zinc-50 px-3 py-2">
                <button type="button" onClick={() => setVoucherOpen((v) => !v)} className="w-full flex items-center justify-between text-left">
                  <div className="text-[11px] font-semibold">Voucher / Kode Promo</div>
                  <div className="text-[11px] text-zinc-500">{voucherOpen ? 'Sembunyikan' : 'Tampilkan'}</div>
                </button>
                {voucherOpen ? (
                  <div className="mt-2 space-y-2">
                    {voucherRules.length === 0 ? (
                      <div className="text-[11px] text-zinc-500">Saat ini tidak ada voucher aktif untuk paket ini.</div>
                    ) : null}
                    <div className="grid grid-cols-3 gap-2">
                      <input
                        value={orderForm.voucherCode}
                        onChange={(e) => {
                          const next = e.target.value.toUpperCase().trim();
                          setOrderForm((v) => ({ ...v, voucherCode: next }));
                          if (next !== appliedVoucherCode) {
                            setAppliedVoucherCode('');
                            setVoucherNotice('');
                          }
                        }}
                        className="col-span-2 border rounded-xl px-3 py-2"
                        placeholder="Masukkan voucher"
                      />
                      <button
                        type="button"
                        disabled={voucherRules.length === 0}
                        onClick={() => {
                          const code = String(orderForm.voucherCode || '').trim().toUpperCase();
                          if (!code) {
                            setAppliedVoucherCode('');
                            setVoucherNotice('Masukkan kode voucher dulu.');
                            return;
                          }
                          const found = voucherRules.find((x) => x.code.trim().toLowerCase() === code.toLowerCase());
                          if (!found) {
                            setAppliedVoucherCode('');
                            setVoucherNotice('Voucher tidak valid atau tidak aktif.');
                            return;
                          }
                          setAppliedVoucherCode(code);
                          setVoucherNotice('Voucher berhasil di-claim.');
                        }}
                        className="border rounded-xl px-2 py-2 text-xs font-semibold disabled:opacity-50"
                      >
                        Check & Claim
                      </button>
                    </div>
                    {voucherNotice ? <div className="text-[11px] text-zinc-600">{voucherNotice}</div> : null}
                    {appliedVoucherCode ? <div className="text-[11px] text-emerald-700">Voucher aktif: {appliedVoucherCode}</div> : null}
                  </div>
                ) : null}
              </div>

              <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2">
                <div className="text-[11px] text-emerald-700">Subtotal Paket: Rp {totalPayable.toLocaleString('id-ID')}</div>
                {cappedDiscount > 0 ? (
                  <div className="text-[11px] text-emerald-700">
                    Diskon{displayConfig.discountLabel ? ` (${displayConfig.discountLabel})` : ''}: -Rp {cappedDiscount.toLocaleString('id-ID')}
                  </div>
                ) : null}
                {voucherAmount > 0 ? <div className="text-[11px] text-emerald-700">Voucher: -Rp {voucherAmount.toLocaleString('id-ID')}</div> : null}
                <div className="text-sm font-extrabold text-emerald-800 mt-0.5">Estimasi Total Akhir: Rp {effectiveTotal.toLocaleString('id-ID')}</div>
              </div>

              <label className="block">
                <div className="mb-1 font-semibold">Catatan Tambahan</div>
                <textarea value={orderForm.notes} onChange={(e) => setOrderForm((v) => ({ ...v, notes: e.target.value }))} className="w-full border rounded-xl px-3 py-2 min-h-16" placeholder="Permintaan khusus..." />
              </label>

              <div className="rounded-xl border bg-zinc-50 px-3 py-2">
                <button type="button" onClick={() => setOrderTermsOpen((v) => !v)} className="w-full flex items-center justify-between text-left">
                  <div className="text-[11px] font-semibold">{i18nText.terms}</div>
                  <div className="text-[11px] text-zinc-500">{orderTermsOpen ? 'Sembunyikan' : 'Tampilkan'}</div>
                </button>
                {orderTermsOpen ? (
                  <div className="mt-1 text-[11px] text-zinc-600 whitespace-pre-wrap max-h-28 overflow-y-auto">
                    {termsContent || 'Konten syarat & ketentuan belum tersedia untuk paket ini.'}
                  </div>
                ) : null}
                <label className="mt-2 inline-flex items-center gap-2 text-[11px]">
                  <input type="checkbox" checked={agreeTerms} onChange={(e) => setAgreeTerms(e.target.checked)} />
                  {i18nText.agreeTerms}
                </label>
              </div>
            </div>

            <div className="mt-3 pt-3 border-t bg-white sticky bottom-0 grid grid-cols-2 gap-2">
              <button
                onClick={() => setOrderOpen(false)}
                className="w-full border border-zinc-300 text-zinc-700 py-3 rounded-2xl text-sm font-bold"
              >
                Cancel
              </button>
              <button onClick={async () => {
                if (!hasPublishedPrice) {
                  await handleHubungiWaClick();
                  return;
                }
                await submitOrderDirect();
              }} disabled={submitLoading} className="w-full g-main text-white py-3 rounded-2xl text-sm font-extrabold disabled:opacity-60">
                {submitLoading ? 'Memproses...' : (hasPublishedPrice ? i18nText.previewOrder : 'Cek Harga via WhatsApp')}
              </button>
            </div>
          </div>
      </ModalShell>
      ) : null}

      <GalleryModal
        open={galleryOpen}
        onClose={() => setGalleryOpen(false)}
        images={allImages}
        mode="stack"
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbData) }}
      />
    </div>
  );
}
