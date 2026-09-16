'use client';

import { useEffect } from 'react';

export function ProductReferralCookieBridge({ username }: { username?: string | null }) {
  useEffect(() => {
    const refUser = String(username || '').trim().replace(/^@/, '');
    if (!refUser || typeof document === 'undefined') return;
    const maxAge = 60 * 60 * 24 * 15;
    document.cookie = `ref_agent=${encodeURIComponent(refUser)}; Max-Age=${maxAge}; Path=/; SameSite=Lax`;
  }, [username]);

  return null;
}
