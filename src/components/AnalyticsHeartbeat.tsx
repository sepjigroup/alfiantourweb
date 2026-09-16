'use client';

import { useEffect } from 'react';

function getOrCreateSessionId() {
  const key = 'leads_session';
  const existing = sessionStorage.getItem(key);
  if (existing) return existing;
  const id = crypto.randomUUID();
  sessionStorage.setItem(key, id);
  return id;
}

export function AnalyticsHeartbeat() {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const sessionId = getOrCreateSessionId();

    const send = () => {
      void fetch('/api/analytics/heartbeat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          currentPage: window.location.pathname,
          lastSeen: new Date().toISOString(),
        }),
        keepalive: true,
      }).catch(() => {});
    };

    send();
    const interval = setInterval(send, 20_000);
    const onVisibility = () => {
      if (document.visibilityState === 'visible') send();
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);

  return null;
}

