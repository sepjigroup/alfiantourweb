'use client';

import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { useLocale } from 'next-intl';
import { useAuth } from '@/lib/auth';
import { Link } from '@/i18n/routing-patch';
import { ModalShell } from '@/components/ui/ModalShell';
import { useToast } from '@/components/Toast';
import { apiGet, apiPost, apiPut } from '@/lib/api-client';
import { 
  Plus, RefreshCw, FileText, Layers, Tag, MessageSquare, 
  DollarSign, Calendar, User, Phone, Check, X, ExternalLink, 
  Eye, Star, Copy, Info, CheckCircle2, AlertCircle, Sparkles,
  MapPin, Clock, ShieldCheck, ChevronRight, Hash, EyeOff, LayoutGrid
} from 'lucide-react';

type TabKey = 'categories' | 'offerings' | 'inquiries';
type ModalKey = null | 'category' | 'offering' | 'inquiry' | 'publish';

const money = (v: unknown, c = 'IDR') => Number(v || 0) > 0 ? `${c} ${Number(v || 0).toLocaleString('id-ID')}` : 'By request';
const emptyCategory = { id: 0, name: '', slug: '', code: '', icon: '🧳', shortDescription: '', description: '', coverImageUrl: '', accentColor: '', sortOrder: 0, showOnHome: true, status: 'Published', isActive: true };
const emptyOffering = { id: 0, serviceCategoryId: '', title: '', slug: '', serviceType: 'consultation', shortDescription: '', description: '', highlights: '', includedItems: '', excludedItems: '', terms: '', coverImageUrl: '', currency: 'IDR', startingPrice: 0, priceUnit: 'paket', durationText: '', locationText: '', targetCustomer: '', contactWhatsApp: '', sortOrder: 0, isFeatured: false, isPublic: true, status: 'Draft', isActive: true };
const emptyInquiry = { serviceCategoryId: '', serviceOfferingId: '', serviceSlug: '', customerName: '', customerEmail: '', customerPhone: '', companyName: '', travelDateText: '', paxCount: 1, estimatedBudget: 0, currency: 'IDR', refAgentUsername: '', source: 'admin', pageUrl: '', message: '' };

const formatWhatsAppLink = (phone: string, text = '') => {
  const clean = (phone || '').replace(/[^0-9]/g, '');
  const formatted = clean.startsWith('0') ? '62' + clean.slice(1) : clean;
  return `https://wa.me/${formatted}${text ? `?text=${encodeURIComponent(text)}` : ''}`;
};

const categoryPresets = [
  ['Umroh & Haji', 'umroh-haji', 'UMROH_HAJI', '🕋'],
  ['Tour Domestik & Internasional', 'tour-domestik-internasional', 'TOUR_DOM_INTL', '✈️'],
  ['Tiket Pesawat, Kereta & Kapal', 'tiket-pesawat-kereta-kapal', 'TIKET_TRANSPORT', '🎫'],
  ['Reservasi Hotel & Akomodasi', 'reservasi-hotel-akomodasi', 'HOTEL_AKOMODASI', '🏨'],
  ['Visa & Dokumen Perjalanan', 'visa-dokumen-perjalanan', 'VISA_DOKUMEN', '🛂'],
  ['Transportasi & Rental Kendaraan', 'transportasi-rental-kendaraan', 'TRANSPORT_RENTAL', '🚌'],
  ['Gathering, Outbound & Corporate Trip', 'gathering-outbound-corporate-trip', 'CORPORATE_TRIP', '🏕️'],
  ['Study Tour & Wisata Edukasi', 'study-tour-wisata-edukasi', 'STUDY_TOUR', '🎓'],
  ['Wisata Religi & Ziarah', 'wisata-religi-ziarah', 'RELIGI_ZIARAH', '🕌'],
  ['Event Perjalanan (MICE)', 'event-perjalanan-mice', 'MICE_EVENT', '🎤'],
] as const;

export default function ServiceMarketplaceAdminPage() {
  const { show } = useToast();
  const [tab, setTab] = useState<TabKey>('offerings');
  const [modal, setModal] = useState<ModalKey>(null);
  const [dashboard, setDashboard] = useState<any>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [offerings, setOfferings] = useState<any[]>([]);
  const [inquiries, setInquiries] = useState<any[]>([]);
  const [categoryForm, setCategoryForm] = useState<any>(emptyCategory);
  const [offeringForm, setOfferingForm] = useState<any>(emptyOffering);
  const [inquiryForm, setInquiryForm] = useState<any>(emptyInquiry);
  const [publishOffering, setPublishOffering] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState('');
  const activeList = tab === 'categories' ? categories : tab === 'offerings' ? offerings : inquiries;
  const offeringOptions = useMemo(() => offerings.filter((x) => x.status === 'Published' && x.isPublic), [offerings]);

  const load = async () => {
    setLoading(true);
    try {
      const [d, c, o, i] = await Promise.all([
        apiGet<any>('/api/ServiceMarketplace/admin/dashboard'),
        apiGet<any>('/api/ServiceMarketplace/admin/categories'),
        apiGet<any>('/api/ServiceMarketplace/admin/offerings'),
        apiGet<any>('/api/ServiceMarketplace/admin/inquiries'),
      ]);
      setDashboard(d?.data ?? null);
      setCategories(dedupe(c?.data ?? []));
      setOfferings(dedupe(o?.data ?? []));
      setInquiries(dedupe(i?.data ?? []));
    } catch (e: any) {
      show(e?.message || 'Gagal memuat layanan');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);

  const runSave = async (key: string, fn: () => Promise<void>) => {
    setSaving(key);
    try { await fn(); } catch (e: any) { show(e?.message || 'Aksi gagal'); } finally { setSaving(''); }
  };

  const saveCategory = () => runSave('category', async () => {
    if (!categoryForm.name.trim()) return show('Nama kategori wajib diisi');
    const body = { ...categoryForm, sortOrder: Number(categoryForm.sortOrder || 0), showOnHome: Boolean(categoryForm.showOnHome), isActive: Boolean(categoryForm.isActive) };
    if (categoryForm.id) await apiPut(`/api/ServiceMarketplace/admin/categories/${categoryForm.id}`, body);
    else await apiPost('/api/ServiceMarketplace/admin/categories', body);
    show(categoryForm.id ? 'Kategori diperbarui' : 'Kategori ditambahkan');
    setCategoryForm(emptyCategory); setModal(null); await load(); setTab('categories');
  });

  const saveOffering = () => runSave('offering', async () => {
    if (!Number(offeringForm.serviceCategoryId || 0)) return show('Kategori wajib dipilih');
    if (!offeringForm.title.trim()) return show('Judul offering wajib diisi');
    if (!offeringForm.description.trim()) return show('Deskripsi wajib diisi');
    const body = { 
      ...offeringForm, 
      serviceCategoryId: Number(offeringForm.serviceCategoryId || 0), 
      startingPrice: Number(offeringForm.startingPrice || 0), 
      sortOrder: Number(offeringForm.sortOrder || 0), 
      isFeatured: Boolean(offeringForm.isFeatured), 
      isPublic: Boolean(offeringForm.isPublic), 
      isActive: Boolean(offeringForm.isActive) 
    };
    if (offeringForm.id) await apiPut(`/api/ServiceMarketplace/admin/offerings/${offeringForm.id}`, body);
    else await apiPost('/api/ServiceMarketplace/admin/offerings', body);
    show(offeringForm.id ? 'Offering diperbarui' : 'Offering ditambahkan');
    setOfferingForm(emptyOffering); setModal(null); await load(); setTab('offerings');
  });

  const saveInquiry = () => runSave('inquiry', async () => {
    if (!inquiryForm.customerName.trim()) return show('Nama customer wajib diisi');
    if (!inquiryForm.customerPhone.trim()) return show('WhatsApp customer wajib diisi');
    await apiPost('/api/ServiceMarketplace/admin/inquiries', { ...inquiryForm, serviceCategoryId: Number(inquiryForm.serviceCategoryId || 0) || null, serviceOfferingId: Number(inquiryForm.serviceOfferingId || 0) || null, paxCount: Number(inquiryForm.paxCount || 1), estimatedBudget: Number(inquiryForm.estimatedBudget || 0) });
    show('Inquiry manual ditambahkan');
    setInquiryForm(emptyInquiry); setModal(null); await load(); setTab('inquiries');
  });

  const updateInquiry = (id: number, status: string) => runSave(`inq-${id}`, async () => {
    await apiPut(`/api/ServiceMarketplace/admin/inquiries/${id}/status`, { status, notes: `Set ${status} dari admin`, adminNotes: '' });
    show('Status inquiry diperbarui');
    await load();
  });

  const seedDefaults = () => runSave('seed', async () => {
    for (let idx = 0; idx < categoryPresets.length; idx++) {
      const [name, slug, code, icon] = categoryPresets[idx];
      if (categories.some((x) => x.slug === slug)) continue;
      await apiPost('/api/ServiceMarketplace/admin/categories', {
        ...emptyCategory,
        name, slug, code, icon,
        shortDescription: `Layanan ${name} AlfianTour.`,
        description: `Konsultasikan kebutuhan ${name} dengan tim AlfianTour.`,
        sortOrder: idx + 1,
        status: 'Published',
      });
    }
    show('Preset 10 layanan diproses');
    await load();
  });

  const openAdd = (key: ModalKey) => {
    if (key === 'category') setCategoryForm(emptyCategory);
    if (key === 'offering') setOfferingForm(emptyOffering);
    if (key === 'inquiry') setInquiryForm(emptyInquiry);
    setModal(key);
  };

  const editCategory = (x: any) => { setCategoryForm({ ...emptyCategory, ...x }); setModal('category'); };
  const editOffering = (x: any) => { setOfferingForm({ ...emptyOffering, ...x, serviceCategoryId: String(x.serviceCategoryId || '') }); setModal('offering'); };

  const action = tab === 'categories'
    ? <button type="button" className="rounded-xl bg-[#e8c978] hover:bg-[#dfbd63] text-zinc-950 px-4 py-2.5 text-xs font-bold transition-all shadow-sm flex items-center gap-1.5" onClick={() => openAdd('category')}><Plus size={14} className="stroke-[3]" /> Kategori</button>
    : tab === 'offerings'
      ? <button type="button" className="rounded-xl bg-[#e8c978] hover:bg-[#dfbd63] text-zinc-950 px-4 py-2.5 text-xs font-bold transition-all shadow-sm flex items-center gap-1.5" onClick={() => openAdd('offering')}><Plus size={14} className="stroke-[3]" /> Offering</button>
      : <button type="button" className="rounded-xl bg-[#e8c978] hover:bg-[#dfbd63] text-zinc-950 px-4 py-2.5 text-xs font-bold transition-all shadow-sm flex items-center gap-1.5" onClick={() => openAdd('inquiry')}><Plus size={14} className="stroke-[3]" /> Inquiry</button>;

  return (
    <div className="p-4 space-y-5 animate-fade-up max-w-[1400px] mx-auto">
      {/* Header Banner */}
      <section className="relative overflow-hidden rounded-[2rem] border border-zinc-800 bg-gradient-to-r from-zinc-950 via-zinc-900 to-emerald-950 p-6 text-white shadow-xl md:p-8">
        <div className="absolute -right-12 -top-12 h-44 w-44 rounded-full bg-amber-500/10 blur-3xl" />
        <div className="absolute -bottom-16 left-12 h-48 w-48 rounded-full bg-emerald-500/15 blur-3xl" />
        <div className="relative flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1.5">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-[#e8c978]">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Service Marketplace
            </span>
            <h1 className="text-2xl font-black tracking-tight md:text-3xl lg:text-4xl text-zinc-50">
              Kelola Hub Layanan
            </h1>
            <p className="max-w-2xl text-xs leading-relaxed text-zinc-400">
              Pusat kendali kategori layanan, katalog produk penawaran, inbound inquiries, serta pelacakan rujukan affiliate secara real-time.
            </p>
          </div>
          <div className="flex flex-wrap gap-2.5 shrink-0">
            <Link href="/layanan" target="_blank" className="rounded-full bg-emerald-500 hover:bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white transition-all shadow-md shadow-emerald-950/20 flex items-center gap-1.5">
              <span>Buka Portal Publik</span>
              <ExternalLink size={12} />
            </Link>
            <button 
              type="button"
              disabled={saving === 'seed'} 
              onClick={() => void seedDefaults()} 
              className="rounded-full border border-zinc-700 bg-zinc-800/80 px-4 py-2.5 text-xs font-bold text-zinc-100 hover:bg-zinc-700 hover:text-white transition-all disabled:opacity-60 flex items-center gap-1"
            >
              <span>⚡ Seed 10 Kategori</span>
            </button>
          </div>
        </div>
      </section>

      {/* Metrics Section */}
      <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-4">
        <Metric 
          label="Kategori Aktif" 
          value={`${dashboard?.categories || 0} Grup`} 
          hint="Pengelompokan Utama" 
          icon={<Layers size={18} />} 
          color="emerald" 
        />
        <Metric 
          label="Offering Publik" 
          value={`${dashboard?.publicOfferings || 0} Produk`} 
          hint="Tampil di Website" 
          icon={<Tag size={18} />} 
          color="blue" 
        />
        <Metric 
          label="Inquiry Baru" 
          value={`${dashboard?.newInquiries || 0} Leads`} 
          hint="Perlu Tindak Lanjut" 
          icon={<MessageSquare size={18} />} 
          color="amber" 
        />
        <Metric 
          label="Won Budget" 
          value={money(dashboard?.estimatedWonBudget)} 
          hint="Status Deal/Won" 
          icon={<DollarSign size={18} />} 
          color="purple" 
        />
      </div>

      {/* Main Switcher Area */}
      <section className="rounded-3xl border bg-white p-4 shadow-sm space-y-4">
        <div className="flex flex-col gap-3.5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex p-1 bg-zinc-100/80 rounded-xl w-full sm:w-auto overflow-x-auto space-x-1 border border-zinc-200/40">
            {(['categories', 'offerings', 'inquiries'] as TabKey[]).map((key) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={`px-4 py-2 font-bold text-xs rounded-lg transition-all whitespace-nowrap flex items-center gap-2 ${
                  tab === key
                    ? 'bg-white text-zinc-950 shadow-sm border border-zinc-200/30'
                    : 'text-zinc-500 hover:text-zinc-800'
                }`}
              >
                {key === 'categories' ? '📁 Kategori' : key === 'offerings' ? '🏷️ Penawaran' : '👤 Inquiry Masuk'}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
            {action}
            <button 
              type="button"
              className="rounded-xl border px-3.5 py-2.5 text-xs font-bold bg-zinc-50 hover:bg-zinc-100 transition-colors flex items-center gap-1.5" 
              onClick={() => void load()} 
              disabled={loading}
            >
              <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
              <span>{loading ? 'Memuat...' : 'Refresh'}</span>
            </button>
          </div>
        </div>

        {/* Content list block */}
        <div className="max-h-[660px] overflow-y-auto rounded-2xl border bg-zinc-50 p-4 min-h-[300px]">
          {loading ? <LoadingBlock /> : null}
          {!loading && activeList.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-zinc-200 bg-white p-16 text-center text-xs text-zinc-500 flex flex-col items-center justify-center gap-2">
              <span className="text-3xl">📭</span>
              <p className="font-semibold text-zinc-700">Belum ada data</p>
              <p className="text-zinc-400">Silakan tambahkan data baru menggunakan tombol di atas.</p>
            </div>
          ) : null}
          {!loading ? (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {tab === 'categories' ? categories.map((x) => (
                <Card key={x.id}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-zinc-100 border border-zinc-200 flex items-center justify-center text-xl shadow-xs shrink-0">
                        {x.icon || '🧳'}
                      </div>
                      <div>
                        <h3 className="font-extrabold text-sm text-zinc-900">{x.name}</h3>
                        <p className="text-[10px] text-zinc-400 font-mono mt-0.5">{x.slug} • #{x.sortOrder}</p>
                      </div>
                    </div>
                    <button 
                      type="button" 
                      className="rounded-lg border border-zinc-200 bg-white hover:bg-zinc-50 px-2.5 py-1 text-[11px] font-bold shadow-xs transition-colors shrink-0" 
                      onClick={() => editCategory(x)}
                    >
                      Edit
                    </button>
                  </div>
                  
                  {x.coverImageUrl ? (
                    <div className="w-full h-24 rounded-xl border border-zinc-200/60 relative overflow-hidden mt-2 bg-zinc-100">
                      <img src={x.coverImageUrl} alt={x.name} className="object-cover w-full h-full" />
                    </div>
                  ) : null}

                  <p className="text-[11px] text-zinc-500 line-clamp-2 mt-2 leading-relaxed">
                    {x.shortDescription || x.description || 'Tidak ada deskripsi.'}
                  </p>
                  
                  <div className="flex justify-between items-center pt-2.5 border-t border-zinc-200/60 mt-2.5">
                    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-extrabold ${
                      x.status === 'Published' 
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
                        : 'bg-zinc-100 text-zinc-500 border border-zinc-200'
                    }`}>
                      <span className={`h-1 w-1 rounded-full ${x.status === 'Published' ? 'bg-emerald-500' : 'bg-zinc-400'}`} />
                      {x.status}
                    </span>
                    <span className="text-[10px] text-zinc-400 bg-zinc-100 px-1.5 py-0.5 rounded font-mono">CODE: {x.code || '-'}</span>
                  </div>
                </Card>
              )) : null}

              {tab === 'offerings' ? offerings.map((x) => (
                <Card key={x.id}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-extrabold text-sm text-zinc-900 truncate leading-snug">{x.title}</h3>
                      <p className="text-[10px] text-zinc-400 mt-0.5 flex items-center gap-1">
                        <span>📁</span>
                        <span className="truncate">{x.categoryName || '-'}</span>
                      </p>
                    </div>
                    <button 
                      type="button" 
                      className="rounded-lg border border-zinc-200 bg-white hover:bg-zinc-50 px-2.5 py-1 text-[11px] font-bold shadow-xs transition-colors shrink-0" 
                      onClick={() => editOffering(x)}
                    >
                      Edit
                    </button>
                  </div>

                  {/* Offering Cover Image */}
                  <div className="w-full h-28 rounded-xl border border-zinc-200/60 relative overflow-hidden mt-2 bg-zinc-100">
                    <img 
                      src={x.coverImageUrl || "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?q=80&w=600&auto=format&fit=crop"} 
                      alt={x.title} 
                      className="object-cover w-full h-full" 
                    />
                    {x.isFeatured ? (
                      <span className="absolute top-2 left-2 bg-amber-500 text-white text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full shadow-xs flex items-center gap-0.5">
                        <Sparkles size={8} /> Featured
                      </span>
                    ) : null}
                    {x.isPublic ? (
                      <span className="absolute top-2 right-2 bg-emerald-500 text-white text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full shadow-xs">
                        Public
                      </span>
                    ) : (
                      <span className="absolute top-2 right-2 bg-zinc-700 text-white text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full shadow-xs flex items-center gap-0.5">
                        <EyeOff size={8} /> Private
                      </span>
                    )}
                  </div>

                  <p className="text-[11px] text-zinc-500 line-clamp-2 mt-2 leading-relaxed">
                    {x.shortDescription || x.description || 'Tidak ada deskripsi singkat.'}
                  </p>
                  
                  <div className="grid grid-cols-2 gap-1.5 mt-2.5 pt-2.5 border-t border-zinc-200/60">
                    <div className="rounded-lg bg-zinc-50 p-1.5 border border-zinc-200/30">
                      <div className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider">Mulai Harga</div>
                      <div className="font-extrabold text-xs text-emerald-700 mt-0.5">{money(x.startingPrice, x.currency)}</div>
                    </div>
                    <div className="rounded-lg bg-zinc-50 p-1.5 border border-zinc-200/30">
                      <div className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider">Satuan Unit</div>
                      <div className="font-extrabold text-xs text-zinc-700 mt-0.5">{x.priceUnit || 'paket'}</div>
                    </div>
                    {x.durationText ? (
                      <div className="rounded-lg bg-zinc-50 p-1.5 border border-zinc-200/30">
                        <div className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider">Durasi</div>
                        <div className="font-bold text-xs text-zinc-700 mt-0.5 truncate">⏱ {x.durationText}</div>
                      </div>
                    ) : null}
                    {x.locationText ? (
                      <div className="rounded-lg bg-zinc-50 p-1.5 border border-zinc-200/30">
                        <div className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider">Lokasi</div>
                        <div className="font-bold text-xs text-zinc-700 mt-0.5 truncate">📍 {x.locationText}</div>
                      </div>
                    ) : null}
                  </div>

                  <div className="flex justify-between items-center pt-2.5 border-t border-zinc-200/60 mt-2.5">
                    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-extrabold ${
                      x.status === 'Published' 
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
                        : 'bg-zinc-100 text-zinc-500 border border-zinc-200'
                    }`}>
                      <span className={`h-1 w-1 rounded-full ${x.status === 'Published' ? 'bg-emerald-500' : 'bg-zinc-400'}`} />
                      {x.status}
                    </span>
                    <div className="flex gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          setPublishOffering(x);
                          setModal('publish');
                        }}
                        className="rounded-lg border border-amber-200 bg-amber-50 hover:bg-amber-100 text-amber-800 px-2 py-1 text-[10px] font-bold transition-colors flex items-center gap-0.5 shadow-xs"
                      >
                        <span>Salin Link</span>
                        <Copy size={10} />
                      </button>
                      <Link 
                        href={`/layanan/${x.categorySlug}`} 
                        target="_blank" 
                        className="rounded-lg border border-zinc-200 bg-white hover:bg-zinc-50 px-2 py-1 text-[10px] font-bold text-zinc-700 transition-colors shadow-xs flex items-center gap-0.5"
                      >
                        <span>Detail</span>
                        <ExternalLink size={10} />
                      </Link>
                    </div>
                  </div>
                </Card>
              )) : null}

              {tab === 'inquiries' ? inquiries.map((x) => (
                <Card key={x.id}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-extrabold text-sm text-zinc-900 flex items-center gap-1.5">
                        <User size={14} className="text-zinc-500" />
                        <span>{x.customerName}</span>
                      </h3>
                      <p className="text-[10px] text-zinc-400 mt-0.5 font-mono flex items-center gap-1">
                        <Hash size={10} />
                        <span>{x.inquiryNo}</span>
                      </p>
                    </div>
                    <span className={`rounded-full px-2.5 py-0.5 text-[9px] font-black border uppercase tracking-wider ${
                      x.status === 'New' 
                        ? 'bg-blue-50 text-blue-700 border-blue-100' 
                        : x.status === 'Contacted' 
                          ? 'bg-amber-50 text-amber-700 border-amber-100 animate-pulse' 
                          : x.status === 'Qualified' 
                            ? 'bg-indigo-50 text-indigo-700 border-indigo-100' 
                            : x.status === 'Won' 
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                              : 'bg-zinc-100 text-zinc-500'
                    }`}>
                      {x.status}
                    </span>
                  </div>

                  <div className="space-y-1.5 bg-zinc-50 border border-zinc-200/50 rounded-xl p-2.5 mt-2">
                    <div className="flex justify-between text-[11px] items-center">
                      <span className="text-zinc-400">Layanan</span>
                      <span className="font-bold text-zinc-800 truncate max-w-[160px]">{x.categoryName || x.serviceSlug || '-'}</span>
                    </div>
                    <div className="flex justify-between text-[11px] items-center">
                      <span className="text-zinc-400">WhatsApp</span>
                      <a href={formatWhatsAppLink(x.customerPhone)} target="_blank" rel="noreferrer" className="font-bold text-emerald-600 hover:underline flex items-center gap-0.5">
                        <Phone size={10} />
                        <span>{x.customerPhone} ↗</span>
                      </a>
                    </div>
                    {x.refAgentUsername ? (
                      <div className="flex justify-between text-[11px] items-center">
                        <span className="text-zinc-400">Ref Agent</span>
                        <span className="font-bold text-zinc-800 bg-amber-50 border border-amber-100 px-1.5 py-0.5 rounded">@{x.refAgentUsername}</span>
                      </div>
                    ) : null}
                  </div>

                  <div className="grid grid-cols-2 gap-2 mt-2.5 pt-2.5 border-t border-zinc-200/60">
                    <div className="bg-white rounded-lg border border-zinc-200/40 p-1.5">
                      <span className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider flex items-center gap-1"><User size={9} /> Pax</span>
                      <span className="font-bold text-xs text-zinc-800 block mt-0.5">{x.paxCount} Orang</span>
                    </div>
                    <div className="bg-white rounded-lg border border-zinc-200/40 p-1.5">
                      <span className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider flex items-center gap-1"><DollarSign size={9} /> Budget</span>
                      <span className="font-bold text-xs text-emerald-700 block mt-0.5 truncate">{money(x.estimatedBudget, x.currency)}</span>
                    </div>
                  </div>

                  {x.message ? (
                    <div className="text-[11px] text-zinc-500 italic mt-2.5 leading-relaxed bg-white border border-zinc-200/50 p-2.5 rounded-xl">
                      "{x.message}"
                    </div>
                  ) : null}

                  <div className="flex flex-wrap gap-1 mt-3 pt-2.5 border-t border-zinc-200/60">
                    {[
                      { status: 'Contacted', label: '📞 Hubungi', class: 'hover:bg-amber-50 hover:text-amber-700 hover:border-amber-200 text-zinc-600' },
                      { status: 'Qualified', label: '✓ Qualify', class: 'hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200 text-zinc-600' },
                      { status: 'Won', label: '🏆 Won', class: 'hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 text-zinc-600' },
                      { status: 'Lost', label: '✕ Lost', class: 'hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200 text-zinc-600' },
                    ].map((btn) => (
                      <button 
                        key={btn.status} 
                        type="button"
                        disabled={saving === `inq-${x.id}`} 
                        className={`rounded-lg bg-white border border-zinc-200 px-2 py-1 text-[10px] font-bold disabled:opacity-60 transition-colors ${btn.class}`} 
                        onClick={() => void updateInquiry(x.id, btn.status)}
                      >
                        {btn.label}
                      </button>
                    ))}
                  </div>
                </Card>
              )) : null}
            </div>
          ) : null}
        </div>
      </section>

      <CrudModal 
        open={modal !== null} 
        title={
          modal === 'category' 
            ? '📁 Form Kategori Layanan' 
            : modal === 'offering' 
              ? '🏷️ Form Offering Layanan' 
              : modal === 'inquiry'
                ? '👤 Form Inquiry Manual'
                : '📢 Link Publikasi Agen & Referral'
        } 
        onClose={() => {
          setModal(null);
          setPublishOffering(null);
        }}
      >
        {modal === 'category' ? <CategoryForm form={categoryForm} setForm={setCategoryForm} saving={saving === 'category'} onSave={saveCategory} /> : null}
        {modal === 'offering' ? <OfferingForm form={offeringForm} setForm={setOfferingForm} categories={categories} saving={saving === 'offering'} onSave={saveOffering} /> : null}
        {modal === 'inquiry' ? <InquiryForm form={inquiryForm} setForm={setInquiryForm} categories={categories} offerings={offeringOptions} saving={saving === 'inquiry'} onSave={saveInquiry} /> : null}
        {modal === 'publish' ? <PublishForm offering={publishOffering} /> : null}
      </CrudModal>
    </div>
  );
}

function dedupe(rows: any[]) { return Array.from(new Map((rows || []).map((x) => [x.id, x])).values()); }

function Metric({ label, value, hint, icon, color }: { label: string; value: any; hint?: string; icon: ReactNode; color: 'emerald' | 'blue' | 'amber' | 'purple' }) { 
  const colorMap = {
    emerald: {
      bg: 'border-emerald-100 bg-emerald-50/20',
      text: 'text-emerald-700',
      iconBg: 'bg-emerald-100 text-emerald-700'
    },
    blue: {
      bg: 'border-blue-100 bg-blue-50/20',
      text: 'text-blue-700',
      iconBg: 'bg-blue-100 text-blue-700'
    },
    amber: {
      bg: 'border-amber-100 bg-amber-50/20',
      text: 'text-amber-700',
      iconBg: 'bg-amber-100 text-amber-700'
    },
    purple: {
      bg: 'border-purple-100 bg-purple-50/20',
      text: 'text-purple-700',
      iconBg: 'bg-purple-100 text-purple-700'
    }
  };
  const theme = colorMap[color];
  return (
    <div className={`rounded-3xl border p-4 shadow-xs bg-white hover:shadow-md transition-all duration-300 flex items-center justify-between gap-3 border-zinc-200/80`}>
      <div className="space-y-1">
        <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">{label}</p>
        <p className="text-lg font-black text-zinc-900">{value}</p>
        {hint ? <p className="text-[10px] text-zinc-400">{hint}</p> : null}
      </div>
      <div className={`h-9 w-9 rounded-2xl flex items-center justify-center shrink-0 ${theme.iconBg} font-bold`}>
        {icon}
      </div>
    </div>
  ); 
}

function LoadingBlock() { 
  return (
    <div className="flex min-h-[300px] flex-col items-center justify-center gap-3 rounded-2xl border bg-white text-xs text-zinc-500">
      <RefreshCw className="h-7 w-7 animate-spin text-emerald-600" />
      <span>Memuat data layanan...</span>
    </div>
  ); 
}

function Card({ children }: { children: ReactNode }) { 
  return (
    <div className="space-y-3 rounded-2xl border border-zinc-200 bg-white p-4 text-xs shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between">
      {children}
    </div>
  ); 
}

function CrudModal({ open, title, onClose, children }: { open: boolean; title: string; onClose: () => void; children: ReactNode }) { 
  return (
    <ModalShell open={open} onBackdropClick={onClose} contentWrapperClassName="relative h-full w-full flex items-center justify-center p-3 pointer-events-none">
      <div className="pointer-events-auto max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-[2rem] bg-white shadow-2xl border border-zinc-200 animate-fade-up">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-white/95 px-6 py-4.5">
          <h3 className="text-sm font-extrabold text-zinc-900">{title}</h3>
          <button className="rounded-full border border-zinc-200 hover:bg-zinc-50 px-3.5 py-1.5 text-xs font-bold transition-colors" onClick={onClose}>
            Tutup
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </ModalShell>
  ); 
}

function TextInput({ label, value, placeholder = '', onChange }: { label: string; value: any; placeholder?: string; onChange: (v: string) => void }) { 
  return (
    <label className="flex flex-col gap-1 text-[11px] font-bold text-zinc-700">
      <span>{label}</span>
      <input 
        className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-xs font-medium text-zinc-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all placeholder-zinc-400" 
        value={value ?? ''} 
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)} 
      />
    </label>
  ); 
}

function NumberInput({ label, value, onChange }: { label: string; value: any; onChange: (v: number) => void }) { 
  return (
    <label className="flex flex-col gap-1 text-[11px] font-bold text-zinc-700">
      <span>{label}</span>
      <input 
        type="number" 
        className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-xs font-medium text-zinc-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all" 
        value={value ?? 0} 
        onChange={(e) => onChange(Number(e.target.value || 0))} 
      />
    </label>
  ); 
}

function SelectInput({ label, value, options, onChange }: { label: string; value: any; options: Array<string | { value: string; label: string }>; onChange: (v: string) => void }) { 
  return (
    <label className="flex flex-col gap-1 text-[11px] font-bold text-zinc-700">
      <span>{label}</span>
      <select 
        className="w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-xs font-medium text-zinc-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all bg-white" 
        value={value ?? ''} 
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">Pilih {label}</option>
        {options.map((x) => { 
          const row = typeof x === 'string' ? { value: x, label: x } : x; 
          return <option key={row.value} value={row.value}>{row.label}</option>; 
        })}
      </select>
    </label>
  ); 
}

function SaveButton({ saving, onSave }: { saving: boolean; onSave: () => void }) { 
  return (
    <button 
      disabled={saving} 
      onClick={onSave} 
      className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 px-5 py-2.5 text-xs font-bold text-white disabled:opacity-60 transition-colors shadow-sm animate-fade-up"
    >
      {saving ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Check size={14} className="stroke-[2.5]" />}
      <span>{saving ? 'Menyimpan...' : 'Simpan Perubahan'}</span>
    </button>
  ); 
}

function CategoryForm({ form, setForm, saving, onSave }: { form: any; setForm: any; saving: boolean; onSave: () => void }) {
  return (
    <div className="space-y-4">
      <div className="bg-zinc-50 rounded-2xl p-4 border border-zinc-200/50 space-y-3.5">
        <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5"><LayoutGrid size={12} /> Informasi Utama</h4>
        <div className="grid gap-3 md:grid-cols-2">
          <TextInput label="Nama Kategori" value={form.name} onChange={(v) => setForm((p: any) => ({ ...p, name: v }))} />
          <TextInput label="Slug URL" value={form.slug} onChange={(v) => setForm((p: any) => ({ ...p, slug: v }))} />
          <TextInput label="Kode Unik" value={form.code} onChange={(v) => setForm((p: any) => ({ ...p, code: v }))} />
          <TextInput label="Icon Emoji/Teks" value={form.icon} onChange={(v) => setForm((p: any) => ({ ...p, icon: v }))} />
          <TextInput label="Cover Image URL" placeholder="https://..." value={form.coverImageUrl} onChange={(v) => setForm((p: any) => ({ ...p, coverImageUrl: v }))} />
          <TextInput label="Accent Color (Hex)" placeholder="#ffffff" value={form.accentColor} onChange={(v) => setForm((p: any) => ({ ...p, accentColor: v }))} />
          <NumberInput label="Urutan Urut" value={form.sortOrder} onChange={(v) => setForm((p: any) => ({ ...p, sortOrder: v }))} />
          <SelectInput label="Status" value={form.status} options={['Draft', 'Published', 'Archived']} onChange={(v) => setForm((p: any) => ({ ...p, status: v }))} />
        </div>
      </div>

      <div className="bg-zinc-50 rounded-2xl p-4 border border-zinc-200/50 space-y-3.5">
        <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5"><FileText size={12} /> Deskripsi Layanan</h4>
        <div className="space-y-3">
          <label className="flex flex-col gap-1 text-[11px] font-bold text-zinc-700">
            <span>Deskripsi Singkat</span>
            <textarea 
              className="min-h-[60px] w-full rounded-xl border border-zinc-200 px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium" 
              placeholder="Deskripsi singkat yang tampil di beranda..." 
              value={form.shortDescription || ''} 
              onChange={(e) => setForm((p: any) => ({ ...p, shortDescription: e.target.value }))} 
            />
          </label>
          <label className="flex flex-col gap-1 text-[11px] font-bold text-zinc-700">
            <span>Deskripsi Lengkap</span>
            <textarea 
              className="min-h-[100px] w-full rounded-xl border border-zinc-200 px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium" 
              placeholder="Detail penjelasan menyeluruh tentang kategori ini..." 
              value={form.description || ''} 
              onChange={(e) => setForm((p: any) => ({ ...p, description: e.target.value }))} 
            />
          </label>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        <div className="flex gap-4">
          <label className="flex items-center gap-2 rounded-xl border border-zinc-200 px-3.5 py-2.5 text-xs font-semibold cursor-pointer hover:bg-zinc-50 bg-white shadow-xs">
            <input 
              type="checkbox" 
              className="accent-emerald-600 h-4.5 w-4.5 rounded" 
              checked={Boolean(form.showOnHome)} 
              onChange={(e) => setForm((p: any) => ({ ...p, showOnHome: e.target.checked }))} 
            />
            <span>Tampilkan di Home</span>
          </label>
          <label className="flex items-center gap-2 rounded-xl border border-zinc-200 px-3.5 py-2.5 text-xs font-semibold cursor-pointer hover:bg-zinc-50 bg-white shadow-xs">
            <input 
              type="checkbox" 
              className="accent-emerald-600 h-4.5 w-4.5 rounded" 
              checked={Boolean(form.isActive)} 
              onChange={(e) => setForm((p: any) => ({ ...p, isActive: e.target.checked }))} 
            />
            <span>Kategori Aktif</span>
          </label>
        </div>
        <SaveButton saving={saving} onSave={onSave} />
      </div>
    </div>
  );
}

function OfferingForm({ form, setForm, categories, saving, onSave }: { form: any; setForm: any; categories: any[]; saving: boolean; onSave: () => void }) {
  return (
    <div className="space-y-4">
      {/* Group 1: Informasi Dasar */}
      <div className="bg-zinc-50 rounded-2xl p-4 border border-zinc-200/50 space-y-3.5">
        <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5"><Info size={12} /> Informasi Dasar & Kategori</h4>
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          <div className="md:col-span-2 lg:col-span-1">
            <SelectInput 
              label="Kategori Layanan" 
              value={form.serviceCategoryId} 
              options={categories.map((x) => ({ value: String(x.id), label: x.name }))} 
              onChange={(v) => setForm((p: any) => ({ ...p, serviceCategoryId: v }))} 
            />
          </div>
          <TextInput label="Judul Penawaran" placeholder="Contoh: Hotel Grand Sahid Jakarta" value={form.title} onChange={(v) => setForm((p: any) => ({ ...p, title: v }))} />
          <TextInput label="Slug URL" placeholder="hotel-grand-sahid-jakarta" value={form.slug} onChange={(v) => setForm((p: any) => ({ ...p, slug: v }))} />
          <SelectInput label="Tipe Layanan" value={form.serviceType} options={['consultation', 'booking', 'rental', 'package']} onChange={(v) => setForm((p: any) => ({ ...p, serviceType: v }))} />
          <TextInput label="Target Pelanggan" placeholder="Umum, Corporate, Keluarga, dsb" value={form.targetCustomer} onChange={(v) => setForm((p: any) => ({ ...p, targetCustomer: v }))} />
          <TextInput label="WhatsApp Khusus (Opsional)" placeholder="Format: 6281xxx atau 081xxx" value={form.contactWhatsApp} onChange={(v) => setForm((p: any) => ({ ...p, contactWhatsApp: v }))} />
        </div>
      </div>

      {/* Group 2: Harga & Detail */}
      <div className="bg-zinc-50 rounded-2xl p-4 border border-zinc-200/50 space-y-3.5">
        <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5"><DollarSign size={12} /> Harga, Waktu & Cakupan</h4>
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          <NumberInput label="Harga Mulai (IDR)" value={form.startingPrice} onChange={(v) => setForm((p: any) => ({ ...p, startingPrice: v }))} />
          <TextInput label="Satuan Unit" placeholder="malam, pax, trip, dsb" value={form.priceUnit} onChange={(v) => setForm((p: any) => ({ ...p, priceUnit: v }))} />
          <TextInput label="Durasi / Waktu" placeholder="Contoh: 3 Hari 2 Malam" value={form.durationText} onChange={(v) => setForm((p: any) => ({ ...p, durationText: v }))} />
          <TextInput label="Cakupan Lokasi" placeholder="Contoh: Jakarta, Mekkah, Nasional" value={form.locationText} onChange={(v) => setForm((p: any) => ({ ...p, locationText: v }))} />
        </div>
      </div>

      {/* Group 3: Media & Deskripsi */}
      <div className="bg-zinc-50 rounded-2xl p-4 border border-zinc-200/50 space-y-3.5">
        <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5"><FileText size={12} /> Deskripsi & Gambar Cover</h4>
        <div className="space-y-3">
          <TextInput label="URL Gambar Sampul (Foto)" placeholder="https://images.unsplash.com/..." value={form.coverImageUrl} onChange={(v) => setForm((p: any) => ({ ...p, coverImageUrl: v }))} />
          
          <div className="grid gap-3 md:grid-cols-2">
            <label className="flex flex-col gap-1 text-[11px] font-bold text-zinc-700">
              <span>Deskripsi Singkat</span>
              <textarea 
                className="min-h-[70px] w-full rounded-xl border border-zinc-200 px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium" 
                placeholder="Rangkuman 1-2 kalimat..." 
                value={form.shortDescription || ''} 
                onChange={(e) => setForm((p: any) => ({ ...p, shortDescription: e.target.value }))} 
              />
            </label>
            <label className="flex flex-col gap-1 text-[11px] font-bold text-zinc-700">
              <span>Deskripsi Lengkap</span>
              <textarea 
                className="min-h-[70px] w-full rounded-xl border border-zinc-200 px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium" 
                placeholder="Informasi detail penawaran..." 
                value={form.description || ''} 
                onChange={(e) => setForm((p: any) => ({ ...p, description: e.target.value }))} 
              />
            </label>
          </div>
        </div>
      </div>

      {/* Group 4: Rincian Tambahan */}
      <div className="bg-zinc-50 rounded-2xl p-4 border border-zinc-200/50 space-y-3.5">
        <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5"><Sparkles size={12} /> Keunggulan, Inclusions & Syarat (Gunakan Baris Baru / Enter)</h4>
        <div className="grid gap-3 md:grid-cols-2">
          <label className="flex flex-col gap-1 text-[11px] font-bold text-zinc-700">
            <span>Keunggulan / Highlights</span>
            <textarea 
              className="min-h-[80px] w-full rounded-xl border border-zinc-200 px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium" 
              placeholder="Dekat Masjidil Haram&#10;Sarapan Prasmanan Gratis&#10;Akses Kolam Renang" 
              value={form.highlights || ''} 
              onChange={(e) => setForm((p: any) => ({ ...p, highlights: e.target.value }))} 
            />
          </label>
          <label className="flex flex-col gap-1 text-[11px] font-bold text-zinc-700">
            <span>Termasuk Layanan (Inclusions)</span>
            <textarea 
              className="min-h-[80px] w-full rounded-xl border border-zinc-200 px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium" 
              placeholder="Kamar Executive Suite&#10;Welcome Drink&#10;Free WiFi High Speed" 
              value={form.includedItems || ''} 
              onChange={(e) => setForm((p: any) => ({ ...p, includedItems: e.target.value }))} 
            />
          </label>
          <label className="flex flex-col gap-1 text-[11px] font-bold text-zinc-700">
            <span>Tidak Termasuk (Exclusions)</span>
            <textarea 
              className="min-h-[80px] w-full rounded-xl border border-zinc-200 px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium" 
              placeholder="Laundry Service&#10;Tip untuk Porter&#10;Kebutuhan Pribadi" 
              value={form.excludedItems || ''} 
              onChange={(e) => setForm((p: any) => ({ ...p, excludedItems: e.target.value }))} 
            />
          </label>
          <label className="flex flex-col gap-1 text-[11px] font-bold text-zinc-700">
            <span>Syarat & Ketentuan (Terms)</span>
            <textarea 
              className="min-h-[80px] w-full rounded-xl border border-zinc-200 px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium" 
              placeholder="Check-in jam 14:00 wib&#10;Deposit diperlukan pada saat check-in&#10;Pembatalan H-7 gratis" 
              value={form.terms || ''} 
              onChange={(e) => setForm((p: any) => ({ ...p, terms: e.target.value }))} 
            />
          </label>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        <div className="flex gap-3">
          <label className="flex items-center gap-2 rounded-xl border border-zinc-200 px-3.5 py-2.5 text-xs font-semibold cursor-pointer hover:bg-zinc-50 bg-white shadow-xs">
            <input 
              type="checkbox" 
              className="accent-emerald-600 h-4.5 w-4.5 rounded" 
              checked={Boolean(form.isPublic)} 
              onChange={(e) => setForm((p: any) => ({ ...p, isPublic: e.target.checked }))} 
            />
            <span>Status Publik</span>
          </label>
          <label className="flex items-center gap-2 rounded-xl border border-zinc-200 px-3.5 py-2.5 text-xs font-semibold cursor-pointer hover:bg-zinc-50 bg-white shadow-xs">
            <input 
              type="checkbox" 
              className="accent-emerald-600 h-4.5 w-4.5 rounded" 
              checked={Boolean(form.isFeatured)} 
              onChange={(e) => setForm((p: any) => ({ ...p, isFeatured: e.target.checked }))} 
            />
            <span>Featured Product</span>
          </label>
          <label className="flex items-center gap-2 rounded-xl border border-zinc-200 px-3.5 py-2.5 text-xs font-semibold cursor-pointer hover:bg-zinc-50 bg-white shadow-xs">
            <input 
              type="checkbox" 
              className="accent-emerald-600 h-4.5 w-4.5 rounded" 
              checked={Boolean(form.isActive)} 
              onChange={(e) => setForm((p: any) => ({ ...p, isActive: e.target.checked }))} 
            />
            <span>Aktif / Enabled</span>
          </label>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="w-36">
            <SelectInput label="Status Tayang" value={form.status} options={['Draft', 'Published', 'Archived']} onChange={(v) => setForm((p: any) => ({ ...p, status: v }))} />
          </div>
          <div className="w-20">
            <NumberInput label="Urutan" value={form.sortOrder} onChange={(v) => setForm((p: any) => ({ ...p, sortOrder: v }))} />
          </div>
          <div className="pt-5">
            <SaveButton saving={saving} onSave={onSave} />
          </div>
        </div>
      </div>
    </div>
  );
}

function InquiryForm({ form, setForm, categories, offerings, saving, onSave }: { form: any; setForm: any; categories: any[]; offerings: any[]; saving: boolean; onSave: () => void }) {
  return (
    <div className="space-y-4">
      <div className="bg-zinc-50 rounded-2xl p-4 border border-zinc-200/50 space-y-3.5">
        <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5"><Layers size={12} /> Hubungan Layanan & Leads</h4>
        <div className="grid gap-3 md:grid-cols-2">
          <SelectInput label="Kategori" value={form.serviceCategoryId} options={categories.map((x) => ({ value: String(x.id), label: x.name }))} onChange={(v) => setForm((p: any) => ({ ...p, serviceCategoryId: v }))} />
          <SelectInput label="Offering Produk" value={form.serviceOfferingId} options={offerings.map((x) => ({ value: String(x.id), label: x.title }))} onChange={(v) => setForm((p: any) => ({ ...p, serviceOfferingId: v }))} />
        </div>
      </div>

      <div className="bg-zinc-50 rounded-2xl p-4 border border-zinc-200/50 space-y-3.5">
        <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5"><User size={12} /> Data Diri Konsumen</h4>
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          <TextInput label="Nama Customer" placeholder="Nama Lengkap" value={form.customerName} onChange={(v) => setForm((p: any) => ({ ...p, customerName: v }))} />
          <TextInput label="WhatsApp" placeholder="0812xxx atau 6281xxx" value={form.customerPhone} onChange={(v) => setForm((p: any) => ({ ...p, customerPhone: v }))} />
          <TextInput label="Email" placeholder="nama@email.com (opsional)" value={form.customerEmail} onChange={(v) => setForm((p: any) => ({ ...p, customerEmail: v }))} />
          <TextInput label="Nama Perusahaan" placeholder="PT. ABC (opsional)" value={form.companyName} onChange={(v) => setForm((p: any) => ({ ...p, companyName: v }))} />
          <NumberInput label="Pax Jumlah" value={form.paxCount} onChange={(v) => setForm((p: any) => ({ ...p, paxCount: v }))} />
          <NumberInput label="Estimasi Budget (IDR)" value={form.estimatedBudget} onChange={(v) => setForm((p: any) => ({ ...p, estimatedBudget: v }))} />
          <TextInput label="Rencana Perjalanan (Tanggal)" placeholder="Contoh: Akhir Agustus / Tanggal 25" value={form.travelDateText} onChange={(v) => setForm((p: any) => ({ ...p, travelDateText: v }))} />
          <TextInput label="Ref Agent Username" placeholder="Username agen rujukan (opsional)" value={form.refAgentUsername} onChange={(v) => setForm((p: any) => ({ ...p, refAgentUsername: v }))} />
        </div>
      </div>

      <div className="bg-zinc-50 rounded-2xl p-4 border border-zinc-200/50 space-y-3.5">
        <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5"><MessageSquare size={12} /> Pesan Detail Konsumen</h4>
        <label className="flex flex-col gap-1 text-[11px] font-bold text-zinc-700">
          <span>Catatan Kebutuhan</span>
          <textarea 
            className="min-h-[100px] w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium" 
            placeholder="Jelaskan kebutuhan khusus customer di sini..." 
            value={form.message || ''} 
            onChange={(e) => setForm((p: any) => ({ ...p, message: e.target.value }))} 
          />
        </label>
      </div>

      <div className="flex justify-end pt-2">
        <SaveButton saving={saving} onSave={onSave} />
      </div>
    </div>
  );
}

function PublishForm({ offering }: { offering: any }) {
  const { user } = useAuth();
  const locale = useLocale();
  const [agentName, setAgentName] = useState(user?.userName || '');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const cleanAgent = String(agentName || '').trim().replace(/^@/, '');

  // 1. Direct Link with Agent tag (Clean)
  const cleanLink = `${baseUrl}/${locale}/layanan/${offering?.categorySlug}${cleanAgent ? `@${encodeURIComponent(cleanAgent)}` : ''}`;
  
  // 2. Direct Link with query param (Fallback)
  const paramLink = `${baseUrl}/${locale}/layanan/${offering?.categorySlug}${cleanAgent ? `?ref_agent=${encodeURIComponent(cleanAgent)}` : ''}`;

  // 3. Agent Preview mode Link (Public publication menu access)
  const previewLink = `${baseUrl}/${locale}/layanan/${offering?.categorySlug}?agent=true`;

  const copy = async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2000);
    } catch {}
  };

  if (!offering) return null;

  return (
    <div className="space-y-5 animate-fade-up">
      <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 space-y-3.5">
        <h4 className="font-extrabold text-sm text-zinc-800 flex items-center gap-1.5">
          <Info size={16} className="text-zinc-500" />
          <span>Informasi Publikasi Layanan</span>
        </h4>
        <div className="grid gap-2 text-[11px] text-zinc-600 leading-relaxed font-semibold">
          <p>
            • Layanan: <span className="font-extrabold text-zinc-950">{offering.title}</span>
          </p>
          <p>
            • Kategori: <span className="font-extrabold text-zinc-950">{offering.categoryName || offering.categorySlug}</span>
          </p>
          <p>
            • Tautan default mengarah ke portal reservasi publik. Jika parameter agen/referral terdeteksi, sistem akan mengunci data rujukan di cookie browser customer selama 15 hari.
          </p>
        </div>
      </div>

      <div className="space-y-4 bg-white border border-zinc-200 rounded-3xl p-5 shadow-xs">
        <label className="flex flex-col gap-1 text-[11px] font-extrabold text-zinc-700">
          <span>Target Nama Pengguna Agen (Referral)</span>
          <input 
            className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-xs font-semibold text-zinc-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all placeholder-zinc-400" 
            value={agentName} 
            placeholder="Masukkan username agen (contoh: yohan)"
            onChange={(e) => setAgentName(e.target.value)} 
          />
          <span className="text-[10px] text-zinc-400 font-medium mt-0.5">Biarkan kosong jika ingin membuat link direct publik tanpa rujukan affiliate.</span>
        </label>

        <div className="space-y-4 pt-3 border-t">
          {/* Link 1: Clean format */}
          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <span className="text-[11px] font-black text-zinc-700">1. Tautan Bersih Rujukan (Direkomendasikan)</span>
              <button 
                type="button" 
                onClick={() => void copy(cleanLink, 'clean')} 
                className="text-[10px] text-emerald-600 font-black hover:underline flex items-center gap-0.5"
              >
                {copiedKey === 'clean' ? 'Tersalin ✓' : 'Salin Tautan'}
              </button>
            </div>
            <div className="break-all rounded-xl border bg-zinc-50 p-2.5 font-mono text-[10px] text-zinc-600 select-all border-zinc-200/50">
              {cleanLink}
            </div>
            <span className="text-[10px] text-zinc-400 font-medium block">
              Format bersahabat, menyamarkan struktur query rujukan affiliate (menggunakan <code>@username</code>).
            </span>
          </div>

          {/* Link 2: Parameter format */}
          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <span className="text-[11px] font-black text-zinc-700">2. Tautan Rujukan Parameter (Alternatif)</span>
              <button 
                type="button" 
                onClick={() => void copy(paramLink, 'param')} 
                className="text-[10px] text-emerald-600 font-black hover:underline flex items-center gap-0.5"
              >
                {copiedKey === 'param' ? 'Tersalin ✓' : 'Salin Tautan'}
              </button>
            </div>
            <div className="break-all rounded-xl border bg-zinc-50 p-2.5 font-mono text-[10px] text-zinc-600 select-all border-zinc-200/50">
              {paramLink}
            </div>
            <span className="text-[10px] text-zinc-400 font-medium block">
              Format standard menggunakan query string parameter <code>?ref_agent=username</code>.
            </span>
          </div>

          {/* Link 3: Preview format */}
          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <span className="text-[11px] font-black text-zinc-700">3. Tautan Akses Menu Agen Publik</span>
              <button 
                type="button" 
                onClick={() => void copy(previewLink, 'preview')} 
                className="text-[10px] text-emerald-600 font-black hover:underline flex items-center gap-0.5"
              >
                {copiedKey === 'preview' ? 'Tersalin ✓' : 'Salin Tautan'}
              </button>
            </div>
            <div className="break-all rounded-xl border bg-zinc-50 p-2.5 font-mono text-[10px] text-zinc-600 select-all border-zinc-200/50">
              {previewLink}
            </div>
            <span className="text-[10px] text-zinc-400 font-medium block">
              Membuka halaman langsung dengan menampilkan Menu Publikasi/Salin Link di sisi client tanpa mengharuskan login agen.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
