'use client';

import Image from 'next/image';
import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { apiPost } from '@/lib/api-client';
import { useLeadsTrack } from '@/hooks/useLeadsTrack';

const money = (v: unknown, currency = 'IDR') => `${currency} ${Number(v || 0).toLocaleString('id-ID')}`;
const formatDate = (v?: string | null) => v ? new Date(v).toLocaleDateString('id-ID', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' }) : '-';
const formatTime = (v?: string | null) => v ? new Date(v).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '-';
const durationText = (start?: string | null, end?: string | null) => {
  if (!start || !end) return 'Durasi mengikuti jadwal';
  const hours = Math.max(1, Math.round((new Date(end).getTime() - new Date(start).getTime()) / 36e5));
  if (hours < 24) return `${hours} jam`;
  const days = Math.ceil(hours / 24);
  return `${days} hari`;
};

function getCookieValue(name: string) {
  if (typeof document === 'undefined') return '';
  const row = document.cookie.split('; ').find((x) => x.startsWith(`${name}=`));
  return row ? decodeURIComponent(row.split('=').slice(1).join('=')) : '';
}

function setRefCookie(username?: string | null) {
  const clean = String(username || '').trim().replace(/^@/, '');
  if (!clean || typeof document === 'undefined') return '';
  document.cookie = `ref_agent=${encodeURIComponent(clean)}; Max-Age=${60 * 60 * 24 * 15}; Path=/; SameSite=Lax`;
  return clean;
}

export default function TransportBookingClient({ packageData, departures, initialRefUsername }: { packageData: any; departures: any[]; initialRefUsername?: string | null }) {
  const searchParams = useSearchParams();
  const { trackEvent } = useLeadsTrack();
  const [form, setForm] = useState({ transportDepartureId: departures[0]?.id ? String(departures[0].id) : '', customerName: '', customerEmail: '', customerPhone: '', refAgentUsername: initialRefUsername || '', paxCount: 1, notes: '' });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const selectedDeparture = useMemo(() => departures.find((x) => String(x.id) === String(form.transportDepartureId)) ?? departures[0], [departures, form.transportDepartureId]);
  const unitPrice = Number(selectedDeparture?.sellPricePerSeatOverride || packageData.sellPricePerSeat || 0);
  const total = unitPrice * Number(form.paxCount || 1);
  const routePoints = String(packageData.routeSummary || `${packageData.originCity} - ${packageData.destinationCity}`)
    .split(/\s+-\s+|,|→/)
    .map((x) => x.trim())
    .filter(Boolean);
  const descriptionLines = String(packageData.description || packageData.shortDescription || '')
    .split(/\n+/)
    .map((x) => x.trim())
    .filter(Boolean);
  const affiliateUrl = useMemo(() => {
    if (typeof window === 'undefined') return '';
    const ref = String(form.refAgentUsername || getCookieValue('ref_agent') || '').trim().replace(/^@/, '');
    return `${window.location.origin}${window.location.pathname.split('@')[0]}${ref ? `@${encodeURIComponent(ref)}` : ''}`;
  }, [form.refAgentUsername]);

  useEffect(() => {
    const queryRef = searchParams.get('ref_agent') || searchParams.get('ref') || searchParams.get('affiliate');
    const resolved = setRefCookie(initialRefUsername || queryRef) || getCookieValue('ref_agent');
    if (resolved) setForm((p) => ({ ...p, refAgentUsername: p.refAgentUsername || resolved }));
    trackEvent('page_view', undefined, {
      module: 'transport_partner',
      packageId: packageData.id,
      packageSlug: packageData.slug,
      packageTitle: packageData.title,
      refAgentUsername: resolved || null,
    });
  }, [initialRefUsername, packageData.id, packageData.slug, packageData.title, searchParams, trackEvent]);

  const submit = async () => {
    if (!form.transportDepartureId) {
      setError('Pilih jadwal terlebih dahulu.');
      return;
    }
    if (!form.customerName.trim()) {
      setError('Nama lengkap wajib diisi.');
      return;
    }
    if (!form.customerPhone.trim()) {
      setError('Nomor WhatsApp wajib diisi.');
      return;
    }
    setBusy(true);
    setMessage('');
    setError('');
    try {
      const refAgentUsername = String(form.refAgentUsername || getCookieValue('ref_agent') || '').trim().replace(/^@/, '');
      trackEvent('init_checkout', undefined, {
        module: 'transport_partner',
        packageId: packageData.id,
        departureId: Number(form.transportDepartureId || 0),
        paxCount: Number(form.paxCount || 1),
        total,
        refAgentUsername: refAgentUsername || null,
      });
      const res = await apiPost<any>('/api/TransportPartner/public/bookings', {
        ...form,
        refAgentUsername: refAgentUsername || null,
        transportDepartureId: Number(form.transportDepartureId || 0),
        paxCount: Number(form.paxCount || 1),
      });
      trackEvent('booking_submit', undefined, {
        module: 'transport_partner',
        packageId: packageData.id,
        bookingId: res?.data?.id || null,
        departureId: Number(form.transportDepartureId || 0),
        paxCount: Number(form.paxCount || 1),
        total,
        refAgentUsername: refAgentUsername || null,
      });
      setMessage(`Booking terkirim. ID: ${res?.data?.id || '-'}. Tim kami akan menghubungi Anda.`);
      setForm((p) => ({ ...p, customerName: '', customerEmail: '', customerPhone: '', notes: '', refAgentUsername }));
    } catch (e: any) {
      setError(e?.message || 'Gagal mengirim booking');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="px-4 py-6 space-y-4">
      <div className="overflow-hidden rounded-[2rem] border bg-white shadow-sm">
        <div className="relative h-72 bg-zinc-100 md:h-[420px]">
          {packageData.coverImageUrl ? <Image src={packageData.coverImageUrl} alt={packageData.title || 'Transport'} fill className="object-cover" unoptimized /> : null}
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/80 via-zinc-950/20 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-5 text-white md:p-7">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-amber-200">Iklan Transport Partner</p>
            <h1 className="mt-2 max-w-3xl text-2xl font-black leading-tight md:text-4xl">{packageData.title}</h1>
            <p className="mt-2 text-sm text-zinc-200">{packageData.partnerName} • {packageData.originCity} ke {packageData.destinationCity}</p>
          </div>
        </div>
        <div className="grid gap-3 p-4 md:grid-cols-4 md:p-5">
          <InfoCard label="Tanggal berangkat" value={formatDate(selectedDeparture?.departureDateTime)} />
          <InfoCard label="Jam" value={`${formatTime(selectedDeparture?.departureDateTime)} - ${formatTime(selectedDeparture?.arrivalDateTime)}`} />
          <InfoCard label="Durasi" value={durationText(selectedDeparture?.departureDateTime, selectedDeparture?.arrivalDateTime)} />
          <InfoCard label="Harga mulai" value={`${money(unitPrice, packageData.currency)} / seat`} strong />
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_400px]">
        <div className="space-y-4">
          <div className="rounded-3xl border bg-white p-5">
            <h2 className="text-base font-extrabold">Detail Iklan</h2>
            <p className="mt-3 text-sm leading-7 text-zinc-700">
              {packageData.shortDescription || packageData.description || packageData.routeSummary || 'Paket transport partner dengan jadwal keberangkatan terbatas.'}
            </p>
            {descriptionLines.length > 0 ? (
              <div className="mt-4 space-y-2">
                {descriptionLines.map((line, index) => (
                  <p key={`${line}-${index}`} className="rounded-2xl bg-zinc-50 p-3 text-xs leading-5 text-zinc-600">{line}</p>
                ))}
              </div>
            ) : null}
          </div>

          <div className="rounded-3xl border bg-white p-5">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-base font-extrabold">Affiliate & Lead Tracking</h2>
                <p className="mt-1 text-xs leading-5 text-zinc-500">Link ini mengikuti sistem affiliate existing. Jika URL memakai `@username` atau `?ref_agent=username`, cookie referral akan disimpan dan booking masuk dengan ref agent tersebut.</p>
              </div>
              <button
                type="button"
                className="rounded-2xl border px-4 py-2 text-xs font-bold"
                onClick={async () => {
                  await navigator.clipboard?.writeText(affiliateUrl || window.location.href);
                  trackEvent('share_click', undefined, { module: 'transport_partner', packageId: packageData.id, packageSlug: packageData.slug });
                  setMessage('Link affiliate transport disalin.');
                }}
              >
                Copy Link Affiliate
              </button>
            </div>
            <div className="mt-3 rounded-2xl bg-zinc-50 p-3 font-mono text-[11px] text-zinc-600 break-all">{affiliateUrl || '-'}</div>
          </div>

          <div className="rounded-3xl border bg-white p-5">
            <h2 className="text-base font-extrabold">Rute Perjalanan</h2>
            <div className="mt-4 space-y-3">
              {routePoints.map((point, index) => (
                <div key={`${point}-${index}`} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <span className="grid h-8 w-8 place-items-center rounded-full bg-zinc-900 text-xs font-black text-white">{index + 1}</span>
                    {index < routePoints.length - 1 ? <span className="h-8 w-px bg-zinc-200" /> : null}
                  </div>
                  <div className="pt-1 text-sm font-bold text-zinc-800">{point}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border bg-white p-5">
            <h2 className="text-base font-extrabold">Jadwal Tersedia</h2>
            <div className="mt-3 space-y-2">
              {departures.length === 0 ? (
                <div className="rounded-2xl border border-dashed p-8 text-center text-xs text-zinc-500">Belum ada jadwal tersedia.</div>
              ) : departures.map((x) => (
                <label key={x.id} className={`block cursor-pointer rounded-2xl border p-4 text-xs transition ${String(form.transportDepartureId) === String(x.id) ? 'border-primary-300 bg-primary-50' : 'hover:bg-zinc-50'}`}>
                  <input className="sr-only" type="radio" checked={String(form.transportDepartureId) === String(x.id)} onChange={() => setForm((p) => ({ ...p, transportDepartureId: String(x.id) }))} />
                  <div className="flex justify-between gap-2">
                    <b>{formatDate(x.departureDateTime)}</b>
                    <span className="rounded-full bg-white px-2 py-1 font-bold">{x.availableSeats} seat</span>
                  </div>
                  <div className="mt-1 text-zinc-500">{formatTime(x.departureDateTime)} • {x.pickupPoint || '-'} ke {x.dropoffPoint || '-'}</div>
                  <div className="mt-1 text-zinc-500">{x.busName || 'Bus partner'} {x.sellPricePerSeatOverride ? `• ${money(x.sellPricePerSeatOverride, packageData.currency)}` : ''}</div>
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="xl:sticky xl:top-5 xl:self-start">
          <div className="rounded-3xl border bg-white p-5 shadow-sm space-y-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary-600">Booking Seat</p>
              <h2 className="mt-1 text-lg font-extrabold">{money(unitPrice, packageData.currency)}</h2>
              <p className="text-xs text-zinc-500">per seat, pembayaran dikonfirmasi oleh tim.</p>
            </div>
            {selectedDeparture ? (
              <div className="rounded-2xl bg-zinc-50 p-3 text-xs text-zinc-600">
                <b className="block text-zinc-900">{selectedDeparture.busName || 'Armada partner'}</b>
                <span>{formatDate(selectedDeparture.departureDateTime)} • {formatTime(selectedDeparture.departureDateTime)}</span>
              </div>
            ) : null}
            {message ? <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-700">{message}</div> : null}
            {error ? <div className="rounded-2xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">{error}</div> : null}
            <input className="w-full rounded-xl border px-3 py-2 text-sm" placeholder="Nama lengkap" value={form.customerName} onChange={(e) => setForm((p) => ({ ...p, customerName: e.target.value }))} />
            <input className="w-full rounded-xl border px-3 py-2 text-sm" placeholder="WhatsApp" value={form.customerPhone} onChange={(e) => setForm((p) => ({ ...p, customerPhone: e.target.value }))} />
            <input className="w-full rounded-xl border px-3 py-2 text-sm" placeholder="Email opsional" value={form.customerEmail} onChange={(e) => setForm((p) => ({ ...p, customerEmail: e.target.value }))} />
            <input className="w-full rounded-xl border px-3 py-2 text-sm" placeholder="Kode/ref agent opsional" value={form.refAgentUsername} onChange={(e) => setForm((p) => ({ ...p, refAgentUsername: e.target.value }))} />
            <input className="w-full rounded-xl border px-3 py-2 text-sm" type="number" min={1} max={selectedDeparture?.availableSeats || 99} value={form.paxCount} onChange={(e) => setForm((p) => ({ ...p, paxCount: Number(e.target.value || 1) }))} />
            <div className="rounded-2xl bg-zinc-50 p-3 text-xs">
              <div className="flex justify-between"><span>Harga</span><b>{money(unitPrice, packageData.currency)} x {form.paxCount}</b></div>
              <div className="mt-1 flex justify-between text-sm"><span>Total</span><b>{money(total, packageData.currency)}</b></div>
            </div>
            <button disabled={busy || !form.transportDepartureId || !form.customerName} className="w-full rounded-2xl bg-primary-600 px-4 py-3 text-sm font-bold text-white disabled:opacity-50" onClick={() => void submit()}>
              {busy ? 'Mengirim...' : 'Kirim Booking'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoCard({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="rounded-2xl border bg-zinc-50 p-3">
      <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">{label}</div>
      <div className={`mt-1 text-sm ${strong ? 'font-black text-primary-700' : 'font-extrabold text-zinc-900'}`}>{value}</div>
    </div>
  );
}
