"use client";

import { cn, toAbsoluteUrl } from "@/lib/utils";
import { GalleryModal } from "./GalleryModal";
import { useState } from "react";

interface PackCardProps {
  id: number;
  title: string;
  date: string;
  duration: string;
  price: string;
  priceIdr?: number;
  seats: number;
  totalSeats?: number;
  image: string;
  images?: string[];
  badge?: "flash" | "promo" | "hot";
  variant?: "grid" | "list";
  airline?: string;
  showPriceStartLabel?: boolean;
  onDetail?: () => void;
}

export function PackCard({
  id,
  title,
  date,
  duration,
  price,
  priceIdr,
  seats,
  totalSeats = seats,
  image,
  images = [],
  badge,
  variant = "grid",
  airline,
  showPriceStartLabel = false,
  onDetail,
}: PackCardProps) {
  const [galleryOpen, setGalleryOpen] = useState(false);
  const showPrice =
    typeof priceIdr === "number"
      ? priceIdr > 0
      : Boolean(String(price || "").trim());
  const remainingPercent = Math.max(
    0,
    Math.min(100, Math.round((seats / Math.max(1, totalSeats)) * 100)),
  );
  const absoluteImage = toAbsoluteUrl(image);
  const galleryItems = images.length > 0 ? images.map(toAbsoluteUrl) : [absoluteImage];

  const badgeEl = badge ? (
    <span
      className={cn(
        "absolute top-2 left-2 text-white text-[10px] px-2.5 py-0.5 rounded-full font-bold z-10",
        badge === "flash" && "badge-sale",
        badge === "promo" && "badge-promo",
        badge === "hot" && "badge-hot",
      )}
    >
      {badge === "flash"
        ? "⚡ Flash Sale"
        : badge === "promo"
          ? "Promo"
          : "Hot"}
    </span>
  ) : null;

  const fallbackImg =
    "https://placehold.co/600x400/BE40DD/FFFFFF.png?text=AlfianTour.Com";

  if (variant === "list") {
    return (
      <>
        <div className="w-full bg-white rounded-3xl overflow-hidden border hover:shadow-lg transition-shadow">
          <div
            onClick={onDetail}
            className="h-40 cursor-pointer relative overflow-hidden"
          >
            <img
              src={absoluteImage}
              alt={title}
              loading="lazy"
              decoding="async"
              className="h-full w-full object-cover"
              onError={(e) => {
                e.currentTarget.src = fallbackImg;
              }}
            />
            {badgeEl}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setGalleryOpen(true);
              }}
              className="absolute top-2 right-2 z-20 rounded-full bg-white/90 text-zinc-900 w-8 h-8 flex items-center justify-center text-sm border border-zinc-200 shadow-sm"
              aria-label="Lihat semua gambar"
            >
              <svg
                viewBox="0 0 24 24"
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden="true"
              >
                <rect x="3" y="5" width="18" height="14" rx="2" />
                <circle cx="9" cy="10" r="1.5" />
                <path d="M21 16l-5.5-5.5L10 16l-2-2-5 5" />
              </svg>
            </button>
            <span className="absolute bottom-3 left-3 bg-white/30 backdrop-blur text-white text-[10px] px-3 py-1 rounded-full font-semibold">
              {date.split(" • ")[0]}
            </span>
            <div className="absolute bottom-3 right-3 text-white font-semibold text-sm drop-shadow">
              {title}
            </div>
          </div>
          <div
            onClick={onDetail}
            className="p-4 flex justify-between items-center cursor-pointer active:opacity-90"
          >
            <div>
              <div className="text-xs text-zinc-500">{duration}</div>
              {showPrice ? (
                <div className="text-base font-bold mt-0.5">{price}</div>
              ) : null}
            </div>
            <div className="text-xs text-emerald-600 font-semibold">
              Tersisa {seats} / {totalSeats} kursi
            </div>
          </div>
        </div>
        <GalleryModal
          open={galleryOpen}
          onClose={() => setGalleryOpen(false)}
          images={galleryItems}
          mode="stack"
        />
      </>
    );
  }

  return (
    <>
      <div
        onClick={onDetail}
        className="w-full bg-white rounded-3xl overflow-hidden border hover:shadow-lg transition-shadow cursor-pointer"
      >
        <div className="h-40 relative overflow-hidden">
          <img
            src={absoluteImage}
            alt={title}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover"
            onError={(e) => {
              e.currentTarget.src = fallbackImg;
            }}
          />
          {badgeEl}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setGalleryOpen(true);
            }}
            className="absolute top-2 right-2 z-20 rounded-full bg-white/90 text-zinc-900 w-8 h-8 flex items-center justify-center text-sm border border-zinc-200 shadow-sm"
            aria-label="Lihat semua gambar"
          >
            <svg
              viewBox="0 0 24 24"
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
            >
              <rect x="3" y="5" width="18" height="14" rx="2" />
              <circle cx="9" cy="10" r="1.5" />
              <path d="M21 16l-5.5-5.5L10 16l-2-2-5 5" />
            </svg>
          </button>
        </div>
        <div className="p-3 active:opacity-90">
          <div className="text-[12px] font-extrabold uppercase leading-snug line-clamp-2 min-h-[2.2rem]">
            {title}
          </div>
          <div className="text-[11px] text-zinc-600 mt-1 line-clamp-2">
            📅 Berangkat: {date}
          </div>
          {airline ? (
            <div className="text-[11px] text-zinc-600 mt-0.5 line-clamp-1">
              ✈️ {airline}
            </div>
          ) : null}
          {seats > 0 ? (
            <div className="text-[10px] text-emerald-600 mt-0.5 font-semibold">
              Sisa Seat : {seats}
            </div>
          ) : null}
          {seats > 0 ? (
            <div className="mt-1 h-1.5 w-full rounded-full bg-zinc-200 overflow-hidden">
              <div
                className="h-full rounded-full bg-emerald-500 transition-all"
                style={{ width: `${remainingPercent}%` }}
              />
            </div>
          ) : null}
          {showPrice && showPriceStartLabel ? (
            <div className="text-[10px] text-zinc-500 mt-2">Harga mulai :</div>
          ) : null}
          {showPrice ? (
            <div className="text-sm font-bold mt-0.5">{price}</div>
          ) : null}
        </div>
      </div>
      <GalleryModal
        open={galleryOpen}
        onClose={() => setGalleryOpen(false)}
        images={galleryItems}
        mode="stack"
      />
    </>
  );
}
