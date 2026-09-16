'use client';

import { FormEvent, useEffect, useState } from 'react';
import Image from 'next/image';
import { useRouter } from '@/i18n/routing-patch';
import { API_BASE_URL } from '@/lib/api-client';

type ApiEnvelope = { isSuccess?: boolean; message?: string };

type RegisterClientProps = {
  forcedReferralUsername?: string;
};

const REF_COOKIE = 'ref_agent';
const REF_MAX_AGE = 60 * 60 * 24 * 15;

function readCookie(name: string): string {
  if (typeof document === 'undefined') return '';
  const found = document.cookie.split(';').map((x) => x.trim()).find((x) => x.startsWith(`${name}=`));
  return found ? decodeURIComponent(found.split('=').slice(1).join('=')) : '';
}

function writeReferralCookie(username: string) {
  if (typeof document === 'undefined') return;
  document.cookie = `${REF_COOKIE}=${encodeURIComponent(username)}; Max-Age=${REF_MAX_AGE}; Path=/; SameSite=Lax`;
}

export default function RegisterClient({ forcedReferralUsername = '' }: RegisterClientProps) {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [referralUsername, setReferralUsername] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const cleanForced = forcedReferralUsername.trim().replace(/^@/, '');
    if (cleanForced) {
      writeReferralCookie(cleanForced);
      setReferralUsername(cleanForced);
      return;
    }
    setReferralUsername(readCookie(REF_COOKIE).trim().replace(/^@/, ''));
  }, [forcedReferralUsername]);

  const hasUpline = referralUsername.trim().length > 0;

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const upline = referralUsername.trim();
    if (!upline) {
      setError('Pendaftaran wajib melalui upline. Silakan pilih Agen/KOCab terlebih dahulu.');
      return;
    }
    if (!fullName.trim() || !email.trim() || !password.trim()) {
      setError('Nama, email, dan password wajib diisi');
      return;
    }
    if (password.length < 6) {
      setError('Password minimal 6 karakter');
      return;
    }
    if (password !== confirmPassword) {
      setError('Konfirmasi password tidak sama');
      return;
    }

    try {
      setBusy(true);
      setError('');
      setSuccess('');

      const res = await fetch(`${API_BASE_URL}/api/Account/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: fullName.trim(),
          email: email.trim(),
          password: password.trim(),
          referralCode: upline,
        }),
      });

      const text = await res.text();
      const json = text ? (JSON.parse(text) as ApiEnvelope) : {};
      if (!res.ok || json.isSuccess === false) throw new Error(json.message || 'Registrasi gagal');

      writeReferralCookie(upline);
      setSuccess('Registrasi berhasil. Silakan login.');
      setTimeout(() => router.push('/login'), 800);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registrasi gagal');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="p-4 flex flex-col items-center justify-center min-h-[70vh] animate-fade-up">
      <Image src="/newlogo2.png" alt="Alfian Tour" width={220} height={120} className="h-auto w-44 mb-6" priority />
      <h1 className="text-xl font-extrabold g-text text-center">Daftar Akun</h1>
      <p className="text-xs text-zinc-400 text-center mt-2 mb-5 leading-relaxed px-4">Buat akun baru melalui upline resmi Alfian Tour.</p>

      <div className={`mb-3 w-full max-w-[320px] rounded-2xl border px-3 py-2.5 text-xs ${hasUpline ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-amber-200 bg-amber-50 text-amber-800'}`}>
        {hasUpline ? (
          <span>Upline aktif: <b>@{referralUsername}</b></span>
        ) : (
          <div className="space-y-2">
            <div>Pendaftaran wajib menggunakan upline. Silakan pilih Agen/KOCab terlebih dahulu.</div>
            <button type="button" onClick={() => router.push('/agen')} className="rounded-xl bg-amber-600 px-3 py-1.5 text-[11px] font-semibold text-white">Pilih Agen/KOCab</button>
          </div>
        )}
      </div>

      <form onSubmit={onSubmit} className="w-full max-w-[320px] space-y-2.5">
        <input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Nama lengkap" className="w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm outline-none focus:border-primary-500" />
        <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" className="w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm outline-none focus:border-primary-500" />
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" className="w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm outline-none focus:border-primary-500" />
        <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Konfirmasi password" className="w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm outline-none focus:border-primary-500" />
        <button type="submit" disabled={busy || !hasUpline} className="w-full rounded-full g-main py-2.5 text-sm font-semibold text-white disabled:opacity-60">{busy ? 'Memproses...' : 'Daftar'}</button>
      </form>

      {error ? <p className="text-xs text-red-500 mt-4 text-center">{error}</p> : null}
      {success ? <p className="text-xs text-emerald-600 mt-4 text-center">{success}</p> : null}
      <div className="mt-5 flex items-center gap-3 text-[11px]">
        <button type="button" onClick={() => router.push('/register/investor')} className="text-zinc-500">Daftar Investor</button>
        <span className="text-zinc-300">|</span>
        <button type="button" onClick={() => router.push('/login')} className="text-primary-600">Sudah punya akun? Login</button>
      </div>
    </div>
  );
}
