'use client';

import { useCallback, useEffect, useState } from 'react';
import { API_BASE_URL } from './api-client';

export const AUTH_STORAGE_KEY = 'travelapp_auth';
const AKUN_BOOTSTRAP_CACHE_PREFIX = 'akun_bootstrap_v1';

type ApiEnvelope<T> = {
  isSuccess?: boolean;
  message?: string;
  data?: T;
};

type LoginPayload = {
  Token?: string;
  token?: string;
  User?: {
    Id?: string;
    UserName?: string;
    Email?: string;
    FullName?: string;
    Avatar?: string;
    WhatsApp?: string;
  };
  user?: {
    id?: string;
    userName?: string;
    email?: string;
    fullName?: string;
    avatar?: string;
    whatsApp?: string;
  };
};

type MeProfilePayload = {
  id?: string;
  userName?: string;
  email?: string;
  fullName?: string;
  avatar?: string;
  whatsApp?: string;
};

export interface AuthUser {
  id: string;
  userName: string;
  name: string;
  email: string;
  picture: string;
  roles: string[];
}

type AuthState = {
  token: string;
  user: AuthUser;
};

async function apiPost<T>(path: string, body: unknown): Promise<ApiEnvelope<T>> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const text = await res.text();
  let json: ApiEnvelope<T> = {};
  if (text) {
    try {
      json = JSON.parse(text) as ApiEnvelope<T>;
    } catch {
      json = {};
    }
  }
  if (!res.ok || json.isSuccess === false) throw new Error(json.message ?? 'Request failed');
  return json;
}

async function apiGet<T>(path: string): Promise<ApiEnvelope<T>> {
  const res = await fetch(`${API_BASE_URL}${path}`);
  const text = await res.text();
  let json: ApiEnvelope<T> = {};
  if (text) {
    try {
      json = JSON.parse(text) as ApiEnvelope<T>;
    } catch {
      json = {};
    }
  }
  if (!res.ok || json.isSuccess === false) throw new Error(json.message ?? 'Request failed');
  return json;
}

async function apiGetAuth<T>(path: string, token: string): Promise<ApiEnvelope<T>> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const text = await res.text();
  let json: ApiEnvelope<T> = {};
  if (text) {
    try {
      json = JSON.parse(text) as ApiEnvelope<T>;
    } catch {
      json = {};
    }
  }
  if (!res.ok || json.isSuccess === false) throw new Error(json.message ?? 'Request failed');
  return json;
}

function normalizeRole(role: string): string {
  return role.trim().toLowerCase();
}

function isEmail(value: string): boolean {
  return value.includes('@');
}

function toUsernameCandidate(raw: string): string {
  const trimmed = raw.trim();
  const localPart = trimmed.includes('@') ? trimmed.split('@')[0] : trimmed;
  return localPart.replace(/[^a-zA-Z0-9._-]/g, '');
}

function extractRolesFromToken(token: string): string[] {
  try {
    const part = token.split('.')[1] ?? '';
    if (!part) return [];
    const base64 = part.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
    const json = JSON.parse(atob(padded)) as Record<string, unknown>;
    const rawRoles =
      json.role ??
      json.roles ??
      json['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] ??
      [];
    const roles = Array.isArray(rawRoles) ? rawRoles : [rawRoles];
    return roles.map((x) => normalizeRole(String(x))).filter(Boolean);
  } catch {
    return [];
  }
}

export function getAuthState(): AuthState | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(AUTH_STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthState;
  } catch {
    return null;
  }
}

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const parsed = getAuthState();
    if (parsed) {
      setUser(parsed.user);
      setToken(parsed.token);
    }
    setLoading(false);
  }, []);

  const persistAuth = useCallback((nextState: AuthState) => {
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(nextState));
    setUser(nextState.user);
    setToken(nextState.token);
  }, []);

  const hydrateUserFromLogin = useCallback(async (payload: LoginPayload) => {
    const apiUser = payload.User ?? {
      Id: payload.user?.id,
      UserName: payload.user?.userName,
      Email: payload.user?.email,
      FullName: payload.user?.fullName,
      Avatar: payload.user?.avatar,
      WhatsApp: payload.user?.whatsApp,
    };
    const tokenValue = payload.Token ?? payload.token ?? 'JWT_TOKEN_PLACEHOLDER';
    if (!apiUser?.Email) throw new Error('Data user login tidak lengkap');
    let resolvedId = apiUser.Id ?? '';
    let resolvedUserName = apiUser.UserName ?? '';
    let resolvedName = apiUser.FullName ?? apiUser.UserName ?? '';
    let resolvedAvatar = apiUser.Avatar ?? 'https://lh3.googleusercontent.com/a/default-user';
    try {
      const me = await apiGetAuth<MeProfilePayload>('/api/UserProfile/me', tokenValue);
      const meRow = me.data ?? (me as unknown as MeProfilePayload);
      resolvedId = meRow.id ?? resolvedId;
      resolvedUserName = meRow.userName ?? resolvedUserName;
      resolvedName = meRow.fullName ?? resolvedName;
      resolvedAvatar = meRow.avatar ?? resolvedAvatar;
    } catch {
      // keep login payload fallback
    }

    const safeUserName = toUsernameCandidate(resolvedUserName || apiUser.Email);
    if (!safeUserName) throw new Error('Username tidak valid');
    const roles = extractRolesFromToken(tokenValue);

    const nextUser: AuthUser = {
      id: resolvedId || safeUserName,
      userName: safeUserName,
      name: resolvedName || safeUserName,
      email: apiUser.Email,
      picture: resolvedAvatar,
      roles,
    };

    const nextState: AuthState = { token: tokenValue, user: nextUser };
    persistAuth(nextState);
    return nextUser;
  }, [persistAuth]);

  const loginWithGoogle = useCallback(async (email: string, fullName: string) => {
    const cleanEmail = email.trim();
    const cleanName = fullName.trim() || cleanEmail.split('@')[0];

    try {
      await apiPost('/api/Account/register-google', { email: cleanEmail, fullName: cleanName });
    } catch {
      // ignore existing user register error and continue login
    }

    const loginResult = await apiPost<LoginPayload>('/api/Account/login', { email: cleanEmail, password: '123456' });
    return hydrateUserFromLogin(loginResult.data ?? {});
  }, [hydrateUserFromLogin]);

  const loginOwner = useCallback(async (usernameOrEmail: string, password: string) => {
    const identity = usernameOrEmail.trim();
    if (isEmail(identity)) {
      const loginResult = await apiPost<LoginPayload>('/api/Account/login', { email: identity, password });
      return hydrateUserFromLogin(loginResult.data ?? {});
    }

    const candidate = toUsernameCandidate(identity);
    if (!candidate) throw new Error('Username tidak valid');

    // Try by-username mapping in multiple normalized forms.
    const usernameVariants = Array.from(new Set([candidate, candidate.toLowerCase(), identity]));
    for (const u of usernameVariants) {
      try {
        const profile = await apiGet<MeProfilePayload>(`/api/UserProfile/by-username/${encodeURIComponent(u)}`);
        const mappedEmail = String(profile.data?.email ?? '').trim();
        if (!mappedEmail) continue;
        const retry = await apiPost<LoginPayload>('/api/Account/login', { email: mappedEmail, password });
        return hydrateUserFromLogin(retry.data ?? {});
      } catch {
        // continue next variant
      }
    }

    // Last fallback: backend identity login (if API supports direct username).
    const fallback = await apiPost<LoginPayload>('/api/Account/login', { email: candidate, password });
    return hydrateUserFromLogin(fallback.data ?? {});
  }, [hydrateUserFromLogin]);

  const refreshProfile = useCallback(async () => {
    if (!user || !token) return;
    try {
      const me = await apiGetAuth<MeProfilePayload>('/api/UserProfile/me', token);
      const row = me.data ?? (me as unknown as MeProfilePayload);
      const nextUserName = toUsernameCandidate(row.userName ?? user.userName ?? user.email);
      const nextRoles = extractRolesFromToken(token);
      persistAuth({
        token,
        user: {
          ...user,
          userName: nextUserName || user.userName,
          name: row.fullName ?? user.name,
          email: row.email ?? user.email,
          picture: row.avatar ?? user.picture,
          roles: nextRoles.length > 0 ? nextRoles : user.roles,
        },
      });
      return;
    } catch {
      // keep previous auth state
    }
  }, [persistAuth, token, user]);

  const logout = useCallback(() => {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    for (let i = localStorage.length - 1; i >= 0; i -= 1) {
      const key = localStorage.key(i);
      if (key && key.startsWith(AKUN_BOOTSTRAP_CACHE_PREFIX)) {
        localStorage.removeItem(key);
      }
    }
    if (typeof document !== 'undefined') {
      const cookieKeys = ['travelapp_auth', 'authToken', 'token', 'jwt', 'access_token'];
      for (const key of cookieKeys) {
        document.cookie = `${key}=; Max-Age=0; path=/`;
      }
    }
    setUser(null);
    setToken(null);
  }, []);

  const hasRole = useCallback((role: string) => {
    if (!user) return false;
    return user.roles.includes(normalizeRole(role));
  }, [user]);

  return { user, token, loading, isLoggedIn: !!user, hasRole, loginWithGoogle, loginOwner, refreshProfile, logout };
}
