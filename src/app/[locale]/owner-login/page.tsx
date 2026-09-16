'use client';

import { FormEvent, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { useRouter } from '@/i18n/routing-patch';
import { cn } from '@/lib/utils';
import { useTranslations } from 'next-intl';

function getReturnUrl(): string | null {
  if (typeof window === 'undefined') return null;
  const params = new URLSearchParams(window.location.search);
  return params.get('returnUrl');
}

export default function OwnerLoginPage() {
  const router = useRouter();
  const t = useTranslations('ownerLogin');
  const { loginOwner } = useAuth();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setBusy(true);

    try {
      await loginOwner(username, password);
      router.push(getReturnUrl() || '/akun');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login owner gagal');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="p-4 min-h-[70vh] flex items-center animate-fade-up">
      <div className="w-full bg-white border rounded-3xl p-5 space-y-4 shadow-sm">
        <div className="space-y-1">
          <h1 className="text-lg font-extrabold g-text">{t('title')}</h1>
          <p className="text-[11px] text-zinc-400 leading-relaxed">{t('desc')}</p>
        </div>

        <form className="space-y-3" onSubmit={onSubmit}>
          <div className="relative group">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-primary-500 transition-colors">👤</span>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Username atau Email"
              className="w-full border border-zinc-200 rounded-2xl pl-10 pr-4 py-3.5 text-sm outline-none focus:border-primary-300 focus:ring-4 focus:ring-primary-50 transition-all bg-zinc-50/50 focus:bg-white"
              required
            />
          </div>
          <div className="relative group">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-primary-500 transition-colors">🔑</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password / Passcode"
              className="w-full border border-zinc-200 rounded-2xl pl-10 pr-4 py-3.5 text-sm outline-none focus:border-primary-300 focus:ring-4 focus:ring-primary-50 transition-all bg-zinc-50/50 focus:bg-white"
              required
            />
          </div>

          {error ? (
            <div className="bg-red-50 text-red-500 text-[10px] p-3 rounded-xl flex items-center gap-2">
              <span>⚠️</span>
              {error}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={busy}
            className={cn(
              'w-full g-main text-white rounded-2xl py-4 text-sm font-bold shadow-lg shadow-primary-100 transition-all active:scale-[0.98]',
              busy && 'opacity-60 cursor-not-allowed'
            )}
          >
            {busy ? 'Memproses...' : t('button')}
          </button>
        </form>
      </div>
    </div>
  );
}
