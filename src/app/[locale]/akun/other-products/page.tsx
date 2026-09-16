'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { API_BASE_URL, apiDelete, apiGet, apiPost, apiPut, getAuthToken } from '@/lib/api-client';

// ─── Types ───────────────────────────────────────────────────────────────────
type ProductType = 'OWN_PRODUCT' | 'AFFILIATE_PRODUCT';

type Product = {
  fileId: string;
  name: string;
  slug: string;
  description?: string | null;
  price: number;
  stock?: number | null;
  category?: string | null;
  productType: ProductType;
  marketplace?: string | null;
  affiliateUrl?: string | null;
  mainImageUrl?: string | null;
  isActive: boolean;
};

type FormState = Omit<Product, 'fileId'> & { fileId: string };

const EMPTY_FORM: FormState = {
  fileId: '',
  name: '',
  slug: '',
  description: '',
  price: 0,
  stock: 0,
  category: '',
  productType: 'OWN_PRODUCT',
  marketplace: 'Shopee',
  affiliateUrl: '',
  mainImageUrl: '',
  isActive: true,
};

const MARKETPLACE_OPTIONS = ['Shopee', 'Tokopedia', 'TikTok Shop', 'Lazada', 'Blibli', 'Other'];

const CATEGORY_OPTIONS = [
  'Oleh-Oleh', 'Perlengkapan Ibadah', 'Busana Muslim',
  'Koper & Travel Gear', 'Digital Product', 'Lainnya',
];

// ─── Bulk / AI helpers ────────────────────────────────────────────────────────
const defaultBulkJson = `{
  "Source": "WhatsAppAiExtract",
  "BatchRawText": "ISI_PESAN_PRODUK_DARI_WHATSAPP_DI_SINI",
  "Items": [
    {
      "Title": "Air Zam-Zam 5L Original Siap Kirim",
      "Name": "Air Zam-Zam 5L Original",
      "Slug": "air-zam-zam-5l-original",
      "Description": "Air Zam-Zam kemasan 5 liter untuk oleh-oleh jamaah.",
      "Price": 150000,
      "Stock": 30,
      "Category": "Oleh-Oleh",
      "ProductType": "OWN_PRODUCT",
      "Marketplace": null,
      "AffiliateUrl": null,
      "MainImageUrl": null,
      "IsActive": true,
      "SourceRawText": "Air Zam-Zam 5L original harga 150rb stok 30"
    }
  ]
}`;

const aiPromptTemplate = `Anda adalah AI Data Engineer senior untuk Alfian Tour. Tugas Anda mengekstrak SATU ATAU BEBERAPA pesan produk dari WhatsApp/admin menjadi JSON produk marketplace yang siap dieksekusi sistem.

BERIKUT INI DATA YANG ADA:
["DI_ISI_DARI_INPUT_PESAN_PRODUK_DARI_WHATSAPP"]

Aturan ketat:
1. DETEKSI MULTIPLE ITEMS: Jika teks berisi beberapa produk, pecah menjadi beberapa object di array "Items".
2. GENERATE TITLE / NAME: Field "Title" dan "Name" WAJIB diisi, tidak boleh string kosong.
3. INFERENSI KATEGORI: Isi "Category" secara rapi, contoh: "Oleh-Oleh", "Perlengkapan Ibadah", "Busana Muslim", "Koper & Travel Gear", "Digital Product", "Lainnya".
4. HARGA DAN STOK: "Price" wajib angka murni rupiah tanpa titik/koma. Contoh "150rb" menjadi 150000.
5. PRODUCT TYPE: OWN_PRODUCT = stok internal Alfian Tour. AFFILIATE_PRODUCT = link ke Shopee/Tokopedia/TikTok Shop/Lazada.
6. FIELD URL DAN SLUG: "Slug" isi slug SEO huruf kecil dengan tanda hubung. "MainImageUrl" isi null jika tidak ada.
7. DESKRIPSI: "Description" wajib ringkas, menjual, dan rapi.
8. DEFAULT VALUES: "IsActive": true. "SourceRawText": wajib diisi.

OUTPUT: Wajib hanya mengeluarkan JSON valid, tanpa teks pembuka/penutup, tanpa markdown.

FORMAT JSON WAJIB:
{
  "Source": "WhatsAppAiExtract",
  "BatchRawText": "[ISI_SELURUH_TEKS_INPUT_MENTAH_DI_SINI]",
  "Items": [
    {
      "Title": "",
      "Name": "",
      "Slug": "",
      "Description": "",
      "Price": 0,
      "Stock": 0,
      "Category": "",
      "ProductType": "OWN_PRODUCT",
      "Marketplace": null,
      "AffiliateUrl": null,
      "MainImageUrl": null,
      "IsActive": true,
      "SourceRawText": ""
    }
  ]
}`;

// ─── Utilities ────────────────────────────────────────────────────────────────
function cleanText(value: unknown): string {
  return String(value ?? '').trim();
}

function normalizeProductType(value: unknown): ProductType {
  const raw = cleanText(value).toUpperCase();
  return raw === 'AFFILIATE_PRODUCT' || raw === 'MARKETPLACE' ? 'AFFILIATE_PRODUCT' : 'OWN_PRODUCT';
}

function normalizeBulkPayload(raw: unknown) {
  const sourceRows = Array.isArray(raw)
    ? raw
    : Array.isArray((raw as any)?.Items)
      ? (raw as any).Items
      : [];
  if (!sourceRows.length) throw new Error('Bulk JSON harus array atau object dengan field Items yang tidak kosong');

  return sourceRows.map((row: any, idx: number) => {
    const name = cleanText(row?.Name ?? row?.name ?? row?.Title ?? row?.title);
    if (!name) throw new Error(`Item ke-${idx + 1}: Title/Name wajib diisi`);
    const productType = normalizeProductType(row?.ProductType ?? row?.productType);
    const marketplace = cleanText(row?.Marketplace ?? row?.marketplace);
    if (productType === 'AFFILIATE_PRODUCT' && !marketplace)
      throw new Error(`Item ke-${idx + 1}: Marketplace wajib diisi untuk produk marketplace`);
    return {
      name,
      slug: cleanText(row?.Slug ?? row?.slug),
      description: cleanText(row?.Description ?? row?.description ?? row?.Notes ?? row?.notes),
      price: Number(row?.Price ?? row?.price ?? 0),
      stock: productType === 'AFFILIATE_PRODUCT' ? null : Number(row?.Stock ?? row?.stock ?? 0),
      category: cleanText(row?.Category ?? row?.category) || 'Lainnya',
      productType,
      marketplace: productType === 'AFFILIATE_PRODUCT' ? marketplace : null,
      affiliateUrl: productType === 'AFFILIATE_PRODUCT' ? (cleanText(row?.AffiliateUrl ?? row?.affiliateUrl) || null) : null,
      mainImageUrl: cleanText(row?.MainImageUrl ?? row?.mainImageUrl) || null,
      isActive: row?.IsActive ?? row?.isActive ?? true,
    };
  });
}

function formatRupiah(value: number): string {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(value);
}

// ─── Sub-components ───────────────────────────────────────────────────────────
function Toast({ message, type, onClose }: { message: string; type: 'success' | 'error'; onClose: () => void }) {
  useEffect(() => {
    const t = setTimeout(onClose, 4000);
    return () => clearTimeout(t);
  }, [message, onClose]);

  return (
    <div className={`fixed top-5 right-5 z-[9999] flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl text-sm font-medium transition-all animate-slide-up
      ${type === 'success' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'}`}>
      <span>{type === 'success' ? '✅' : '❌'}</span>
      <span>{message}</span>
      <button onClick={onClose} className="ml-2 opacity-70 hover:opacity-100 text-lg leading-none">×</button>
    </div>
  );
}

function Badge({ type }: { type: ProductType }) {
  return type === 'AFFILIATE_PRODUCT' ? (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-100 text-amber-700 border border-amber-200">
      🛍️ Marketplace
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-700 border border-emerald-200">
      📦 Produk Resmi
    </span>
  );
}

// ─── Rupiah helpers ───────────────────────────────────────────────────────────
function parseRupiahInput(val: string): number {
  return Number(val.replace(/[^0-9]/g, '')) || 0;
}
function displayRupiah(val: number): string {
  if (!val) return '';
  return val.toLocaleString('id-ID');
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function OtherProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [activeTab, setActiveTab] = useState<'products' | 'bulk' | 'ai'>('products');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'ALL' | ProductType>('ALL');
  const [showModal, setShowModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<Product | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [priceDisplay, setPriceDisplay] = useState('');
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [bulkJson, setBulkJson] = useState(defaultBulkJson);
  const [bulkLoading, setBulkLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const priceInputRef = useRef<HTMLInputElement>(null);

  const isAffiliate = form.productType === 'AFFILIATE_PRODUCT';
  const isEditing = Boolean(form.fileId);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
  };

  // ── Load products ────────────────────────────────────────────────────────
  const loadProducts = async () => {
    try {
      const res = await apiGet<any>('/api/Products?page=1&pageSize=200');
      setProducts(res?.data?.items ?? res?.items ?? []);
    } catch (e: any) {
      showToast(e?.message || 'Gagal memuat produk', 'error');
    }
  };

  useEffect(() => { void loadProducts(); }, []);

  // ── Filtered list ────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    return products.filter((p) => {
      const matchType = filterType === 'ALL' || p.productType === filterType;
      const q = searchQuery.toLowerCase();
      const matchSearch = !q || p.name.toLowerCase().includes(q) || (p.category ?? '').toLowerCase().includes(q);
      return matchType && matchSearch;
    });
  }, [products, filterType, searchQuery]);

  // ── Payload ──────────────────────────────────────────────────────────────
  const payload = useMemo(() => ({
    name: form.name,
    slug: form.slug,
    description: form.description,
    price: Number(form.price || 0),
    stock: isAffiliate ? null : Number(form.stock || 0),
    category: form.category,
    productType: form.productType,
    marketplace: isAffiliate ? form.marketplace : null,
    affiliateUrl: isAffiliate ? (form.affiliateUrl || null) : null,
    mainImageUrl: form.mainImageUrl || null,
    isActive: Boolean(form.isActive),
  }), [form, isAffiliate]);

  // ── Open modal ───────────────────────────────────────────────────────────
  const openCreate = () => {
    setForm(EMPTY_FORM);
    setPriceDisplay('');
    setFormErrors({});
    setUploadFile(null);
    setShowModal(true);
  };

  const openEdit = (p: Product) => {
    setForm({
      fileId: p.fileId,
      name: p.name,
      slug: p.slug,
      description: p.description ?? '',
      price: p.price,
      stock: p.stock ?? 0,
      category: p.category ?? '',
      productType: p.productType,
      marketplace: p.marketplace ?? 'Shopee',
      affiliateUrl: p.affiliateUrl ?? '',
      mainImageUrl: p.mainImageUrl ?? '',
      isActive: p.isActive,
    });
    setPriceDisplay(displayRupiah(p.price));
    setFormErrors({});
    setUploadFile(null);
    setShowModal(true);
  };

  // ── Generate slug ────────────────────────────────────────────────────────
  const generateSlug = () => {
    const slug = (form.name || '')
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
    setForm(p => ({ ...p, slug }));
  };

  // ── Save ─────────────────────────────────────────────────────────────────
  const save = async () => {
    // Inline validation
    const errs: Record<string, string> = {};
    if (!cleanText(payload.name)) errs.name = 'Nama produk wajib diisi';
    if (!payload.category) errs.category = 'Kategori wajib dipilih';
    if (isAffiliate && !cleanText(form.marketplace ?? '')) errs.marketplace = 'Platform wajib dipilih';
    if (Object.keys(errs).length) {
      setFormErrors(errs);
      showToast('Lengkapi field yang wajib diisi', 'error');
      return;
    }
    setFormErrors({});
    setLoading(true);
    try {
      if (isEditing) await apiPut(`/api/Products/${form.fileId}`, payload as any);
      else await apiPost('/api/Products', payload as any);
      showToast(isEditing ? 'Produk berhasil diperbarui' : 'Produk berhasil ditambahkan');
      setShowModal(false);
      setForm(EMPTY_FORM);
      setPriceDisplay('');
      await loadProducts();
    } catch (e: any) {
      showToast(e?.message || 'Gagal menyimpan produk', 'error');
    } finally { setLoading(false); }
  };

  // ── Upload image ─────────────────────────────────────────────────────────
  const uploadImage = async () => {
    if (!form.fileId || !uploadFile) return;
    setUploading(true);
    try {
      const token = getAuthToken();
      const fd = new FormData();
      fd.append('file', uploadFile);
      const res = await fetch(`${API_BASE_URL}/api/Products/${form.fileId}/images`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        body: fd,
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.message || `HTTP ${res.status}`);
      showToast('Gambar berhasil diunggah');
      setUploadFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      await loadProducts();
    } catch (e: any) {
      showToast(e?.message || 'Gagal upload gambar', 'error');
    } finally { setUploading(false); }
  };

  // ── Delete ───────────────────────────────────────────────────────────────
  const confirmDelete = async () => {
    if (!deleteConfirm) return;
    try {
      await apiDelete(`/api/Products/${deleteConfirm.fileId}`);
      showToast('Produk berhasil dihapus');
      setDeleteConfirm(null);
      await loadProducts();
    } catch (e: any) {
      showToast(e?.message || 'Gagal menghapus produk', 'error');
    }
  };

  // ── Toggle active ────────────────────────────────────────────────────────
  const toggleActive = async (p: Product) => {
    try {
      await apiPut(`/api/Products/${p.fileId}`, { ...p, isActive: !p.isActive } as any);
      showToast(`Produk ${!p.isActive ? 'diaktifkan' : 'dinonaktifkan'}`);
      await loadProducts();
    } catch (e: any) {
      showToast(e?.message || 'Gagal mengubah status', 'error');
    }
  };

  // ── Bulk import ──────────────────────────────────────────────────────────
  const runBulk = async () => {
    setBulkLoading(true);
    try {
      const parsed = JSON.parse(bulkJson);
      const rows = normalizeBulkPayload(parsed);
      for (const row of rows) await apiPost('/api/Products', row as any);
      showToast(`Bulk import berhasil: ${rows.length} produk ditambahkan`);
      setBulkJson(defaultBulkJson);
      await loadProducts();
      setActiveTab('products');
    } catch (e: any) {
      showToast(e?.message || 'Gagal bulk import', 'error');
    } finally { setBulkLoading(false); }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────
  const stats = {
    total: products.length,
    own: products.filter(p => p.productType === 'OWN_PRODUCT').length,
    affiliate: products.filter(p => p.productType === 'AFFILIATE_PRODUCT').length,
    active: products.filter(p => p.isActive).length,
  };

  return (
    <>
      <style>{`
        @keyframes slide-up { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
        .animate-slide-up { animation: slide-up 0.3s ease; }
        @keyframes fade-in { from { opacity:0; } to { opacity:1; } }
        .animate-fade-in { animation: fade-in 0.2s ease; }
      `}</style>

      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 p-4 md:p-6 space-y-6">

        {/* ── Header ────────────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">🛒 Produk Marketplace</h1>
            <p className="text-sm text-slate-500 mt-0.5">Kelola produk resmi & afiliasi Alfian Tour</p>
          </div>
          <button
            onClick={openCreate}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-xl shadow-sm transition-all"
          >
            <span className="text-base">+</span> Tambah Produk
          </button>
        </div>

        {/* ── Stats ─────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Total Produk', value: stats.total, icon: '📦', color: 'bg-blue-50 border-blue-100 text-blue-700' },
            { label: 'Produk Resmi', value: stats.own, icon: '🏷️', color: 'bg-emerald-50 border-emerald-100 text-emerald-700' },
            { label: 'Marketplace', value: stats.affiliate, icon: '🛍️', color: 'bg-amber-50 border-amber-100 text-amber-700' },
            { label: 'Aktif', value: stats.active, icon: '✅', color: 'bg-violet-50 border-violet-100 text-violet-700' },
          ].map(s => (
            <div key={s.label} className={`rounded-2xl border p-4 ${s.color}`}>
              <div className="text-2xl mb-1">{s.icon}</div>
              <div className="text-2xl font-bold">{s.value}</div>
              <div className="text-xs font-medium opacity-80">{s.label}</div>
            </div>
          ))}
        </div>

        {/* ── Tabs ──────────────────────────────────────────────────────── */}
        <div className="flex gap-1 bg-white border border-slate-200 rounded-xl p-1 w-fit">
          {([['products', '📋 Daftar Produk'], ['bulk', '⚡ Bulk Import'], ['ai', '🤖 AI Prompt']] as const).map(([tab, label]) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${activeTab === tab ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'}`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* ════════════════════════════════════════════════════════════════ */}
        {/* TAB: Product List                                               */}
        {/* ════════════════════════════════════════════════════════════════ */}
        {activeTab === 'products' && (
          <div className="space-y-4 animate-fade-in">
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">🔍</span>
                <input
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                  placeholder="Cari nama atau kategori produk…"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                />
              </div>
              <select
                className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                value={filterType}
                onChange={e => setFilterType(e.target.value as any)}
              >
                <option value="ALL">Semua Tipe</option>
                <option value="OWN_PRODUCT">Produk Resmi</option>
                <option value="AFFILIATE_PRODUCT">Marketplace</option>
              </select>
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
              {filtered.length === 0 ? (
                <div className="py-16 text-center text-slate-400">
                  <div className="text-5xl mb-3">📭</div>
                  <div className="font-medium">Belum ada produk ditemukan</div>
                  <div className="text-xs mt-1">Tambah produk baru atau ubah filter pencarian</div>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50 text-xs text-slate-500 uppercase tracking-wide">
                        <th className="text-left py-3 px-4 font-semibold">Produk</th>
                        <th className="text-left py-3 px-4 font-semibold hidden md:table-cell">Kategori</th>
                        <th className="text-right py-3 px-4 font-semibold">Harga</th>
                        <th className="text-center py-3 px-4 font-semibold hidden sm:table-cell">Stok/Tipe</th>
                        <th className="text-center py-3 px-4 font-semibold">Status</th>
                        <th className="text-right py-3 px-4 font-semibold">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {filtered.map((p) => (
                        <tr key={p.fileId} className="hover:bg-slate-50/70 transition-colors">
                          {/* Name + type badge */}
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              <div
                                className="w-10 h-10 rounded-xl bg-slate-100 overflow-hidden flex-shrink-0 flex items-center justify-center text-lg"
                              >
                                {p.mainImageUrl ? (
                                  <img
                                    src={p.mainImageUrl}
                                    alt={p.name}
                                    className="w-full h-full object-cover"
                                    onError={e => { (e.target as HTMLImageElement).src = `https://placehold.co/40x40/e2e8f0/94a3b8?text=📦`; }}
                                  />
                                ) : '📦'}
                              </div>
                              <div className="min-w-0">
                                <div className="font-semibold text-slate-800 truncate max-w-[160px]">{p.name}</div>
                                <Badge type={p.productType} />
                              </div>
                            </div>
                          </td>
                          {/* Category */}
                          <td className="py-3 px-4 hidden md:table-cell text-slate-600 text-xs">{p.category || '—'}</td>
                          {/* Price */}
                          <td className="py-3 px-4 text-right font-semibold text-slate-800">
                            {formatRupiah(p.price)}
                          </td>
                          {/* Stock / Marketplace */}
                          <td className="py-3 px-4 text-center hidden sm:table-cell text-xs text-slate-600">
                            {p.productType === 'AFFILIATE_PRODUCT'
                              ? <span className="px-2 py-0.5 bg-amber-50 text-amber-700 rounded-full border border-amber-100">{p.marketplace}</span>
                              : <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full">Stok: {p.stock ?? 0}</span>
                            }
                          </td>
                          {/* Status toggle */}
                          <td className="py-3 px-4 text-center">
                            <button
                              onClick={() => void toggleActive(p)}
                              title={p.isActive ? 'Klik untuk nonaktifkan' : 'Klik untuk aktifkan'}
                              className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${p.isActive ? 'bg-emerald-500' : 'bg-slate-300'}`}
                            >
                              <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${p.isActive ? 'translate-x-4' : 'translate-x-1'}`} />
                            </button>
                          </td>
                          {/* Actions */}
                          <td className="py-3 px-4">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => openEdit(p)}
                                className="p-2 rounded-lg hover:bg-blue-50 text-slate-500 hover:text-blue-600 transition-colors text-base"
                                title="Edit produk"
                              >✏️</button>
                              <button
                                onClick={() => setDeleteConfirm(p)}
                                className="p-2 rounded-lg hover:bg-red-50 text-slate-500 hover:text-red-600 transition-colors text-base"
                                title="Hapus produk"
                              >🗑️</button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════ */}
        {/* TAB: Bulk Import                                                */}
        {/* ════════════════════════════════════════════════════════════════ */}
        {activeTab === 'bulk' && (
          <div className="animate-fade-in space-y-4">
            <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4 shadow-sm">
              <div>
                <h2 className="font-bold text-slate-800 text-base">⚡ Bulk Import JSON</h2>
                <p className="text-xs text-slate-500 mt-1">
                  Tempel output JSON dari AI ke sini, lalu klik Execute. Format wrapper Items atau array langsung.
                </p>
              </div>
              <textarea
                className="w-full min-h-64 border border-slate-200 rounded-xl px-4 py-3 font-mono text-xs bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-300 resize-none"
                value={bulkJson}
                onChange={e => setBulkJson(e.target.value)}
              />
              <div className="flex gap-3">
                <button
                  disabled={bulkLoading}
                  onClick={() => void runBulk()}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold text-sm rounded-xl transition-all"
                >
                  {bulkLoading ? '⏳ Mengimpor…' : '⚡ Execute Import'}
                </button>
                <button
                  onClick={() => setBulkJson(defaultBulkJson)}
                  className="px-4 py-2.5 border border-slate-200 hover:bg-slate-50 text-sm font-medium rounded-xl transition-all text-slate-700"
                >
                  Reset Contoh
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════ */}
        {/* TAB: AI Prompt                                                  */}
        {/* ════════════════════════════════════════════════════════════════ */}
        {activeTab === 'ai' && (
          <div className="animate-fade-in">
            <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="font-bold text-slate-800 text-base">🤖 AI Prompt Generator</h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Copy prompt ini ke ChatGPT / Gemini, tempelkan pesan WhatsApp produk, lalu salin hasilnya ke tab Bulk Import.
                  </p>
                </div>
                <button
                  onClick={() => navigator.clipboard.writeText(aiPromptTemplate).then(() => showToast('Prompt berhasil disalin!'))}
                  className="flex-shrink-0 inline-flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-xl transition-all"
                >
                  📋 Copy Prompt
                </button>
              </div>
              <textarea
                className="w-full min-h-96 border border-slate-200 rounded-xl px-4 py-3 font-mono text-xs bg-slate-50 resize-none focus:outline-none"
                value={aiPromptTemplate}
                readOnly
              />
              <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-xl text-xs text-blue-700">
                <span>💡</span>
                <span>Setelah mendapatkan JSON dari AI, copy ke tab <strong>Bulk Import</strong> dan klik Execute.</span>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* MODAL: Create / Edit Product                                      */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      {showModal && (
        <div className="fixed inset-0 z-[9998] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
            {/* Modal header */}
            <div className="sticky top-0 bg-white rounded-t-3xl border-b border-slate-100 px-6 py-4 flex items-center justify-between">
              <div>
                <h2 className="font-bold text-slate-800 text-lg">{isEditing ? '✏️ Edit Produk' : '➕ Tambah Produk'}</h2>
                <p className="text-xs text-slate-500 mt-0.5">{isEditing ? `ID: ${form.fileId}` : 'Isi form di bawah untuk menambah produk baru'}</p>
              </div>
              <button onClick={() => setShowModal(false)} className="w-9 h-9 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-500 text-lg transition-colors">×</button>
            </div>

            <div className="px-6 py-5 space-y-4">
              {/* Tipe Produk */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Tipe Produk</label>
                <div className="flex gap-2">
                  {(['OWN_PRODUCT', 'AFFILIATE_PRODUCT'] as ProductType[]).map(t => (
                    <button
                      key={t}
                      onClick={() => setForm(p => ({ ...p, productType: t }))}
                      className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border transition-all ${form.productType === t ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300'}`}
                    >
                      {t === 'OWN_PRODUCT' ? '📦 Produk Resmi' : '🛍️ Marketplace'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Nama Produk <span className="text-red-500">*</span></label>
                <input
                  className={`w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 ${
                    formErrors.name ? 'border-red-400 ring-2 ring-red-100' : 'border-slate-200'
                  }`}
                  placeholder="contoh: Air Zam-Zam 5L Original"
                  value={form.name}
                  onChange={e => {
                    setForm(p => ({ ...p, name: e.target.value }));
                    if (formErrors.name) setFormErrors(prev => ({ ...prev, name: '' }));
                  }}
                />
                {formErrors.name && <p className="mt-1 text-xs text-red-500">{formErrors.name}</p>}
              </div>

              {/* Slug & Category */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Slug</label>
                  <div className="flex gap-1.5">
                    <input
                      className="flex-1 min-w-0 px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                      placeholder="air-zam-zam-5l"
                      value={form.slug}
                      onChange={e => setForm(p => ({ ...p, slug: e.target.value }))}
                    />
                    <button
                      type="button"
                      onClick={generateSlug}
                      title="Generate slug dari nama produk"
                      className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-xl border border-slate-200 bg-white hover:bg-blue-50 hover:border-blue-300 text-slate-500 hover:text-blue-600 transition-all text-base"
                    >
                      ✨
                    </button>
                  </div>
                  <p className="mt-1 text-[10px] text-slate-400">Klik ✨ untuk generate dari nama</p>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Kategori <span className="text-red-500">*</span></label>
                  <select
                    className={`w-full px-3 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white ${
                      formErrors.category ? 'border-red-400 ring-2 ring-red-100' : 'border-slate-200'
                    }`}
                    value={form.category ?? ''}
                    onChange={e => {
                      setForm(p => ({ ...p, category: e.target.value }));
                      if (formErrors.category) setFormErrors(prev => ({ ...prev, category: '' }));
                    }}
                  >
                    <option value="">Pilih kategori…</option>
                    {CATEGORY_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  {formErrors.category && <p className="mt-1 text-xs text-red-500">{formErrors.category}</p>}
                </div>
              </div>

              {/* Price & Stock */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Harga <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-semibold select-none">Rp</span>
                    <input
                      ref={priceInputRef}
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 font-medium"
                      inputMode="numeric"
                      placeholder="0"
                      value={priceDisplay}
                      onFocus={e => e.target.select()}
                      onChange={e => {
                        const raw = parseRupiahInput(e.target.value);
                        setPriceDisplay(displayRupiah(raw));
                        setForm(p => ({ ...p, price: raw }));
                      }}
                      onBlur={() => setPriceDisplay(displayRupiah(form.price))}
                    />
                  </div>
                  {form.price > 0 && (
                    <p className="mt-1 text-[10px] text-slate-400">{formatRupiah(form.price)}</p>
                  )}
                </div>
                {!isAffiliate && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">Stok</label>
                    <input
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                      inputMode="numeric"
                      placeholder="0"
                      value={form.stock ?? 0}
                      onFocus={e => e.target.select()}
                      onChange={e => setForm(p => ({ ...p, stock: Number(e.target.value.replace(/[^0-9]/g, '') || 0) }))}
                    />
                  </div>
                )}
              </div>

              {/* Affiliate fields */}
              {isAffiliate && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">Platform</label>
                    <select
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white"
                      value={form.marketplace ?? 'Shopee'}
                      onChange={e => setForm(p => ({ ...p, marketplace: e.target.value }))}
                    >
                      {MARKETPLACE_OPTIONS.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">URL Afiliasi</label>
                    <input
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                      placeholder="https://shopee.co.id/..."
                      value={form.affiliateUrl ?? ''}
                      onChange={e => setForm(p => ({ ...p, affiliateUrl: e.target.value }))}
                    />
                  </div>
                </div>
              )}

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Deskripsi</label>
                <textarea
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 resize-none min-h-24"
                  placeholder="Deskripsi singkat produk…"
                  value={form.description ?? ''}
                  onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                />
              </div>

              {/* Image URL */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">URL Gambar Utama (opsional)</label>
                <input
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                  placeholder="https://…"
                  value={form.mainImageUrl ?? ''}
                  onChange={e => setForm(p => ({ ...p, mainImageUrl: e.target.value }))}
                />
              </div>

              {/* Upload image (only when editing) */}
              {isEditing && (
                <div className="rounded-xl border border-dashed border-slate-300 p-4 bg-slate-50 space-y-2">
                  <div className="text-xs font-semibold text-slate-600">🖼️ Upload Gambar Produk</div>
                  <div className="flex items-center gap-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="text-xs text-slate-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border file:border-slate-200 file:text-xs file:font-medium file:bg-white file:text-slate-700 hover:file:bg-slate-50"
                      onChange={e => setUploadFile(e.target.files?.[0] ?? null)}
                    />
                    <button
                      disabled={!uploadFile || uploading}
                      onClick={() => void uploadImage()}
                      className="flex-shrink-0 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white text-xs font-semibold rounded-lg transition-all"
                    >
                      {uploading ? '⏳' : '⬆️ Upload'}
                    </button>
                  </div>
                </div>
              )}

              {/* Status */}
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                <div>
                  <div className="text-sm font-semibold text-slate-700">Status Produk</div>
                  <div className="text-xs text-slate-500">{form.isActive ? 'Produk aktif dan terlihat publik' : 'Produk disembunyikan dari publik'}</div>
                </div>
                <button
                  onClick={() => setForm(p => ({ ...p, isActive: !p.isActive }))}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${form.isActive ? 'bg-emerald-500' : 'bg-slate-300'}`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${form.isActive ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>
            </div>

            {/* Modal footer */}
            <div className="sticky bottom-0 bg-white rounded-b-3xl border-t border-slate-100 px-6 py-4 flex gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-all"
              >
                Batal
              </button>
              <button
                disabled={loading}
                onClick={() => void save()}
                className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-semibold transition-all"
              >
                {loading ? '⏳ Menyimpan…' : isEditing ? '💾 Perbarui Produk' : '✅ Simpan Produk'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* MODAL: Delete Confirmation                                        */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-[9998] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4">
            <div className="text-center">
              <div className="text-5xl mb-3">🗑️</div>
              <h3 className="font-bold text-slate-800 text-lg">Hapus Produk?</h3>
              <p className="text-sm text-slate-500 mt-1">
                Anda akan menghapus <strong>{deleteConfirm.name}</strong>. Tindakan ini tidak dapat dibatalkan.
              </p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold hover:bg-slate-50 transition-all">
                Batal
              </button>
              <button onClick={() => void confirmDelete()} className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-semibold transition-all">
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </>
  );
}
