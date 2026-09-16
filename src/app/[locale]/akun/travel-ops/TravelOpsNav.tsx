'use client';

import { Link, usePathname } from '@/i18n/routing-patch';

const menus = [
  { href: '/akun/travel-ops', label: 'Dashboard' },
  { href: '/akun/travel-ops/booking', label: 'Booking+Invoice' },
  { href: '/akun/travel-ops/departure', label: 'Departure Ops' },
  { href: '/akun/travel-ops/supplier', label: 'Supplier Ops' },
  { href: '/akun/travel-ops/support', label: 'Support SLA' },
  { href: '/akun/travel-ops/finance', label: 'Finance Closing' },
];

export default function TravelOpsNav() {
  const pathname = usePathname();
  return (
    <div className="overflow-x-auto">
      <div className="flex gap-2 min-w-max">
        {menus.map((m) => {
          const active = pathname === m.href || pathname.startsWith(`${m.href}/`);
          return (
            <Link
              key={m.href}
              href={m.href}
              className={`px-3 py-2 rounded-xl text-xs border ${active ? 'bg-zinc-900 text-white border-zinc-900' : 'bg-white text-zinc-700 border-zinc-300'}`}
            >
              {m.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}

