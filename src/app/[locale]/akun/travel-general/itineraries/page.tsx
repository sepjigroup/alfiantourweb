'use client';

import { useEffect, useState } from 'react';
import { apiGet, apiPost } from '@/lib/api-client';
import TravelGeneralNav from '../TravelGeneralNav';

export default function TravelGeneralItinerariesPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [productId, setProductId] = useState<number>(0);
  const [rows, setRows] = useState<any[]>([{ dayNumber: 1, title: '', city: '', activities: '', optionalCost: 0 }]);
  const [msg, setMsg] = useState('');

  const loadProducts = async () => {
    try {
      const res = await apiGet<any>('/api/TravelGeneral/products');
      const items = res.data?.items ?? [];
      setProducts(items);
      if (!productId && items.length > 0) setProductId(items[0].id);
    } catch (e: any) {
      setMsg(e?.message || 'Gagal load product');
    }
  };

  const loadRows = async (id: number) => {
    if (!id) return;
    try {
      const res = await apiGet<any>(`/api/TravelGeneral/products/${id}/itineraries`);
      const items = res.data?.items ?? [];
      setRows(items.length > 0 ? items : [{ dayNumber: 1, title: '', city: '', activities: '', optionalCost: 0 }]);
    } catch (e: any) {
      setMsg(e?.message || 'Gagal load itinerary');
    }
  };

  useEffect(() => {
    void loadProducts();
  }, []);

  useEffect(() => {
    void loadRows(productId);
  }, [productId]);

  return (
    <div className="p-4 space-y-4 animate-fade-up">
      <div className="bg-white border rounded-3xl p-5">
        <h1 className="text-lg font-extrabold g-text">Itinerary Harian</h1>
        <p className="text-xs text-zinc-500 mt-1">Binding itinerary per produk travel umum.</p>
      </div>
      <TravelGeneralNav />

      {msg ? <div className="text-xs text-red-600">{msg}</div> : null}

      <div className="bg-white border rounded-3xl p-5 space-y-2 text-xs">
        <select className="border rounded-xl px-3 py-2 w-full" value={productId} onChange={(e) => setProductId(Number(e.target.value || 0))}>
          {(products || []).map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}
        </select>

        {(rows || []).map((r, i) => (
          <div key={i} className="grid grid-cols-5 gap-2">
            <input className="border rounded-xl px-2 py-2" type="number" value={r.dayNumber} onChange={(e) => setRows((p) => p.map((x, idx) => idx === i ? { ...x, dayNumber: Number(e.target.value || 1) } : x))} />
            <input className="border rounded-xl px-2 py-2" placeholder="Judul hari" value={r.title} onChange={(e) => setRows((p) => p.map((x, idx) => idx === i ? { ...x, title: e.target.value } : x))} />
            <input className="border rounded-xl px-2 py-2" placeholder="Kota" value={r.city || ''} onChange={(e) => setRows((p) => p.map((x, idx) => idx === i ? { ...x, city: e.target.value } : x))} />
            <input className="border rounded-xl px-2 py-2" placeholder="Aktivitas" value={r.activities || ''} onChange={(e) => setRows((p) => p.map((x, idx) => idx === i ? { ...x, activities: e.target.value } : x))} />
            <input className="border rounded-xl px-2 py-2" type="number" placeholder="Optional cost" value={r.optionalCost || 0} onChange={(e) => setRows((p) => p.map((x, idx) => idx === i ? { ...x, optionalCost: Number(e.target.value || 0) } : x))} />
          </div>
        ))}

        <div className="flex gap-2">
          <button className="border rounded-xl px-3 py-2" onClick={() => setRows((p) => [...p, { dayNumber: p.length + 1, title: '', city: '', activities: '', optionalCost: 0 }])}>Tambah Hari</button>
          <button
            className="rounded-xl bg-zinc-900 text-white px-4 py-2 font-semibold"
            onClick={async () => {
              try {
                await apiPost(`/api/TravelGeneral/products/${productId}/itineraries`, rows);
                setMsg('Itinerary tersimpan');
                await loadRows(productId);
              } catch (e: any) {
                setMsg(e?.message || 'Gagal simpan itinerary');
              }
            }}
          >Simpan Itinerary</button>
        </div>
      </div>
    </div>
  );
}
