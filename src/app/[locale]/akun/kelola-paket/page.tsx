'use client';

import { useEffect, useMemo, useState } from 'react';
import { Link } from '@/i18n/routing-patch';
import { API_BASE_URL, apiDelete, apiGet, apiPost, apiPut, getAuthToken } from '@/lib/api-client';
import { useToast } from '@/components/Toast';
import { SectionCard } from '@/components/dynamic/SectionCard';
import { FormField } from '@/components/dynamic/FormField';
import { ProgramListCard } from '@/components/paket/ProgramListCard';
import { getAuthState } from '@/lib/auth';
import { ModalShell } from '@/components/ui/ModalShell';
import { InlineConfirmOverlay } from '@/components/ui/InlineConfirmOverlay';

type RefItem = { id: number; name: string; content?: string; providerName?: string; basePremium?: number };
type LabelTagItem = { id: number; name: string; code?: string; isPromotional?: boolean };
type ServiceItem = { id: number; name: string; slug?: string; isActive?: boolean; parentCategoryId?: number | null };
type DurationTypeItem = { id: number; name: string; defaultDays: number; defaultNights: number; displayFormat?: string };
type DurationTypeEditForm = {
  id: number;
  name: string;
  defaultDays: number;
  defaultNights: number;
  displayFormat: string;
  description: string;
  durationSortOrder: number;
  code: string;
};
type ProgramImage = { id: number; url: string; isCover: boolean; sortOrder: number; createdAt: string };
type ItineraryItem = { day: number; title: string; description: string };
type FlightInfoItem = { day: number; route: string; airlineId?: number; note?: string };
type ProgramDisplayConfig = {
  packageTypeId?: number;
  priceIdr?: number;
  packageTypePricings?: Array<{ id: string; packageTypeId: number; priceIdr: number; packageTypeName?: string; isAllInDefault?: boolean }>;
  seoTitle?: string;
  seoDescription?: string;
  priceUsd?: number;
  priceSar?: number;
  departureDate?: string;
  returnDate?: string;
  airlineId?: number;
  departureAirportId?: number;
  itineraries?: ItineraryItem[];
  itineraryByDeparture?: Array<{
    departureDate: string;
    returnDate?: string;
    items: ItineraryItem[];
  }>;
  flightInfos?: FlightInfoItem[];
  departureAirlineMappings?: Array<{ departureDate: string; airlineIds: number[] }>;
  departureHotelMappings?: Array<{
    departureDate: string;
    hotelIds: number[];
    hotelStays: Array<{ hotelId: number; nights: number }>;
    hotelRoomPrices?: Array<{ hotelId: number; roomTypeMasterId: number; price: number }>;
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
  referralCommission?: {
    isActive: boolean;
    type: 'fixed' | 'percent';
    value: number;
    minPayout?: number;
    note?: string;
  };
  jamaahDataMode?: 'required_full' | 'optional_after_checkout' | 'pic_only' | 'required_minimal';
  flashSaleEndsAt?: string;
  flashSaleEnabled?: boolean;
  facilities?: Array<{ facilityMasterId: number; name: string; icon?: string }>;
};
type ProgramPackageRef = { id: number; packageClassMasterId?: number; packageClassName?: string };
type DepartureRow = {
  departureDate: string;
  returnDate?: string;
  seatCapacity: number;
  seatAvailable: number;
  packageTypeId?: number;
  airlineId?: number;
  airlineIds?: number[];
  departureAirportId?: number;
  makkahHotelId?: number;
  madinahHotelId?: number;
  hotelIds?: number[];
  hotelStays?: Array<{ hotelId: number; nights: number }>;
  hotelRoomPrices?: Array<{ hotelId: number; roomTypeMasterId: number; price: number }>;
  hotelOccupancyPrices?: Array<{ hotelId: number; priceQuad?: number; priceTripleAdditional?: number; priceDoubleAdditional?: number }>;
  priceQuad?: number;
  priceTripleAdditional?: number;
  priceDoubleAdditional?: number;
  customAdditionalPrice?: number;
};
type PkgForm = {
  id?: number;
  packageClassMasterId: number;
  priceQuad: number;
  priceTripleAdditional: number;
  priceDoubleAdditional: number;
  makkahHotelId: number;
  makkahNights: number;
  madinahHotelId: number;
  madinahNights: number;
};

type ProgramForm = {
  id?: number;
  metadataRaw?: string;
  name: string;
  title: string;
  slug: string;
  description: string;
  yearMasehi: number;
  yearHijriah: number;
  durationDays: number;
  departurePeriodStart: string;
  departurePeriodEnd: string;
  defaultPackageTypeId: number;
  defaultPackageTypePricings: Array<{ id: string; packageTypeId: number; priceIdr: number; isAllInDefault?: boolean }>;
  defaultSeatCapacity: number;
  defaultSeatAvailable: number;
  downPayment: number;
  airlineId?: number;
  officeBranchId?: number;
  labelTagIds: number[];
  includedItems: string;
  excludedItems: string;
  isActive: boolean;
  packages: PkgForm[];
};

const blankProgram = (): ProgramForm => ({
  name: '',
  title: '',
  slug: '',
  description: '',
  yearMasehi: new Date().getFullYear(),
  yearHijriah: 1447,
  durationDays: 9,
  departurePeriodStart: '',
  departurePeriodEnd: '',
  defaultPackageTypeId: 0,
  defaultPackageTypePricings: [],
  defaultSeatCapacity: 0,
  defaultSeatAvailable: 0,
  downPayment: 5000000,
  airlineId: undefined,
  officeBranchId: undefined,
  labelTagIds: [],
  includedItems: '',
  excludedItems: '',
  isActive: true,
  packages: [],
});

const blankPkg = (): PkgForm => ({
  packageClassMasterId: 0,
  priceQuad: 0,
  priceTripleAdditional: 0,
  priceDoubleAdditional: 0,
  makkahHotelId: 0,
  makkahNights: 0,
  madinahHotelId: 0,
  madinahNights: 0,
});

const toSlug = (value: string): string =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');

const with4DigitSuffix = (base: string): string => {
  const four = String(Math.floor(Math.random() * 10000)).padStart(4, '0');
  return `${base}-${four}`;
};

const ensureClientSlug = (candidateSlug: string, title: string, name: string): string => {
  const raw = String(candidateSlug || '').trim();
  const normalized = toSlug(raw);
  if (normalized) return normalized;
  const source = String(title || name || 'paket').trim();
  const base = toSlug(source) || 'paket';
  return with4DigitSuffix(base);
};

const ensureProgramCode = (candidateCode: string, title: string, yearMasehi: number): string => {
  const raw = String(candidateCode || '').trim().toUpperCase();
  if (raw) return raw;
  const base = String(title || 'PROGRAM')
    .toUpperCase()
    .replace(/[^A-Z0-9\s-]/g, '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 3)
    .map((w) => w.slice(0, 3))
    .join('');
  const token = (base || 'PRG').slice(0, 9);
  const year = Number(yearMasehi || new Date().getFullYear());
  const four = String(Math.floor(Math.random() * 10000)).padStart(4, '0');
  return `PRG-${token}-${year}-${four}`;
};

const parseProgramMetadata = (raw: unknown): Record<string, unknown> => {
  if (raw && typeof raw === 'object') return raw as Record<string, unknown>;
  if (typeof raw !== 'string' || !raw.trim()) return {};
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? (parsed as Record<string, unknown>) : {};
  } catch {
    return {};
  }
};

const getHijriYearFromIsoDate = (isoDate: string): number => {
  try {
    if (!isoDate) return 0;
    const date = new Date(isoDate);
    if (Number.isNaN(date.getTime())) return 0;
    const fmt = new Intl.DateTimeFormat('en-TN-u-ca-islamic', { year: 'numeric' });
    const parts = fmt.formatToParts(date);
    const yearPart = parts.find((p) => p.type === 'year')?.value ?? '';
    const y = Number(yearPart.replace(/[^\d]/g, ''));
    return Number.isFinite(y) && y > 0 ? y : 0;
  } catch {
    return 0;
  }
};

export default function KelolaPaketPage() {
  const { show } = useToast();
  const [busy, setBusy] = useState(false);
  const [items, setItems] = useState<any[]>([]);
  const [loadingPage, setLoadingPage] = useState(true);
  const [listLoadError, setListLoadError] = useState('');
  const [airlines, setAirlines] = useState<RefItem[]>([]);
  const [hotels, setHotels] = useState<RefItem[]>([]);
  const [classes, setClasses] = useState<RefItem[]>([]);
  const [packageTypes, setPackageTypes] = useState<RefItem[]>([]);
  const [airports, setAirports] = useState<RefItem[]>([]);
  const [insuranceTypes, setInsuranceTypes] = useState<RefItem[]>([]);
  const [facilityMasters, setFacilityMasters] = useState<RefItem[]>([]);
  const [durationTypes, setDurationTypes] = useState<DurationTypeItem[]>([]);
  const [termsTemplates, setTermsTemplates] = useState<RefItem[]>([]);
  const [termsTemplateSearch, setTermsTemplateSearch] = useState('');
  const [termsPreviewContent, setTermsPreviewContent] = useState('');
  const [termsPreviewLoading, setTermsPreviewLoading] = useState(false);
  const [termsSectionOpen, setTermsSectionOpen] = useState(false);
  const [scheduleSectionOpen, setScheduleSectionOpen] = useState(true);
  const [discountSectionOpen, setDiscountSectionOpen] = useState(true);
  const [labelTags, setLabelTags] = useState<LabelTagItem[]>([]);
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [form, setForm] = useState<ProgramForm>(blankProgram());
  const [editingId, setEditingId] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const [wizardOpen, setWizardOpen] = useState(false);
  const [wizardStep, setWizardStep] = useState(0);
  const [wizardPayloadModalOpen, setWizardPayloadModalOpen] = useState(false);
  const [wizardPayloadPreparing, setWizardPayloadPreparing] = useState(false);
  const [wizardPayloadJson, setWizardPayloadJson] = useState('');
  const [wizardPayloadExecuting, setWizardPayloadExecuting] = useState(false);
  const [inputMode, setInputMode] = useState<'bulk' | 'none'>('none');
  const [bulkJson, setBulkJson] = useState('');
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [quickServiceId, setQuickServiceId] = useState<number | ''>('');
  const [quickPackageName, setQuickPackageName] = useState('');
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [imageProgramId, setImageProgramId] = useState<number | null>(null);
  const [imageProgramTitle, setImageProgramTitle] = useState('');
  const [images, setImages] = useState<ProgramImage[]>([]);
  const [mounted, setMounted] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadFileTotal, setUploadFileTotal] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [configModalOpen, setConfigModalOpen] = useState(false);
  const [configProgramId, setConfigProgramId] = useState<number | null>(null);
  const [configProgramTitle, setConfigProgramTitle] = useState('');
  const [configDefaultPackageTypeId, setConfigDefaultPackageTypeId] = useState(0);
  const [configDefaultSeatCapacity, setConfigDefaultSeatCapacity] = useState(0);
  const [configDefaultSeatAvailable, setConfigDefaultSeatAvailable] = useState(0);
  const [configDownPayment, setConfigDownPayment] = useState(0);
  const [config, setConfig] = useState<ProgramDisplayConfig>({ itineraries: [], flightInfos: [] });
  const [labelsModalOpen, setLabelsModalOpen] = useState(false);
  const [labelsProgramId, setLabelsProgramId] = useState<number | null>(null);
  const [labelsProgramTitle, setLabelsProgramTitle] = useState('');
  const [labelsSelection, setLabelsSelection] = useState<number[]>([]);
  const [configPackages, setConfigPackages] = useState<ProgramPackageRef[]>([]);
  const [selectedConfigPackageId, setSelectedConfigPackageId] = useState<number | ''>('');
  const [departureRows, setDepartureRows] = useState<DepartureRow[]>([]);
  const [flashSaleModalOpen, setFlashSaleModalOpen] = useState(false);
  const [flashSaleProgramId, setFlashSaleProgramId] = useState<number | null>(null);
  const [flashSaleProgramTitle, setFlashSaleProgramTitle] = useState('');
  const [flashSaleEndsAt, setFlashSaleEndsAt] = useState('');
  const [openItineraryGroupIdx, setOpenItineraryGroupIdx] = useState<number | null>(0);
  const [collapsedScheduleCards, setCollapsedScheduleCards] = useState<number[]>([]);
  const [itineraryAiModalOpen, setItineraryAiModalOpen] = useState(false);
  const [itineraryAiJson, setItineraryAiJson] = useState('');
  const [itinerarySectionOpen, setItinerarySectionOpen] = useState(true);
  const [currencyConverting, setCurrencyConverting] = useState(false);
  const [currencyPreviewRows, setCurrencyPreviewRows] = useState<Array<{ packageTypeName: string; idr: number; usd: number; sar: number }>>([]);
  const [wizardCloseConfirmOpen, setWizardCloseConfirmOpen] = useState(false);
  const [durationJsonModalOpen, setDurationJsonModalOpen] = useState(false);
  const [durationJsonBusy, setDurationJsonBusy] = useState(false);
  const [durationJsonText, setDurationJsonText] = useState(`[
  {
    "name": "Umrah Reguler 12 Hari",
    "code": "DUR-UMR-12D11N",
    "description": "Durasi umrah reguler",
    "durationSortOrder": 2,
    "defaultDays": 12,
    "defaultNights": 11,
    "displayFormat": "12 Hari 11 Malam"
  }
]`);
  const [durationEditModalOpen, setDurationEditModalOpen] = useState(false);
  const [durationEditBusy, setDurationEditBusy] = useState(false);
  const [durationEditForm, setDurationEditForm] = useState<DurationTypeEditForm>({
    id: 0,
    name: '',
    defaultDays: 1,
    defaultNights: 0,
    displayFormat: '',
    description: '',
    durationSortOrder: 0,
    code: '',
  });
  const [quickAddCloseConfirmOpen, setQuickAddCloseConfirmOpen] = useState(false);
  const [seoBrandTag, setSeoBrandTag] = useState('alfiantour');
  const [imageDeleteConfirmId, setImageDeleteConfirmId] = useState<number | null>(null);
  const [flashUnsetConfirmProgramId, setFlashUnsetConfirmProgramId] = useState<number | null>(null);
  const [programDeleteConfirmId, setProgramDeleteConfirmId] = useState<number | null>(null);
  const [programHardDeleteConfirmId, setProgramHardDeleteConfirmId] = useState<number | null>(null);
  const [deletingProgram, setDeletingProgram] = useState(false);
  const [programJsonModalOpen, setProgramJsonModalOpen] = useState(false);
  const [programJsonTitle, setProgramJsonTitle] = useState('');
  const [programJsonText, setProgramJsonText] = useState('');

  const canSubmit = useMemo(() => form.name.trim() && form.title.trim(), [form]);
  const calcEndDateFromStartAndDays = (startDate: string, durationDays: number): string => {
    if (!startDate) return '';
    const start = new Date(startDate);
    if (Number.isNaN(start.getTime())) return '';
    const days = Math.max(1, Number(durationDays || 1));
    const end = new Date(start.getTime() + (days - 1) * 86400000);
    return end.toISOString().slice(0, 10);
  };
  const selectedDurationTypeId = useMemo(() => {
    const found = durationTypes.find((d) => Number(d.defaultDays || 0) === Number(form.durationDays || 0));
    return found?.id ? String(found.id) : '';
  }, [durationTypes, form.durationDays]);
  const selectedDurationType = useMemo(
    () => durationTypes.find((d) => String(d.id) === selectedDurationTypeId) ?? null,
    [durationTypes, selectedDurationTypeId]
  );
  const hasWizardDraft = useMemo(() => {
    if (editingId) return true;
    return Boolean(
      form.name.trim() ||
      form.title.trim() ||
      form.slug.trim() ||
      form.description.trim() ||
      form.departurePeriodStart ||
      form.departurePeriodEnd ||
      form.packages.length > 0
    );
  }, [editingId, form]);
  const hasQuickAddDraft = useMemo(() => Boolean(quickServiceId || quickPackageName.trim()), [quickServiceId, quickPackageName]);
  const slugExists = useMemo(() => {
    const s = form.slug.trim().toLowerCase();
    if (!s) return false;
    return items.some((x) => String(x.slug || '').toLowerCase() === s && Number(x.id) !== Number(editingId || 0));
  }, [form.slug, items, editingId]);
  const filteredItems = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter((x) => `${x.title || ''} ${x.name || ''} ${x.slug || ''}`.toLowerCase().includes(q));
  }, [items, search]);
  const filteredTermsTemplates = useMemo(() => {
    const q = termsTemplateSearch.trim().toLowerCase();
    if (!q) return termsTemplates;
    return termsTemplates.filter((x) => x.name.toLowerCase().includes(q));
  }, [termsTemplates, termsTemplateSearch]);
  const selectedTermsIds = useMemo(() => {
    const ids = (config.termsTemplateIds ?? [])
      .map((v) => Number(v))
      .filter((v) => Number.isFinite(v) && v > 0);
    if (ids.length > 0) return Array.from(new Set(ids));
    const fallbackId = Number(config.termsTemplateId || 0);
    return fallbackId > 0 ? [fallbackId] : [];
  }, [config.termsTemplateIds, config.termsTemplateId]);
  const refUser = useMemo(() => {
    const raw = String(getAuthState()?.user?.userName || '').trim();
    if (!raw) return 'superadmin';
    const noEmailDomain = raw.includes('@') ? raw.split('@')[0] : raw;
    const safe = noEmailDomain.replace(/[^a-zA-Z0-9._-]/g, '');
    return safe || 'superadmin';
  }, []);
  const promotionalLabelIds = useMemo(
    () => labelTags.filter((x) => x.isPromotional).map((x) => x.id),
    [labelTags]
  );
  const primaryPromotionalLabelId = useMemo(
    () => promotionalLabelIds[0] ?? null,
    [promotionalLabelIds]
  );
  const roomTypeMasters = useMemo(
    () => [...classes].sort((a, b) => String(a.name || '').localeCompare(String(b.name || ''))),
    [classes]
  );
  const bulkProgramSample5 = useMemo(() => {
    const classIds = classes.map((x) => x.id).filter((x) => Number.isFinite(x) && x > 0);
    const hotelIds = hotels.map((x) => x.id).filter((x) => Number.isFinite(x) && x > 0);
    const airlineId = airlines[0]?.id ?? null;
    const tagIds = labelTags.map((x) => x.id).filter((x) => Number.isFinite(x) && x > 0);
    const pickClass = (idx: number) => classIds[idx % Math.max(classIds.length, 1)] ?? 0;
    const pickHotel = (idx: number) => hotelIds[idx % Math.max(hotelIds.length, 1)] ?? 0;
    const withTags = (arr: number[]) => arr.filter((n) => n > 0);
    const sample = [
      {
        name: 'Umrah Reguler 9 Hari - Januari 2027',
        title: 'Umrah Reguler 9 Hari 2027',
        slug: 'umrah-reguler-9-hari-2027',
        description: 'Program reguler 9 hari dengan hotel strategis dan penerbangan full service.',
        isActive: true, sortOrder: 1, yearMasehi: 2027, yearHijriah: 1448, durationDays: 9,
        departurePeriodStart: '2027-01-10T00:00:00Z', departurePeriodEnd: '2027-01-18T00:00:00Z',
        downPayment: 5000000, airlineId, guideUserId: null, officeBranchId: null,
        includedItems: ['Tiket PP', 'Visa Umrah', 'Hotel Makkah & Madinah', 'Makan 3x sehari'],
        excludedItems: ['Pengeluaran pribadi', 'Kelebihan bagasi'], certifications: [],
        packages: [
          { packageClassMasterId: pickClass(0), priceQuad: 29900000, priceTripleAdditional: 1500000, priceDoubleAdditional: 2500000, makkahHotelId: pickHotel(0), makkahNights: 4, madinahHotelId: pickHotel(1), madinahNights: 3 }
        ],
        labelTagIds: withTags([tagIds[0] ?? 0, tagIds[1] ?? 0])
      },
      {
        name: 'Umrah Plus Thaif 12 Hari - Februari 2027',
        title: 'Umrah Plus Thaif 12 Hari',
        slug: 'umrah-plus-thaif-12-hari-2027',
        description: 'Program umrah plus city tour Thaif, cocok untuk keluarga.',
        isActive: true, sortOrder: 2, yearMasehi: 2027, yearHijriah: 1448, durationDays: 12,
        departurePeriodStart: '2027-02-05T00:00:00Z', departurePeriodEnd: '2027-02-16T00:00:00Z',
        downPayment: 7000000, airlineId, guideUserId: null, officeBranchId: null,
        includedItems: ['Tiket PP', 'Visa Umrah', 'Handling airport', 'Tour Thaif'],
        excludedItems: ['Laundry', 'Kebutuhan pribadi'], certifications: [],
        packages: [
          { packageClassMasterId: pickClass(1), priceQuad: 34500000, priceTripleAdditional: 1800000, priceDoubleAdditional: 3000000, makkahHotelId: pickHotel(2), makkahNights: 5, madinahHotelId: pickHotel(3), madinahNights: 4 }
        ],
        labelTagIds: withTags([tagIds[2] ?? 0])
      },
    ];
    const wrapped = sample.map((row) => ({
      endpoint: '/api/v1/master/programs',
      method: 'POST',
      payload: row,
      labelsSync: {
        endpoint: '/api/v1/master/programs/{createdId}/labels',
        method: 'PUT',
        payload: { packageLabelTagIds: Array.isArray((row as any).labelTagIds) ? (row as any).labelTagIds : [] },
      },
    }));
    return JSON.stringify(wrapped, null, 2);
  }, [airlines, classes, hotels, labelTags]);

  const loadRefs = async () => {
    const getFirst = async (paths: string[]): Promise<any> => {
      let lastError: unknown = null;
      for (const path of paths) {
        try {
          return await apiGet<any>(path);
        } catch (err) {
          lastError = err;
        }
      }
      throw lastError instanceof Error ? lastError : new Error('HTTP 404');
    };

    const safeGetFirst = async (paths: string[]): Promise<any> => {
      try {
        return await getFirst(paths);
      } catch {
        return { items: [] };
      }
    };

    const [a, h, c, s, pt, ap, it, tt, lt, fm, dt] = await Promise.all([
      safeGetFirst(['/api/v1/master/Airlines?page=1&pageSize=200', '/api/v1/master/airlines?page=1&pageSize=200']),
      safeGetFirst(['/api/v1/master/Hotels?page=1&pageSize=200', '/api/v1/master/hotels?page=1&pageSize=200']),
      safeGetFirst(['/api/v1/master/RoomTypeMasters?page=1&pageSize=200', '/api/v1/master/room-type-masters?page=1&pageSize=200', '/api/v1/master/package-class-masters?page=1&pageSize=200']),
      safeGetFirst(['/api/v1/master/PackageCategories?page=1&pageSize=200&isActive=true', '/api/v1/master/package-categories?page=1&pageSize=200&isActive=true']),
      safeGetFirst(['/api/v1/master/PackageTypes?page=1&pageSize=200', '/api/v1/master/package-types?page=1&pageSize=200']),
      safeGetFirst(['/api/v1/master/Airports?page=1&pageSize=200', '/api/v1/master/airports?page=1&pageSize=200']),
      safeGetFirst(['/api/v1/master/InsuranceTypes?page=1&pageSize=200', '/api/v1/master/insurance-types?page=1&pageSize=200']),
      safeGetFirst(['/api/v1/master/TermsTemplates?page=1&pageSize=200', '/api/v1/master/terms-templates?page=1&pageSize=200']),
      safeGetFirst(['/api/v1/master/PackageLabelTags?page=1&pageSize=200&isActive=true', '/api/v1/master/package-label-tags?page=1&pageSize=200&isActive=true']),
      safeGetFirst(['/api/v1/master/FacilityMasters?page=1&pageSize=300', '/api/v1/master/facility-masters?page=1&pageSize=300']),
      safeGetFirst(['/api/v1/master/DurationTypes?page=1&pageSize=300', '/api/v1/master/duration-types?page=1&pageSize=300']),
    ]);
    setAirlines((a.items ?? []).map((x: any) => ({ id: x.id, name: x.name })));
    setHotels((h.items ?? []).map((x: any) => ({ id: x.id, name: x.name })));
    setClasses((c.items ?? c.data?.items ?? []).map((x: any) => ({ id: x.id, name: x.name, code: x.code, sortOrder: x.sortOrder })));
    setServices((s.items ?? s.data?.items ?? []).filter((x: ServiceItem) => (x.isActive ?? true) && !x.parentCategoryId));
    setPackageTypes((pt.items ?? pt.data?.items ?? []).map((x: any) => ({ id: x.id, name: x.name })));
    setAirports((ap.items ?? ap.data?.items ?? []).map((x: any) => ({ id: x.id, name: x.name })));
    setInsuranceTypes((it.items ?? it.data?.items ?? []).map((x: any) => ({
      id: x.id,
      name: x.name,
      providerName: x.providerName,
      basePremium: Number(x.basePremium || 0),
    })));
    setTermsTemplates((tt.items ?? tt.data?.items ?? []).map((x: any) => ({ id: x.id, name: x.name, content: x.content ?? x.body ?? x.description ?? '' })));
    setLabelTags((lt.items ?? lt.data?.items ?? []).map((x: any) => ({
      id: x.id,
      name: x.name,
      code: x.code,
      isPromotional: x.isPromotional,
    })));
    setFacilityMasters((fm.items ?? fm.data?.items ?? []).map((x: any) => ({ id: Number(x.id || 0), name: String(x.name || '') })).filter((x: RefItem) => x.id > 0));
    setDurationTypes((dt.items ?? dt.data?.items ?? []).map((x: any) => ({
      id: Number(x.id || 0),
      name: String(x.name || ''),
      defaultDays: Number(x.defaultDays || 0),
      defaultNights: Number(x.defaultNights || 0),
      displayFormat: String(x.displayFormat || ''),
    })).filter((x: DurationTypeItem) => x.id > 0));
  };

  const loadList = async () => {
    try {
      setListLoadError('');
      const res = await apiGet<any>('/api/v1/master/programs?page=1&pageSize=100&orderBy=createdAt desc');
      const list = Array.isArray(res?.items)
        ? res.items
        : Array.isArray(res?.data?.items)
          ? res.data.items
          : Array.isArray(res?.data)
            ? res.data
            : Array.isArray(res)
              ? res
              : [];
      setItems(list);
    } catch (e) {
      setItems([]);
      const msg = e instanceof Error ? `Gagal memuat list paket: ${e.message}` : 'Gagal memuat list paket';
      setListLoadError(msg);
      show(msg);
    }
  };

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  useEffect(() => {
    const init = async () => {
      setLoadingPage(true);
      try {
        await Promise.all([loadRefs(), loadList()]);
      } finally {
        setLoadingPage(false);
      }
    };
    void init();
  }, []);

  useEffect(() => {
    if (selectedTermsIds.length === 0) {
      setTermsPreviewContent('');
      setTermsPreviewLoading(false);
      return;
    }
    const selected = termsTemplates.filter((x) => selectedTermsIds.includes(x.id));
    const hasAllLocalContent = selected.length === selectedTermsIds.length && selected.every((x) => (x.content ?? '').trim().length > 0);
    if (hasAllLocalContent) {
      const merged = selected
        .map((x, idx) => `# ${idx + 1}. ${x.name}\n${String(x.content ?? '').trim()}`)
        .join('\n\n');
      setTermsPreviewContent(merged);
      setTermsPreviewLoading(false);
      return;
    }
    let cancelled = false;
    const loadDetail = async () => {
      setTermsPreviewLoading(true);
      try {
        const details = await Promise.all(
          selectedTermsIds.map(async (id) => {
            const detail = await apiGet<any>(`/api/v1/master/terms-templates/${id}`);
            return {
              id,
              name: String(detail?.name ?? termsTemplates.find((x) => x.id === id)?.name ?? `Template #${id}`),
              content: String(detail?.content ?? detail?.body ?? detail?.description ?? ''),
            };
          })
        );
        if (cancelled) return;
        const merged = details
          .map((x, idx) => `# ${idx + 1}. ${x.name}\n${x.content.trim()}`)
          .join('\n\n');
        setTermsPreviewContent(merged);
      } catch {
        if (cancelled) return;
        setTermsPreviewContent('');
      } finally {
        if (!cancelled) setTermsPreviewLoading(false);
      }
    };
    void loadDetail();
    return () => {
      cancelled = true;
    };
  }, [selectedTermsIds, termsTemplates]);

  const validateProgramForm = (): string | null => {
    if (!form.name.trim()) return 'Nama program wajib diisi';
    if (!form.title.trim()) return 'Judul tampil wajib diisi';
    if (packageTypes.length > 0) {
      const hasSelectedType = (Array.isArray(form.defaultPackageTypePricings) ? form.defaultPackageTypePricings : [])
        .some((r) => Number(r?.packageTypeId || 0) > 0);
      if (!hasSelectedType) return 'Pilih minimal 1 Tipe Harga (Package Types) di bagian Harga IDR per Tipe Harga';
    }
    if (Number(form.defaultSeatCapacity || 0) < 0) return 'Jumlah kursi tidak boleh negatif';
    if (Number(form.defaultSeatAvailable || 0) < 0) return 'Kursi tersedia awal tidak boleh negatif';
    if (Number(form.defaultSeatAvailable || 0) > Number(form.defaultSeatCapacity || 0)) return 'Kursi tersedia awal tidak boleh melebihi jumlah kursi';
    return null;
  };

  const buildWizardProgramPayload = () => {
    const now = new Date();
    const oneWeekLater = new Date(now.getTime() + (7 * 86400000));
    const departurePeriodStartDate = form.departurePeriodStart ? new Date(form.departurePeriodStart) : now;
    const departurePeriodEndDate = form.departurePeriodEnd ? new Date(form.departurePeriodEnd) : oneWeekLater;
    const safeDeparturePeriodStart = Number.isNaN(departurePeriodStartDate.getTime()) ? now : departurePeriodStartDate;
    const safeDeparturePeriodEnd = Number.isNaN(departurePeriodEndDate.getTime()) || departurePeriodEndDate < safeDeparturePeriodStart
      ? oneWeekLater
      : departurePeriodEndDate;
    const autoYearMasehi = safeDeparturePeriodStart.getFullYear();
    const autoYearHijriah = getHijriYearFromIsoDate(safeDeparturePeriodStart.toISOString().slice(0, 10)) || form.yearHijriah;
    const defaultClassId = Number(classes[0]?.id || 0);
    const defaultHotelId = Number(hotels[0]?.id || 0);
    const defaultMakkahNights = Math.max(1, Math.floor(Math.max(1, Number(form.durationDays || 1)) / 2));
    const defaultMadinahNights = Math.max(1, Math.max(1, Number(form.durationDays || 1)) - defaultMakkahNights);
    const sourcePackages = Array.isArray(form.packages) && form.packages.length > 0 ? form.packages : [blankPkg()];
    const packagesForSave = sourcePackages.map((p) => ({
      ...p,
      packageClassMasterId: Number(p.packageClassMasterId || defaultClassId || 0),
      priceQuad: Number(p.priceQuad || 0),
      priceTripleAdditional: Number(p.priceTripleAdditional || 0),
      priceDoubleAdditional: Number(p.priceDoubleAdditional || 0),
      makkahHotelId: Number(p.makkahHotelId || defaultHotelId || 0),
      madinahHotelId: Number(p.madinahHotelId || defaultHotelId || 0),
      makkahNights: Number(p.makkahNights || defaultMakkahNights || 1),
      madinahNights: Number(p.madinahNights || defaultMadinahNights || 1),
    }));
    const wizardPricings = (Array.isArray(form.defaultPackageTypePricings) ? form.defaultPackageTypePricings : [])
      .map((r) => ({
        id: String(r.id || crypto.randomUUID()),
        packageTypeId: Number(r.packageTypeId || 0),
        priceIdr: Number(r.priceIdr || 0),
        isAllInDefault: Boolean(r.isAllInDefault),
      }))
      .filter((r) => r.packageTypeId > 0);
    const resolvedDefaultPackageTypeId = Number(
      wizardPricings.find((r) => r.isAllInDefault)?.packageTypeId
      ?? wizardPricings[0]?.packageTypeId
      ?? form.defaultPackageTypeId
      ?? 0
    );
    const payload: any = {
      id: editingId ?? undefined,
      name: form.name,
      code: ensureProgramCode('', form.title, autoYearMasehi || form.yearMasehi),
      description: form.description || null,
      isActive: form.isActive,
      sortOrder: 0,
      slug: ensureClientSlug(form.slug || '', form.title, form.name),
      metadata: JSON.stringify({
        ...parseProgramMetadata(form.metadataRaw),
        defaultPackageTypeId: resolvedDefaultPackageTypeId,
        defaultPackageTypePricings: wizardPricings,
        defaultSeatCapacity: Number(form.defaultSeatCapacity || 0),
        defaultSeatAvailable: Number(form.defaultSeatAvailable || 0),
      }),
      title: form.title,
      yearMasehi: autoYearMasehi || form.yearMasehi,
      yearHijriah: autoYearHijriah || form.yearHijriah,
      durationDays: form.durationDays,
      departurePeriodStart: safeDeparturePeriodStart.toISOString(),
      departurePeriodEnd: safeDeparturePeriodEnd.toISOString(),
      downPayment: form.downPayment,
      airlineId: null,
      guideUserId: null,
      officeBranchId: form.officeBranchId || null,
      includedItems: form.includedItems ? form.includedItems.split('\n').map((x) => x.trim()).filter(Boolean) : [],
      excludedItems: form.excludedItems ? form.excludedItems.split('\n').map((x) => x.trim()).filter(Boolean) : [],
      certifications: [],
      packages: packagesForSave.map((p) => ({ ...p, id: p.id ?? null })),
    };
    return { payload, labelTagIds: form.labelTagIds };
  };

  const save = async (): Promise<boolean> => {
    const validationMessage = validateProgramForm();
    if (validationMessage) {
      show(validationMessage);
      return false;
    }
    setBusy(true);
    try {
      const { payload, labelTagIds } = buildWizardProgramPayload();
      let targetProgramId = editingId ?? null;
      if (editingId) {
        await apiPut(`/api/v1/master/programs/${editingId}`, payload);
        targetProgramId = editingId;
        show('Program paket diperbarui');
      } else {
        const created = await apiPost<any>('/api/v1/master/programs', payload);
        targetProgramId = Number(created?.id ?? created?.data?.id ?? 0) || null;
        show('Program paket ditambahkan');
      }
      if (targetProgramId) {
        await apiPut(`/api/v1/master/programs/${targetProgramId}/labels`, {
          packageLabelTagIds: labelTagIds,
        });
      }
      setEditingId(null);
      setForm(blankProgram());
      await loadList();
      return true;
    } catch (e) {
      show(e instanceof Error ? e.message : 'Gagal simpan paket');
      return false;
    } finally {
      setBusy(false);
    }
  };

  const runBulk = async () => {
    setBusy(true);
    try {
      const parsed = JSON.parse(bulkJson);
      if (!Array.isArray(parsed) || parsed.length === 0) {
        show('Bulk JSON harus array dan tidak boleh kosong');
        return;
      }
      const rows = parsed.map((entry: any) => {
        const isWrapped = entry && typeof entry === 'object' && entry.payload && typeof entry.payload === 'object';
        if (!isWrapped) return entry;
        const payload = entry.payload ?? {};
        const labelsSync = entry.labelsSync?.payload?.packageLabelTagIds;
        return {
          ...payload,
          labelTagIds: Array.isArray(labelsSync) ? labelsSync : (Array.isArray(payload?.labelTagIds) ? payload.labelTagIds : []),
        };
      });
      const invalidRef = rows.findIndex((row: any) =>
        !Array.isArray(row?.packages) ||
        row.packages.length === 0 ||
        row.packages.some((p: any) =>
          !Number(p?.packageClassMasterId) ||
          !Number(p?.makkahHotelId) ||
          !Number(p?.madinahHotelId)
        )
      );
      if (invalidRef >= 0) {
        show(`Item bulk ke-${invalidRef + 1} punya referensi kelas/hotel tidak valid. Klik "Isi Sample 2 Paket" setelah master data termuat.`);
        return;
      }
      const hasLabelAssignments = rows.some((x: any) => Array.isArray(x?.labelTagIds));
      if (!hasLabelAssignments) {
        await apiPost('/api/v1/master/programs/bulk', rows);
      } else {
        for (const row of rows) {
          const { labelTagIds, ...programPayload } = row ?? {};
          const created = await apiPost<any>('/api/v1/master/programs', programPayload);
          const programId = Number(created?.id ?? created?.data?.id ?? 0);
          if (programId > 0 && Array.isArray(labelTagIds)) {
            await apiPut(`/api/v1/master/programs/${programId}/labels`, {
              packageLabelTagIds: labelTagIds.map((n: any) => Number(n)).filter((n: number) => Number.isFinite(n) && n > 0),
            });
          }
        }
      }
      show(`Bulk berhasil dieksekusi (${rows.length} item)${hasLabelAssignments ? ' + label sync' : ''}`);
      await loadList();
    } catch (e) {
      show(e instanceof Error ? e.message : 'Bulk gagal diproses');
    } finally {
      setBusy(false);
    }
  };

  const mapFormFromItem = (x: any): ProgramForm => {
    const meta = parseProgramMetadata(x?.metadata);
    const metaPricingsRaw = Array.isArray(meta.defaultPackageTypePricings) ? meta.defaultPackageTypePricings : [];
    const metaPricings = metaPricingsRaw
      .map((r: any, idx: number) => ({
        id: String(r?.id || `${r?.packageTypeId || 0}-${idx}`),
        packageTypeId: Number(r?.packageTypeId || 0),
        priceIdr: Number(r?.priceIdr || 0),
        isAllInDefault: Boolean(r?.isAllInDefault),
      }))
      .filter((r: any) => r.packageTypeId > 0);
    const derivedDefaultPackageTypeId =
      Number(meta.defaultPackageTypeId ?? 0) > 0
        ? Number(meta.defaultPackageTypeId ?? 0)
        : Number(metaPricings.find((r: any) => r.isAllInDefault)?.packageTypeId ?? metaPricings[0]?.packageTypeId ?? 0);
    return ({
    id: x.id,
    metadataRaw: typeof x?.metadata === 'string' ? x.metadata : '',
    name: x.name ?? '',
    title: x.title ?? '',
    slug: x.slug ?? '',
    description: x.description ?? '',
    yearMasehi: x.yearMasehi ?? new Date().getFullYear(),
    yearHijriah: x.yearHijriah ?? 1447,
    durationDays: x.durationDays ?? 9,
    departurePeriodStart: x.departurePeriodStart?.slice(0, 10) ?? '',
    departurePeriodEnd: x.departurePeriodEnd?.slice(0, 10) ?? '',
    defaultPackageTypeId: derivedDefaultPackageTypeId,
    defaultPackageTypePricings: metaPricings,
    defaultSeatCapacity: Number(meta.defaultSeatCapacity ?? 0),
    defaultSeatAvailable: Number(meta.defaultSeatAvailable ?? 0),
    downPayment: x.downPayment ?? 0,
    airlineId: x.airlineId ?? undefined,
    officeBranchId: x.officeBranchId ?? undefined,
    labelTagIds: Array.isArray(x.labelTags) ? x.labelTags.map((t: any) => Number(t.packageLabelTagId ?? t.id)).filter((n: number) => Number.isFinite(n) && n > 0) : [],
    includedItems: Array.isArray(x.includedItems) ? x.includedItems.join('\n') : '',
    excludedItems: Array.isArray(x.excludedItems) ? x.excludedItems.join('\n') : '',
    isActive: x.isActive ?? true,
    packages: Array.isArray(x.packages) ? x.packages.map((p: any) => ({ ...p })) : [],
  });
  };

  const openAddWizard = () => {
    setEditingId(null);
    setForm(blankProgram());
    setWizardStep(0);
    setWizardCloseConfirmOpen(false);
    setWizardOpen(true);
  };

  const openEditWizard = (x: any) => {
    setEditingId(x.id);
    setForm(mapFormFromItem(x));
    setWizardStep(0);
    setWizardCloseConfirmOpen(false);
    setWizardOpen(true);
  };

  const duplicateFromItem = (x: any) => {
    const source = mapFormFromItem(x);
    setEditingId(null);
    setForm({
      ...source,
      id: undefined,
      slug: `${(source.slug || source.title || 'paket').toLowerCase().replace(/\s+/g, '-')}-copy`,
      title: `${source.title} Copy`,
    });
    setWizardStep(0);
    setWizardCloseConfirmOpen(false);
    setWizardOpen(true);
  };

  const wizardSteps = ['Basic Info', 'Deskripsi & Label', 'SEO & Publish'];

  const closeWizard = (force = false) => {
    if (busy) return;
    if (!force && hasWizardDraft) {
      setWizardCloseConfirmOpen(true);
      return;
    }
    setWizardCloseConfirmOpen(false);
    setWizardOpen(false);
    setWizardPayloadModalOpen(false);
  };

  const hydrateRefsForWizardPayload = async () => {
    if (classes.length > 0 && hotels.length > 0 && packageTypes.length > 0 && labelTags.length > 0) return;
    const getFirst = async (paths: string[]): Promise<any> => {
      let lastError: unknown = null;
      for (const path of paths) {
        try {
          return await apiGet<any>(path);
        } catch (err) {
          lastError = err;
        }
      }
      throw lastError instanceof Error ? lastError : new Error('HTTP 404');
    };
    const safeGetFirst = async (paths: string[]): Promise<any> => {
      try {
        return await getFirst(paths);
      } catch {
        return { items: [] };
      }
    };

    // Load satu-per-satu agar referensi wizard payload selalu siap dan stabil.
    const c = await safeGetFirst(['/api/v1/master/RoomTypeMasters?page=1&pageSize=200', '/api/v1/master/room-type-masters?page=1&pageSize=200', '/api/v1/master/package-class-masters?page=1&pageSize=200']);
    setClasses((c.items ?? c.data?.items ?? []).map((x: any) => ({ id: x.id, name: x.name, code: x.code, sortOrder: x.sortOrder })));

    const h = await safeGetFirst(['/api/v1/master/Hotels?page=1&pageSize=200', '/api/v1/master/hotels?page=1&pageSize=200']);
    setHotels((h.items ?? h.data?.items ?? []).map((x: any) => ({ id: x.id, name: x.name })));

    const pt = await safeGetFirst(['/api/v1/master/PackageTypes?page=1&pageSize=200', '/api/v1/master/package-types?page=1&pageSize=200']);
    setPackageTypes((pt.items ?? pt.data?.items ?? []).map((x: any) => ({ id: x.id, name: x.name })));

    const lt = await safeGetFirst(['/api/v1/master/PackageLabelTags?page=1&pageSize=200&isActive=true', '/api/v1/master/package-label-tags?page=1&pageSize=200&isActive=true']);
    setLabelTags((lt.items ?? lt.data?.items ?? []).map((x: any) => ({
      id: x.id,
      name: x.name,
      code: x.code,
      isPromotional: x.isPromotional,
    })));
  };

  const openWizardPayloadModal = async () => {
    try {
      setWizardPayloadPreparing(true);
      await hydrateRefsForWizardPayload();
      const built = buildWizardProgramPayload();
      const payload = { ...(built.payload ?? {}) } as any;
      let meta: any = {};
      try { meta = payload.metadata ? JSON.parse(String(payload.metadata)) : {}; } catch { meta = {}; }
      const rows = Array.isArray(meta?.defaultPackageTypePricings) ? meta.defaultPackageTypePricings : [];
      const normalizedRows = rows
        .map((r: any, idx: number) => ({
          id: String(r?.id || `row-${idx + 1}`),
          packageTypeId: Number(r?.packageTypeId || 0),
          priceIdr: Number(r?.priceIdr || 0),
          isAllInDefault: Boolean(r?.isAllInDefault),
        }))
        .filter((r: any) => r.packageTypeId > 0);
      if (normalizedRows.length === 0 && packageTypes.length > 0) {
        normalizedRows.push({
          id: 'row-1',
          packageTypeId: Number(packageTypes[0]?.id || 0),
          priceIdr: 0,
          isAllInDefault: true,
        });
      }
      const resolvedTypeId = Number(
        meta?.defaultPackageTypeId
        || normalizedRows.find((r: any) => r.isAllInDefault)?.packageTypeId
        || normalizedRows[0]?.packageTypeId
        || 0
      );
      const defaultClassId = Number(classes[0]?.id || 0);
      const payloadPackages = Array.isArray(payload?.packages) ? payload.packages : [];
      payload.packages = payloadPackages.length > 0
        ? payloadPackages.map((pkg: any) => ({
          ...pkg,
          packageClassMasterId: Number(pkg?.packageClassMasterId || defaultClassId || 0),
        }))
        : [{
          packageClassMasterId: defaultClassId || 0,
          priceQuad: 0,
          priceTripleAdditional: 0,
          priceDoubleAdditional: 0,
          makkahHotelId: Number(hotels[0]?.id || 0),
          makkahNights: 1,
          madinahHotelId: Number(hotels[0]?.id || 0),
          madinahNights: 1,
          id: null,
        }];
      payload.metadata = JSON.stringify({
        ...meta,
        defaultPackageTypeId: resolvedTypeId,
        defaultPackageTypePricings: normalizedRows,
      });
      setWizardPayloadJson(JSON.stringify({
        endpoint: editingId ? `/api/v1/master/programs/${editingId}` : '/api/v1/master/programs',
        method: editingId ? 'PUT' : 'POST',
        payload,
        labelsSync: {
          endpoint: editingId ? `/api/v1/master/programs/${editingId}/labels` : '/api/v1/master/programs/{createdId}/labels',
          method: 'PUT',
          payload: { packageLabelTagIds: built.labelTagIds },
        },
      }, null, 2));
      setWizardPayloadModalOpen(true);
    } finally {
      setWizardPayloadPreparing(false);
    }
  };

  const normalizeWizardPayloadJson = () => {
    try {
      const parsed = JSON.parse(wizardPayloadJson);
      const payload = { ...(parsed?.payload ?? {}) } as any;
      if (!payload || typeof payload !== 'object') {
        show('Payload JSON tidak valid');
        return;
      }
      let meta: any = {};
      try { meta = payload.metadata ? JSON.parse(String(payload.metadata)) : {}; } catch { meta = {}; }
      const rows = Array.isArray(meta?.defaultPackageTypePricings) ? meta.defaultPackageTypePricings : [];
      const normalizedRows = rows
        .map((r: any, idx: number) => ({
          id: String(r?.id || `row-${idx + 1}`),
          packageTypeId: Number(r?.packageTypeId || 0),
          priceIdr: Math.max(0, Number(r?.priceIdr || 0)),
          isAllInDefault: Boolean(r?.isAllInDefault),
        }))
        .filter((r: any) => r.packageTypeId > 0);
      const resolvedTypeId = Number(
        meta?.defaultPackageTypeId
        || normalizedRows.find((r: any) => r.isAllInDefault)?.packageTypeId
        || normalizedRows[0]?.packageTypeId
        || 0
      );
      const defaultClassId = Number(classes[0]?.id || 0);
      const defaultHotelId = Number(hotels[0]?.id || 0);
      const payloadPackages = Array.isArray(payload?.packages) ? payload.packages : [];
      payload.packages = payloadPackages.length > 0
        ? payloadPackages.map((pkg: any) => ({
          ...pkg,
          packageClassMasterId: Number(pkg?.packageClassMasterId || defaultClassId || 0),
          makkahHotelId: Number(pkg?.makkahHotelId || defaultHotelId || 0),
          makkahNights: Math.max(1, Number(pkg?.makkahNights || 1)),
          madinahHotelId: Number(pkg?.madinahHotelId || defaultHotelId || 0),
          madinahNights: Math.max(1, Number(pkg?.madinahNights || 1)),
        }))
        : [{
          packageClassMasterId: defaultClassId || 0,
          priceQuad: 0,
          priceTripleAdditional: 0,
          priceDoubleAdditional: 0,
          makkahHotelId: defaultHotelId || 0,
          makkahNights: 1,
          madinahHotelId: defaultHotelId || 0,
          madinahNights: 1,
          id: null,
        }];
      const depStart = String(payload.departurePeriodStart || '').slice(0, 10);
      const depDate = depStart ? new Date(depStart) : null;
      if (depDate && !Number.isNaN(depDate.getTime())) {
        payload.yearMasehi = depDate.getFullYear();
        payload.yearHijriah = getHijriYearFromIsoDate(depStart) || payload.yearHijriah;
      }
      payload.code = ensureProgramCode(String(payload.code || ''), String(payload.title || ''), Number(payload.yearMasehi || new Date().getFullYear()));
      payload.slug = ensureClientSlug(String(payload.slug || ''), String(payload.title || ''), String(payload.name || ''));
      payload.metadata = JSON.stringify({
        ...meta,
        defaultPackageTypeId: resolvedTypeId,
        defaultPackageTypePricings: normalizedRows,
        defaultSeatCapacity: Math.max(0, Number(meta?.defaultSeatCapacity ?? 0)),
        defaultSeatAvailable: Math.max(0, Number(meta?.defaultSeatAvailable ?? 0)),
      });
      parsed.payload = payload;
      setWizardPayloadJson(JSON.stringify(parsed, null, 2));
      show('Payload JSON dinormalisasi');
    } catch {
      show('Format JSON tidak valid');
    }
  };

  const executeWizardPayloadJson = async () => {
    try {
      const parsed = JSON.parse(wizardPayloadJson);
      const method = String(parsed?.method || '').toUpperCase();
      const payload = parsed?.payload;
      const labelsPayload = parsed?.labelsSync?.payload;
      if (!payload || typeof payload !== 'object') {
        show('Payload JSON tidak valid');
        return;
      }
      const p = payload as any;
      if (!String(p.name || '').trim()) {
        show('Payload JSON: name wajib diisi');
        return;
      }
      if (!String(p.title || '').trim()) {
        show('Payload JSON: title wajib diisi');
        return;
      }
      const toIso = (raw: any, fallback = '') => {
        const v = String(raw ?? '').trim();
        if (!v) return fallback;
        const d = new Date(v);
        if (Number.isNaN(d.getTime())) return fallback;
        return d.toISOString();
      };
      const startIso = toIso(p.departurePeriodStart);
      const endIso = toIso(p.departurePeriodEnd);
      if (!startIso || !endIso) {
        show('Payload JSON: departurePeriodStart dan departurePeriodEnd wajib format tanggal valid');
        return;
      }
      p.departurePeriodStart = startIso;
      p.departurePeriodEnd = endIso;
      p.durationDays = Math.max(1, Number(p.durationDays || 1));
      p.downPayment = Math.max(0, Number(p.downPayment ?? 0));
      p.sortOrder = Number.isFinite(Number(p.sortOrder)) ? Number(p.sortOrder) : 0;
      p.yearMasehi = Number(p.yearMasehi || new Date(startIso).getFullYear());
      p.yearHijriah = Number(p.yearHijriah || getHijriYearFromIsoDate(startIso) || 1447);
      p.code = ensureProgramCode(String(p.code || ''), String(p.title || ''), Number(p.yearMasehi || new Date().getFullYear()));
      p.slug = ensureClientSlug(String(p.slug || ''), String(p.title || ''), String(p.name || ''));
      let meta: any = {};
      try { meta = p.metadata ? JSON.parse(String(p.metadata)) : {}; } catch { meta = {}; }
      const normalizedRows = (Array.isArray(meta?.defaultPackageTypePricings) ? meta.defaultPackageTypePricings : [])
        .map((r: any, idx: number) => ({
          id: String(r?.id || `row-${idx + 1}`),
          packageTypeId: Number(r?.packageTypeId || 0),
          priceIdr: Math.max(0, Number(r?.priceIdr || 0)),
          isAllInDefault: Boolean(r?.isAllInDefault),
        }))
        .filter((r: any) => r.packageTypeId > 0);
      const resolvedMetaTypeId = Number(
        meta?.defaultPackageTypeId
        || normalizedRows.find((r: any) => r.isAllInDefault)?.packageTypeId
        || normalizedRows[0]?.packageTypeId
        || 0
      );
      if (resolvedMetaTypeId <= 0) {
        show('Payload JSON: pilih minimal 1 Tipe Harga (Package Types) di defaultPackageTypePricings');
        return;
      }
      const defaultClassId = Number(classes[0]?.id || 0);
      const payloadPackages = Array.isArray(p?.packages) ? p.packages : [];
      p.packages = payloadPackages.length > 0
        ? payloadPackages.map((pkg: any) => ({
          ...pkg,
          id: undefined,
          packageClassMasterId: Number(pkg?.packageClassMasterId || defaultClassId || 0),
          priceQuad: Math.max(0, Number(pkg?.priceQuad || 0)),
          priceTripleAdditional: Math.max(0, Number(pkg?.priceTripleAdditional || 0)),
          priceDoubleAdditional: Math.max(0, Number(pkg?.priceDoubleAdditional || 0)),
          makkahHotelId: Number(pkg?.makkahHotelId || 0),
          makkahNights: Math.max(1, Number(pkg?.makkahNights || 1)),
          madinahHotelId: Number(pkg?.madinahHotelId || 0),
          madinahNights: Math.max(1, Number(pkg?.madinahNights || 1)),
        }))
        : [{
          packageClassMasterId: defaultClassId || 0,
          priceQuad: 0,
          priceTripleAdditional: 0,
          priceDoubleAdditional: 0,
          makkahHotelId: Number(hotels[0]?.id || 0),
          makkahNights: 1,
          madinahHotelId: Number(hotels[0]?.id || 0),
          madinahNights: 1,
          id: null,
        }];
      const badPkg = (Array.isArray(p.packages) ? p.packages : []).find((pkg: any) =>
        Number(pkg?.packageClassMasterId || 0) <= 0 ||
        Number(pkg?.makkahHotelId || 0) <= 0 ||
        Number(pkg?.madinahHotelId || 0) <= 0
      );
      if (badPkg) {
        show('Payload JSON: packageClassMasterId, makkahHotelId, dan madinahHotelId wajib valid (> 0)');
        return;
      }
      p.metadata = JSON.stringify({
        ...meta,
        defaultPackageTypeId: resolvedMetaTypeId,
        defaultPackageTypePricings: normalizedRows,
      });
      setWizardPayloadExecuting(true);
      let targetProgramId = editingId ?? null;
      if (method === 'PUT' && editingId) {
        await apiPut(`/api/v1/master/programs/${editingId}`, payload);
        targetProgramId = editingId;
      } else {
        const created = await apiPost<any>('/api/v1/master/programs', payload);
        targetProgramId = Number(created?.id ?? created?.data?.id ?? 0) || null;
        if (!targetProgramId) {
          show('Program tidak mengembalikan id. Cek response API/create DTO.');
          return;
        }
      }
      if (targetProgramId && labelsPayload && Array.isArray(labelsPayload.packageLabelTagIds)) {
        try {
          await apiPut(`/api/v1/master/programs/${targetProgramId}/labels`, {
            packageLabelTagIds: labelsPayload.packageLabelTagIds.map((n: any) => Number(n)).filter((n: number) => Number.isFinite(n) && n > 0),
          });
        } catch {
          show(`Program tersimpan (#${targetProgramId}), tapi sinkron label gagal`);
        }
      }
      setWizardPayloadModalOpen(false);
      setEditingId(null);
      setForm(blankProgram());
      show(`Execute JSON berhasil (Program ID: ${targetProgramId ?? '-'})`);
      await loadList();
      if (targetProgramId) {
        try {
          const detail = await apiGet<any>(`/api/v1/master/programs/${targetProgramId}`);
          const program = (detail?.data ?? detail) as any;
          if (program && Number(program?.id || 0) > 0) {
            setItems((prev) => [program, ...prev.filter((x) => Number(x?.id) !== Number(program.id))]);
          }
        } catch {
          // ignore fallback hydrate failure
        }
      }
    } catch (e) {
      show(e instanceof Error ? e.message : 'Gagal execute JSON');
    } finally {
      setWizardPayloadExecuting(false);
    }
  };

  const closeQuickAdd = (force = false) => {
    if (busy) return;
    if (!force && hasQuickAddDraft) {
      setQuickAddCloseConfirmOpen(true);
      return;
    }
    setQuickAddCloseConfirmOpen(false);
    setQuickAddOpen(false);
  };

  const closeImageModal = () => {
    if (busy || uploading) return;
    setImageModalOpen(false);
  };

  const generateSeoFromStepOne = () => {
    const baseTitle = String(form.title || form.name || 'paket-umroh').trim();
    const year = Number(form.yearMasehi || new Date().getFullYear());
    const days = Number(form.durationDays || 0);
    const slugSource = `${baseTitle} ${year}`.trim();
    const nextSlug = toSlug(slugSource);
    const currentDesc = String(form.description || '').trim();
    const safeBrand = String(seoBrandTag || 'alfiantour')
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, '');
    const brandTag = safeBrand ? `#${safeBrand}` : '#alfiantour';
    const generatedDesc = [
      `${baseTitle} ${year} dengan durasi ${days > 0 ? `${days} hari` : 'terbaik'}.`,
      'Program umroh nyaman untuk keluarga dan lansia, layanan terarah dari tim profesional.',
      `${brandTag} #umroh #haji #umrohlansia`,
    ].join(' ');
    setForm((prev) => ({
      ...prev,
      slug: nextSlug || prev.slug,
      description: currentDesc.length > 0 ? `${currentDesc}\n\n${generatedDesc}` : generatedDesc,
    }));
    show('SEO berhasil digenerate dari data step 1');
  };

  const closeConfigModal = () => {
    if (busy) return;
    setConfigModalOpen(false);
  };

  const openLabelsModal = (item: any) => {
    setLabelsProgramId(Number(item.id));
    setLabelsProgramTitle(String(item.title || item.name || `Program #${item.id}`));
    const current = Array.isArray(item.labelTags)
      ? item.labelTags.map((t: any) => Number(t.packageLabelTagId ?? t.id)).filter((n: number) => Number.isFinite(n) && n > 0)
      : [];
    setLabelsSelection(current);
    setLabelsModalOpen(true);
  };

  const saveProgramLabels = async () => {
    if (!labelsProgramId) return;
    setBusy(true);
    try {
      await apiPut(`/api/v1/master/programs/${labelsProgramId}/labels`, {
        packageLabelTagIds: labelsSelection,
      });
      show('Label paket berhasil diperbarui');
      setLabelsModalOpen(false);
      await loadList();
    } catch (e) {
      show(e instanceof Error ? e.message : 'Gagal memperbarui label paket');
    } finally {
      setBusy(false);
    }
  };

  const generateFileIdSlug = () => {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-_';
    let out = '';
    for (let i = 0; i < 12; i++) out += chars[Math.floor(Math.random() * chars.length)];
    return out;
  };

  const createQuickPackage = async () => {
    if (!quickServiceId) {
      show('Pilih layanan terlebih dahulu');
      return;
    }
    if (!quickPackageName.trim()) {
      show('Nama paket wajib diisi');
      return;
    }
    setBusy(true);
    try {
      let slug = generateFileIdSlug();
      const existing = new Set(items.map((x) => String(x.slug || '').toLowerCase()));
      while (existing.has(slug.toLowerCase())) slug = generateFileIdSlug();

      const service = services.find((x) => x.id === Number(quickServiceId));
      const now = new Date();
      const later = new Date(now);
      later.setDate(later.getDate() + 30);
      const payload: any = {
        name: quickPackageName.trim(),
        code: null,
        description: null,
        isActive: true,
        sortOrder: 0,
        slug,
        metadata: JSON.stringify({
          serviceCategoryId: Number(quickServiceId),
          serviceCategoryName: service?.name ?? null,
          serviceCategorySlug: service?.slug ?? null,
          createdByFlow: 'quick-add',
        }),
        title: quickPackageName.trim(),
        yearMasehi: now.getFullYear(),
        yearHijriah: 1447,
        durationDays: 9,
        departurePeriodStart: now.toISOString(),
        departurePeriodEnd: later.toISOString(),
        downPayment: 0,
        airlineId: null,
        guideUserId: null,
        officeBranchId: null,
        includedItems: [],
        excludedItems: [],
        certifications: [],
        packages: [],
      };

      await apiPost('/api/v1/master/programs', payload);
      show('Draft paket berhasil dibuat');
      setQuickAddOpen(false);
      setQuickServiceId('');
      setQuickPackageName('');
      await loadList();
    } catch (e) {
      show(e instanceof Error ? e.message : 'Gagal membuat draft paket');
    } finally {
      setBusy(false);
    }
  };

  const openImagesModal = async (item: any) => {
    setImageProgramId(Number(item.id));
    setImageProgramTitle(String(item.title || item.name || `Program #${item.id}`));
    setImages([]);
    setImageModalOpen(true);
    try {
      const res = await apiGet<ProgramImage[]>(`/api/v1/master/programs/${item.id}/images`);
      setImages(Array.isArray(res) ? res : []);
    } catch (e) {
      show(e instanceof Error ? e.message : 'Gagal memuat gambar');
    }
  };

  const uploadProgramImages = async (files: FileList | null) => {
    if (!imageProgramId || !files || files.length === 0) return;
    setBusy(true);
    setUploading(true);
    setUploadProgress(0);
    setUploadFileTotal(files.length);
    try {
      const token = getAuthToken();
      if (!token) throw new Error('Token login tidak ditemukan');
      const fd = new FormData();
      Array.from(files).forEach((f) => fd.append('files', f));
      const responseText = await new Promise<string>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', `${API_BASE_URL}/api/v1/master/programs/${imageProgramId}/images/upload`);
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
        xhr.upload.onprogress = (evt) => {
          if (!evt.lengthComputable) return;
          const pct = Math.max(0, Math.min(100, Math.round((evt.loaded / evt.total) * 100)));
          setUploadProgress(pct);
        };
        xhr.onload = () => {
          if (xhr.status === 401) {
            const locale = window.location.pathname.split('/').filter(Boolean)[0] || 'id';
            const returnUrl = `${window.location.pathname}${window.location.search || ''}`;
            localStorage.removeItem('travelapp_auth');
            window.location.replace(`/${locale}/login?returnUrl=${encodeURIComponent(returnUrl)}`);
            reject(new Error('Unauthorized'));
            return;
          }
          if (xhr.status < 200 || xhr.status >= 300) {
            reject(new Error(`HTTP ${xhr.status}`));
            return;
          }
          resolve(xhr.responseText || '[]');
        };
        xhr.onerror = () => reject(new Error('Upload gagal'));
        xhr.send(fd);
      });
      const json = JSON.parse(responseText) as ProgramImage[];
      setImages(json);
      show('Upload gambar berhasil');
      await loadList();
    } catch (e) {
      show(e instanceof Error ? e.message : 'Upload gagal');
    } finally {
      setBusy(false);
      setTimeout(() => {
        setUploading(false);
        setUploadProgress(0);
        setUploadFileTotal(0);
      }, 400);
    }
  };

  const setCoverImage = async (imageId: number) => {
    if (!imageProgramId) return;
    setBusy(true);
    try {
      const json = await apiPost<ProgramImage[]>(`/api/v1/master/programs/${imageProgramId}/images/${imageId}/set-cover`);
      setImages(Array.isArray(json) ? json : []);
      show('Cover berhasil diubah');
      await loadList();
    } catch (e) {
      show(e instanceof Error ? e.message : 'Gagal set cover');
    } finally {
      setBusy(false);
    }
  };

  const deleteImage = async (imageId: number) => {
    if (!imageProgramId) return;
    setBusy(true);
    try {
      const token = getAuthToken();
      if (!token) throw new Error('Token login tidak ditemukan');
      const res = await fetch(`${API_BASE_URL}/api/v1/master/programs/${imageProgramId}/images/${imageId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = (await res.json()) as ProgramImage[];
      setImages(json);
      show('Gambar dihapus');
      await loadList();
    } catch (e) {
      show(e instanceof Error ? e.message : 'Gagal hapus gambar');
    } finally {
      setBusy(false);
    }
  };

  const formatIdrInput = (value: number | undefined) => {
    const n = Number(value || 0);
    return n > 0 ? new Intl.NumberFormat('id-ID').format(n) : '';
  };
  const formatIdrInputAllowZero = (value: number | undefined) => {
    const n = Number(value ?? 0);
    return new Intl.NumberFormat('id-ID').format(Math.max(0, n));
  };

  const parseCurrencyInput = (raw: string) => Number(raw.replace(/[^\d]/g, '') || '0');
  const normalizePackageTypePricings = (cfg: ProgramDisplayConfig): Array<{ id: string; packageTypeId: number; priceIdr: number; packageTypeName?: string; isAllInDefault?: boolean }> => {
    const rawRows = Array.isArray(cfg.packageTypePricings) ? cfg.packageTypePricings : [];
    const cleanRows = rawRows
      .map((x, idx) => ({
        id: x?.id || `${x?.packageTypeId || 0}-${idx}`,
        packageTypeId: Number(x?.packageTypeId || 0),
        priceIdr: Number(x?.priceIdr || 0),
        packageTypeName: String(x?.packageTypeName || '').trim(),
        isAllInDefault: Boolean(x?.isAllInDefault),
      }))
      .filter((x) => x.packageTypeId > 0);
    if (cleanRows.length > 0) return cleanRows;
    if (cfg.packageTypeId && Number(cfg.packageTypeId) > 0) {
      return [{
        id: `${cfg.packageTypeId}-legacy`,
        packageTypeId: Number(cfg.packageTypeId),
        priceIdr: Number(cfg.priceIdr || 0),
        packageTypeName: packageTypes.find((x) => x.id === Number(cfg.packageTypeId))?.name ?? '',
        isAllInDefault: true,
      }];
    }
    return [];
  };

  const deleteProgramCascade = async (programId: number) => {
    const warn = (msg: string) => console.warn(`[program-delete:${programId}] ${msg}`);
    let programDetail: any = null;
    try {
      programDetail = await apiGet<any>(`/api/v1/master/programs/${programId}`);
    } catch (e) {
      warn(`load detail failed: ${e instanceof Error ? e.message : 'unknown'}`);
    }

    const packageRefs = Array.isArray(programDetail?.packages) ? programDetail.packages : [];
    for (const pkg of packageRefs) {
      const packageId = Number(pkg?.id || 0);
      if (!packageId) continue;
      try {
        await apiPut(`/api/v1/master/programs/packages/${packageId}/departures`, []);
      } catch (e) {
        warn(`clear departures for package ${packageId} failed: ${e instanceof Error ? e.message : 'unknown'}`);
      }
    }

    try {
      const imgs = await apiGet<ProgramImage[]>(`/api/v1/master/programs/${programId}/images`);
      for (const img of (Array.isArray(imgs) ? imgs : [])) {
        const imageId = Number(img?.id || 0);
        if (!imageId) continue;
        try {
          await apiDelete(`/api/v1/master/programs/${programId}/images/${imageId}`);
        } catch (e) {
          warn(`delete image ${imageId} failed: ${e instanceof Error ? e.message : 'unknown'}`);
        }
      }
    } catch (e) {
      warn(`load images failed: ${e instanceof Error ? e.message : 'unknown'}`);
    }

    try {
      await apiPut(`/api/v1/master/programs/${programId}/labels`, { packageLabelTagIds: [] });
    } catch (e) {
      warn(`clear labels failed: ${e instanceof Error ? e.message : 'unknown'}`);
    }

    try {
      await apiPut(`/api/v1/master/programs/${programId}/display-config`, {});
    } catch (e) {
      warn(`clear display-config failed: ${e instanceof Error ? e.message : 'unknown'}`);
    }

    await apiDelete(`/api/v1/master/programs/${programId}`);
  };

  const hardDeleteProgram = async (programId: number) => {
    await apiDelete(`/api/v1/master/programs/${programId}/hard`);
  };


  const openProgramJsonModal = async (item: any) => {
    try {
      const id = Number(item?.id || 0);
      let detail: any = item;
      if (id > 0) {
        try {
          const res = await apiGet<any>(`/api/v1/master/programs/${id}`);
          detail = res?.data ?? res ?? item;
        } catch {
          // fallback to item card payload
        }
      }
      setProgramJsonTitle(String(detail?.title || detail?.name || `Program #${id || '-'}`));
      setProgramJsonText(JSON.stringify(detail, null, 2));
      setProgramJsonModalOpen(true);
    } catch (e) {
      show(e instanceof Error ? e.message : 'Gagal menyiapkan JSON program');
    }
  };
  const parseDisplayConfig = (raw: unknown): ProgramDisplayConfig => {
    try {
      if (typeof raw !== 'string' || !raw.trim()) return {};
      return JSON.parse(raw) as ProgramDisplayConfig;
    } catch {
      return {};
    }
  };
  const getLinkedPackageTypeLabel = (cfg: ProgramDisplayConfig): string => {
    const rows = normalizePackageTypePricings(cfg);
    if (rows.length === 0) return 'Belum ada package type';
    return rows
      .map((r) => {
        const name = packageTypes.find((x) => x.id === r.packageTypeId)?.name ?? `Type #${r.packageTypeId}`;
        return `${name} (Rp ${Number(r.priceIdr || 0).toLocaleString('id-ID')})`;
      })
      .join(' • ');
  };
  const formatPreviewRange = (startRaw?: string, endRaw?: string): string => {
    if (!startRaw) return '';
    const start = new Date(startRaw);
    if (Number.isNaN(start.getTime())) return '';
    const end = endRaw ? new Date(endRaw) : null;
    const startText = start.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
    if (!end || Number.isNaN(end.getTime())) return startText;
    const endText = end.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
    return `${startText} - ${endText}`;
  };
  const getScheduleDays = (startRaw?: string, endRaw?: string): number | null => {
    if (!startRaw) return null;
    const start = new Date(startRaw);
    const end = endRaw ? new Date(endRaw) : new Date(startRaw);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return null;
    const safeEnd = end < start ? start : end;
    return Math.max(1, Math.floor((safeEnd.getTime() - start.getTime()) / 86400000) + 1);
  };
  const getVoucherPreview = (rule: { type?: 'fixed' | 'percent'; value?: number }) => {
    const basePrice = Number(normalizePackageTypePricings(config)[0]?.priceIdr || config.priceIdr || 0);
    const raw = Number(rule.value || 0);
    if (basePrice <= 0 || raw <= 0) {
      return { basePrice, discountAmount: 0, finalPrice: basePrice };
    }
    const discountAmount = rule.type === 'percent'
      ? Math.min(basePrice, Math.round((basePrice * raw) / 100))
      : Math.min(basePrice, raw);
    return {
      basePrice,
      discountAmount,
      finalPrice: Math.max(0, basePrice - discountAmount),
    };
  };
  const getDefaultItineraryTemplate = (day: number): { title: string; description: string } => {
    if (day === 1) {
      return {
        title: 'Keberangkatan dari Indonesia - Transit/Direct ke Arab Saudi',
        description: 'Check-in bandara, briefing tim, proses imigrasi, penerbangan menuju Arab Saudi, check-in hotel dan istirahat.',
      };
    }
    if (day === 2) {
      return {
        title: 'Orientasi Ibadah dan City Orientation',
        description: 'Pembekalan teknis ibadah, pengenalan area sekitar hotel/masjid, penyesuaian jadwal ibadah jamaah.',
      };
    }
    return {
      title: `Program Ibadah Hari Ke-${day}`,
      description: 'Agenda ibadah terjadwal, pendampingan mutawwif/muthawwifah, serta waktu istirahat sesuai kondisi jamaah.',
    };
  };
  const buildItineraryAiPrompt = (): string => {
    const activeRows = departureRows.filter((x) => x.departureDate);
    const scheduleLines = activeRows.map((d, idx) => {
      const days = getScheduleDays(d.departureDate, d.returnDate) ?? 1;
      return `- Jadwal ${idx + 1}: ${formatPreviewRange(d.departureDate, d.returnDate)} (${days} hari)`;
    }).join('\n');
    return [
      'Buat itinerary perjalanan Umroh berbahasa Indonesia dengan format JSON valid tanpa markdown.',
      'Gunakan nada profesional, ringkas, dan umum untuk travel Umroh (termasuk ramah lansia).',
      '',
      'Data jadwal:',
      scheduleLines || '- Tidak ada jadwal',
      '',
      'Format JSON WAJIB:',
      '[',
      '  {',
      '    "departureDate": "YYYY-MM-DD",',
      '    "returnDate": "YYYY-MM-DD",',
      '    "items": [',
      '      { "day": 1, "title": "string", "description": "string" }',
      '    ]',
      '  }',
      ']',
      '',
      'Aturan:',
      '- Jumlah item per jadwal harus sama dengan jumlah hari pada jadwal tersebut.',
      '- Field day dimulai dari 1 per jadwal.',
      '- Jangan tambah field selain departureDate, returnDate, items, day, title, description.',
      '- Kembalikan JSON saja.',
    ].join('\n');
  };
  const flattenItineraryGroups = (groups: Array<{ departureDate: string; returnDate?: string; items: ItineraryItem[] }>): ItineraryItem[] =>
    groups.flatMap((g) => g.items ?? []);
  const itineraryGroupsForEditor = useMemo(() => {
    if (Array.isArray(config.itineraryByDeparture) && config.itineraryByDeparture.length > 0) return config.itineraryByDeparture;
    return [{ departureDate: '', returnDate: '', items: Array.isArray(config.itineraries) ? config.itineraries : [] }];
  }, [config.itineraryByDeparture, config.itineraries]);
  const packageOfferSummary = useMemo(() => {
    const pricingRows = normalizePackageTypePricings(config);
    const includeTotal = (config.includePricings ?? []).reduce((s, x) => s + Number(x.price || 0), 0);
    const insuranceDefault = config.insuranceMode === 'required'
      ? Number((config.insuranceOptions ?? [])[0]?.pricePerPax || 0)
      : 0;
    return pricingRows.map((r) => {
      const base = Number(r.priceIdr || 0);
      const discountRaw = Number(config.discountValue || 0);
      const discount = config.discountType === 'percent'
        ? Math.round((base * Math.max(0, Math.min(discountRaw, 100))) / 100)
        : Math.max(0, discountRaw);
      const allIn = Math.max(0, base - Math.min(base, discount) + includeTotal + insuranceDefault);
      const typeName = packageTypes.find((x) => x.id === r.packageTypeId)?.name ?? `Type #${r.packageTypeId}`;
      return { typeName, base, allIn };
    });
  }, [config, packageTypes]);
  const isFlashSaleActive = (item: any): boolean => {
    const cfg = parseDisplayConfig(item?.displayConfigJson);
    if (cfg.flashSaleEnabled === false) return false;
    if (!cfg.flashSaleEndsAt) return false;
    const end = new Date(cfg.flashSaleEndsAt).getTime();
    return Number.isFinite(end) && end > Date.now();
  };
  const toDateTimeLocalValue = (iso?: string): string => {
    if (!iso) return '';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '';
    const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
    return local.toISOString().slice(0, 16);
  };
  const openFlashSaleModal = (item: any) => {
    const cfg = parseDisplayConfig(item?.displayConfigJson);
    setFlashSaleProgramId(Number(item?.id || 0));
    setFlashSaleProgramTitle(String(item?.title || item?.name || `Program #${item?.id}`));
    setFlashSaleEndsAt(toDateTimeLocalValue(cfg.flashSaleEndsAt));
    setFlashSaleModalOpen(true);
  };
  const saveFlashSale = async () => {
    if (!flashSaleProgramId) return;
    if (!flashSaleEndsAt) {
      show('Pilih tanggal & jam berakhir Flash Sale');
      return;
    }
    const endAt = new Date(flashSaleEndsAt);
    if (Number.isNaN(endAt.getTime()) || endAt.getTime() <= Date.now()) {
      show('Waktu berakhir harus lebih besar dari waktu sekarang');
      return;
    }
    try {
      setBusy(true);
      const target = items.find((x) => Number(x.id) === Number(flashSaleProgramId));
      const cfg = parseDisplayConfig(target?.displayConfigJson);
      const nextCfg: ProgramDisplayConfig = {
        ...cfg,
        flashSaleEnabled: true,
        flashSaleEndsAt: endAt.toISOString(),
      };
      await apiPut(`/api/v1/master/programs/${flashSaleProgramId}/display-config`, {
        displayConfigJson: JSON.stringify(nextCfg),
      });
      setFlashSaleModalOpen(false);
      show('Flash Sale disimpan');
      await loadList();
    } catch (e) {
      show(e instanceof Error ? e.message : 'Gagal menyimpan Flash Sale');
    } finally {
      setBusy(false);
    }
  };
  const unsetFlashSale = async (item: any) => {
    try {
      setBusy(true);
      const cfg = parseDisplayConfig(item?.displayConfigJson);
      const nextCfg: ProgramDisplayConfig = {
        ...cfg,
        flashSaleEnabled: false,
        flashSaleEndsAt: undefined,
      };
      await apiPut(`/api/v1/master/programs/${item.id}/display-config`, {
        displayConfigJson: JSON.stringify(nextCfg),
      });
      show('Flash Sale dinonaktifkan');
      await loadList();
    } catch (e) {
      show(e instanceof Error ? e.message : 'Gagal menonaktifkan Flash Sale');
    } finally {
      setBusy(false);
    }
  };

  const openConfigModal = async (item: any) => {
    const programMeta = parseProgramMetadata(item?.metadata);
    const defaultPackageTypeId = Math.max(0, Number(programMeta.defaultPackageTypeId ?? 0));
    const wizardDefaultPricings = Array.isArray(programMeta.defaultPackageTypePricings)
      ? programMeta.defaultPackageTypePricings
        .map((r: any, idx: number) => ({
          id: String(r?.id || `${r?.packageTypeId || 0}-${idx}`),
          packageTypeId: Number(r?.packageTypeId || 0),
          priceIdr: Number(r?.priceIdr || 0),
          isAllInDefault: Boolean(r?.isAllInDefault),
        }))
        .filter((r: any) => r.packageTypeId > 0)
      : [];
    const defaultSeatCapacity = Math.max(0, Number(programMeta.defaultSeatCapacity ?? 0));
    const defaultSeatAvailable = Math.max(0, Number(programMeta.defaultSeatAvailable ?? defaultSeatCapacity));
    const packageRefs = Array.isArray(item?.packages) ? item.packages.map((p: any) => ({ id: Number(p.id), packageClassMasterId: p.packageClassMasterId, packageClassName: p.packageClassName })) : [];
    const defaultProgramPackageId = packageRefs[0]?.id ? Number(packageRefs[0].id) : '';
    setConfigProgramId(Number(item.id));
    setConfigProgramTitle(String(item.title || item.name || `Program #${item.id}`));
    setConfigDefaultPackageTypeId(defaultPackageTypeId);
    setConfigDefaultSeatCapacity(defaultSeatCapacity);
    setConfigDefaultSeatAvailable(defaultSeatAvailable);
    setConfigDownPayment(Number(item?.downPayment || 0));
    setConfig({ itineraries: [], flightInfos: [] });
    setConfigPackages(packageRefs);
    setSelectedConfigPackageId(defaultProgramPackageId);
    setDepartureRows([]);
    setOpenItineraryGroupIdx(0);
    setCollapsedScheduleCards([]);
    setTermsSectionOpen(false);
    setScheduleSectionOpen(true);
    setDiscountSectionOpen(true);
    setItinerarySectionOpen(true);
    setCurrencyPreviewRows([]);
    setConfigModalOpen(true);
    const parsed = parseDisplayConfig(item?.displayConfigJson);
    const normalizedPricings = normalizePackageTypePricings(parsed);
    const pricingRows = normalizedPricings.length > 0
      ? normalizedPricings
      : (wizardDefaultPricings.length > 0 ? wizardDefaultPricings : [{ id: crypto.randomUUID(), packageTypeId: 0, priceIdr: 0 }]);
    const pricingDefaultTypeId =
      pricingRows.find((r) => r.isAllInDefault)?.packageTypeId
      ?? pricingRows[0]?.packageTypeId
      ?? 0;
    const resolvedDefaultPackageTypeId = defaultPackageTypeId > 0 ? defaultPackageTypeId : Number(pricingDefaultTypeId || 0);
    setConfigDefaultPackageTypeId(resolvedDefaultPackageTypeId);
    setConfig({
      ...parsed,
      jamaahDataMode: parsed.jamaahDataMode ?? 'required_full',
      itineraries: [],
      flightInfos: [],
      facilities: (Array.isArray(parsed.facilities) ? parsed.facilities : [])
        .map((x) => ({
          facilityMasterId: Number(x?.facilityMasterId || 0),
          name: String(x?.name || ''),
          icon: String(x?.icon || ''),
        }))
        .filter((x) => x.facilityMasterId > 0),
      packageTypePricings: pricingRows,
      packageTypeId: pricingRows[0]?.packageTypeId ?? parsed.packageTypeId,
      priceIdr: pricingRows[0]?.priceIdr ?? parsed.priceIdr,
    });
    if (defaultProgramPackageId) void loadDepartures(Number(defaultProgramPackageId), parsed, resolvedDefaultPackageTypeId);
  };

  const openDurationEditModal = async () => {
    const selectedId = Number(selectedDurationTypeId || 0);
    if (!selectedId) {
      show('Pilih dulu satu Duration Program');
      return;
    }
    try {
      setDurationEditBusy(true);
      const detail = await apiGet<any>(`/api/v1/master/DurationTypes/${selectedId}`);
      const src = (detail?.data ?? detail ?? {}) as any;
      setDurationEditForm({
        id: selectedId,
        name: String(src.name ?? src.Name ?? selectedDurationType?.name ?? ''),
        defaultDays: Number(src.defaultDays ?? src.DefaultDays ?? selectedDurationType?.defaultDays ?? 1),
        defaultNights: Number(src.defaultNights ?? src.DefaultNights ?? selectedDurationType?.defaultNights ?? 0),
        displayFormat: String(src.displayFormat ?? src.DisplayFormat ?? selectedDurationType?.displayFormat ?? ''),
        description: String(src.description ?? src.Description ?? ''),
        durationSortOrder: Number(src.durationSortOrder ?? src.sortOrder ?? src.DurationSortOrder ?? 0),
        code: String(src.code ?? src.Code ?? ''),
      });
      setDurationEditModalOpen(true);
    } catch {
      const fallback = durationTypes.find((d) => d.id === selectedId);
      if (!fallback) {
        show('Gagal memuat data Duration Type');
        return;
      }
      setDurationEditForm({
        id: selectedId,
        name: String(fallback.name || ''),
        defaultDays: Number(fallback.defaultDays || 1),
        defaultNights: Number(fallback.defaultNights || 0),
        displayFormat: String(fallback.displayFormat || ''),
        description: '',
        durationSortOrder: 0,
        code: '',
      });
      setDurationEditModalOpen(true);
    } finally {
      setDurationEditBusy(false);
    }
  };

  const saveDurationEdit = async () => {
    if (!durationEditForm.id) return;
    if (!durationEditForm.name.trim()) {
      show('Nama duration wajib diisi');
      return;
    }
    if (Number(durationEditForm.defaultDays || 0) <= 0) {
      show('Default hari minimal 1');
      return;
    }
    try {
      setDurationEditBusy(true);
      await apiPut(`/api/v1/master/DurationTypes/${durationEditForm.id}`, {
        id: durationEditForm.id,
        code: durationEditForm.code || undefined,
        name: durationEditForm.name.trim(),
        description: durationEditForm.description || undefined,
        durationSortOrder: Number(durationEditForm.durationSortOrder || 0),
        defaultDays: Number(durationEditForm.defaultDays || 1),
        defaultNights: Math.max(0, Number(durationEditForm.defaultNights || 0)),
        displayFormat: durationEditForm.displayFormat || undefined,
      });
      setDurationEditModalOpen(false);
      show('Duration Type berhasil diperbarui');
      await loadRefs();
      setForm((x) => ({
        ...x,
        durationDays: Number(durationEditForm.defaultDays || x.durationDays || 1),
        departurePeriodEnd: x.departurePeriodStart
          ? calcEndDateFromStartAndDays(String(x.departurePeriodStart).slice(0, 10), Number(durationEditForm.defaultDays || x.durationDays || 1))
          : x.departurePeriodEnd,
      }));
    } catch (e) {
      show(e instanceof Error ? e.message : 'Gagal update Duration Type');
    } finally {
      setDurationEditBusy(false);
    }
  };

  const loadDepartures = async (programPackageId: number, sourceConfig?: ProgramDisplayConfig, fallbackPackageTypeId = 0) => {
    try {
      const cfg = sourceConfig ?? config;
      const hotelMappings = Array.isArray(cfg.departureHotelMappings) ? cfg.departureHotelMappings : [];
      const rows = await apiGet<any[]>(`/api/v1/master/programs/packages/${programPackageId}/departures`);
      const mapped = (Array.isArray(rows) ? rows : []).map((x) => ({
        departureDate: String(x.departureDate || '').slice(0, 10),
        returnDate: x.returnDate ? String(x.returnDate).slice(0, 10) : '',
        seatCapacity: Number(x.seatCapacity || 0),
        seatAvailable: Number(x.seatAvailable || 0),
        packageTypeId: x.packageTypeId ?? (fallbackPackageTypeId > 0 ? fallbackPackageTypeId : undefined),
        airlineId: x.airlineId ?? undefined,
        airlineIds: Array.isArray(x.airlineIds)
          ? x.airlineIds.map((v: unknown) => Number(v)).filter((v: number) => Number.isFinite(v) && v > 0)
          : (x.airlineId ? [Number(x.airlineId)] : []),
        departureAirportId: x.departureAirportId ?? undefined,
        makkahHotelId: x.makkahHotelId ?? undefined,
        madinahHotelId: x.madinahHotelId ?? undefined,
        hotelIds: Array.isArray(x.hotelIds)
          ? x.hotelIds.map((v: unknown) => Number(v)).filter((v: number) => Number.isFinite(v) && v > 0)
          : [x.makkahHotelId, x.madinahHotelId].map((v) => Number(v)).filter((v) => Number.isFinite(v) && v > 0),
        hotelStays: Array.isArray(x.hotelStays)
          ? x.hotelStays
            .map((r: any) => ({ hotelId: Number(r?.hotelId || 0), nights: Number(r?.nights || 0) }))
            .filter((r: any) => r.hotelId > 0)
          : [],
        hotelRoomPrices: Array.isArray(x.hotelRoomPrices)
          ? x.hotelRoomPrices
            .map((r: any) => ({
              hotelId: Number(r?.hotelId || 0),
              roomTypeMasterId: Number(r?.roomTypeMasterId || 0),
              price: Number(r?.price || 0),
            }))
            .filter((r: any) => r.hotelId > 0 && r.roomTypeMasterId > 0)
          : [],
        hotelOccupancyPrices: Array.isArray(x.hotelOccupancyPrices)
          ? x.hotelOccupancyPrices
            .map((r: any) => ({
              hotelId: Number(r?.hotelId || 0),
              priceQuad: r?.priceQuad != null ? Number(r.priceQuad) : undefined,
              priceTripleAdditional: r?.priceTripleAdditional != null ? Number(r.priceTripleAdditional) : undefined,
              priceDoubleAdditional: r?.priceDoubleAdditional != null ? Number(r.priceDoubleAdditional) : undefined,
            }))
            .filter((r: any) => r.hotelId > 0)
          : [],
        priceQuad: x.priceQuad ?? undefined,
        priceTripleAdditional: x.priceTripleAdditional ?? undefined,
        priceDoubleAdditional: x.priceDoubleAdditional ?? undefined,
        customAdditionalPrice: x.customAdditionalPrice != null ? Number(x.customAdditionalPrice) : 0,
      })) as DepartureRow[];

      const merged = mapped.map((row) => {
        const key = String(row.departureDate || '').slice(0, 10);
        const hm = hotelMappings.find((m) => String(m.departureDate || '').slice(0, 10) === key);
        if (!hm) return row;
        const hasHotelIds = Array.isArray(row.hotelIds) && row.hotelIds.length > 0;
        const hasHotelStays = Array.isArray(row.hotelStays) && row.hotelStays.length > 0;
        const hasRoomPrices = Array.isArray(row.hotelRoomPrices) && row.hotelRoomPrices.length > 0;
        const hasOcc = Array.isArray(row.hotelOccupancyPrices) && row.hotelOccupancyPrices.length > 0;
        const nextHotelIds = hasHotelIds ? row.hotelIds : (hm.hotelIds ?? []);
        const nextStays = hasHotelStays ? row.hotelStays : (hm.hotelStays ?? []);
        const nextRoomPrices = hasRoomPrices ? row.hotelRoomPrices : (hm.hotelRoomPrices ?? []);
        const nextOcc = hasOcc ? row.hotelOccupancyPrices : (hm.hotelOccupancyPrices ?? []);
        return {
          ...row,
          hotelIds: nextHotelIds,
          hotelStays: nextStays,
          hotelRoomPrices: nextRoomPrices,
          hotelOccupancyPrices: nextOcc,
          makkahHotelId: row.makkahHotelId ?? nextHotelIds?.[0],
          madinahHotelId: row.madinahHotelId ?? nextHotelIds?.[1],
          priceQuad: row.priceQuad ?? nextOcc?.[0]?.priceQuad,
          priceTripleAdditional: row.priceTripleAdditional ?? nextOcc?.[0]?.priceTripleAdditional,
          priceDoubleAdditional: row.priceDoubleAdditional ?? nextOcc?.[0]?.priceDoubleAdditional,
        } as DepartureRow;
      });
      setDepartureRows(merged);
    } catch (e) {
      show(e instanceof Error ? e.message : 'Gagal memuat jadwal keberangkatan');
    }
  };

  const generateItinerary = () => {
    const validDepartures = departureRows.filter((x) => x.departureDate);
    if (validDepartures.length === 0) {
      show('Tambahkan jadwal keberangkatan dulu pada bagian Jadwal Keberangkatan');
      return;
    }
    const rows: ItineraryItem[] = [];
    const groupedRows: Array<{ departureDate: string; returnDate?: string; items: ItineraryItem[] }> = [];
    validDepartures.forEach((dep, depIdx) => {
      const start = new Date(dep.departureDate);
      const end = dep.returnDate ? new Date(dep.returnDate) : new Date(dep.departureDate);
      if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return;
      const safeEnd = end < start ? start : end;
      const days = Math.max(1, Math.floor((safeEnd.getTime() - start.getTime()) / 86400000) + 1);
      const label = formatPreviewRange(dep.departureDate, dep.returnDate);
      const groupItems: ItineraryItem[] = [];
      for (let i = 0; i < days; i += 1) {
        const tpl = getDefaultItineraryTemplate(i + 1);
        const item: ItineraryItem = {
          day: i + 1,
          title: `Jadwal ${depIdx + 1} - ${tpl.title}`,
          description: `${tpl.description}\nPeriode: ${label}`,
        };
        rows.push(item);
        groupItems.push(item);
      }
      groupedRows.push({
        departureDate: dep.departureDate,
        returnDate: dep.returnDate,
        items: groupItems,
      });
    });
    if (rows.length === 0) {
      show('Tanggal jadwal tidak valid');
      return;
    }
    setConfig((p) => ({ ...p, itineraries: rows, itineraryByDeparture: groupedRows }));
  };
  const applyItineraryFromAiJson = () => {
    try {
      const parsed = JSON.parse(itineraryAiJson) as Array<{
        departureDate?: string;
        returnDate?: string;
        items?: Array<{ day?: number; title?: string; description?: string }>;
      }>;
      if (!Array.isArray(parsed) || parsed.length === 0) {
        show('JSON itinerary tidak valid');
        return;
      }
      const groups = parsed
        .map((g) => {
          const dep = String(g.departureDate || '').slice(0, 10);
          const ret = g.returnDate ? String(g.returnDate).slice(0, 10) : '';
          const items = (Array.isArray(g.items) ? g.items : [])
            .map((it, idx) => ({
              day: Number(it.day || idx + 1),
              title: String(it.title || `Hari Ke-${idx + 1}`),
              description: String(it.description || ''),
            }))
            .filter((it) => it.day > 0 && it.title.trim().length > 0);
          return { departureDate: dep, returnDate: ret, items };
        })
        .filter((g) => g.items.length > 0);
      if (groups.length === 0) {
        show('JSON itinerary tidak berisi item');
        return;
      }
      setConfig((p) => ({ ...p, itineraryByDeparture: groups, itineraries: flattenItineraryGroups(groups) }));
      setOpenItineraryGroupIdx(0);
      setItineraryAiModalOpen(false);
      setItineraryAiJson('');
      show('Itinerary dari AI berhasil diterapkan');
    } catch {
      show('Format JSON tidak valid');
    }
  };
  const applyInsuranceStandardAllianz = () => {
    const allianz = insuranceTypes.find((x) => String(x.name).toLowerCase().includes('allianz') || String(x.providerName || '').toLowerCase().includes('allianz'));
    const pick = allianz ?? insuranceTypes[0];
    if (!pick) {
      show('Master asuransi belum tersedia');
      return;
    }
    setConfig((p) => ({
      ...p,
      insuranceOptions: [{
        insuranceTypeId: pick.id,
        name: pick.name,
        pricePerPax: Number(pick.basePremium || 0),
        claimWebsite: '',
      }],
    }));
    show(`Standar asuransi diset ke ${pick.name}`);
  };

  const recalcFx = async () => {
    const pricingRows = normalizePackageTypePricings(config);
    if (pricingRows.length === 0) {
      show('Isi dulu minimal 1 harga Package Type');
      return;
    }
    try {
      setCurrencyConverting(true);
      const res = await fetch('https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/idr.json');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json() as { idr?: { usd?: number; sar?: number } };
      const idrToUsd = Number(json?.idr?.usd || 0);
      const idrToSar = Number(json?.idr?.sar || 0);
      if (!idrToUsd || !idrToSar) {
        show('Rate kurs tidak tersedia');
        return;
      }
      const rows = pricingRows.map((r) => {
        const name = packageTypes.find((x) => x.id === r.packageTypeId)?.name ?? `Type #${r.packageTypeId}`;
        const idr = Number(r.priceIdr || 0);
        return {
          packageTypeName: name,
          idr,
          usd: Math.round(idr * idrToUsd * 100) / 100,
          sar: Math.round(idr * idrToSar * 100) / 100,
        };
      });
      setCurrencyPreviewRows(rows);
      const first = rows[0];
      setConfig((p) => ({
        ...p,
        priceUsd: first?.usd ?? p.priceUsd,
        priceSar: first?.sar ?? p.priceSar,
      }));
    } catch (e) {
      show(e instanceof Error ? e.message : 'Gagal konversi kurs');
    } finally {
      setCurrencyConverting(false);
    }
  };

  const saveConfig = async () => {
    if (!configProgramId) return;
    const pricingRows = normalizePackageTypePricings(config);
    if (pricingRows.length === 0) {
      show('Minimal isi 1 Harga IDR per Package Type');
      return;
    }
    for (let i = 0; i < pricingRows.length; i += 1) {
      const row = pricingRows[i];
      if (row.packageTypeId <= 0) {
        show(`Harga Package Type #${i + 1}: tipe paket wajib dipilih`);
        return;
      }
      if (row.priceIdr < 0) {
        show(`Harga Package Type #${i + 1}: harga IDR tidak boleh negatif`);
        return;
      }
    }
    if (!selectedConfigPackageId) {
      show('Pilih kelas paket dulu pada bagian Jadwal Keberangkatan per Kelas Paket');
      return;
    }
    if (departureRows.filter((x) => x.departureDate).length === 0) {
      show('Tambahkan minimal 1 jadwal keberangkatan');
      return;
    }
    try {
      setBusy(true);
      if (selectedConfigPackageId) {
        const activeRows = departureRows.filter((x) => x.departureDate);
        for (let i = 0; i < activeRows.length; i += 1) {
          const row = activeRows[i];
          const rowNo = i + 1;
          const departureDate = new Date(row.departureDate);
          if (Number.isNaN(departureDate.getTime())) {
            show(`Jadwal #${rowNo}: Tanggal berangkat tidak valid`);
            return;
          }
          if (row.returnDate) {
            const returnDate = new Date(row.returnDate);
            if (Number.isNaN(returnDate.getTime())) {
              show(`Jadwal #${rowNo}: Tanggal pulang tidak valid`);
              return;
            }
            if (returnDate < departureDate) {
              show(`Jadwal #${rowNo}: Tanggal pulang tidak boleh lebih awal dari tanggal berangkat`);
              return;
            }
          }
          const seatCapacity = Number(row.seatCapacity || 0);
          const seatAvailable = Number(row.seatAvailable || 0);
          if (seatCapacity < 0 || seatAvailable < 0) {
            show(`Jadwal #${rowNo}: Seat tidak boleh negatif`);
            return;
          }
          if (seatAvailable > seatCapacity) {
            show(`Jadwal #${rowNo}: Sisa seat tidak boleh melebihi total seat`);
            return;
          }
          if (row.priceQuad != null && Number(row.priceQuad) < 0) {
            show(`Jadwal #${rowNo}: Harga Quad tidak boleh negatif`);
            return;
          }
          if (row.priceTripleAdditional != null && Number(row.priceTripleAdditional) < 0) {
            show(`Jadwal #${rowNo}: Harga tambahan Triple tidak boleh negatif`);
            return;
          }
          if (row.priceDoubleAdditional != null && Number(row.priceDoubleAdditional) < 0) {
            show(`Jadwal #${rowNo}: Harga tambahan Double tidak boleh negatif`);
            return;
          }
          for (const hp of (row.hotelOccupancyPrices ?? [])) {
            if ((hp.priceQuad ?? 0) < 0 || (hp.priceTripleAdditional ?? 0) < 0 || (hp.priceDoubleAdditional ?? 0) < 0) {
              show(`Jadwal #${rowNo}: Harga okupansi per hotel tidak boleh negatif`);
              return;
            }
          }
          for (const stay of (row.hotelStays ?? [])) {
            if (stay.nights < 0) {
              show(`Jadwal #${rowNo}: Jumlah malam hotel tidak boleh negatif`);
              return;
            }
          }
        }
        await apiPut(`/api/v1/master/programs/packages/${selectedConfigPackageId}/departures`, {
          departures: activeRows
            .map((x) => ({
              departureDate: new Date(x.departureDate).toISOString(),
              returnDate: x.returnDate ? new Date(x.returnDate).toISOString() : null,
              seatCapacity: Number(x.seatCapacity || 0),
              seatAvailable: Number(x.seatAvailable || 0),
              packageTypeId: x.packageTypeId ?? null,
              airlineIds: (x.airlineIds ?? (x.airlineId ? [x.airlineId] : [])),
              airlineId: (x.airlineIds && x.airlineIds.length > 0) ? x.airlineIds[0] : (x.airlineId ?? null),
              departureAirportId: x.departureAirportId ?? null,
              hotelIds: (x.hotelIds ?? []).filter((id) => Number(id) > 0),
              hotelStays: (x.hotelStays ?? [])
                .map((r) => ({ hotelId: Number(r.hotelId || 0), nights: Number(r.nights || 0) }))
                .filter((r) => r.hotelId > 0),
              hotelRoomPrices: (x.hotelRoomPrices ?? [])
                .map((r) => ({ hotelId: Number(r.hotelId || 0), roomTypeMasterId: Number(r.roomTypeMasterId || 0), price: Number(r.price || 0) }))
                .filter((r) => r.hotelId > 0 && r.roomTypeMasterId > 0),
              hotelOccupancyPrices: (x.hotelOccupancyPrices ?? [])
                .map((r) => ({
                  hotelId: Number(r.hotelId || 0),
                  priceQuad: r.priceQuad ?? null,
                  priceTripleAdditional: r.priceTripleAdditional ?? null,
                  priceDoubleAdditional: r.priceDoubleAdditional ?? null,
                }))
                .filter((r) => r.hotelId > 0),
              makkahHotelId: ((x.hotelIds ?? [])[0] ?? x.makkahHotelId) ?? null,
              madinahHotelId: ((x.hotelIds ?? [])[1] ?? x.madinahHotelId) ?? null,
              priceQuad: (x.hotelOccupancyPrices ?? [])[0]?.priceQuad ?? x.priceQuad ?? null,
              priceTripleAdditional: (x.hotelOccupancyPrices ?? [])[0]?.priceTripleAdditional ?? x.priceTripleAdditional ?? null,
              priceDoubleAdditional: (x.hotelOccupancyPrices ?? [])[0]?.priceDoubleAdditional ?? x.priceDoubleAdditional ?? null,
              customAdditionalPrice: Number(x.customAdditionalPrice || 0),
            })),
        });
      }
      let savedConfig = false;
      try {
        const normalizedTermsIds = Array.from(new Set(
          (config.termsTemplateIds ?? [])
            .map((v) => Number(v))
            .filter((v) => Number.isFinite(v) && v > 0)
        ));
        const departureAirlineMappings = departureRows
          .filter((x) => x.departureDate)
          .map((x) => ({
            departureDate: String(x.departureDate).slice(0, 10),
            airlineIds: Array.from(new Set(
              (x.airlineIds ?? (x.airlineId ? [x.airlineId] : []))
                .map((id) => Number(id))
                .filter((id) => Number.isFinite(id) && id > 0)
            )),
          }))
          .filter((x) => x.airlineIds.length > 0);
        const departureHotelMappings = departureRows
          .filter((x) => x.departureDate)
          .map((x) => ({
            departureDate: String(x.departureDate).slice(0, 10),
            hotelIds: Array.from(new Set((x.hotelIds ?? []).map((id) => Number(id)).filter((id) => Number.isFinite(id) && id > 0))),
            hotelStays: (x.hotelStays ?? [])
              .map((r) => ({ hotelId: Number(r.hotelId || 0), nights: Number(r.nights || 0) }))
              .filter((r) => r.hotelId > 0),
            hotelRoomPrices: (x.hotelRoomPrices ?? [])
              .map((r) => ({
                hotelId: Number(r.hotelId || 0),
                roomTypeMasterId: Number(r.roomTypeMasterId || 0),
                price: Number(r.price || 0),
              }))
              .filter((r) => r.hotelId > 0 && r.roomTypeMasterId > 0),
            hotelOccupancyPrices: (x.hotelOccupancyPrices ?? [])
              .map((r) => ({
                hotelId: Number(r.hotelId || 0),
                priceQuad: r.priceQuad ?? undefined,
                priceTripleAdditional: r.priceTripleAdditional ?? undefined,
                priceDoubleAdditional: r.priceDoubleAdditional ?? undefined,
              }))
              .filter((r) => r.hotelId > 0),
          }))
          .filter((x) => x.hotelIds.length > 0);
        const cfgToSave: ProgramDisplayConfig = {
          ...config,
          packageTypePricings: pricingRows,
          departureAirlineMappings,
          departureHotelMappings,
          packageTypeId: pricingRows[0]?.packageTypeId ?? config.packageTypeId,
          priceIdr: pricingRows[0]?.priceIdr ?? config.priceIdr,
          termsTemplateIds: normalizedTermsIds,
          termsTemplateId: normalizedTermsIds[0] ?? config.termsTemplateId,
        };
        await apiPut(`/api/v1/master/programs/${configProgramId}/display-config`, {
          displayConfigJson: JSON.stringify(cfgToSave),
        });
        savedConfig = true;
      } catch {
        // display-config optional: keep departure pricing flow working
      }
      show(savedConfig ? 'Pengaturan paket disimpan' : 'Harga & jadwal paket disimpan (display-config dilewati)');
      setConfigModalOpen(false);
      await loadList();
    } catch (e) {
      show(e instanceof Error ? e.message : 'Gagal simpan pengaturan');
    } finally {
      setBusy(false);
    }
  };

  const exportDepartureCsv = () => {
    if (!selectedConfigPackageId || departureRows.length === 0) {
      show('Belum ada data departure untuk diexport');
      return;
    }
    const pkg = configPackages.find((x) => x.id === Number(selectedConfigPackageId));
    const escapeCsv = (v: string | number | undefined) => `"${String(v ?? '').replaceAll('"', '""')}"`;
    const header = [
      'Program',
      'KelasPaket',
      'TanggalBerangkat',
      'TanggalPulang',
      'TotalSeat',
      'SisaSeat',
      'TipePaket',
      'Maskapai',
      'Airport',
      'HotelMakkah',
      'HotelMadinah',
      'HargaQuad',
      'HargaTriple',
      'HargaDouble',
      'TambahanCustom',
    ];
    const rows = departureRows.map((d) => {
      const packageTypeName = getLinkedPackageTypeLabel(config);
      const airlineName = (d.airlineIds ?? (d.airlineId ? [d.airlineId] : []))
        .map((id) => airlines.find((x) => x.id === id)?.name ?? '')
        .filter(Boolean)
        .join(' | ');
      const airportName = airports.find((x) => x.id === d.departureAirportId)?.name ?? '';
      const makkahName = hotels.find((x) => x.id === d.makkahHotelId)?.name ?? '';
      const madinahName = hotels.find((x) => x.id === d.madinahHotelId)?.name ?? '';
      return [
        configProgramTitle,
        pkg?.packageClassName ?? '',
        d.departureDate,
        d.returnDate ?? '',
        d.seatCapacity,
        d.seatAvailable,
        packageTypeName,
        airlineName,
        airportName,
        makkahName,
        madinahName,
        d.priceQuad ?? 0,
        d.priceTripleAdditional ?? 0,
        d.priceDoubleAdditional ?? 0,
        d.customAdditionalPrice ?? 0,
      ];
    });
    const csv = [header, ...rows].map((r) => r.map((c) => escapeCsv(c as string | number)).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `departure-${String(configProgramTitle || 'program').replace(/[^\w-]+/g, '_')}-${selectedConfigPackageId}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const exportDepartureJson = () => {
    if (!selectedConfigPackageId || departureRows.length === 0) {
      show('Belum ada data departure untuk diexport');
      return;
    }
    const pkg = configPackages.find((x) => x.id === Number(selectedConfigPackageId));
    const rows = departureRows.map((d) => ({
      programTitle: configProgramTitle,
      packageClassId: Number(selectedConfigPackageId),
      packageClassName: pkg?.packageClassName ?? '',
      departureDate: d.departureDate || null,
      returnDate: d.returnDate || null,
      seatCapacity: Number(d.seatCapacity || 0),
      seatAvailable: Number(d.seatAvailable || 0),
      packageTypeId: null,
      packageTypeName: getLinkedPackageTypeLabel(config),
      airlineIds: d.airlineIds ?? (d.airlineId ? [d.airlineId] : []),
      airlineId: d.airlineId ?? ((d.airlineIds && d.airlineIds.length > 0) ? d.airlineIds[0] : null),
      airlineName: (d.airlineIds ?? (d.airlineId ? [d.airlineId] : []))
        .map((id) => airlines.find((x) => x.id === id)?.name ?? '')
        .filter(Boolean)
        .join(' | ') || null,
      departureAirportId: d.departureAirportId ?? null,
      departureAirportName: airports.find((x) => x.id === d.departureAirportId)?.name ?? null,
      makkahHotelId: d.makkahHotelId ?? null,
      makkahHotelName: hotels.find((x) => x.id === d.makkahHotelId)?.name ?? null,
      madinahHotelId: d.madinahHotelId ?? null,
      madinahHotelName: hotels.find((x) => x.id === d.madinahHotelId)?.name ?? null,
      priceQuad: Number(d.priceQuad || 0),
      priceTripleAdditional: Number(d.priceTripleAdditional || 0),
      priceDoubleAdditional: Number(d.priceDoubleAdditional || 0),
      customAdditionalPrice: Number(d.customAdditionalPrice || 0),
    }));
    const payload = {
      exportedAt: new Date().toISOString(),
      programTitle: configProgramTitle,
      packageClassId: Number(selectedConfigPackageId),
      packageClassName: pkg?.packageClassName ?? '',
      departures: rows,
    };
    const json = JSON.stringify(payload, null, 2);
    const blob = new Blob([json], { type: 'application/json;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `departure-${String(configProgramTitle || 'program').replace(/[^\w-]+/g, '_')}-${selectedConfigPackageId}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-4 space-y-4 animate-fade-up">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-extrabold g-text">Kelola Paket</h1>
        <Link href="/akun" className="text-blue-600 underline text-xs">Akun →</Link>
      </div>

      <SectionCard right={(
        <div className="flex items-center gap-2">
          <Link href="/akun/kelola-paket/bank-sampah" className="h-8 w-8 inline-flex items-center justify-center rounded-xl border text-sm" title="Bank Sampah">
            🗑
          </Link>
          <button type="button" onClick={openAddWizard} className="rounded-xl bg-primary-600 text-white px-3 py-1.5 text-xs font-semibold">+ Tambah Paket</button>
        </div>
      )}>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setInputMode((v) => {
              const next = v === 'bulk' ? 'none' : 'bulk';
              if (next === 'bulk' && !bulkJson.trim()) setBulkJson(bulkProgramSample5);
              return next;
            })}
            className={`rounded-xl border px-3 py-1.5 text-xs ${inputMode === 'bulk' ? 'bg-primary-600 text-white border-primary-600' : ''}`}
          >
            Bulk JSON
          </button>
          <button type="button" onClick={openAddWizard} className="rounded-xl border px-3 py-1.5 text-xs">Add</button>
        </div>

        {inputMode === 'bulk' ? (
          <div className="space-y-2">
            <textarea
              value={bulkJson}
              onChange={(e) => setBulkJson(e.target.value)}
              placeholder='Paste JSON array bulk dengan format wrapper wizard, contoh: [{"endpoint":"/api/v1/master/programs","method":"POST","payload":{"name":"Umrah Reguler 2027","title":"Umrah Reguler 2027","isActive":true,"yearMasehi":2027,"yearHijriah":1448,"durationDays":12,"departurePeriodStart":"2027-01-10T00:00:00Z","departurePeriodEnd":"2027-12-20T00:00:00Z","downPayment":5000000,"includedItems":["Tiket PP"],"excludedItems":["Pengeluaran pribadi"],"packages":[{"packageClassMasterId":1,"priceQuad":29999000,"priceTripleAdditional":1500000,"priceDoubleAdditional":2500000,"makkahHotelId":1,"makkahNights":5,"madinahHotelId":2,"madinahNights":5}]}}]'
              className="w-full min-h-52 border rounded-2xl px-3 py-2 text-xs font-mono"
            />
            <p className="text-[11px] text-zinc-500">Opsional per item: tambahkan <span className="font-mono">labelTagIds: [1,2,3]</span> untuk assign label saat bulk.</p>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={busy || !bulkJson.trim()}
                onClick={runBulk}
                className="rounded-xl bg-primary-600 text-white px-4 py-2 text-xs font-semibold disabled:opacity-60"
              >
                {busy ? 'Memproses Bulk...' : 'Execute Bulk JSON'}
              </button>
              <button
                type="button"
                onClick={() => setBulkJson(bulkProgramSample5)}
                className="rounded-xl border px-4 py-2 text-xs"
              >
                Isi Sample 2 Paket
              </button>
              <button
                type="button"
                onClick={() => setBulkJson('')}
                className="rounded-xl border px-4 py-2 text-xs"
              >
                Clear
              </button>
            </div>
          </div>
        ) : null}

      </SectionCard>

      <SectionCard title="Data List Paket" right={<input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cari nama/slug..." className="border rounded-xl px-3 py-1.5 text-xs" />}>
        {primaryPromotionalLabelId ? (
          <p className="text-[11px] text-zinc-500 mb-2">Label unggulan aktif: <span className="font-semibold">{labelTags.find((x) => x.id === primaryPromotionalLabelId)?.name}</span></p>
        ) : null}
        {!primaryPromotionalLabelId ? (
          <p className="text-[11px] text-amber-700 mb-2">Belum ada master label dengan `isPromotional=true`. Set dulu di Master Label Tags agar fitur unggulan aktif.</p>
        ) : null}
        {loadingPage ? (
          <div className="py-8 flex items-center justify-center">
            <div className="inline-flex items-center gap-2 text-xs text-zinc-500">
              <span className="h-4 w-4 rounded-full border-2 border-zinc-300 border-t-primary-600 animate-spin" />
              Memuat data paket...
            </div>
          </div>
        ) : null}
        {!loadingPage && filteredItems.length === 0 ? (
          <div className="py-6 text-xs text-zinc-500 text-center">Belum ada data paket.</div>
        ) : null}
        {!loadingPage && listLoadError ? (
          <div className="py-3">
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800 flex items-center justify-between gap-2">
              <span>{listLoadError}</span>
              <button
                type="button"
                className="border border-amber-300 rounded-lg px-2 py-1 text-[11px] bg-white"
                onClick={async () => {
                  setLoadingPage(true);
                  try {
                    await loadList();
                  } finally {
                    setLoadingPage(false);
                  }
                }}
              >
                Retry
              </button>
            </div>
          </div>
        ) : null}
        {!loadingPage ? filteredItems.map((x) => (
          <ProgramListCard
            key={x.id}
            item={x}
            isActive={Boolean(x.isActive)}
            isFeatured={Array.isArray(x.labelTags) ? x.labelTags.some((t: any) => promotionalLabelIds.includes(Number(t.packageLabelTagId ?? t.id))) : false}
            onEdit={() => openEditWizard(x)}
            onImages={() => void openImagesModal(x)}
            onConfigure={() => void openConfigModal(x)}
            onLabels={() => openLabelsModal(x)}
            onToggleFeatured={async () => {
              if (!primaryPromotionalLabelId) {
                show('Belum ada label promosi aktif. Set isPromotional=true di master label tags terlebih dahulu.');
                return;
              }
              try {
                setBusy(true);
                const current = Array.isArray(x.labelTags)
                  ? x.labelTags.map((t: any) => Number(t.packageLabelTagId ?? t.id)).filter((n: number) => Number.isFinite(n) && n > 0)
                  : [];
                const hasFeatured = current.includes(primaryPromotionalLabelId);
                const next = hasFeatured
                  ? current.filter((id: number) => id !== primaryPromotionalLabelId)
                  : Array.from(new Set([...current, primaryPromotionalLabelId]));
                await apiPut(`/api/v1/master/programs/${x.id}/labels`, {
                  packageLabelTagIds: next,
                });
                show(hasFeatured ? 'Status unggulan dilepas' : 'Program ditandai sebagai unggulan');
                await loadList();
              } catch (e) {
                show(e instanceof Error ? e.message : 'Gagal mengubah status unggulan');
              } finally {
                setBusy(false);
              }
            }}
            onFlashSale={() => {
              if (isFlashSaleActive(x)) {
                setFlashUnsetConfirmProgramId(Number(x.id));
                return;
              }
              openFlashSaleModal(x);
            }}
            isFlashSale={isFlashSaleActive(x)}
            onToggleActive={async () => {
              try {
                setBusy(true);
                await apiPost(`/api/v1/master/programs/${x.id}/${x.isActive ? 'deactivate' : 'activate'}`);
                show(x.isActive ? 'Paket dinonaktifkan' : 'Paket diaktifkan');
                await loadList();
              } catch (e) {
                show(e instanceof Error ? e.message : 'Gagal ubah status');
              } finally {
                setBusy(false);
              }
            }}
            onDuplicate={() => duplicateFromItem(x)}
            detailUrl={`/id/pack/${x.slug || x.id}`}
            shareUrl={`/id/pack/${x.slug || x.id}@${refUser}`}
            onCopyShare={() => {
              const url = `${window.location.origin}/id/pack/${x.slug || x.id}@${refUser}`;
              void navigator.clipboard.writeText(url);
              show('Link share disalin');
            }}
            onSoftDelete={async () => {
              setProgramDeleteConfirmId(Number(x.id));
            }}
            onHardDelete={async () => {
              setProgramHardDeleteConfirmId(Number(x.id));
            }}
            onJsonData={async () => {
              await openProgramJsonModal(x);
            }}
            deleting={deletingProgram && Number(programDeleteConfirmId) === Number(x.id)}
          />
        )) : null}
      </SectionCard>

      <ModalShell open={flashUnsetConfirmProgramId !== null && mounted} onBackdropClick={() => setFlashUnsetConfirmProgramId(null)} zIndexClass="z-[1300]" overlayClassName="bg-black/30">
        <div className="bg-white w-full max-w-md rounded-2xl p-4 space-y-3">
          <div className="text-sm font-bold">Konfirmasi</div>
          <div className="text-xs text-zinc-700">Nonaktifkan Flash Sale untuk paket ini?</div>
          <div className="flex justify-end gap-2">
            <button type="button" className="border rounded-lg px-3 py-1.5 text-xs" onClick={() => setFlashUnsetConfirmProgramId(null)}>Tidak</button>
            <button
              type="button"
              className="bg-primary-600 text-white rounded-lg px-3 py-1.5 text-xs font-semibold"
              onClick={() => {
                const target = items.find((it) => Number(it.id) === Number(flashUnsetConfirmProgramId));
                setFlashUnsetConfirmProgramId(null);
                if (target) void unsetFlashSale(target);
              }}
            >
              Ya
            </button>
          </div>
        </div>
      </ModalShell>

      <ModalShell open={programDeleteConfirmId !== null && mounted} onBackdropClick={() => { if (!deletingProgram) setProgramDeleteConfirmId(null); }} zIndexClass="z-[1300]" overlayClassName="bg-black/30">
        <div className="bg-white w-full max-w-md rounded-2xl p-4 space-y-3">
          <div className="text-sm font-bold">Konfirmasi</div>
          <div className="text-xs text-zinc-700">
            {deletingProgram ? 'Sedang menghapus paket... mohon tunggu.' : 'Hapus paket ini?'}
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" disabled={deletingProgram} className="border rounded-lg px-3 py-1.5 text-xs disabled:opacity-50" onClick={() => setProgramDeleteConfirmId(null)}>Tidak</button>
            <button
              type="button"
              disabled={deletingProgram}
              className="bg-red-600 text-white rounded-lg px-3 py-1.5 text-xs font-semibold disabled:opacity-60"
              onClick={async () => {
                const id = programDeleteConfirmId;
                if (!id) return;
                try {
                  setDeletingProgram(true);
                  setBusy(true);
                  await deleteProgramCascade(Number(id));
                  setProgramDeleteConfirmId(null);
                  show('Paket dihapus');
                  await loadList();
                } catch (e) {
                  show(e instanceof Error ? e.message : 'Gagal hapus paket');
                } finally {
                  setDeletingProgram(false);
                  setBusy(false);
                }
              }}
            >
              {deletingProgram ? 'Menghapus...' : 'Ya'}
            </button>
          </div>
        </div>
      </ModalShell>

      <ModalShell open={programHardDeleteConfirmId !== null && mounted} onBackdropClick={() => { if (!deletingProgram) setProgramHardDeleteConfirmId(null); }} zIndexClass="z-[1300]" overlayClassName="bg-black/30">
        <div className="bg-white w-full max-w-md rounded-2xl p-4 space-y-3">
          <div className="text-sm font-bold text-red-700">Konfirmasi Hard Delete</div>
          <div className="text-xs text-zinc-700">
            {deletingProgram ? 'Sedang hard delete paket... mohon tunggu.' : 'Hard delete akan menghapus data permanen dari database. Lanjutkan?'}
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" disabled={deletingProgram} className="border rounded-lg px-3 py-1.5 text-xs disabled:opacity-50" onClick={() => setProgramHardDeleteConfirmId(null)}>Tidak</button>
            <button
              type="button"
              disabled={deletingProgram}
              className="bg-red-600 text-white rounded-lg px-3 py-1.5 text-xs font-semibold disabled:opacity-60"
              onClick={async () => {
                const id = programHardDeleteConfirmId;
                if (!id) return;
                try {
                  setDeletingProgram(true);
                  setBusy(true);
                  await hardDeleteProgram(Number(id));
                  setProgramHardDeleteConfirmId(null);
                  show('Hard delete berhasil');
                  await loadList();
                } catch (e) {
                  show(e instanceof Error ? e.message : 'Gagal hard delete paket');
                } finally {
                  setDeletingProgram(false);
                  setBusy(false);
                }
              }}
            >
              {deletingProgram ? 'Menghapus...' : 'Ya, Hard Delete'}
            </button>
          </div>
        </div>
      </ModalShell>

      <ModalShell open={programJsonModalOpen && mounted} onBackdropClick={() => setProgramJsonModalOpen(false)}>
        <div className="bg-white w-full max-w-3xl rounded-3xl p-4 space-y-3 max-h-[88vh] overflow-y-auto">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold">JSON Program: {programJsonTitle}</h3>
            <button type="button" onClick={() => setProgramJsonModalOpen(false)} className="text-zinc-500" aria-label="Tutup modal">✕</button>
          </div>
          <textarea
            value={programJsonText}
            readOnly
            className="w-full min-h-96 border rounded-xl px-3 py-2 text-xs font-mono bg-zinc-50"
          />
          <div className="flex justify-end gap-2">
            <button
              type="button"
              className="border rounded-xl px-4 py-2 text-xs"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(programJsonText);
                  show('JSON program disalin');
                } catch {
                  show('Gagal menyalin JSON program');
                }
              }}
            >
              Copy JSON
            </button>
            <button type="button" className="border rounded-xl px-4 py-2 text-xs" onClick={() => setProgramJsonModalOpen(false)}>
              Tutup
            </button>
          </div>
        </div>
      </ModalShell>

      <ModalShell open={wizardOpen && mounted} onBackdropClick={() => closeWizard()}>
          <div className="relative bg-white w-full max-w-4xl rounded-3xl p-4 max-h-[88vh] overflow-y-auto">
            <InlineConfirmOverlay
              open={wizardCloseConfirmOpen}
              title="Konfirmasi"
              message="Perubahan belum disimpan. Tutup modal dan buang perubahan?"
              cancelLabel="Tidak"
              confirmLabel="Ya"
              onCancel={() => setWizardCloseConfirmOpen(false)}
              onConfirm={() => closeWizard(true)}
            />
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold">{editingId ? 'Edit Paket' : 'Tambah Paket'} - Wizard</h3>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="border rounded-lg px-2 py-1 text-[10px]"
                  title="Lihat request payload JSON"
                  disabled={wizardPayloadPreparing}
                  onClick={() => { void openWizardPayloadModal(); }}
                >
                  {wizardPayloadPreparing ? (
                    <span className="inline-block h-3 w-3 rounded-full border-2 border-zinc-300 border-t-primary-600 animate-spin" aria-label="Memuat" />
                  ) : '{}'}
                </button>
                <button type="button" onClick={() => closeWizard()} className="text-zinc-500" aria-label="Tutup modal">✕</button>
              </div>
            </div>
            <div className="mt-3 flex gap-1 overflow-x-auto">
              {wizardSteps.map((s, i) => (
                <button key={s} type="button" onClick={() => setWizardStep(i)} className={`px-3 py-1.5 rounded-full text-xs border ${wizardStep === i ? 'bg-primary-600 text-white border-primary-600' : 'bg-white'}`}>
                  {i + 1}. {s}
                </button>
              ))}
            </div>

            {wizardStep === 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <label className="block sm:col-span-2 order-10">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] text-zinc-500">Durasi Program (dari Master Duration Types)</span>
                    <button
                      type="button"
                      className="border rounded-lg px-2 py-1 text-[10px]"
                      title="Buka modal bulk JSON Duration Types"
                      onClick={() => setDurationJsonModalOpen(true)}
                    >
                      JSON
                    </button>
                    <button
                      type="button"
                      className="border rounded-lg px-2 py-1 text-[10px]"
                      title="Edit Duration Type terpilih"
                      onClick={() => void openDurationEditModal()}
                    >
                      ✎
                    </button>
                  </div>
                  <div className="mt-1 max-h-44 overflow-auto border rounded-xl p-2 space-y-1 bg-white">
                    {durationTypes.length === 0 ? <div className="text-[11px] text-zinc-500">Belum ada duration types.</div> : null}
                    {durationTypes.map((d) => {
                      const checked = String(d.id) === selectedDurationTypeId;
                      return (
                        <label key={d.id} className={`flex items-start gap-2 rounded-lg border px-2 py-1.5 text-xs ${checked ? 'border-primary-500 bg-primary-50' : 'border-zinc-200'}`}>
                          <input
                            type="radio"
                            name="durationTypeWizard"
                            checked={checked}
                            onChange={() => setForm((x) => {
                              const nextDays = Number(d.defaultDays || 0);
                              const nextStart = String(x.departurePeriodStart || '').slice(0, 10);
                              return {
                                ...x,
                                durationDays: nextDays,
                                departurePeriodEnd: nextStart ? calcEndDateFromStartAndDays(nextStart, nextDays) : '',
                              };
                            })}
                          />
                          <span>
                            <span className="font-medium">{d.name}</span>
                            <span className="text-zinc-500"> • {d.defaultDays}H/{d.defaultNights}M</span>
                            {d.displayFormat ? <span className="text-zinc-500"> • {d.displayFormat}</span> : null}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                  {selectedDurationType ? (
                    <div className="mt-1 text-[11px] text-emerald-700">
                      <span className="font-semibold">{selectedDurationType.defaultDays} Hari / {selectedDurationType.defaultNights} Malam</span>
                      {selectedDurationType.displayFormat ? (
                        <span className="text-zinc-500"> • {selectedDurationType.displayFormat}</span>
                      ) : null}
                    </div>
                  ) : (
                    <div className="mt-1 text-[11px] text-zinc-500">Pilih durasi agar hari/malam otomatis terlihat.</div>
                  )}
                </label>
                <div className="sm:col-span-2 order-11 border rounded-xl p-2 bg-white">
                  <div className="text-[11px] font-semibold text-zinc-700 mb-1">Jadwal Keberangkatan per Program</div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <label className="block">
                      <span className="text-[11px] text-zinc-500">Berangkat mulai</span>
                      <input
                        type="date"
                        value={String(form.departurePeriodStart || '').slice(0, 10)}
                        onChange={(e) => setForm((x) => {
                          const nextStart = e.target.value;
                          const masehiYear = nextStart ? (new Date(nextStart).getFullYear() || x.yearMasehi) : x.yearMasehi;
                          const hijriYear = nextStart ? (getHijriYearFromIsoDate(nextStart) || x.yearHijriah) : x.yearHijriah;
                          return {
                            ...x,
                            departurePeriodStart: nextStart,
                            departurePeriodEnd: nextStart ? calcEndDateFromStartAndDays(nextStart, Number(x.durationDays || 1)) : '',
                            yearMasehi: masehiYear,
                            yearHijriah: hijriYear,
                          };
                        })}
                        className="mt-1 w-full border rounded-xl px-3 py-2 text-xs bg-white"
                      />
                    </label>
                    <label className="block">
                      <span className="text-[11px] text-zinc-500">Berangkat sampai</span>
                      <input
                        type="date"
                        value={String(form.departurePeriodEnd || '').slice(0, 10)}
                        readOnly
                        disabled
                        className="mt-1 w-full border rounded-xl px-3 py-2 text-xs bg-zinc-100 text-zinc-600 cursor-not-allowed"
                      />
                    </label>
                  </div>
                  <div className="mt-1 text-[10px] text-zinc-500">Otomatis dihitung dari `Berangkat mulai` + `Durasi Program`.</div>
                </div>
                <div className="sm:col-span-2 order-30 text-[11px] font-semibold text-zinc-700 mt-1">
                  Total Seat
                </div>
                <label className="block order-31">
                  <span className="text-[11px] text-zinc-500">Jumlah Kursi (default)</span>
                  <input
                    type="number"
                    min={0}
                    value={Number(form.defaultSeatCapacity || 0)}
                    onChange={(e) => setForm((x) => {
                      const cap = Math.max(0, Number(e.target.value || 0));
                      const avail = Math.min(Number(x.defaultSeatAvailable || 0), cap);
                      return { ...x, defaultSeatCapacity: cap, defaultSeatAvailable: avail };
                    })}
                    className="mt-1 w-full border rounded-xl px-3 py-2 text-xs bg-white"
                  />
                </label>
                <label className="block order-32">
                  <span className="text-[11px] text-zinc-500">Kursi Tersedia Awal (default)</span>
                  <input
                    type="number"
                    min={0}
                    value={Number(form.defaultSeatAvailable || 0)}
                    onChange={(e) => setForm((x) => {
                      const cap = Math.max(0, Number(x.defaultSeatCapacity || 0));
                      const raw = Math.max(0, Number(e.target.value || 0));
                      return { ...x, defaultSeatAvailable: Math.min(raw, cap) };
                    })}
                    className="mt-1 w-full border rounded-xl px-3 py-2 text-xs bg-white"
                  />
                </label>
                <div className="block sm:col-span-2 border rounded-xl p-2 space-y-2 order-20">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-zinc-500">Harga IDR per Tipe Harga (Package Types) - opsional di Add Wizard</span>
                    <button
                      type="button"
                      className="border rounded-lg px-2 py-1 text-[10px]"
                      title="Tambah baris harga type"
                      onClick={() => setForm((x) => ({
                        ...x,
                        defaultPackageTypePricings: [
                          ...(Array.isArray(x.defaultPackageTypePricings) ? x.defaultPackageTypePricings : []),
                          { id: crypto.randomUUID(), packageTypeId: 0, priceIdr: 0, isAllInDefault: false },
                        ],
                      }))}
                    >
                      + Type
                    </button>
                  </div>
                  {(Array.isArray(form.defaultPackageTypePricings) ? form.defaultPackageTypePricings : []).map((row, idx) => (
                    <div key={row.id || idx} className="grid grid-cols-12 gap-1">
                      <select
                        value={row.packageTypeId || ''}
                        onChange={(e) => setForm((x) => ({
                          ...x,
                          defaultPackageTypePricings: (x.defaultPackageTypePricings ?? []).map((r, i) => i === idx ? { ...r, packageTypeId: Number(e.target.value || 0) } : r),
                        }))}
                        className="col-span-6 border rounded-lg px-2 py-1.5 text-xs"
                      >
                        <option value="">Pilih Tipe Harga</option>
                        {packageTypes.map((pt) => <option key={pt.id} value={pt.id}>{pt.name}</option>)}
                      </select>
                      <input
                        value={formatIdrInput(row.priceIdr)}
                        onChange={(e) => setForm((x) => ({
                          ...x,
                          defaultPackageTypePricings: (x.defaultPackageTypePricings ?? []).map((r, i) => i === idx ? { ...r, priceIdr: parseCurrencyInput(e.target.value) } : r),
                        }))}
                        className="col-span-3 border rounded-lg px-2 py-1.5 text-xs"
                        placeholder="Harga IDR"
                      />
                      <label className="col-span-2 inline-flex items-center justify-center gap-1 border rounded-lg px-1 text-[10px] text-zinc-700">
                        <input
                          type="radio"
                          name="wizard-all-in-default-type"
                          checked={Boolean(row.isAllInDefault)}
                          onChange={() => setForm((x) => ({
                            ...x,
                            defaultPackageTypePricings: (x.defaultPackageTypePricings ?? []).map((r, i) => ({ ...r, isAllInDefault: i === idx })),
                          }))}
                        />
                        All-In
                      </label>
                      <button
                        type="button"
                        onClick={() => setForm((x) => ({ ...x, defaultPackageTypePricings: (x.defaultPackageTypePricings ?? []).filter((_, i) => i !== idx) }))}
                        className="col-span-1 border rounded-lg px-1 text-red-600"
                        title="Hapus baris"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                  <div className="text-[10px] text-zinc-500">
                    Boleh kosong atau 0. Data ini hanya jadi default awal untuk modal <span className="font-semibold">Atur Harga Paket</span>.
                    Kelas paket berbeda dengan tipe harga: kelas paket disimpan di <span className="font-semibold">packages[].packageClassMasterId</span>.
                  </div>
                </div>
                {form.departurePeriodStart ? (
                  <div className="sm:col-span-2 text-[11px] text-emerald-700 order-40">
                    Preview periode: <span className="font-semibold">{formatPreviewRange(form.departurePeriodStart, form.departurePeriodEnd || form.departurePeriodStart)}</span>
                  </div>
                ) : null}
              </div>
            ) : null}

            {wizardStep === 1 ? (
              <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
                <label className="block sm:col-span-2"><span className="text-[11px] text-zinc-500">Nama Program (internal admin)</span><FormField value={form.name} placeholder="Contoh: Umroh Musim Haji Saudi Airlines" onChange={(v) => setForm((x) => ({ ...x, name: v }))} /></label>
                <label className="block sm:col-span-2"><span className="text-[11px] text-zinc-500">Judul Tampil (judul di kartu publik)</span><FormField value={form.title} placeholder="Judul yang tampil ke pengguna" onChange={(v) => setForm((x) => ({ ...x, title: v }))} /></label>
                <label className="block sm:col-span-2">
                  <span className="text-[11px] text-zinc-500">Deskripsi Program</span>
                  <textarea
                    value={form.description}
                    placeholder="Tulis deskripsi singkat program paket..."
                    onChange={(e) => setForm((x) => ({ ...x, description: e.target.value }))}
                    className="mt-1 w-full border rounded-xl px-3 py-2 text-xs min-h-52 resize-y"
                  />
                </label>
                <label className="block sm:col-span-2">
                  <span className="text-[11px] text-zinc-500">Label Paket (Master Label Tags)</span>
                  <select
                    multiple
                    value={form.labelTagIds.map(String)}
                    onChange={(e) => {
                      const next = Array.from(e.target.selectedOptions)
                        .map((o) => Number(o.value))
                        .filter((n) => Number.isFinite(n) && n > 0);
                      setForm((x) => ({ ...x, labelTagIds: next }));
                    }}
                    className="mt-1 w-full border rounded-xl px-3 py-2 text-xs min-h-24 bg-white"
                  >
                    {labelTags.map((x) => (
                      <option key={x.id} value={x.id}>
                        {x.name}{x.code ? ` (${x.code})` : ''}{x.isPromotional ? ' • Promo' : ''}
                      </option>
                    ))}
                  </select>
                  <p className="mt-1 text-[11px] text-zinc-500">Pilih 1 atau lebih label. Gunakan Ctrl/Cmd + klik untuk multi pilih.</p>
                </label>
              </div>
            ) : null}

            {wizardStep === 2 ? (
              <div className="mt-3 space-y-2">
                <div className="rounded-xl border border-sky-200 bg-sky-50 px-3 py-2 text-[11px] text-sky-700">
                  Pengaturan harga, jadwal keberangkatan, hotel, kamar, maskapai, itinerary, dan komponen all-in dilakukan di modal <span className="font-semibold">Atur Harga Paket</span> setelah program ini disimpan.
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 items-end">
                  <label className="block sm:col-span-2">
                    <span className="text-[11px] text-zinc-500">Brand Hashtag (tanpa #)</span>
                    <input
                      value={seoBrandTag}
                      onChange={(e) => setSeoBrandTag(e.target.value)}
                      className="mt-1 w-full border rounded-xl px-3 py-2 text-xs"
                      placeholder="contoh: alfiantour"
                    />
                  </label>
                  <button
                    type="button"
                    onClick={generateSeoFromStepOne}
                    className="rounded-xl border px-3 py-2 text-xs font-semibold"
                  >
                    Generate SEO
                  </button>
                </div>
                <p className="text-[11px] text-zinc-500">Slug dipakai untuk URL publik. Contoh: `/id/pack/umroh-musim-haji-saudi`.</p>
                <FormField value={form.slug} placeholder="Slug SEO" onChange={(v) => setForm((x) => ({ ...x, slug: v.replace(/\s+/g, '-').toLowerCase() }))} />
                {slugExists ? <p className="text-[11px] text-amber-700">Slug ini sudah dipakai paket lain.</p> : null}
                <label className="inline-flex items-center gap-2 text-xs">
                  <input type="checkbox" checked={form.isActive} onChange={(e) => setForm((x) => ({ ...x, isActive: e.target.checked }))} />
                  Aktifkan paket
                </label>
                <FormField as="textarea" value={form.includedItems} placeholder="Included (1 baris = 1 item)" onChange={(v) => setForm((x) => ({ ...x, includedItems: v }))} />
                <FormField as="textarea" value={form.excludedItems} placeholder="Excluded (1 baris = 1 item)" onChange={(v) => setForm((x) => ({ ...x, excludedItems: v }))} />
                <div className="text-[11px] text-zinc-600">Preview share: <span className="font-semibold">/id/pack/{form.slug || '(slug)'}@{refUser}</span></div>
              </div>
            ) : null}

            <div className="mt-4 flex items-center justify-between">
              <button type="button" className="border rounded-xl px-3 py-1.5 text-xs disabled:opacity-50" disabled={wizardStep === 0} onClick={() => setWizardStep((s) => Math.max(0, s - 1))}>Back</button>
              <div className="flex gap-2">
                {wizardStep < wizardSteps.length - 1 ? (
                  <button type="button" className="rounded-xl bg-primary-600 text-white px-3 py-1.5 text-xs" onClick={() => setWizardStep((s) => Math.min(wizardSteps.length - 1, s + 1))}>Next</button>
                ) : (
                  <button
                    type="button"
                    disabled={!canSubmit || busy || slugExists}
                    onClick={async () => {
                      const ok = await save();
                      if (ok) closeWizard(true);
                    }}
                    className="rounded-xl bg-primary-600 text-white px-3 py-1.5 text-xs disabled:opacity-50"
                  >
                    {editingId ? 'Simpan Update' : 'Tambah Paket'}
                  </button>
                )}
              </div>
            </div>
          </div>
      </ModalShell>

      <ModalShell open={wizardPayloadModalOpen && mounted} onBackdropClick={() => { if (!wizardPayloadExecuting) setWizardPayloadModalOpen(false); }}>
        <div className="bg-white w-full max-w-3xl rounded-3xl p-4 space-y-3 max-h-[88vh] overflow-y-auto">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold">Request Payload JSON - Tambah Paket Wizard</h3>
            <button type="button" onClick={() => { if (!wizardPayloadExecuting) setWizardPayloadModalOpen(false); }} className="text-zinc-500" aria-label="Tutup modal">✕</button>
          </div>
          <p className="text-xs text-zinc-600">JSON ini bisa Anda copy ke AI untuk diisi/dirapikan, lalu paste kembali di sini untuk dieksekusi ke endpoint program.</p>
          <p className="text-[11px] text-zinc-500">Catatan: <span className="font-semibold">Tipe Harga</span> = `metadata.defaultPackageTypePricings` (master `package-types`), sedangkan <span className="font-semibold">Kelas Paket</span> = `packages[].packageClassMasterId` (master `package-class-masters`).</p>
          <textarea
            value={wizardPayloadJson}
            onChange={(e) => setWizardPayloadJson(e.target.value)}
            className="w-full min-h-96 border rounded-xl px-3 py-2 text-xs font-mono"
            placeholder='{"endpoint":"/api/v1/master/programs","method":"POST","payload":{...}}'
          />
          <div className="flex justify-end gap-2">
            <button
              type="button"
              className="border rounded-xl px-4 py-2 text-xs"
              onClick={() => normalizeWizardPayloadJson()}
            >
              Normalize JSON
            </button>
            <button
              type="button"
              className="border rounded-xl px-4 py-2 text-xs"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(wizardPayloadJson);
                  show('Payload JSON berhasil disalin');
                } catch {
                  show('Gagal menyalin payload JSON');
                }
              }}
            >
              Copy JSON
            </button>
            <button type="button" className="border rounded-xl px-4 py-2 text-xs" disabled={wizardPayloadExecuting} onClick={() => setWizardPayloadModalOpen(false)}>
              Batal
            </button>
            <button type="button" className="rounded-xl bg-primary-600 text-white px-4 py-2 text-xs font-semibold disabled:opacity-60" disabled={wizardPayloadExecuting} onClick={() => void executeWizardPayloadJson()}>
              {wizardPayloadExecuting ? 'Executing...' : 'Execute JSON'}
            </button>
          </div>
        </div>
      </ModalShell>

      <ModalShell open={quickAddOpen && mounted} onBackdropClick={() => closeQuickAdd()}>
          <div className="relative bg-white w-full max-w-lg rounded-3xl p-4 space-y-3">
            <InlineConfirmOverlay
              open={quickAddCloseConfirmOpen}
              title="Konfirmasi"
              message="Input Add belum disimpan. Tutup modal dan buang perubahan?"
              cancelLabel="Tidak"
              confirmLabel="Ya"
              onCancel={() => setQuickAddCloseConfirmOpen(false)}
              onConfirm={() => closeQuickAdd(true)}
            />
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold">Add Paket Cepat</h3>
              <button type="button" onClick={() => closeQuickAdd()} className="text-zinc-500" aria-label="Tutup modal">✕</button>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium">Pilih Layanan</label>
              <select
                value={quickServiceId}
                onChange={(e) => setQuickServiceId(e.target.value ? Number(e.target.value) : '')}
                className="w-full border rounded-xl px-3 py-2 text-xs"
              >
                <option value="">Pilih layanan...</option>
                {services.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium">Nama Paket</label>
              <input
                value={quickPackageName}
                onChange={(e) => setQuickPackageName(e.target.value)}
                placeholder="PROMO UMROH DI MUSIM HAJI BY SAUDI AIRLINES (HOTEL *5)"
                data-autofocus
                className="w-full border rounded-xl px-3 py-2 text-xs"
              />
            </div>
            <div className="rounded-xl bg-zinc-50 border px-3 py-2 text-[11px] text-zinc-600">
              Slug otomatis digenerate model fileId (unik), tidak perlu input manual.
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={busy}
                onClick={createQuickPackage}
                className="rounded-xl bg-primary-600 text-white px-4 py-2 text-xs font-semibold disabled:opacity-60"
              >
                {busy ? 'Menyimpan...' : 'Simpan'}
              </button>
              <button
                type="button"
                onClick={() => closeQuickAdd()}
                className="rounded-xl border px-4 py-2 text-xs"
              >
                Batal
              </button>
            </div>
          </div>
      </ModalShell>

      <ModalShell open={imageModalOpen && mounted} onBackdropClick={() => closeImageModal()}>
          <div className="relative bg-white w-full max-w-[430px] rounded-3xl p-4 max-h-[88vh] overflow-y-auto space-y-3">
            <InlineConfirmOverlay
              open={imageDeleteConfirmId !== null}
              title="Konfirmasi"
              message="Hapus gambar ini?"
              cancelLabel="Tidak"
              confirmLabel="Ya"
              onCancel={() => setImageDeleteConfirmId(null)}
              onConfirm={() => {
                const id = imageDeleteConfirmId;
                setImageDeleteConfirmId(null);
                if (id) void deleteImage(id);
              }}
            />
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold">Kelola Gambar Paket: {imageProgramTitle}</h3>
              <button type="button" onClick={() => closeImageModal()} className="text-zinc-500" aria-label="Tutup modal">✕</button>
            </div>
            <div className="rounded-2xl border p-3 space-y-2">
              <p className="text-xs text-zinc-600">Upload bisa beberapa file sekaligus. Otomatis dikonversi ke `.webp`, resize, dan gambar pertama jadi cover jika belum ada cover.</p>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => void uploadProgramImages(e.target.files)}
                className="w-full border rounded-xl px-3 py-2 text-xs"
              />
              {uploading ? (
                <div className="space-y-1.5">
                  <div className="h-2 w-full rounded-full bg-zinc-200 overflow-hidden">
                    <div className="h-full bg-primary-600 transition-all" style={{ width: `${uploadProgress}%` }} />
                  </div>
                  <div className="text-[11px] text-zinc-600">
                    Uploading {Math.min(uploadFileTotal, Math.max(1, Math.round((uploadProgress / 100) * uploadFileTotal)))}/{uploadFileTotal} gambar ({uploadProgress}%)
                  </div>
                </div>
              ) : null}
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {images.map((img) => (
                <div key={img.id} className="border rounded-2xl p-2 space-y-2">
                  <img src={`${API_BASE_URL}${img.url}`} alt="Program" className="w-full h-28 object-cover rounded-xl" />
                  <div className="text-[10px] text-zinc-500 truncate">{img.id}</div>
                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      disabled={img.isCover}
                      onClick={() => void setCoverImage(img.id)}
                      className={`flex-1 rounded-xl px-2 py-1 text-[11px] border ${img.isCover ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : ''}`}
                    >
                      {img.isCover ? 'Cover' : 'Set Cover'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setImageDeleteConfirmId(img.id)}
                      className="rounded-xl px-2 py-1 text-[11px] border border-red-200 text-red-600"
                    >
                      Hapus
                    </button>
                  </div>
                </div>
              ))}
            </div>
            {images.length === 0 ? <div className="text-xs text-zinc-500">Belum ada gambar.</div> : null}
          </div>
      </ModalShell>

      <ModalShell open={configModalOpen && mounted} onBackdropClick={() => closeConfigModal()}>
          <div className="bg-white w-full max-w-[430px] rounded-3xl p-4 max-h-[88vh] flex flex-col">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold">Atur Harga Paket: {configProgramTitle}</h3>
              <button type="button" onClick={() => closeConfigModal()} className="text-zinc-500" aria-label="Tutup modal">✕</button>
            </div>
            <div className="mt-3 space-y-3 overflow-y-auto pr-1">
            <div className="space-y-1 border rounded-2xl p-3">
              <label className="text-xs font-medium">Down Payment</label>
              <input
                type="number"
                min={0}
                value={Number.isFinite(configDownPayment) ? configDownPayment : 0}
                onChange={(e) => setConfigDownPayment(Number(e.target.value || 0))}
                className="w-full border rounded-xl px-3 py-2 text-xs"
                placeholder="Contoh: 5000000"
              />
            </div>

            <div className="space-y-2 border rounded-2xl p-3">
              <label className="text-xs font-medium">SEO Title (opsional)</label>
              <input
                value={String(config.seoTitle || '')}
                onChange={(e) => setConfig((p) => ({ ...p, seoTitle: e.target.value }))}
                placeholder="Contoh: Umrah Plus Thaif 12 Hari 2027 | Alfian Tour"
                className="w-full border rounded-xl px-3 py-2 text-xs"
              />
              <label className="text-xs font-medium">SEO Description (opsional)</label>
              <textarea
                value={String(config.seoDescription || '')}
                onChange={(e) => setConfig((p) => ({ ...p, seoDescription: e.target.value }))}
                placeholder="Ringkasan paket untuk Google dan preview sosial (maksimal sekitar 150-160 karakter)."
                className="w-full border rounded-xl px-3 py-2 text-xs min-h-16"
              />
              <div className="text-[11px] text-zinc-500">Jika kosong, sistem pakai judul/deskripsi otomatis dari data program.</div>
            </div>

            <div className="space-y-2 border rounded-2xl p-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium">Harga IDR per Package Type</label>
                <button
                  type="button"
                  className="text-[11px] border rounded-lg px-2 py-1"
                  onClick={() => setConfig((p) => ({
                    ...p,
                    packageTypePricings: [
                      ...(Array.isArray(p.packageTypePricings) ? p.packageTypePricings : []),
                      { id: crypto.randomUUID(), packageTypeId: 0, priceIdr: 0, isAllInDefault: false },
                    ],
                  }))}
                >
                  + Tambah Type
                </button>
              </div>
              {(Array.isArray(config.packageTypePricings) ? config.packageTypePricings : []).map((row, idx) => (
                <div key={row.id || idx} className="grid grid-cols-12 gap-1">
                  <select
                    value={row.packageTypeId || ''}
                    onChange={(e) => setConfig((p) => ({
                      ...p,
                      packageTypePricings: (p.packageTypePricings ?? []).map((x, i) => {
                        if (i !== idx) return x;
                        const nextId = Number(e.target.value || 0);
                        const nextName = packageTypes.find((pt) => pt.id === nextId)?.name ?? '';
                        return { ...x, packageTypeId: nextId, packageTypeName: nextName };
                      }),
                    }))}
                    className="col-span-6 border rounded-lg px-2 py-1.5 text-xs"
                  >
                    <option value="">Pilih package type</option>
                    {packageTypes.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}
                  </select>
                  <input
                    value={formatIdrInput(row.priceIdr)}
                    onChange={(e) => setConfig((p) => ({
                      ...p,
                      packageTypePricings: (p.packageTypePricings ?? []).map((x, i) => i === idx ? { ...x, priceIdr: parseCurrencyInput(e.target.value) } : x),
                    }))}
                    className="col-span-3 border rounded-lg px-2 py-1.5 text-xs"
                    placeholder="Harga IDR"
                  />
                  <label className="col-span-2 inline-flex items-center justify-center gap-1 border rounded-lg px-1 text-[10px] text-zinc-700">
                    <input
                      type="radio"
                      name="all-in-default-type"
                      checked={Boolean(row.isAllInDefault)}
                      onChange={() => setConfig((p) => ({
                        ...p,
                        packageTypePricings: (p.packageTypePricings ?? []).map((x, i) => ({ ...x, isAllInDefault: i === idx })),
                      }))}
                    />
                    All-In
                  </label>
                  <button
                    type="button"
                    onClick={() => setConfig((p) => ({ ...p, packageTypePricings: (p.packageTypePricings ?? []).filter((_, i) => i !== idx) }))}
                    className="col-span-1 border rounded-lg px-1 text-red-600"
                  >
                    ✕
                  </button>
                </div>
              ))}
              <div className="text-[11px] text-zinc-500">Pilih 1 baris sebagai default `All-In`. Contoh: Bronze 20.000.000, Silver 22.000.000, dst.</div>
            </div>

            <div className="space-y-2 border-2 border-emerald-300 rounded-2xl p-3 bg-emerald-50/40">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-emerald-800">Summary Penawaran Harga Paket</label>
                <span className="text-[10px] text-emerald-700">Tolak ukur harga publish</span>
              </div>
              {packageOfferSummary.length > 0 ? (
                <div className="space-y-1">
                  {packageOfferSummary.map((r, idx) => (
                    <div key={`${r.typeName}-${idx}`} className="grid grid-cols-12 gap-1 rounded-xl border border-emerald-200 bg-white px-2 py-1.5 text-[11px]">
                      <div className="col-span-4 font-semibold text-zinc-800">{r.typeName}</div>
                      <div className="col-span-4 text-zinc-700">Harga Promo: <span className="font-semibold">Rp {r.base.toLocaleString('id-ID')}</span></div>
                      <div className="col-span-4 text-emerald-700">Harga All-In: <span className="font-semibold">Rp {r.allIn.toLocaleString('id-ID')}</span></div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-[11px] text-zinc-500">Isi dulu `Package Type` dan `Harga IDR` untuk melihat ringkasan.</div>
              )}
              <div className="text-[10px] text-zinc-600">
                Catatan: Harga Promo = harga dasar `Package Type` (untuk iklan). Harga All-In = harga dasar + include berbayar + asuransi wajib (jika mode wajib) - diskon paket.
              </div>
            </div>

            <div className="space-y-2 border rounded-2xl p-3">
              <label className="text-xs font-semibold">Mode Pengisian Data Jamaah</label>
              <select
                value={config.jamaahDataMode ?? 'required_full'}
                onChange={(e) => setConfig((p) => ({ ...p, jamaahDataMode: e.target.value as ProgramDisplayConfig['jamaahDataMode'] }))}
                className="w-full border rounded-xl px-3 py-2 text-xs bg-white"
              >
                <option value="required_full">Wajib Lengkap Semua Jamaah</option>
                <option value="required_minimal">Wajib Minimal (Nama + Gender)</option>
                <option value="pic_only">PIC Saja Dulu (Detail Menyusul)</option>
                <option value="optional_after_checkout">Opsional, Lengkapi Setelah Checkout</option>
              </select>
              <div className="text-[11px] text-zinc-500">
                Rekomendasi grup besar: pilih <span className="font-semibold">PIC Saja Dulu</span> agar checkout cepat.
              </div>
            </div>

            <div className="space-y-2 border rounded-2xl p-3">
              <label className="text-xs font-semibold">Fasilitas Paket (dari Master)</label>
              {facilityMasters.length === 0 ? (
                <div className="text-[11px] text-zinc-500">Master fasilitas belum tersedia.</div>
              ) : (
                <div className="grid grid-cols-1 gap-1 max-h-40 overflow-y-auto border rounded-xl p-2 bg-zinc-50">
                  {facilityMasters.map((f) => {
                    const checked = (config.facilities ?? []).some((x) => Number(x.facilityMasterId) === Number(f.id));
                    return (
                      <label key={f.id} className="inline-flex items-center gap-2 text-xs">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={(e) => setConfig((p) => {
                            const prev = Array.isArray(p.facilities) ? p.facilities : [];
                            if (e.target.checked) {
                              if (prev.some((x) => Number(x.facilityMasterId) === Number(f.id))) return p;
                              return { ...p, facilities: [...prev, { facilityMasterId: Number(f.id), name: String(f.name || '') }] };
                            }
                            return { ...p, facilities: prev.filter((x) => Number(x.facilityMasterId) !== Number(f.id)) };
                          })}
                        />
                        <span>{f.name}</span>
                      </label>
                    );
                  })}
                </div>
              )}
              <div className="text-[11px] text-zinc-500">Fasilitas terpilih akan ditampilkan di halaman detail paket publik.</div>
            </div>

            <div className="space-y-2 border rounded-2xl p-3">
              <button
                type="button"
                onClick={() => setScheduleSectionOpen((v) => !v)}
                className="w-full flex items-center justify-between text-left"
              >
                <label className="text-xs font-semibold cursor-pointer">Jadwal Keberangkatan per Program</label>
                <span className="text-[11px] text-zinc-600">{scheduleSectionOpen ? 'Sembunyikan' : 'Tampilkan'}</span>
              </button>
              {scheduleSectionOpen && (
              <>
              <div className="text-[11px] text-zinc-500">Pilih beberapa rentang jadwal keberangkatan. Preview otomatis akan tampil di bawah.</div>
              {selectedConfigPackageId ? (
                <div className="space-y-2">
                  {departureRows.filter((x) => x.departureDate).length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {departureRows.filter((x) => x.departureDate).map((r, i) => (
                        <span key={`${r.departureDate}-${r.returnDate}-${i}`} className="inline-flex rounded-full bg-zinc-100 border px-2 py-0.5 text-[11px] text-zinc-700">
                          {formatPreviewRange(r.departureDate, r.returnDate)}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <div className="text-[11px] text-zinc-500">Belum ada jadwal dipilih.</div>
                  )}
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setDepartureRows((prev) => [...prev, {
                        departureDate: '',
                        returnDate: '',
                        packageTypeId: Number(configDefaultPackageTypeId || 0) || undefined,
                        seatCapacity: Number(configDefaultSeatCapacity || 0),
                        seatAvailable: Number(configDefaultSeatAvailable || 0),
                        customAdditionalPrice: 0,
                        hotelStays: [],
                      }])}
                      className="text-[11px] border rounded-lg px-2 py-1"
                    >
                      + Tambah Jadwal
                    </button>
                    <button
                      type="button"
                      onClick={exportDepartureCsv}
                      className="text-[11px] border rounded-lg px-2 py-1"
                    >
                      Export CSV
                    </button>
                    <button
                      type="button"
                      onClick={exportDepartureJson}
                      className="text-[11px] border rounded-lg px-2 py-1"
                    >
                      Export JSON
                    </button>
                  </div>
                  {departureRows.map((d, idx) => {
                    const accentBorders = ['border-fuchsia-400', 'border-cyan-400', 'border-emerald-400', 'border-orange-400', 'border-rose-400'];
                    const accentBg = ['bg-fuchsia-50', 'bg-cyan-50', 'bg-emerald-50', 'bg-orange-50', 'bg-rose-50'];
                    const accent = idx % accentBorders.length;
                    const totalDays = getScheduleDays(d.departureDate, d.returnDate);
                    const isCollapsed = collapsedScheduleCards.includes(idx);
                    return (
                    <div key={idx} className={`border-2 ${accentBorders[accent]} rounded-xl p-2 space-y-1 ${accentBg[accent]}`}>
                      <button
                        type="button"
                        onClick={() => setCollapsedScheduleCards((prev) => prev.includes(idx) ? prev.filter((x) => x !== idx) : [...prev, idx])}
                        className="w-full flex items-center justify-between text-[11px] font-semibold"
                      >
                        <span>Jadwal #{idx + 1}{totalDays ? ` • ${totalDays} Hari` : ''}</span>
                        <span className="text-zinc-600">{isCollapsed ? 'Tampilkan' : 'Sembunyikan'}</span>
                      </button>
                      {isCollapsed ? null : (
                      <>
                      <div className="grid grid-cols-2 gap-1">
                        <input type="date" value={d.departureDate} onChange={(e) => setDepartureRows((p) => p.map((x, i) => i === idx ? { ...x, departureDate: e.target.value } : x))} className="border rounded-lg px-2 py-1.5 text-xs" />
                        <input type="date" value={d.returnDate ?? ''} onChange={(e) => setDepartureRows((p) => p.map((x, i) => i === idx ? { ...x, returnDate: e.target.value } : x))} className="border rounded-lg px-2 py-1.5 text-xs" />
                      </div>
                      <div className="grid grid-cols-2 gap-1">
                        <label className="block">
                          <span className="text-[10px] text-zinc-500">Total Seat (kapasitas kursi)</span>
                          <input type="number" min={0} value={d.seatCapacity} onChange={(e) => setDepartureRows((p) => p.map((x, i) => i === idx ? { ...x, seatCapacity: Number(e.target.value || 0) } : x))} placeholder="Contoh: 45" className="w-full border rounded-lg px-2 py-1.5 text-xs" />
                        </label>
                        <label className="block">
                          <span className="text-[10px] text-zinc-500">Sisa Seat (kursi tersedia)</span>
                          <input type="number" min={0} value={d.seatAvailable} onChange={(e) => setDepartureRows((p) => p.map((x, i) => i === idx ? { ...x, seatAvailable: Number(e.target.value || 0) } : x))} placeholder="Contoh: 20" className="w-full border rounded-lg px-2 py-1.5 text-xs" />
                        </label>
                      </div>
                      <div className="grid grid-cols-1 gap-1">
                        <div className="border rounded-lg px-2 py-1.5 text-xs bg-zinc-50 text-zinc-600">
                          Package Type & Harga: {getLinkedPackageTypeLabel(config)}
                        </div>
                        <label className="block">
                          <span className="text-[10px] text-zinc-500">Tambahan Custom per Jamaah (default 0)</span>
                          <input
                            value={formatIdrInput(d.customAdditionalPrice)}
                            onChange={(e) => setDepartureRows((p) => p.map((x, i) => i === idx ? { ...x, customAdditionalPrice: parseCurrencyInput(e.target.value) } : x))}
                            placeholder="Contoh: 500.000"
                            className="w-full border rounded-lg px-2 py-1.5 text-xs"
                          />
                        </label>
                        <div className="border rounded-lg px-2 py-2 text-xs bg-white">
                          <div className="text-[10px] text-zinc-500 mb-1">Maskapai yang akan ditumpangi (bisa lebih dari satu)</div>
                          <div className="grid grid-cols-1 gap-1 max-h-24 overflow-y-auto">
                            {airlines.map((a) => {
                              const selected = (d.airlineIds ?? []).includes(a.id);
                              return (
                                <label key={a.id} className="inline-flex items-center gap-2">
                                  <input
                                    type="checkbox"
                                    checked={selected}
                                    onChange={(e) =>
                                      setDepartureRows((p) =>
                                        p.map((x, i) => {
                                          if (i !== idx) return x;
                                          const prev = x.airlineIds ?? [];
                                          const next = e.target.checked ? [...prev, a.id] : prev.filter((id) => id !== a.id);
                                          return { ...x, airlineIds: next, airlineId: next[0] };
                                        })
                                      )
                                    }
                                  />
                                  <span>{a.name}</span>
                                </label>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 gap-1">
                        <select value={d.departureAirportId ?? ''} onChange={(e) => setDepartureRows((p) => p.map((x, i) => i === idx ? { ...x, departureAirportId: e.target.value ? Number(e.target.value) : undefined } : x))} className="border rounded-lg px-2 py-1.5 text-xs">
                          <option value="">Airport</option>
                          {airports.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}
                        </select>
                      </div>
                      <div className="grid grid-cols-1 gap-1">
                        <div className="border rounded-lg px-2 py-2 text-xs bg-white">
                          <div className="text-[10px] text-zinc-500 mb-1">Pilih hotel yang akan ditempati (bisa lebih dari satu)</div>
                          <div className="grid grid-cols-1 gap-1 max-h-24 overflow-y-auto">
                            {hotels.map((h) => {
                              const selected = (d.hotelIds ?? []).includes(h.id);
                              return (
                                <label key={h.id} className="inline-flex items-center gap-2">
                                  <input
                                    type="checkbox"
                                    checked={selected}
                                    onChange={(e) =>
                                      setDepartureRows((p) =>
                                        p.map((x, i) => {
                                          if (i !== idx) return x;
                                          const prev = x.hotelIds ?? [];
                                          const next = e.target.checked ? [...prev, h.id] : prev.filter((id) => id !== h.id);
                                          const nextRoomPrices = (x.hotelRoomPrices ?? []).filter((rp) => next.includes(rp.hotelId));
                                          const nextStays = (x.hotelStays ?? []).filter((hs) => next.includes(hs.hotelId));
                                          if (e.target.checked && !nextStays.some((hs) => hs.hotelId === h.id)) nextStays.push({ hotelId: h.id, nights: 0 });
                                          return { ...x, hotelIds: next, hotelStays: nextStays, hotelRoomPrices: nextRoomPrices, makkahHotelId: next[0], madinahHotelId: next[1] };
                                        })
                                      )
                                    }
                                  />
                                  <span>{h.name}</span>
                                </label>
                              );
                            })}
                          </div>
                        </div>
                        {(d.hotelIds ?? []).map((hotelId) => {
                          const hotelName = hotels.find((h) => h.id === hotelId)?.name ?? `Hotel #${hotelId}`;
                          return (
                            <div key={hotelId} className="border rounded-lg px-2 py-2 text-xs bg-zinc-50">
                              <div className="font-semibold mb-1 flex items-center justify-between">
                                <span>{hotelName} - Harga per Tipe Kamar</span>
                                <button
                                  type="button"
                                  title="Generate cepat harga kamar"
                                  aria-label="Generate cepat harga kamar"
                                  className="inline-flex items-center justify-center w-6 h-6 rounded-md border border-amber-300 bg-amber-50 text-amber-700"
                                  onClick={() =>
                                    setDepartureRows((p) =>
                                      p.map((x, i) => {
                                        if (i !== idx) return x;
                                        const baseRows = (x.hotelRoomPrices ?? []).filter((rp) => !(rp.hotelId === hotelId));
                                        const generated = roomTypeMasters.map((rt, ridx) => {
                                          const randomStep = Math.floor(Math.random() * 15) * 100000;
                                          return {
                                            hotelId,
                                            roomTypeMasterId: rt.id,
                                            price: 1000000 + (ridx * 250000) + randomStep,
                                          };
                                        });
                                        return { ...x, hotelRoomPrices: [...baseRows, ...generated] };
                                      })
                                    )
                                  }
                                >
                                  ⚡
                                </button>
                              </div>
                              <div className="grid grid-cols-2 gap-1 mb-2 items-center">
                                <span className="text-[11px] text-zinc-600">Jumlah Malam Menginap</span>
                                <input
                                  type="number"
                                  min={0}
                                  value={(d.hotelStays ?? []).find((hs) => hs.hotelId === hotelId)?.nights ?? 0}
                                  onFocus={(e) => {
                                    if (e.currentTarget.value === '0') e.currentTarget.select();
                                  }}
                                  onChange={(e) =>
                                    setDepartureRows((p) =>
                                      p.map((x, i) => {
                                        if (i !== idx) return x;
                                        const stays = [...(x.hotelStays ?? [])];
                                        const stayIdx = stays.findIndex((hs) => hs.hotelId === hotelId);
                                        const nights = Number(e.target.value || 0);
                                        if (stayIdx >= 0) stays[stayIdx] = { ...stays[stayIdx], nights };
                                        else stays.push({ hotelId, nights });
                                        return { ...x, hotelStays: stays };
                                      })
                                    )
                                  }
                                  placeholder="Contoh: 3"
                                  className="border rounded-lg px-2 py-1 text-xs"
                                />
                              </div>
                              <div className="grid grid-cols-2 md:grid-cols-3 gap-1 mb-2">
                                {roomTypeMasters.map((rt) => {
                                  const value = (d.hotelRoomPrices ?? []).find(
                                    (rp) => rp.hotelId === hotelId && rp.roomTypeMasterId === rt.id
                                  )?.price;
                                  return (
                                    <label key={`${hotelId}-${rt.id}`} className="block">
                                      <span className="text-[10px] text-zinc-500">{rt.name}</span>
                                      <input
                                        value={formatIdrInput(value)}
                                        onChange={(e) =>
                                          setDepartureRows((p) =>
                                            p.map((x, i) => {
                                              if (i !== idx) return x;
                                              const rows = [...(x.hotelRoomPrices ?? [])];
                                              const pos = rows.findIndex(
                                                (rp) => rp.hotelId === hotelId && rp.roomTypeMasterId === rt.id
                                              );
                                              const nextVal = parseCurrencyInput(e.target.value);
                                              if (pos >= 0) rows[pos] = { ...rows[pos], price: nextVal };
                                              else rows.push({ hotelId, roomTypeMasterId: rt.id, price: nextVal });
                                              return { ...x, hotelRoomPrices: rows };
                                            })
                                          )
                                        }
                                        placeholder="Harga"
                                        className="w-full border rounded-lg px-2 py-1 text-xs"
                                      />
                                    </label>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      <div className="text-[10px] text-zinc-500">Harga tiap tipe kamar diisi per hotel, mengikuti data Room Type Masters.</div>
                      <div className="pt-1">
                        <button type="button" onClick={() => setDepartureRows((p) => p.filter((_, i) => i !== idx))} className="w-full border border-red-300 rounded-lg px-2 py-1.5 text-xs text-red-700 bg-white">
                          Hapus Jadwal Ini
                        </button>
                      </div>
                      </>
                      )}
                    </div>
                  )})}
                </div>
              ) : (
                <div className="text-[11px] text-amber-700">Program belum memiliki data package internal untuk menyimpan jadwal.</div>
              )}
              </>
              )}
            </div>

            <div className="space-y-2 border rounded-2xl p-3">
              <button
                type="button"
                onClick={() => setTermsSectionOpen((v) => !v)}
                className="w-full flex items-center justify-between text-left"
              >
                <label className="text-xs font-medium cursor-pointer">Template Syarat & Ketentuan</label>
                <span className="text-[11px] text-zinc-600">{termsSectionOpen ? 'Sembunyikan' : 'Tampilkan'}</span>
              </button>
              {termsSectionOpen && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <Link href="/akun/master/terms-templates" target="_blank" className="text-[11px] border rounded-lg px-2 py-2 text-center hover:bg-zinc-50">
                      Buka Master Terms
                    </Link>
                    <Link href="/akun/master/terms-templates" target="_blank" className="text-[11px] border rounded-lg px-2 py-2 text-center bg-zinc-900 text-white hover:opacity-90">
                      + Buat Template Baru
                    </Link>
                  </div>
                  <input
                    value={termsTemplateSearch}
                    onChange={(e) => setTermsTemplateSearch(e.target.value)}
                    placeholder="Cari template terms..."
                    className="w-full border rounded-xl px-3 py-2 text-xs"
                  />
                  <div className="border rounded-xl p-2 bg-white max-h-40 overflow-auto space-y-1">
                    {filteredTermsTemplates.length === 0 && (
                      <div className="text-[11px] text-zinc-500 px-1 py-1">Template tidak ditemukan</div>
                    )}
                    {filteredTermsTemplates.map((x) => {
                      const checked = selectedTermsIds.includes(x.id);
                      return (
                        <label key={x.id} className="flex items-center gap-2 text-xs border rounded-lg px-2 py-1.5">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={(e) => {
                              const set = new Set(selectedTermsIds);
                              if (e.target.checked) set.add(x.id);
                              else set.delete(x.id);
                              const next = Array.from(set);
                              setConfig((p) => ({
                                ...p,
                                termsTemplateIds: next,
                                termsTemplateId: next[0] ?? undefined,
                              }));
                            }}
                          />
                          <span>{x.name}</span>
                        </label>
                      );
                    })}
                  </div>
                  <div className="text-[11px] text-zinc-500">
                    Terpilih: {selectedTermsIds.length} template
                  </div>
                  <div className="border rounded-xl p-2 bg-zinc-50">
                    <div className="text-[11px] font-medium text-zinc-700 mb-1">Preview Isi Template (Read-only)</div>
                    <textarea
                      value={termsPreviewLoading ? 'Memuat preview...' : (termsPreviewContent || 'Belum ada konten / template belum dipilih')}
                      readOnly
                      className="w-full min-h-28 border rounded-lg px-2 py-2 text-xs bg-white"
                    />
                  </div>
                </>
              )}
            </div>

            <div className="space-y-2 border rounded-2xl p-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium">Include Berbiaya (Master Pack)</label>
                <button type="button" className="text-[11px] border rounded-lg px-2 py-1" onClick={() => setConfig((p) => ({ ...p, includePricings: [...(p.includePricings ?? []), { id: crypto.randomUUID(), name: '', price: 0 }] }))}>+ Tambah</button>
              </div>
              {(config.includePricings ?? []).map((x, idx) => (
                <div key={x.id || idx} className="grid grid-cols-12 gap-1">
                  <input value={x.name} onChange={(e) => setConfig((p) => ({ ...p, includePricings: (p.includePricings ?? []).map((r, i) => i === idx ? { ...r, name: e.target.value } : r) }))} placeholder="Nama include (contoh: Tiket PP)" className="col-span-7 border rounded-lg px-2 py-1.5 text-xs" />
                  <input value={formatIdrInputAllowZero(x.price)} onChange={(e) => setConfig((p) => ({ ...p, includePricings: (p.includePricings ?? []).map((r, i) => i === idx ? { ...r, price: parseCurrencyInput(e.target.value) } : r) }))} placeholder="Harga" className="col-span-4 border rounded-lg px-2 py-1.5 text-xs" />
                  <button type="button" onClick={() => setConfig((p) => ({ ...p, includePricings: (p.includePricings ?? []).filter((_, i) => i !== idx) }))} className="col-span-1 border rounded-lg px-1 text-red-600">✕</button>
                </div>
              ))}
            </div>

            <div className="space-y-2 border rounded-2xl p-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium">Exclude Berbayar</label>
                <button type="button" className="text-[11px] border rounded-lg px-2 py-1" onClick={() => setConfig((p) => ({ ...p, excludePricings: [...(p.excludePricings ?? []), { id: crypto.randomUUID(), name: '', price: 0 }] }))}>+ Tambah</button>
              </div>
              {(config.excludePricings ?? []).map((x, idx) => (
                <div key={x.id || idx} className="grid grid-cols-12 gap-1">
                  <input value={x.name} onChange={(e) => setConfig((p) => ({ ...p, excludePricings: (p.excludePricings ?? []).map((r, i) => i === idx ? { ...r, name: e.target.value } : r) }))} placeholder="Nama biaya exclude" className="col-span-7 border rounded-lg px-2 py-1.5 text-xs" />
                  <input value={formatIdrInput(x.price)} onChange={(e) => setConfig((p) => ({ ...p, excludePricings: (p.excludePricings ?? []).map((r, i) => i === idx ? { ...r, price: parseCurrencyInput(e.target.value) } : r) }))} placeholder="Harga" className="col-span-4 border rounded-lg px-2 py-1.5 text-xs" />
                  <button type="button" onClick={() => setConfig((p) => ({ ...p, excludePricings: (p.excludePricings ?? []).filter((_, i) => i !== idx) }))} className="col-span-1 border rounded-lg px-1 text-red-600">✕</button>
                </div>
              ))}
            </div>

            <div className="space-y-2 border rounded-2xl p-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium">Voucher Rules</label>
                <button type="button" className="text-[11px] border rounded-lg px-2 py-1" onClick={() => setConfig((p) => ({ ...p, voucherRules: [...(p.voucherRules ?? []), { id: crypto.randomUUID(), code: '', type: 'fixed', value: 0, isActive: true, startAt: '', endAt: '', minOrder: 0, maxUsage: 0 }] }))}>+ Tambah</button>
              </div>
              {(config.voucherRules ?? []).map((x, idx) => (
                <div key={x.id || idx} className="space-y-2 border rounded-xl p-2">
                  <div className="grid grid-cols-12 gap-1 items-end">
                    <label className="col-span-6 block">
                      <span className="text-[10px] text-zinc-600">Kode / Nama Voucher</span>
                      <input value={x.code} onChange={(e) => setConfig((p) => ({ ...p, voucherRules: (p.voucherRules ?? []).map((r, i) => i === idx ? { ...r, code: e.target.value.toUpperCase() } : r) }))} placeholder="Contoh: RAMADHAN10" className="w-full border rounded-lg px-2 py-1.5 text-xs" />
                    </label>
                    <label className="col-span-6 block">
                      <span className="text-[10px] text-zinc-600">Nilai Voucher</span>
                      <input value={x.type === 'percent' ? String(x.value || 0) : formatIdrInput(x.value)} onChange={(e) => setConfig((p) => ({ ...p, voucherRules: (p.voucherRules ?? []).map((r, i) => i === idx ? { ...r, value: r.type === 'percent' ? Number(e.target.value || 0) : parseCurrencyInput(e.target.value) } : r) }))} placeholder={x.type === 'percent' ? '10' : '100.000'} className="w-full border rounded-lg px-2 py-1.5 text-xs" />
                    </label>
                  </div>
                  <div className="grid grid-cols-12 gap-1 items-end">
                    <label className="col-span-6 block">
                      <span className="text-[10px] text-zinc-600">Tipe Nilai</span>
                      <select value={x.type} onChange={(e) => setConfig((p) => ({ ...p, voucherRules: (p.voucherRules ?? []).map((r, i) => i === idx ? { ...r, type: e.target.value as 'fixed' | 'percent' } : r) }))} className="w-full border rounded-lg px-2 py-1.5 text-xs">
                        <option value="fixed">Nominal (Rp)</option>
                        <option value="percent">Persen (%)</option>
                      </select>
                    </label>
                    <div className="col-span-4 text-[11px] border rounded-lg px-2 py-1.5 bg-zinc-50">
                      {(() => {
                        const v = getVoucherPreview(x);
                        return (
                          <div>
                            <div>Potongan: Rp {v.discountAmount.toLocaleString('id-ID')}</div>
                            <div className="text-zinc-500">Akhir: Rp {v.finalPrice.toLocaleString('id-ID')}</div>
                          </div>
                        );
                      })()}
                    </div>
                    <label className="col-span-1 inline-flex items-center justify-center border rounded-lg h-[32px]" title="Aktifkan voucher">
                      <input type="checkbox" checked={x.isActive} onChange={(e) => setConfig((p) => ({ ...p, voucherRules: (p.voucherRules ?? []).map((r, i) => i === idx ? { ...r, isActive: e.target.checked } : r) }))} />
                    </label>
                    <button type="button" onClick={() => setConfig((p) => ({ ...p, voucherRules: (p.voucherRules ?? []).filter((_, i) => i !== idx) }))} className="col-span-1 border rounded-lg px-1 text-red-600 h-[32px]">✕</button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <label className="block">
                      <span className="text-[10px] text-zinc-600">Tanggal Mulai Berlaku</span>
                      <input type="date" value={x.startAt ?? ''} onChange={(e) => setConfig((p) => ({ ...p, voucherRules: (p.voucherRules ?? []).map((r, i) => i === idx ? { ...r, startAt: e.target.value } : r) }))} className="w-full border rounded-lg px-2 py-1.5 text-xs" />
                    </label>
                    <label className="block">
                      <span className="text-[10px] text-zinc-600">Tanggal Berakhir</span>
                      <input type="date" value={x.endAt ?? ''} onChange={(e) => setConfig((p) => ({ ...p, voucherRules: (p.voucherRules ?? []).map((r, i) => i === idx ? { ...r, endAt: e.target.value } : r) }))} className="w-full border rounded-lg px-2 py-1.5 text-xs" />
                    </label>
                  </div>
                  <div className="text-[11px] text-zinc-500">
                    Durasi voucher: {getScheduleDays(x.startAt, x.endAt) ?? 0} hari
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <label className="block">
                      <span className="text-[10px] text-zinc-600">Minimal Order (Rp)</span>
                      <input value={formatIdrInput(x.minOrder)} onChange={(e) => setConfig((p) => ({ ...p, voucherRules: (p.voucherRules ?? []).map((r, i) => i === idx ? { ...r, minOrder: parseCurrencyInput(e.target.value) } : r) }))} placeholder="Contoh: 25.000.000" className="w-full border rounded-lg px-2 py-1.5 text-xs" />
                    </label>
                    <label className="block">
                      <span className="text-[10px] text-zinc-600">Maksimal Pemakaian (kali)</span>
                      <input type="number" min={0} value={x.maxUsage ?? 0} onChange={(e) => setConfig((p) => ({ ...p, voucherRules: (p.voucherRules ?? []).map((r, i) => i === idx ? { ...r, maxUsage: Number(e.target.value || 0) } : r) }))} placeholder="Contoh: 100" className="w-full border rounded-lg px-2 py-1.5 text-xs" />
                    </label>
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-2 border rounded-2xl p-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium">Komisi Referral Agen</label>
                <label className="inline-flex items-center gap-2 text-[11px]">
                  <input
                    type="checkbox"
                    checked={Boolean(config.referralCommission?.isActive)}
                    onChange={(e) => setConfig((p) => ({
                      ...p,
                      referralCommission: {
                        isActive: e.target.checked,
                        type: p.referralCommission?.type ?? 'fixed',
                        value: p.referralCommission?.value ?? 0,
                        minPayout: p.referralCommission?.minPayout ?? 50000,
                        note: p.referralCommission?.note ?? '',
                      },
                    }))}
                  />
                  Aktif
                </label>
              </div>
              <p className="text-[11px] text-zinc-500">
                Jika nonaktif/tidak diisi, sistem fallback ke komisi goodwill (niat) tunai IDR.
              </p>
              <div className="grid grid-cols-2 gap-2">
                <label className="block">
                  <span className="text-[10px] text-zinc-600">Tipe Komisi</span>
                  <select
                    value={config.referralCommission?.type ?? 'fixed'}
                    onChange={(e) => setConfig((p) => ({
                      ...p,
                      referralCommission: {
                        isActive: p.referralCommission?.isActive ?? false,
                        type: e.target.value as 'fixed' | 'percent',
                        value: p.referralCommission?.value ?? 0,
                        minPayout: p.referralCommission?.minPayout ?? 50000,
                        note: p.referralCommission?.note ?? '',
                      },
                    }))}
                    className="w-full border rounded-lg px-2 py-1.5 text-xs"
                  >
                    <option value="fixed">Nominal (Rp)</option>
                    <option value="percent">Persen (%)</option>
                  </select>
                </label>
                <label className="block">
                  <span className="text-[10px] text-zinc-600">Nilai Komisi</span>
                  <input
                    value={(config.referralCommission?.type ?? 'fixed') === 'percent'
                      ? String(config.referralCommission?.value ?? 0)
                      : formatIdrInput(config.referralCommission?.value)}
                    onChange={(e) => setConfig((p) => ({
                      ...p,
                      referralCommission: {
                        isActive: p.referralCommission?.isActive ?? false,
                        type: p.referralCommission?.type ?? 'fixed',
                        value: (p.referralCommission?.type ?? 'fixed') === 'percent'
                          ? Number(e.target.value || 0)
                          : parseCurrencyInput(e.target.value),
                        minPayout: p.referralCommission?.minPayout ?? 50000,
                        note: p.referralCommission?.note ?? '',
                      },
                    }))}
                    className="w-full border rounded-lg px-2 py-1.5 text-xs"
                    placeholder={(config.referralCommission?.type ?? 'fixed') === 'percent' ? 'Contoh: 5' : 'Contoh: 150.000'}
                  />
                </label>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <label className="block">
                  <span className="text-[10px] text-zinc-600">Minimal Pencairan (Rp)</span>
                  <input
                    value={formatIdrInput(config.referralCommission?.minPayout ?? 50000)}
                    onChange={(e) => setConfig((p) => ({
                      ...p,
                      referralCommission: {
                        isActive: p.referralCommission?.isActive ?? false,
                        type: p.referralCommission?.type ?? 'fixed',
                        value: p.referralCommission?.value ?? 0,
                        minPayout: parseCurrencyInput(e.target.value),
                        note: p.referralCommission?.note ?? '',
                      },
                    }))}
                    className="w-full border rounded-lg px-2 py-1.5 text-xs"
                    placeholder="50.000"
                  />
                </label>
                <label className="block">
                  <span className="text-[10px] text-zinc-600">Catatan (Opsional)</span>
                  <input
                    value={config.referralCommission?.note ?? ''}
                    onChange={(e) => setConfig((p) => ({
                      ...p,
                      referralCommission: {
                        isActive: p.referralCommission?.isActive ?? false,
                        type: p.referralCommission?.type ?? 'fixed',
                        value: p.referralCommission?.value ?? 0,
                        minPayout: p.referralCommission?.minPayout ?? 50000,
                        note: e.target.value,
                      },
                    }))}
                    className="w-full border rounded-lg px-2 py-1.5 text-xs"
                    placeholder="Contoh: Komisi promo awal tahun"
                  />
                </label>
              </div>
            </div>

            <div className="space-y-2 border rounded-2xl p-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium">Opsi Asuransi</label>
                <div className="flex items-center gap-1">
                  <button type="button" className="text-[11px] border rounded-lg px-2 py-1" onClick={applyInsuranceStandardAllianz}>Standar Allianz</button>
                  <button type="button" className="text-[11px] border rounded-lg px-2 py-1" onClick={() => setConfig((p) => ({ ...p, insuranceOptions: [...(p.insuranceOptions ?? []), { insuranceTypeId: 0, name: '', pricePerPax: 0, claimWebsite: '' }] }))}>+ Tambah</button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <label className="block">
                  <span className="text-[10px] text-zinc-600">Mode Asuransi di Checkout</span>
                  <select
                    value={config.insuranceMode ?? 'optional'}
                    onChange={(e) => setConfig((p) => ({ ...p, insuranceMode: e.target.value as 'required' | 'optional' }))}
                    className="w-full border rounded-lg px-2 py-1.5 text-xs"
                  >
                    <option value="optional">Opsional (user boleh tanpa asuransi)</option>
                    <option value="required">Wajib (harus pilih asuransi)</option>
                  </select>
                </label>
              </div>
              <div className="text-[11px] text-zinc-500">Rekomendasi: set 1 asuransi standar (Allianz) dulu, lalu user tetap bisa memilih di halaman order.</div>
              {(config.insuranceOptions ?? []).map((x, idx) => (
                <div key={`${x.insuranceTypeId}-${idx}`} className="grid grid-cols-12 gap-1">
                  <select value={x.insuranceTypeId || ''} onChange={(e) => {
                    const idNum = Number(e.target.value || 0);
                    const selected = insuranceTypes.find((it) => it.id === idNum);
                    const nm = selected?.name ?? '';
                    const premium = Number(selected?.basePremium || 0);
                    setConfig((p) => ({ ...p, insuranceOptions: (p.insuranceOptions ?? []).map((r, i) => i === idx ? { ...r, insuranceTypeId: idNum, name: nm, pricePerPax: premium > 0 ? premium : r.pricePerPax } : r) }));
                  }} className="col-span-7 border rounded-lg px-2 py-1.5 text-xs">
                    <option value="">Pilih asuransi</option>
                    {insuranceTypes.map((it) => <option key={it.id} value={it.id}>{it.name}{it.providerName ? ` (${it.providerName})` : ''}</option>)}
                  </select>
                  <input value={formatIdrInput(x.pricePerPax)} onChange={(e) => setConfig((p) => ({ ...p, insuranceOptions: (p.insuranceOptions ?? []).map((r, i) => i === idx ? { ...r, pricePerPax: parseCurrencyInput(e.target.value) } : r) }))} placeholder="Harga/pax" className="col-span-4 border rounded-lg px-2 py-1.5 text-xs" />
                  <button type="button" onClick={() => setConfig((p) => ({ ...p, insuranceOptions: (p.insuranceOptions ?? []).filter((_, i) => i !== idx) }))} className="col-span-1 border rounded-lg px-1 text-red-600">✕</button>
                  <input
                    value={x.claimWebsite ?? ''}
                    onChange={(e) => setConfig((p) => ({ ...p, insuranceOptions: (p.insuranceOptions ?? []).map((r, i) => i === idx ? { ...r, claimWebsite: e.target.value } : r) }))}
                    placeholder="Link dokumen detail asuransi (PDF/URL)"
                    className="col-span-12 border rounded-lg px-2 py-1.5 text-xs"
                  />
                </div>
              ))}
            </div>

            <div className="space-y-2 border rounded-2xl p-3">
              <button
                type="button"
                onClick={() => setDiscountSectionOpen((v) => !v)}
                className="w-full flex items-center justify-between text-left"
              >
                <label className="text-xs font-medium cursor-pointer">Diskon Paket (Opsional)</label>
                <span className="text-[11px] text-zinc-600">{discountSectionOpen ? 'Sembunyikan' : 'Tampilkan'}</span>
              </button>
              <div className="text-[11px] text-zinc-600">
                Ringkasan: {config.discountType === 'percent' ? `${Number(config.discountValue || 0)}%` : `Rp ${Number(config.discountValue || 0).toLocaleString('id-ID')}`} {config.discountLabel ? `• ${config.discountLabel}` : ''}
              </div>
              {discountSectionOpen && (
                <>
                  <div className="grid grid-cols-2 gap-2">
                    <label className="block">
                      <span className="text-[10px] text-zinc-600">Label Diskon</span>
                      <input
                        value={config.discountLabel ?? ''}
                        onChange={(e) => setConfig((p) => ({ ...p, discountLabel: e.target.value }))}
                        placeholder="Contoh: Promo Ramadhan"
                        className="w-full border rounded-xl px-2 py-2 text-xs"
                      />
                    </label>
                    <label className="block">
                      <span className="text-[10px] text-zinc-600">Tipe Diskon</span>
                      <select
                        value={config.discountType ?? 'fixed'}
                        onChange={(e) => setConfig((p) => ({ ...p, discountType: e.target.value as 'fixed' | 'percent' }))}
                        className="w-full border rounded-xl px-2 py-2 text-xs"
                      >
                        <option value="fixed">Nominal (Rp)</option>
                        <option value="percent">Persen (%)</option>
                      </select>
                    </label>
                  </div>
                  <label className="block">
                    <span className="text-[10px] text-zinc-600">Nilai Diskon</span>
                    <input
                      value={config.discountType === 'percent' ? String(config.discountValue ?? '') : formatIdrInput(config.discountValue)}
                      onChange={(e) => setConfig((p) => ({ ...p, discountValue: p.discountType === 'percent' ? Number(e.target.value || 0) : parseCurrencyInput(e.target.value) }))}
                      placeholder={config.discountType === 'percent' ? 'Contoh: 10' : 'Contoh: 100.000'}
                      className="w-full border rounded-xl px-2 py-2 text-xs"
                    />
                  </label>
                </>
              )}
            </div>

            <div className="space-y-2 border rounded-2xl p-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium">Estimasi Kurs (berdasarkan harga Package Type)</label>
                <button
                  type="button"
                  onClick={() => void recalcFx()}
                  disabled={currencyConverting}
                  className="text-[11px] border rounded-lg px-2 py-1 disabled:opacity-60"
                >
                  {currencyConverting ? 'Converting...' : 'Convert'}
                </button>
              </div>
              <div className="text-[11px] text-zinc-500">Sumber rate: `idr.json` (IDR ke USD & SAR)</div>
              {currencyPreviewRows.length > 0 ? (
                <div className="space-y-1 max-h-32 overflow-auto">
                  {currencyPreviewRows.map((r, idx) => (
                    <div key={`${r.packageTypeName}-${idx}`} className="text-[11px] border rounded-lg px-2 py-1.5 bg-zinc-50">
                      <div className="font-medium">{r.packageTypeName}</div>
                      <div>IDR {r.idr.toLocaleString('id-ID')} → USD {r.usd.toLocaleString('en-US')} • SAR {r.sar.toLocaleString('en-US')}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-[11px] text-zinc-500">Belum ada preview kurs. Klik tombol Convert.</div>
              )}
            </div>

            <div className="space-y-2 border rounded-2xl p-3">
              <button
                type="button"
                onClick={() => setItinerarySectionOpen((v) => !v)}
                className="w-full flex items-center justify-between text-left"
              >
                <label className="text-xs font-medium cursor-pointer">Itinerary</label>
                <span className="text-[11px] text-zinc-600">{itinerarySectionOpen ? 'Sembunyikan' : 'Tampilkan'}</span>
              </button>
              {itinerarySectionOpen && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <button type="button" className="w-full rounded-xl border px-3 py-2 text-xs font-semibold" onClick={generateItinerary}>
                    Generate Itinerary Umum (Auto)
                  </button>
                  <button type="button" className="w-full rounded-xl border px-3 py-2 text-xs font-semibold" onClick={() => setItineraryAiModalOpen(true)}>
                    Buka Generator AI (JSON)
                  </button>
                </div>
                <div className="text-[11px] text-zinc-500">Itinerary dikelompokkan per jadwal supaya lebih ringkas.</div>
                {itineraryGroupsForEditor.map((grp, gIdx) => {
                const label = grp.departureDate ? formatPreviewRange(grp.departureDate, grp.returnDate) : `Grup ${gIdx + 1}`;
                const isOpen = openItineraryGroupIdx === gIdx;
                return (
                  <div key={`${grp.departureDate}-${grp.returnDate}-${gIdx}`} className="border rounded-xl">
                    <button
                      type="button"
                      onClick={() => setOpenItineraryGroupIdx((v) => (v === gIdx ? null : gIdx))}
                      className="w-full flex items-center justify-between px-3 py-2 text-xs"
                    >
                      <span className="font-semibold">Jadwal {gIdx + 1}: {label}</span>
                      <span className="text-zinc-500">{isOpen ? 'Sembunyikan' : 'Tampilkan'}</span>
                    </button>
                    {isOpen ? (
                      <div className="p-2 space-y-1 border-t max-h-64 overflow-y-auto">
                        {(grp.items ?? []).map((it, idx) => (
                          <div key={`${gIdx}-${idx}`} className="border rounded-xl p-2 space-y-1">
                            <input
                              value={it.title}
                              onChange={(e) => {
                                setConfig((p) => {
                                  const groups = Array.isArray(p.itineraryByDeparture) ? [...p.itineraryByDeparture] : [];
                                  if (!groups[gIdx]) return p;
                                  const items = [...(groups[gIdx].items ?? [])];
                                  items[idx] = { ...items[idx], title: e.target.value };
                                  groups[gIdx] = { ...groups[gIdx], items };
                                  return { ...p, itineraryByDeparture: groups, itineraries: flattenItineraryGroups(groups) };
                                });
                              }}
                              className="w-full border rounded-lg px-2 py-1.5 text-xs"
                            />
                            <textarea
                              value={it.description}
                              onChange={(e) => {
                                setConfig((p) => {
                                  const groups = Array.isArray(p.itineraryByDeparture) ? [...p.itineraryByDeparture] : [];
                                  if (!groups[gIdx]) return p;
                                  const items = [...(groups[gIdx].items ?? [])];
                                  items[idx] = { ...items[idx], description: e.target.value };
                                  groups[gIdx] = { ...groups[gIdx], items };
                                  return { ...p, itineraryByDeparture: groups, itineraries: flattenItineraryGroups(groups) };
                                });
                              }}
                              placeholder="Deskripsi hari ini..."
                              className="w-full border rounded-lg px-2 py-1.5 text-xs min-h-16"
                            />
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </div>
                );
                })}
              </>
              )}
            </div>

            </div>
            <div className="mt-3 pt-3 border-t bg-white sticky bottom-0 flex gap-2">
              <button type="button" disabled={busy} onClick={() => void saveConfig()} className="rounded-xl bg-primary-600 text-white px-4 py-2 text-xs font-semibold disabled:opacity-60">
                {busy ? (
                  <span className="inline-flex items-center gap-2">
                    <span className="h-3.5 w-3.5 border-2 border-white/80 border-t-transparent rounded-full animate-spin" />
                    Menyimpan...
                  </span>
                ) : 'Simpan'}
              </button>
              <button type="button" onClick={() => closeConfigModal()} className="rounded-xl border px-4 py-2 text-xs">
                Batal
              </button>
            </div>
          </div>
      </ModalShell>

      <ModalShell open={itineraryAiModalOpen && mounted} onBackdropClick={() => setItineraryAiModalOpen(false)}>
        <div className="bg-white w-full max-w-3xl rounded-3xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold">Generator Itinerary via AI (JSON)</h3>
            <button type="button" onClick={() => setItineraryAiModalOpen(false)} className="text-zinc-500" aria-label="Tutup modal">✕</button>
          </div>
          <p className="text-xs text-zinc-600">
            1) Copy prompt di bawah, kirim ke ChatGPT/Gemini/Claude. 2) Copy hasil JSON AI, paste di kolom. 3) Klik Generate.
          </p>
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium">Prompt Siap Copy</label>
              <button
                type="button"
                className="text-[11px] border rounded-lg px-2 py-1"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(buildItineraryAiPrompt());
                    show('Prompt berhasil disalin');
                  } catch {
                    show('Gagal menyalin prompt');
                  }
                }}
              >
                Copy Prompt
              </button>
            </div>
            <textarea
              readOnly
              value={buildItineraryAiPrompt()}
              className="w-full min-h-48 border rounded-xl px-3 py-2 text-xs bg-zinc-50"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium">Paste JSON Itinerary dari AI</label>
            <textarea
              value={itineraryAiJson}
              onChange={(e) => setItineraryAiJson(e.target.value)}
              placeholder='[{"departureDate":"2026-06-12","returnDate":"2026-06-20","items":[{"day":1,"title":"...","description":"..."}]}]'
              className="w-full min-h-44 border rounded-xl px-3 py-2 text-xs"
            />
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" className="rounded-xl border px-4 py-2 text-xs" onClick={() => setItineraryAiModalOpen(false)}>
              Batal
            </button>
            <button type="button" className="rounded-xl bg-primary-600 text-white px-4 py-2 text-xs font-semibold" onClick={applyItineraryFromAiJson}>
              Generate
            </button>
          </div>
        </div>
      </ModalShell>

      <ModalShell open={flashSaleModalOpen && mounted} onBackdropClick={() => { if (!busy) setFlashSaleModalOpen(false); }}>
        <div className="bg-white w-full max-w-[430px] rounded-3xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold">Set Flash Sale</h3>
            <button type="button" onClick={() => { if (!busy) setFlashSaleModalOpen(false); }} className="text-zinc-500" aria-label="Tutup modal">✕</button>
          </div>
          <p className="text-xs text-zinc-600">{flashSaleProgramTitle}</p>
          <div className="space-y-1.5">
            <label className="text-xs font-medium">Berakhir pada (tanggal & jam)</label>
            <input
              type="datetime-local"
              value={flashSaleEndsAt}
              onChange={(e) => setFlashSaleEndsAt(e.target.value)}
              className="w-full border rounded-xl px-3 py-2 text-xs"
            />
            <p className="text-[11px] text-zinc-500">Hitung mundur di homepage akan otomatis ikut waktu ini.</p>
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <button type="button" disabled={busy} onClick={() => setFlashSaleModalOpen(false)} className="rounded-xl border px-4 py-2 text-xs">Batal</button>
            <button type="button" disabled={busy} onClick={() => void saveFlashSale()} className="rounded-xl bg-primary-600 text-white px-4 py-2 text-xs font-semibold disabled:opacity-60">
              {busy ? 'Menyimpan...' : 'Simpan Flash Sale'}
            </button>
          </div>
        </div>
      </ModalShell>

      <ModalShell open={labelsModalOpen && mounted} onBackdropClick={() => { if (!busy) setLabelsModalOpen(false); }}>
          <div className="bg-white w-full max-w-xl rounded-3xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold">Update Label Paket</h3>
              <button type="button" onClick={() => { if (!busy) setLabelsModalOpen(false); }} className="text-zinc-500" aria-label="Tutup modal">✕</button>
            </div>
            <p className="text-xs text-zinc-600">{labelsProgramTitle}</p>
            <label className="block">
              <span className="text-[11px] text-zinc-500">Pilih Label (multi-select)</span>
              <select
                multiple
                value={labelsSelection.map(String)}
                onChange={(e) => {
                  const next = Array.from(e.target.selectedOptions)
                    .map((o) => Number(o.value))
                    .filter((n) => Number.isFinite(n) && n > 0);
                  setLabelsSelection(next);
                }}
                className="mt-1 w-full border rounded-xl px-3 py-2 text-xs min-h-32 bg-white"
              >
                {labelTags.map((x) => (
                  <option key={x.id} value={x.id}>
                    {x.name}{x.code ? ` (${x.code})` : ''}{x.isPromotional ? ' • Promo' : ''}
                  </option>
                ))}
              </select>
            </label>
            <p className="text-[11px] text-zinc-500">Kosongkan semua pilihan jika program ingin tanpa label.</p>
            <div className="flex gap-2">
              <button type="button" disabled={busy} onClick={() => void saveProgramLabels()} className="rounded-xl bg-primary-600 text-white px-4 py-2 text-xs font-semibold disabled:opacity-60">
                {busy ? 'Menyimpan...' : 'Simpan Label'}
              </button>
              <button type="button" disabled={busy} onClick={() => setLabelsModalOpen(false)} className="rounded-xl border px-4 py-2 text-xs">
                Batal
              </button>
            </div>
          </div>
      </ModalShell>

      <ModalShell open={durationJsonModalOpen && mounted} onBackdropClick={() => { if (!durationJsonBusy) setDurationJsonModalOpen(false); }}>
        <div className="bg-white w-full max-w-3xl rounded-3xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold">Edit JSON (Duration Types)</h3>
            <button type="button" onClick={() => { if (!durationJsonBusy) setDurationJsonModalOpen(false); }} className="text-zinc-500" aria-label="Tutup modal">✕</button>
          </div>
          <p className="text-xs text-zinc-600">Paste JSON array lalu kirim ke endpoint bulk Duration Types.</p>
          <div className="flex justify-end">
            <button
              type="button"
              className="border rounded-lg px-2 py-1 text-[11px]"
              title="Copy template JSON"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(durationJsonText);
                  show('Template JSON berhasil disalin');
                } catch {
                  show('Gagal menyalin template JSON');
                }
              }}
            >
              Copy Template
            </button>
          </div>
          <textarea
            value={durationJsonText}
            onChange={(e) => setDurationJsonText(e.target.value)}
            className="w-full min-h-64 border rounded-xl px-3 py-2 text-xs font-mono"
            placeholder='[{"name":"Umrah 12 Hari","defaultDays":12,"defaultNights":11}]'
          />
          <div className="flex justify-end gap-2">
            <button type="button" className="border rounded-xl px-4 py-2 text-xs" disabled={durationJsonBusy} onClick={() => setDurationJsonModalOpen(false)}>Batal</button>
            <button
              type="button"
              className="rounded-xl bg-primary-600 text-white px-4 py-2 text-xs font-semibold disabled:opacity-60"
              disabled={durationJsonBusy}
              onClick={async () => {
                try {
                  const parsed = JSON.parse(durationJsonText);
                  if (!Array.isArray(parsed) || parsed.length === 0) {
                    show('JSON wajib berupa array dan tidak boleh kosong');
                    return;
                  }
                  setDurationJsonBusy(true);
                  await apiPost('/api/v1/master/DurationTypes/bulk', parsed);
                  show('Duration Types bulk berhasil diproses');
                  setDurationJsonModalOpen(false);
                  await loadRefs();
                } catch (e: any) {
                  show(e?.message || 'Gagal memproses Duration Types bulk');
                } finally {
                  setDurationJsonBusy(false);
                }
              }}
            >
              {durationJsonBusy ? 'Memproses...' : 'Execute'}
            </button>
          </div>
        </div>
      </ModalShell>

      <ModalShell open={durationEditModalOpen && mounted} onBackdropClick={() => { if (!durationEditBusy) setDurationEditModalOpen(false); }}>
        <div className="bg-white w-full max-w-[430px] rounded-3xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold">Edit Duration Type</h3>
            <button type="button" onClick={() => { if (!durationEditBusy) setDurationEditModalOpen(false); }} className="text-zinc-500" aria-label="Tutup modal">✕</button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <label className="block col-span-2">
              <span className="text-[11px] text-zinc-500">Nama</span>
              <input value={durationEditForm.name} onChange={(e) => setDurationEditForm((p) => ({ ...p, name: e.target.value }))} className="mt-1 w-full border rounded-xl px-3 py-2 text-xs" />
            </label>
            <label className="block">
              <span className="text-[11px] text-zinc-500">Default Hari</span>
              <input type="number" min={1} value={durationEditForm.defaultDays} onChange={(e) => setDurationEditForm((p) => ({ ...p, defaultDays: Number(e.target.value || 1) }))} className="mt-1 w-full border rounded-xl px-3 py-2 text-xs" />
            </label>
            <label className="block">
              <span className="text-[11px] text-zinc-500">Default Malam</span>
              <input type="number" min={0} value={durationEditForm.defaultNights} onChange={(e) => setDurationEditForm((p) => ({ ...p, defaultNights: Number(e.target.value || 0) }))} className="mt-1 w-full border rounded-xl px-3 py-2 text-xs" />
            </label>
            <label className="block col-span-2">
              <span className="text-[11px] text-zinc-500">Display Format</span>
              <input value={durationEditForm.displayFormat} onChange={(e) => setDurationEditForm((p) => ({ ...p, displayFormat: e.target.value }))} className="mt-1 w-full border rounded-xl px-3 py-2 text-xs" placeholder="Contoh: 12 Hari 11 Malam" />
            </label>
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" className="border rounded-xl px-4 py-2 text-xs" disabled={durationEditBusy} onClick={() => setDurationEditModalOpen(false)}>Batal</button>
            <button type="button" className="rounded-xl bg-primary-600 text-white px-4 py-2 text-xs font-semibold disabled:opacity-60" disabled={durationEditBusy} onClick={() => void saveDurationEdit()}>
              {durationEditBusy ? 'Menyimpan...' : 'Simpan'}
            </button>
          </div>
        </div>
      </ModalShell>
    </div>
  );
}
