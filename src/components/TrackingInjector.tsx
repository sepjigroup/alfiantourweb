'use client';

import { useEffect } from 'react';
import { API_BASE_URL } from '@/lib/api-client';
import { usePathname } from 'next/navigation';

type TrackingPublic = {
  metaPixel?: string;
  xCom?: string;
  linkedIn?: string;
  tiktok?: string;
  googleAds?: string;
  googleAdsense?: string;
};

const CACHE_KEY = 'tracking_public_cache_v1';
const CACHE_TTL_MS = 120_000;
const TRACKING_UPDATED_EVENT = 'tracking-updated';

function appendInlineScript(id: string, content: string) {
  if (document.getElementById(id)) return;
  const script = document.createElement('script');
  script.id = id;
  script.text = content;
  document.head.appendChild(script);
}

function appendExternalScript(id: string, src: string) {
  if (document.getElementById(id)) return;
  const script = document.createElement('script');
  script.id = id;
  script.src = src;
  script.async = true;
  document.head.appendChild(script);
}

function removeScript(id: string) {
  const el = document.getElementById(id);
  if (el && el.parentNode) el.parentNode.removeChild(el);
}

function normalize(v?: string) {
  return (v ?? '').trim();
}

function pickMetaPixelId(raw: string): string {
  const v = normalize(raw);
  if (!v) return '';
  const m = v.match(/(\d{6,})/);
  return m?.[1] ?? '';
}

function pickGoogleAdsId(raw: string): string {
  const v = normalize(raw).toUpperCase();
  if (!v) return '';
  const m = v.match(/AW-\d{4,}/);
  if (m?.[0]) return m[0];
  const digits = v.match(/\d{4,}/)?.[0];
  return digits ? `AW-${digits}` : '';
}

function pickAdsenseClient(raw: string): string {
  const v = normalize(raw);
  if (!v) return '';
  const m = v.match(/ca-pub-\d{6,}/i);
  return m?.[0] ?? v;
}

function pickLinkedInPartnerId(raw: string): string {
  const v = normalize(raw);
  if (!v) return '';
  if (/^\d+$/.test(v)) return v;
  const m = v.match(/(?:partner|id)[=/](\d{4,})/i);
  return m?.[1] ?? '';
}

function pickTikTokPixelId(raw: string): string {
  const v = normalize(raw);
  if (!v) return '';
  // common pixel id is alphanumeric, no URL separators
  if (/^[A-Za-z0-9_-]{8,}$/.test(v)) return v;
  const m = v.match(/[?&](?:pixel_id|pixelId|id)=([A-Za-z0-9_-]{8,})/i);
  return m?.[1] ?? '';
}

function pickXPixelId(raw: string): string {
  const v = normalize(raw);
  if (!v) return '';
  // Twitter/X pixel id usually alphanumeric short code
  if (/^[A-Za-z0-9]{4,20}$/.test(v) && !/^https?:\/\//i.test(v)) return v;
  const m = v.match(/[?&](?:id|pixel|pixel_id)=([A-Za-z0-9]{4,20})/i);
  return m?.[1] ?? '';
}

export function TrackingInjector() {
  const pathname = usePathname();

  useEffect(() => {
    const isFeedsPage = /^\/[^/]+\/feeds(?:\/|$)/i.test(String(pathname || ''));
    const applyTracking = (data: TrackingPublic) => {
      const metaPixelRaw = normalize(data.metaPixel);
      const googleAdsRaw = normalize(data.googleAds);
      const googleAdsenseRaw = normalize(data.googleAdsense);
      const linkedInRaw = normalize(data.linkedIn);
      const tiktokRaw = normalize(data.tiktok);
      const xComRaw = normalize(data.xCom);
      const metaPixel = pickMetaPixelId(metaPixelRaw);
      const googleAds = pickGoogleAdsId(googleAdsRaw);
      const googleAdsense = pickAdsenseClient(googleAdsenseRaw);
      const linkedInPartnerId = pickLinkedInPartnerId(linkedInRaw);
      const tiktokPixelId = pickTikTokPixelId(tiktokRaw);
      const xPixelId = pickXPixelId(xComRaw);

      if (metaPixel) {
        appendExternalScript('meta-pixel-lib', 'https://connect.facebook.net/en_US/fbevents.js');
        appendInlineScript(
          'meta-pixel-init',
          `!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];}(window,document,'script');fbq('init','${metaPixel}');fbq('track','PageView');`,
        );
      }

      if (googleAds) {
        appendExternalScript('google-gtag-lib', `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(googleAds)}`);
        appendInlineScript(
          'google-gtag-init',
          `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)};gtag('js',new Date());gtag('config','${googleAds}');`,
        );
      }

      if (googleAdsense && isFeedsPage) {
        appendExternalScript(
          'google-adsense-lib',
          `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(googleAdsense)}`,
        );
      } else {
        removeScript('google-adsense-lib');
      }

      if (linkedInPartnerId) {
        appendInlineScript('linkedin-partner-init', `window._linkedin_data_partner_ids=window._linkedin_data_partner_ids||[];window._linkedin_data_partner_ids.push('${linkedInPartnerId}');`);
        appendExternalScript('linkedin-partner-lib', 'https://snap.licdn.com/li.lms-analytics/insight.min.js');
      }
      if (linkedInRaw) {
        appendInlineScript('linkedin-raw-meta', `window.__alfian_linkedin='${linkedInRaw.replace(/'/g, "\\'")}';`);
      }

      if (tiktokPixelId) {
        appendInlineScript(
          'tiktok-pixel-init',
          `!function(w,d,t){w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=['page','track','identify','instances','debug','on','off','once','ready','alias','group','enableCookie','disableCookie'];ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.load=function(e){var n='https://analytics.tiktok.com/i18n/pixel/events.js';ttq._i=ttq._i||{};ttq._i[e]=[];ttq._i[e]._u=n;ttq._t=ttq._t||{};ttq._t[e]=+new Date;ttq._o=ttq._o||{};ttq._o[e]={};var o=d.createElement('script');o.type='text/javascript';o.async=!0;o.src=n+'?sdkid='+e+'&lib='+t;var a=d.getElementsByTagName('script')[0];a.parentNode.insertBefore(o,a)};ttq.load('${tiktokPixelId}');ttq.page();}(window,document,'ttq');`,
        );
      }
      if (tiktokRaw) {
        appendInlineScript('tiktok-raw-meta', `window.__alfian_tiktok='${tiktokRaw.replace(/'/g, "\\'")}';`);
      }

      if (xPixelId) {
        appendInlineScript(
          'x-pixel-init',
          `!function(e,t,n,s,u,a){e.twq||(s=e.twq=function(){s.exe?s.exe.apply(s,arguments):s.queue.push(arguments);},s.version='1.1',s.queue=[],u=t.createElement(n),u.async=!0,u.src='https://static.ads-twitter.com/uwt.js',a=t.getElementsByTagName(n)[0],a.parentNode.insertBefore(u,a));}(window,document,'script');twq('config','${xPixelId}');`
        );
      }
      if (xComRaw) {
        appendInlineScript('xcom-tracking-meta', `window.__alfian_xcom='${xComRaw.replace(/'/g, "\\'")}';`);
      }
    };

    const readCache = () => {
      try {
        const raw = sessionStorage.getItem(CACHE_KEY);
        if (!raw) return null;
        const parsed = JSON.parse(raw) as { ts: number; data: TrackingPublic };
        if (Date.now() - parsed.ts > CACHE_TTL_MS) return null;
        return parsed.data;
      } catch {
        return null;
      }
    };

    const writeCache = (data: TrackingPublic) => {
      try {
        sessionStorage.setItem(CACHE_KEY, JSON.stringify({ ts: Date.now(), data }));
      } catch {
        // ignore cache write failures
      }
    };

    const run = async (forceRefresh = false) => {
      if (!forceRefresh) {
        const cached = readCache();
        if (cached) {
          applyTracking(cached);
          return;
        }
      }
      try {
        const res = await fetch(`${API_BASE_URL}/api/BusinessInsights/settings/tracking/public`, { cache: 'no-store' });
        if (!res.ok) return;
        const json = await res.json();
        const data = (json?.data ?? {}) as TrackingPublic;
        writeCache(data);
        applyTracking(data);
      } catch {
        // ignore fetch failures
      }
    };

    void run();
    const onUpdated = () => { void run(true); };
    window.addEventListener(TRACKING_UPDATED_EVENT, onUpdated);
    return () => window.removeEventListener(TRACKING_UPDATED_EVENT, onUpdated);
  }, [pathname]);

  return null;
}
