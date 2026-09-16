'use client';

import { useEffect, useState } from "react";
import Image from "next/image";
import { BackButton } from "@/components/BackButton";
import { Link, useRouter } from "@/i18n/routing-patch";
import { getWishlist, removeFromWishlist, type WishlistItem } from "@/lib/wishlist";

export default function WishlistClient() {
  const router = useRouter();
  const [items, setItems] = useState<WishlistItem[]>([]);

  useEffect(() => {
    setItems(getWishlist());
  }, []);

  const onRemove = (id: string) => {
    removeFromWishlist(id);
    setItems(getWishlist());
  };

  return (
    <div className="p-4 space-y-4 animate-fade-up">
      <div className="flex items-center gap-3 pt-2">
        <BackButton />
        <h1 className="text-lg font-extrabold">Wishlist</h1>
      </div>
      {items.length === 0 ? (
        <div className="rounded-2xl border bg-white p-4">
          <p className="text-sm text-zinc-600">
            Belum ada item wishlist. Simpan paket favoritmu dari halaman detail paket.
          </p>
        </div>
      ) : null}
      <div className="space-y-2">
        {items.map((item) => (
          <div key={item.id} className="rounded-2xl border bg-white p-3">
            <div className="flex gap-3">
              <button type="button" className="w-24 h-20 rounded-xl overflow-hidden border bg-zinc-50 relative shrink-0" onClick={() => router.push(`/pack/${item.slug}`)}>
                <Image src={item.image} alt={item.title} fill className="object-cover" unoptimized />
              </button>
              <div className="min-w-0 flex-1">
                <Link href={`/pack/${item.slug}`} className="text-sm font-bold line-clamp-2">{item.title}</Link>
                <div className="text-[11px] text-zinc-500 mt-1">{item.duration || '-'}</div>
                <div className="text-[11px] text-zinc-700 mt-0.5">Mulai Rp {Number(item.priceFrom || 0).toLocaleString('id-ID')}</div>
                <div className="flex gap-2 mt-2">
                  <Link href={`/pack/${item.slug}`} className="border rounded-lg px-2.5 py-1 text-[11px] font-semibold">Lihat Detail</Link>
                  <button type="button" onClick={() => onRemove(item.id)} className="border border-red-200 text-red-600 rounded-lg px-2.5 py-1 text-[11px] font-semibold">Hapus</button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

