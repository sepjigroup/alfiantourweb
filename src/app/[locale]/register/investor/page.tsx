'use client';

import { FormEvent, useState } from 'react';
import Image from 'next/image';
import { useRouter } from '@/i18n/routing-patch';
import { API_BASE_URL } from '@/lib/api-client';

type ApiEnvelope = { isSuccess?: boolean; message?: string };

export default function InvestorRegisterPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
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

      const res = await fetch(`${API_BASE_URL}/api/Account/register-investor`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: fullName.trim(),
          email: email.trim(),
          password: password.trim(),
        }),
      });

      const text = await res.text();
      const json = text ? (JSON.parse(text) as ApiEnvelope) : {};
      if (!res.ok || json.isSuccess === false) throw new Error(json.message || 'Registrasi investor gagal');

      setSuccess('Registrasi investor berhasil. Silakan login.');
      setTimeout(() => router.push('/login'), 900);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registrasi investor gagal');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="p-4 flex min-h-[70vh] flex-col items-center justify-center animate-fade-up">
      <Image src="/newlogo2.png" alt="Alfian Tour" width={220} height={120} className="mb-6 h-auto w-44" priority />
      <h1 className="g-text text-center text-xl font-extrabold">Daftar Investor</h1>
      <p className="mt-2 mb-8 max-w-[340px] px-4 text-center text-xs leading-relaxed text-zinc-400">
        Buat akun investor untuk mengakses project funding, dokumen, histori setoran, dan laporan perkembangan.
      </p>

      <form onSubmit={onSubmit} className="w-full max-w-[340px] space-y-2.5">
        <input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Nama lengkap investor" className="w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm outline-none focus:border-primary-500" />
        <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email aktif" className="w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm outline-none focus:border-primary-500" />
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" className="w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm outline-none focus:border-primary-500" />
        <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Konfirmasi password" className="w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm outline-none focus:border-primary-500" />
        <button type="submit" disabled={busy} className="w-full rounded-full g-main py-2.5 text-sm font-semibold text-white disabled:opacity-60">{busy ? 'Memproses...' : 'Daftar sebagai Investor'}</button>
      </form>

      {error ? <p className="mt-4 text-center text-xs text-red-500">{error}</p> : null}
      {success ? <p className="mt-4 text-center text-xs text-emerald-600">{success}</p> : null}
      <div className="mt-5 flex items-center gap-3 text-[11px]">
        <button type="button" onClick={() => router.push('/register')} className="text-zinc-500">Daftar akun biasa</button>
        <span className="text-zinc-300">|</span>
        <button type="button" onClick={() => router.push('/login')} className="text-primary-600">Sudah punya akun? Login</button>
      </div>
    </div>
  );
}
