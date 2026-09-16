import { AUTH_STORAGE_KEY } from './auth';

// Configuration for API Base URL
const IS_PRODUCTION = process.env.NODE_ENV === 'production';
const ENV_API_URL = process.env.NEXT_PUBLIC_API_URL?.trim();
const DEV_API_URL = 'http://localhost:5054';
const PROD_API_URL = 'https://api-alfiantour.sepji.net';

export const API_BASE_URL = ENV_API_URL || (IS_PRODUCTION ? PROD_API_URL : DEV_API_URL);
const SUPPRESS_UNAUTHORIZED_REDIRECT_UNTIL_KEY = 'travelapp_suppress_unauth_redirect_until';

type JsonBody = Record<string, unknown> | Array<Record<string, unknown>>;

export function getApiBaseUrl() {
  return API_BASE_URL;
}

export function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(AUTH_STORAGE_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as { token?: string };
    return parsed.token ?? null;
  } catch {
    return null;
  }
}

function handleUnauthorizedRedirect() {
  if (typeof window === 'undefined') return;
  const suppressUntil = Number(window.sessionStorage.getItem(SUPPRESS_UNAUTHORIZED_REDIRECT_UNTIL_KEY) || '0');
  if (Number.isFinite(suppressUntil) && suppressUntil > Date.now()) return;
  const path = window.location.pathname || '';
  if (/\/(owner-login|login|register|forgot-password|401)(\/|$)/.test(path)) return;

  localStorage.removeItem(AUTH_STORAGE_KEY);
  const segments = path.split('/').filter(Boolean);
  const locale = segments[0] || 'id';
  const returnUrl = `${window.location.pathname}${window.location.search || ''}`;
  const loginUrl = `/${locale}/login?returnUrl=${encodeURIComponent(returnUrl)}`;
  window.location.replace(loginUrl);
}

export function suppressUnauthorizedRedirect(ms = 4000) {
  if (typeof window === 'undefined') return;
  window.sessionStorage.setItem(
    SUPPRESS_UNAUTHORIZED_REDIRECT_UNTIL_KEY,
    String(Date.now() + Math.max(500, ms))
  );
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getAuthToken();
  const headers = new Headers(init?.headers ?? {});
  if (!headers.has('Content-Type') && init?.body) headers.set('Content-Type', 'application/json');
  if (token) headers.set('Authorization', `Bearer ${token}`);

  const res = await fetch(`${API_BASE_URL}${path}`, { ...init, headers });

  const text = await res.text();
  let json: unknown = null;
  if (text) {
    try {
      json = JSON.parse(text);
    } catch {
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      json = { raw: text };
    }
  }

  if (!res.ok) {
    if (res.status === 401) handleUnauthorizedRedirect();
    const errObj = json as {
      message?: string;
      errors?: Array<{ message?: string }> | Record<string, string[] | string>;
      title?: string;
    } | null;
    let detailed = '';
    if (Array.isArray(errObj?.errors)) {
      detailed = errObj?.errors?.find((x) => x?.message)?.message ?? '';
    } else if (errObj?.errors && typeof errObj.errors === 'object') {
      const first = Object.values(errObj.errors)[0];
      if (Array.isArray(first)) detailed = String(first[0] ?? '');
      else if (typeof first === 'string') detailed = first;
    }
    const message = detailed || errObj?.message || errObj?.title || `HTTP ${res.status}`;
    throw new Error(message);
  }

  return json as T;
}

export async function apiGet<T>(path: string): Promise<T> {
  return request<T>(path);
}

export async function apiPost<T>(path: string, body?: JsonBody): Promise<T> {
  return request<T>(path, { method: 'POST', body: body ? JSON.stringify(body) : undefined });
}

export async function apiPut<T>(path: string, body?: JsonBody): Promise<T> {
  return request<T>(path, { method: 'PUT', body: body ? JSON.stringify(body) : undefined });
}

export async function apiDelete<T>(path: string): Promise<T> {
  return request<T>(path, { method: 'DELETE' });
}
