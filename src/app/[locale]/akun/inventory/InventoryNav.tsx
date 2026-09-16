'use client';

import { Link, usePathname } from '@/i18n/routing-patch';

const menus = [
  { href: '/akun/inventory', label: 'Dashboard' },
  { href: '/akun/inventory/items', label: 'Item' },
  { href: '/akun/inventory/movements', label: 'Movement' },
  { href: '/akun/inventory/balances', label: 'Balance' },
  { href: '/akun/inventory/requests', label: 'Request' },
];

export default function InventoryNav() {
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
