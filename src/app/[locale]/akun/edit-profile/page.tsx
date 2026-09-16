'use client';

import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import { Link, useRouter } from '@/i18n/routing-patch';
import { apiGet, apiPut, API_BASE_URL, getAuthToken, suppressUnauthorizedRedirect } from '@/lib/api-client';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/components/Toast';
import { Skeleton } from '@/components/Skeleton';

type ApiResponse<T = unknown> = {
  message?: string;
  data?: T;
};

type MeDto = {
  userName?: string;
  email?: string;
  fullName?: string;
  avatar?: string;
  whatsApp?: string;
};
type PublicProfileDto = {
  address?: string;
  phoneNumber?: string;
};
type PublicUserLookupItem = {
  userName?: string;
  email?: string;
};

const USERNAME_REGEX = /^[A-Za-z0-9._-]+$/;
const USERNAME_STRICT_REGEX = /^[A-Za-z0-9]+$/;
const WHATSAPP_REGEX = /^\d{10,15}$/;
const EMAIL_SHAPE_REGEX = /@/;

const toAbsoluteUrl = (raw?: string | null): string => {
  const val = String(raw ?? '').trim();
  if (!val) return '';
  if (val.startsWith('http://') || val.startsWith('https://')) return val;
  return `${API_BASE_URL}${val.startsWith('/') ? '' : '/'}${val}`;
};

export default function EditProfilePage() {
  const { user, refreshProfile, logout } = useAuth();
  const router = useRouter();
  const { show } = useToast();
  const [loading, setLoading] = useState(true);
  const [busyProfile, setBusyProfile] = useState(false);
  const [busyUsername, setBusyUsername] = useState(false);
  const [busyEmail, setBusyEmail] = useState(false);
  const [busyPassword, setBusyPassword] = useState(false);
  const [busyAvatar, setBusyAvatar] = useState(false);

  const [fullName, setFullName] = useState('');
  const [initialFullName, setInitialFullName] = useState('');
  const [username, setUsername] = useState('');
  const [initialUsername, setInitialUsername] = useState('');
  const [whatsApp, setWhatsApp] = useState('');
  const [initialWhatsApp, setInitialWhatsApp] = useState('');
  const [address, setAddress] = useState('');
  const [initialAddress, setInitialAddress] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState('');
  const avatarInputRef = useRef<HTMLInputElement | null>(null);

  const [error, setError] = useState('');

  const resolveUsername = (fromApi?: string, fromAuth?: string): string => {
    const apiVal = String(fromApi ?? '').trim();
    if (apiVal && !EMAIL_SHAPE_REGEX.test(apiVal)) return apiVal;
    const authVal = String(fromAuth ?? '').trim();
    if (authVal && !EMAIL_SHAPE_REGEX.test(authVal)) return authVal;
    return '';
  };

  const effectiveAvatar = useMemo(() => avatarPreview || toAbsoluteUrl(user?.picture), [avatarPreview, user?.picture]);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        setLoading(true);
        const me = await apiGet<ApiResponse<MeDto>>('/api/UserProfile/me');
        const row = me.data ?? (me as unknown as MeDto);
        if (!mounted) return;
        setFullName(String(row.fullName ?? user?.name ?? ''));
        setInitialFullName(String(row.fullName ?? user?.name ?? ''));
        const uname = resolveUsername(String(row.userName ?? ''), String(user?.userName ?? ''));
        setUsername(uname);
        setInitialUsername(uname);
        const wa = String(row.whatsApp ?? '').trim();
        setWhatsApp(wa);
        setInitialWhatsApp(wa);
        setNewEmail(String(row.email ?? user?.email ?? '').trim());
        setAvatarPreview(toAbsoluteUrl(String(row.avatar ?? user?.picture ?? '')));
        const emailSafe = String(row.email ?? user?.email ?? '').trim().toLowerCase();
        if (emailSafe) {
          try {
            const users = await apiGet<ApiResponse<{ items?: PublicUserLookupItem[] }>>(
              `/api/UserManagement/public-users?pageNumber=1&pageSize=50&searchTerm=${encodeURIComponent(emailSafe)}&isActive=true`
            );
            const found = (users.data?.items ?? []).find((u) => String(u.email ?? '').trim().toLowerCase() === emailSafe);
            const canonicalUsername = String(found?.userName ?? '').trim();
            if (canonicalUsername) {
              setUsername(canonicalUsername);
              setInitialUsername(canonicalUsername);
            }
          } catch {
            // fallback to /me username
          }
        }
        const usernameSafe = String(row.userName ?? user?.userName ?? '').trim();
        if (usernameSafe) {
          try {
            const detail = await apiGet<ApiResponse<PublicProfileDto>>(`/api/UserProfile/by-username/${encodeURIComponent(usernameSafe)}`);
            const d = detail.data ?? (detail as unknown as PublicProfileDto);
            const addr = String(d.address ?? '').trim();
            setAddress(addr);
            setInitialAddress(addr);
            if (!String(row.whatsApp ?? '').trim()) {
              const waFromDetail = String(d.phoneNumber ?? '').trim();
              setWhatsApp(waFromDetail);
              setInitialWhatsApp(waFromDetail);
            }
          } catch {
            // keep defaults if detail profile endpoint unavailable
          }
        }
      } catch (err) {
        if (!mounted) return;
        const msg = err instanceof Error ? err.message : 'Gagal memuat profil';
        setError(msg);
        show(msg);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    void load();
    return () => {
      mounted = false;
    };
  }, [user?.email, user?.name, user?.picture, user?.userName]);

  const submitProfileInfo = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const whatsAppTrimmed = whatsApp.trim();
    if (whatsAppTrimmed && !WHATSAPP_REGEX.test(whatsAppTrimmed)) {
      const msg = 'WhatsApp harus 10-15 digit angka';
      setError(msg);
      show(msg);
      return;
    }

    setBusyProfile(true);
    setError('');
    try {
      const payload: Record<string, string> = {};
      const fullNameTrimmed = fullName.trim();
      if (fullNameTrimmed && fullNameTrimmed !== initialFullName.trim()) payload.fullName = fullNameTrimmed;
      if (whatsAppTrimmed !== initialWhatsApp.trim()) payload.whatsApp = whatsAppTrimmed;
      if (address.trim() !== initialAddress.trim()) payload.address = address.trim();
      if (Object.keys(payload).length === 0) {
        show('Tidak ada perubahan info dasar.');
        return;
      }
      const res = await apiPut<ApiResponse>('/api/UserProfile/profile', payload);
      show(res.message ?? 'Profil berhasil diperbarui');
      setInitialFullName(fullNameTrimmed);
      setInitialWhatsApp(whatsAppTrimmed);
      setInitialAddress(address.trim());
      await refreshProfile();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Gagal update profile';
      setError(msg);
      show(msg);
    } finally {
      setBusyProfile(false);
    }
  };

  const submitUsername = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const usernameTrimmed = username.trim();

    // 1. Tidak boleh kosong
    if (!usernameTrimmed) {
      const msg = 'Username tidak boleh kosong';
      setError(msg);
      show(msg);
      return;
    }

    // 2. Minimal 5 karakter dan maksimal 30 karakter
    if (usernameTrimmed.length < 5 || usernameTrimmed.length > 30) {
      const msg = 'Username harus terdiri dari 5 sampai 30 karakter';
      setError(msg);
      show(msg);
      return;
    }

    // 3. Hanya bisa input angka dan teks
    if (!/^[a-zA-Z0-9]+$/.test(usernameTrimmed)) {
      const msg = 'Username hanya boleh berisi huruf dan angka (tanpa simbol atau spasi)';
      setError(msg);
      show(msg);
      return;
    }

    // 4. Tidak boleh ada yang sama dengan router (reserved paths)
    const reservedUsernames = new Set([
      'id', 'en', 'ar',
      '401', 'about', 'agen', 'akun', 'contact', 'feeds', 'forgot-password', 'information', 'karir', 'layanan', 'login', 'materi', 'owner-login', 'pack', 'produk-lain', 'toko', 'ref', 'reg', 'register', 'testimoni', 'tour', 'transport', 'video',
      'api', 'admin', 'assets', 'public', 'home', 'profile', 'edit-profile', 'dashboard', 'user', 'username', 'static', 'dynamic', 'dev', 'config'
    ]);
    if (reservedUsernames.has(usernameTrimmed.toLowerCase())) {
      const msg = 'Username ini tidak dapat digunakan karena merupakan kata kunci sistem/halaman';
      setError(msg);
      show(msg);
      return;
    }

    // 5. Belum berubah check
    const usernameChanged = usernameTrimmed !== initialUsername.trim();
    if (!usernameChanged) {
      show('Username belum berubah.');
      return;
    }

    setBusyUsername(true);
    setError('');
    try {
      // 6. Tidak boleh ada yang sama (DB check)
      let isTaken = false;
      try {
        await apiGet<any>(`/api/UserProfile/by-username/${encodeURIComponent(usernameTrimmed)}`);
        isTaken = true;
      } catch {
        isTaken = false;
      }

      if (isTaken) {
        const msg = 'Username sudah digunakan oleh pengguna lain';
        setError(msg);
        show(msg);
        setBusyUsername(false);
        return;
      }

      const res = await apiPut<ApiResponse>('/api/UserProfile/profile', { username: usernameTrimmed });
      show(res.message ?? 'Username berhasil diperbarui');
      setInitialUsername(usernameTrimmed);
      await refreshProfile();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Gagal update username';
      setError(msg);
      show(msg);
    } finally {
      setBusyUsername(false);
    }
  };

  const submitEmail = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const val = newEmail.trim();
    if (!val) {
      const msg = 'Email baru wajib diisi';
      setError(msg);
      show(msg);
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(val)) {
      const msg = 'Format email tidak valid (contoh: nama@domain.com)';
      setError(msg);
      show(msg);
      return;
    }
    setBusyEmail(true);
    setError('');
    try {
      const res = await apiPut<ApiResponse>('/api/UserProfile/email', { newEmail: val });
      show(res.message ?? 'Email berhasil diperbarui');
      await refreshProfile();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Gagal update email';
      setError(msg);
      show(msg);
    } finally {
      setBusyEmail(false);
    }
  };

  const submitPassword = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const current = currentPassword.trim();
    const next = newPassword.trim();
    const confirm = confirmPassword.trim();
    if (!current || !next) {
      const msg = 'Password saat ini dan password baru wajib diisi';
      setError(msg);
      show(msg);
      return;
    }

    // Cegah spasi dalam password
    if (/\s/.test(newPassword)) {
      const msg = 'Password baru tidak boleh mengandung spasi';
      setError(msg);
      show(msg);
      return;
    }

    // Cegah karakter aneh (hanya boleh kombinasi huruf, angka, dan simbol standar)
    if (!/^[!-~]+$/.test(newPassword)) {
      const msg = 'Password baru hanya boleh berisi huruf, angka, dan simbol standar (tanpa emoji atau karakter non-ASCII)';
      setError(msg);
      show(msg);
      return;
    }

    if (next.length < 6) {
      const msg = 'Password baru minimal 6 karakter';
      setError(msg);
      show(msg);
      return;
    }
    if (next !== confirm) {
      const msg = 'Konfirmasi password baru tidak sama';
      setError(msg);
      show(msg);
      return;
    }
    setBusyPassword(true);
    setError('');
    try {
      await apiPut<ApiResponse>('/api/UserProfile/password', {
        currentPassword: current,
        newPassword: next,
      });
      show('Password Berhasil diubah');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      await new Promise((resolve) => setTimeout(resolve, 900));
      suppressUnauthorizedRedirect(5000);
      logout();
      router.replace('/akun');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Gagal update password';
      setError(msg);
      show(msg);
    } finally {
      setBusyPassword(false);
    }
  };

  const uploadAvatarFile = async (file: File | null) => {
    if (!file) {
      const msg = 'Pilih file avatar dulu';
      setError(msg);
      show(msg);
      return;
    }
    const token = getAuthToken();
    if (!token) {
      const msg = 'Token login tidak ditemukan';
      setError(msg);
      show(msg);
      return;
    }
    setBusyAvatar(true);
    setError('');
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch(`${API_BASE_URL}/api/UserProfile/avatar`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      const json = await res.json().catch(() => null) as ApiResponse<{ avatarUrl?: string }> | null;
      if (!res.ok) {
        throw new Error(json?.message || `HTTP ${res.status}`);
      }
      const nextUrl = toAbsoluteUrl(json?.data?.avatarUrl ?? '');
      if (nextUrl) setAvatarPreview(nextUrl);
      show(json?.message ?? 'Avatar berhasil diperbarui');
      await refreshProfile();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Gagal update avatar';
      setError(msg);
      show(msg);
    } finally {
      setBusyAvatar(false);
    }
  };

  if (loading) {
    return (
      <div className="p-4 space-y-4 animate-fade-up">
        <div className="bg-white border rounded-3xl p-5 space-y-3">
          <div className="flex items-center gap-3">
            <Skeleton className="h-16 w-16 rounded-full" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-3 w-56 rounded-full" />
            </div>
          </div>
        </div>
        <div className="bg-white border rounded-3xl p-5 space-y-2">
          <Skeleton className="h-5 w-28" />
          <Skeleton className="h-10 w-full rounded-xl" />
          <Skeleton className="h-10 w-full rounded-xl" />
        </div>
        <div className="flex items-center gap-2 text-xs text-zinc-500">
          <span className="h-4 w-4 rounded-full border-2 border-zinc-300 border-t-primary-600 animate-spin" />
          Memuat profil...
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4 animate-fade-up">
      <div className="bg-white border rounded-3xl p-5 space-y-3">
        <h1 className="text-lg font-extrabold g-text">Edit Profile</h1>

        <div className="flex items-center gap-3">
          <div className="relative w-16 h-16">
            <div className="w-16 h-16 rounded-full overflow-hidden border bg-zinc-100 relative">
              {effectiveAvatar ? (
                <Image src={effectiveAvatar} alt="Avatar" fill sizes="64px" loading="eager" unoptimized className="object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-zinc-400 text-xs">No Avatar</div>
              )}
            </div>
            <button
              type="button"
              onClick={() => avatarInputRef.current?.click()}
              disabled={busyAvatar}
              className="absolute left-1/2 -translate-x-1/2 -bottom-3 h-8 w-8 rounded-full bg-primary-600 text-white border-2 border-white shadow-lg flex items-center justify-center text-sm z-20 disabled:opacity-60"
              title="Upload avatar"
              aria-label="Upload avatar"
            >
              {busyAvatar ? '…' : '📷'}
            </button>
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif,image/bmp"
              className="hidden"
              onChange={async (e) => {
                const file = e.target.files?.[0] ?? null;
                if (file) {
                  const local = URL.createObjectURL(file);
                  setAvatarPreview(local);
                }
                await uploadAvatarFile(file);
                e.currentTarget.value = '';
              }}
            />
          </div>
          <div className="text-xs text-zinc-600">
            <div>{user?.email || '-'}</div>
            <div className="text-zinc-500 mt-0.5">Klik ikon kamera untuk ganti avatar</div>
          </div>
        </div>
      </div>

      <div className="bg-white border rounded-3xl p-5">
        <h2 className="text-sm font-bold mb-3">Data Utama</h2>
        <form className="space-y-3" onSubmit={submitProfileInfo}>
          <label className="block">
            <div className="mb-1 text-xs font-semibold text-zinc-700">Nama Lengkap</div>
            <input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Nama Lengkap" className="w-full border rounded-2xl px-4 py-3 text-sm" required />
          </label>
          <label className="block">
            <div className="mb-1 text-xs font-semibold text-zinc-700">WhatsApp</div>
            <input value={whatsApp} onChange={(e) => setWhatsApp(e.target.value)} placeholder="WhatsApp (10-15 digit)" className="w-full border rounded-2xl px-4 py-3 text-sm" />
          </label>
          <label className="block">
            <div className="mb-1 text-xs font-semibold text-zinc-700">Alamat</div>
            <textarea value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Alamat" className="w-full border rounded-2xl px-4 py-3 text-sm min-h-20" />
          </label>
          <button type="submit" disabled={busyProfile} className="w-full g-main text-white rounded-2xl py-3 text-sm font-semibold disabled:opacity-60">
            {busyProfile ? 'Menyimpan...' : 'Simpan Data Utama'}
          </button>
        </form>
      </div>

      <div className="bg-white border rounded-3xl p-5">
        <h2 className="text-sm font-bold mb-3">Ganti Username</h2>
        <form className="space-y-3" onSubmit={submitUsername}>
          <label className="block">
            <div className="mb-1 text-xs font-semibold text-zinc-700">Username</div>
            <input value={username} onChange={(e) => setUsername(e.target.value.replace(/[^a-zA-Z0-9]/g, ''))} placeholder="Username (bukan email)" className="w-full border rounded-2xl px-4 py-3 text-sm" required />
          </label>
          <button type="submit" disabled={busyUsername} className="w-full border rounded-2xl py-3 text-sm font-semibold disabled:opacity-60">
            {busyUsername ? 'Menyimpan...' : 'Update Username'}
          </button>
        </form>
      </div>

      <div className="bg-white border rounded-3xl p-5">
        <h2 className="text-sm font-bold mb-3">Ganti Email</h2>
        <form className="space-y-3" onSubmit={submitEmail}>
          <input type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value.replace(/\s/g, ''))} placeholder="Email baru" className="w-full border rounded-2xl px-4 py-3 text-sm" required />
          <button type="submit" disabled={busyEmail} className="w-full border rounded-2xl py-3 text-sm font-semibold disabled:opacity-60">
            {busyEmail ? 'Menyimpan...' : 'Update Email'}
          </button>
        </form>
      </div>

      <div className="bg-white border rounded-3xl p-5">
        <h2 className="text-sm font-bold mb-3">Ganti Password</h2>
        <form className="space-y-3" onSubmit={submitPassword}>
          <div className="relative">
            <input type={showCurrentPassword ? 'text' : 'password'} value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value.replace(/[^\x21-\x7E]/g, ''))} placeholder="Password saat ini" className="w-full border rounded-2xl px-4 py-3 pr-14 text-sm" required />
            <button type="button" onClick={() => setShowCurrentPassword((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-500">
              {showCurrentPassword ? 'Hide' : 'Show'}
            </button>
          </div>
          <div className="relative">
            <input type={showNewPassword ? 'text' : 'password'} value={newPassword} onChange={(e) => setNewPassword(e.target.value.replace(/[^\x21-\x7E]/g, ''))} placeholder="Password baru (min 6 karakter)" className="w-full border rounded-2xl px-4 py-3 pr-14 text-sm" required />
            <button type="button" onClick={() => setShowNewPassword((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-500">
              {showNewPassword ? 'Hide' : 'Show'}
            </button>
          </div>
          <div className="relative">
            <input type={showConfirmPassword ? 'text' : 'password'} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value.replace(/[^\x21-\x7E]/g, ''))} placeholder="Konfirmasi password baru" className="w-full border rounded-2xl px-4 py-3 pr-14 text-sm" required />
            <button type="button" onClick={() => setShowConfirmPassword((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-500">
              {showConfirmPassword ? 'Hide' : 'Show'}
            </button>
          </div>
          <button type="submit" disabled={busyPassword} className="w-full border rounded-2xl py-3 text-sm font-semibold disabled:opacity-60">
            {busyPassword ? 'Memproses...' : 'Update Password'}
          </button>
        </form>
      </div>

      <Link href="/akun" className="inline-flex text-sm text-primary-600">← Kembali ke Akun</Link>
    </div>
  );
}

