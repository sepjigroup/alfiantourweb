'use client';

import { useEffect, useState } from 'react';
import { Link, usePathname } from '@/i18n/routing-patch';
import { useSearchParams } from 'next/navigation';
import { apiDelete, apiGet, apiPost, apiPut, getApiBaseUrl, getAuthToken } from '@/lib/api-client';
import { useToast } from '@/components/Toast';
import { ModalShell } from '@/components/ui/ModalShell';
import { Skeleton } from '@/components/Skeleton';

type MasterConfig = {
  label: string;
  endpoint: string;
};
type GenericModalMode = 'add' | 'edit' | 'delete';

type ListShape = {
  items: Record<string, unknown>[];
  totalCount: number;
  totalPages: number;
  page: number;
  pageSize: number;
};

type BranchFormState = {
  name: string;
  code: string;
  city: string;
  province: string;
  address: string;
  latitude: string;
  longitude: string;
  mapsUrl: string;
  phone: string;
  email: string;
  isActive: boolean;
};

type RoleFormState = {
  name: string;
  code: string;
  description: string;
  isActive: boolean;
};

type UserFormState = {
  id: string;
  fullName: string;
  userName: string;
  email: string;
  phone: string;
  password: string;
  isActive: boolean;
  role: string;
  branchId: string;
};
type UserFieldErrors = Partial<Record<'fullName' | 'email' | 'userName' | 'phone' | 'password' | 'role', string>>;
type HeroFormState = {
  name: string;
  code: string;
  description: string;
  imageUrl: string;
  actionLabel: string;
  actionUrl: string;
  locale: string;
  sortOrder: string;
  isActive: boolean;
  startsAt: string;
  endsAt: string;
};
type HotelFormState = {
  name: string;
  code: string;
  hotelDescription: string;
  sortOrder: string;
  address: string;
  city: string;
  province: string;
  country: string;
  postalCode: string;
  latitude: string;
  longitude: string;
  starRating: string;
  phone: string;
  email: string;
  website: string;
  checkInTime: string;
  checkOutTime: string;
};
type CompanyProfileFormState = {
  name: string;
  provider: string;
  tagline: string;
  address: string;
  website: string;
  centralOfficePhone: string;
  centralWhatsApp: string;
  openTime: string;
  closeTime: string;
  tiktokUrl: string;
  facebookUrl: string;
  instagramUrl: string;
  threadsUrl: string;
  xUrl: string;
  linkedInUrl: string;
  youTubeUrl: string;
  pinterestUrl: string;
};
type InsuranceTypeFormState = {
  name: string;
  code: string;
  description: string;
  sortOrder: string;
  providerName: string;
  policyCode: string;
  coverageAmount: string;
  coverageDays: string;
  coverageDetails: string;
  exclusions: string;
  basePremium: string;
  claimPhoneNumber: string;
  claimWebsite: string;
};
type PackageLabelTagFormState = {
  name: string;
  code: string;
  description: string;
  sortOrder: string;
  colorHex: string;
  icon: string;
  badgeText: string;
  displayPriority: string;
  isPromotional: boolean;
  promoStartDate: string;
  promoEndDate: string;
};
type RoomTypeFormState = {
  name: string;
  code: string;
  description: string;
  sortOrder: string;
  baseCapacity: string;
  maxExtraBed: string;
  minAreaSqm: string;
  bedType: string;
  viewType: string;
  smokingPolicy: string;
  defaultAmenities: string;
};
type FacilityMasterFormState = {
  name: string;
  code: string;
  facilityDescription: string;
  sortOrder: string;
  category: string;
  icon: string;
  isChargeable: boolean;
  basePrice: string;
  operatingHours: string;
  minimumAge: string;
};
type MediaAssetFormState = {
  name: string;
  code: string;
  description: string;
  sortOrder: string;
  mediaType: string;
  fileUrl: string;
  thumbnailUrl: string;
  mimeType: string;
  fileSizeBytes: string;
  width: string;
  height: string;
  durationSeconds: string;
  altText: string;
  storageProvider: string;
  externalId: string;
  isActive: boolean;
};
type ProgramTemplateFormState = {
  name: string;
  code: string;
  description: string;
  durationDays: string;
  departureCity: string;
  startMonth: string;
  endMonth: string;
  departureYear: string;
  sortOrder: string;
  isActive: boolean;
};
type PosterTypeMasterFormState = {
  name: string;
  code: string;
  description: string;
  sortOrder: string;
  isActive: boolean;
};
type DurationTypeFormState = {
  name: string;
  code: string;
  description: string;
  durationSortOrder: string;
  defaultDays: string;
  defaultNights: string;
  displayFormat: string;
};

const USERNAME_REGEX = /^[A-Za-z0-9]+$/;
const SIMPLE_PASSWORD_REGEX = /^[A-Za-z0-9]+$/;
const SIMPLE_EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const WHATSAPP_REGEX = /^\d{10,15}$/;
const USER_WA_TOUCHED_STORAGE_KEY = 'user_management_wa_touched_v1';
const HERO_MIN_WIDTH = 1280;
const HERO_MIN_HEIGHT = 720;
const HERO_MAX_HEIGHT = 2200;
const HERO_MIN_RATIO = 1.3;

const configs: Record<string, MasterConfig> = {
  branch: { label: 'Branch', endpoint: '/api/Branch' },
  'user-management': { label: 'User Management', endpoint: '/api/UserManagement' },
  roles: { label: 'Roles', endpoint: '/api/Roles' },
  airlines: { label: 'Airlines', endpoint: '/api/v1/master/Airlines' },
  airports: { label: 'Airports', endpoint: '/api/v1/master/Airports' },
  'package-categories': { label: 'Package Categories', endpoint: '/api/v1/master/PackageCategories' },
  'package-types': { label: 'Package Types', endpoint: '/api/v1/master/PackageTypes' },
  hotels: { label: 'Hotels', endpoint: '/api/v1/master/Hotels' },
  'insurance-types': { label: 'Insurance Types', endpoint: '/api/v1/master/InsuranceTypes' },
  'package-label-tags': { label: 'Package Label Tags', endpoint: '/api/v1/master/PackageLabelTags' },
  'room-type-masters': { label: 'Room Type Masters', endpoint: '/api/v1/master/RoomTypeMasters' },
  'facility-masters': { label: 'Facility Masters', endpoint: '/api/v1/master/FacilityMasters' },
  'requirement-masters': { label: 'Requirement Masters', endpoint: '/api/v1/master/RequirementMasters' },
  'terms-templates': { label: 'Terms Templates', endpoint: '/api/v1/master/TermsTemplates' },
  'duration-types': { label: 'Duration Types', endpoint: '/api/v1/master/DurationTypes' },
  'departure-seasons': { label: 'Departure Seasons', endpoint: '/api/v1/master/DepartureSeasons' },
  'currency-masters': { label: 'Currency Masters', endpoint: '/api/v1/master/CurrencyMasters' },
  'media-assets': { label: 'Media Assets', endpoint: '/api/v1/master/MediaAssets' },
  'company-profiles': { label: 'Company Profiles', endpoint: '/api/v1/master/company-profiles' },
  'program-templates': { label: 'Program Templates', endpoint: '/api/v1/master/program-templates' },
  'package-class-masters': { label: 'Package Class Masters', endpoint: '/api/v1/master/package-class-masters' },
  'design-theme-masters': { label: 'Design Theme Masters', endpoint: '/api/v1/master/design-theme-masters' },
  'poster-type-masters': { label: 'Poster Type Masters', endpoint: '/api/v1/master/poster-type-masters' },
  'hero-banners': { label: 'Hero Banners', endpoint: '/api/v1/content/hero-banners' },
};

function parseListShape(payload: unknown, fallbackPage: number, fallbackPageSize: number): ListShape {
  const root = (payload ?? {}) as Record<string, unknown>;
  const data = (root.data ?? root.Data ?? root) as Record<string, unknown>;
  const metadata = (root.metadata ?? root.Metadata ?? data.metadata ?? data.Metadata ?? {}) as Record<string, unknown>;

  const dataItems = Array.isArray(data.items)
    ? (data.items as Record<string, unknown>[])
    : Array.isArray(data.Items)
      ? (data.Items as Record<string, unknown>[])
    : Array.isArray(data.data)
      ? (data.data as Record<string, unknown>[])
      : Array.isArray(data.Data)
        ? (data.Data as Record<string, unknown>[])
      : Array.isArray(root.items)
        ? (root.items as Record<string, unknown>[])
        : Array.isArray(root.Items)
          ? (root.Items as Record<string, unknown>[])
        : Array.isArray(root.data)
          ? (root.data as Record<string, unknown>[])
          : Array.isArray(root.Data)
            ? (root.Data as Record<string, unknown>[])
          : Array.isArray(payload)
            ? (payload as Record<string, unknown>[])
            : [];

  const page = Number(metadata.page ?? metadata.Page ?? data.page ?? data.Page ?? root.page ?? root.Page ?? fallbackPage);
  const pageSize = Number(metadata.pageSize ?? metadata.PageSize ?? data.pageSize ?? data.PageSize ?? root.pageSize ?? root.PageSize ?? fallbackPageSize);
  const totalCount = Number(metadata.totalCount ?? metadata.TotalCount ?? data.totalCount ?? data.TotalCount ?? root.totalCount ?? root.TotalCount ?? dataItems.length);
  const totalPages = Number(metadata.totalPages ?? metadata.TotalPages ?? data.totalPages ?? data.TotalPages ?? root.totalPages ?? root.TotalPages ?? Math.max(1, Math.ceil(totalCount / pageSize)));

  return { items: dataItems, page, pageSize, totalCount, totalPages };
}

function resolveItemId(item: Record<string, unknown>): string {
  const value = item.id ?? item.Id ?? item.currencyMasterId ?? item.CurrencyMasterId ?? item.mediaAssetId ?? item.MediaAssetId ?? item.code ?? item.Code ?? item.userName ?? item.UserName ?? '';
  return String(value);
}

function resolveCrudEntityId(item: Record<string, unknown>): string {
  const candidates = [
    item.id,
    item.Id,
    item.currencyMasterId,
    item.CurrencyMasterId,
    item.mediaAssetId,
    item.MediaAssetId,
    item.roleId,
    item.RoleId,
    item.branchId,
    item.BranchId,
  ];
  for (const c of candidates) {
    if (c === null || c === undefined) continue;
    const raw = String(c).trim();
    if (/^\d+$/.test(raw)) return raw;
  }
  return '';
}

function toPrettyJson(value: unknown): string {
  return JSON.stringify(value, null, 2);
}

function toBool(value: unknown, fallback = false): boolean {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') return value.toLowerCase() === 'true';
  if (typeof value === 'number') return value > 0;
  return fallback;
}

function buildGenericAddForm() {
  return {
    name: '',
    code: '',
    description: '',
    city: '',
    country: '',
    iataCode: '',
    icaoCode: '',
    slug: '',
    sortOrder: '0',
    isActive: true,
    metadata: '',
  };
}

function buildGenericEditForm(item: Record<string, unknown>) {
  return {
    name: String(item.name ?? item.Name ?? ''),
    code: String(item.code ?? item.Code ?? ''),
    description: String(item.description ?? item.Description ?? ''),
    city: String(item.city ?? item.City ?? ''),
    country: String(item.country ?? item.Country ?? ''),
    iataCode: String(item.iataCode ?? item.IATACode ?? ''),
    icaoCode: String(item.icaoCode ?? item.ICAOCode ?? ''),
    slug: String(item.slug ?? item.Slug ?? ''),
    sortOrder: String(item.sortOrder ?? item.SortOrder ?? '0'),
    isActive: toBool(item.isActive ?? item.IsActive, true),
    metadata: String(item.metadata ?? item.Metadata ?? ''),
  };
}

function genericPayloadFromForm(form: ReturnType<typeof buildGenericAddForm>) {
  const payload: Record<string, unknown> = {};
  if (form.name.trim()) payload.name = form.name.trim();
  if (form.code.trim()) payload.code = form.code.trim();
  if (form.description.trim()) payload.description = form.description.trim();
  if (form.city.trim()) payload.city = form.city.trim();
  if (form.country.trim()) payload.country = form.country.trim();
  if (form.iataCode.trim()) payload.iataCode = form.iataCode.trim();
  if (form.icaoCode.trim()) payload.icaoCode = form.icaoCode.trim();
  if (form.slug.trim()) payload.slug = form.slug.trim();
  if (form.metadata.trim()) payload.metadata = form.metadata.trim();
  payload.isActive = form.isActive;
  if (form.sortOrder.trim() !== '' && !Number.isNaN(Number(form.sortOrder))) {
    payload.sortOrder = Number(form.sortOrder);
  }
  return payload;
}

function defaultBulkTemplateBySlug(slug: string): string {
  const samples: Record<string, unknown[]> = {
    airlines: [
      { name: 'Garuda Indonesia', code: 'GA', description: 'Maskapai nasional Indonesia', sortOrder: 1, iataCode: 'GA', icaoCode: 'GIA', country: 'Indonesia', website: 'https://www.garuda-indonesia.com', logoUrl: 'https://example.com/ga.png', isLowCostCarrier: false }
    ],
    airports: [
      { name: 'Soekarno-Hatta International Airport', code: 'CGK', description: 'Bandara utama Jakarta', sortOrder: 1, iataCode: 'CGK', icaoCode: 'WIII', city: 'Tangerang', country: 'Indonesia', latitude: -6.125556, longitude: 106.655833, timezoneOffset: 7, terminalInfo: 'T1, T2, T3' }
    ],
    'package-categories': [
      { name: 'Umrah Plus', code: 'UMR-PLUS', description: 'Kategori paket umrah plus', sortOrder: 1, parentCategoryId: null }
    ],
    'package-types': [
      { name: 'Paket Reguler', code: 'PKT-REG', description: 'Paket perjalanan reguler', sortOrder: 1, icon: '🧳', colorHex: '#2563EB', isDefault: true }
    ],
    hotels: [
      { name: 'Anjum Hotel Makkah', code: 'HTL-ANJ', hotelDescription: 'Hotel bintang 5 dekat Masjidil Haram', sortOrder: 1, address: 'Umm Al Qura Rd', city: 'Makkah', province: 'Makkah Region', country: 'Saudi Arabia', postalCode: '24231', latitude: 21.42664, longitude: 39.82563, starRating: 5, phone: '+966125100000', email: 'reservation@anjumhotel.com', website: 'https://anjumhotels.com', checkInTime: '14:00', checkOutTime: '12:00' }
    ],
    'insurance-types': [
      { name: 'Asuransi Umrah Basic', code: 'INS-UMB', description: 'Proteksi dasar jamaah', sortOrder: 1, providerName: 'Takaful Indonesia', policyCode: 'TIF-UMR-001', coverageAmount: 50000000, coverageDays: 14, coverageDetails: 'Rawat inap, keterlambatan penerbangan', exclusions: 'Penyakit bawaan tertentu', basePremium: 250000, claimPhoneNumber: '021-5550001', claimWebsite: 'https://example-insurance.com/claim' }
    ],
    'package-label-tags': [
      { name: 'Flash Sale', code: 'LBL-FLASH', description: 'Label promo kilat', sortOrder: 1, colorHex: '#EF4444', icon: '⚡', badgeText: 'Flash', displayPriority: 10, isPromotional: true, promoStartDate: '2026-06-01T00:00:00Z', promoEndDate: '2026-06-30T23:59:59Z' }
    ],
    'room-type-masters': [
      { name: 'Standard Room', code: 'RM-STD', description: 'Kamar standar untuk tamu individu/pasangan', sortOrder: 1, baseCapacity: 2, maxExtraBed: 1, minAreaSqm: 22, bedType: 'Queen / Twin', viewType: 'City View', smokingPolicy: 'Non-Smoking', defaultAmenities: 'AC, WiFi, TV, Tea/Coffee Maker' },
      { name: 'Superior Room', code: 'RM-SUP', description: 'Kamar lebih luas dengan fasilitas tambahan', sortOrder: 2, baseCapacity: 2, maxExtraBed: 1, minAreaSqm: 28, bedType: 'King / Twin', viewType: 'City / Partial Landmark', smokingPolicy: 'Non-Smoking', defaultAmenities: 'AC, WiFi, TV, Work Desk, Mini Fridge' },
      { name: 'Deluxe Room', code: 'RM-DLX', description: 'Kamar premium dengan kenyamanan lebih tinggi', sortOrder: 3, baseCapacity: 2, maxExtraBed: 1, minAreaSqm: 32, bedType: 'King', viewType: 'City / Landmark', smokingPolicy: 'Non-Smoking', defaultAmenities: 'AC, WiFi, Smart TV, Bathtub, Safe Box' },
      { name: 'Executive Room', code: 'RM-EXE', description: 'Kamar eksekutif, cocok untuk business traveler', sortOrder: 4, baseCapacity: 2, maxExtraBed: 1, minAreaSqm: 36, bedType: 'King', viewType: 'High Floor City View', smokingPolicy: 'Non-Smoking', defaultAmenities: 'AC, WiFi, Smart TV, Lounge Access, Espresso Machine' },
      { name: 'Junior Suite', code: 'RM-JS', description: 'Suite dengan area duduk terpisah', sortOrder: 5, baseCapacity: 3, maxExtraBed: 1, minAreaSqm: 45, bedType: 'King', viewType: 'City / Haram View', smokingPolicy: 'Non-Smoking', defaultAmenities: 'AC, WiFi, Living Area, Bathtub, Premium Toiletries' },
      { name: 'Suite Room', code: 'RM-SUITE', description: 'Suite penuh dengan ruang tamu terpisah', sortOrder: 6, baseCapacity: 4, maxExtraBed: 1, minAreaSqm: 60, bedType: 'King + Sofa Bed', viewType: 'Landmark / Haram View', smokingPolicy: 'Non-Smoking', defaultAmenities: 'AC, WiFi, Living Room, Dining Area, Pantry' },
      { name: 'Family Room', code: 'RM-FAM', description: 'Kamar keluarga kapasitas besar', sortOrder: 7, baseCapacity: 4, maxExtraBed: 2, minAreaSqm: 42, bedType: 'Double + Twin', viewType: 'City View', smokingPolicy: 'Non-Smoking', defaultAmenities: 'AC, WiFi, TV, Extra Storage, Family Amenities' },
      { name: 'Connecting Room', code: 'RM-CONN', description: 'Dua kamar terhubung untuk rombongan/keluarga', sortOrder: 8, baseCapacity: 4, maxExtraBed: 2, minAreaSqm: 50, bedType: 'Twin + Twin / King + Twin', viewType: 'City View', smokingPolicy: 'Non-Smoking', defaultAmenities: 'AC, WiFi, TV, Interconnecting Door' },
      { name: 'Twin Room', code: 'RM-TWIN', description: 'Kamar dengan 2 tempat tidur single', sortOrder: 9, baseCapacity: 2, maxExtraBed: 1, minAreaSqm: 24, bedType: 'Twin', viewType: 'City View', smokingPolicy: 'Non-Smoking', defaultAmenities: 'AC, WiFi, TV, Work Desk' },
      { name: 'Triple Room', code: 'RM-TRP', description: 'Kamar untuk 3 orang', sortOrder: 10, baseCapacity: 3, maxExtraBed: 1, minAreaSqm: 30, bedType: '3 Single Beds / 1 Queen + 1 Single', viewType: 'City View', smokingPolicy: 'Non-Smoking', defaultAmenities: 'AC, WiFi, TV, Wardrobe' },
      { name: 'Quad Room', code: 'RM-QUAD', description: 'Kamar untuk 4 orang (sering dipakai grup umrah)', sortOrder: 11, baseCapacity: 4, maxExtraBed: 0, minAreaSqm: 34, bedType: 'Twin/Twin', viewType: 'City View', smokingPolicy: 'Non-Smoking', defaultAmenities: 'AC, WiFi, TV' },
      { name: 'Presidential Suite', code: 'RM-PS', description: 'Suite tertinggi dengan fasilitas lengkap', sortOrder: 12, baseCapacity: 6, maxExtraBed: 2, minAreaSqm: 120, bedType: 'Multiple Bedrooms', viewType: 'Panoramic / Landmark', smokingPolicy: 'Non-Smoking', defaultAmenities: 'AC, WiFi, Private Living, Dining Room, Butler Service' }
    ],
    'facility-masters': [
      { name: 'Pendamping Ibadah Lansia', code: 'FAC-PEND-LANSIA', facilityDescription: 'Pendamping khusus untuk jamaah lansia saat ibadah dan mobilisasi.', sortOrder: 1, category: 'Layanan Jamaah', icon: '🧑‍⚕️', isChargeable: false, basePrice: 0, operatingHours: '24 Jam', minimumAge: null },
      { name: 'Kursi Roda Bandara & Hotel', code: 'FAC-KURSI-RODA', facilityDescription: 'Fasilitas kursi roda untuk transit bandara, hotel, dan area ibadah.', sortOrder: 2, category: 'Aksesibilitas', icon: '♿', isChargeable: false, basePrice: 0, operatingHours: 'Sesuai Jadwal Keberangkatan', minimumAge: null },
      { name: 'Layanan Fast Track Imigrasi', code: 'FAC-FASTTRACK', facilityDescription: 'Bantuan proses imigrasi lebih cepat untuk rombongan dan lansia.', sortOrder: 3, category: 'Bandara', icon: '🛂', isChargeable: true, basePrice: 850000, operatingHours: 'Sesuai Jam Penerbangan', minimumAge: null },
      { name: 'Medical Check Harian', code: 'FAC-MED-CHECK', facilityDescription: 'Pemeriksaan ringan tekanan darah dan kondisi umum jamaah lansia.', sortOrder: 4, category: 'Kesehatan', icon: '🩺', isChargeable: false, basePrice: 0, operatingHours: 'Setelah Subuh & Setelah Isya', minimumAge: 55 },
      { name: 'Shuttle Hotel-Haram PP', code: 'FAC-SHUTTLE-HARAM', facilityDescription: 'Transport shuttle pulang-pergi hotel ke area Masjidil Haram/Nabawi.', sortOrder: 5, category: 'Transportasi', icon: '🚌', isChargeable: false, basePrice: 0, operatingHours: '24 Jam', minimumAge: null },
      { name: 'Makanan Diet Rendah Garam', code: 'FAC-DIET-LANSIA', facilityDescription: 'Opsi menu khusus jamaah dengan kebutuhan diet rendah garam/gula.', sortOrder: 6, category: 'Konsumsi', icon: '🥗', isChargeable: true, basePrice: 250000, operatingHours: 'Sesuai Jadwal Makan', minimumAge: null },
      { name: 'Laundry Express Ihram', code: 'FAC-LAUNDRY', facilityDescription: 'Layanan laundry cepat untuk pakaian ibadah dan perlengkapan jamaah.', sortOrder: 7, category: 'Hotel', icon: '🧺', isChargeable: true, basePrice: 150000, operatingHours: '08:00-22:00', minimumAge: null },
      { name: 'Bimbingan Manasik Harian', code: 'FAC-MANASIK', facilityDescription: 'Sesi manasik ringkas harian agar jamaah lebih siap dan tenang.', sortOrder: 8, category: 'Edukasi Ibadah', icon: '📘', isChargeable: false, basePrice: 0, operatingHours: 'Setelah Maghrib', minimumAge: null }
    ],
    'requirement-masters': [
      { name: 'Paspor Aktif Minimal 6 Bulan', code: 'REQ-PASPOR-6BLN', description: 'Paspor asli dengan masa berlaku minimal 6 bulan dari tanggal keberangkatan.', sortOrder: 1, category: 'Dokumen Utama', requirementType: 'Mandatory', documentTemplate: 'scan_paspor_jpg_pdf', isMandatory: true, minimumAge: null, maximumAge: null, appliesToGender: 'All' },
      { name: 'KTP Elektronik', code: 'REQ-KTP-EL', description: 'KTP elektronik yang masih berlaku untuk verifikasi data jamaah.', sortOrder: 2, category: 'Identitas', requirementType: 'Mandatory', documentTemplate: 'scan_ktp_jpg_pdf', isMandatory: true, minimumAge: 17, maximumAge: null, appliesToGender: 'All' },
      { name: 'Kartu Keluarga', code: 'REQ-KK', description: 'KK digunakan untuk validasi data keluarga dan pendamping.', sortOrder: 3, category: 'Identitas', requirementType: 'Mandatory', documentTemplate: 'scan_kk_jpg_pdf', isMandatory: true, minimumAge: null, maximumAge: null, appliesToGender: 'All' },
      { name: 'Pas Foto 4x6 Latar Putih', code: 'REQ-PASFOTO-46', description: 'Pas foto terbaru 4x6 latar putih, tampak wajah jelas, tanpa edit berlebihan.', sortOrder: 4, category: 'Foto Dokumen', requirementType: 'Mandatory', documentTemplate: 'pasfoto_4x6_putih', isMandatory: true, minimumAge: null, maximumAge: null, appliesToGender: 'All' },
      { name: 'Sertifikat Vaksin Meningitis', code: 'REQ-VAKSIN-MEN', description: 'Bukti vaksin meningitis sesuai ketentuan keberangkatan umroh/haji.', sortOrder: 5, category: 'Kesehatan', requirementType: 'Mandatory', documentTemplate: 'sertifikat_vaksin_meningitis', isMandatory: true, minimumAge: null, maximumAge: null, appliesToGender: 'All' },
      { name: 'Surat Keterangan Sehat', code: 'REQ-SKS', description: 'Surat keterangan sehat dari fasilitas kesehatan resmi sebelum keberangkatan.', sortOrder: 6, category: 'Kesehatan', requirementType: 'Mandatory', documentTemplate: 'surat_keterangan_sehat', isMandatory: true, minimumAge: null, maximumAge: null, appliesToGender: 'All' },
      { name: 'Surat Mahram (Jamaah Wanita)', code: 'REQ-MAHRAM-W', description: 'Dokumen pendamping mahram untuk jamaah wanita yang memerlukan sesuai regulasi.', sortOrder: 7, category: 'Ketentuan Khusus', requirementType: 'Conditional', documentTemplate: 'surat_mahram', isMandatory: false, minimumAge: 18, maximumAge: null, appliesToGender: 'Female' },
      { name: 'Persetujuan Keluarga untuk Lansia', code: 'REQ-LANSIA-PERSETUJUAN', description: 'Surat persetujuan keluarga/wali untuk jamaah lansia ramah pendamping.', sortOrder: 8, category: 'Lansia', requirementType: 'Conditional', documentTemplate: 'surat_persetujuan_keluarga_lansia', isMandatory: false, minimumAge: 60, maximumAge: null, appliesToGender: 'All' },
      { name: 'Riwayat Obat Pribadi', code: 'REQ-OBAT-PRIBADI', description: 'Daftar obat rutin yang dikonsumsi jamaah untuk mitigasi risiko perjalanan.', sortOrder: 9, category: 'Lansia', requirementType: 'Recommended', documentTemplate: 'daftar_obat_pribadi', isMandatory: false, minimumAge: 55, maximumAge: null, appliesToGender: 'All' },
      { name: 'Akta Lahir (Jamaah Anak)', code: 'REQ-AKTA-ANAK', description: 'Akta lahir untuk jamaah anak sebagai dokumen identitas tambahan.', sortOrder: 10, category: 'Ketentuan Anak', requirementType: 'Conditional', documentTemplate: 'scan_akta_lahir', isMandatory: false, minimumAge: 0, maximumAge: 16, appliesToGender: 'All' }
    ],
    'terms-templates': [
      { name: 'Syarat & Ketentuan Umrah 2026', code: 'TERM-UMR-2026', description: 'Template syarat dan ketentuan umrah', sortOrder: 1, templateType: 'BookingTerms', content: 'Pembayaran DP 30% saat booking...', languageCode: 'id', version: 1, effectiveDate: '2026-01-01T00:00:00Z', expiryDate: null, isDefault: true }
    ],
    'duration-types': [
      { name: 'Umrah Short 9 Hari', code: 'DUR-UMR-9D8N', description: 'Program umrah singkat, cocok untuk jamaah pekerja dengan cuti terbatas.', durationSortOrder: 1, defaultDays: 9, defaultNights: 8, displayFormat: '9 Hari 8 Malam' },
      { name: 'Umrah Reguler 12 Hari', code: 'DUR-UMR-12D11N', description: 'Durasi paling umum untuk paket umrah reguler dengan ritme ibadah lebih nyaman.', durationSortOrder: 2, defaultDays: 12, defaultNights: 11, displayFormat: '12 Hari 11 Malam' },
      { name: 'Umrah Nyaman Lansia 13 Hari', code: 'DUR-UMR-13D12N', description: 'Durasi dengan tempo lebih santai untuk jamaah lansia/pendamping keluarga.', durationSortOrder: 3, defaultDays: 13, defaultNights: 12, displayFormat: '13 Hari 12 Malam' },
      { name: 'Umrah Plus Thaif 14 Hari', code: 'DUR-UMR-14D13N', description: 'Program umrah plus city tour (mis. Thaif) dengan waktu perjalanan lebih longgar.', durationSortOrder: 4, defaultDays: 14, defaultNights: 13, displayFormat: '14 Hari 13 Malam' },
      { name: 'Haji Khusus 24 Hari', code: 'DUR-HJ-24D23N', description: 'Contoh durasi haji khusus (ONH Plus) dengan masa tinggal menyesuaikan layanan.', durationSortOrder: 5, defaultDays: 24, defaultNights: 23, displayFormat: '24 Hari 23 Malam' },
      { name: 'Haji Furoda 20 Hari', code: 'DUR-HJ-20D19N', description: 'Contoh durasi haji furoda, tergantung slot visa dan rencana operasional.', durationSortOrder: 6, defaultDays: 20, defaultNights: 19, displayFormat: '20 Hari 19 Malam' }
    ],
    'departure-seasons': [
      { name: 'Ramadhan 2026', code: 'SEA-RMD-2026', description: 'Musim favorit umrah Ramadhan dengan permintaan sangat tinggi.', sortOrder: 1, seasonStartDate: '2026-02-15T00:00:00Z', seasonEndDate: '2026-03-25T23:59:59Z', seasonDescription: 'Peak season Ramadhan, okupansi tinggi.', priceMultiplier: 1.3, isPeakSeason: true, colorHex: '#B91C1C' },
      { name: 'Syawal 2026', code: 'SEA-SYW-2026', description: 'Periode setelah Idulfitri, biasanya ramai keluarga.', sortOrder: 2, seasonStartDate: '2026-03-26T00:00:00Z', seasonEndDate: '2026-04-30T23:59:59Z', seasonDescription: 'Shoulder season pasca Lebaran.', priceMultiplier: 1.12, isPeakSeason: false, colorHex: '#2563EB' },
      { name: 'Libur Sekolah Tengah Tahun 2026', code: 'SEA-LIBSEK-2026', description: 'Periode libur sekolah, cocok untuk paket keluarga.', sortOrder: 3, seasonStartDate: '2026-06-15T00:00:00Z', seasonEndDate: '2026-07-20T23:59:59Z', seasonDescription: 'Kenaikan demand keluarga, harga cenderung naik.', priceMultiplier: 1.15, isPeakSeason: true, colorHex: '#D97706' },
      { name: 'Awal Musim Umrah 2026/2027', code: 'SEA-AWALMUSIM-2627', description: 'Periode awal musim setelah puncak haji, demand stabil.', sortOrder: 4, seasonStartDate: '2026-08-01T00:00:00Z', seasonEndDate: '2026-10-31T23:59:59Z', seasonDescription: 'Regular season, cocok untuk promo akuisisi.', priceMultiplier: 1.0, isPeakSeason: false, colorHex: '#059669' },
      { name: 'Akhir Tahun 2026', code: 'SEA-AKHIR-2026', description: 'Periode libur akhir tahun, biasanya naik di tiket dan hotel.', sortOrder: 5, seasonStartDate: '2026-12-01T00:00:00Z', seasonEndDate: '2026-12-31T23:59:59Z', seasonDescription: 'High demand akhir tahun.', priceMultiplier: 1.2, isPeakSeason: true, colorHex: '#7C3AED' },
      { name: 'Pra-Ramadhan 2027', code: 'SEA-PRARAM-2027', description: 'Periode menjelang Ramadhan dengan minat meningkat.', sortOrder: 6, seasonStartDate: '2027-01-10T00:00:00Z', seasonEndDate: '2027-02-20T23:59:59Z', seasonDescription: 'Demand mulai naik, seat cepat habis.', priceMultiplier: 1.1, isPeakSeason: false, colorHex: '#0EA5E9' }
    ],
    'currency-masters': [
      { name: 'Indonesian Rupiah', code: 'CUR-IDR', description: 'Mata uang utama transaksi domestik dan harga publish paket.', sortOrder: 1, currencyCode: 'IDR', currencySymbol: 'Rp', exchangeRateToUSD: 16200, decimalPlaces: 0, isDefault: true },
      { name: 'US Dollar', code: 'CUR-USD', description: 'Acuan kurs vendor internasional (tiket, handling, sebagian hotel).', sortOrder: 2, currencyCode: 'USD', currencySymbol: '$', exchangeRateToUSD: 1, decimalPlaces: 2, isDefault: false },
      { name: 'Saudi Riyal', code: 'CUR-SAR', description: 'Mata uang utama transaksi lokal di Saudi (transport, konsumsi, kebutuhan operasional).', sortOrder: 3, currencyCode: 'SAR', currencySymbol: 'SAR', exchangeRateToUSD: 0.27, decimalPlaces: 2, isDefault: false },
      { name: 'UAE Dirham', code: 'CUR-AED', description: 'Digunakan untuk transit/layover dan kebutuhan tambahan area UEA.', sortOrder: 4, currencyCode: 'AED', currencySymbol: 'AED', exchangeRateToUSD: 0.27, decimalPlaces: 2, isDefault: false },
      { name: 'Singapore Dollar', code: 'CUR-SGD', description: 'Cadangan referensi kurs untuk rute tertentu via Singapura.', sortOrder: 5, currencyCode: 'SGD', currencySymbol: 'S$', exchangeRateToUSD: 0.74, decimalPlaces: 2, isDefault: false }
    ],
    'media-assets': [
      { name: 'Hero Umrah Ramadhan 2027', code: 'MED-HERO-UMR-RMD-2027', description: 'Banner utama landing page promo umrah Ramadhan.', sortOrder: 1, mediaType: 'image', fileUrl: '/uploads/media/hero-umrah-ramadhan-2027.webp', thumbnailUrl: '/uploads/media/thumb-hero-umrah-ramadhan-2027.webp', mimeType: 'image/webp', fileSizeBytes: 386420, width: 1920, height: 1080, durationSeconds: null, altText: 'Jamaah umrah di Masjidil Haram saat Ramadhan', storageProvider: 'LocalStorage', externalId: 'local-med-hero-0001' },
      { name: 'Poster Paket Umrah Lansia', code: 'MED-POSTER-LANSIA-2027', description: 'Poster promosi paket umrah ramah lansia untuk media sosial.', sortOrder: 2, mediaType: 'image', fileUrl: '/uploads/media/poster-umrah-lansia-2027.jpg', thumbnailUrl: '/uploads/media/thumb-poster-umrah-lansia-2027.jpg', mimeType: 'image/jpeg', fileSizeBytes: 512240, width: 1080, height: 1350, durationSeconds: null, altText: 'Poster paket umrah ramah lansia', storageProvider: 'LocalStorage', externalId: 'local-med-poster-0002' },
      { name: 'Video Teaser Umrah Family', code: 'MED-VID-TEASER-FAM-2027', description: 'Video teaser 30 detik untuk campaign paket keluarga.', sortOrder: 3, mediaType: 'video', fileUrl: '/uploads/media/teaser-umrah-family-2027.mp4', thumbnailUrl: '/uploads/media/thumb-teaser-umrah-family-2027.jpg', mimeType: 'video/mp4', fileSizeBytes: 18450234, width: 1920, height: 1080, durationSeconds: 30, altText: 'Teaser video paket umrah keluarga', storageProvider: 'LocalStorage', externalId: 'local-med-video-0003' },
      { name: 'Dokumen Brosur PDF Umrah 2027', code: 'MED-PDF-BROSUR-2027', description: 'Brosur detail program dan harga untuk dibagikan ke calon jamaah.', sortOrder: 4, mediaType: 'document', fileUrl: '/uploads/media/brosur-umrah-2027.pdf', thumbnailUrl: '', mimeType: 'application/pdf', fileSizeBytes: 2754321, width: null, height: null, durationSeconds: null, altText: 'Brosur paket umrah 2027', storageProvider: 'LocalStorage', externalId: 'local-med-doc-0004' }
    ],
    'company-profiles': [
      {
        name: 'Alfian Tour',
        provider: 'ZNH Group',
        tagline: 'Haji - Umrah - Travel Internasional',
        address: 'Jl. Raden Dewi Sartika No.54 Bandung Jawa Barat',
        website: 'https://www.alfiantour.com',
        centralOfficePhone: '+62 22 0000 0000',
        centralWhatsApp: '6281234567890',
        openTime: '08:00',
        closeTime: '17:00',
        tikTokUrl: 'https://tiktok.com/@alfiantour',
        facebookUrl: 'https://facebook.com/alfiantour',
        instagramUrl: 'https://instagram.com/alfiantour',
        threadsUrl: 'https://threads.net/@alfiantour',
        xUrl: 'https://x.com/alfiantour',
        linkedInUrl: 'https://linkedin.com/company/alfiantour',
        youTubeUrl: 'https://youtube.com/@alfiantour',
        pinterestUrl: 'https://pinterest.com/alfiantour'
      }
    ],
    'program-templates': [
      { name: 'Umrah Hemat 9 Hari', code: 'PRG-UMR-HEMAT-9H', description: 'Program ringkas untuk jamaah pekerja dengan waktu terbatas.', durationDays: 9, departureCity: 'Jakarta (CGK)', startMonth: 'Januari', endMonth: 'Desember', departureYear: 2027, sortOrder: 1, isActive: true },
      { name: 'Umrah Reguler 12 Hari', code: 'PRG-UMR-REG-12H', description: 'Program standar paling diminati dengan ritme ibadah seimbang.', durationDays: 12, departureCity: 'Jakarta (CGK)', startMonth: 'Februari', endMonth: 'November', departureYear: 2027, sortOrder: 2, isActive: true },
      { name: 'Umrah Ramah Lansia 13 Hari', code: 'PRG-UMR-LANSIA-13H', description: 'Durasi lebih longgar, fokus kenyamanan jamaah lansia dan pendamping.', durationDays: 13, departureCity: 'Surabaya (SUB)', startMonth: 'Maret', endMonth: 'Desember', departureYear: 2027, sortOrder: 3, isActive: true },
      { name: 'Umrah Plus Thaif 14 Hari', code: 'PRG-UMR-PLUS-THAIF-14H', description: 'Umrah plus city tour religi dengan tambahan kunjungan Thaif.', durationDays: 14, departureCity: 'Jakarta (CGK)', startMonth: 'April', endMonth: 'Desember', departureYear: 2027, sortOrder: 4, isActive: true },
      { name: 'Haji Khusus 24 Hari', code: 'PRG-HJ-KHUSUS-24H', description: 'Template program haji khusus dengan durasi tinggal menyesuaikan layanan.', durationDays: 24, departureCity: 'Jakarta (CGK)', startMonth: 'Mei', endMonth: 'Juni', departureYear: 2027, sortOrder: 5, isActive: true }
    ],
    'package-class-masters': [
      { name: 'Economy Class', code: 'PKG-CLS-ECO', description: 'Kelas ekonomis dengan fasilitas standar, cocok untuk jamaah harga terjangkau.', sortOrder: 1, isActive: true },
      { name: 'Bronze Class', code: 'PKG-CLS-BRONZE', description: 'Paket basic dengan peningkatan layanan dibanding economy.', sortOrder: 2, isActive: true },
      { name: 'Silver Class', code: 'PKG-CLS-SILVER', description: 'Paket menengah dengan hotel lebih dekat dan layanan lebih nyaman.', sortOrder: 3, isActive: true },
      { name: 'Gold Class', code: 'PKG-CLS-GOLD', description: 'Paket premium dengan akomodasi dan pendampingan lebih lengkap.', sortOrder: 4, isActive: true },
      { name: 'Platinum Class', code: 'PKG-CLS-PLAT', description: 'Paket high-end dengan hotel unggulan dan prioritas pelayanan.', sortOrder: 5, isActive: true },
      { name: 'VIP Class', code: 'PKG-CLS-VIP', description: 'Paket VIP untuk kenyamanan maksimal, cocok untuk eksekutif/keluarga prioritas.', sortOrder: 6, isActive: true },
      { name: 'Family Class', code: 'PKG-CLS-FAM', description: 'Paket khusus keluarga dengan fleksibilitas kebutuhan anggota keluarga.', sortOrder: 7, isActive: true },
      { name: 'Lansia Care Class', code: 'PKG-CLS-LANSIA', description: 'Paket ramah lansia dengan ritme program lebih santai dan support kesehatan.', sortOrder: 8, isActive: true },
      { name: 'Haji Khusus Class', code: 'PKG-CLS-HJ-KHUSUS', description: 'Kelas paket untuk program haji khusus/ONH Plus.', sortOrder: 9, isActive: true },
      { name: 'Haji Furoda Class', code: 'PKG-CLS-HJ-FURODA', description: 'Kelas paket untuk program haji furoda dengan layanan premium.', sortOrder: 10, isActive: true }
    ],
    'design-theme-masters': [
      { name: 'Elegant Haram Gold', code: 'DSN-HARAM-GOLD', description: 'Tema elegan untuk promo umrah premium/haji khusus.', style: 'Elegant Islamic Luxury', primaryColor: '#0F172A', secondaryColor: '#1E293B', accentColor: '#D4AF37', backgroundColor: '#FFFDF7', sortOrder: 1, isActive: true },
      { name: 'Calm Lansia Blue', code: 'DSN-LANSIA-BLUE', description: 'Tema ramah lansia dengan nuansa tenang dan mudah dibaca.', style: 'Soft Senior-Friendly', primaryColor: '#1D4ED8', secondaryColor: '#60A5FA', accentColor: '#F59E0B', backgroundColor: '#F8FAFC', sortOrder: 2, isActive: true },
      { name: 'Family Warm Sunrise', code: 'DSN-FAM-SUNRISE', description: 'Tema hangat untuk kampanye paket keluarga.', style: 'Warm Family Campaign', primaryColor: '#B45309', secondaryColor: '#F97316', accentColor: '#0EA5E9', backgroundColor: '#FFF7ED', sortOrder: 3, isActive: true },
      { name: 'Ramadhan Night Green', code: 'DSN-RAMADHAN-NIGHT', description: 'Tema spesial Ramadhan dengan karakter religius modern.', style: 'Ramadhan Special', primaryColor: '#065F46', secondaryColor: '#047857', accentColor: '#FACC15', backgroundColor: '#ECFDF5', sortOrder: 4, isActive: true },
      { name: 'Clean Corporate Gray', code: 'DSN-CORP-GRAY', description: 'Tema netral profesional untuk materi edukasi dan info dokumen.', style: 'Corporate Clean', primaryColor: '#334155', secondaryColor: '#64748B', accentColor: '#2563EB', backgroundColor: '#F8FAFC', sortOrder: 5, isActive: true }
    ],
    'poster-type-masters': [
      { name: 'Poster Promo Program Umrah', code: 'POSTER-PROMO-UMR', description: 'Template poster promosi harga dan periode keberangkatan umrah.', sortOrder: 1, isActive: true },
      { name: 'Poster Edukasi Manasik', code: 'POSTER-EDU-MANASIK', description: 'Poster edukasi tahapan manasik dan persiapan jamaah.', sortOrder: 2, isActive: true },
      { name: 'Poster Testimoni Jamaah', code: 'POSTER-TESTI-JAMAAH', description: 'Konten sosial proof berupa pengalaman dan ulasan jamaah.', sortOrder: 3, isActive: true },
      { name: 'Poster Informasi Dokumen', code: 'POSTER-DOKUMEN', description: 'Poster checklist dokumen wajib umrah/haji.', sortOrder: 4, isActive: true },
      { name: 'Poster Paket Ramah Lansia', code: 'POSTER-LANSIA', description: 'Poster khusus paket lansia dengan fasilitas pendampingan.', sortOrder: 5, isActive: true }
    ],
    'hero-banners': [
      { name: 'Hero Utama Umrah', code: 'HERO-UMRAH-1', description: 'Hero default homepage', imageUrl: '/uploads/heroes/hero-default.webp', actionLabel: 'Lihat Paket', actionUrl: '/pack', locale: 'id', sortOrder: 1, isActive: true }
    ],
  };
  return JSON.stringify(samples[slug] ?? [{ name: '', code: '', description: '' }], null, 2);
}

function emptyBranchForm(): BranchFormState {
  return {
    name: '',
    code: '',
    city: '',
    province: '',
    address: '',
    latitude: '',
    longitude: '',
    mapsUrl: '',
    phone: '',
    email: '',
    isActive: true,
  };
}

function branchFormFromItem(item: Record<string, unknown>): BranchFormState {
  return {
    name: String(item.name ?? ''),
    code: String(item.code ?? ''),
    city: String(item.city ?? ''),
    province: String(item.province ?? ''),
    address: String(item.address ?? ''),
    latitude: String(item.latitude ?? ''),
    longitude: String(item.longitude ?? ''),
    mapsUrl: String(item.mapsUrl ?? ''),
    phone: String(item.phone ?? ''),
    email: String(item.email ?? ''),
    isActive: Boolean(item.isActive ?? true),
  };
}

function branchPayloadFromForm(form: BranchFormState): Record<string, unknown> {
  const payload: Record<string, unknown> = {
    name: form.name.trim(),
    code: form.code.trim(),
    city: form.city.trim(),
    province: form.province.trim(),
    address: form.address.trim(),
    mapsUrl: form.mapsUrl.trim(),
    phone: form.phone.trim(),
    email: form.email.trim(),
    isActive: form.isActive,
  };

  if (form.latitude.trim() !== '') payload.latitude = Number(form.latitude);
  if (form.longitude.trim() !== '') payload.longitude = Number(form.longitude);
  return payload;
}

function emptyRoleForm(): RoleFormState {
  return { name: '', code: '', description: '', isActive: true };
}

function roleFormFromItem(item: Record<string, unknown>): RoleFormState {
  return {
    name: String(item.name ?? item.roleName ?? item.title ?? ''),
    code: String(item.code ?? ''),
    description: String(item.description ?? ''),
    isActive: Boolean(item.isActive ?? true),
  };
}

function rolePayloadFromForm(form: RoleFormState): Record<string, unknown> {
  return {
    name: form.name.trim(),
    code: form.code.trim(),
    description: form.description.trim(),
    isActive: form.isActive,
  };
}

function emptyUserForm(): UserFormState {
  return {
    id: '',
    fullName: '',
    userName: '',
    email: '',
    phone: '',
    password: '',
    isActive: true,
    role: '',
    branchId: '',
  };
}

function userFormFromItem(item: Record<string, unknown>): UserFormState {
  const roles = Array.isArray(item.roles) ? item.roles.map((x) => String(x)) : [];
  return {
    id: String(item.id ?? item.Id ?? ''),
    fullName: String(item.fullName ?? item.name ?? ''),
    userName: String(item.userName ?? ''),
    email: String(item.email ?? ''),
    phone: String(item.whatsApp ?? item.phone ?? ''),
    password: '',
    isActive: Boolean(item.isActive ?? true),
    role: roles[0] ?? String(item.role ?? ''),
    branchId: String(item.branchId ?? ''),
  };
}

function emptyHeroForm(): HeroFormState {
  return {
    name: '',
    code: '',
    description: '',
    imageUrl: '',
    actionLabel: '',
    actionUrl: '/pack',
    locale: 'id',
    sortOrder: '0',
    isActive: true,
    startsAt: '',
    endsAt: '',
  };
}

function sanitizeUsernameInput(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/g, '');
}

function sanitizeWhatsappInput(value: string): string {
  return value.replace(/\D+/g, '');
}

function sanitizePasswordInput(value: string): string {
  return value.replace(/\s+/g, '');
}

function toApiAssetUrl(rawUrl: string): string {
  const value = rawUrl.trim();
  if (!value) return '';
  if (/^https?:\/\//i.test(value)) return value;
  const base = getApiBaseUrl().replace(/\/+$/, '');
  const path = value.startsWith('/') ? value : `/${value}`;
  return `${base}${path}`;
}

function toHeroImagePayloadUrl(rawUrl: string): string {
  const value = rawUrl.trim();
  const base = getApiBaseUrl().replace(/\/+$/, '');
  if (value.startsWith(base)) {
    const stripped = value.slice(base.length);
    return stripped.startsWith('/') ? stripped : `/${stripped}`;
  }
  return value;
}

function heroFormFromItem(item: Record<string, unknown>): HeroFormState {
  return {
    name: String(item.name ?? item.Name ?? ''),
    code: String(item.code ?? item.Code ?? ''),
    description: String(item.description ?? item.Description ?? ''),
    imageUrl: toApiAssetUrl(String(item.imageUrl ?? item.ImageUrl ?? '')),
    actionLabel: String(item.actionLabel ?? item.ActionLabel ?? ''),
    actionUrl: String(item.actionUrl ?? item.ActionUrl ?? '/pack'),
    locale: String(item.locale ?? item.Locale ?? 'id'),
    sortOrder: String(item.sortOrder ?? item.SortOrder ?? '0'),
    isActive: toBool(item.isActive ?? item.IsActive, true),
    startsAt: String(item.startsAt ?? item.StartsAt ?? ''),
    endsAt: String(item.endsAt ?? item.EndsAt ?? ''),
  };
}

function emptyHotelForm(): HotelFormState {
  return {
    name: '',
    code: '',
    hotelDescription: '',
    sortOrder: '0',
    address: '',
    city: '',
    province: '',
    country: '',
    postalCode: '',
    latitude: '',
    longitude: '',
    starRating: '3',
    phone: '',
    email: '',
    website: '',
    checkInTime: '',
    checkOutTime: '',
  };
}

function hotelFormFromItem(item: Record<string, unknown>): HotelFormState {
  return {
    name: String(item.name ?? ''),
    code: String(item.code ?? ''),
    hotelDescription: String(item.hotelDescription ?? item.description ?? ''),
    sortOrder: String(item.sortOrder ?? '0'),
    address: String(item.address ?? ''),
    city: String(item.city ?? ''),
    province: String(item.province ?? ''),
    country: String(item.country ?? ''),
    postalCode: String(item.postalCode ?? ''),
    latitude: String(item.latitude ?? ''),
    longitude: String(item.longitude ?? ''),
    starRating: String(item.starRating ?? '3'),
    phone: String(item.phone ?? ''),
    email: String(item.email ?? ''),
    website: String(item.website ?? ''),
    checkInTime: String(item.checkInTime ?? ''),
    checkOutTime: String(item.checkOutTime ?? ''),
  };
}

function hotelPayloadFromForm(form: HotelFormState, mode: GenericModalMode, id?: string): Record<string, unknown> {
  const payload: Record<string, unknown> = {
    name: form.name.trim(),
    hotelDescription: form.hotelDescription.trim() || null,
    sortOrder: Number(form.sortOrder || '0'),
    address: form.address.trim() || null,
    city: form.city.trim() || null,
    province: form.province.trim() || null,
    country: form.country.trim() || null,
    postalCode: form.postalCode.trim() || null,
    latitude: form.latitude.trim() !== '' ? Number(form.latitude) : null,
    longitude: form.longitude.trim() !== '' ? Number(form.longitude) : null,
    starRating: Number(form.starRating || '0'),
    phone: form.phone.trim() || null,
    email: form.email.trim() || null,
    website: form.website.trim() || null,
    checkInTime: form.checkInTime.trim() || null,
    checkOutTime: form.checkOutTime.trim() || null,
  };
  if (mode === 'add') payload.code = form.code.trim() || null;
  if (mode === 'edit') payload.id = Number(id || 0);
  return payload;
}

function normalizeBulkRowsBySlug(slug: string, rows: Record<string, unknown>[]): Record<string, unknown>[] {
  if (slug === 'program-templates') {
    return rows.map((r) => ({
      name: String(r.name ?? '').trim(),
      code: String(r.code ?? '').trim() || null,
      description: String(r.description ?? '').trim() || null,
      durationDays: Number(r.durationDays ?? 0) || 0,
      departureCity: String(r.departureCity ?? '').trim() || null,
      startMonth: String(r.startMonth ?? '').trim() || null,
      endMonth: String(r.endMonth ?? '').trim() || null,
      departureYear: r.departureYear === null || r.departureYear === undefined || String(r.departureYear).trim() === '' ? null : Number(r.departureYear),
      airlineId: r.airlineId === null || r.airlineId === undefined || String(r.airlineId).trim() === '' ? null : Number(r.airlineId),
      sortOrder: Number(r.sortOrder ?? 0) || 0,
      isActive: toBool(r.isActive, true),
      slug: String(r.slug ?? '').trim() || null,
      metadata: typeof r.metadata === 'object' && r.metadata !== null ? r.metadata : null,
    }));
  }
  if (slug === 'poster-type-masters') {
    return rows.map((r) => ({
      name: String(r.name ?? '').trim(),
      code: String(r.code ?? '').trim() || null,
      description: String(r.description ?? '').trim() || null,
      sortOrder: Number(r.sortOrder ?? 0) || 0,
      isActive: toBool(r.isActive, true),
      slug: String(r.slug ?? '').trim() || null,
      metadata: typeof r.metadata === 'object' && r.metadata !== null ? r.metadata : null,
    }));
  }
  return rows;
}

function emptyCompanyProfileForm(): CompanyProfileFormState {
  return {
    name: '',
    provider: '',
    tagline: '',
    address: '',
    website: '',
    centralOfficePhone: '',
    centralWhatsApp: '',
    openTime: '',
    closeTime: '',
    tiktokUrl: '',
    facebookUrl: '',
    instagramUrl: '',
    threadsUrl: '',
    xUrl: '',
    linkedInUrl: '',
    youTubeUrl: '',
    pinterestUrl: '',
  };
}

function companyProfileFormFromItem(item: Record<string, unknown>): CompanyProfileFormState {
  return {
    name: String(item.name ?? ''),
    provider: String(item.provider ?? ''),
    tagline: String(item.tagline ?? ''),
    address: String(item.address ?? ''),
    website: String(item.website ?? ''),
    centralOfficePhone: String(item.centralOfficePhone ?? ''),
    centralWhatsApp: String(item.centralWhatsApp ?? ''),
    openTime: String(item.openTime ?? ''),
    closeTime: String(item.closeTime ?? ''),
    tiktokUrl: String(item.tikTokUrl ?? item.tiktokUrl ?? ''),
    facebookUrl: String(item.facebookUrl ?? ''),
    instagramUrl: String(item.instagramUrl ?? ''),
    threadsUrl: String(item.threadsUrl ?? ''),
    xUrl: String(item.xUrl ?? ''),
    linkedInUrl: String(item.linkedInUrl ?? ''),
    youTubeUrl: String(item.youTubeUrl ?? item.youtubeUrl ?? ''),
    pinterestUrl: String(item.pinterestUrl ?? ''),
  };
}

function companyProfilePayloadFromForm(form: CompanyProfileFormState): Record<string, unknown> {
  return {
    name: form.name.trim(),
    provider: form.provider.trim() || null,
    tagline: form.tagline.trim() || null,
    address: form.address.trim() || null,
    website: form.website.trim() || null,
    centralOfficePhone: form.centralOfficePhone.trim() || null,
    centralWhatsApp: form.centralWhatsApp.trim() || null,
    openTime: form.openTime.trim() || null,
    closeTime: form.closeTime.trim() || null,
    tikTokUrl: form.tiktokUrl.trim() || null,
    facebookUrl: form.facebookUrl.trim() || null,
    instagramUrl: form.instagramUrl.trim() || null,
    threadsUrl: form.threadsUrl.trim() || null,
    xUrl: form.xUrl.trim() || null,
    linkedInUrl: form.linkedInUrl.trim() || null,
    youTubeUrl: form.youTubeUrl.trim() || null,
    pinterestUrl: form.pinterestUrl.trim() || null,
  };
}

function emptyInsuranceTypeForm(): InsuranceTypeFormState {
  return {
    name: '',
    code: '',
    description: '',
    sortOrder: '0',
    providerName: '',
    policyCode: '',
    coverageAmount: '0',
    coverageDays: '0',
    coverageDetails: '',
    exclusions: '',
    basePremium: '0',
    claimPhoneNumber: '',
    claimWebsite: '',
  };
}

function insuranceTypeFormFromItem(item: Record<string, unknown>): InsuranceTypeFormState {
  return {
    name: String(item.name ?? ''),
    code: String(item.code ?? ''),
    description: String(item.description ?? ''),
    sortOrder: String(item.sortOrder ?? '0'),
    providerName: String(item.providerName ?? ''),
    policyCode: String(item.policyCode ?? ''),
    coverageAmount: String(item.coverageAmount ?? '0'),
    coverageDays: String(item.coverageDays ?? '0'),
    coverageDetails: String(item.coverageDetails ?? ''),
    exclusions: String(item.exclusions ?? ''),
    basePremium: String(item.basePremium ?? '0'),
    claimPhoneNumber: String(item.claimPhoneNumber ?? ''),
    claimWebsite: String(item.claimWebsite ?? ''),
  };
}

function insuranceTypePayloadFromForm(form: InsuranceTypeFormState, mode: GenericModalMode, id?: string): Record<string, unknown> {
  const sortOrder = Number(form.sortOrder || 0);
  const coverageAmount = Number(form.coverageAmount || 0);
  const coverageDays = Number(form.coverageDays || 0);
  const basePremium = Number(form.basePremium || 0);

  if (mode === 'add') {
    return {
      name: form.name.trim(),
      code: form.code.trim() || null,
      description: form.description.trim() || null,
      sortOrder: Number.isNaN(sortOrder) ? 0 : sortOrder,
      providerName: form.providerName.trim() || null,
      policyCode: form.policyCode.trim() || null,
      coverageAmount: Number.isNaN(coverageAmount) ? 0 : coverageAmount,
      coverageDays: Number.isNaN(coverageDays) ? 0 : coverageDays,
      coverageDetails: form.coverageDetails.trim() || null,
      exclusions: form.exclusions.trim() || null,
      basePremium: Number.isNaN(basePremium) ? 0 : basePremium,
      claimPhoneNumber: form.claimPhoneNumber.trim() || null,
      claimWebsite: form.claimWebsite.trim() || null,
    };
  }

  return {
    id: Number(id || 0),
    name: form.name.trim(),
    description: form.description.trim() || null,
    sortOrder: Number.isNaN(sortOrder) ? 0 : sortOrder,
    providerName: form.providerName.trim() || null,
    policyCode: form.policyCode.trim() || null,
    coverageAmount: Number.isNaN(coverageAmount) ? 0 : coverageAmount,
    coverageDays: Number.isNaN(coverageDays) ? 0 : coverageDays,
    coverageDetails: form.coverageDetails.trim() || null,
    exclusions: form.exclusions.trim() || null,
    basePremium: Number.isNaN(basePremium) ? 0 : basePremium,
    claimPhoneNumber: form.claimPhoneNumber.trim() || null,
    claimWebsite: form.claimWebsite.trim() || null,
  };
}

function emptyPackageLabelTagForm(): PackageLabelTagFormState {
  return {
    name: '',
    code: '',
    description: '',
    sortOrder: '0',
    colorHex: '',
    icon: '',
    badgeText: '',
    displayPriority: '0',
    isPromotional: false,
    promoStartDate: '',
    promoEndDate: '',
  };
}

function packageLabelTagFormFromItem(item: Record<string, unknown>): PackageLabelTagFormState {
  return {
    name: String(item.name ?? ''),
    code: String(item.code ?? ''),
    description: String(item.description ?? ''),
    sortOrder: String(item.sortOrder ?? '0'),
    colorHex: String(item.colorHex ?? ''),
    icon: String(item.icon ?? ''),
    badgeText: String(item.badgeText ?? ''),
    displayPriority: String(item.displayPriority ?? '0'),
    isPromotional: Boolean(item.isPromotional ?? false),
    promoStartDate: String(item.promoStartDate ?? '').slice(0, 10),
    promoEndDate: String(item.promoEndDate ?? '').slice(0, 10),
  };
}

function packageLabelTagPayloadFromForm(form: PackageLabelTagFormState, mode: GenericModalMode, id?: string): Record<string, unknown> {
  const sortOrder = Number(form.sortOrder || 0);
  const displayPriority = Number(form.displayPriority || 0);
  if (mode === 'add') {
    return {
      name: form.name.trim(),
      code: form.code.trim() || null,
      description: form.description.trim() || null,
      sortOrder: Number.isNaN(sortOrder) ? 0 : sortOrder,
      colorHex: form.colorHex.trim() || null,
      icon: form.icon.trim() || null,
      badgeText: form.badgeText.trim() || null,
      displayPriority: Number.isNaN(displayPriority) ? 0 : displayPriority,
      isPromotional: form.isPromotional,
      promoStartDate: form.promoStartDate ? new Date(form.promoStartDate).toISOString() : null,
      promoEndDate: form.promoEndDate ? new Date(form.promoEndDate).toISOString() : null,
    };
  }
  return {
    id: Number(id || 0),
    name: form.name.trim(),
    description: form.description.trim() || null,
    sortOrder: Number.isNaN(sortOrder) ? 0 : sortOrder,
    colorHex: form.colorHex.trim() || null,
    icon: form.icon.trim() || null,
    badgeText: form.badgeText.trim() || null,
    displayPriority: Number.isNaN(displayPriority) ? 0 : displayPriority,
    isPromotional: form.isPromotional,
    promoStartDate: form.promoStartDate ? new Date(form.promoStartDate).toISOString() : null,
    promoEndDate: form.promoEndDate ? new Date(form.promoEndDate).toISOString() : null,
  };
}

function emptyRoomTypeForm(): RoomTypeFormState {
  return {
    name: '',
    code: '',
    description: '',
    sortOrder: '0',
    baseCapacity: '',
    maxExtraBed: '',
    minAreaSqm: '',
    bedType: '',
    viewType: '',
    smokingPolicy: '',
    defaultAmenities: '',
  };
}

function roomTypeFormFromItem(item: Record<string, unknown>): RoomTypeFormState {
  return {
    name: String(item.name ?? ''),
    code: String(item.code ?? ''),
    description: String(item.description ?? ''),
    sortOrder: String(item.sortOrder ?? '0'),
    baseCapacity: String(item.baseCapacity ?? ''),
    maxExtraBed: String(item.maxExtraBed ?? ''),
    minAreaSqm: String(item.minAreaSqm ?? ''),
    bedType: String(item.bedType ?? ''),
    viewType: String(item.viewType ?? ''),
    smokingPolicy: String(item.smokingPolicy ?? ''),
    defaultAmenities: String(item.defaultAmenities ?? ''),
  };
}

function roomTypePayloadFromForm(form: RoomTypeFormState, mode: GenericModalMode, id?: string): Record<string, unknown> {
  const baseCapacity = form.baseCapacity.trim() === '' ? null : Number(form.baseCapacity);
  const maxExtraBed = form.maxExtraBed.trim() === '' ? null : Number(form.maxExtraBed);
  const minAreaSqm = form.minAreaSqm.trim() === '' ? null : Number(form.minAreaSqm);
  const sortOrder = Number(form.sortOrder || 0);

  if (mode === 'add') {
    return {
      name: form.name.trim(),
      code: form.code.trim() || null,
      description: form.description.trim() || null,
      sortOrder: Number.isNaN(sortOrder) ? 0 : sortOrder,
      baseCapacity: Number.isNaN(Number(baseCapacity)) ? null : baseCapacity,
      maxExtraBed: Number.isNaN(Number(maxExtraBed)) ? null : maxExtraBed,
      minAreaSqm: Number.isNaN(Number(minAreaSqm)) ? null : minAreaSqm,
      bedType: form.bedType.trim() || null,
      viewType: form.viewType.trim() || null,
      smokingPolicy: form.smokingPolicy.trim() || null,
      defaultAmenities: form.defaultAmenities.trim() || null,
    };
  }

  return {
    id: Number(id || 0),
    name: form.name.trim(),
    description: form.description.trim() || null,
    sortOrder: Number.isNaN(sortOrder) ? 0 : sortOrder,
    baseCapacity: Number.isNaN(Number(baseCapacity)) ? null : baseCapacity,
    maxExtraBed: Number.isNaN(Number(maxExtraBed)) ? null : maxExtraBed,
    minAreaSqm: Number.isNaN(Number(minAreaSqm)) ? null : minAreaSqm,
    bedType: form.bedType.trim() || null,
    viewType: form.viewType.trim() || null,
    smokingPolicy: form.smokingPolicy.trim() || null,
    defaultAmenities: form.defaultAmenities.trim() || null,
  };
}

function emptyFacilityMasterForm(): FacilityMasterFormState {
  return {
    name: '',
    code: '',
    facilityDescription: '',
    sortOrder: '0',
    category: '',
    icon: '',
    isChargeable: false,
    basePrice: '',
    operatingHours: '',
    minimumAge: '',
  };
}

function facilityMasterFormFromItem(item: Record<string, unknown>): FacilityMasterFormState {
  return {
    name: String(item.name ?? ''),
    code: String(item.code ?? ''),
    facilityDescription: String(item.facilityDescription ?? item.description ?? ''),
    sortOrder: String(item.sortOrder ?? '0'),
    category: String(item.category ?? ''),
    icon: String(item.icon ?? ''),
    isChargeable: Boolean(item.isChargeable ?? false),
    basePrice: String(item.basePrice ?? ''),
    operatingHours: String(item.operatingHours ?? ''),
    minimumAge: String(item.minimumAge ?? ''),
  };
}

function facilityMasterPayloadFromForm(form: FacilityMasterFormState, mode: GenericModalMode, id?: string): Record<string, unknown> {
  const sortOrder = Number(form.sortOrder || 0);
  const basePrice = form.basePrice.trim() === '' ? null : Number(form.basePrice);
  const minimumAge = form.minimumAge.trim() === '' ? null : Number(form.minimumAge);

  if (mode === 'add') {
    return {
      name: form.name.trim(),
      code: form.code.trim() || null,
      facilityDescription: form.facilityDescription.trim() || null,
      sortOrder: Number.isNaN(sortOrder) ? 0 : sortOrder,
      category: form.category.trim() || null,
      icon: form.icon.trim() || null,
      isChargeable: form.isChargeable,
      basePrice: Number.isNaN(Number(basePrice)) ? null : basePrice,
      operatingHours: form.operatingHours.trim() || null,
      minimumAge: Number.isNaN(Number(minimumAge)) ? null : minimumAge,
    };
  }

  return {
    id: Number(id || 0),
    name: form.name.trim(),
    facilityDescription: form.facilityDescription.trim() || null,
    sortOrder: Number.isNaN(sortOrder) ? 0 : sortOrder,
    category: form.category.trim() || null,
    icon: form.icon.trim() || null,
    isChargeable: form.isChargeable,
    basePrice: Number.isNaN(Number(basePrice)) ? null : basePrice,
    operatingHours: form.operatingHours.trim() || null,
    minimumAge: Number.isNaN(Number(minimumAge)) ? null : minimumAge,
  };
}

function emptyMediaAssetForm(): MediaAssetFormState {
  return {
    name: '',
    code: '',
    description: '',
    sortOrder: '0',
    mediaType: 'image',
    fileUrl: '',
    thumbnailUrl: '',
    mimeType: '',
    fileSizeBytes: '',
    width: '',
    height: '',
    durationSeconds: '',
    altText: '',
    storageProvider: 'LocalStorage',
    externalId: '',
    isActive: true,
  };
}

function mediaAssetFormFromItem(item: Record<string, unknown>): MediaAssetFormState {
  return {
    name: String(item.name ?? item.Name ?? ''),
    code: String(item.code ?? item.Code ?? ''),
    description: String(item.description ?? item.Description ?? ''),
    sortOrder: String(item.sortOrder ?? item.SortOrder ?? '0'),
    mediaType: String(item.mediaType ?? item.MediaType ?? 'image'),
    fileUrl: String(item.fileUrl ?? item.FileUrl ?? ''),
    thumbnailUrl: String(item.thumbnailUrl ?? item.ThumbnailUrl ?? ''),
    mimeType: String(item.mimeType ?? item.MimeType ?? ''),
    fileSizeBytes: String(item.fileSizeBytes ?? item.FileSizeBytes ?? ''),
    width: String(item.width ?? item.Width ?? ''),
    height: String(item.height ?? item.Height ?? ''),
    durationSeconds: String(item.durationSeconds ?? item.DurationSeconds ?? ''),
    altText: String(item.altText ?? item.AltText ?? ''),
    storageProvider: String(item.storageProvider ?? item.StorageProvider ?? 'LocalStorage'),
    externalId: String(item.externalId ?? item.ExternalId ?? ''),
    isActive: toBool(item.isActive ?? item.IsActive, true),
  };
}

function mediaAssetPayloadFromForm(form: MediaAssetFormState, mode: GenericModalMode, id?: string): Record<string, unknown> {
  const payload: Record<string, unknown> = {
    name: form.name.trim(),
    description: form.description.trim() || null,
    sortOrder: Number(form.sortOrder || '0'),
    mediaType: form.mediaType.trim() || null,
    fileUrl: form.fileUrl.trim() || null,
    thumbnailUrl: form.thumbnailUrl.trim() || null,
    mimeType: form.mimeType.trim() || null,
    fileSizeBytes: form.fileSizeBytes.trim() !== '' ? Number(form.fileSizeBytes) : null,
    width: form.width.trim() !== '' ? Number(form.width) : null,
    height: form.height.trim() !== '' ? Number(form.height) : null,
    durationSeconds: form.durationSeconds.trim() !== '' ? Number(form.durationSeconds) : null,
    altText: form.altText.trim() || null,
    storageProvider: form.storageProvider.trim() || null,
    externalId: form.externalId.trim() || null,
  };
  if (mode === 'add') payload.code = form.code.trim() || null;
  if (mode === 'edit') payload.id = Number(id || 0);
  return payload;
}

function emptyProgramTemplateForm(): ProgramTemplateFormState {
  return { name: '', code: '', description: '', durationDays: '9', departureCity: 'Jakarta (CGK)', startMonth: 'Januari', endMonth: 'Desember', departureYear: String(new Date().getFullYear()), sortOrder: '0', isActive: true };
}
function programTemplateFormFromItem(item: Record<string, unknown>): ProgramTemplateFormState {
  return {
    name: String(item.name ?? ''),
    code: String(item.code ?? ''),
    description: String(item.description ?? ''),
    durationDays: String(item.durationDays ?? '9'),
    departureCity: String(item.departureCity ?? ''),
    startMonth: String(item.startMonth ?? ''),
    endMonth: String(item.endMonth ?? ''),
    departureYear: String(item.departureYear ?? new Date().getFullYear()),
    sortOrder: String(item.sortOrder ?? '0'),
    isActive: toBool(item.isActive, true),
  };
}
function programTemplatePayloadFromForm(form: ProgramTemplateFormState, mode: GenericModalMode, id?: string): Record<string, unknown> {
  const payload: Record<string, unknown> = {
    name: form.name.trim(),
    description: form.description.trim() || null,
    durationDays: Number(form.durationDays || '0'),
    departureCity: form.departureCity.trim() || null,
    startMonth: form.startMonth.trim() || null,
    endMonth: form.endMonth.trim() || null,
    departureYear: Number(form.departureYear || '0'),
    sortOrder: Number(form.sortOrder || '0'),
    isActive: form.isActive,
  };
  if (mode === 'add') payload.code = form.code.trim() || null;
  if (mode === 'edit') payload.id = Number(id || 0);
  return payload;
}

function emptyPosterTypeMasterForm(): PosterTypeMasterFormState {
  return { name: '', code: '', description: '', sortOrder: '0', isActive: true };
}
function posterTypeMasterFormFromItem(item: Record<string, unknown>): PosterTypeMasterFormState {
  return {
    name: String(item.name ?? ''),
    code: String(item.code ?? ''),
    description: String(item.description ?? ''),
    sortOrder: String(item.sortOrder ?? '0'),
    isActive: toBool(item.isActive, true),
  };
}
function posterTypeMasterPayloadFromForm(form: PosterTypeMasterFormState, mode: GenericModalMode, id?: string): Record<string, unknown> {
  const payload: Record<string, unknown> = {
    name: form.name.trim(),
    description: form.description.trim() || null,
    sortOrder: Number(form.sortOrder || '0'),
    isActive: form.isActive,
  };
  if (mode === 'add') payload.code = form.code.trim() || null;
  if (mode === 'edit') payload.id = Number(id || 0);
  return payload;
}

function emptyDurationTypeForm(): DurationTypeFormState {
  return {
    name: '',
    code: '',
    description: '',
    durationSortOrder: '0',
    defaultDays: '9',
    defaultNights: '8',
    displayFormat: '{days} Hari {nights} Malam',
  };
}
function durationTypeFormFromItem(item: Record<string, unknown>): DurationTypeFormState {
  return {
    name: String(item.name ?? ''),
    code: String(item.code ?? ''),
    description: String(item.description ?? ''),
    durationSortOrder: String(item.durationSortOrder ?? item.sortOrder ?? '0'),
    defaultDays: String(item.defaultDays ?? '9'),
    defaultNights: String(item.defaultNights ?? '8'),
    displayFormat: String(item.displayFormat ?? ''),
  };
}
function durationTypePayloadFromForm(form: DurationTypeFormState, mode: GenericModalMode, id?: string): Record<string, unknown> {
  const durationSortOrder = Number(form.durationSortOrder || '0');
  const defaultDays = Number(form.defaultDays || '0');
  const defaultNights = Number(form.defaultNights || '0');
  const payload: Record<string, unknown> = {
    name: form.name.trim(),
    description: form.description.trim() || null,
    durationSortOrder: Number.isNaN(durationSortOrder) ? 0 : durationSortOrder,
    defaultDays: Number.isNaN(defaultDays) ? 0 : defaultDays,
    defaultNights: Number.isNaN(defaultNights) ? 0 : defaultNights,
    displayFormat: form.displayFormat.trim() || null,
  };
  if (mode === 'add') payload.code = form.code.trim() || null;
  if (mode === 'edit') payload.id = Number(id || 0);
  return payload;
}

export default function MasterDataPage() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const slug = pathname.split('/').filter(Boolean).at(-1) ?? '';
  const config = configs[slug];
  const { show } = useToast();

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [isActiveFilter, setIsActiveFilter] = useState<'all' | 'true' | 'false'>('all');
  const [branchCodeFilter, setBranchCodeFilter] = useState('');
  const [branchCityFilter, setBranchCityFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [sortByFilter, setSortByFilter] = useState<'recentLogin' | 'name' | 'username' | 'createdAt'>('recentLogin');
  const [sortDirectionFilter, setSortDirectionFilter] = useState<'asc' | 'desc'>('desc');

  const [list, setList] = useState<Record<string, unknown>[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [id, setId] = useState('');
  const [payload, setPayload] = useState('{\n  \n}');
  const [bulkPayload, setBulkPayload] = useState('[\n  {\n    "name": "",\n    "code": "",\n    "city": "",\n    "province": "",\n    "address": "",\n    "latitude": 0,\n    "longitude": 0,\n    "mapsUrl": ""\n  }\n]');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState('');
  const [error, setError] = useState('');
  const [bulkUserError, setBulkUserError] = useState('');
  const [userBulkPayload, setUserBulkPayload] = useState(`[
  {
    "fullName": "Jamus Ariyanti",
    "branchCode": "BDG-TMR-001",
    "branchId": 4,
    "role": "Agen",
    "username": "jamusari101",
    "password": "123456",
    "email": "jamusari101@alfiantour.com",
    "address": "Komplek Permata Biru 2 Jl. Edelweis 7E Blok P2 No.100 Cinunuk, Cileunyi",
    "whatsApp": "6285218089335"
  },
  {
    "fullName": "Harti Apriyani",
    "branchCode": "BDG-CWD-001",
    "branchId": 5,
    "role": "Agen",
    "username": "hartiapr102",
    "password": "123456",
    "email": "hartiapr102@alfiantour.com",
    "address": "Jl. Raya Rancabali RW. 11/RT. 001 No. 05 Kp. Sinapeul Desa Alam Endah Kec. Rancabali",
    "whatsApp": "6282240122702"
  },
  {
    "fullName": "Ust. Asep Maulana Yusuf",
    "branchCode": "GRT-LLS-001",
    "branchId": 6,
    "role": "Agen",
    "username": "ustasepm103",
    "password": "123456",
    "email": "ustasepm103@alfiantour.com",
    "address": "Jl. Raya Leles No. 24, Salamnunggal, Kec. Leles, Kab. Garut 44152",
    "whatsApp": "6283827595291"
  },
  {
    "fullName": "Hj. Lilis Sumarni",
    "branchCode": "CMH-001",
    "branchId": 7,
    "role": "Agen",
    "username": "hjliliss104",
    "password": "123456",
    "email": "hjliliss104@alfiantour.com",
    "address": "Kompleks Padasuka",
    "whatsApp": "6287724564997"
  },
  {
    "fullName": "H. Naswan",
    "branchCode": "CMS-001",
    "branchId": 8,
    "role": "Agen",
    "username": "hnaswan105",
    "password": "123456",
    "email": "hnaswan105@alfiantour.com",
    "address": "Jl. Ciamis",
    "whatsApp": "6281220402044"
  },
  {
    "fullName": "Hj. Lusi Sopiah",
    "branchCode": "GRT-KDG-001",
    "branchId": 9,
    "role": "Agen",
    "username": "hjlusiso106",
    "password": "123456",
    "email": "hjlusiso106@alfiantour.com",
    "address": "Jl. Kp. Ladatdaeu RT 04 RW 07 Desa Hegarsari Kec. Kadungora, Garut",
    "whatsApp": "6287724564997"
  },
  {
    "fullName": "Ari Maulinasari",
    "branchCode": "GRT-HRM-001",
    "branchId": 10,
    "role": "Agen",
    "username": "arimauli107",
    "password": "123456",
    "email": "arimauli107@alfiantour.com",
    "address": "Jl. Haruman No. 10 Kompleks III Kp. Tutugan RT.02 RW.02 Desa Haruman Kec. Leles 44152",
    "whatsApp": "6289672363453"
  },
  {
    "fullName": "Eri & Iin Fitriani",
    "branchCode": "GRT-BYG-001",
    "branchId": 11,
    "role": "Agen",
    "username": "eriiinfi108",
    "password": "123456",
    "email": "eriiinfi108@alfiantour.com",
    "address": "Jl. Raya Bayongbong Kp. Batu Datar RT. 01/02 Ds. Karyajaya",
    "whatsApp": "6289601782357"
  },
  {
    "fullName": "Yayasan Nurhanifa Mandiri",
    "branchCode": "BGR-001",
    "branchId": 12,
    "role": "Agen",
    "username": "yayasann109",
    "password": "123456",
    "email": "yayasann109@alfiantour.com",
    "address": "Jl. Gandaria Ciater, RT.001/RW.013, Rawakalong, Kec. Gn. Sindur",
    "whatsApp": "6281287363094"
  },
  {
    "fullName": "Rudin Syamsudin",
    "branchCode": "TGS-001",
    "branchId": 13,
    "role": "Agen",
    "username": "rudinsya110",
    "password": "123456",
    "email": "rudinsya110@alfiantour.com",
    "address": "Jl. Gg. SDN Muncul 3 Kp. Sengkol Kel. Muncul Kec. Setu",
    "whatsApp": "62811801015"
  },
  {
    "fullName": "Sodik",
    "branchCode": "BKS-001",
    "branchId": 14,
    "role": "Agen",
    "username": "sodik111",
    "password": "123456",
    "email": "sodik111@alfiantour.com",
    "address": "Perumahan Villa Mutiara Jaya Blok M.119 No.24",
    "whatsApp": "6285213015015"
  },
  {
    "fullName": "Asep Ahmad Saripudin",
    "branchCode": "CNJ-001",
    "branchId": 15,
    "role": "Agen",
    "username": "asepahma112",
    "password": "123456",
    "email": "asepahma112@alfiantour.com",
    "address": "Jl. Belakang Desa RT.002 RW.003 Sindanglaya Kec. Cipanas 43253",
    "whatsApp": "6287823230909"
  },
  {
    "fullName": "H. Dadang Hamzah / Hj. Felina Salma",
    "branchCode": "CNJ-CPS-001",
    "branchId": 16,
    "role": "Agen",
    "username": "hdadangh113",
    "password": "123456",
    "email": "hdadangh113@alfiantour.com",
    "address": "Jl. Cipanas Cianjur",
    "whatsApp": "6281223182408"
  },
  {
    "fullName": "Aris Sopandi",
    "branchCode": "GRT-TLG-001",
    "branchId": 17,
    "role": "Agen",
    "username": "arissopa114",
    "password": "123456",
    "email": "arissopa114@alfiantour.com",
    "address": "Jl. Kp. Pasir Awi RT.007 RW.003 Desa Sukamulya Kec. Talegong",
    "whatsApp": "6281214491085"
  },
  {
    "fullName": "Ali Nurhisyam",
    "branchCode": "CRB-001",
    "branchId": 18,
    "role": "Agen",
    "username": "alinurhi115",
    "password": "123456",
    "email": "alinurhi115@alfiantour.com",
    "address": "Jl. Kedungkrisik Utara RT.02 RW.05 Argasunya",
    "whatsApp": "6281324300656"
  },
  {
    "fullName": "Ust. H. Jaliludin",
    "branchCode": "BDG-RCS-001",
    "branchId": 19,
    "role": "Agen",
    "username": "usthjali116",
    "password": "123456",
    "email": "usthjali116@alfiantour.com",
    "address": "Ciptakarya II No.31 RT.01 RW.04 Kel. Mekarjaya Kec. Rancasari",
    "whatsApp": "6282115727300"
  },
  {
    "fullName": "Mansur Sopian",
    "branchCode": "BDG-SLJ-001",
    "branchId": 20,
    "role": "Agen",
    "username": "mansurso117",
    "password": "123456",
    "email": "mansurso117@alfiantour.com",
    "address": "Perum The City Sukaraja II Blk. C No. 32 RT 05 RW 10 Desa Solokanjeruk",
    "whatsApp": "62895334566369"
  },
  {
    "fullName": "H. Aditya",
    "branchCode": "KLM-001",
    "branchId": 21,
    "role": "Agen",
    "username": "haditya118",
    "password": "123456",
    "email": "haditya118@alfiantour.com",
    "address": "",
    "whatsApp": "6282157630336"
  },
  {
    "fullName": "Bu Naisah",
    "branchCode": "CKR-001",
    "branchId": 22,
    "role": "Agen",
    "username": "bunaisah119",
    "password": "123456",
    "email": "bunaisah119@alfiantour.com",
    "address": "Grand Cikarang City 2 (GCC2) Blok J9 No.12, Kedung Waringin",
    "whatsApp": "6287804516332"
  },
  {
    "fullName": "Jefri",
    "branchCode": "JKT-TMR-001",
    "branchId": 23,
    "role": "Agen",
    "username": "jefri120",
    "password": "123456",
    "email": "jefri120@alfiantour.com",
    "address": "Jl. Kp. Gempol No.89, RT.7/RW.1, Cakung Timur",
    "whatsApp": "6285798825354"
  },
  {
    "fullName": "Hj. Liya Amalia",
    "branchCode": "LBK-001",
    "branchId": 24,
    "role": "Agen",
    "username": "hjliyaam121",
    "password": "123456",
    "email": "hjliyaam121@alfiantour.com",
    "address": "BTN Griya Kaduagung Lestari Blok C10, Cibadak",
    "whatsApp": "6200000000000"
  },
  {
    "fullName": "Ponpes Rifaiyah Kyai Zainal Abidin",
    "branchCode": "PML-001",
    "branchId": 25,
    "role": "Agen",
    "username": "ponpesri122",
    "password": "123456",
    "email": "ponpesri122@alfiantour.com",
    "address": "Jl. Raya Mangli No.95, Randudongkal",
    "whatsApp": "6285326648471"
  },
  {
    "fullName": "Mas Kresno & Mba Meera",
    "branchCode": "SMG-001",
    "branchId": 26,
    "role": "Agen",
    "username": "maskresn123",
    "password": "123456",
    "email": "maskresn123@alfiantour.com",
    "address": "Jl. (lihat detail PDF)",
    "whatsApp": "6282325344694"
  },
  {
    "fullName": "Toko SRC Mba Jun",
    "branchCode": "PML-RDK-001",
    "branchId": 27,
    "role": "Agen",
    "username": "tokosrcm124",
    "password": "123456",
    "email": "tokosrcm124@alfiantour.com",
    "address": "Jl. Suwaryo Desa Semingkir RT.03 RW.04 No.69 Blok 4",
    "whatsApp": "6281904882506"
  },
  {
    "fullName": "Fajariyah Eka Agustina",
    "branchCode": "BKL-001",
    "branchId": 28,
    "role": "Agen",
    "username": "fajariya125",
    "password": "123456",
    "email": "fajariya125@alfiantour.com",
    "address": "Jl. Nangka 5 No.10 Perumnas Kamal, Banyu Ajuh",
    "whatsApp": "6283834477740"
  },
  {
    "fullName": "Yosi Mega",
    "branchCode": "PDG-001",
    "branchId": 29,
    "role": "Agen",
    "username": "yosimega126",
    "password": "123456",
    "email": "yosimega126@alfiantour.com",
    "address": "Jl. Bhakti Gg. Setia No. 4 RT.004 RW.001 Kel. Dadok Tunggul Hitam",
    "whatsApp": "6285705228207"
  },
  {
    "fullName": "Sita Rohman",
    "branchCode": "SMR-001",
    "branchId": 30,
    "role": "Agen",
    "username": "sitarohm127",
    "password": "123456",
    "email": "sitarohm127@alfiantour.com",
    "address": "Jl. P Suryanata Komplek Sekumpul blok 6, Kec. Samarinda Ulu",
    "whatsApp": "6285822468086"
  },
  {
    "fullName": "H. Irfan",
    "branchCode": "LBJ-001",
    "branchId": 31,
    "role": "Agen",
    "username": "hirfan128",
    "password": "123456",
    "email": "hirfan128@alfiantour.com",
    "address": "Jl (lihat detail PDF)",
    "whatsApp": "6281236473812"
  }
]`);
  const [showBranchModal, setShowBranchModal] = useState(false);
  const [branchModalMode, setBranchModalMode] = useState<'add' | 'edit' | 'delete'>('edit');
  const [branchForm, setBranchForm] = useState<BranchFormState>(emptyBranchForm());
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [roleModalMode, setRoleModalMode] = useState<'add' | 'edit' | 'delete'>('edit');
  const [roleForm, setRoleForm] = useState<RoleFormState>(emptyRoleForm());
  const [showJsonModal, setShowJsonModal] = useState(false);
  const [jsonModalId, setJsonModalId] = useState('');
  const [jsonModalPayload, setJsonModalPayload] = useState('{\n  \n}');
  const [showUserModal, setShowUserModal] = useState(false);
  const [userModalMode, setUserModalMode] = useState<'add' | 'edit' | 'delete'>('add');
  const [userForm, setUserForm] = useState<UserFormState>(emptyUserForm());
  const [userFieldErrors, setUserFieldErrors] = useState<UserFieldErrors>({});
  const [userShowPassword, setUserShowPassword] = useState(false);
  const [userListTab, setUserListTab] = useState<'all' | 'whatsapp'>('all');
  const [showUserAdvancedFilters, setShowUserAdvancedFilters] = useState(false);
  const [waTouchedIds, setWaTouchedIds] = useState<string[]>([]);
  const [roleOptions, setRoleOptions] = useState<Array<{ id: string; name: string }>>([]);
  const [branchOptions, setBranchOptions] = useState<Array<{ id: string; name: string; code: string }>>([]);
  const [loadingRoles, setLoadingRoles] = useState(false);
  const [loadingBranches, setLoadingBranches] = useState(false);
  const [highlightedId, setHighlightedId] = useState('');
  const [crudExpanded, setCrudExpanded] = useState(false);
  const [bulkBranchExpanded, setBulkBranchExpanded] = useState(false);
  const [bulkUserExpanded, setBulkUserExpanded] = useState(false);
  const [bulkGenericExpanded, setBulkGenericExpanded] = useState(false);
  const [bulkGenericPayload, setBulkGenericPayload] = useState('[\n  {\n    "name": "",\n    "code": "",\n    "description": ""\n  }\n]');
  const [bulkGenericError, setBulkGenericError] = useState('');
  const [mounted, setMounted] = useState(false);
  const [showGenericModal, setShowGenericModal] = useState(false);
  const [genericModalMode, setGenericModalMode] = useState<GenericModalMode>('add');
  const [genericForm, setGenericForm] = useState(buildGenericAddForm());
  const [hotelForm, setHotelForm] = useState<HotelFormState>(emptyHotelForm());
  const [companyProfileForm, setCompanyProfileForm] = useState<CompanyProfileFormState>(emptyCompanyProfileForm());
  const [insuranceTypeForm, setInsuranceTypeForm] = useState<InsuranceTypeFormState>(emptyInsuranceTypeForm());
  const [packageLabelTagForm, setPackageLabelTagForm] = useState<PackageLabelTagFormState>(emptyPackageLabelTagForm());
  const [roomTypeForm, setRoomTypeForm] = useState<RoomTypeFormState>(emptyRoomTypeForm());
  const [facilityMasterForm, setFacilityMasterForm] = useState<FacilityMasterFormState>(emptyFacilityMasterForm());
  const [mediaAssetForm, setMediaAssetForm] = useState<MediaAssetFormState>(emptyMediaAssetForm());
  const [programTemplateForm, setProgramTemplateForm] = useState<ProgramTemplateFormState>(emptyProgramTemplateForm());
  const [posterTypeMasterForm, setPosterTypeMasterForm] = useState<PosterTypeMasterFormState>(emptyPosterTypeMasterForm());
  const [durationTypeForm, setDurationTypeForm] = useState<DurationTypeFormState>(emptyDurationTypeForm());
  const [showHeroModal, setShowHeroModal] = useState(false);
  const [heroModalMode, setHeroModalMode] = useState<GenericModalMode>('add');
  const [heroForm, setHeroForm] = useState<HeroFormState>(emptyHeroForm());
  const [heroUploadBusy, setHeroUploadBusy] = useState(false);
  const [heroUploadProgress, setHeroUploadProgress] = useState(0);
  const [heroError, setHeroError] = useState('');
  const section = searchParams.get('section');

  if (!config) {
    return <div className="p-4 text-sm">Halaman tidak ditemukan.</div>;
  }

  const isSpecialSlug = slug === 'branch' || slug === 'roles' || slug === 'user-management';
  const isProtectedUsername = (value: unknown) => String(value ?? '').trim().toLowerCase() === 'superadmin';
  const normalizeWhatsApp = (value: unknown) => String(value ?? '').replace(/\D+/g, '');
  const buildAgentInfoMessage = (username: string) => {
    const safeUsername = String(username || '-').trim() || '-';
    return [
      'Assalamu’alaikum warahmatullahi wabarakatuh.',
      '',
      'Kami ingin menginformasikan bahwa alfiantour.com kini sudah tersedia fitur link referensi/affiliate agensi yang aktif selama 15 hari.',
      '',
      'Silakan login untuk melihat dan menggunakan fitur tersebut:',
      'Login: https://alfiantour.com/login',
      `Username: ${safeUsername}`,
      'Password: 123456',
      '',
      'Mohon segera login dan disarankan langsung mengganti password demi keamanan akun.',
      '',
      'Terima kasih atas perhatian dan kerja samanya.',
      'Wassalamu’alaikum warahmatullahi wabarakatuh.',
    ].join('\n');
  };

  const deleteUserByIdWithGuard = async (targetId: string) => {
    const detailRaw = await apiGet(`/api/UserManagement/${targetId}`);
    const detail = (detailRaw as { data?: Record<string, unknown> })?.data ?? (detailRaw as Record<string, unknown>);
    const username = String((detail as Record<string, unknown>)?.userName ?? (detail as Record<string, unknown>)?.username ?? '').trim();
    if (isProtectedUsername(username)) {
      throw new Error('User "superadmin" tidak boleh dihapus.');
    }
    return apiDelete(`/api/UserManagement/${targetId}`);
  };

  const run = async (fn: () => Promise<unknown>, shouldRefreshList = false, successMessage?: string) => {
    setBusy(true);
    setError('');
    try {
      const res = await fn();
      setResult(toPrettyJson(res));
      if (successMessage) show(successMessage);
      if (shouldRefreshList) {
        await fetchList(page);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Request gagal');
    } finally {
      setBusy(false);
    }
  };

  const parsePayload = (): Record<string, unknown> => {
    try {
      return JSON.parse(payload) as Record<string, unknown>;
    } catch {
      throw new Error('Payload JSON tidak valid');
    }
  };

  const parseBulkPayload = (): Record<string, unknown>[] => {
    let parsed: unknown;
    try {
      parsed = JSON.parse(bulkPayload);
    } catch {
      throw new Error('Bulk JSON tidak valid');
    }
    if (!Array.isArray(parsed)) throw new Error('Bulk JSON harus array');
    const rows = parsed as Record<string, unknown>[];
    const invalid = rows.findIndex((x) => !x?.name || String(x.name).trim().length === 0);
    if (invalid >= 0) throw new Error(`Item ke-${invalid + 1} tidak punya field name`);
    return rows;
  };

  const fetchList = async (nextPage = page) => {
    const params = new URLSearchParams();
    params.set(slug === 'branch' || slug === 'user-management' ? 'pageNumber' : 'page', String(nextPage));
    params.set('pageSize', String(pageSize));
    if (searchTerm.trim()) params.set('searchTerm', searchTerm.trim());
    if (isActiveFilter !== 'all') params.set('isActive', isActiveFilter);
    if (slug === 'user-management') {
      if (branchCodeFilter.trim()) params.set('branchCode', branchCodeFilter.trim());
      if (branchCityFilter.trim()) params.set('city', branchCityFilter.trim());
      if (roleFilter.trim()) params.set('role', roleFilter.trim());
      params.set('sortBy', sortByFilter);
      params.set('sortDirection', sortDirectionFilter);
    }

    const endpoint = slug === 'user-management'
      ? '/api/UserManagement/public-users'
      : config.endpoint;

    const res = await apiGet<unknown>(`${endpoint}?${params.toString()}`);
    const parsed = parseListShape(res, nextPage, pageSize);
    setList(parsed.items);
    setPage(parsed.page);
    setTotalCount(parsed.totalCount);
    setTotalPages(parsed.totalPages);
    setResult(toPrettyJson(res));
  };

  useEffect(() => {
    if (!config) return;
    run(() => fetchList(1));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  useEffect(() => {
    if (isSpecialSlug) return;
    setBulkGenericPayload(defaultBulkTemplateBySlug(slug));
    setBulkGenericError('');
  }, [isSpecialSlug, slug]);

  useEffect(() => {
    if (slug !== 'user-management' || section !== 'bulk-user') return;
    const el = document.getElementById('bulk-user-section');
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [slug, section]);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  useEffect(() => {
    if (slug !== 'user-management') return;
    try {
      const raw = localStorage.getItem(USER_WA_TOUCHED_STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) setWaTouchedIds(parsed.map(String));
    } catch { }
  }, [slug]);

  useEffect(() => {
    if (slug !== 'user-management') return;
    try {
      localStorage.setItem(USER_WA_TOUCHED_STORAGE_KEY, JSON.stringify(waTouchedIds));
    } catch { }
  }, [slug, waTouchedIds]);

  useEffect(() => {
    if (!highlightedId) return;
    const timer = setTimeout(() => setHighlightedId(''), 2200);
    return () => clearTimeout(timer);
  }, [highlightedId]);

  const executeBulkBranch = async () => {
    if (slug !== 'branch') return;
    setBusy(true);
    setError('');
    try {
      const rows = parseBulkPayload();
      const success: Array<{ index: number; name: string }> = [];
      const failed: Array<{ index: number; name: string; error: string }> = [];

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        try {
          await apiPost(config.endpoint, row);
          success.push({ index: i + 1, name: String(row.name ?? '-') });
        } catch (err) {
          failed.push({ index: i + 1, name: String(row.name ?? '-'), error: err instanceof Error ? err.message : 'Gagal create' });
        }
      }

      setResult(toPrettyJson({
        message: 'Bulk branch execute selesai',
        total: rows.length,
        successCount: success.length,
        failedCount: failed.length,
        success,
        failed,
      }));
      await fetchList(1);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Bulk execute gagal');
    } finally {
      setBusy(false);
    }
  };

  const parseUserBulkPayload = (): Array<{ email: string; fullName: string; branchId?: number; role?: string; username?: string; password?: string; branchCode?: string; address?: string; whatsApp?: string }> => {
    let parsed: unknown;
    try {
      parsed = JSON.parse(userBulkPayload);
    } catch {
      throw new Error('Bulk user JSON tidak valid');
    }

    if (!Array.isArray(parsed)) throw new Error('Bulk user JSON harus array');
    const rows = parsed as Array<{ email?: string; fullName?: string; branchId?: number; role?: string; username?: string; password?: string; branchCode?: string; address?: string; whatsApp?: string }>;
    const invalid = rows.findIndex((x) => !x?.email || String(x.email).trim().length === 0);
    if (invalid >= 0) throw new Error(`Item ke-${invalid + 1} tidak punya field email`);
    const invalidName = rows.findIndex((x) => !x?.fullName || String(x.fullName).trim().length === 0);
    if (invalidName >= 0) throw new Error(`Item ke-${invalidName + 1} tidak punya field fullName`);
    return rows.map((x, i) => {
      const username = x.username ? String(x.username).trim() : undefined;
      const password = x.password ? String(x.password).trim() : undefined;
      const email = String(x.email).trim();
      const whatsApp = x.whatsApp ? String(x.whatsApp).trim() : undefined;
      if (username && !USERNAME_REGEX.test(username)) {
        throw new Error(`Username item ke-${i + 1} hanya boleh huruf/angka tanpa spasi`);
      }
      if (password && (!SIMPLE_PASSWORD_REGEX.test(password) || password.length < 6)) {
        throw new Error(`Password item ke-${i + 1} hanya huruf/angka tanpa spasi, minimal 6 karakter`);
      }
      if (!SIMPLE_EMAIL_REGEX.test(email)) {
        throw new Error(`Email item ke-${i + 1} tidak valid / ada spasi`);
      }
      if (whatsApp && !WHATSAPP_REGEX.test(whatsApp)) {
        throw new Error(`WhatsApp item ke-${i + 1} harus 10-15 digit angka`);
      }
      return {
        email,
        fullName: String(x.fullName).trim(),
        branchId: x.branchId,
        role: x.role || 'Agen',
        username,
        password,
        branchCode: x.branchCode,
        address: x.address,
        whatsApp,
      };
    });
  };

  const executeBulkUsers = async () => {
    if (slug !== 'user-management') return;
    setBusy(true);
    setBulkUserError('');
    try {
      const rows = parseUserBulkPayload();
      const res = await apiPost('/api/Account/admin-upsert-bulk-kepala-cabang', rows.map((r) => ({
        fullName: r.fullName,
        branchCode: r.branchCode,
        branchId: r.branchId,
        role: r.role || 'Agen',
        userName: r.username,
        password: r.password || '123456',
        email: r.email,
        address: r.address,
        whatsApp: r.whatsApp,
      })));

      setResult(toPrettyJson(res));
      show('Bulk user selesai diproses');
      await fetchList(1);
    } catch (err) {
      setBulkUserError(err instanceof Error ? err.message : 'Bulk execute user gagal');
    } finally {
      setBusy(false);
    }
  };

  const executeBulkGeneric = async () => {
    if (isSpecialSlug) return;
    setBusy(true);
    setBulkGenericError('');
    try {
      let parsed: unknown;
      try {
        parsed = JSON.parse(bulkGenericPayload);
      } catch {
        throw new Error('Bulk JSON tidak valid');
      }
      if (!Array.isArray(parsed)) throw new Error('Bulk JSON harus array');
      const rows = normalizeBulkRowsBySlug(slug, parsed as Record<string, unknown>[]);
      if (rows.length === 0) throw new Error('Bulk JSON tidak boleh kosong');
      if (rows.some((x) => !String(x.name ?? '').trim())) throw new Error('Semua item bulk wajib memiliki field name');
      const res = await apiPost<Record<string, unknown>>(`${config.endpoint}/bulk`, rows);
      setResult(toPrettyJson(res));
      show(`Bulk ${config.label} selesai diproses`);
      await fetchList(1);
    } catch (err) {
      setBulkGenericError(err instanceof Error ? err.message : 'Bulk execute gagal');
    } finally {
      setBusy(false);
    }
  };

  const openJsonModal = (rowId: string, item: Record<string, unknown>) => {
    setId(rowId);
    setPayload(toPrettyJson(item));
    setJsonModalId(rowId);
    setJsonModalPayload(toPrettyJson(item));
    setShowJsonModal(true);
  };

  const ensureRoleOptions = async () => {
    if (roleOptions.length > 0 || loadingRoles) return;
    setLoadingRoles(true);
    try {
      const res = await apiGet<unknown>('/api/Roles?page=1&pageSize=200');
      const parsed = parseListShape(res, 1, 200);
      setRoleOptions(parsed.items.map((x, i) => ({
        id: String(x.id ?? x.Id ?? i),
        name: String(x.name ?? x.roleName ?? x.code ?? '-'),
      })));
    } finally {
      setLoadingRoles(false);
    }
  };

  const ensureBranchOptions = async () => {
    if (branchOptions.length > 0 || loadingBranches) return;
    setLoadingBranches(true);
    try {
      const res = await apiGet<unknown>('/api/Branch?pageNumber=1&pageSize=500');
      const parsed = parseListShape(res, 1, 500);
      setBranchOptions(parsed.items.map((x, i) => ({
        id: String(x.id ?? x.Id ?? i),
        name: String(x.name ?? '-'),
        code: String(x.code ?? '-'),
      })));
    } finally {
      setLoadingBranches(false);
    }
  };

  const loadUserDetails = async (userId: string) => {
    const detail = await apiGet<Record<string, unknown>>(`/api/UserManagement/${userId}`);
    const d = (detail as unknown as { data?: Record<string, unknown> }).data ?? {};
    setUserForm((prev) => ({
      ...prev,
      id: String(d.id ?? d.Id ?? prev.id),
      fullName: String(d.fullName ?? d.FullName ?? prev.fullName),
      userName: String(d.userName ?? d.UserName ?? prev.userName),
      email: String(d.email ?? d.Email ?? prev.email),
      phone: String(d.whatsApp ?? d.WhatsApp ?? prev.phone),
    }));
  };

  const validateUserFormInline = (mode: 'add' | 'edit'): boolean => {
    const errors: UserFieldErrors = {};
    const email = userForm.email.trim();
    const username = userForm.userName.trim();
    const phone = userForm.phone.trim();
    const password = userForm.password.trim();

    if (!userForm.fullName.trim()) errors.fullName = 'Nama lengkap wajib diisi';
    if (!email || !SIMPLE_EMAIL_REGEX.test(email)) errors.email = 'Email tidak valid / ada spasi';
    if (!username) errors.userName = 'Username wajib diisi';
    else if (!USERNAME_REGEX.test(username)) errors.userName = 'Username hanya huruf/angka tanpa spasi';
    if (!phone) errors.phone = 'WhatsApp wajib diisi';
    else if (!WHATSAPP_REGEX.test(phone)) errors.phone = 'WhatsApp harus 10-15 digit angka';
    if (!userForm.role.trim()) errors.role = 'Role wajib dipilih';
    if (mode === 'add') {
      if (!password) errors.password = 'Password wajib diisi';
      else if (!SIMPLE_PASSWORD_REGEX.test(password)) errors.password = 'Password hanya huruf/angka tanpa spasi';
      else if (password.length < 6) errors.password = 'Password minimal 6 karakter';
    }
    setUserFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const uploadHeroImage = async (file: File) => {
    setHeroError('');
    let checkImage: { width: number; height: number };
    try {
      checkImage = await new Promise<{ width: number; height: number }>((resolve, reject) => {
        const url = URL.createObjectURL(file);
        const img = new Image();
        img.onload = () => {
          resolve({ width: img.naturalWidth, height: img.naturalHeight });
          URL.revokeObjectURL(url);
        };
        img.onerror = () => {
          reject(new Error('File gambar tidak valid'));
          URL.revokeObjectURL(url);
        };
        img.src = url;
      });
    } catch (err) {
      setHeroError(err instanceof Error ? err.message : 'Validasi gambar gagal');
      return;
    }

    const ratio = checkImage.width / checkImage.height;
    if (checkImage.width < HERO_MIN_WIDTH || checkImage.height < HERO_MIN_HEIGHT) {
      setHeroError(`Resolusi minimal hero ${HERO_MIN_WIDTH}x${HERO_MIN_HEIGHT}px`);
      return;
    }
    if (checkImage.height > HERO_MAX_HEIGHT) {
      setHeroError(`Tinggi maksimal hero ${HERO_MAX_HEIGHT}px`);
      return;
    }
    if (ratio < HERO_MIN_RATIO) {
      setHeroError('Hero harus landscape (lebih lebar dari tinggi)');
      return;
    }

    setHeroUploadBusy(true);
    setHeroUploadProgress(0);
    try {
      const form = new FormData();
      form.append('file', file);
      const token = getAuthToken();
      const uploadResponse = await new Promise<{ fileUrl?: string }>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', `${getApiBaseUrl()}/api/v1/content/hero-banners/upload`);
        if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);
        xhr.upload.onprogress = (event) => {
          if (!event.lengthComputable) return;
          setHeroUploadProgress(Math.min(100, Math.round((event.loaded / event.total) * 100)));
        };
        xhr.onerror = () => reject(new Error('Upload hero gagal'));
        xhr.onload = () => {
          if (xhr.status < 200 || xhr.status >= 300) {
            reject(new Error(`Upload gagal (${xhr.status})`));
            return;
          }
          try {
            resolve(JSON.parse(xhr.responseText) as { fileUrl?: string });
          } catch {
            reject(new Error('Response upload tidak valid'));
          }
        };
        xhr.send(form);
      });
      if (!uploadResponse.fileUrl) throw new Error('Response upload tidak valid');
      const fullImageUrl = toApiAssetUrl(String(uploadResponse.fileUrl));
      setHeroForm((p) => ({ ...p, imageUrl: fullImageUrl }));
      setHeroUploadProgress(100);
      show('Upload hero berhasil');
    } catch (err) {
      setHeroError(err instanceof Error ? err.message : 'Upload hero gagal');
      setHeroUploadProgress(0);
    } finally {
      setHeroUploadBusy(false);
    }
  };

  return (
    <div className="p-4 space-y-4 animate-fade-up">
      <div className="bg-white border rounded-3xl p-5 space-y-2">
        <div className="flex items-center justify-between text-xs">
          <Link href="/akun/master" className="text-blue-600 underline underline-offset-2">← Master Data</Link>
          <div className="flex items-center gap-3">
            {slug === 'media-assets' ? <Link href="/akun/kelola-media-assets" className="text-blue-600 underline underline-offset-2">Media Center ↗</Link> : null}
            <Link href="/akun" className="text-blue-600 underline underline-offset-2">Akun →</Link>
          </div>
        </div>
        <h1 className="text-lg font-extrabold g-text">{config.label}</h1>
        <p className="text-xs text-zinc-500">
          {slug === 'facility-masters'
            ? 'Kelola master fasilitas layanan jamaah (umrah/haji), termasuk kebutuhan ramah lansia seperti pendampingan, aksesibilitas, kesehatan, dan layanan tambahan berbayar.'
            : slug === 'requirement-masters'
              ? 'Kelola daftar persyaratan dokumen dan ketentuan jamaah umrah/haji (wajib, opsional, atau kondisional) agar tim operasional dan owner mudah memastikan kelengkapan sebelum keberangkatan.'
              : slug === 'duration-types'
                ? 'Kelola standar durasi program umrah/haji (jumlah hari & malam) sebagai acuan cepat saat membuat paket, sehingga format penawaran konsisten di semua produk.'
                : slug === 'departure-seasons'
                  ? 'Kelola musim keberangkatan untuk memetakan periode ramai/sepi umrah-haji, termasuk pengali harga musiman agar strategi promo dan margin lebih terkontrol.'
                  : slug === 'currency-masters'
                    ? 'Kelola referensi mata uang dan kurs acuan untuk kalkulasi biaya vendor, simulasi margin, serta konversi harga paket umrah/haji secara konsisten.'
                    : slug === 'media-assets'
                      ? 'Kelola bank media terpusat (gambar, video, dokumen) untuk dipakai ulang di gallery, feeds, hero banner, dan konten promosi tanpa upload berulang.'
                      : slug === 'package-class-masters'
                        ? 'Kelola master kelas paket umrah/haji (Economy sampai VIP, termasuk kelas lansia/keluarga) sebagai acuan standar penawaran harga dan fasilitas.'
                        : slug === 'design-theme-masters'
                          ? 'Kelola master tema desain visual untuk poster/konten promosi umrah-haji agar identitas brand konsisten, mudah dibedakan per campaign, dan siap dipakai tim konten.'
                          : slug === 'hero-banners'
                            ? 'Kelola banner utama halaman publik (hero section) untuk campaign umrah/haji, termasuk urutan tampil, masa aktif, dan CTA agar promosi lebih terarah.'
                      : slug === 'poster-type-masters'
                        ? 'Kelola jenis template poster untuk kebutuhan marketing umrah/haji (promo, edukasi, testimoni, dan informasi dokumen) agar tim konten konsisten.'
                        : slug === 'program-templates'
                          ? 'Kelola template program paket umrah/haji sebagai kerangka cepat saat membuat produk baru (durasi, kota berangkat, periode bulan, dan tahun).'
              : 'Kelola data dengan form lengkap dan aksi cepat.'}
        </p>
      </div>

      <div className="bg-white border rounded-3xl p-5 space-y-3">
        <div className="grid grid-cols-[1fr_auto_auto] gap-2 items-center">
          <input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Search term" className="w-full border rounded-2xl px-4 py-2 text-xs" />
          <button disabled={busy} onClick={() => run(() => fetchList(1))} className="h-9 min-w-12 border rounded-2xl px-3 text-xs font-semibold">OK</button>
          {slug !== 'user-management' ? (
            <>
              <select value={isActiveFilter} onChange={(e) => setIsActiveFilter(e.target.value as 'all' | 'true' | 'false')} className="w-full border rounded-2xl px-4 py-2 text-xs bg-white">
                <option value="all">Status: Semua</option>
                <option value="true">Status: Aktif</option>
                <option value="false">Status: Tidak Aktif</option>
              </select>
              <input type="number" min={1} value={pageSize} onChange={(e) => setPageSize(Math.max(1, Number(e.target.value) || 10))} placeholder="Page size" className="w-full border rounded-2xl px-4 py-2 text-xs" />
            </>
          ) : (
            <button
              type="button"
              onClick={() => setShowUserAdvancedFilters((p) => !p)}
              className="h-9 w-9 shrink-0 inline-flex items-center justify-center border rounded-2xl text-sm font-semibold"
              title={showUserAdvancedFilters ? 'Hide Filter Lainnya' : 'Show Filter Lainnya'}
            >
              {showUserAdvancedFilters ? '▴' : '▾'}
            </button>
          )}
        </div>
        {slug === 'user-management' && showUserAdvancedFilters ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <select value={isActiveFilter} onChange={(e) => setIsActiveFilter(e.target.value as 'all' | 'true' | 'false')} className="w-full border rounded-2xl px-4 py-2 text-xs bg-white">
              <option value="all">Status: Semua</option>
              <option value="true">Status: Aktif</option>
              <option value="false">Status: Tidak Aktif</option>
            </select>
            <input type="number" min={1} value={pageSize} onChange={(e) => setPageSize(Math.max(1, Number(e.target.value) || 10))} placeholder="Page size" className="w-full border rounded-2xl px-4 py-2 text-xs" />
            <input value={branchCodeFilter} onChange={(e) => setBranchCodeFilter(e.target.value)} placeholder="Branch code" className="w-full border rounded-2xl px-4 py-2 text-xs" />
            <input value={branchCityFilter} onChange={(e) => setBranchCityFilter(e.target.value)} placeholder="Kota branch" className="w-full border rounded-2xl px-4 py-2 text-xs" />
            <input value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} placeholder="Role (contoh: Agen)" className="w-full border rounded-2xl px-4 py-2 text-xs" />
            <select value={sortByFilter} onChange={(e) => setSortByFilter(e.target.value as 'recentLogin' | 'name' | 'username' | 'createdAt')} className="w-full border rounded-2xl px-4 py-2 text-xs bg-white">
              <option value="recentLogin">Sort: Recent Login</option>
              <option value="name">Sort: Nama</option>
              <option value="username">Sort: Username</option>
              <option value="createdAt">Sort: Tanggal Buat</option>
            </select>
            <select value={sortDirectionFilter} onChange={(e) => setSortDirectionFilter(e.target.value as 'asc' | 'desc')} className="w-full border rounded-2xl px-4 py-2 text-xs bg-white sm:col-span-2">
              <option value="desc">Arah: Desc</option>
              <option value="asc">Arah: Asc</option>
            </select>
          </div>
        ) : null}
      </div>

      <div className="bg-white border rounded-3xl p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold">Data List</h2>
          <div className="flex items-center gap-2">
            {slug === 'branch' ? (
              <button
                onClick={() => {
                  setId('');
                  setBranchForm(emptyBranchForm());
                  setBranchModalMode('add');
                  setShowBranchModal(true);
                }}
                className="rounded-xl bg-blue-600 px-3 py-1.5 text-[11px] font-semibold text-white"
              >
                Add
              </button>
            ) : null}
            {slug === 'roles' ? (
              <button
                onClick={() => {
                  setId('');
                  setRoleForm(emptyRoleForm());
                  setRoleModalMode('add');
                  setShowRoleModal(true);
                }}
                className="rounded-xl bg-blue-600 px-3 py-1.5 text-[11px] font-semibold text-white"
              >
                Add
              </button>
            ) : null}
            {slug === 'user-management' ? (
              null
            ) : null}
            {!isSpecialSlug ? (
              <button
                onClick={() => {
                  setId('');
                  if (slug === 'hero-banners') {
                    setHeroModalMode('add');
                    setHeroForm(emptyHeroForm());
                    setHeroError('');
                    setShowHeroModal(true);
                  } else {
                    setGenericModalMode('add');
                    setGenericForm(buildGenericAddForm());
                    if (slug === 'hotels') setHotelForm(emptyHotelForm());
                    if (slug === 'company-profiles') setCompanyProfileForm(emptyCompanyProfileForm());
                    if (slug === 'insurance-types') setInsuranceTypeForm(emptyInsuranceTypeForm());
                    if (slug === 'package-label-tags') setPackageLabelTagForm(emptyPackageLabelTagForm());
                    if (slug === 'room-type-masters') setRoomTypeForm(emptyRoomTypeForm());
                    if (slug === 'facility-masters') setFacilityMasterForm(emptyFacilityMasterForm());
                    if (slug === 'media-assets') setMediaAssetForm(emptyMediaAssetForm());
                    if (slug === 'program-templates') setProgramTemplateForm(emptyProgramTemplateForm());
                    if (slug === 'poster-type-masters') setPosterTypeMasterForm(emptyPosterTypeMasterForm());
                    if (slug === 'duration-types') setDurationTypeForm(emptyDurationTypeForm());
                    setShowGenericModal(true);
                  }
                }}
                className="rounded-xl bg-blue-600 px-3 py-1.5 text-[11px] font-semibold text-white"
              >
                Add
              </button>
            ) : null}
            <div className="text-[11px] text-zinc-500">Total: {totalCount} | Hal: {page}/{totalPages}</div>
          </div>
        </div>
        {slug === 'user-management' ? (
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={async () => {
                  setUserModalMode('add');
                  setUserForm(emptyUserForm());
                  setUserShowPassword(false);
                  setUserFieldErrors({});
                  setShowUserModal(true);
                  await Promise.all([ensureRoleOptions(), ensureBranchOptions()]);
                }}
                className="h-8 rounded-xl bg-blue-600 px-3 text-[11px] font-semibold text-white"
              >
                Add
              </button>
            </div>
            <div className="flex items-center gap-2 overflow-x-auto pb-0.5">
            <button
              type="button"
              onClick={() => setUserListTab('all')}
              className={`h-8 whitespace-nowrap rounded-xl px-3 text-[11px] font-semibold ${userListTab === 'all' ? 'bg-blue-600 text-white' : 'border text-zinc-600'}`}
            >
              List User
            </button>
            <button
              type="button"
              onClick={() => setUserListTab('whatsapp')}
              className={`h-8 whitespace-nowrap rounded-xl px-3 text-[11px] font-semibold ${userListTab === 'whatsapp' ? 'bg-emerald-600 text-white' : 'border text-zinc-600'}`}
            >
              List WA Broadcast
            </button>
            </div>
          </div>
        ) : null}

        {slug === 'user-management' ? (
          userListTab === 'whatsapp' ? (
            <div className="space-y-2">
              {list.length === 0 ? (
                <div className="border rounded-2xl p-3 text-xs text-zinc-500">Belum ada data.</div>
              ) : list.map((item, idx) => {
                const rowId = resolveItemId(item);
                const fullName = String(item.fullName ?? '-');
                const userName = String(item.userName ?? item.username ?? '-');
                const branchCode = String(item.branchCode ?? '-');
                const city = String(item.city ?? '-');
                const waRaw = item.whatsApp ?? item.WhatsApp ?? item.phone ?? item.Phone ?? '';
                const waNumber = normalizeWhatsApp(waRaw);
                const hasWa = waNumber.length >= 10;
                const waHref = hasWa ? `https://wa.me/${waNumber}?text=${encodeURIComponent(buildAgentInfoMessage(userName))}` : '#';
                return (
                  <div key={`${rowId}-${idx}`} className="border rounded-2xl p-3 bg-white">
                    <div className="text-sm font-semibold text-zinc-900">{fullName}</div>
                    <div className="text-[11px] text-zinc-500">@{userName}</div>
                    <div className="mt-2 space-y-1 text-[11px] text-zinc-600">
                      <div>Branch: {branchCode} | Kota: {city}</div>
                      <div>WhatsApp: {hasWa ? waNumber : 'Belum tersedia / tidak valid'}</div>
                    </div>
                    <div className="mt-2">
                      <a
                        href={waHref}
                        target="_blank"
                        rel="noreferrer"
                        className={`inline-flex items-center rounded-xl px-3 py-1.5 text-[11px] font-semibold ${hasWa ? 'bg-emerald-600 text-white' : 'bg-zinc-100 text-zinc-400 pointer-events-none'}`}
                        title={hasWa ? 'Kirim info fitur affiliate via WhatsApp' : 'Nomor WhatsApp belum valid'}
                      >
                        WhatsApp
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
          <div className="space-y-2">
            {list.length === 0 ? (
              <div className="border rounded-2xl p-3 text-xs text-zinc-500">Belum ada data.</div>
            ) : list.map((item, idx) => {
              const rowId = resolveItemId(item);
              const fullName = String(item.fullName ?? '-');
              const userName = String(item.userName ?? '-');
              const isProtectedUser = isProtectedUsername(userName);
              const email = String(item.email ?? '-');
              const roleText = Array.isArray(item.roles) ? item.roles.join(', ') : String(item.roles ?? '-');
              const branchCode = String(item.branchCode ?? '-');
              const city = String(item.city ?? '-');
              const address = String(item.address ?? '-');
              const lastLoginAt = String(item.lastLoginAt ?? '-');
              const waRaw = item.whatsApp ?? item.WhatsApp ?? item.phone ?? item.Phone ?? '';
              const waNumber = normalizeWhatsApp(waRaw);
              const hasWa = waNumber.length >= 10;
              const waHref = hasWa ? `https://wa.me/${waNumber}?text=${encodeURIComponent(buildAgentInfoMessage(userName))}` : '#';
              const waTouched = waTouchedIds.includes(rowId);
              return (
                <div key={`${rowId}-${idx}`} className={`border rounded-2xl p-3 bg-white transition-colors ${highlightedId === rowId ? 'border-emerald-400 bg-emerald-50/40' : ''}`}>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="text-sm font-semibold text-zinc-900">{fullName}</div>
                      <div className="text-[11px] text-zinc-500">@{userName}</div>
                    </div>
                    <button
                      onClick={() => {
                        openJsonModal(rowId, item);
                      }}
                      className="text-primary-600 font-semibold text-xs"
                    >
                      Isi Form
                    </button>
                  </div>
                  <div className="mt-2 space-y-1 text-[11px] text-zinc-600">
                    <div>Email: {email}</div>
                    <div>Role: {roleText || '-'}</div>
                    <div>Branch: {branchCode} | Kota: {city}</div>
                    <div>Address: {address}</div>
                    <div>Recent Login: {lastLoginAt}</div>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <a
                      href={waHref}
                      target="_blank"
                      rel="noreferrer"
                      onClick={() => {
                        if (!hasWa) return;
                        setWaTouchedIds((prev) => (prev.includes(rowId) ? prev : [...prev, rowId]));
                      }}
                      className={`h-7 px-2 inline-flex items-center rounded-lg text-[11px] font-semibold ${!hasWa ? 'bg-zinc-100 text-zinc-400 pointer-events-none' : waTouched ? 'bg-emerald-700 text-white' : 'bg-emerald-600 text-white'}`}
                      title={hasWa ? 'Kirim info WhatsApp' : 'Nomor WhatsApp belum valid'}
                    >
                      WA
                    </a>
                    <button
                      onClick={async () => {
                        setId(rowId);
                        setUserModalMode('edit');
                        setUserForm(userFormFromItem(item));
                        setUserShowPassword(false);
                        setUserFieldErrors({});
                        setShowUserModal(true);
                        await Promise.all([ensureRoleOptions(), ensureBranchOptions(), loadUserDetails(rowId)]);
                      }}
                      className="h-7 px-2 rounded-lg border text-blue-600 font-semibold text-[11px]"
                    >
                      Edit
                    </button>
                    <button
                      disabled={isProtectedUser}
                      onClick={() => {
                        if (isProtectedUser) return;
                        setId(rowId);
                        setUserModalMode('delete');
                        setUserForm(userFormFromItem(item));
                        setShowUserModal(true);
                      }}
                      className={`h-7 px-2 rounded-lg border font-semibold text-[11px] ${isProtectedUser ? 'text-zinc-400 cursor-not-allowed' : 'text-red-600'}`}
                    >
                      {isProtectedUser ? 'Protected' : 'Delete'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
          )
        ) : slug === 'branch' ? (
          <div className="space-y-2">
            {list.length === 0 ? (
              <div className="border rounded-2xl p-3 text-xs text-zinc-500">Belum ada data.</div>
            ) : list.map((item, idx) => {
              const rowId = resolveItemId(item);
              const name = String(item.name ?? '-');
              const code = String(item.code ?? '-');
              const city = String(item.city ?? '-');
              const province = String(item.province ?? '-');
              const address = String(item.address ?? '-');
              const isActive = String(item.isActive ?? '-');
              return (
                <div key={`${rowId}-${idx}`} className={`border rounded-2xl p-3 bg-white transition-colors ${highlightedId === rowId ? 'border-emerald-400 bg-emerald-50/40' : ''}`}>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="text-sm font-semibold text-zinc-900">{name}</div>
                      <div className="text-[11px] text-zinc-500">Code: {code}</div>
                    </div>
                    <button
                      onClick={() => {
                        openJsonModal(rowId, item);
                      }}
                      className="text-primary-600 font-semibold text-xs"
                    >
                      Isi Form
                    </button>
                  </div>
                  <div className="mt-2 space-y-1 text-[11px] text-zinc-600">
                    <div>Kota: {city} | Provinsi: {province}</div>
                    <div>Address: {address}</div>
                    <div>Status Aktif: {isActive}</div>
                  </div>
                  <div className="flex gap-3 mt-2">
                    <button
                      onClick={() => {
                        setId(rowId);
                        setPayload(toPrettyJson(item));
                        setBranchForm(branchFormFromItem(item));
                        setBranchModalMode('edit');
                        setShowBranchModal(true);
                      }}
                      className="text-blue-600 font-semibold text-xs"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => {
                        setId(rowId);
                        setBranchModalMode('delete');
                        setShowBranchModal(true);
                      }}
                      className="text-red-600 font-semibold text-xs"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : slug === 'roles' ? (
          <div className="space-y-2">
            {list.length === 0 ? (
              <div className="border rounded-2xl p-3 text-xs text-zinc-500">Belum ada data.</div>
            ) : list.map((item, idx) => {
              const rowId = resolveItemId(item);
              const name = String(item.name ?? item.roleName ?? '-');
              const code = String(item.code ?? '-');
              const description = String(item.description ?? '-');
              const isActive = String(item.isActive ?? '-');
              return (
                <div key={`${rowId}-${idx}`} className={`border rounded-2xl p-3 bg-white transition-colors ${highlightedId === rowId ? 'border-emerald-400 bg-emerald-50/40' : ''}`}>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="text-sm font-semibold text-zinc-900">{name}</div>
                      <div className="text-[11px] text-zinc-500">Code: {code}</div>
                    </div>
                    <button
                      onClick={() => {
                        openJsonModal(rowId, item);
                      }}
                      className="text-primary-600 font-semibold text-xs"
                    >
                      Isi Form
                    </button>
                  </div>
                  <div className="mt-2 space-y-1 text-[11px] text-zinc-600">
                    <div>Description: {description}</div>
                    <div>Status Aktif: {isActive}</div>
                  </div>
                  <div className="flex gap-3 mt-2">
                    <button
                      onClick={() => {
                        setId(rowId);
                        setRoleForm(roleFormFromItem(item));
                        setRoleModalMode('edit');
                        setShowRoleModal(true);
                      }}
                      className="text-blue-600 font-semibold text-xs"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => {
                        setId(rowId);
                        setRoleModalMode('delete');
                        setShowRoleModal(true);
                      }}
                      className="text-red-600 font-semibold text-xs"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="space-y-2">
            {list.length === 0 ? (
              <div className="border rounded-2xl p-3 text-xs text-zinc-500">Belum ada data.</div>
            ) : list.map((item, idx) => {
              const rowId = resolveItemId(item);
              const entries = Object.entries(item).slice(0, 8);
              const hotelStars = Number(item.starRating ?? 0);
              const hotelTitle = String(item.name ?? '-');
              const hotelCity = String(item.city ?? '-');
              const hotelCountry = String(item.country ?? '-');
              const hotelPhone = String(item.phone ?? '-');
              const hotelCheckIn = String(item.checkInTime ?? '-');
              const hotelCheckOut = String(item.checkOutTime ?? '-');
              const hotelAddress = String(item.address ?? '-');
              return (
                <div key={`${rowId}-${idx}`} className={`border rounded-2xl p-3 bg-white transition-colors ${highlightedId === rowId ? 'border-emerald-400 bg-emerald-50/40' : ''}`}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="text-sm font-semibold text-zinc-900">{String(item.name ?? item.Name ?? item.title ?? item.Title ?? rowId ?? '-')}</div>
                    <button
                      onClick={() => {
                        openJsonModal(rowId, item);
                      }}
                      className="text-primary-600 font-semibold text-xs"
                    >
                      Isi Form
                    </button>
                  </div>
                  <div className="mt-2 space-y-1 text-[11px] text-zinc-600">
                    {slug === 'hero-banners' && (item.imageUrl || item.ImageUrl) ? (
                      <img
                        src={toApiAssetUrl(String(item.imageUrl ?? item.ImageUrl ?? ''))}
                        alt={String(item.name ?? item.Name ?? 'Hero')}
                        className="h-24 w-full rounded-xl object-cover border"
                      />
                    ) : null}
                    {slug === 'hotels' ? (
                      <>
                        <div className="font-semibold text-zinc-800">{hotelTitle}</div>
                        <div>{'★'.repeat(Math.max(0, Math.min(7, hotelStars)))} ({hotelStars})</div>
                        <div>{hotelCity}, {hotelCountry}</div>
                        <div>{hotelAddress}</div>
                        <div>Check-in: {hotelCheckIn} • Check-out: {hotelCheckOut}</div>
                        <div>Phone: {hotelPhone}</div>
                      </>
                    ) : slug === 'media-assets' ? (
                      <>
                        {(item.fileUrl || item.FileUrl) && String(item.mediaType ?? item.MediaType ?? '').toLowerCase() === 'image' ? (
                          <img
                            src={toApiAssetUrl(String(item.thumbnailUrl ?? item.ThumbnailUrl ?? item.fileUrl ?? item.FileUrl ?? ''))}
                            alt={String(item.altText ?? item.AltText ?? item.name ?? item.Name ?? 'Media')}
                            className="h-24 w-full rounded-xl object-cover border"
                            onError={(e) => {
                              const target = e.currentTarget;
                              target.onerror = null;
                              target.src = '/placeholder-image.svg';
                            }}
                          />
                        ) : null}
                        <div>Tipe: {String(item.mediaType ?? item.MediaType ?? '-')}</div>
                        <div>File: {String(item.fileUrl ?? item.FileUrl ?? '-')}</div>
                        <div>Thumbnail: {String(item.thumbnailUrl ?? item.ThumbnailUrl ?? '-')}</div>
                        <div>MIME: {String(item.mimeType ?? item.MimeType ?? '-')}</div>
                        <div>Ukuran: {String(item.fileSizeBytes ?? item.FileSizeBytes ?? '-')} bytes</div>
                      </>
                    ) : (
                      entries.map(([k, v]) => (
                        <div key={k}>{k}: {Array.isArray(v) ? v.join(', ') : String(v ?? '-')}</div>
                      ))
                    )}
                  </div>
                  <div className="flex gap-3 mt-2">
                    {slug === 'media-assets' ? (
                      <>
                        <button
                          onClick={async () => {
                            const raw = String(item.fileUrl ?? item.FileUrl ?? '').trim();
                            const value = raw ? toApiAssetUrl(raw) : '';
                            if (!value) {
                              show('URL file belum tersedia');
                              return;
                            }
                            try {
                              await navigator.clipboard.writeText(value);
                              show('URL file berhasil dicopy');
                            } catch {
                              setError('Gagal copy URL file');
                            }
                          }}
                          className="text-emerald-700 font-semibold text-xs"
                        >
                          Copy URL
                        </button>
                        <Link
                          href={(String(item.fileUrl ?? item.FileUrl ?? '').trim())
                            ? `/akun/media-assets-preview?src=${encodeURIComponent(toApiAssetUrl(String(item.fileUrl ?? item.FileUrl ?? '')))}&type=${encodeURIComponent(String(item.mediaType ?? item.MediaType ?? 'document').toLowerCase())}`
                            : '#'}
                          className="text-indigo-700 font-semibold text-xs"
                        >
                          Buka
                        </Link>
                      </>
                    ) : null}
                    <button
                      onClick={() => {
                        setId(resolveCrudEntityId(item) || rowId);
                        if (slug === 'hero-banners') {
                          setHeroForm(heroFormFromItem(item));
                          setHeroModalMode('edit');
                          setHeroError('');
                          setShowHeroModal(true);
                        } else {
                          setGenericForm(buildGenericEditForm(item));
                          if (slug === 'hotels') setHotelForm(hotelFormFromItem(item));
                          if (slug === 'company-profiles') setCompanyProfileForm(companyProfileFormFromItem(item));
                          if (slug === 'insurance-types') setInsuranceTypeForm(insuranceTypeFormFromItem(item));
                          if (slug === 'package-label-tags') setPackageLabelTagForm(packageLabelTagFormFromItem(item));
                          if (slug === 'room-type-masters') setRoomTypeForm(roomTypeFormFromItem(item));
                          if (slug === 'facility-masters') setFacilityMasterForm(facilityMasterFormFromItem(item));
                          if (slug === 'media-assets') setMediaAssetForm(mediaAssetFormFromItem(item));
                          if (slug === 'program-templates') setProgramTemplateForm(programTemplateFormFromItem(item));
                          if (slug === 'poster-type-masters') setPosterTypeMasterForm(posterTypeMasterFormFromItem(item));
                          if (slug === 'duration-types') setDurationTypeForm(durationTypeFormFromItem(item));
                          setGenericModalMode('edit');
                          setShowGenericModal(true);
                        }
                      }}
                      className="text-blue-600 font-semibold text-xs"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => {
                        setId(resolveCrudEntityId(item) || rowId);
                        if (slug === 'hero-banners') {
                          setHeroForm(heroFormFromItem(item));
                          setHeroModalMode('delete');
                          setHeroError('');
                          setShowHeroModal(true);
                        } else {
                          setGenericForm(buildGenericEditForm(item));
                          if (slug === 'hotels') setHotelForm(hotelFormFromItem(item));
                          if (slug === 'company-profiles') setCompanyProfileForm(companyProfileFormFromItem(item));
                          if (slug === 'insurance-types') setInsuranceTypeForm(insuranceTypeFormFromItem(item));
                          if (slug === 'package-label-tags') setPackageLabelTagForm(packageLabelTagFormFromItem(item));
                          if (slug === 'room-type-masters') setRoomTypeForm(roomTypeFormFromItem(item));
                          if (slug === 'facility-masters') setFacilityMasterForm(facilityMasterFormFromItem(item));
                          if (slug === 'media-assets') setMediaAssetForm(mediaAssetFormFromItem(item));
                          if (slug === 'program-templates') setProgramTemplateForm(programTemplateFormFromItem(item));
                          if (slug === 'poster-type-masters') setPosterTypeMasterForm(posterTypeMasterFormFromItem(item));
                          if (slug === 'duration-types') setDurationTypeForm(durationTypeFormFromItem(item));
                          setGenericModalMode('delete');
                          setShowGenericModal(true);
                        }
                      }}
                      className="text-red-600 font-semibold text-xs"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="flex gap-2">
          <button disabled={busy || page <= 1} onClick={() => run(() => fetchList(page - 1))} className="border rounded-xl px-3 py-2 text-xs">Prev</button>
          <button disabled={busy || page >= totalPages} onClick={() => run(() => fetchList(page + 1))} className="border rounded-xl px-3 py-2 text-xs">Next</button>
          <button disabled={busy} onClick={() => run(() => fetchList(page))} className="border rounded-xl px-3 py-2 text-xs">Refresh</button>
        </div>
      </div>

      <div className="bg-white border rounded-3xl p-5 space-y-3">
        <button type="button" onClick={() => setCrudExpanded((v) => !v)} className="w-full flex items-center justify-between text-left">
          <h2 className="text-sm font-bold">Form CRUD (Advanced)</h2>
          <span className="text-xs text-blue-600 underline underline-offset-2">{crudExpanded ? 'Collapse' : 'Expand'}</span>
        </button>

        {crudExpanded ? (
          <>
            <input value={id} onChange={(e) => setId(e.target.value)} placeholder="ID (untuk detail/update/delete/action)" className="w-full border rounded-2xl px-4 py-3 text-sm" />
            <textarea value={payload} onChange={(e) => setPayload(e.target.value)} className="w-full border rounded-2xl px-4 py-3 text-xs min-h-36 font-mono" />

            <div className="grid grid-cols-2 gap-2 text-xs">
              <button disabled={busy} onClick={() => run(() => apiGet(slug === 'user-management' ? `/api/UserManagement/public-users?pageNumber=1&pageSize=${pageSize}` : `${config.endpoint}?page=1&pageSize=${pageSize}`))} className="border rounded-xl py-2">GET List (Raw)</button>
              <button disabled={busy || !id} onClick={() => run(() => apiGet(`${config.endpoint}/${id}`))} className="border rounded-xl py-2">GET By ID</button>
              <button
                disabled={busy}
                onClick={() => run(() => apiPost(config.endpoint, parsePayload()), true)}
                className="border rounded-xl h-9 w-9 inline-flex items-center justify-center justify-self-center"
                title="POST Create"
              >
                ＋
              </button>
              <button disabled={busy || !id} onClick={() => run(() => apiPut(`${config.endpoint}/${id}`, parsePayload()), true)} className="border rounded-xl py-2">PUT Update</button>
              <button
                disabled={busy || !id}
                onClick={() => run(
                  () => slug === 'user-management' ? deleteUserByIdWithGuard(id) : apiDelete(`${config.endpoint}/${id}`),
                  true,
                )}
                className="border rounded-xl py-2"
              >
                DELETE
              </button>
              <button
                disabled={busy || !id}
                onClick={() => run(() => apiPost(`${config.endpoint}/${id}/restore`), true)}
                className="border rounded-xl h-9 w-9 inline-flex items-center justify-center justify-self-center"
                title="POST Restore"
              >
                ↺
              </button>
              <button
                disabled={busy || !id}
                onClick={() => run(() => apiPost(`${config.endpoint}/${id}/activate`), true)}
                className="border rounded-xl h-9 w-9 inline-flex items-center justify-center justify-self-center"
                title="POST Activate"
              >
                ✓
              </button>
              <button
                disabled={busy || !id}
                onClick={() => run(() => apiPost(`${config.endpoint}/${id}/deactivate`), true)}
                className="border rounded-xl h-9 w-9 inline-flex items-center justify-center justify-self-center"
                title="POST Deactivate"
              >
                ⏸
              </button>
            </div>
          </>
        ) : null}

        {error ? <p className="text-xs text-red-500">{error}</p> : null}
      </div>

      {slug === 'branch' ? (
        <div className="bg-white border rounded-3xl p-5 space-y-3">
          <button type="button" onClick={() => setBulkBranchExpanded((v) => !v)} className="w-full flex items-center justify-between text-left">
            <h2 className="text-sm font-bold">Bulk Paste JSON Branch</h2>
            <span className="text-xs text-blue-600 underline underline-offset-2">{bulkBranchExpanded ? 'Collapse' : 'Expand'}</span>
          </button>
          {bulkBranchExpanded ? (
            <>
              <p className="text-[11px] text-zinc-500">Paste JSON array branch, lalu klik execute. Field minimum: <span className="font-mono">name</span>.</p>
              <textarea
                value={bulkPayload}
                onChange={(e) => setBulkPayload(e.target.value)}
                className="w-full border rounded-2xl px-4 py-3 text-xs min-h-44 font-mono"
              />
              <button disabled={busy} onClick={executeBulkBranch} className="w-full border rounded-xl py-2 text-xs font-semibold">
                Execute Bulk Branch
              </button>
            </>
          ) : null}
        </div>
      ) : null}

      {slug === 'user-management' ? (
        <div id="bulk-user-section" className="bg-white border rounded-3xl p-5 space-y-3">
          <button type="button" onClick={() => setBulkUserExpanded((v) => !v)} className="w-full flex items-center justify-between text-left">
            <h2 className="text-sm font-bold">Bulk Paste JSON User</h2>
            <span className="text-xs text-blue-600 underline underline-offset-2">{bulkUserExpanded ? 'Collapse' : 'Expand'}</span>
          </button>
          {bulkUserExpanded ? (
            <>
              <p className="text-[11px] text-zinc-500">Paste JSON array user lalu execute. Username & password akan auto-generate dari API.</p>
              <textarea
                value={userBulkPayload}
                onChange={(e) => {
                  setUserBulkPayload(e.target.value);
                  if (bulkUserError) setBulkUserError('');
                }}
                className="w-full border rounded-2xl px-4 py-3 text-xs min-h-44 font-mono"
              />
              {bulkUserError ? <p className="text-xs text-red-500">{bulkUserError}</p> : null}
              <button disabled={busy} onClick={executeBulkUsers} className="w-full border rounded-xl py-2 text-xs font-semibold inline-flex items-center justify-center gap-2">
                {busy ? <span className="inline-block h-3.5 w-3.5 rounded-full border-2 border-zinc-300 border-t-zinc-700 animate-spin" /> : null}
                {busy ? 'Memproses Bulk User...' : 'Execute Bulk User'}
              </button>
            </>
          ) : null}
        </div>
      ) : null}

      {!isSpecialSlug ? (
        <div className="bg-white border rounded-3xl p-5 space-y-3">
          <button type="button" onClick={() => setBulkGenericExpanded((v) => !v)} className="w-full flex items-center justify-between text-left">
            <h2 className="text-sm font-bold">Bulk Paste JSON {config.label}</h2>
            <span className="text-xs text-blue-600 underline underline-offset-2">{bulkGenericExpanded ? 'Collapse' : 'Expand'}</span>
          </button>
          {bulkGenericExpanded ? (
            <>
              <p className="text-[11px] text-zinc-500">
                {slug === 'media-assets'
                  ? <>Paste JSON array media. Field minimum: <span className="font-mono">name</span>, <span className="font-mono">mediaType</span>, <span className="font-mono">fileUrl</span>. Untuk video tambahkan <span className="font-mono">durationSeconds</span>.</>
                  : <>Paste JSON array sesuai endpoint <span className="font-mono">{config.endpoint}</span>, lalu execute.</>}
              </p>
              <textarea
                value={bulkGenericPayload}
                onChange={(e) => {
                  setBulkGenericPayload(e.target.value);
                  if (bulkGenericError) setBulkGenericError('');
                }}
                className="w-full border rounded-2xl px-4 py-3 text-xs min-h-44 font-mono"
              />
              {bulkGenericError ? <p className="text-xs text-red-500">{bulkGenericError}</p> : null}
              <button disabled={busy} onClick={executeBulkGeneric} className="w-full border rounded-xl py-2 text-xs font-semibold inline-flex items-center justify-center gap-2">
                {busy ? <span className="inline-block h-3.5 w-3.5 rounded-full border-2 border-zinc-300 border-t-zinc-700 animate-spin" /> : null}
                {busy ? `Memproses Bulk ${config.label}...` : `Execute Bulk ${config.label}`}
              </button>
            </>
          ) : null}
        </div>
      ) : null}

      <div className="bg-zinc-950 text-zinc-100 rounded-3xl p-5">
        <h2 className="text-sm font-bold">Raw Response</h2>
        <pre className="mt-2 text-[11px] whitespace-pre-wrap">{result || 'Belum ada response.'}</pre>
      </div>

      <ModalShell open={slug === 'branch' && showBranchModal && mounted} onBackdropClick={() => setShowBranchModal(false)}>
          <div className="bg-white w-full max-w-xl rounded-3xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold">
                {branchModalMode === 'add' ? 'Add Branch' : branchModalMode === 'edit' ? 'Edit Branch' : 'Delete Branch'}
              </h3>
              <button onClick={() => setShowBranchModal(false)} className="text-zinc-500" aria-label="Tutup modal">✕</button>
            </div>

            {branchModalMode === 'add' || branchModalMode === 'edit' ? (
              <>
                <div className="grid grid-cols-2 gap-2">
                  <input value={branchForm.name} onChange={(e) => setBranchForm((p) => ({ ...p, name: e.target.value }))} placeholder="Nama Branch" className="w-full border rounded-xl px-3 py-2 text-xs" />
                  <input value={branchForm.code} onChange={(e) => setBranchForm((p) => ({ ...p, code: e.target.value }))} placeholder="Kode Branch" className="w-full border rounded-xl px-3 py-2 text-xs" />
                  <input value={branchForm.city} onChange={(e) => setBranchForm((p) => ({ ...p, city: e.target.value }))} placeholder="Kota" className="w-full border rounded-xl px-3 py-2 text-xs" />
                  <input value={branchForm.province} onChange={(e) => setBranchForm((p) => ({ ...p, province: e.target.value }))} placeholder="Provinsi" className="w-full border rounded-xl px-3 py-2 text-xs" />
                  <input value={branchForm.phone} onChange={(e) => setBranchForm((p) => ({ ...p, phone: e.target.value }))} placeholder="No. Telepon" className="w-full border rounded-xl px-3 py-2 text-xs" />
                  <input value={branchForm.email} onChange={(e) => setBranchForm((p) => ({ ...p, email: e.target.value }))} placeholder="Email Branch" className="w-full border rounded-xl px-3 py-2 text-xs" />
                  <input value={branchForm.latitude} onChange={(e) => setBranchForm((p) => ({ ...p, latitude: e.target.value }))} placeholder="Latitude" className="w-full border rounded-xl px-3 py-2 text-xs" />
                  <input value={branchForm.longitude} onChange={(e) => setBranchForm((p) => ({ ...p, longitude: e.target.value }))} placeholder="Longitude" className="w-full border rounded-xl px-3 py-2 text-xs" />
                  <input value={branchForm.mapsUrl} onChange={(e) => setBranchForm((p) => ({ ...p, mapsUrl: e.target.value }))} placeholder="Google Maps URL" className="w-full border rounded-xl px-3 py-2 text-xs col-span-2" />
                  <textarea value={branchForm.address} onChange={(e) => setBranchForm((p) => ({ ...p, address: e.target.value }))} placeholder="Alamat lengkap" className="w-full border rounded-xl px-3 py-2 text-xs min-h-20 col-span-2" />
                  <label className="col-span-2 inline-flex items-center gap-2 text-xs">
                    <input type="checkbox" checked={branchForm.isActive} onChange={(e) => setBranchForm((p) => ({ ...p, isActive: e.target.checked }))} />
                    Branch aktif
                  </label>
                </div>
                <button
                  disabled={busy || (branchModalMode === 'edit' && !id) || !branchForm.name.trim() || !branchForm.code.trim()}
                  onClick={() => run(
                    () => branchModalMode === 'add'
                      ? apiPost(config.endpoint, branchPayloadFromForm(branchForm))
                      : apiPut(`${config.endpoint}/${id}`, branchPayloadFromForm(branchForm)),
                    true,
                    branchModalMode === 'add' ? 'Branch berhasil ditambahkan' : 'Branch berhasil diperbarui',
                  ).then(() => setShowBranchModal(false))}
                  className="w-full border rounded-xl py-2 text-xs font-semibold"
                >
                  {branchModalMode === 'add' ? 'Tambah Branch' : 'Simpan Perubahan'}
                </button>
              </>
            ) : (
              <>
                <p className="text-xs text-zinc-600">Yakin ingin menghapus branch ID: <span className="font-semibold">{id}</span> ?</p>
                <button
                  disabled={busy || !id}
                  onClick={() => run(() => apiDelete(`${config.endpoint}/${id}`), true, 'Branch berhasil dihapus').then(() => setShowBranchModal(false))}
                  className="w-full border border-red-200 text-red-600 rounded-xl py-2 text-xs font-semibold"
                >
                  Hapus Branch
                </button>
              </>
            )}
          </div>
      </ModalShell>

      <ModalShell open={slug === 'roles' && showRoleModal && mounted} onBackdropClick={() => setShowRoleModal(false)}>
          <div className="bg-white w-full max-w-xl rounded-3xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold">
                {roleModalMode === 'add' ? 'Add Role' : roleModalMode === 'edit' ? 'Edit Role' : 'Delete Role'}
              </h3>
              <button onClick={() => setShowRoleModal(false)} className="text-zinc-500" aria-label="Tutup modal">✕</button>
            </div>

            {roleModalMode === 'add' || roleModalMode === 'edit' ? (
              <>
                <div className="grid grid-cols-2 gap-2">
                  <input value={roleForm.name} onChange={(e) => setRoleForm((p) => ({ ...p, name: e.target.value }))} placeholder="Nama Role" className="w-full border rounded-xl px-3 py-2 text-xs col-span-2" />
                  <input value={roleForm.code} onChange={(e) => setRoleForm((p) => ({ ...p, code: e.target.value }))} placeholder="Kode Role (opsional)" className="w-full border rounded-xl px-3 py-2 text-xs col-span-2" />
                  <textarea value={roleForm.description} onChange={(e) => setRoleForm((p) => ({ ...p, description: e.target.value }))} placeholder="Deskripsi role" className="w-full border rounded-xl px-3 py-2 text-xs min-h-20 col-span-2" />
                  <label className="col-span-2 inline-flex items-center gap-2 text-xs">
                    <input type="checkbox" checked={roleForm.isActive} onChange={(e) => setRoleForm((p) => ({ ...p, isActive: e.target.checked }))} />
                    Role aktif
                  </label>
                </div>
                {roleForm.name.trim().length < 3 ? <p className="text-xs text-red-500">Nama role minimal 3 karakter.</p> : null}
                <button
                  disabled={busy || (roleModalMode === 'edit' && !id) || roleForm.name.trim().length < 3}
                  onClick={() => run(
                    () => roleModalMode === 'add'
                      ? apiPost(config.endpoint, rolePayloadFromForm(roleForm))
                      : apiPut(`${config.endpoint}/${id}`, rolePayloadFromForm(roleForm)),
                    true,
                    roleModalMode === 'add' ? 'Role berhasil ditambahkan' : 'Role berhasil diperbarui',
                  ).then(() => setShowRoleModal(false))}
                  className="w-full border rounded-xl py-2 text-xs font-semibold"
                >
                  {roleModalMode === 'add' ? 'Tambah Role' : 'Simpan Perubahan'}
                </button>
              </>
            ) : (
              <>
                <p className="text-xs text-zinc-600">Yakin ingin menghapus role ID: <span className="font-semibold">{id}</span> ?</p>
                <button
                  disabled={busy || !id}
                  onClick={() => run(() => apiDelete(`${config.endpoint}/${id}`), true, 'Role berhasil dihapus').then(() => setShowRoleModal(false))}
                  className="w-full border border-red-200 text-red-600 rounded-xl py-2 text-xs font-semibold"
                >
                  Hapus Role
                </button>
              </>
            )}
          </div>
      </ModalShell>

      <ModalShell open={showJsonModal && mounted} onBackdropClick={() => setShowJsonModal(false)}>
          <div className="bg-white w-full max-w-2xl rounded-3xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold">Edit JSON ({config.label})</h3>
              <button onClick={() => setShowJsonModal(false)} className="text-zinc-500" aria-label="Tutup modal">✕</button>
            </div>
            <input
              value={jsonModalId}
              onChange={(e) => setJsonModalId(e.target.value)}
              placeholder="ID"
              className="w-full border rounded-2xl px-4 py-2 text-xs"
            />
            <textarea
              value={jsonModalPayload}
              onChange={(e) => setJsonModalPayload(e.target.value)}
              className="w-full border rounded-2xl px-4 py-3 text-xs min-h-56 font-mono"
            />
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setId(jsonModalId);
                  setPayload(jsonModalPayload);
                  setCrudExpanded(true);
                  setShowJsonModal(false);
                }}
                className="border rounded-xl py-2 text-xs font-semibold"
              >
                Kirim ke Form Advanced
              </button>
              <button
                type="button"
                disabled={busy || !jsonModalId}
                onClick={() => run(() => {
                  let parsed: Record<string, unknown>;
                  try {
                    parsed = JSON.parse(jsonModalPayload) as Record<string, unknown>;
                  } catch {
                    throw new Error('Payload JSON pada modal tidak valid');
                  }
                  return apiPut(`${config.endpoint}/${jsonModalId}`, parsed);
                }, true, 'Data berhasil diperbarui').then(() => {
                  setHighlightedId(jsonModalId);
                  setShowJsonModal(false);
                })}
                className="border rounded-xl py-2 text-xs font-semibold"
              >
                Simpan Perubahan
              </button>
            </div>
          </div>
      </ModalShell>

      <ModalShell open={slug === 'hero-banners' && showHeroModal && mounted} onBackdropClick={() => setShowHeroModal(false)}>
          <div className="bg-white w-full max-w-2xl rounded-3xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold">{heroModalMode === 'add' ? 'Add Hero Banner' : heroModalMode === 'edit' ? 'Edit Hero Banner' : 'Delete Hero Banner'}</h3>
              <button onClick={() => setShowHeroModal(false)} className="text-zinc-500" aria-label="Tutup modal">✕</button>
            </div>
            {heroModalMode === 'delete' ? (
              <>
                <p className="text-xs text-zinc-600">Yakin ingin menghapus hero ini?</p>
                <button
                  disabled={busy || !id}
                  onClick={() => run(() => apiDelete(`${config.endpoint}/${id}`), true, 'Hero banner dihapus').then(() => setShowHeroModal(false))}
                  className="w-full border border-red-200 text-red-600 rounded-xl py-2 text-xs font-semibold"
                >
                  Hapus Hero
                </button>
              </>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-2">
                  <input value={heroForm.name} onChange={(e) => setHeroForm((p) => ({ ...p, name: e.target.value }))} placeholder="Name" className="w-full border rounded-xl px-3 py-2 text-xs col-span-2" />
                  <input value={heroForm.code} onChange={(e) => setHeroForm((p) => ({ ...p, code: e.target.value }))} placeholder="Code" className="w-full border rounded-xl px-3 py-2 text-xs" />
                  <input value={heroForm.locale} onChange={(e) => setHeroForm((p) => ({ ...p, locale: e.target.value }))} placeholder="Locale: id/en/ar/all" className="w-full border rounded-xl px-3 py-2 text-xs" />
                  <input value={heroForm.actionLabel} onChange={(e) => setHeroForm((p) => ({ ...p, actionLabel: e.target.value }))} placeholder="Button Label" className="w-full border rounded-xl px-3 py-2 text-xs" />
                  <input value={heroForm.actionUrl} onChange={(e) => setHeroForm((p) => ({ ...p, actionUrl: e.target.value }))} placeholder="Button URL" className="w-full border rounded-xl px-3 py-2 text-xs" />
                  <input value={heroForm.sortOrder} onChange={(e) => setHeroForm((p) => ({ ...p, sortOrder: e.target.value }))} placeholder="Sort Order" className="w-full border rounded-xl px-3 py-2 text-xs" />
                  <label className="inline-flex items-center gap-2 text-xs px-2">
                    <input type="checkbox" checked={heroForm.isActive} onChange={(e) => setHeroForm((p) => ({ ...p, isActive: e.target.checked }))} />
                    Aktif
                  </label>
                  <input type="datetime-local" value={heroForm.startsAt ? heroForm.startsAt.slice(0, 16) : ''} onChange={(e) => setHeroForm((p) => ({ ...p, startsAt: e.target.value }))} className="w-full border rounded-xl px-3 py-2 text-xs" />
                  <input type="datetime-local" value={heroForm.endsAt ? heroForm.endsAt.slice(0, 16) : ''} onChange={(e) => setHeroForm((p) => ({ ...p, endsAt: e.target.value }))} className="w-full border rounded-xl px-3 py-2 text-xs" />
                  <textarea value={heroForm.description} onChange={(e) => setHeroForm((p) => ({ ...p, description: e.target.value }))} placeholder="Description" className="w-full border rounded-xl px-3 py-2 text-xs min-h-20 col-span-2" />
                  <input value={heroForm.imageUrl} onChange={(e) => setHeroForm((p) => ({ ...p, imageUrl: e.target.value }))} placeholder="Image URL (/uploads/heroes/...)" className="w-full border rounded-xl px-3 py-2 text-xs col-span-2" />
                  {heroForm.imageUrl ? <img src={toApiAssetUrl(heroForm.imageUrl)} alt="Hero Preview" className="col-span-2 h-36 w-full rounded-xl border object-cover" /> : null}
                  <input
                    type="file"
                    accept="image/*"
                    className="col-span-2 w-full border rounded-xl px-3 py-2 text-xs"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) void uploadHeroImage(file);
                    }}
                  />
                  {heroUploadBusy ? (
                    <div className="col-span-2 space-y-1">
                      <div className="h-2 w-full overflow-hidden rounded-full border bg-zinc-100">
                        <div className="h-full bg-blue-500 transition-all" style={{ width: `${heroUploadProgress}%` }} />
                      </div>
                      <p className="text-[11px] text-zinc-500">Upload {heroUploadProgress}%</p>
                    </div>
                  ) : null}
                  {heroError ? <p className="col-span-2 text-xs text-red-500">{heroError}</p> : null}
                  <p className="col-span-2 text-[11px] text-zinc-500">Ukuran disarankan landscape, minimal 1280x720 px (ideal 1920x1080), tinggi maksimal 2200px.</p>
                </div>
                <button
                  disabled={busy || heroUploadBusy || !heroForm.name.trim() || !heroForm.imageUrl.trim()}
                  onClick={() => run(
                    () => {
                      const body = {
                        name: heroForm.name.trim(),
                        code: heroForm.code.trim() || undefined,
                        description: heroForm.description.trim() || undefined,
                        imageUrl: toHeroImagePayloadUrl(heroForm.imageUrl),
                        actionLabel: heroForm.actionLabel.trim() || undefined,
                        actionUrl: heroForm.actionUrl.trim() || undefined,
                        locale: heroForm.locale.trim() || 'id',
                        sortOrder: Number.isNaN(Number(heroForm.sortOrder || '0')) ? 0 : Number(heroForm.sortOrder || '0'),
                        isActive: heroForm.isActive,
                        startsAt: heroForm.startsAt ? new Date(heroForm.startsAt).toISOString() : null,
                        endsAt: heroForm.endsAt ? new Date(heroForm.endsAt).toISOString() : null,
                      };
                      return heroModalMode === 'add' ? apiPost(config.endpoint, body) : apiPut(`${config.endpoint}/${id}`, body);
                    },
                    true,
                    heroModalMode === 'add' ? 'Hero ditambahkan' : 'Hero diperbarui',
                  ).then(() => setShowHeroModal(false))}
                  className="w-full border rounded-xl py-2 text-xs font-semibold"
                >
                  {heroUploadBusy ? 'Upload...' : heroModalMode === 'add' ? 'Tambah Hero' : 'Simpan Hero'}
                </button>
              </>
            )}
          </div>
      </ModalShell>

      <ModalShell open={slug === 'user-management' && showUserModal && mounted} onBackdropClick={() => setShowUserModal(false)}>
          <div className="bg-white w-full max-w-2xl rounded-3xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold">
                {userModalMode === 'add' ? 'Add User' : userModalMode === 'edit' ? 'Edit User' : 'Delete User'}
              </h3>
              <button onClick={() => setShowUserModal(false)} className="text-zinc-500" aria-label="Tutup modal">✕</button>
            </div>

            {userModalMode === 'delete' ? (
              <>
                <p className="text-xs text-zinc-600">Yakin ingin menghapus user: <span className="font-semibold">{userForm.fullName || userForm.email || id}</span> ?</p>
                <button
                  disabled={busy || !id || isProtectedUsername(userForm.userName)}
                  onClick={() => run(() => deleteUserByIdWithGuard(id), true, 'User berhasil dihapus').then(() => setShowUserModal(false))}
                  className="w-full border border-red-200 text-red-600 rounded-xl py-2 text-xs font-semibold"
                >
                  Hapus User
                </button>
                {isProtectedUsername(userForm.userName) ? <p className="text-xs text-amber-600">User "superadmin" diproteksi dan tidak bisa dihapus.</p> : null}
              </>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-2">
                  <input value={userForm.fullName} onChange={(e) => setUserForm((p) => ({ ...p, fullName: e.target.value }))} placeholder="Nama Lengkap" className={`w-full border rounded-xl px-3 py-2 text-xs col-span-2 ${userFieldErrors.fullName ? 'border-red-400' : ''}`} />
                  {userFieldErrors.fullName ? <p className="col-span-2 text-[11px] text-red-500 -mt-1">{userFieldErrors.fullName}</p> : null}
                  <input
                    value={userForm.userName}
                    onChange={(e) => setUserForm((p) => ({ ...p, userName: sanitizeUsernameInput(e.target.value) }))}
                    placeholder="Username (huruf kecil + angka)"
                    className={`w-full border rounded-xl px-3 py-2 text-xs ${userFieldErrors.userName ? 'border-red-400' : ''}`}
                  />
                  <input
                    value={userForm.email}
                    type="email"
                    onChange={(e) => setUserForm((p) => ({ ...p, email: e.target.value.toLowerCase().trim() }))}
                    placeholder="Email"
                    className={`w-full border rounded-xl px-3 py-2 text-xs ${userFieldErrors.email ? 'border-red-400' : ''}`}
                  />
                  {userFieldErrors.userName ? <p className="text-[11px] text-red-500 -mt-1">{userFieldErrors.userName}</p> : <span />}
                  {userFieldErrors.email ? <p className="text-[11px] text-red-500 -mt-1">{userFieldErrors.email}</p> : <span />}
                  <input
                    value={userForm.phone}
                    inputMode="numeric"
                    onChange={(e) => setUserForm((p) => ({ ...p, phone: sanitizeWhatsappInput(e.target.value) }))}
                    placeholder="No. WhatsApp (min 10 digit)"
                    className={`w-full border rounded-xl px-3 py-2 text-xs col-span-2 ${userFieldErrors.phone ? 'border-red-400' : ''}`}
                  />
                  {userFieldErrors.phone ? <p className="col-span-2 text-[11px] text-red-500 -mt-1">{userFieldErrors.phone}</p> : null}
                  {userModalMode === 'add' ? (
                    <>
                      <div className="col-span-2 relative">
                        <input
                          value={userForm.password}
                          onChange={(e) => setUserForm((p) => ({ ...p, password: sanitizePasswordInput(e.target.value) }))}
                          placeholder="Password (tanpa spasi)"
                          type={userShowPassword ? 'text' : 'password'}
                          className={`w-full border rounded-xl px-3 py-2 pr-10 text-xs ${userFieldErrors.password ? 'border-red-400' : ''}`}
                        />
                        <button type="button" className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-zinc-500" onClick={() => setUserShowPassword((s) => !s)} title={userShowPassword ? 'Hide Password' : 'Show Password'}>
                          {userShowPassword ? '🙈' : '👁️'}
                        </button>
                      </div>
                      {userFieldErrors.password ? <p className="col-span-2 text-[11px] text-red-500 -mt-1">{userFieldErrors.password}</p> : null}
                    </>
                  ) : null}
                  <div className="col-span-2 space-y-1">
                    <select value={userForm.role} onChange={(e) => setUserForm((p) => ({ ...p, role: e.target.value }))} className={`w-full border rounded-xl px-3 py-2 text-xs bg-white ${userFieldErrors.role ? 'border-red-400' : ''}`}>
                      <option value="">Pilih Role</option>
                      {roleOptions.map((r) => (
                        <option key={r.id} value={r.name}>{r.name}</option>
                      ))}
                    </select>
                    {userFieldErrors.role ? <p className="text-[11px] text-red-500">{userFieldErrors.role}</p> : null}
                  </div>
                  <select value={userForm.branchId} onChange={(e) => setUserForm((p) => ({ ...p, branchId: e.target.value }))} className="w-full border rounded-xl px-3 py-2 text-xs bg-white col-span-2">
                    <option value="">Branch (opsional)</option>
                    {branchOptions.map((b) => (
                      <option key={b.id} value={b.id}>{b.code} - {b.name}</option>
                    ))}
                  </select>
                  <label className="col-span-2 inline-flex items-center gap-2 text-xs">
                    <input type="checkbox" checked={userForm.isActive} onChange={(e) => setUserForm((p) => ({ ...p, isActive: e.target.checked }))} />
                    User aktif
                  </label>
                </div>

                <button
                  disabled={busy || !userForm.email.trim() || !userForm.fullName.trim()}
                  onClick={() => {
                    if (!validateUserFormInline(userModalMode)) return;
                    if (userModalMode === 'add') {
                      return run(() => apiPost('/api/Account/admin-upsert-bulk-kepala-cabang', [{
                        fullName: userForm.fullName.trim(),
                        userName: sanitizeUsernameInput(userForm.userName.trim()),
                        password: userForm.password.trim(),
                        email: userForm.email.trim().toLowerCase(),
                        whatsApp: sanitizeWhatsappInput(userForm.phone.trim()),
                        role: userForm.role.trim(),
                        branchId: userForm.branchId ? Number(userForm.branchId) : 0,
                      }]), true, 'User berhasil ditambahkan').then(() => setShowUserModal(false));
                    }
                    return run(() => apiPut(`/api/UserManagement/${id}`, {
                      fullName: userForm.fullName.trim(),
                      username: sanitizeUsernameInput(userForm.userName.trim()) || undefined,
                      email: userForm.email.trim().toLowerCase(),
                      whatsApp: sanitizeWhatsappInput(userForm.phone.trim()) || undefined,
                      role: userForm.role.trim() || undefined,
                      branchId: userForm.branchId ? Number(userForm.branchId) : 0,
                      isActive: userForm.isActive,
                    }), true, 'User berhasil diperbarui').then(() => setShowUserModal(false));
                  }}
                  className="w-full border rounded-xl py-2 text-xs font-semibold"
                >
                  {busy ? (
                    <span className="inline-flex items-center gap-2">
                      <span className="h-3.5 w-3.5 rounded-full border-2 border-zinc-300 border-t-primary-600 animate-spin" />
                      Memproses...
                    </span>
                  ) : userModalMode === 'add' ? 'Tambah User' : 'Simpan Perubahan'}
                </button>
              </>
            )}
          </div>
      </ModalShell>

      <ModalShell open={!isSpecialSlug && showGenericModal && mounted} onBackdropClick={() => setShowGenericModal(false)}>
          <div className="bg-white w-full max-w-2xl rounded-3xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold">
                {genericModalMode === 'add' ? `Add ${config.label}` : genericModalMode === 'edit' ? `Edit ${config.label}` : `Delete ${config.label}`}
              </h3>
              <button onClick={() => setShowGenericModal(false)} className="text-zinc-500" aria-label="Tutup modal">✕</button>
            </div>

            {genericModalMode === 'delete' ? (
              <>
                <p className="text-xs text-zinc-600">Yakin ingin menghapus data ini? <span className="font-semibold">ID: {id}</span></p>
                <button
                  disabled={busy || !id}
                  onClick={() => run(() => apiDelete(`${config.endpoint}/${id}`), true, 'Data berhasil dihapus').then(() => setShowGenericModal(false))}
                  className="w-full border border-red-200 text-red-600 rounded-xl py-2 text-xs font-semibold"
                >
                  Hapus Data
                </button>
              </>
            ) : (
              <>
                {slug === 'hotels' ? (
                  <div className="grid grid-cols-2 gap-2">
                    <input value={hotelForm.name} onChange={(e) => setHotelForm((p) => ({ ...p, name: e.target.value }))} placeholder="Nama Hotel" className="w-full border rounded-xl px-3 py-2 text-xs col-span-2" />
                    <input value={hotelForm.code} onChange={(e) => setHotelForm((p) => ({ ...p, code: e.target.value }))} placeholder="Code" disabled={genericModalMode !== 'add'} className="w-full border rounded-xl px-3 py-2 text-xs" />
                    <input type="number" min={0} value={hotelForm.sortOrder} onChange={(e) => setHotelForm((p) => ({ ...p, sortOrder: e.target.value }))} placeholder="Sort Order" className="w-full border rounded-xl px-3 py-2 text-xs" />
                    <textarea value={hotelForm.hotelDescription} onChange={(e) => setHotelForm((p) => ({ ...p, hotelDescription: e.target.value }))} placeholder="Deskripsi Hotel" className="w-full border rounded-xl px-3 py-2 text-xs min-h-20 col-span-2" />
                    <input value={hotelForm.address} onChange={(e) => setHotelForm((p) => ({ ...p, address: e.target.value }))} placeholder="Alamat" className="w-full border rounded-xl px-3 py-2 text-xs col-span-2" />
                    <input value={hotelForm.city} onChange={(e) => setHotelForm((p) => ({ ...p, city: e.target.value }))} placeholder="Kota" className="w-full border rounded-xl px-3 py-2 text-xs" />
                    <input value={hotelForm.province} onChange={(e) => setHotelForm((p) => ({ ...p, province: e.target.value }))} placeholder="Provinsi" className="w-full border rounded-xl px-3 py-2 text-xs" />
                    <input value={hotelForm.country} onChange={(e) => setHotelForm((p) => ({ ...p, country: e.target.value }))} placeholder="Negara" className="w-full border rounded-xl px-3 py-2 text-xs" />
                    <input value={hotelForm.postalCode} onChange={(e) => setHotelForm((p) => ({ ...p, postalCode: e.target.value }))} placeholder="Kode Pos" className="w-full border rounded-xl px-3 py-2 text-xs" />
                    <input value={hotelForm.latitude} onChange={(e) => setHotelForm((p) => ({ ...p, latitude: e.target.value }))} placeholder="Latitude" className="w-full border rounded-xl px-3 py-2 text-xs" />
                    <input value={hotelForm.longitude} onChange={(e) => setHotelForm((p) => ({ ...p, longitude: e.target.value }))} placeholder="Longitude" className="w-full border rounded-xl px-3 py-2 text-xs" />
                    <input type="number" min={0} max={7} value={hotelForm.starRating} onChange={(e) => setHotelForm((p) => ({ ...p, starRating: e.target.value }))} placeholder="Star Rating" className="w-full border rounded-xl px-3 py-2 text-xs" />
                    <input value={hotelForm.phone} onChange={(e) => setHotelForm((p) => ({ ...p, phone: e.target.value }))} placeholder="Phone" className="w-full border rounded-xl px-3 py-2 text-xs" />
                    <input value={hotelForm.email} onChange={(e) => setHotelForm((p) => ({ ...p, email: e.target.value }))} placeholder="Email" className="w-full border rounded-xl px-3 py-2 text-xs" />
                    <input value={hotelForm.website} onChange={(e) => setHotelForm((p) => ({ ...p, website: e.target.value }))} placeholder="Website" className="w-full border rounded-xl px-3 py-2 text-xs" />
                    <input value={hotelForm.checkInTime} onChange={(e) => setHotelForm((p) => ({ ...p, checkInTime: e.target.value }))} placeholder="Check In Time (14:00)" className="w-full border rounded-xl px-3 py-2 text-xs" />
                    <input value={hotelForm.checkOutTime} onChange={(e) => setHotelForm((p) => ({ ...p, checkOutTime: e.target.value }))} placeholder="Check Out Time (12:00)" className="w-full border rounded-xl px-3 py-2 text-xs" />
                  </div>
                ) : slug === 'package-label-tags' ? (
                  <div className="grid grid-cols-2 gap-2">
                    <input value={packageLabelTagForm.name} onChange={(e) => setPackageLabelTagForm((p) => ({ ...p, name: e.target.value }))} placeholder="Nama Label" className="w-full border rounded-xl px-3 py-2 text-xs col-span-2" />
                    <input value={packageLabelTagForm.code} onChange={(e) => setPackageLabelTagForm((p) => ({ ...p, code: e.target.value }))} placeholder="Code (opsional saat Add)" disabled={genericModalMode !== 'add'} className="w-full border rounded-xl px-3 py-2 text-xs" />
                    <input type="number" min={0} value={packageLabelTagForm.sortOrder} onChange={(e) => setPackageLabelTagForm((p) => ({ ...p, sortOrder: e.target.value }))} placeholder="Sort Order" className="w-full border rounded-xl px-3 py-2 text-xs" />
                    <input value={packageLabelTagForm.colorHex} onChange={(e) => setPackageLabelTagForm((p) => ({ ...p, colorHex: e.target.value }))} placeholder="Color Hex (#EF4444)" className="w-full border rounded-xl px-3 py-2 text-xs" />
                    <input value={packageLabelTagForm.icon} onChange={(e) => setPackageLabelTagForm((p) => ({ ...p, icon: e.target.value }))} placeholder="Icon (contoh: ⚡)" className="w-full border rounded-xl px-3 py-2 text-xs" />
                    <input value={packageLabelTagForm.badgeText} onChange={(e) => setPackageLabelTagForm((p) => ({ ...p, badgeText: e.target.value }))} placeholder="Badge Text" className="w-full border rounded-xl px-3 py-2 text-xs" />
                    <input type="number" min={0} value={packageLabelTagForm.displayPriority} onChange={(e) => setPackageLabelTagForm((p) => ({ ...p, displayPriority: e.target.value }))} placeholder="Display Priority" className="w-full border rounded-xl px-3 py-2 text-xs" />
                    <label className="inline-flex items-center gap-2 text-xs px-2">
                      <input type="checkbox" checked={packageLabelTagForm.isPromotional} onChange={(e) => setPackageLabelTagForm((p) => ({ ...p, isPromotional: e.target.checked }))} />
                      Is Promotional
                    </label>
                    <input type="date" value={packageLabelTagForm.promoStartDate} onChange={(e) => setPackageLabelTagForm((p) => ({ ...p, promoStartDate: e.target.value }))} className="w-full border rounded-xl px-3 py-2 text-xs" />
                    <input type="date" value={packageLabelTagForm.promoEndDate} onChange={(e) => setPackageLabelTagForm((p) => ({ ...p, promoEndDate: e.target.value }))} className="w-full border rounded-xl px-3 py-2 text-xs" />
                    <textarea value={packageLabelTagForm.description} onChange={(e) => setPackageLabelTagForm((p) => ({ ...p, description: e.target.value }))} placeholder="Description" className="w-full border rounded-xl px-3 py-2 text-xs min-h-16 col-span-2" />
                  </div>
                ) : slug === 'insurance-types' ? (
                  <div className="grid grid-cols-2 gap-2">
                    <input value={insuranceTypeForm.name} onChange={(e) => setInsuranceTypeForm((p) => ({ ...p, name: e.target.value }))} placeholder="Nama Asuransi" className="w-full border rounded-xl px-3 py-2 text-xs col-span-2" />
                    <input value={insuranceTypeForm.code} onChange={(e) => setInsuranceTypeForm((p) => ({ ...p, code: e.target.value }))} placeholder="Code (opsional saat Add)" disabled={genericModalMode !== 'add'} className="w-full border rounded-xl px-3 py-2 text-xs" />
                    <input type="number" min={0} value={insuranceTypeForm.sortOrder} onChange={(e) => setInsuranceTypeForm((p) => ({ ...p, sortOrder: e.target.value }))} placeholder="Sort Order" className="w-full border rounded-xl px-3 py-2 text-xs" />
                    <input value={insuranceTypeForm.providerName} onChange={(e) => setInsuranceTypeForm((p) => ({ ...p, providerName: e.target.value }))} placeholder="Provider Name" className="w-full border rounded-xl px-3 py-2 text-xs" />
                    <input value={insuranceTypeForm.policyCode} onChange={(e) => setInsuranceTypeForm((p) => ({ ...p, policyCode: e.target.value }))} placeholder="Policy Code" className="w-full border rounded-xl px-3 py-2 text-xs" />
                    <input type="number" min={0} value={insuranceTypeForm.coverageAmount} onChange={(e) => setInsuranceTypeForm((p) => ({ ...p, coverageAmount: e.target.value }))} placeholder="Coverage Amount" className="w-full border rounded-xl px-3 py-2 text-xs" />
                    <input type="number" min={0} value={insuranceTypeForm.coverageDays} onChange={(e) => setInsuranceTypeForm((p) => ({ ...p, coverageDays: e.target.value }))} placeholder="Coverage Days" className="w-full border rounded-xl px-3 py-2 text-xs" />
                    <input type="number" min={0} value={insuranceTypeForm.basePremium} onChange={(e) => setInsuranceTypeForm((p) => ({ ...p, basePremium: e.target.value }))} placeholder="Base Premium" className="w-full border rounded-xl px-3 py-2 text-xs" />
                    <input value={insuranceTypeForm.claimPhoneNumber} onChange={(e) => setInsuranceTypeForm((p) => ({ ...p, claimPhoneNumber: e.target.value }))} placeholder="Claim Phone Number" className="w-full border rounded-xl px-3 py-2 text-xs" />
                    <input value={insuranceTypeForm.claimWebsite} onChange={(e) => setInsuranceTypeForm((p) => ({ ...p, claimWebsite: e.target.value }))} placeholder="Claim Website" className="w-full border rounded-xl px-3 py-2 text-xs col-span-2" />
                    <textarea value={insuranceTypeForm.coverageDetails} onChange={(e) => setInsuranceTypeForm((p) => ({ ...p, coverageDetails: e.target.value }))} placeholder="Coverage Details" className="w-full border rounded-xl px-3 py-2 text-xs min-h-16 col-span-2" />
                    <textarea value={insuranceTypeForm.exclusions} onChange={(e) => setInsuranceTypeForm((p) => ({ ...p, exclusions: e.target.value }))} placeholder="Exclusions" className="w-full border rounded-xl px-3 py-2 text-xs min-h-16 col-span-2" />
                    <textarea value={insuranceTypeForm.description} onChange={(e) => setInsuranceTypeForm((p) => ({ ...p, description: e.target.value }))} placeholder="Description" className="w-full border rounded-xl px-3 py-2 text-xs min-h-16 col-span-2" />
                  </div>
                ) : slug === 'company-profiles' ? (
                  <div className="grid grid-cols-2 gap-2">
                    <input value={companyProfileForm.name} onChange={(e) => setCompanyProfileForm((p) => ({ ...p, name: e.target.value }))} placeholder="Nama Perusahaan" className="w-full border rounded-xl px-3 py-2 text-xs col-span-2" />
                    <input value={companyProfileForm.provider} onChange={(e) => setCompanyProfileForm((p) => ({ ...p, provider: e.target.value }))} placeholder="Provider / Grup" className="w-full border rounded-xl px-3 py-2 text-xs" />
                    <input value={companyProfileForm.website} onChange={(e) => setCompanyProfileForm((p) => ({ ...p, website: e.target.value }))} placeholder="Website" className="w-full border rounded-xl px-3 py-2 text-xs" />
                    <textarea value={companyProfileForm.tagline} onChange={(e) => setCompanyProfileForm((p) => ({ ...p, tagline: e.target.value }))} placeholder="Tagline" className="w-full border rounded-xl px-3 py-2 text-xs min-h-16 col-span-2" />
                    <textarea value={companyProfileForm.address} onChange={(e) => setCompanyProfileForm((p) => ({ ...p, address: e.target.value }))} placeholder="Alamat" className="w-full border rounded-xl px-3 py-2 text-xs min-h-16 col-span-2" />
                    <input value={companyProfileForm.centralOfficePhone} onChange={(e) => setCompanyProfileForm((p) => ({ ...p, centralOfficePhone: e.target.value }))} placeholder="Telepon Kantor Pusat" className="w-full border rounded-xl px-3 py-2 text-xs" />
                    <input value={companyProfileForm.centralWhatsApp} onChange={(e) => setCompanyProfileForm((p) => ({ ...p, centralWhatsApp: e.target.value }))} placeholder="WhatsApp Pusat" className="w-full border rounded-xl px-3 py-2 text-xs" />
                    <input value={companyProfileForm.openTime} onChange={(e) => setCompanyProfileForm((p) => ({ ...p, openTime: e.target.value }))} placeholder="Jam Buka (08:00)" className="w-full border rounded-xl px-3 py-2 text-xs" />
                    <input value={companyProfileForm.closeTime} onChange={(e) => setCompanyProfileForm((p) => ({ ...p, closeTime: e.target.value }))} placeholder="Jam Tutup (17:00)" className="w-full border rounded-xl px-3 py-2 text-xs" />
                    <input value={companyProfileForm.instagramUrl} onChange={(e) => setCompanyProfileForm((p) => ({ ...p, instagramUrl: e.target.value }))} placeholder="Instagram URL" className="w-full border rounded-xl px-3 py-2 text-xs" />
                    <input value={companyProfileForm.facebookUrl} onChange={(e) => setCompanyProfileForm((p) => ({ ...p, facebookUrl: e.target.value }))} placeholder="Facebook URL" className="w-full border rounded-xl px-3 py-2 text-xs" />
                    <input value={companyProfileForm.tiktokUrl} onChange={(e) => setCompanyProfileForm((p) => ({ ...p, tiktokUrl: e.target.value }))} placeholder="TikTok URL" className="w-full border rounded-xl px-3 py-2 text-xs" />
                    <input value={companyProfileForm.youTubeUrl} onChange={(e) => setCompanyProfileForm((p) => ({ ...p, youTubeUrl: e.target.value }))} placeholder="YouTube URL" className="w-full border rounded-xl px-3 py-2 text-xs" />
                    <input value={companyProfileForm.threadsUrl} onChange={(e) => setCompanyProfileForm((p) => ({ ...p, threadsUrl: e.target.value }))} placeholder="Threads URL" className="w-full border rounded-xl px-3 py-2 text-xs" />
                    <input value={companyProfileForm.xUrl} onChange={(e) => setCompanyProfileForm((p) => ({ ...p, xUrl: e.target.value }))} placeholder="X (Twitter) URL" className="w-full border rounded-xl px-3 py-2 text-xs" />
                    <input value={companyProfileForm.linkedInUrl} onChange={(e) => setCompanyProfileForm((p) => ({ ...p, linkedInUrl: e.target.value }))} placeholder="LinkedIn URL" className="w-full border rounded-xl px-3 py-2 text-xs" />
                    <input value={companyProfileForm.pinterestUrl} onChange={(e) => setCompanyProfileForm((p) => ({ ...p, pinterestUrl: e.target.value }))} placeholder="Pinterest URL" className="w-full border rounded-xl px-3 py-2 text-xs" />
                  </div>
                ) : slug === 'room-type-masters' ? (
                  <div className="grid grid-cols-2 gap-2">
                    <input value={roomTypeForm.name} onChange={(e) => setRoomTypeForm((p) => ({ ...p, name: e.target.value }))} placeholder="Nama Kelas Room" className="w-full border rounded-xl px-3 py-2 text-xs col-span-2" />
                    <input value={roomTypeForm.code} onChange={(e) => setRoomTypeForm((p) => ({ ...p, code: e.target.value }))} placeholder="Code (opsional)" disabled={genericModalMode !== 'add'} className="w-full border rounded-xl px-3 py-2 text-xs" />
                    <input type="number" min={0} value={roomTypeForm.sortOrder} onChange={(e) => setRoomTypeForm((p) => ({ ...p, sortOrder: e.target.value }))} placeholder="Sort Order" className="w-full border rounded-xl px-3 py-2 text-xs" />
                    <input type="number" min={1} value={roomTypeForm.baseCapacity} onChange={(e) => setRoomTypeForm((p) => ({ ...p, baseCapacity: e.target.value }))} placeholder="Base Capacity (contoh 4)" className="w-full border rounded-xl px-3 py-2 text-xs" />
                    <input type="number" min={0} value={roomTypeForm.maxExtraBed} onChange={(e) => setRoomTypeForm((p) => ({ ...p, maxExtraBed: e.target.value }))} placeholder="Max Extra Bed" className="w-full border rounded-xl px-3 py-2 text-xs" />
                    <input type="number" min={0} step="0.1" value={roomTypeForm.minAreaSqm} onChange={(e) => setRoomTypeForm((p) => ({ ...p, minAreaSqm: e.target.value }))} placeholder="Min Area (sqm)" className="w-full border rounded-xl px-3 py-2 text-xs" />
                    <input value={roomTypeForm.bedType} onChange={(e) => setRoomTypeForm((p) => ({ ...p, bedType: e.target.value }))} placeholder="Bed Type" className="w-full border rounded-xl px-3 py-2 text-xs" />
                    <input value={roomTypeForm.viewType} onChange={(e) => setRoomTypeForm((p) => ({ ...p, viewType: e.target.value }))} placeholder="View Type" className="w-full border rounded-xl px-3 py-2 text-xs" />
                    <input value={roomTypeForm.smokingPolicy} onChange={(e) => setRoomTypeForm((p) => ({ ...p, smokingPolicy: e.target.value }))} placeholder="Smoking Policy" className="w-full border rounded-xl px-3 py-2 text-xs" />
                    <textarea value={roomTypeForm.defaultAmenities} onChange={(e) => setRoomTypeForm((p) => ({ ...p, defaultAmenities: e.target.value }))} placeholder="Default Amenities" className="w-full border rounded-xl px-3 py-2 text-xs min-h-16 col-span-2" />
                    <textarea value={roomTypeForm.description} onChange={(e) => setRoomTypeForm((p) => ({ ...p, description: e.target.value }))} placeholder="Description" className="w-full border rounded-xl px-3 py-2 text-xs min-h-20 col-span-2" />
                  </div>
                ) : slug === 'facility-masters' ? (
                  <div className="grid grid-cols-2 gap-2">
                    <input value={facilityMasterForm.name} onChange={(e) => setFacilityMasterForm((p) => ({ ...p, name: e.target.value }))} placeholder="Nama Fasilitas" className="w-full border rounded-xl px-3 py-2 text-xs col-span-2" />
                    <input value={facilityMasterForm.code} onChange={(e) => setFacilityMasterForm((p) => ({ ...p, code: e.target.value }))} placeholder="Code (opsional)" disabled={genericModalMode !== 'add'} className="w-full border rounded-xl px-3 py-2 text-xs" />
                    <input type="number" min={0} value={facilityMasterForm.sortOrder} onChange={(e) => setFacilityMasterForm((p) => ({ ...p, sortOrder: e.target.value }))} placeholder="Sort Order" className="w-full border rounded-xl px-3 py-2 text-xs" />
                    <input value={facilityMasterForm.category} onChange={(e) => setFacilityMasterForm((p) => ({ ...p, category: e.target.value }))} placeholder="Kategori" className="w-full border rounded-xl px-3 py-2 text-xs" />
                    <input value={facilityMasterForm.icon} onChange={(e) => setFacilityMasterForm((p) => ({ ...p, icon: e.target.value }))} placeholder="Icon (contoh: 📶)" className="w-full border rounded-xl px-3 py-2 text-xs" />
                    <label className="inline-flex items-center gap-2 text-xs px-2">
                      <input type="checkbox" checked={facilityMasterForm.isChargeable} onChange={(e) => setFacilityMasterForm((p) => ({ ...p, isChargeable: e.target.checked }))} />
                      Berbayar
                    </label>
                    <input type="number" min={0} step="1000" value={facilityMasterForm.basePrice} onChange={(e) => setFacilityMasterForm((p) => ({ ...p, basePrice: e.target.value }))} placeholder="Harga Dasar" className="w-full border rounded-xl px-3 py-2 text-xs" />
                    <input value={facilityMasterForm.operatingHours} onChange={(e) => setFacilityMasterForm((p) => ({ ...p, operatingHours: e.target.value }))} placeholder="Jam Operasional (contoh: 24 Jam)" className="w-full border rounded-xl px-3 py-2 text-xs" />
                    <input type="number" min={0} value={facilityMasterForm.minimumAge} onChange={(e) => setFacilityMasterForm((p) => ({ ...p, minimumAge: e.target.value }))} placeholder="Usia Minimum (opsional)" className="w-full border rounded-xl px-3 py-2 text-xs" />
                    <textarea value={facilityMasterForm.facilityDescription} onChange={(e) => setFacilityMasterForm((p) => ({ ...p, facilityDescription: e.target.value }))} placeholder="Deskripsi Fasilitas" className="w-full border rounded-xl px-3 py-2 text-xs min-h-20 col-span-2" />
                  </div>
                ) : slug === 'media-assets' ? (
                  <div className="grid grid-cols-2 gap-2">
                    <p className="text-[11px] text-zinc-500 col-span-2">Form ini untuk bank media terpusat (gallery, feeds, hero, banner promosi). Isi URL file dari server upload/CDN.</p>
                    <input value={mediaAssetForm.name} onChange={(e) => setMediaAssetForm((p) => ({ ...p, name: e.target.value }))} placeholder="Nama Media (contoh: Hero Umrah Ramadhan 2027)" className="w-full border rounded-xl px-3 py-2 text-xs col-span-2" />
                    <input value={mediaAssetForm.code} onChange={(e) => setMediaAssetForm((p) => ({ ...p, code: e.target.value }))} placeholder="Kode Media (opsional saat Add)" disabled={genericModalMode !== 'add'} className="w-full border rounded-xl px-3 py-2 text-xs" />
                    <input type="number" min={0} value={mediaAssetForm.sortOrder} onChange={(e) => setMediaAssetForm((p) => ({ ...p, sortOrder: e.target.value }))} placeholder="Urutan Tampil" className="w-full border rounded-xl px-3 py-2 text-xs" />
                    <select value={mediaAssetForm.mediaType} onChange={(e) => setMediaAssetForm((p) => ({ ...p, mediaType: e.target.value }))} className="w-full border rounded-xl px-3 py-2 text-xs bg-white">
                      <option value="image">Tipe: Image</option>
                      <option value="video">Tipe: Video</option>
                      <option value="document">Tipe: Document</option>
                      <option value="audio">Tipe: Audio</option>
                    </select>
                    <input value={mediaAssetForm.mimeType} onChange={(e) => setMediaAssetForm((p) => ({ ...p, mimeType: e.target.value }))} placeholder="MIME Type (contoh: image/webp)" className="w-full border rounded-xl px-3 py-2 text-xs" />
                    <input value={mediaAssetForm.fileUrl} onChange={(e) => setMediaAssetForm((p) => ({ ...p, fileUrl: e.target.value }))} placeholder="URL File Utama (/uploads/... atau https://...)" className="w-full border rounded-xl px-3 py-2 text-xs col-span-2" />
                    <input value={mediaAssetForm.thumbnailUrl} onChange={(e) => setMediaAssetForm((p) => ({ ...p, thumbnailUrl: e.target.value }))} placeholder="URL Thumbnail (opsional)" className="w-full border rounded-xl px-3 py-2 text-xs col-span-2" />
                    <input type="number" min={0} value={mediaAssetForm.fileSizeBytes} onChange={(e) => setMediaAssetForm((p) => ({ ...p, fileSizeBytes: e.target.value }))} placeholder="Ukuran File (bytes)" className="w-full border rounded-xl px-3 py-2 text-xs" />
                    <input value={mediaAssetForm.storageProvider} onChange={(e) => setMediaAssetForm((p) => ({ ...p, storageProvider: e.target.value }))} placeholder="Storage Provider (contoh: LocalStorage / R2)" className="w-full border rounded-xl px-3 py-2 text-xs" />
                    <input type="number" min={0} value={mediaAssetForm.width} onChange={(e) => setMediaAssetForm((p) => ({ ...p, width: e.target.value }))} placeholder="Lebar (px)" className="w-full border rounded-xl px-3 py-2 text-xs" />
                    <input type="number" min={0} value={mediaAssetForm.height} onChange={(e) => setMediaAssetForm((p) => ({ ...p, height: e.target.value }))} placeholder="Tinggi (px)" className="w-full border rounded-xl px-3 py-2 text-xs" />
                    <input type="number" min={0} value={mediaAssetForm.durationSeconds} onChange={(e) => setMediaAssetForm((p) => ({ ...p, durationSeconds: e.target.value }))} placeholder="Durasi (detik, utk video/audio)" className="w-full border rounded-xl px-3 py-2 text-xs" />
                    <input value={mediaAssetForm.externalId} onChange={(e) => setMediaAssetForm((p) => ({ ...p, externalId: e.target.value }))} placeholder="External ID (opsional)" className="w-full border rounded-xl px-3 py-2 text-xs" />
                    <input value={mediaAssetForm.altText} onChange={(e) => setMediaAssetForm((p) => ({ ...p, altText: e.target.value }))} placeholder="Alt Text / Deskripsi Aksesibilitas" className="w-full border rounded-xl px-3 py-2 text-xs col-span-2" />
                    <textarea value={mediaAssetForm.description} onChange={(e) => setMediaAssetForm((p) => ({ ...p, description: e.target.value }))} placeholder="Deskripsi Media untuk tim konten" className="w-full border rounded-xl px-3 py-2 text-xs min-h-20 col-span-2" />
                  </div>
                ) : slug === 'program-templates' ? (
                  <div className="grid grid-cols-2 gap-2">
                    <input value={programTemplateForm.name} onChange={(e) => setProgramTemplateForm((p) => ({ ...p, name: e.target.value }))} placeholder="Nama Template Program" className="w-full border rounded-xl px-3 py-2 text-xs col-span-2" />
                    <input value={programTemplateForm.code} onChange={(e) => setProgramTemplateForm((p) => ({ ...p, code: e.target.value }))} placeholder="Code (opsional saat Add)" disabled={genericModalMode !== 'add'} className="w-full border rounded-xl px-3 py-2 text-xs" />
                    <input type="number" min={0} value={programTemplateForm.sortOrder} onChange={(e) => setProgramTemplateForm((p) => ({ ...p, sortOrder: e.target.value }))} placeholder="Sort Order" className="w-full border rounded-xl px-3 py-2 text-xs" />
                    <input type="number" min={1} value={programTemplateForm.durationDays} onChange={(e) => setProgramTemplateForm((p) => ({ ...p, durationDays: e.target.value }))} placeholder="Durasi Hari" className="w-full border rounded-xl px-3 py-2 text-xs" />
                    <input value={programTemplateForm.departureCity} onChange={(e) => setProgramTemplateForm((p) => ({ ...p, departureCity: e.target.value }))} placeholder="Kota Keberangkatan" className="w-full border rounded-xl px-3 py-2 text-xs" />
                    <input value={programTemplateForm.startMonth} onChange={(e) => setProgramTemplateForm((p) => ({ ...p, startMonth: e.target.value }))} placeholder="Mulai Bulan" className="w-full border rounded-xl px-3 py-2 text-xs" />
                    <input value={programTemplateForm.endMonth} onChange={(e) => setProgramTemplateForm((p) => ({ ...p, endMonth: e.target.value }))} placeholder="Akhir Bulan" className="w-full border rounded-xl px-3 py-2 text-xs" />
                    <input type="number" min={2024} value={programTemplateForm.departureYear} onChange={(e) => setProgramTemplateForm((p) => ({ ...p, departureYear: e.target.value }))} placeholder="Tahun Keberangkatan" className="w-full border rounded-xl px-3 py-2 text-xs" />
                    <label className="inline-flex items-center gap-2 text-xs px-2 col-span-2">
                      <input type="checkbox" checked={programTemplateForm.isActive} onChange={(e) => setProgramTemplateForm((p) => ({ ...p, isActive: e.target.checked }))} />
                      Template aktif
                    </label>
                    <textarea value={programTemplateForm.description} onChange={(e) => setProgramTemplateForm((p) => ({ ...p, description: e.target.value }))} placeholder="Deskripsi Program Template" className="w-full border rounded-xl px-3 py-2 text-xs min-h-20 col-span-2" />
                  </div>
                ) : slug === 'poster-type-masters' ? (
                  <div className="grid grid-cols-2 gap-2">
                    <input value={posterTypeMasterForm.name} onChange={(e) => setPosterTypeMasterForm((p) => ({ ...p, name: e.target.value }))} placeholder="Nama Tipe Poster" className="w-full border rounded-xl px-3 py-2 text-xs col-span-2" />
                    <input value={posterTypeMasterForm.code} onChange={(e) => setPosterTypeMasterForm((p) => ({ ...p, code: e.target.value }))} placeholder="Code (opsional saat Add)" disabled={genericModalMode !== 'add'} className="w-full border rounded-xl px-3 py-2 text-xs" />
                    <input type="number" min={0} value={posterTypeMasterForm.sortOrder} onChange={(e) => setPosterTypeMasterForm((p) => ({ ...p, sortOrder: e.target.value }))} placeholder="Sort Order" className="w-full border rounded-xl px-3 py-2 text-xs" />
                    <label className="inline-flex items-center gap-2 text-xs px-2 col-span-2">
                      <input type="checkbox" checked={posterTypeMasterForm.isActive} onChange={(e) => setPosterTypeMasterForm((p) => ({ ...p, isActive: e.target.checked }))} />
                      Tipe poster aktif
                    </label>
                    <textarea value={posterTypeMasterForm.description} onChange={(e) => setPosterTypeMasterForm((p) => ({ ...p, description: e.target.value }))} placeholder="Deskripsi Tipe Poster" className="w-full border rounded-xl px-3 py-2 text-xs min-h-20 col-span-2" />
                  </div>
                ) : slug === 'duration-types' ? (
                  <div className="grid grid-cols-2 gap-2">
                    <input value={durationTypeForm.name} onChange={(e) => setDurationTypeForm((p) => ({ ...p, name: e.target.value }))} placeholder="Nama Durasi (contoh: Umrah 12 Hari)" className="w-full border rounded-xl px-3 py-2 text-xs col-span-2" />
                    <input value={durationTypeForm.code} onChange={(e) => setDurationTypeForm((p) => ({ ...p, code: e.target.value }))} placeholder="Code (opsional saat Add)" disabled={genericModalMode !== 'add'} className="w-full border rounded-xl px-3 py-2 text-xs" />
                    <input type="number" min={0} value={durationTypeForm.durationSortOrder} onChange={(e) => setDurationTypeForm((p) => ({ ...p, durationSortOrder: e.target.value }))} placeholder="Urutan Durasi" className="w-full border rounded-xl px-3 py-2 text-xs" />
                    <input type="number" min={1} value={durationTypeForm.defaultDays} onChange={(e) => setDurationTypeForm((p) => ({ ...p, defaultDays: e.target.value }))} placeholder="Default Hari" className="w-full border rounded-xl px-3 py-2 text-xs" />
                    <input type="number" min={0} value={durationTypeForm.defaultNights} onChange={(e) => setDurationTypeForm((p) => ({ ...p, defaultNights: e.target.value }))} placeholder="Default Malam" className="w-full border rounded-xl px-3 py-2 text-xs" />
                    <input value={durationTypeForm.displayFormat} onChange={(e) => setDurationTypeForm((p) => ({ ...p, displayFormat: e.target.value }))} placeholder="Display Format (contoh: {days} Hari {nights} Malam)" className="w-full border rounded-xl px-3 py-2 text-xs col-span-2" />
                    <textarea value={durationTypeForm.description} onChange={(e) => setDurationTypeForm((p) => ({ ...p, description: e.target.value }))} placeholder="Deskripsi Duration Type" className="w-full border rounded-xl px-3 py-2 text-xs min-h-20 col-span-2" />
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    <input value={genericForm.name} onChange={(e) => setGenericForm((p) => ({ ...p, name: e.target.value }))} placeholder="Name" className="w-full border rounded-xl px-3 py-2 text-xs col-span-2" />
                    <input value={genericForm.code} onChange={(e) => setGenericForm((p) => ({ ...p, code: e.target.value }))} placeholder="Code" className="w-full border rounded-xl px-3 py-2 text-xs" />
                    <input value={genericForm.slug} onChange={(e) => setGenericForm((p) => ({ ...p, slug: e.target.value }))} placeholder="Slug" className="w-full border rounded-xl px-3 py-2 text-xs" />
                    <input value={genericForm.city} onChange={(e) => setGenericForm((p) => ({ ...p, city: e.target.value }))} placeholder="City" className="w-full border rounded-xl px-3 py-2 text-xs" />
                    <input value={genericForm.country} onChange={(e) => setGenericForm((p) => ({ ...p, country: e.target.value }))} placeholder="Country" className="w-full border rounded-xl px-3 py-2 text-xs" />
                    <input value={genericForm.iataCode} onChange={(e) => setGenericForm((p) => ({ ...p, iataCode: e.target.value }))} placeholder="IATA Code" className="w-full border rounded-xl px-3 py-2 text-xs" />
                    <input value={genericForm.icaoCode} onChange={(e) => setGenericForm((p) => ({ ...p, icaoCode: e.target.value }))} placeholder="ICAO Code" className="w-full border rounded-xl px-3 py-2 text-xs" />
                    <input value={genericForm.sortOrder} onChange={(e) => setGenericForm((p) => ({ ...p, sortOrder: e.target.value }))} placeholder="Sort Order" className="w-full border rounded-xl px-3 py-2 text-xs" />
                    <label className="inline-flex items-center gap-2 text-xs px-2">
                      <input type="checkbox" checked={genericForm.isActive} onChange={(e) => setGenericForm((p) => ({ ...p, isActive: e.target.checked }))} />
                      Aktif
                    </label>
                    <textarea value={genericForm.description} onChange={(e) => setGenericForm((p) => ({ ...p, description: e.target.value }))} placeholder="Description" className="w-full border rounded-xl px-3 py-2 text-xs min-h-20 col-span-2" />
                    <textarea value={genericForm.metadata} onChange={(e) => setGenericForm((p) => ({ ...p, metadata: e.target.value }))} placeholder="Metadata" className="w-full border rounded-xl px-3 py-2 text-xs min-h-16 col-span-2" />
                  </div>
                )}
                <button
                  disabled={busy || (genericModalMode === 'edit' && !id)}
                  onClick={() => run(
                    () => genericModalMode === 'add'
                      ? apiPost(config.endpoint, slug === 'hotels' ? hotelPayloadFromForm(hotelForm, genericModalMode) : slug === 'package-label-tags' ? packageLabelTagPayloadFromForm(packageLabelTagForm, genericModalMode) : slug === 'insurance-types' ? insuranceTypePayloadFromForm(insuranceTypeForm, genericModalMode) : slug === 'company-profiles' ? companyProfilePayloadFromForm(companyProfileForm) : slug === 'room-type-masters' ? roomTypePayloadFromForm(roomTypeForm, genericModalMode) : slug === 'facility-masters' ? facilityMasterPayloadFromForm(facilityMasterForm, genericModalMode) : slug === 'media-assets' ? mediaAssetPayloadFromForm(mediaAssetForm, genericModalMode) : slug === 'program-templates' ? programTemplatePayloadFromForm(programTemplateForm, genericModalMode) : slug === 'poster-type-masters' ? posterTypeMasterPayloadFromForm(posterTypeMasterForm, genericModalMode) : slug === 'duration-types' ? durationTypePayloadFromForm(durationTypeForm, genericModalMode) : genericPayloadFromForm(genericForm))
                      : apiPut(`${config.endpoint}/${id}`, slug === 'hotels' ? hotelPayloadFromForm(hotelForm, genericModalMode, id) : slug === 'package-label-tags' ? packageLabelTagPayloadFromForm(packageLabelTagForm, genericModalMode, id) : slug === 'insurance-types' ? insuranceTypePayloadFromForm(insuranceTypeForm, genericModalMode, id) : slug === 'company-profiles' ? companyProfilePayloadFromForm(companyProfileForm) : slug === 'room-type-masters' ? roomTypePayloadFromForm(roomTypeForm, genericModalMode, id) : slug === 'facility-masters' ? facilityMasterPayloadFromForm(facilityMasterForm, genericModalMode, id) : slug === 'media-assets' ? mediaAssetPayloadFromForm(mediaAssetForm, genericModalMode, id) : slug === 'program-templates' ? programTemplatePayloadFromForm(programTemplateForm, genericModalMode, id) : slug === 'poster-type-masters' ? posterTypeMasterPayloadFromForm(posterTypeMasterForm, genericModalMode, id) : slug === 'duration-types' ? durationTypePayloadFromForm(durationTypeForm, genericModalMode, id) : genericPayloadFromForm(genericForm)),
                    true,
                    genericModalMode === 'add' ? 'Data berhasil ditambahkan' : 'Data berhasil diperbarui',
                  ).then(() => setShowGenericModal(false))}
                  className="w-full border rounded-xl py-2 text-xs font-semibold"
                >
                  {genericModalMode === 'add' ? 'Tambah Data' : 'Simpan Perubahan'}
                </button>
              </>
            )}
          </div>
      </ModalShell>
    </div>
  );
}

