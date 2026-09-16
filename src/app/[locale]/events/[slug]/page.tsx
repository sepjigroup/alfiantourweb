'use client';

import { useEffect, useState, useMemo } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { useToast } from '@/components/Toast';
import { BackButton } from '@/components/BackButton';
import { API_BASE_URL } from '@/lib/api-client';

type EventDetail = {
  id: string;
  title: string;
  slug: string;
  descriptionHtml: string;
  imageUrlWebp: string | null;
  locationName: string;
  fullAddress: string | null;
  eventDate: string; // YYYY-MM-DD
  eventStartTime: string; // HH:mm:ss
  eventEndTime: string | null;
  scheduleEnd: string; // ISO
  validFrom: string; // ISO
  validTo: string; // ISO
  quota: number;
  viewCount: number;
  whatsAppAdminNumber: string | null;
  whatsAppDefaultMessage: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  schemaJsonLd: string | null;
  metaPixelId: string | null;
  tikTokPixelId: string | null;
  registrationCount: number;
};

type CountdownState = {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  ended: boolean;
};

function getCookieValue(name: string): string | null {
  if (typeof window === 'undefined') return null;
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  return match ? decodeURIComponent(match[2]) : null;
}

const renderAddress = (address: string) => {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  if (urlRegex.test(address)) {
    const parts = address.split(urlRegex);
    return parts.map((part, index) => {
      if (urlRegex.test(part)) {
        return (
          <a
            key={index}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary font-extrabold hover:underline break-all inline-flex items-center gap-1 mt-1 bg-primary-50 px-2.5 py-1 rounded-lg border border-primary-200/50"
          >
            🗺️ Buka Peta Lokasi ↗
          </a>
        );
      }
      return part;
    });
  }
  return address;
};

export default function EventDetailPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const slugParam = String(params?.slug || '');
  const locale = String(params?.locale || 'id');
  const { show } = useToast();

  // Parse event slug and path referral (slug@username)
  const { eventSlug, pathReferral } = useMemo(() => {
    if (slugParam.includes('@')) {
      const parts = slugParam.split('@');
      return { eventSlug: parts[0], pathReferral: parts[1] || '' };
    }
    return { eventSlug: slugParam, pathReferral: '' };
  }, [slugParam]);

  const [loading, setLoading] = useState(true);
  const [eventItem, setEventItem] = useState<EventDetail | null>(null);
  const [countdown, setCountdown] = useState<CountdownState>({ days: 0, hours: 0, minutes: 0, seconds: 0, ended: false });

  // Registration Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [registeredTicket, setRegisteredTicket] = useState<{ id: string } | null>(null);

  // Read referrer / affiliate username from query params, path referral, or cookie
  const refUsername = useMemo(() => {
    const queryRef = searchParams.get('ref_agent') || searchParams.get('ref') || searchParams.get('affiliate') || pathReferral;
    if (queryRef && typeof window !== 'undefined') {
      document.cookie = `ref_agent=${encodeURIComponent(queryRef)}; Max-Age=${60 * 60 * 24 * 15}; Path=/; SameSite=Lax`;
      return queryRef;
    }
    return getCookieValue('ref_agent') || '';
  }, [searchParams, pathReferral]);

  // Load Event Details
  useEffect(() => {
    if (!eventSlug) return;
    setLoading(true);
    fetch(`${API_BASE_URL}/api/events/slug/${eventSlug}`)
      .then(async (res) => {
        if (!res.ok) throw new Error('Gagal memuat event');
        const json = await res.json();
        if (json.isSuccess && json.data) {
          setEventItem(json.data);
        } else {
          throw new Error(json.message || 'Event tidak ditemukan');
        }
      })
      .catch((err) => {
        show(err.message || 'Gagal mengambil informasi event');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [eventSlug]);

  // Schema.org script injection
  useEffect(() => {
    if (eventItem?.schemaJsonLd) {
      const existing = document.getElementById('event-schema-jsonld');
      if (existing) existing.remove();

      const script = document.createElement('script');
      script.id = 'event-schema-jsonld';
      script.type = 'application/ld+json';
      script.innerHTML = eventItem.schemaJsonLd;
      document.head.appendChild(script);

      return () => {
        const scriptToRemove = document.getElementById('event-schema-jsonld');
        if (scriptToRemove) scriptToRemove.remove();
      };
    }
  }, [eventItem]);

  // Countdown timer
  useEffect(() => {
    if (!eventItem) return;
    
    // Parse DateOnly (YYYY-MM-DD) and TimeOnly (HH:mm:ss) to local Date
    const targetStr = `${eventItem.eventDate}T${eventItem.eventStartTime}`;
    const targetDate = new Date(targetStr);

    const interval = setInterval(() => {
      const diff = targetDate.getTime() - new Date().getTime();
      if (diff <= 0) {
        setCountdown({ days: 0, hours: 0, minutes: 0, seconds: 0, ended: true });
        clearInterval(interval);
      } else {
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        setCountdown({ days, hours, minutes, seconds, ended: false });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [eventItem]);

  // Meta & TikTok Pixels
  useEffect(() => {
    if (eventItem?.metaPixelId) {
      // Inisialisasi Meta Pixel jika ada
      (window as any).fbq?.('track', 'ViewContent', {
        content_name: eventItem.title,
        content_type: 'event',
        content_ids: [eventItem.id],
      });
    }
    if (eventItem?.tikTokPixelId) {
      // Inisialisasi TikTok Pixel jika ada
      (window as any).ttq?.track('ViewContent', {
        contents: [{ id: eventItem.id, name: eventItem.title }],
      });
    }
  }, [eventItem]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventItem) return;

    if (!name.trim()) {
      show('Nama lengkap wajib diisi');
      return;
    }
    if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) {
      show('Alamat email tidak valid');
      return;
    }
    if (!phone.trim()) {
      show('Nomor WhatsApp wajib diisi');
      return;
    }
    if (!agreed) {
      show('Anda harus menyetujui syarat & ketentuan');
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch(`${API_BASE_URL}/api/events/${eventItem.id}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          participantName: name.trim(),
          participantEmail: email.trim().toLowerCase(),
          participantPhone: phone.trim(),
          referredByUsername: refUsername || null,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.message || 'Pendaftaran gagal');
      }

      show('Pendaftaran berhasil!');
      setRegisteredTicket({ id: json.data?.registrationId || json.data?.id });

      // Track conversion
      if (eventItem.metaPixelId) {
        (window as any).fbq?.('track', 'CompleteRegistration');
      }
      if (eventItem.tikTokPixelId) {
        (window as any).ttq?.track('CompleteRegistration');
      }
    } catch (err: any) {
      show(err.message || 'Terjadi kesalahan saat mendaftar');
    } finally {
      setSubmitting(false);
    }
  };

  const getEventImageUrl = () => {
    if (!eventItem?.imageUrlWebp) {
      return 'https://placehold.co/800x450/7C3AED/FFFFFF.png?text=Event+Alfian+Tour';
    }
    const url = eventItem.imageUrlWebp;
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    return `${API_BASE_URL}${url.startsWith('/') ? '' : '/'}${url}`;
  };

  if (loading) {
    return (
      <div className="p-8 flex flex-col items-center justify-center min-h-[50vh] gap-3">
        <div className="h-8 w-8 rounded-full border-2 border-zinc-200 border-t-primary animate-spin" />
        <p className="text-xs text-zinc-500">Memuat detail event...</p>
      </div>
    );
  }

  if (!eventItem) {
    return (
      <div className="p-8 text-center space-y-4">
        <div className="text-4xl">⚠️</div>
        <h2 className="text-lg font-bold">Event Tidak Ditemukan</h2>
        <p className="text-xs text-zinc-500">Mohon periksa kembali link Anda.</p>
        <div className="pt-2">
          <BackButton />
        </div>
      </div>
    );
  }

  // Quota & Registration Logic
  const seatsLeft = Math.max(0, eventItem.quota - eventItem.registrationCount);
  const percentageUsed = eventItem.quota > 0 ? Math.min(100, (eventItem.registrationCount / eventItem.quota) * 100) : 0;
  const isRegistrationClosed = new Date(eventItem.scheduleEnd).getTime() < Date.now() || new Date(eventItem.validTo).getTime() < Date.now();
  const isQuotaFull = eventItem.quota > 0 && seatsLeft <= 0;

  // WhatsApp Confirmation Link
  const adminWa = eventItem.whatsAppAdminNumber?.replace(/[^0-9]/g, '') || '6285722022786';
  const customMessage = eventItem.whatsAppDefaultMessage 
    ? encodeURIComponent(eventItem.whatsAppDefaultMessage) 
    : encodeURIComponent(
        `Halo Admin, saya ingin konfirmasi pendaftaran event:\n\n` +
        `*Event*: ${eventItem.title}\n` +
        `*Nama*: ${name}\n` +
        `*Email*: ${email}\n` +
        `*WhatsApp*: ${phone}\n` +
        `*Referral*: ${refUsername || '-'}\n` +
        `*Detail Tiket*: ${typeof window !== 'undefined' ? window.location.origin : ''}/${locale}/event-reg/${registeredTicket?.id}\n\n` +
        `Mohon konfirmasi pendaftaran saya. Terima kasih!`
      );
  const whatsAppUrl = `https://wa.me/${adminWa}?text=${customMessage}`;

  return (
    <div className="p-4 space-y-6 animate-fade-up max-w-xl mx-auto pb-16">
      <div className="flex items-center gap-3 pt-2">
        <BackButton />
        <h1 className="text-lg font-extrabold text-zinc-900 dark:text-zinc-100 line-clamp-1">
          {eventItem.title}
        </h1>
      </div>

      {registeredTicket ? (
        // THANK YOU SCREEN
        <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-100 dark:border-zinc-800 p-6 text-center space-y-6 shadow-xl">
          <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-950/50 flex items-center justify-center text-3xl mx-auto text-green-500 animate-bounce">
            ✓
          </div>
          
          <div className="space-y-2">
            <h2 className="text-xl font-black text-zinc-950 dark:text-white">Pendaftaran Berhasil!</h2>
            <p className="text-xs text-zinc-500 leading-relaxed">
              Terima kasih telah mendaftar di event kami. Slot Anda telah berhasil dipesan. Silakan simpan detail di bawah ini atau konfirmasi via WhatsApp untuk verifikasi cepat.
            </p>
          </div>

          <div className="bg-zinc-50 dark:bg-zinc-950 rounded-2xl p-4 text-left border space-y-3">
            <h3 className="text-xs font-bold border-b pb-2 text-zinc-700 dark:text-zinc-300">Rincian Tiket Pendaftaran</h3>
            <div className="text-[11px] space-y-1.5 text-zinc-600 dark:text-zinc-400">
              <div className="flex justify-between">
                <span>Nama:</span>
                <span className="font-semibold text-zinc-900 dark:text-zinc-100">{name}</span>
              </div>
              <div className="flex justify-between">
                <span>Email:</span>
                <span className="font-semibold text-zinc-900 dark:text-zinc-100">{email}</span>
              </div>
              <div className="flex justify-between">
                <span>Nomor WA:</span>
                <span className="font-semibold text-zinc-900 dark:text-zinc-100">{phone}</span>
              </div>
              {refUsername && (
                <div className="flex justify-between text-primary font-semibold">
                  <span>Referal Agent:</span>
                  <span>@{refUsername}</span>
                </div>
              )}
              <div className="flex justify-between pt-2 border-t text-xs">
                <span>ID Tiket:</span>
                <span className="font-mono text-primary font-bold">{registeredTicket.id}</span>
              </div>
            </div>
          </div>

          <div className="space-y-2.5 pt-2">
            <a
              href={whatsAppUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white font-extrabold py-3.5 px-4 rounded-2xl shadow-lg transition-colors text-xs"
            >
              <span>💬</span> Konfirmasi Cepat ke WhatsApp
            </a>
            
            <a
              href={`/${locale}/event-reg/${registeredTicket.id}`}
              className="w-full block bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-900 dark:text-zinc-100 font-bold py-3 px-4 rounded-2xl transition-colors text-xs"
            >
              Lihat E-Tiket Masuk Lokasi
            </a>
          </div>
        </div>
      ) : (
        // DETAILS & FORM SCREEN
        <>
          {/* Main Cover Image */}
          <div className="relative aspect-[16/9] w-full rounded-2xl overflow-hidden bg-zinc-100 dark:bg-zinc-800 border shadow-md">
            <img
              src={getEventImageUrl()}
              alt={eventItem.title}
              className="w-full h-full object-cover"
            />
          </div>

          {/* Countdown & Meta Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gradient-to-br from-primary-50 to-primary-100/50 dark:from-zinc-900 dark:to-zinc-800 border border-primary-200 dark:border-zinc-700 rounded-2xl p-4 flex flex-col items-center justify-center text-center">
              <span className="text-[10px] uppercase tracking-wider font-extrabold text-primary mb-2">Countdown Menuju Event</span>
              {countdown.ended ? (
                <span className="text-sm font-black text-red-600 animate-pulse">Event Telah Dimulai / Selesai</span>
              ) : (
                <div className="flex gap-3 text-zinc-900 dark:text-zinc-100">
                  <div className="flex flex-col items-center">
                    <span className="text-xl font-black">{String(countdown.days).padStart(2, '0')}</span>
                    <span className="text-[9px] text-zinc-500">Hari</span>
                  </div>
                  <span className="text-xl font-bold">:</span>
                  <div className="flex flex-col items-center">
                    <span className="text-xl font-black">{String(countdown.hours).padStart(2, '0')}</span>
                    <span className="text-[9px] text-zinc-500">Jam</span>
                  </div>
                  <span className="text-xl font-bold">:</span>
                  <div className="flex flex-col items-center">
                    <span className="text-xl font-black">{String(countdown.minutes).padStart(2, '0')}</span>
                    <span className="text-[9px] text-zinc-500">Menit</span>
                  </div>
                  <span className="text-xl font-bold">:</span>
                  <div className="flex flex-col items-center">
                    <span className="text-xl font-black">{String(countdown.seconds).padStart(2, '0')}</span>
                    <span className="text-[9px] text-zinc-500">Detik</span>
                  </div>
                </div>
              )}
            </div>

            {/* Quota Progress Bar */}
            <div className="bg-white dark:bg-zinc-900 border rounded-2xl p-4 flex flex-col justify-center">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-500 mb-1.5">Sisa Kuota Pendaftar</span>
              {eventItem.quota > 0 ? (
                <div className="space-y-2">
                  <div className="w-full bg-zinc-100 dark:bg-zinc-800 rounded-full h-3 overflow-hidden relative border border-zinc-200/50">
                    <div 
                      className={`h-full transition-all duration-700 ease-out ${percentageUsed > 85 ? 'bg-red-500' : percentageUsed > 60 ? 'bg-amber-500' : 'bg-primary-600'}`}
                      style={{ width: `${percentageUsed}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] font-bold text-zinc-700 dark:text-zinc-300">
                    <span>Terisi: {eventItem.registrationCount}</span>
                    <span>Sisa: {seatsLeft} / {eventItem.quota} Slot</span>
                  </div>
                </div>
              ) : (
                <div className="text-xs font-bold text-green-600">
                  ✓ Kuota Tidak Terbatas (Bebas Daftar)
                </div>
              )}
            </div>
          </div>

          {/* Event Details Content */}
          <div className="space-y-4">
            <section className="bg-white dark:bg-zinc-900 rounded-2xl border p-4 space-y-2.5">
              <h2 className="text-sm font-extrabold text-zinc-900 dark:text-zinc-100">Informasi Pelaksanaan</h2>
              <div className="space-y-2 text-[11px] text-zinc-600 dark:text-zinc-400">
                <div className="flex items-start gap-2.5">
                  <span className="text-sm">📅</span>
                  <div>
                    <p className="font-bold text-zinc-800 dark:text-zinc-200">Hari & Tanggal</p>
                    <p>{new Date(eventItem.eventDate).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="text-sm">⏰</span>
                  <div>
                    <p className="font-bold text-zinc-800 dark:text-zinc-200">Waktu Acara</p>
                    <p>{eventItem.eventStartTime.substring(0, 5)} {eventItem.eventEndTime ? `- ${eventItem.eventEndTime.substring(0, 5)}` : ''} WIB</p>
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="text-sm">📍</span>
                  <div>
                    <p className="font-bold text-zinc-800 dark:text-zinc-200">{eventItem.locationName}</p>
                    {eventItem.fullAddress && (
                      <div className="mt-0.5 whitespace-pre-wrap">
                        {renderAddress(eventItem.fullAddress)}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </section>

            {/* Description Html */}
            <section className="bg-white dark:bg-zinc-900 rounded-2xl border p-4 space-y-3">
              <h2 className="text-sm font-extrabold text-zinc-900 dark:text-zinc-100">Deskripsi Event</h2>
              <div 
                className="text-[11px] leading-relaxed text-zinc-600 dark:text-zinc-400 space-y-2 prose max-w-none"
                dangerouslySetInnerHTML={{ __html: eventItem.descriptionHtml }}
              />
            </section>
          </div>

          {/* Registration Form */}
          <section className="bg-white dark:bg-zinc-900 rounded-2xl border p-5 space-y-4 shadow-sm">
            <div className="border-b pb-2">
              <h2 className="text-sm font-black text-zinc-900 dark:text-zinc-100">Formulir Pendaftaran</h2>
              <p className="text-[10px] text-zinc-500">Silakan isi data diri Anda dengan benar untuk memesan tiket event ini.</p>
            </div>

            {isRegistrationClosed ? (
              <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 text-red-700 dark:text-red-300 p-4 rounded-xl text-center text-xs font-bold leading-relaxed">
                Pendaftaran Telah Ditutup.<br />
                Batas waktu pendaftaran untuk event ini telah terlewati.
              </div>
            ) : isQuotaFull ? (
              <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 text-amber-700 dark:text-amber-300 p-4 rounded-xl text-center text-xs font-bold leading-relaxed">
                Pendaftaran Penuh.<br />
                Maaf, sisa kursi/slot pendaftaran untuk event ini sudah habis.
              </div>
            ) : (
              <form onSubmit={handleRegister} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Nama Lengkap</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Contoh: Ahmad Hidayat"
                    className="w-full bg-zinc-50 dark:bg-zinc-800 border rounded-xl py-2.5 px-3 text-xs focus:ring-2 focus:ring-primary focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Alamat Email</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Contoh: ahmad@gmail.com"
                    className="w-full bg-zinc-50 dark:bg-zinc-800 border rounded-xl py-2.5 px-3 text-xs focus:ring-2 focus:ring-primary focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Nomor WhatsApp</label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Contoh: 08522091XXXX atau 628522..."
                    className="w-full bg-zinc-50 dark:bg-zinc-800 border rounded-xl py-2.5 px-3 text-xs focus:ring-2 focus:ring-primary focus:outline-none"
                  />
                </div>

                {/* Referral Username (readonly if present, or showing) */}
                {refUsername && (
                  <div className="bg-primary-50/50 dark:bg-zinc-850 border border-primary-200 p-3 rounded-xl flex items-center justify-between text-xs">
                    <div className="flex flex-col">
                      <span className="text-[9px] uppercase tracking-wider font-extrabold text-primary">Direferensikan Oleh</span>
                      <span className="font-bold text-primary">@{refUsername}</span>
                    </div>
                    <span className="text-base">🤝</span>
                  </div>
                )}

                {/* Checklist Syarat & Ketentuan */}
                <div className="pt-2">
                  <label className="flex items-start gap-2.5 select-none cursor-pointer">
                    <input
                      type="checkbox"
                      checked={agreed}
                      onChange={(e) => setAgreed(e.target.checked)}
                      className="mt-0.5 h-4 w-4 text-primary focus:ring-primary border-zinc-300 rounded"
                    />
                    <span className="text-[10px] text-zinc-600 dark:text-zinc-400 leading-relaxed">
                      Saya dengan ini menyetujui <span className="text-primary font-bold hover:underline">Syarat & Ketentuan</span> yang berlaku pada event ini, serta menyatakan data yang saya kirimkan adalah benar.
                    </span>
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-primary hover:bg-primary-600 disabled:bg-zinc-300 text-white font-extrabold py-3 rounded-xl transition-colors text-xs mt-2"
                >
                  {submitting ? 'Memproses Pendaftaran...' : 'Daftar Sekarang'}
                </button>
              </form>
            )}
          </section>
        </>
      )}
    </div>
  );
}
