'use client';

import { useCallback } from 'react';

function getCookieValue(name: string): string | null {
  const cookies = document.cookie ? document.cookie.split('; ') : [];
  for (const row of cookies) {
    const idx = row.indexOf('=');
    if (idx < 0) continue;
    const key = row.slice(0, idx);
    if (key !== name) continue;
    return decodeURIComponent(row.slice(idx + 1));
  }
  return null;
}

function getOrCreateLeadSessionId(): string {
  const key = 'leads_session';
  const existing = sessionStorage.getItem(key);
  if (existing) return existing;
  const id = crypto.randomUUID();
  sessionStorage.setItem(key, id);
  return id;
}

export function useLeadsTrack() {
  const trackEvent = useCallback((eventType: string, targetWhatsApp?: string, meta?: Record<string, unknown>) => {
    if (typeof window === 'undefined') return;

    try {
      const refAgentUsername = getCookieValue('ref_agent');
      const sessionId = getOrCreateLeadSessionId();
      const pageUrl = window.location.pathname;
      const ttq = (window as any).ttq;
      const fbq = (window as any).fbq;
      if (ttq && typeof ttq.track === 'function') {
        if (eventType === 'page_view') {
          ttq.track('ViewContent', { content_type: 'product', content_id: pageUrl });
        } else if (eventType === 'wa_click') {
          ttq.track('Contact', { content_type: 'product', content_id: pageUrl, channel: 'whatsapp', target: targetWhatsApp || '' });
        } else if (eventType === 'init_checkout') {
          ttq.track('InitiateCheckout', { content_type: 'product', content_id: pageUrl, ...meta });
        } else if (eventType === 'booking_submit') {
          ttq.track('SubmitForm', { content_type: 'product', content_id: pageUrl, ...meta });
        } else if (eventType === 'share_click') {
          ttq.track('Share', { content_type: 'product', content_id: pageUrl });
        } else if (eventType === 'ad_click') {
          ttq.track('ClickButton', { content_type: 'product', content_id: pageUrl, ...meta });
        }
      }
      if (fbq && typeof fbq === 'function') {
        if (eventType === 'page_view') {
          fbq('track', 'ViewContent', { content_type: 'product', content_ids: [pageUrl] });
        } else if (eventType === 'wa_click') {
          fbq('track', 'Contact', { content_type: 'product', content_ids: [pageUrl], channel: 'whatsapp', target: targetWhatsApp || '' });
        } else if (eventType === 'init_checkout') {
          fbq('track', 'InitiateCheckout', { content_type: 'product', content_ids: [pageUrl], ...(meta ?? {}) });
        } else if (eventType === 'booking_submit') {
          fbq('track', 'Lead', { content_type: 'product', content_ids: [pageUrl], ...(meta ?? {}) });
        } else if (eventType === 'share_click') {
          fbq('trackCustom', 'Share', { content_type: 'product', content_ids: [pageUrl] });
        } else if (eventType === 'ad_click') {
          fbq('trackCustom', 'ClickButton', { content_type: 'product', content_ids: [pageUrl], ...(meta ?? {}) });
        }
      }

      void fetch('/api/leads/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          refAgentUsername,
          eventType,
          pageUrl,
          sessionId,
          targetWhatsApp,
          metadata: meta ?? null,
        }),
      }).catch(() => {});
    } catch {
      // fire-and-forget: swallow error
    }
  }, []);

  return { trackEvent };
}
