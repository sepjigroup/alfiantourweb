'use client';

import { useEffect, useState } from 'react';
import { apiGet, apiPost } from '@/lib/api-client';
import InventoryNav from '../InventoryNav';

export default function InventoryItemsPage() {
  const [rows, setRows] = useState<any[]>([]);
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [msg, setMsg] = useState('');
  const [featureEnabled, setFeatureEnabled] = useState(true);
  const [bulkJson, setBulkJson] = useState(`[
  { "sku": "ZAMZAM-5L", "name": "Air Zam-Zam 5 Liter", "category": "oleh-oleh" },
  { "sku": "SERAGAM-IKHWAN", "name": "Seragam Ihram Ikhwan", "category": "perlengkapan" }
]`);

  const load = async () => {
    try {
      const [itemsRes, featureRes] = await Promise.all([
        apiGet<any>('/api/Inventory/items'),
        apiGet<any>('/api/Inventory/feature'),
      ]);
      setRows(itemsRes.data ?? []);
      setFeatureEnabled(Boolean(featureRes.data?.enabled));
    } catch (e: any) {
      setMsg(e?.message || 'Gagal memuat data inventory');
    }
  };

  useEffect(() => { void load(); }, []);

  const runAction = async (action: () => Promise<void>) => {
    try {
      await action();
    } catch (e: any) {
      setMsg(e?.message || 'Terjadi kesalahan saat memproses permintaan');
    }
  };

  const runBulk = async () => {
    await runAction(async () => {
      const parsed = JSON.parse(bulkJson);
      if (!Array.isArray(parsed) || parsed.length === 0) throw new Error('Bulk JSON harus array dan tidak boleh kosong');
      for (const row of parsed) {
        await apiPost('/api/Inventory/items', {
          sku: String(row?.sku ?? '').trim(),
          name: String(row?.name ?? '').trim(),
          category: String(row?.category ?? 'general').trim(),
          uom: String(row?.uom ?? 'pcs').trim(),
          minStock: Number(row?.minStock ?? 0),
          reorderPoint: Number(row?.reorderPoint ?? 0),
        });
      }
      setMsg(`Bulk item berhasil: ${parsed.length}`);
      await load();
    });
  };

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-lg font-bold">Inventory Items</h1>
      <InventoryNav />
      {msg ? <div className="text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-xl px-3 py-2">{msg}</div> : null}
      {!featureEnabled ? <div className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">Modul inventory belum diaktifkan.</div> : null}
      <div className="bg-white border rounded-2xl p-3 space-y-2">
        <div className="text-sm font-semibold">Tambah Item</div>
        <div className="grid sm:grid-cols-2 gap-2">
          <input className="border rounded-xl px-3 py-2 text-xs" placeholder="SKU" value={sku} onChange={(e) => setSku(e.target.value)} />
          <input className="border rounded-xl px-3 py-2 text-xs" placeholder="Nama Item" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <button
          className="border rounded-xl h-9 w-9 inline-flex items-center justify-center text-xs"
          title="Simpan item"
          disabled={!featureEnabled}
          onClick={() => void runAction(async () => {
            await apiPost('/api/Inventory/items', { sku, name, category: 'general', uom: 'pcs', minStock: 0, reorderPoint: 0 });
            setSku('');
            setName('');
            setMsg('Item tersimpan');
            await load();
          })}
        >
          💾
        </button>
      </div>

      <div className="bg-white border rounded-2xl p-3 space-y-2 text-xs">
        <div className="font-semibold">Bulk JSON Execute</div>
        <textarea className="w-full min-h-36 border rounded-xl px-3 py-2 font-mono text-[11px]" value={bulkJson} onChange={(e) => setBulkJson(e.target.value)} />
        <button className="border rounded-xl h-9 w-9 inline-flex items-center justify-center text-xs" title="Execute bulk JSON item" disabled={!featureEnabled} onClick={() => void runBulk()}>⚡</button>
      </div>

      <div className="bg-white border rounded-2xl p-3 space-y-2">
        {rows.length === 0 ? <div className="text-xs text-zinc-500">Belum ada item.</div> : null}
        {rows.map((x) => (
          <div key={x.id} className="border rounded-xl p-3 text-xs space-y-1">
            <div className="font-semibold text-sm">{x.name || '-'}</div>
            <div className="text-zinc-600">SKU: <span className="font-mono">{x.sku || '-'}</span></div>
            <div className="text-zinc-600">Kategori: {x.category || '-'}</div>
            <div className="text-zinc-600">UOM: {x.uom || '-'}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
