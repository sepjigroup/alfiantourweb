'use client';

import { useToast } from './Toast';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { useLeadsTrack } from '@/hooks/useLeadsTrack';
import { SUPERADMIN_WHATSAPP } from '@/lib/leads';

interface AgenCardProps {
  username?: string;
  name: string;
  initial: string;
  verified: boolean;
  city: string;
  code?: string;
  whatsApp?: string;
  rating: number;
  reviews: number;
}

function normalizeWa(input?: string): string {
  const digits = String(input ?? '').replace(/\D/g, '');
  return digits;
}

function buildWaUrl(number: string, message?: string): string {
  const base = `https://wa.me/${number}`;
  if (!message) return base;
  return `${base}?text=${encodeURIComponent(message)}`;
}

export function AgenCard({ username, name, initial, verified, city, code, whatsApp, rating, reviews }: AgenCardProps) {
  const { show } = useToast();
  const { trackEvent } = useLeadsTrack();
  const [sent, setSent] = useState(false);

  const handleContact = () => {
    const message = `ASSALAMU'ALAIKUM ${name} (${city}), saya ingin konsultasi mengenai travel alfiantour.com , terimakasih.`;
    const targetWa = normalizeWa(whatsApp) || SUPERADMIN_WHATSAPP;
    const waUrl = buildWaUrl(targetWa, message);
    trackEvent('wa_click', targetWa);
    window.open(waUrl, '_blank', 'noopener,noreferrer');
    setSent(true);
    show('Pesan terkirim ke WhatsApp');
    setTimeout(() => setSent(false), 2000);
  };

  return (
    <div className="bg-white rounded-3xl p-4 flex items-center gap-4 border hover:shadow-md transition-shadow">
      {/* Avatar */}
      <div className="w-12 h-12 g-main rounded-2xl flex items-center justify-center text-white text-base font-bold flex-shrink-0">
        {initial}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        {username ? (
          <a
            href={`/id/${encodeURIComponent(username)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-sm truncate hover:text-primary-700"
          >
            {name}
          </a>
        ) : (
          <div className="font-semibold text-sm truncate">{name}</div>
        )}
        <div className="text-[10px] text-emerald-500 flex items-center gap-1 mt-0.5">
          {verified && <span className="text-xs">✓</span>}
          <span>{verified ? 'Verified' : ''} • {city}</span>
        </div>
        <div className="text-[10px] text-zinc-400 mt-0.5">
          {rating} ★ • {reviews} ulasan
        </div>
        {code ? (
          <div className="text-[10px] text-zinc-500 mt-0.5">
            Kode Cabang: {code}
          </div>
        ) : null}
      </div>

      {/* Contact */}
      <div className="flex shrink-0 items-center gap-2">
        {username ? (
          <a
            href={`/id/reg/${encodeURIComponent(username)}`}
            className="rounded-2xl border border-primary-200 bg-white px-3 py-2.5 text-[11px] font-semibold text-primary-700 transition-all hover:border-primary-400 hover:bg-primary-50"
          >
            Register
          </a>
        ) : null}
        <button
          onClick={handleContact}
          className={cn(
            'text-white text-[11px] px-4 py-2.5 rounded-2xl font-semibold transition-all',
            sent ? 'bg-emerald-500' : 'g-main hover:opacity-90'
          )}
        >
          {sent ? '✓ Terkirim' : 'Hubungi WA'}
        </button>
      </div>
    </div>
  );
}
