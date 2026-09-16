'use client';

import { useEffect, useMemo, useState } from 'react';
import { useLocale } from 'next-intl';
import { useAuth } from '@/lib/auth';
import { Link } from '@/i18n/routing-patch';
import { useToast } from '@/components/Toast';
import { apiGet } from '@/lib/api-client';
import { 
  Search, Copy, Phone, ExternalLink, RefreshCw, MapPin, 
  Clock, Award, Info
} from 'lucide-react';

const money = (v: unknown, currency = 'IDR') => 
  Number(v || 0) > 0 ? `${currency} ${Number(v || 0).toLocaleString('id-ID')}` : 'Harga by request';

export default function LayananAffiliatePage() {
  const { show } = useToast();
  const { user } = useAuth();
  const locale = useLocale();
  const [categories, setCategories] = useState<any[]>([]);
  const [offerings, setOfferings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategorySlug, setSelectedCategorySlug] = useState<string>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [catRes, offRes] = await Promise.all([
        apiGet<any>('/api/ServiceMarketplace/public/categories'),
        apiGet<any>('/api/ServiceMarketplace/public/offerings'),
      ]);
      setCategories(catRes?.data ?? []);
      setOfferings(offRes?.data ?? []);
    } catch (e: any) {
      show(e?.message || 'Gagal memuat katalog layanan');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const agentName = String(user?.userName || '').trim().replace(/^@/, '');

  const filteredOfferings = useMemo(() => {
    return offerings.filter((x) => {
      const matchesSearch = 
        x.title.toLowerCase().includes(search.toLowerCase()) ||
        (x.shortDescription || '').toLowerCase().includes(search.toLowerCase()) ||
        (x.locationText || '').toLowerCase().includes(search.toLowerCase());
      
      const matchesCategory = 
        selectedCategorySlug === 'all' || x.categorySlug === selectedCategorySlug;

      return matchesSearch && matchesCategory;
    });
  }, [offerings, search, selectedCategorySlug]);

  const copyLink = async (categorySlug: string, id: string) => {
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
    const cleanLink = `${baseUrl}/${locale}/layanan/${categorySlug}${agentName ? `@${encodeURIComponent(agentName)}` : ''}`;
    
    try {
      await navigator.clipboard.writeText(cleanLink);
      setCopiedId(id);
      show('Tautan rujukan bersih berhasil disalin!');
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      show('Gagal menyalin tautan');
    }
  };

  const getWhatsAppLink = (categorySlug: string, title: string) => {
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
    const cleanLink = `${baseUrl}/${locale}/layanan/${categorySlug}${agentName ? `@${encodeURIComponent(agentName)}` : ''}`;
    const text = `Assalamualaikum, saya ingin merekomendasikan layanan "${title}" dari AlfianTour. Silakan lihat detailnya di sini: ${cleanLink}`;
    return `https://wa.me/?text=${encodeURIComponent(text)}`;
  };

  return (
    <div className="p-4 space-y-5 animate-fade-up max-w-[1400px] mx-auto">
      {/* Header Banner */}
      <section className="relative overflow-hidden rounded-[2.5rem] border border-zinc-800 bg-gradient-to-r from-zinc-950 via-zinc-900 to-emerald-950 p-6 text-white shadow-xl md:p-8">
        <div className="absolute -right-12 -top-12 h-44 w-44 rounded-full bg-amber-500/10 blur-3xl" />
        <div className="absolute -bottom-16 left-12 h-48 w-48 rounded-full bg-emerald-500/15 blur-3xl" />
        <div className="relative flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1.5">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-[#e8c978]">
              <Award size={10} className="text-[#e8c978]" />
              Katalog Tautan Rujukan Agen
            </span>
            <h1 className="text-2xl font-black tracking-tight md:text-3xl lg:text-4xl text-zinc-50">
              Layanan & Akomodasi Affiliate
            </h1>
            <p className="max-w-2xl text-xs leading-relaxed text-zinc-400 font-semibold">
              Pilih dari daftar layanan yang tersedia, salin tautan rujukan personal Anda (otomatis menggunakan nama pengguna <span className="text-[#e8c978]">@{agentName}</span>), dan bagikan untuk mulai mengumpulkan komisi rujukan.
            </p>
          </div>
          <div className="flex gap-2 shrink-0">
            <button 
              type="button"
              className="rounded-full border px-4 py-2.5 text-xs font-bold bg-zinc-800/80 hover:bg-zinc-700 text-zinc-100 transition-colors flex items-center gap-1.5" 
              onClick={() => void loadData()} 
              disabled={loading}
            >
              <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
              <span>{loading ? 'Memuat...' : 'Refresh'}</span>
            </button>
          </div>
        </div>
      </section>

      {/* Filter & Search Bar */}
      <section className="rounded-3xl border bg-white p-4 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Search Box */}
          <div className="relative flex-1 max-w-lg">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400">
              <Search size={16} />
            </div>
            <input 
              className="w-full rounded-xl border border-zinc-200 pl-10 pr-3.5 py-2.5 text-xs font-semibold text-zinc-800 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all" 
              placeholder="Cari kamar hotel, dokumen visa, rental bus..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Category Filter dropdown/tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 lg:pb-0 scrollbar-none">
            <button
              onClick={() => setSelectedCategorySlug('all')}
              className={`px-3.5 py-2 text-xs font-bold rounded-xl border transition-all whitespace-nowrap ${
                selectedCategorySlug === 'all'
                  ? 'bg-emerald-600 border-emerald-600 text-white shadow-xs'
                  : 'bg-white border-zinc-200 text-zinc-600 hover:bg-zinc-50'
              }`}
            >
              Semua Kategori
            </button>
            {categories.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedCategorySlug(c.slug)}
                className={`px-3.5 py-2 text-xs font-bold rounded-xl border transition-all whitespace-nowrap ${
                  selectedCategorySlug === c.slug
                    ? 'bg-emerald-600 border-emerald-600 text-white shadow-xs'
                    : 'bg-white border-zinc-200 text-zinc-600 hover:bg-zinc-50'
                }`}
              >
                {c.icon ? c.icon + ' ' : ''}{c.name}
              </button>
            ))}
          </div>
        </div>

        {/* Info Banner */}
        <div className="rounded-2xl border border-emerald-100 bg-emerald-50/20 p-3.5 flex items-start gap-3">
          <Info size={16} className="text-emerald-600 shrink-0 mt-0.5" />
          <div className="text-[11px] leading-relaxed text-zinc-600 font-semibold">
            <p>
              Tautan yang disalin dari halaman ini menggunakan format rujukan bersih (<code className="text-emerald-700">@username</code>) tanpa query string parameter yang mencolok. Tautan ini mengarah langsung ke formulir reservasi reguler tanpa menu publikasi admin, menjaga kredibilitas Anda di depan pelanggan.
            </p>
          </div>
        </div>

        {/* Content List */}
        {loading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="animate-pulse border rounded-2xl p-4 space-y-3 bg-zinc-50">
                <div className="w-full h-32 bg-zinc-200 rounded-xl" />
                <div className="h-4 bg-zinc-200 rounded w-3/4" />
                <div className="h-3 bg-zinc-200 rounded w-1/2" />
                <div className="h-8 bg-zinc-200 rounded" />
              </div>
            ))}
          </div>
        ) : filteredOfferings.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-zinc-200 p-16 text-center text-xs text-zinc-500 flex flex-col items-center justify-center gap-2">
            <span className="text-3xl">📭</span>
            <p className="font-semibold text-zinc-700">Tidak ada produk ditemukan</p>
            <p className="text-zinc-400">Coba ubah kata kunci pencarian Anda atau ganti kategori filter.</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredOfferings.map((x) => {
              const cleanLink = typeof window !== 'undefined' 
                ? `${window.location.origin}/${locale}/layanan/${x.categorySlug}${agentName ? `@${encodeURIComponent(agentName)}` : ''}`
                : '';

              return (
                <div 
                  key={x.id} 
                  className="group relative bg-white border border-zinc-200 rounded-3xl p-4 flex flex-col justify-between hover:shadow-lg hover:border-zinc-300 transition-all duration-300 shadow-xs"
                >
                  <div className="space-y-3.5">
                    {/* Thumbnail Image */}
                    <div className="w-full h-36 rounded-2xl relative overflow-hidden bg-zinc-100 border border-zinc-200/40 shrink-0">
                      <img 
                        src={x.coverImageUrl || "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?q=80&w=600&auto=format&fit=crop"} 
                        alt={x.title} 
                        className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500" 
                      />
                      <span className="absolute top-2 left-2 bg-emerald-600/90 backdrop-blur-xs text-white text-[9px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full shadow-xs">
                        {x.categoryName || x.categorySlug}
                      </span>
                    </div>

                    {/* Offering Metadata */}
                    <div className="space-y-1">
                      <h3 className="font-black text-sm text-zinc-950 leading-snug group-hover:text-emerald-700 transition-colors line-clamp-1">{x.title}</h3>
                      <p className="text-[11px] text-zinc-500 font-medium line-clamp-2 leading-relaxed h-8">
                        {x.shortDescription || x.description || 'Tidak ada deskripsi singkat.'}
                      </p>
                    </div>

                    {/* Specifications */}
                    <div className="grid grid-cols-2 gap-2 text-[10px] font-semibold text-zinc-600 pt-2 border-t">
                      <div className="rounded-xl bg-zinc-50 p-2 border border-zinc-100 flex flex-col gap-0.5">
                        <span className="text-[8px] text-zinc-400 font-black uppercase tracking-wider">Mulai Harga</span>
                        <span className="font-extrabold text-xs text-emerald-700 truncate">{money(x.startingPrice, x.currency)}</span>
                      </div>
                      <div className="rounded-xl bg-zinc-50 p-2 border border-zinc-100 flex flex-col gap-0.5">
                        <span className="text-[8px] text-zinc-400 font-black uppercase tracking-wider">Satuan Unit</span>
                        <span className="font-extrabold text-xs text-zinc-700 truncate">{x.priceUnit || 'paket'}</span>
                      </div>
                      {x.durationText ? (
                        <div className="col-span-2 rounded-xl bg-zinc-50 p-2 border border-zinc-100 flex items-center gap-1.5">
                          <Clock size={12} className="text-zinc-400" />
                          <span className="truncate">Validitas: {x.durationText}</span>
                        </div>
                      ) : null}
                      {x.locationText ? (
                        <div className="col-span-2 rounded-xl bg-zinc-50 p-2 border border-zinc-100 flex items-center gap-1.5">
                          <MapPin size={12} className="text-zinc-400" />
                          <span className="truncate">Cakupan Area: {x.locationText}</span>
                        </div>
                      ) : null}
                    </div>

                    {/* Pre-populated Link */}
                    <div className="space-y-1 pt-2 border-t">
                      <span className="text-[9px] font-black text-zinc-400 uppercase tracking-wider block">Tautan Rujukan</span>
                      <div className="break-all rounded-xl border bg-zinc-50/50 p-2 font-mono text-[9px] text-emerald-800 font-semibold select-all border-zinc-200/50">
                        {cleanLink}
                      </div>
                    </div>
                  </div>

                  {/* Actions buttons */}
                  <div className="flex gap-2 mt-4 pt-3 border-t">
                    <button
                      type="button"
                      onClick={() => void copyLink(x.categorySlug, String(x.id))}
                      className="flex-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 text-xs transition-colors flex items-center justify-center gap-1.5 shadow-xs"
                    >
                      <Copy size={13} />
                      <span>{copiedId === String(x.id) ? 'Tersalin ✓' : 'Salin Link'}</span>
                    </button>
                    <a
                      href={getWhatsAppLink(x.categorySlug, x.title)}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-700 font-bold px-3 py-2.5 text-xs transition-all flex items-center justify-center gap-1 shadow-xs"
                      title="Bagikan ke WhatsApp"
                    >
                      <Phone size={13} className="text-emerald-600" />
                    </a>
                    <Link
                      href={`/layanan/${x.categorySlug}`}
                      target="_blank"
                      className="rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-700 font-bold px-3 py-2.5 text-xs transition-all flex items-center justify-center gap-1 shadow-xs"
                      title="Pratinjau Halaman"
                    >
                      <ExternalLink size={13} />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
