'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from '@/i18n/routing-patch';
import { useAuth } from '@/lib/auth';
import Script from 'next/script';
import Image from 'next/image';

type GoogleJwtPayload = {
  email?: string;
  name?: string;
};

function decodeGoogleCredential(credential: string): GoogleJwtPayload {
  const tokenPart = credential.split('.')[1] ?? '';
  const base64 = tokenPart.replace(/-/g, '+').replace(/_/g, '/');
  const json = atob(base64);
  return JSON.parse(json) as GoogleJwtPayload;
}

function getReturnUrl(locale: string): string {
  if (typeof window === 'undefined') return `/${locale}/akun`;
  const raw = new URLSearchParams(window.location.search).get('returnUrl') || '';
  if (!raw || !raw.startsWith('/')) return `/${locale}/akun`;
  return raw;
}

export default function LoginPage() {
  const router = useRouter();
  const { loginOwner, loginWithGoogle, isLoggedIn, loading } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [identity, setIdentity] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [gisLoaded, setGisLoaded] = useState(false);

  useEffect(() => {
    if (loading || !isLoggedIn) return;
    const locale = window.location.pathname.split('/').filter(Boolean)[0] || 'id';
    router.replace(getReturnUrl(locale));
  }, [isLoggedIn, loading, router]);

  useEffect(() => {
    if (!gisLoaded || typeof window === 'undefined' || !window.google?.accounts?.id) return;
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (!clientId) return;
    window.google.accounts.id.initialize({
      client_id: clientId,
      callback: async (response: { credential?: string }) => {
        if (!response.credential) return;
        try {
          setBusy(true);
          setError('');
          const payload = decodeGoogleCredential(response.credential);
          if (!payload.email) throw new Error('Email Google tidak ditemukan');
          await loginWithGoogle(payload.email, payload.name ?? '');
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Login Google gagal');
        } finally {
          setBusy(false);
        }
      },
    });
  }, [gisLoaded, loginWithGoogle]);

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!identity.trim() || !password.trim()) {
      setError('Username/email dan password wajib diisi');
      return;
    }
    try {
      setBusy(true);
      setError('');
      await loginOwner(identity, password);
      const locale = window.location.pathname.split('/').filter(Boolean)[0] || 'id';
      router.replace(getReturnUrl(locale));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login gagal');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="p-4 flex flex-col items-center justify-center min-h-[70vh] animate-fade-up">
      <Script src="https://accounts.google.com/gsi/client" strategy="afterInteractive" onLoad={() => setGisLoaded(true)} />
      <Image src="/newlogo2.png" alt="Alfian Tour" width={220} height={120} className="h-auto w-44 mb-6" priority />
      <h1 className="text-xl font-extrabold g-text text-center">Masuk ke Alfian Tour</h1>
      <p className="text-xs text-zinc-400 text-center mt-2 mb-8 leading-relaxed px-4">Login untuk mengakses dashboard akun Anda.</p>

      <div className="w-full max-w-[280px] space-y-3">
        <form onSubmit={onSubmit} className="space-y-2.5">
          <input value={identity} onChange={(e) => setIdentity(e.target.value)} placeholder="Username atau Email" className="w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm outline-none focus:border-primary-500" disabled={busy} />
          <div className="relative">
            <input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" className="w-full rounded-xl border border-zinc-200 px-3 py-2.5 pr-14 text-sm outline-none focus:border-primary-500" disabled={busy} />
            <button type="button" onClick={() => setShowPassword((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-500">{showPassword ? 'Hide' : 'Show'}</button>
          </div>
          <button type="submit" disabled={busy} className="w-full rounded-full g-main py-2.5 text-sm font-semibold text-white disabled:opacity-60">{busy ? 'Memproses...' : 'Login'}</button>
        </form>

        <button
          type="button"
          onClick={() => {
            if (!window.google?.accounts?.id) {
              setError('Google Sign-In belum siap. Coba beberapa detik lagi.');
              return;
            }
            setError('');
            window.google.accounts.id.prompt();
          }}
          disabled={busy}
          className="w-full rounded-full border border-zinc-200 bg-white py-2.5 text-sm font-semibold text-zinc-700 hover:bg-zinc-50 disabled:opacity-60"
        >
          Login with Google
        </button>

        <div className="flex items-center justify-between text-[11px]">
          <button type="button" onClick={() => router.push('/register')} className="text-primary-600">Daftar akun</button>
          <button type="button" onClick={() => router.push('/forgot-password')} className="text-zinc-500">Lupa password?</button>
        </div>
      </div>

      {error ? <p className="text-xs text-red-500 mt-4 text-center">{error}</p> : null}
    </div>
  );
}
