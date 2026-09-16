'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from '@/i18n/routing-patch';
import { API_BASE_URL } from '@/lib/api-client';
import { useEffect } from 'react';

type ApiEnvelope = { isSuccess?: boolean; message?: string };

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [identity, setIdentity] = useState('');
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const qIdentity = params.get('identity') || '';
    const qToken = params.get('token') || '';
    if (qIdentity) setIdentity(qIdentity);
    if (qToken) setToken(qToken);
  }, []);

  const onRequestToken = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!identity.trim()) {
      setError('Username/email wajib diisi');
      return;
    }
    try {
      setBusy(true);
      setError('');
      setSuccess('');
      const res = await fetch(`${API_BASE_URL}/api/Account/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          usernameOrEmail: identity.trim(),
        }),
      });
      const text = await res.text();
      const json = text ? (JSON.parse(text) as ApiEnvelope & { data?: { resetToken?: string } }) : {};
      if (!res.ok || json.isSuccess === false) throw new Error(json.message || 'Reset password gagal');
      if (json.data?.resetToken) setToken(json.data.resetToken);
      setSuccess('Permintaan reset diproses. Masukkan token reset lalu set password baru.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Reset password gagal');
    } finally {
      setBusy(false);
    }
  };

  const onResetPassword = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!identity.trim() || !token.trim() || !newPassword.trim()) {
      setError('Username/email, token, dan password baru wajib diisi');
      return;
    }
    if (newPassword.trim().length < 6) {
      setError('Password baru minimal 6 karakter');
      return;
    }
    try {
      setBusy(true);
      setError('');
      setSuccess('');
      const res = await fetch(`${API_BASE_URL}/api/Account/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          usernameOrEmail: identity.trim(),
          resetToken: token.trim(),
          newPassword: newPassword.trim(),
        }),
      });
      const text = await res.text();
      const json = text ? (JSON.parse(text) as ApiEnvelope) : {};
      if (!res.ok || json.isSuccess === false) throw new Error(json.message || 'Reset password gagal');
      setSuccess('Password berhasil direset. Silakan login.');
      setTimeout(() => router.push('/login'), 800);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Reset password gagal');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="p-4 flex flex-col items-center justify-center min-h-[70vh] animate-fade-up">
      <h1 className="text-xl font-extrabold g-text text-center">Lupa Password</h1>
      <p className="text-xs text-zinc-400 text-center mt-2 mb-8 leading-relaxed px-4">
        Mode saat ini memakai reset endpoint development. Untuk production, sambungkan ke alur email OTP.
      </p>

      <form onSubmit={onRequestToken} className="w-full max-w-[320px] space-y-2.5">
        <input value={identity} onChange={(e) => setIdentity(e.target.value)} placeholder="Username atau Email" className="w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm outline-none focus:border-primary-500" />
        <button type="submit" disabled={busy} className="w-full rounded-full border border-zinc-200 bg-white py-2.5 text-sm font-semibold disabled:opacity-60">{busy ? 'Memproses...' : 'Minta Token Reset'}</button>
      </form>

      <form onSubmit={onResetPassword} className="w-full max-w-[320px] space-y-2.5">
        <input value={token} onChange={(e) => setToken(e.target.value)} placeholder="Token reset password" className="w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm outline-none focus:border-primary-500" />
        <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Password baru" className="w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm outline-none focus:border-primary-500" />
        <button type="submit" disabled={busy} className="w-full rounded-full g-main py-2.5 text-sm font-semibold text-white disabled:opacity-60">{busy ? 'Memproses...' : 'Reset Password'}</button>
      </form>

      {error ? <p className="text-xs text-red-500 mt-4 text-center">{error}</p> : null}
      {success ? <p className="text-xs text-emerald-600 mt-4 text-center">{success}</p> : null}
      <button type="button" onClick={() => router.push('/login')} className="mt-5 text-[11px] text-primary-600">Kembali ke Login</button>
    </div>
  );
}
