'use client';

import { useEffect, useState } from 'react';
import { apiGet, apiPost, apiPut } from '@/lib/api-client';
import TravelGeneralNav from '../TravelGeneralNav';

export default function TravelGeneralProductTypesPage() {
  const [rows, setRows] = useState<any[]>([]);
  const [msg, setMsg] = useState('');
  const [bulkJson, setBulkJson] = useState(`[
  {
    "name": "Paket Singapore 4D3N",
    "travelScope": "international",
    "productKind": "land-tour",
    "baseCurrency": "IDR",
    "basePrice": 3500000,
    "durationDays": 4
  }
]`);
  const [form, setForm] = useState<any>({
    id: 0,
    name: '',
    slug: '',
    description: '',
    travelScope: 'domestic',
    productKind: 'land-tour',
    baseCurrency: 'IDR',
    basePrice: 0,
    durationDays: 4,
    country: '',
    city: '',
    coverImageUrl: '',
    seoTitle: '',
    seoDescription: '',
  });

  const load = async () => {
    try {
      const res = await apiGet<any>('/api/TravelGeneral/products');
      setRows(res.data?.items ?? []);
    } catch (e: any) {
      setMsg(e?.message || 'Gagal load product');
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const runBulk = async () => {
    try {
      const parsed = JSON.parse(bulkJson);
      if (!Array.isArray(parsed) || parsed.length === 0) throw new Error('Bulk JSON harus array dan tidak boleh kosong');
      for (const row of parsed) {
        await apiPost('/api/TravelGeneral/products', {
          name: row?.name ?? '',
          slug: row?.slug ?? '',
          description: row?.description ?? '',
          travelScope: row?.travelScope ?? 'domestic',
          productKind: row?.productKind ?? 'land-tour',
          baseCurrency: row?.baseCurrency ?? 'IDR',
          basePrice: Number(row?.basePrice ?? 0),
          durationDays: Number(row?.durationDays ?? 1),
          country: row?.country ?? '',
          city: row?.city ?? '',
          coverImageUrl: row?.coverImageUrl ?? '',
          seoTitle: row?.seoTitle ?? '',
          seoDescription: row?.seoDescription ?? '',
        });
      }
      setMsg(`Bulk produk berhasil: ${parsed.length}`);
      await load();
    } catch (e: any) {
      setMsg(e?.message || 'Gagal bulk import produk');
    }
  };

  return (
    <div className="p-4 space-y-4 animate-fade-up">
      <div className="bg-white border rounded-3xl p-5">
        <h1 className="text-lg font-extrabold g-text">Produk Travel Umum</h1>
        <p className="text-xs text-zinc-500 mt-1">CRUD produk wisata domestik/mancanegara terpisah dari modul Umrah/Haji.</p>
      </div>
      <TravelGeneralNav />

      {msg ? <div className="text-xs text-red-600">{msg}</div> : null}

      <div className="bg-white border rounded-3xl p-5 space-y-2">
        <div className="grid grid-cols-2 gap-2 text-xs">
          <input className="border rounded-xl px-3 py-2" placeholder="Nama produk" value={form.name} onChange={(e) => setForm((p: any) => ({ ...p, name: e.target.value }))} />
          <input className="border rounded-xl px-3 py-2" placeholder="Slug (opsional)" value={form.slug} onChange={(e) => setForm((p: any) => ({ ...p, slug: e.target.value }))} />
          <select className="border rounded-xl px-3 py-2" value={form.travelScope} onChange={(e) => setForm((p: any) => ({ ...p, travelScope: e.target.value }))}>
            <option value="domestic">domestic</option><option value="international">international</option>
          </select>
          <select className="border rounded-xl px-3 py-2" value={form.productKind} onChange={(e) => setForm((p: any) => ({ ...p, productKind: e.target.value }))}>
            <option value="land-tour">land-tour</option><option value="open-trip">open-trip</option><option value="private-trip">private-trip</option><option value="flight-only">flight-only</option><option value="hotel-only">hotel-only</option>
          </select>
          <input className="border rounded-xl px-3 py-2" type="number" placeholder="Harga dasar" value={form.basePrice} onChange={(e) => setForm((p: any) => ({ ...p, basePrice: Number(e.target.value || 0) }))} />
          <input className="border rounded-xl px-3 py-2" type="number" placeholder="Durasi hari" value={form.durationDays} onChange={(e) => setForm((p: any) => ({ ...p, durationDays: Number(e.target.value || 1) }))} />
          <input className="border rounded-xl px-3 py-2" placeholder="Negara" value={form.country} onChange={(e) => setForm((p: any) => ({ ...p, country: e.target.value }))} />
          <input className="border rounded-xl px-3 py-2" placeholder="Kota" value={form.city} onChange={(e) => setForm((p: any) => ({ ...p, city: e.target.value }))} />
          <input className="border rounded-xl px-3 py-2 col-span-2" placeholder="Cover Image URL" value={form.coverImageUrl} onChange={(e) => setForm((p: any) => ({ ...p, coverImageUrl: e.target.value }))} />
          <input className="border rounded-xl px-3 py-2 col-span-2" placeholder="Deskripsi" value={form.description} onChange={(e) => setForm((p: any) => ({ ...p, description: e.target.value }))} />
          <input className="border rounded-xl px-3 py-2" placeholder="SEO Title" value={form.seoTitle} onChange={(e) => setForm((p: any) => ({ ...p, seoTitle: e.target.value }))} />
          <input className="border rounded-xl px-3 py-2" placeholder="SEO Description" value={form.seoDescription} onChange={(e) => setForm((p: any) => ({ ...p, seoDescription: e.target.value }))} />
        </div>
        <button
          className="rounded-xl bg-zinc-900 text-white h-9 w-9 inline-flex items-center justify-center text-xs font-semibold"
          title="Simpan produk"
          onClick={async () => {
            try {
              if (form.id) await apiPut(`/api/TravelGeneral/products/${form.id}`, form);
              else await apiPost('/api/TravelGeneral/products', form);
              setMsg('Produk tersimpan');
              setForm({ ...form, id: 0, name: '', slug: '', description: '', basePrice: 0, country: '', city: '', coverImageUrl: '', seoTitle: '', seoDescription: '' });
              await load();
            } catch (e: any) {
              setMsg(e?.message || 'Gagal simpan');
            }
          }}
        >💾</button>
      </div>

      <div className="bg-white border rounded-3xl p-5 space-y-2 text-xs">
        <div className="font-semibold">Bulk JSON Execute</div>
        <textarea className="w-full min-h-36 border rounded-xl px-3 py-2 font-mono text-[11px]" value={bulkJson} onChange={(e) => setBulkJson(e.target.value)} />
        <button className="border rounded-xl h-9 w-9 inline-flex items-center justify-center" title="Execute bulk JSON produk" onClick={() => void runBulk()}>⚡</button>
      </div>

      <div className="bg-white border rounded-3xl p-5 text-xs space-y-2">
        {(rows || []).map((x) => (
          <button key={x.id} className="w-full text-left rounded-xl border px-3 py-2 hover:bg-zinc-50" onClick={() => setForm({ ...form, ...x, description: x.description || '' })}>
            <div className="font-semibold">{x.name}</div>
            <div className="text-zinc-500">{x.travelScope} • {x.productKind} • {x.baseCurrency} {x.basePrice}</div>
          </button>
        ))}
      </div>
    </div>
  );
}
