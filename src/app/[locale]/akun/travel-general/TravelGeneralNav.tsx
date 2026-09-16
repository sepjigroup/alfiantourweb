'use client';

import { Link, usePathname } from '@/i18n/routing-patch';

const items = [
  { href: '/akun/travel-general', label: 'Dashboard' },
  { href: '/akun/travel-general/product-types', label: 'Tipe Produk' },
  { href: '/akun/travel-general/itineraries', label: 'Itinerary' },
  { href: '/akun/travel-general/suppliers', label: 'Supplier' },
  { href: '/akun/travel-general/pricing', label: 'Pricing & Kurs' },
];

export default function TravelGeneralNav() {
  const pathname = usePathname();
  return (
    <div className="bg-white border rounded-2xl p-2 flex gap-2 overflow-x-auto">
      {items.map((x) => {
        const active = pathname.endsWith(x.href);
        return (
          <Link
            key={x.href}
            href={x.href}
            className={`whitespace-nowrap rounded-xl px-3 py-2 text-xs border ${active ? 'bg-zinc-900 text-white border-zinc-900' : 'hover:bg-zinc-50'}`}
          >
            {x.label}
          </Link>
        );
      })}
    </div>
  );
}

