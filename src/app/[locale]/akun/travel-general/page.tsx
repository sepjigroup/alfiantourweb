'use client';

import { Link } from '@/i18n/routing-patch';
import TravelGeneralNav from './TravelGeneralNav';

export default function TravelGeneralPage() {
  return (
    <div className="p-4 space-y-4 animate-fade-up">
      <div className="bg-white border rounded-3xl p-5 space-y-1">
        <h1 className="text-lg font-extrabold g-text">Travel Umum (Opsional)</h1>
        <p className="text-xs text-zinc-500">
          Modul terpisah untuk Wisata Domestik & Mancanegara. Tidak mengubah alur Umrah/Haji yang sudah berjalan.
        </p>
      </div>

      <TravelGeneralNav />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Link href="/akun/travel-general/product-types" className="bg-white border rounded-2xl p-4 hover:bg-zinc-50">
          <div className="text-sm font-bold">Tipe Produk Travel Umum</div>
          <div className="text-xs text-zinc-500 mt-1">Flight-only, Hotel-only, Open Trip, Private Trip, Land Tour.</div>
        </Link>
        <Link href="/akun/travel-general/itineraries" className="bg-white border rounded-2xl p-4 hover:bg-zinc-50">
          <div className="text-sm font-bold">Itinerary Harian</div>
          <div className="text-xs text-zinc-500 mt-1">Rencana hari-ke-hari per kota/negara + optional tour.</div>
        </Link>
        <Link href="/akun/travel-general/suppliers" className="bg-white border rounded-2xl p-4 hover:bg-zinc-50">
          <div className="text-sm font-bold">Supplier & Allotment</div>
          <div className="text-xs text-zinc-500 mt-1">Kontrak hotel/airline/transport, season rate, release date.</div>
        </Link>
        <Link href="/akun/travel-general/pricing" className="bg-white border rounded-2xl p-4 hover:bg-zinc-50">
          <div className="text-sm font-bold">Pricing, Kurs, Pajak</div>
          <div className="text-xs text-zinc-500 mt-1">Multi-currency, kurs, biaya negara, margin program.</div>
        </Link>
      </div>
    </div>
  );
}
