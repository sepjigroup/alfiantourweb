'use client';

import { useEffect, useMemo, useState } from 'react';

export type PublicCurrencyCode = 'IDR' | 'USD' | 'SAR' | 'MYR';
const STORAGE_KEY = 'travelapp_currency';
const EVENT_NAME = 'travelapp-currency-changed';
const SUPPORTED: PublicCurrencyCode[] = ['IDR', 'USD', 'SAR', 'MYR'];

type CurrencyRates = { usd: number; sar: number; myr: number };

const DEFAULT_RATES: CurrencyRates = { usd: 0, sar: 0, myr: 0 };

const toCode = (raw: string | null | undefined): PublicCurrencyCode => {
  const upper = String(raw || 'IDR').toUpperCase();
  if (SUPPORTED.includes(upper as PublicCurrencyCode)) return upper as PublicCurrencyCode;
  return 'IDR';
};

export function setPublicCurrency(code: string) {
  const normalized = toCode(code);
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEY, normalized);
  window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: normalized }));
}

export function usePublicCurrency(locale: string) {
  const [currency, setCurrency] = useState<PublicCurrencyCode>('IDR');
  const [rates, setRates] = useState<CurrencyRates>(DEFAULT_RATES);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const current = toCode(window.localStorage.getItem(STORAGE_KEY));
    setCurrency(current);
    const onChange = (ev: Event) => {
      const next = toCode((ev as CustomEvent<string>).detail);
      setCurrency(next);
    };
    const onStorage = () => setCurrency(toCode(window.localStorage.getItem(STORAGE_KEY)));
    window.addEventListener(EVENT_NAME, onChange as EventListener);
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener(EVENT_NAME, onChange as EventListener);
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  useEffect(() => {
    let mounted = true;
    fetch('https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/idr.json', { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .then((json) => {
        if (!mounted || !json?.idr) return;
        setRates({
          usd: Number(json.idr.usd || 0),
          sar: Number(json.idr.sar || 0),
          myr: Number(json.idr.myr || 0),
        });
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, []);

  const formatCompactIdr = useMemo(() => {
    return (idrAmount: number): string => {
      const idr = Math.max(0, Number(idrAmount || 0));
      if (idr >= 1_000_000) {
        const jt = Math.floor((idr / 1_000_000) * 100) / 100;
        const text = jt.toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
        return `${text}jt`;
      }
      if (idr >= 1_000) {
        const rb = Math.floor((idr / 1_000) * 100) / 100;
        const text = rb.toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
        return `${text}rb`;
      }
      return idr.toLocaleString('id-ID');
    };
  }, []);

  const formatPrice = useMemo(() => {
    return (idrAmount: number, compactIdr = false): string => {
      const idr = Math.max(0, Number(idrAmount || 0));
      if (currency === 'IDR') return compactIdr ? `Rp ${formatCompactIdr(idr)}` : `Rp ${idr.toLocaleString('id-ID')}`;
      const rate = currency === 'USD' ? rates.usd : currency === 'SAR' ? rates.sar : rates.myr;
      if (!(rate > 0)) return `Rp ${idr.toLocaleString('id-ID')}`;
      const converted = idr * rate;
      const targetLocale = currency === 'USD' ? 'en-US' : currency === 'SAR' ? 'ar-SA' : 'ms-MY';
      return new Intl.NumberFormat(targetLocale, { style: 'currency', currency, maximumFractionDigits: 2 }).format(converted);
    };
  }, [currency, rates, formatCompactIdr]);

  return { currency, formatPrice, formatCompactIdr };
}

export const PUBLIC_CURRENCY_EVENT_NAME = EVENT_NAME;
