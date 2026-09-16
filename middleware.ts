import createMiddleware from 'next-intl/middleware';
import { NextRequest, NextResponse } from 'next/server';
import { routing } from './src/i18n/routing';

const intlMiddleware = createMiddleware(routing);
const REF_COOKIE_NAME = 'ref_agent';
const REF_COOKIE_MAX_AGE = 60 * 60 * 24 * 15;
const RESERVED_ROOT_SEGMENTS = new Set([
  'id', 'en', 'ar', 'api', '_next', 'favicon.ico', 'robots.txt', 'sitemap.xml', 'ads.txt',
  'about', 'agen', 'akun', 'contact', 'feeds', 'information', 'layanan', 'owner-login', 'pack', 'testimoni', 'video',
  'karir', 'toko', 'produk-lain', 'register', 'login', 'forgot-password', 'transport', 'materi', 'events', 'event-reg'
]);

function extractRootReferral(pathname: string): string | null {
  const seg = pathname.split('/').filter(Boolean)[0];
  if (!seg) return null;
  if (RESERVED_ROOT_SEGMENTS.has(seg.toLowerCase())) return null;
  const normalized = seg.startsWith('@') ? seg.slice(1) : seg;
  if (!/^[a-zA-Z0-9._-]+$/.test(normalized)) return null;
  return normalized;
}

function extractLocaleReferral(pathname: string): string | null {
  const seg = pathname.split('/').filter(Boolean);
  if (seg.length >= 3 && routing.locales.includes(seg[0] as 'id' | 'en' | 'ar') && seg[1].toLowerCase() === 'ref') {
    const normalized = (seg[2] || '').replace(/^@/, '');
    if (/^[a-zA-Z0-9._-]+$/.test(normalized)) return normalized;
  }
  return null;
}

function maybeSetRefCookie(response: NextResponse, request: NextRequest, username: string) {
  const existing = request.cookies.get(REF_COOKIE_NAME)?.value?.trim();
  if (existing) return;
  response.cookies.set(REF_COOKIE_NAME, username, {
    path: '/',
    maxAge: REF_COOKIE_MAX_AGE,
    httpOnly: false,
  });
}

export default function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const rootReferral = extractRootReferral(pathname);
  if (rootReferral) {
    const target = request.nextUrl.clone();
    target.pathname = `/id/ref/${rootReferral}`;
    const redirect = NextResponse.redirect(target, 307);
    maybeSetRefCookie(redirect, request, rootReferral);
    return redirect;
  }

  const refUsername = extractLocaleReferral(pathname);
  const response = intlMiddleware(request);
  if (refUsername) {
    maybeSetRefCookie(response, request, refUsername);
  }
  return response;
}

export const config = {
  matcher: [
    '/((?!_next|api|.*\\..*).*)',
  ],
};
