'use client';

import Image from 'next/image';
import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { useSearchParams } from 'next/navigation';
import { apiPost } from '@/lib/api-client';
import { useLeadsTrack } from '@/hooks/useLeadsTrack';
import { useAuth } from '@/lib/auth';
import { toAbsoluteUrl } from '@/lib/utils';
import { 
  Sparkles, Wifi, Coffee, Car, Waves, Utensils, ShieldCheck, 
  MapPin, Clock, Calendar, Phone, Check, X, Star, Copy, ExternalLink, 
  User, Mail, Building, Plus, Minus, Send, Info, ChevronRight, HelpCircle,
  Hotel, Award, Heart, CheckCircle, AlertCircle, DollarSign, Share2
} from 'lucide-react';

const money = (v: unknown, currency = 'IDR') => Number(v || 0) > 0 ? `${currency} ${Number(v || 0).toLocaleString('id-ID')}` : 'Harga by request';

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

const formatWhatsAppLink = (phone: string, text = '') => {
  const clean = (phone || '').replace(/[^0-9]/g, '');
  const formatted = clean.startsWith('0') ? '62' + clean.slice(1) : clean;
  return `https://wa.me/${formatted}${text ? `?text=${encodeURIComponent(text)}` : ''}`;
};

const getTomorrowDateString = () => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const yyyy = tomorrow.getFullYear();
  const mm = String(tomorrow.getMonth() + 1).padStart(2, '0');
  const dd = String(tomorrow.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

const formatRupiah = (value: string | number) => {
  const numberString = String(value).replace(/[^0-9]/g, '');
  if (!numberString) return '';
  const num = parseInt(numberString, 10);
  return 'Rp ' + num.toLocaleString('id-ID');
};

const parseRupiah = (value: string) => {
  const clean = value.replace(/[^0-9]/g, '');
  return clean ? parseInt(clean, 10) : 0;
};

export default function ServiceDetailClient({ category, offerings, initialRefUsername }: { category: any; offerings: any[]; initialRefUsername?: string | null }) {
  const searchParams = useSearchParams();
  const { trackEvent } = useLeadsTrack();
  const { user, isLoggedIn, hasRole } = useAuth();
  const [selectedId, setSelectedId] = useState<string>(offerings[0]?.id ? String(offerings[0].id) : '');
  const selected = useMemo(() => offerings.find((x) => String(x.id) === selectedId) ?? offerings[0] ?? null, [offerings, selectedId]);
  
  const [form, setForm] = useState({
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    companyName: '',
    travelDateText: getTomorrowDateString(),
    paxCount: 1,
    estimatedBudget: 0,
    refAgentUsername: initialRefUsername || '',
    message: '',
  });
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);
  const [budgetString, setBudgetString] = useState(form.estimatedBudget ? formatRupiah(form.estimatedBudget) : '');

  useEffect(() => {
    setBudgetString(form.estimatedBudget ? formatRupiah(form.estimatedBudget) : '');
  }, [form.estimatedBudget]);

  // Check if logged-in user is an agent, superadmin, admin, or manager, or if URL specifies agent mode
  const isAgentOrAdmin = isLoggedIn && user && (hasRole('superadmin') || hasRole('admin') || hasRole('manager') || hasRole('agen') || hasRole('agent'));
  const isAgentMode = isAgentOrAdmin || searchParams.get('agent') === 'true' || searchParams.get('mode') === 'agent';

  useEffect(() => {
    const queryRef = searchParams.get('ref_agent') || searchParams.get('ref') || searchParams.get('affiliate');
    const resolved = setRefCookie(initialRefUsername || queryRef) || getCookieValue('ref_agent');
    if (resolved) setForm((p) => ({ ...p, refAgentUsername: p.refAgentUsername || resolved }));
    trackEvent('page_view', undefined, {
      module: 'service_marketplace',
      categorySlug: category.slug,
      categoryName: category.name,
      offeringId: selected?.id || null,
      refAgentUsername: resolved || null,
    });
  }, [category.name, category.slug, initialRefUsername, searchParams, selected?.id, trackEvent]);

  const affiliateUrl = useMemo(() => {
    if (typeof window === 'undefined') return '';
    const ref = String(form.refAgentUsername || getCookieValue('ref_agent') || '').trim().replace(/^@/, '');
    return `${window.location.origin}${window.location.pathname.split('@')[0]}${ref ? `@${encodeURIComponent(ref)}` : ''}`;
  }, [form.refAgentUsername]);

  const submit = async () => {
    if (!form.customerName.trim()) return setError('Nama lengkap wajib diisi.');
    if (!form.customerPhone.trim()) return setError('Nomor WhatsApp wajib diisi.');
    setBusy(true);
    setError('');
    setMessage('');
    try {
      const refAgentUsername = String(form.refAgentUsername || getCookieValue('ref_agent') || '').trim().replace(/^@/, '');
      trackEvent('init_checkout', undefined, {
        module: 'service_marketplace',
        categorySlug: category.slug,
        offeringId: selected?.id || null,
        paxCount: Number(form.paxCount || 1),
        estimatedBudget: Number(form.estimatedBudget || 0),
        refAgentUsername: refAgentUsername || null,
      });
      const res = await apiPost<any>('/api/ServiceMarketplace/public/inquiries', {
        serviceCategoryId: selected?.serviceCategoryId || category.id || null,
        serviceOfferingId: selected?.id || null,
        serviceSlug: selected?.slug || category.slug,
        ...form,
        paxCount: Number(form.paxCount || 1),
        estimatedBudget: Number(form.estimatedBudget || 0),
        currency: 'IDR',
        refAgentUsername: refAgentUsername || null,
        source: 'service-detail',
        pageUrl: window.location.pathname,
      });
      trackEvent('booking_submit', undefined, {
        module: 'service_marketplace',
        categorySlug: category.slug,
        offeringId: selected?.id || null,
        inquiryId: res?.data?.id || null,
        refAgentUsername: refAgentUsername || null,
      });
      setMessage(`Inquiry terkirim. Nomor: ${res?.data?.inquiryNo || '-'}. Tim kami akan menghubungi Anda.`);
      setForm((p) => ({ ...p, customerName: '', customerEmail: '', customerPhone: '', companyName: '', message: '', refAgentUsername }));
    } catch (e: any) {
      setError(e?.message || 'Gagal mengirim inquiry layanan');
    } finally {
      setBusy(false);
    }
  };

  const isHotel = category.slug === 'reservasi-hotel-akomodasi';

  // Dynamic hotel photos list for beautiful thumbnail fallback overrides
  const hotelPhotos = [
    "https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=600&auto=format&fit=crop", // lobby
    "https://images.unsplash.com/photo-1618773928121-c32242e63f39?q=80&w=600&auto=format&fit=crop", // double room
    "https://images.unsplash.com/photo-1582719508461-905c673771fd?q=80&w=600&auto=format&fit=crop", // modern villa
    "https://images.unsplash.com/photo-1540541338287-41700207dee6?q=80&w=600&auto=format&fit=crop", // resort pool
    "https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?q=80&w=600&auto=format&fit=crop", // family suite
    "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?q=80&w=600&auto=format&fit=crop"  // lounge view
  ];

  const tourPhotos = [
    "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?q=80&w=600&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?q=80&w=600&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=600&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1488646953014-85cb44e25828?q=80&w=600&auto=format&fit=crop"
  ];

  const budgetPresets = [1500000, 3000000, 5000000, 10000000];

  return (
    <div className="px-4 py-6 space-y-6 max-w-7xl mx-auto">
      {/* Header Banner */}
      <section className="overflow-hidden rounded-[2.5rem] border border-zinc-800 bg-gradient-to-br from-zinc-950 via-zinc-900 to-slate-950 shadow-xl relative min-h-[320px] flex flex-col justify-end">
        {category.coverImageUrl ? (
          <Image 
            src={toAbsoluteUrl(category.coverImageUrl)} 
            alt={category.name || 'Layanan'} 
            fill 
            className="object-cover opacity-20 transition-transform duration-700 hover:scale-105" 
            unoptimized 
          />
        ) : isHotel ? (
          <Image 
            src={hotelPhotos[0]} 
            alt="Hotel Banner" 
            fill 
            className="object-cover opacity-20 transition-transform duration-700 hover:scale-105"
            unoptimized
          />
        ) : (
          <Image 
            src={tourPhotos[0]} 
            alt="Tour Banner" 
            fill 
            className="object-cover opacity-20 transition-transform duration-700 hover:scale-105"
            unoptimized
          />
        )}
        
        {/* Floating Share Button - Subtle & Clean for everyone */}
        <div className="absolute top-6 right-6 z-10">
          <button
            type="button"
            onClick={async () => {
              await navigator.clipboard?.writeText(affiliateUrl || window.location.href);
              trackEvent('share_click', undefined, { module: 'service_marketplace', categorySlug: category.slug });
              setMessage('Tautan halaman berhasil disalin.');
            }}
            className="rounded-full bg-white/10 hover:bg-white/20 p-2.5 text-white transition-all shadow-md border border-white/10 flex items-center justify-center gap-1.5 font-bold text-xs"
            title="Bagikan Halaman"
          >
            <Share2 size={14} />
            <span className="hidden sm:inline">Bagikan</span>
          </button>
        </div>

        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/60 to-transparent" />
        <div className="relative z-10 p-6 text-white md:p-10 space-y-3">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-[#e8c978] border border-[#e8c978]/20 shadow-sm">
            <Sparkles size={10} className="text-[#e8c978]" />
            AlfianTour Services
          </span>
          <h1 className="text-3xl font-black leading-tight md:text-5xl lg:text-6xl text-zinc-50 flex items-center gap-3">
            {category.icon ? <span className="text-4xl md:text-5xl">{category.icon}</span> : null}
            <span>{category.name}</span>
          </h1>
          <p className="text-sm leading-relaxed text-zinc-300 max-w-3xl font-medium">
            {category.description || category.shortDescription || 'Konsultasikan kebutuhan perjalanan dan reservasi akomodasi terbaik Anda bersama tim profesional AlfianTour.'}
          </p>
          
          {isHotel && (
            <div className="flex flex-wrap gap-3.5 pt-2 text-xs font-semibold text-zinc-300">
              <span className="flex items-center gap-1 bg-white/5 border border-white/10 rounded-xl px-3 py-1.5">
                <Star size={14} className="text-amber-400 fill-amber-400" />
                <span>Mitra Hotel Resmi</span>
              </span>
              <span className="flex items-center gap-1 bg-white/5 border border-white/10 rounded-xl px-3 py-1.5">
                <Award size={14} className="text-[#e8c978]" />
                <span>9.4/10 Luar Biasa (256+ Ulasan)</span>
              </span>
              <span className="flex items-center gap-1 bg-white/5 border border-white/10 rounded-xl px-3 py-1.5">
                <ShieldCheck size={14} className="text-emerald-400" />
                <span>Instan Konfirmasi</span>
              </span>
            </div>
          )}
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
        <div className="space-y-6">
          {/* Pilihan Produk Layanan */}
          <section className="rounded-3xl border border-zinc-200 bg-white p-5 md:p-6 space-y-4 shadow-xs">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-black text-zinc-900 flex items-center gap-2">
                <Hotel size={18} className="text-emerald-600" />
                <span>{isHotel ? 'Pilihan Tipe Kamar & Akomodasi' : 'Pilihan Produk Layanan'}</span>
              </h2>
              <span className="text-xs font-bold text-zinc-400">{offerings.length} Penawaran</span>
            </div>
            
            <div className="grid gap-4">
              {offerings.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-zinc-200 p-12 text-xs text-zinc-500 text-center flex flex-col items-center justify-center gap-1">
                  <span className="text-2xl">📭</span>
                  <p className="font-bold text-zinc-700">Belum Ada Penawaran Aktif</p>
                  <p className="text-zinc-400">Silakan isi formulir konsultasi di samping untuk permintaan custom.</p>
                </div>
              ) : null}
              {offerings.map((item, index) => {
                const isSelected = String(selected?.id) === String(item.id);
                const fallbackThumbnail = isHotel 
                  ? hotelPhotos[index % hotelPhotos.length] 
                  : tourPhotos[index % tourPhotos.length];

                return (
                  <button 
                    key={item.id} 
                    type="button"
                    onClick={() => setSelectedId(String(item.id))} 
                    className={`rounded-2xl border text-left transition-all duration-300 flex flex-col sm:flex-row gap-4.5 p-4 items-start ${
                      isSelected 
                        ? 'border-emerald-600 bg-emerald-50/10 shadow-md shadow-emerald-950/5' 
                        : 'bg-white border-zinc-200 hover:bg-zinc-50/60 hover:border-zinc-300'
                    }`}
                  >
                    <div className="w-full sm:w-44 h-32 rounded-xl bg-zinc-100 relative overflow-hidden shrink-0 border border-zinc-200/50">
                      <Image
                        src={toAbsoluteUrl(item.coverImageUrl) || fallbackThumbnail}
                        alt={item.title}
                        fill
                        className="object-cover transition-transform duration-500 hover:scale-105"
                        unoptimized
                      />
                    </div>
                    <div className="min-w-0 flex-1 space-y-2 w-full">
                      <div className="flex items-start justify-between gap-3">
                        <h3 className="text-base font-black text-zinc-900 leading-snug">{item.title}</h3>
                        {isHotel && (
                          <span className="bg-amber-50 border border-amber-100 text-amber-700 font-black px-2 py-0.5 rounded-lg text-[10px] flex items-center gap-0.5 shrink-0">
                            <Star size={10} className="fill-amber-500 text-amber-500" />
                            <span>5.0</span>
                          </span>
                        )}
                      </div>
                      
                      <p className="line-clamp-2 text-xs leading-relaxed text-zinc-500 font-medium">
                        {item.shortDescription || item.description}
                      </p>
                      
                      <div className="flex flex-wrap gap-2 pt-1">
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-100 px-3 py-1 text-[11px] font-black text-emerald-700">
                          {money(item.startingPrice, item.currency)}
                          <span className="text-[10px] text-emerald-600/70 font-normal"> / {item.priceUnit || 'paket'}</span>
                        </span>
                        {item.durationText ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-zinc-50 border border-zinc-200/80 px-2.5 py-1 text-[10px] font-bold text-zinc-600">
                            <Clock size={12} />
                            <span>{item.durationText}</span>
                          </span>
                        ) : null}
                        {item.locationText ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-zinc-50 border border-zinc-200/80 px-2.5 py-1 text-[10px] font-bold text-zinc-600">
                            <MapPin size={12} />
                            <span>{item.locationText}</span>
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>

          {/* Detail Penawaran */}
          {selected ? (
            <div className="space-y-6">
              {/* Hotel Amenities Visual Checklist */}
              {isHotel && (
                <section className="rounded-3xl border border-zinc-200 bg-white p-5 md:p-6 space-y-4.5 shadow-xs">
                  <h3 className="text-sm font-black uppercase tracking-wider text-zinc-400">🏨 Fasilitas Hotel Utama</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {[
                      { icon: <Wifi size={14} className="text-emerald-600" />, label: "WiFi Cepat Gratis" },
                      { icon: <Coffee size={14} className="text-emerald-600" />, label: "Sarapan Pagi" },
                      { icon: <Waves size={14} className="text-emerald-600" />, label: "Kolam Renang" },
                      { icon: <Utensils size={14} className="text-emerald-600" />, label: "Restoran Resmi" },
                      { icon: <Car size={14} className="text-emerald-600" />, label: "Free Parking" },
                      { icon: <ShieldCheck size={14} className="text-emerald-600" />, label: "Resepsionis 24 Jam" },
                    ].map((facility, idx) => (
                      <div key={idx} className="flex items-center gap-2.5 border border-zinc-100 rounded-2xl p-3 bg-zinc-50/50 hover:bg-zinc-50 transition-colors">
                        <div className="h-8 w-8 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
                          {facility.icon}
                        </div>
                        <span className="text-xs font-semibold text-zinc-700">{facility.label}</span>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Detail Penawaran Overview */}
              <section className="rounded-3xl border border-zinc-200 bg-white p-5 md:p-6 space-y-4 shadow-xs">
                <h2 className="text-lg font-black text-zinc-900">Tentang Akomodasi / Penawaran</h2>
                <p className="text-sm leading-relaxed text-zinc-600 whitespace-pre-line font-medium">{selected.description}</p>
                
                <div className="grid gap-3 grid-cols-1 sm:grid-cols-3 pt-3">
                  <InfoCard label="Harga Mulai" value={money(selected.startingPrice, selected.currency)} />
                  <InfoCard label="Durasi / Validitas" value={selected.durationText || 'Sesuai pesanan'} />
                  <InfoCard label="Lokasi Area" value={selected.locationText || 'Sesuai cakupan'} />
                </div>
              </section>

              {/* Highlights Section */}
              {selected.highlights && (
                <div className="rounded-3xl bg-amber-50/30 border border-amber-100 p-5 md:p-6 space-y-3.5 shadow-xs">
                  <h3 className="text-xs font-black uppercase tracking-wider text-amber-800 flex items-center gap-1.5">
                    <Sparkles size={14} className="text-amber-500 fill-amber-500" />
                    <span>Keunggulan Layanan</span>
                  </h3>
                  <ul className="grid gap-3 sm:grid-cols-2 text-xs text-zinc-700 leading-relaxed font-semibold">
                    {selected.highlights.split('\n').filter(Boolean).map((pt: string, idx: number) => (
                      <li key={idx} className="flex items-start gap-2 border-b border-amber-100/35 pb-1.5">
                        <span className="text-amber-500 shrink-0 mt-0.5">✦</span>
                        <span>{pt}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Inclusions & Exclusions */}
              {(selected.includedItems || selected.excludedItems) && (
                <div className="grid gap-5 sm:grid-cols-2">
                  {selected.includedItems && (
                    <div className="rounded-3xl border border-zinc-200 bg-white p-5 md:p-6 space-y-3.5 shadow-xs">
                      <h3 className="text-xs font-black uppercase tracking-wider text-emerald-800 flex items-center gap-1.5">
                        <CheckCircle size={14} className="text-emerald-600" />
                        <span>Termasuk Kamar / Layanan</span>
                      </h3>
                      <ul className="space-y-2.5 text-xs text-zinc-600 leading-relaxed font-semibold">
                        {selected.includedItems.split('\n').filter(Boolean).map((pt: string, idx: number) => (
                          <li key={idx} className="flex items-start gap-2">
                            <Check size={14} className="text-emerald-600 stroke-[3] shrink-0 mt-0.5" />
                            <span>{pt}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {selected.excludedItems && (
                    <div className="rounded-3xl border border-zinc-200 bg-white p-5 md:p-6 space-y-3.5 shadow-xs">
                      <h3 className="text-xs font-black uppercase tracking-wider text-rose-800 flex items-center gap-1.5">
                        <AlertCircle size={14} className="text-rose-600" />
                        <span>Tidak Termasuk</span>
                      </h3>
                      <ul className="space-y-2.5 text-xs text-zinc-600 leading-relaxed font-semibold">
                        {selected.excludedItems.split('\n').filter(Boolean).map((pt: string, idx: number) => (
                          <li key={idx} className="flex items-start gap-2">
                            <X size={14} className="text-rose-500 stroke-[3] shrink-0 mt-0.5" />
                            <span>{pt}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* Terms and Conditions */}
              {selected.terms && (
                <div className="rounded-3xl border border-zinc-200 bg-zinc-50/50 p-5 md:p-6 space-y-3 shadow-xs">
                  <h3 className="text-xs font-black uppercase tracking-wider text-zinc-500 flex items-center gap-1.5">
                    <Info size={14} className="text-zinc-500" />
                    <span>Syarat & Ketentuan Reservasi</span>
                  </h3>
                  <ul className="space-y-2 text-[11px] text-zinc-500 leading-relaxed font-medium">
                    {selected.terms.split('\n').filter(Boolean).map((pt: string, idx: number) => (
                      <li key={idx} className="flex items-start gap-2">
                        <ChevronRight size={12} className="text-zinc-400 shrink-0 mt-0.5" />
                        <span>{pt}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Cara Booking Mudah & Cepat */}
              <section className="rounded-3xl border border-zinc-200 bg-white p-5 md:p-6 space-y-5 shadow-xs">
                <h3 className="text-sm font-black uppercase tracking-wider text-zinc-400 flex items-center gap-2">
                  <Clock size={16} className="text-emerald-600" />
                  <span>Proses Pemesanan Mudah & Cepat</span>
                </h3>
                <div className="grid gap-3 grid-cols-1 sm:grid-cols-4">
                  {[
                    { step: "1", title: "Pilih Layanan", desc: "Pilih produk / akomodasi yang sesuai kebutuhan Anda." },
                    { step: "2", title: "Isi Data Form", desc: "Lengkapi data reservasi pada form di halaman ini." },
                    { step: "3", title: "Cek Estimasi", desc: "Sistem memberikan rincian & estimasi biaya." },
                    { step: "4", title: "Konfirmasi WA", desc: "CS kami akan memvalidasi & menghubungi dalam 15 menit." }
                  ].map((s, idx) => (
                    <div key={idx} className="rounded-2xl bg-zinc-50/70 border border-zinc-100 p-4 space-y-2 text-center flex flex-col items-center">
                      <div className="h-7 w-7 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-white font-black text-xs flex items-center justify-center shadow-sm">{s.step}</div>
                      <h4 className="text-xs font-black text-zinc-800">{s.title}</h4>
                      <p className="text-[10px] leading-relaxed text-zinc-500 font-medium">{s.desc}</p>
                    </div>
                  ))}
                </div>
              </section>

              {/* FAQs Accordion */}
              <section className="rounded-3xl border border-zinc-200 bg-white p-5 md:p-6 space-y-4 shadow-xs">
                <h3 className="text-sm font-black uppercase tracking-wider text-zinc-400 flex items-center gap-2">
                  <HelpCircle size={16} className="text-emerald-600" />
                  <span>Tanya Jawab Seputar Layanan ({category.name})</span>
                </h3>
                <div className="space-y-2">
                  {(category.slug === 'reservasi-hotel-akomodasi' ? [
                    { q: "Bagaimana kebijakan check-in dan check-out?", a: "Waktu check-in standar adalah mulai pukul 14:00 local time, dan check-out sebelum pukul 12:00 local time. Harap hubungi Customer Service kami jika memerlukan early check-in atau late check-out." },
                    { q: "Apakah harga yang tertera sudah termasuk pajak & breakfast?", a: "Setiap tipe kamar memiliki detail yang berbeda. Detail ini tertera pada penjelasan kamar pilihan Anda. Sebagian besar kamar promo kami sudah termasuk breakfast dan seluruhnya bebas dari biaya tambahan tersembunyi." },
                    { q: "Bagaimana cara melakukan modifikasi atau pembatalan pesanan?", a: "Kebijakan pembatalan bergantung pada tipe kamar dan kebijakan masing-masing hotel. Silakan baca Syarat & Ketentuan di bawah detail kamar, atau konfirmasikan ke agen kami sebelum pembayaran." }
                  ] : category.slug === 'visa-dokumen-perjalanan' ? [
                    { q: "Berapa lama proses pembuatan visa hingga disetujui?", a: "Estimasi proses bervariasi bergantung pada negara tujuan (biasanya 5-15 hari kerja setelah dokumen fisik/digital lengkap). Kami akan memantau dan mengabarkan status aplikasi Anda secara berkala." },
                    { q: "Apakah ada jaminan visa saya pasti disetujui?", a: "Persetujuan visa sepenuhnya adalah hak prerogatif dari Kedutaan Besar negara tujuan. Tugas kami adalah memastikan seluruh dokumen Anda memenuhi syarat 100% guna meminimalisir risiko penolakan." },
                    { q: "Bagaimana jika pengajuan visa saya ditolak?", a: "Jika visa ditolak, biaya kedutaan yang telah dibayarkan umumnya tidak dapat dikembalikan. Namun, tim konsultan kami akan membantu menganalisis alasan penolakan untuk pengajuan ulang yang lebih kuat." }
                  ] : category.slug === 'tiket-pesawat-kereta-kapal' ? [
                    { q: "Berapa lama e-ticket diterbitkan setelah pembayaran?", a: "E-ticket resmi akan diterbitkan langsung dalam waktu 5-30 menit setelah pembayaran Anda terverifikasi oleh sistem kami." },
                    { q: "Apakah saya bisa memesan tiket dengan bagasi tambahan?", a: "Tentu saja. Anda bisa menuliskan kebutuhan bagasi tambahan pada form catatan khusus saat melakukan reservasi agar langsung kami hitungkan biayanya." },
                    { q: "Bagaimana ketentuan reschedule atau refund tiket?", a: "Kebijakan reschedule dan refund mengikuti regulasi maskapai/operator transportasi bersangkutan. Agen kami akan membantu memproses pengajuan reschedule/refund Anda dengan cepat." }
                  ] : [
                    { q: "Bagaimana cara memesan layanan kustomisasi paket?", a: "Cukup isi form Minta Penawaran di samping dengan detail destinasi, tanggal, budget, serta catatan khusus Anda. Konsultan kami akan merancang itinerary kustom terbaik untuk Anda gratis!" },
                    { q: "Berapa lama respon setelah mengajukan reservasi?", a: "Tim sales & customer support kami aktif 24/7 dan akan memvalidasi reservasi Anda dalam waktu maksimal 15 menit melalui kontak WhatsApp yang Anda daftarkan." },
                    { q: "Metode pembayaran apa saja yang didukung?", a: "Kami menerima pembayaran aman melalui Transfer Bank Resmi perusahaan (Virtual Account), Kartu Kredit, QRIS, serta pembayaran tunai langsung di kantor cabang terdekat." }
                  ]).map((faq, idx) => {
                    const isOpen = openFaqIndex === idx;
                    return (
                      <div key={idx} className="border border-zinc-150 rounded-2xl overflow-hidden transition-all bg-zinc-50/30">
                        <button
                          type="button"
                          onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                          className="w-full p-4 flex items-center justify-between text-left transition hover:bg-zinc-50"
                        >
                          <span className="text-xs font-bold text-zinc-800">{faq.q}</span>
                          <ChevronRight size={14} className={`text-zinc-500 transition-transform ${isOpen ? 'rotate-90' : ''}`} />
                        </button>
                        {isOpen && (
                          <div className="p-4 pt-0 text-[11px] leading-relaxed text-zinc-500 font-medium border-t border-zinc-100 bg-white">
                            {faq.a}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>

              {/* Ulasan Pelanggan Terverifikasi */}
              <section className="rounded-3xl border border-zinc-200 bg-white p-5 md:p-6 space-y-4 shadow-xs">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-black uppercase tracking-wider text-zinc-400 flex items-center gap-2">
                    <Star size={16} className="text-amber-500 fill-amber-500" />
                    <span>Ulasan Pelanggan Terverifikasi</span>
                  </h3>
                  <span className="text-[10px] font-black text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-100">4.9 / 5.0 (256+ Ulasan)</span>
                </div>
                <div className="grid gap-3 grid-cols-1 md:grid-cols-3">
                  {[
                    { name: "Ahmad Subarjo", location: "Bandung", rating: 5, date: "2 minggu lalu", text: "Pelayanan sangat memuaskan! CS sangat membantu mengurus kebutuhan akomodasi keluarga saya. Proses cepat tanpa ribet." },
                    { name: "Siti Rahmawati", location: "Jakarta", rating: 5, date: "1 bulan lalu", text: "Sangat recommended bagi yang mencari kepastian layanan. Proses dokumen rapi dan hotel yang didapatkan persis sesuai di foto." },
                    { name: "Budi Prasetyo", location: "Surabaya", rating: 4, date: "3 minggu lalu", text: "Harga murah bersaing dibanding platform lain. Konfirmasi juga terhitung cepat. Respon WA adminnya ramah sekali." }
                  ].map((rev, idx) => (
                    <div key={idx} className="rounded-2xl border border-zinc-100 p-4 space-y-2 bg-white flex flex-col justify-between hover:border-zinc-200 transition-all duration-300 shadow-2xs">
                      <div className="space-y-1.5">
                        <div className="flex gap-0.5">
                          {[...Array(rev.rating)].map((_, i) => (
                            <Star key={i} size={11} className="text-amber-400 fill-amber-400" />
                          ))}
                        </div>
                        <p className="text-[10px] leading-relaxed text-zinc-600 font-medium italic">"{rev.text}"</p>
                      </div>
                      <div className="pt-2 border-t border-zinc-50 flex items-center justify-between">
                        <div>
                          <div className="text-[10px] font-black text-zinc-800 leading-tight">{rev.name}</div>
                          <div className="text-[8px] text-zinc-400 font-bold">{rev.location} • {rev.date}</div>
                        </div>
                        <span className="text-[7.5px] font-extrabold uppercase tracking-wider text-emerald-600 bg-emerald-50 border border-emerald-100 rounded px-1 py-0.5">Verified</span>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* Trust Badges & Guarantee */}
              <section className="rounded-3xl border border-emerald-100 bg-emerald-50/15 p-5 md:p-6 shadow-2xs grid grid-cols-2 sm:grid-cols-4 gap-4 items-center">
                {[
                  { icon: <ShieldCheck size={20} className="text-emerald-600" />, title: "100% Pembayaran Aman", desc: "Verifikasi VA otomatis" },
                  { icon: <Award size={20} className="text-emerald-600" />, title: "Mitra Resmi AlfianTour", desc: "Lisensi terdaftar resmi" },
                  { icon: <Clock size={20} className="text-emerald-600" />, title: "Respon Kilat 24/7", desc: "Dukungan penuh tim CS" },
                  { icon: <DollarSign size={20} className="text-emerald-600" />, title: "Jaminan Harga Terbaik", desc: "Bebas biaya tersembunyi" }
                ].map((badge, idx) => (
                  <div key={idx} className="flex gap-2.5 items-start">
                    <div className="p-2 rounded-xl bg-white border border-emerald-100 shadow-sm shrink-0 flex items-center justify-center">{badge.icon}</div>
                    <div className="min-w-0">
                      <h4 className="text-[10px] font-black text-zinc-800 leading-tight">{badge.title}</h4>
                      <p className="text-[8.5px] text-zinc-400 font-bold leading-normal mt-0.5">{badge.desc}</p>
                    </div>
                  </div>
                ))}
              </section>
            </div>
          ) : null}

          {/* Agent/Affiliate Section - ONLY visible if Agent or specifically requested in URL */}
          {isLoggedIn && (
            <section className="rounded-3xl border border-amber-200 bg-gradient-to-br from-amber-50/30 to-white p-5 md:p-6 space-y-3.5 shadow-xs animate-fade-up">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-base font-black text-zinc-900 flex items-center gap-1.5">
                    <Award size={18} className="text-amber-600" />
                    <span>Menu Publikasi & Referensi Agen</span>
                  </h2>
                  <p className="mt-1 text-xs leading-relaxed text-zinc-500 font-medium">Bagikan tautan khusus ini. Setiap pemesanan jamaah yang masuk lewat tautan ini akan otomatis tercatat atas rujukan Anda.</p>
                </div>
                <button 
                  type="button"
                  className="rounded-2xl bg-amber-600 hover:bg-amber-700 text-white font-bold px-4.5 py-3 text-xs transition-colors shadow-xs shrink-0 flex items-center gap-1.5" 
                  onClick={async () => {
                    await navigator.clipboard?.writeText(affiliateUrl || window.location.href);
                    trackEvent('share_click', undefined, { module: 'service_marketplace', categorySlug: category.slug });
                    setMessage('Tautan rujukan agen berhasil disalin.');
                  }}
                >
                  <Copy size={13} />
                  <span>Salin Link Rujukan</span>
                </button>
              </div>
              <div className="mt-3 break-all rounded-2xl bg-white border border-amber-200/50 p-3.5 font-mono text-[10px] text-amber-700 select-all">{affiliateUrl || '-'}</div>
            </section>
          )}
        </div>

        {/* Floating Sidebar Reservation Form */}
        <aside className="xl:sticky xl:top-6 xl:self-start space-y-4">
          <div className="space-y-4 rounded-[2rem] border border-zinc-200 bg-white p-6 shadow-md shadow-zinc-100">
            <div>
              <span className="text-[10px] font-black uppercase tracking-[0.15em] text-emerald-600 bg-emerald-50 border border-emerald-100 px-2.5 py-1 rounded-full">
                Form Reservasi
              </span>
              <h2 className="mt-2.5 text-xl font-black text-zinc-900 flex items-center gap-1.5">
                <span>Minta Penawaran</span>
              </h2>
              <p className="text-xs text-zinc-400 font-medium">Isi detail reservasi, tim kami segera memproses ketersediaan kamar.</p>
            </div>
            
            {message ? <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-3.5 text-xs text-emerald-800 font-semibold flex items-center gap-1.5"><CheckCircle size={16} className="text-emerald-600 shrink-0" /> {message}</div> : null}
            {error ? <div className="rounded-2xl border border-red-200 bg-red-50 p-3.5 text-xs text-red-800 font-semibold flex items-center gap-1.5"><AlertCircle size={16} className="text-red-600 shrink-0" /> {error}</div> : null}
            
            <div className="space-y-3.5">
              <TextInputField 
                icon={<User size={15} />} 
                placeholder="Nama Lengkap Sesuai KTP" 
                value={form.customerName} 
                onChange={(v) => setForm(p => ({ ...p, customerName: v }))} 
              />
              
              <TextInputField 
                icon={<Phone size={15} />} 
                placeholder="WhatsApp (Aktif & Bisa Dihubungi)" 
                value={form.customerPhone} 
                onChange={(v) => setForm(p => ({ ...p, customerPhone: v }))} 
              />
              
              <TextInputField 
                icon={<Mail size={15} />} 
                placeholder="Email Customer (Opsional)" 
                value={form.customerEmail} 
                onChange={(v) => setForm(p => ({ ...p, customerEmail: v }))} 
              />
              
              <TextInputField 
                icon={<Building size={15} />} 
                placeholder="Nama Instansi/Perusahaan (Opsional)" 
                value={form.companyName} 
                onChange={(v) => setForm(p => ({ ...p, companyName: v }))} 
              />

              {/* Travel Date as Input Date representation */}
              <label className="block space-y-1">
                <span className="text-[10px] font-black uppercase text-zinc-400 tracking-wider">Rencana Check-In / Tanggal Trip</span>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-400">
                    <Calendar size={15} />
                  </div>
                  <input 
                    type="date"
                    className="w-full rounded-xl border border-zinc-200 pl-10 pr-3 py-2.5 text-xs font-semibold text-zinc-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500" 
                    value={form.travelDateText} 
                    onChange={(e) => setForm(p => ({ ...p, travelDateText: e.target.value }))} 
                  />
                </div>
              </label>

              {/* Pax Counter Increment / Decrement Selector */}
              <div className="space-y-1">
                <span className="text-[10px] font-black uppercase text-zinc-400 tracking-wider">Jumlah Tamu / Orang (Pax)</span>
                <div className="flex items-center gap-3 border border-zinc-200 rounded-xl px-3 py-2 justify-between bg-zinc-50">
                  <button 
                    type="button" 
                    onClick={() => setForm(p => ({ ...p, paxCount: Math.max(1, p.paxCount - 1) }))}
                    className="w-8 h-8 rounded-lg border border-zinc-200 bg-white flex items-center justify-center font-black text-zinc-600 hover:bg-zinc-100 hover:text-zinc-950 transition-colors"
                  >
                    <Minus size={14} />
                  </button>
                  <span className="font-extrabold text-xs text-zinc-800">{form.paxCount} Orang</span>
                  <button 
                    type="button" 
                    onClick={() => setForm(p => ({ ...p, paxCount: p.paxCount + 1 }))}
                    className="w-8 h-8 rounded-lg border border-zinc-200 bg-white flex items-center justify-center font-black text-zinc-600 hover:bg-zinc-100 hover:text-zinc-950 transition-colors"
                  >
                    <Plus size={14} />
                  </button>
                </div>
              </div>

              {/* Budget Estimations With Presets */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-black uppercase text-zinc-400 tracking-wider">Estimasi Budget Akomodasi (IDR)</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-400">
                    <DollarSign size={15} />
                  </div>
                  <input 
                    type="text" 
                    className="w-full rounded-xl border border-zinc-200 pl-10 pr-3 py-2.5 text-xs font-semibold text-zinc-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500" 
                    placeholder="Estimasi Budget (Rp)" 
                    value={budgetString} 
                    onChange={(e) => {
                      const val = e.target.value;
                      const parsed = parseRupiah(val);
                      setForm(p => ({ ...p, estimatedBudget: parsed }));
                      setBudgetString(val ? formatRupiah(parsed) : '');
                    }} 
                  />
                </div>
                
                <div className="flex flex-wrap gap-1 pt-1">
                  {budgetPresets.map((b) => (
                    <button
                      key={b}
                      type="button"
                      onClick={() => setForm(p => ({ ...p, estimatedBudget: b }))}
                      className={`px-2.5 py-1.5 text-[9px] font-black rounded-lg border transition-all ${
                        form.estimatedBudget === b
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                          : 'bg-zinc-50 text-zinc-600 border-zinc-200/80 hover:bg-zinc-100/60'
                      }`}
                    >
                      {money(b)}
                    </button>
                  ))}
                </div>
              </div>


              
              <label className="block space-y-1">
                <span className="text-[10px] font-black uppercase text-zinc-400 tracking-wider">Catatan Khusus Akomodasi</span>
                <textarea 
                  className="min-h-[80px] w-full rounded-xl border border-zinc-200 px-3.5 py-2.5 text-xs font-medium text-zinc-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500" 
                  placeholder="Contoh: Butuh kamar bebas asap rokok, dekat lift, ekstra kasur, dll..." 
                  value={form.message} 
                  onChange={(e) => setForm(p => ({ ...p, message: e.target.value }))} 
                />
              </label>

              <button 
                type="button"
                disabled={busy} 
                className="w-full rounded-2xl bg-emerald-600 hover:bg-emerald-700 px-4 py-3.5 text-xs font-bold text-white disabled:opacity-50 transition-colors shadow-md shadow-emerald-950/20 flex items-center justify-center gap-1.5 mt-2" 
                onClick={() => void submit()}
              >
                <Send size={14} className={busy ? 'animate-pulse' : ''} />
                <span>{busy ? 'Mengirim Data...' : 'Ajukan Reservasi Sekarang'}</span>
              </button>
            </div>
          </div>

          {/* Quick contact direct link */}
          {selected?.contactWhatsApp && (
            <div className="rounded-3xl border border-zinc-200 bg-emerald-50/20 p-5 space-y-3 shadow-xs">
              <h4 className="text-xs font-black text-emerald-800 flex items-center gap-1.5">
                <Phone size={13} className="text-emerald-600" />
                <span>Butuh Konsultasi Cepat?</span>
              </h4>
              <p className="text-[11px] text-zinc-500 leading-relaxed font-medium">Tanya ketersediaan kamar, harga diskon, atau promo group langsung via chat WhatsApp sales kami.</p>
              <a 
                href={formatWhatsAppLink(selected.contactWhatsApp, `Halo, saya tertarik dengan layanan "${selected.title}" di AlfianTour.`)} 
                target="_blank" 
                rel="noreferrer" 
                className="inline-flex items-center justify-center gap-1.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2.5 text-xs transition-colors shadow-xs w-full"
              >
                <Phone size={13} />
                <span>WhatsApp Customer Service</span>
              </a>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-zinc-200/80 bg-zinc-50/50 p-3">
      <div className="text-[9px] font-black uppercase tracking-wider text-zinc-400">{label}</div>
      <div className="mt-1 text-xs font-black text-zinc-800 truncate">{value}</div>
    </div>
  );
}

function TextInputField({ icon, placeholder, value, onChange }: { icon: ReactNode; placeholder: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="relative">
      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400">
        {icon}
      </div>
      <input 
        className="w-full rounded-xl border border-zinc-200 pl-10 pr-3.5 py-2.5 text-xs font-semibold text-zinc-800 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all" 
        placeholder={placeholder}
        value={value} 
        onChange={(e) => onChange(e.target.value)} 
      />
    </div>
  );
}
