import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { API_BASE_URL } from "./api-client";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const galleryImages = [
  "https://picsum.photos/id/1015/800/1200",
  "https://picsum.photos/id/201/800/1200",
  "https://picsum.photos/id/301/800/1200",
  "https://picsum.photos/id/401/800/1200",
  "https://picsum.photos/id/501/800/1200",
  "https://picsum.photos/id/601/800/1200",
];

export const heroSlides = [
  {
    title: { id: "Umrah Haji 2026", en: "Umrah Hajj 2026", ar: "عمرة حج 2026" },
    subtitle: {
      id: "Ethiopian Airlines • 9 Jun",
      en: "Ethiopian Airlines • 9 Jun",
      ar: "الخطوط الإثيوبية • 9 يونيو",
    },
    icon: "🕋",
    gradient: "from-[#7C3AED] to-[#3B82F6]",
  },
  {
    title: {
      id: "Paket Wisata + Umrah",
      en: "Tour + Umrah Package",
      ar: "باقة سياحة + عمرة",
    },
    subtitle: {
      id: "Cairo & Makkah",
      en: "Cairo & Makkah",
      ar: "القاهرة ومكة",
    },
    icon: "✈️",
    gradient: "from-[#7C3AED] to-[#60A5FA]",
  },
];

export const categories = [
  { key: "umrah", icon: "🕋", gradient: "from-[#7C3AED] to-[#60A5FA]" },
  { key: "haji", icon: "🕋", gradient: "from-[#7C3AED] to-[#3B82F6]" },
  { key: "wisata", icon: "🏞️", gradient: "from-[#7C3AED] to-[#60A5FA]" },
  { key: "tiket", icon: "✈️", gradient: "from-[#7C3AED] to-[#3B82F6]" },
  { key: "hotel", icon: "🏨", gradient: "from-[#7C3AED] to-[#60A5FA]" },
];

export const dummyPacks = [
  {
    id: 1,
    title: "Umrah Ethiopian Airlines",
    date: "9 Jun 2026",
    duration: "12 Hari",
    price: "Rp 26.9jt",
    seats: 211,
    totalSeats: 300,
    image: "https://picsum.photos/id/1015/400/300",
    badge: "flash",
  },
  {
    id: 2,
    title: "Umrah + Cairo",
    date: "1 Jul 2026",
    duration: "14 Hari",
    price: "Rp 27.9jt",
    seats: 477,
    totalSeats: 550,
    image: "https://picsum.photos/id/201/400/300",
    badge: "promo",
  },
  {
    id: 3,
    title: "Umrah 12 Hari",
    date: "12 Jun 2026",
    duration: "12 Hari",
    price: "Rp 25.5jt",
    seats: 150,
    totalSeats: 250,
    image: "https://picsum.photos/id/301/400/300",
    badge: "hot",
  },
  {
    id: 4,
    title: "Haji Khusus",
    date: "20 Jun 2026",
    duration: "25 Hari",
    price: "Rp 89.9jt",
    seats: 80,
    totalSeats: 120,
    image: "https://picsum.photos/id/401/400/300",
    badge: "promo",
  },
] as const;

export const dummyFeeds = [
  {
    id: 1,
    time: "2 jam lalu",
    title: "Haji Mabrur Impian Setiap Muslim",
    image: "https://picsum.photos/id/101/400/200",
  },
  {
    id: 2,
    time: "kemarin",
    title: "Tips Lengkap Agar Tak Kesasar di Masjidil Haram",
    image: "https://picsum.photos/id/102/400/200",
  },
  {
    id: 3,
    time: "2 hari lalu",
    title: "Persiapan Fisik Sebelum Berangkat Umrah",
    image: "https://picsum.photos/id/103/400/200",
  },
  {
    id: 4,
    time: "3 hari lalu",
    title: "Keutamaan Umrah di Bulan Ramadhan",
    image: "https://picsum.photos/id/104/400/200",
  },
];

export const dummyAgents = [
  {
    id: 1,
    name: "Alfian Tour Official",
    initial: "AT",
    verified: true,
    city: "Bandung",
    rating: 4.9,
    reviews: 124,
  },
  {
    id: 2,
    name: "Makkah Travel",
    initial: "MT",
    verified: true,
    city: "Jakarta",
    rating: 5.0,
    reviews: 89,
  },
  {
    id: 3,
    name: "Barokah Umrah",
    initial: "BU",
    verified: true,
    city: "Surabaya",
    rating: 4.8,
    reviews: 56,
  },
  {
    id: 4,
    name: "Madinah Trip",
    initial: "MD",
    verified: false,
    city: "Medan",
    rating: 4.7,
    reviews: 32,
  },
];

export function toAbsoluteUrl(raw?: string | null): string {
  const val = String(raw ?? '').trim();
  if (!val) return '';
  if (val.startsWith('http://') || val.startsWith('https://') || val.startsWith('data:')) return val;
  const api = API_BASE_URL || 'https://api-alfiantour.sepji.net';
  return `${api}${val.startsWith('/') ? '' : '/'}${val}`;
}

