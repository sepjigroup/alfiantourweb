"use client";

import { useMemo, useState, useEffect, Suspense } from "react";
import { useLocale } from "next-intl";
import { useRouter } from "@/i18n/routing-patch";
import { useSearchParams } from "next/navigation";
import { dummyPacks } from "@/lib/utils";
import { PackCard } from "@/components/PackCard";
import { BackButton } from "@/components/BackButton";

interface ServiceItem {
  key: string;
  icon: string;
  label: { id: string; en: string; ar: string };
  desc: { id: string; en: string; ar: string };
  categories: string[];
}

const serviceItems: ServiceItem[] = [
  {
    key: "umroh-haji",
    icon: "🕋",
    label: { id: "Umroh & Haji", en: "Umrah & Hajj", ar: "العمرة والحج" },
    desc: { id: "Paket ibadah, pendampingan jamaah, manasik, visa, hotel, dan transportasi tanah suci.", en: "Pilgrimage packages, guidance, visa, hotel, and holy-land transport.", ar: "برامج الحج والعمرة مع الإرشاد والتأشيرة والفنادق والنقل." },
    categories: ["umrah", "haji", "religi", "handling", "guide"]
  },
  {
    key: "tour-domestik-internasional",
    icon: "✈️",
    label: { id: "Tour Domestik & Internasional", en: "Domestic & International Tours", ar: "جولات محلية ودولية" },
    desc: { id: "Paket wisata umum untuk destinasi Indonesia dan luar negeri.", en: "General tour packages for Indonesia and international destinations.", ar: "برامج سياحية محلية ودولية." },
    categories: ["wisata", "corporate", "edukasi", "guide"]
  },
  {
    key: "tiket-pesawat-kereta-kapal",
    icon: "🎫",
    label: { id: "Tiket Pesawat, Kereta & Kapal", en: "Flight, Train & Ship Tickets", ar: "تذاكر الطيران والقطار والسفن" },
    desc: { id: "Reservasi tiket perjalanan untuk kebutuhan pribadi, rombongan, dan korporat.", en: "Ticket reservations for personal, group, and corporate travel.", ar: "حجز تذاكر السفر للأفراد والمجموعات والشركات." },
    categories: ["tiket", "transport"]
  },
  {
    key: "reservasi-hotel-akomodasi",
    icon: "🏨",
    label: { id: "Reservasi Hotel & Akomodasi", en: "Hotel & Accommodation", ar: "حجز الفنادق والإقامة" },
    desc: { id: "Hotel, penginapan, dan akomodasi pendukung paket perjalanan.", en: "Hotels, lodging, and accommodation for travel packages.", ar: "الفنادق والإقامة الداعمة للرحلات." },
    categories: ["hotel"]
  },
  {
    key: "visa-dokumen-perjalanan",
    icon: "🛂",
    label: { id: "Visa & Dokumen Perjalanan", en: "Visa & Travel Documents", ar: "التأشيرات ووثائق السفر" },
    desc: { id: "Pengurusan visa, dokumen perjalanan, dan kebutuhan administrasi keberangkatan.", en: "Visa, travel documents, and departure administration.", ar: "إجراءات التأشيرات ووثائق السفر." },
    categories: ["visa"]
  },
  {
    key: "transportasi-rental-kendaraan",
    icon: "🚌",
    label: { id: "Transportasi & Rental Kendaraan", en: "Transport & Vehicle Rental", ar: "النقل وتأجير المركبات" },
    desc: { id: "Partner bus, shuttle, rental kendaraan, open trip, dan charter armada.", en: "Bus partners, shuttle, vehicle rental, open trip, and charter.", ar: "النقل والحافلات وتأجير المركبات." },
    categories: ["transport"]
  },
  {
    key: "gathering-outbound-corporate-trip",
    icon: "🏕️",
    label: { id: "Gathering, Outbound & Corporate Trip", en: "Gathering, Outbound & Corporate Trip", ar: "رحلات الشركات والأنشطة الجماعية" },
    desc: { id: "Perjalanan rombongan perusahaan, outing, outbound, dan incentive trip.", en: "Company group travel, outing, outbound, and incentive trips.", ar: "رحلات الشركات والأنشطة الجماعية." },
    categories: ["corporate", "wisata"]
  },
  {
    key: "study-tour-wisata-edukasi",
    icon: "🎓",
    label: { id: "Study Tour & Wisata Edukasi", en: "Study Tour & Educational Trip", ar: "رحلات تعليمية" },
    desc: { id: "Program wisata edukasi untuk sekolah, kampus, pesantren, dan komunitas.", en: "Educational trips for schools, campuses, pesantren, and communities.", ar: "رحلات تعليمية للمدارس والجامعات والمجتمعات." },
    categories: ["edukasi", "wisata"]
  },
  {
    key: "wisata-religi-ziarah",
    icon: "🕌",
    label: { id: "Wisata Religi & Ziarah", en: "Religious & Pilgrimage Tour", ar: "السياحة الدينية والزيارة" },
    desc: { id: "Ziarah, wisata religi, dan perjalanan spiritual dalam/luar negeri.", en: "Religious visits and spiritual travel domestic or abroad.", ar: "زيارات دينية ورحلات روحية." },
    categories: ["religi", "wisata"]
  },
  {
    key: "event-perjalanan-mice",
    icon: "🎤",
    label: { id: "Event Perjalanan (MICE)", en: "Travel Events (MICE)", ar: "فعاليات السفر والمؤتمرات" },
    desc: { id: "Meeting, incentive, conference, exhibition, dan event perjalanan.", en: "Meeting, incentive, conference, exhibition, and travel events.", ar: "الاجتماعات والحوافز والمؤتمرات والمعارض." },
    categories: ["mice", "corporate"]
  },
];

function LayananPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const locale = useLocale() as "id" | "en" | "ar";
  
  const queryCat = searchParams.get("category");
  const [activeCategory, setActiveCategory] = useState("all");

  useEffect(() => {
    if (queryCat) {
      setActiveCategory(queryCat);
    } else {
      setActiveCategory("all");
    }
  }, [queryCat]);

  const serviceCategories = useMemo(
    () => [
      { key: "all", label: { id: "Semua", en: "All", ar: "الكل" } },
      { key: "umrah", label: { id: "Umrah", en: "Umrah", ar: "عمرة" } },
      { key: "haji", label: { id: "Haji", en: "Hajj", ar: "حج" } },
      { key: "wisata", label: { id: "Wisata", en: "Tour", ar: "سياحة" } },
      { key: "tiket", label: { id: "Tiket", en: "Ticket", ar: "تذاكر" } },
      { key: "hotel", label: { id: "Hotel", en: "Hotel", ar: "فندق" } },
      { key: "visa", label: { id: "Visa", en: "Visa", ar: "تأشيرة" } },
      { key: "handling", label: { id: "Handling", en: "Handling", ar: "خدمة ميدانية" } },
      { key: "guide", label: { id: "Muthawif", en: "Guide", ar: "مرشد" } },
      { key: "transport", label: { id: "Transport", en: "Transport", ar: "نقل" } },
      { key: "corporate", label: { id: "Corporate", en: "Corporate", ar: "شركات" } },
      { key: "edukasi", label: { id: "Edukasi", en: "Education", ar: "تعليمي" } },
      { key: "religi", label: { id: "Religi", en: "Religious", ar: "ديني" } },
      { key: "mice", label: { id: "MICE", en: "MICE", ar: "فعاليات" } },
    ],
    [],
  );

  const handleCategoryChange = (key: string) => {
    setActiveCategory(key);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      if (key === "all") {
        url.searchParams.delete("category");
      } else {
        url.searchParams.set("category", key);
      }
      window.history.replaceState(null, "", url.pathname + url.search);
    }
  };

  const filteredServiceItems = useMemo(() => {
    if (activeCategory === "all") return serviceItems;
    return serviceItems.filter((item) =>
      item.categories.includes(activeCategory),
    );
  }, [activeCategory]);

  const filteredPacks = useMemo(() => {
    if (activeCategory === "all") return dummyPacks;
    const mapped = {
      umrah: ["Umrah"],
      haji: ["Haji"],
      wisata: ["Cairo", "Wisata", "Tour"],
      tiket: ["Airlines"],
      hotel: ["Umrah", "Haji"],
      visa: ["Umrah"],
      handling: ["Umrah", "Haji"],
      guide: ["Umrah", "Haji"],
      transport: ["Cairo", "Umrah"],
      corporate: ["Tour", "Wisata"],
      edukasi: ["Tour", "Wisata"],
      religi: ["Umrah", "Haji"],
      mice: ["Tour", "Wisata"],
    } as Record<string, string[]>;
    return dummyPacks.filter((p) =>
      (mapped[activeCategory] ?? []).some((k) => p.title.includes(k)),
    );
  }, [activeCategory]);

  return (
    <div className="p-4 space-y-4 animate-fade-up">
      <div className="flex items-center gap-3 pt-2">
        <BackButton />
        <h1 className="text-lg font-extrabold text-zinc-950">Layanan</h1>
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {serviceCategories.map((c) => (
          <button
            key={c.key}
            onClick={() => handleCategoryChange(c.key)}
            className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap border transition-all ${
              activeCategory === c.key
                ? "bg-primary-600 text-white border-primary-600 shadow-sm"
                : "bg-white text-zinc-600 border-zinc-200 hover:border-zinc-300"
            }`}
          >
            {c.label[locale]}
          </button>
        ))}
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {filteredServiceItems.length === 0 ? (
          <div className="col-span-2 text-center py-12 text-zinc-400 text-xs">
            Belum ada layanan yang ditawarkan untuk kategori ini.
          </div>
        ) : (
          filteredServiceItems.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => router.push(`/layanan/${item.key}`)}
              className="rounded-3xl border bg-white p-4 text-left shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md border-zinc-200/80 hover:border-zinc-300"
            >
              <div className="flex gap-3">
                <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-zinc-50 border border-zinc-100 text-2xl shadow-sm">{item.icon}</div>
                <div>
                  <h2 className="text-sm font-extrabold text-zinc-900 leading-snug">{item.label[locale]}</h2>
                  <p className="mt-1 text-xs leading-relaxed text-zinc-500 font-medium">{item.desc[locale]}</p>
                </div>
              </div>
            </button>
          ))
        )}
      </div>

      <div className="flex items-center justify-between pt-2">
        <h2 className="text-sm font-extrabold text-zinc-900">Paket Terkait</h2>
        <span className="text-[10px] font-bold text-primary-600 bg-primary-50 px-2 py-0.5 rounded-md border border-primary-100">
          {activeCategory === "all" ? "Semua Layanan" : serviceCategories.find((x) => x.key === activeCategory)?.label[locale]}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {filteredPacks.length === 0 ? (
          <div className="col-span-2 text-center py-8 text-zinc-400 text-xs">
            Tidak ada paket perjalanan terkait saat ini.
          </div>
        ) : (
          filteredPacks.map((pack) => (
            <PackCard
              key={pack.id}
              {...pack}
              onDetail={() => router.push(`/pack/${pack.id}`)}
            />
          ))
        )}
      </div>
    </div>
  );
}

export default function LayananPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-zinc-500">Memuat halaman layanan...</div>}>
      <LayananPageContent />
    </Suspense>
  );
}
