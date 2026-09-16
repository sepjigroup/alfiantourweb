'use client';

import { useEffect, useState } from 'react';
import { apiGet, apiPost } from '@/lib/api-client';
import InventoryNav from '../InventoryNav';
import { toIsoDate, toRupiah } from '../_lib';

export default function InventoryMovementsPage() {
  const [rows, setRows] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>([]);
  const [itemId, setItemId] = useState('');
  const [movementType, setMovementType] = useState('in');
  const [quantity, setQuantity] = useState('1');
  const [bookingId, setBookingId] = useState('');
  const [departureId, setDepartureId] = useState('');
  const [qtyPerPax, setQtyPerPax] = useState('1');
  const [msg, setMsg] = useState('');
  const [bulkJson, setBulkJson] = useState(`[
  { "inventoryItemId": 1, "movementType": "in", "quantity": 10, "unitCost": 0 },
  { "inventoryItemId": 1, "movementType": "out", "quantity": 2, "unitCost": 0 }
]`);

  const load = async () => {
    try {
      const [m, i] = await Promise.all([
        apiGet<any>('/api/Inventory/movements'),
        apiGet<any>('/api/Inventory/items'),
      ]);
      setRows(m.data ?? []);
      setItems(i.data ?? []);
    } catch (e: any) {
      setMsg(e?.message || 'Gagal memuat movement');
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
        await apiPost('/api/Inventory/movements', {
          inventoryItemId: Number(row?.inventoryItemId || 0),
          movementType: String(row?.movementType || 'in'),
          quantity: Number(row?.quantity || 0),
          movementDate: new Date().toISOString(),
          unitCost: Number(row?.unitCost || 0),
        });
      }
      setMsg(`Bulk movement berhasil: ${parsed.length}`);
      await load();
    });
  };

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-lg font-bold">Inventory Movements</h1>
      <InventoryNav />
      {msg ? <div className="text-xs text-emerald-700">{msg}</div> : null}
      <div className="bg-white border rounded-2xl p-3 space-y-2">
        <div className="text-sm font-semibold">Input Movement</div>
        <div className="grid sm:grid-cols-4 gap-2">
          <select className="border rounded-xl px-3 py-2 text-xs" value={itemId} onChange={(e) => setItemId(e.target.value)}>
            <option value="">Pilih Item</option>
            {items.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}
          </select>
          <select className="border rounded-xl px-3 py-2 text-xs" value={movementType} onChange={(e) => setMovementType(e.target.value)}>
            <option value="in">IN</option><option value="out">OUT</option><option value="adjustment">ADJUSTMENT</option>
          </select>
          <input className="border rounded-xl px-3 py-2 text-xs" placeholder="Qty" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
          <button className="border rounded-xl h-9 w-9 inline-flex items-center justify-center text-xs" title="Simpan movement" onClick={() => void runAction(async () => {
            await apiPost('/api/Inventory/movements', { inventoryItemId: Number(itemId), movementType, quantity: Number(quantity), movementDate: new Date().toISOString(), unitCost: 0 });
            await load();
          })}>💾</button>
        </div>
      </div>
      <div className="bg-white border rounded-2xl p-3 space-y-2 text-xs">
        <div className="font-semibold">Bulk JSON Execute</div>
        <textarea className="w-full min-h-36 border rounded-xl px-3 py-2 font-mono text-[11px]" value={bulkJson} onChange={(e) => setBulkJson(e.target.value)} />
        <button className="border rounded-xl h-9 w-9 inline-flex items-center justify-center" title="Execute bulk JSON movement" onClick={() => void runBulk()}>⚡</button>
      </div>
      <div className="bg-white border rounded-2xl p-3 space-y-2">
        <div className="text-sm font-semibold">Auto Stock Out (Booking / Departure)</div>
        <div className="grid sm:grid-cols-4 gap-2">
          <select className="border rounded-xl px-3 py-2 text-xs" value={itemId} onChange={(e) => setItemId(e.target.value)}>
            <option value="">Pilih Item</option>
            {items.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}
          </select>
          <input className="border rounded-xl px-3 py-2 text-xs" value={qtyPerPax} onChange={(e) => setQtyPerPax(e.target.value)} placeholder="Qty per Pax" />
          <input className="border rounded-xl px-3 py-2 text-xs" value={bookingId} onChange={(e) => setBookingId(e.target.value)} placeholder="Booking ID" />
          <button className="border rounded-xl h-9 w-9 inline-flex items-center justify-center text-xs" title="Issue dari booking" onClick={() => void runAction(async () => {
            await apiPost(`/api/Inventory/auto-issue/from-booking/${Number(bookingId || 0)}`, { inventoryItemId: Number(itemId), qtyPerPax: Number(qtyPerPax), unitCost: 0 });
            await load();
          })}>📦</button>
        </div>
        <div className="grid sm:grid-cols-4 gap-2">
          <input className="border rounded-xl px-3 py-2 text-xs" value={departureId} onChange={(e) => setDepartureId(e.target.value)} placeholder="Departure ID" />
          <button className="border rounded-xl h-9 w-9 inline-flex items-center justify-center text-xs" title="Issue dari departure" onClick={() => void runAction(async () => {
            await apiPost(`/api/Inventory/auto-issue/from-departure/${Number(departureId || 0)}`, { inventoryItemId: Number(itemId), qtyPerPax: Number(qtyPerPax), unitCost: 0 });
            await load();
          })}>🚚</button>
        </div>
      </div>
      <div className="bg-white border rounded-2xl p-3 space-y-2">
        {rows.length === 0 ? <div className="text-xs text-zinc-500">Belum ada movement.</div> : null}
        {rows.map((x) => (
          <div key={x.id} className="border rounded-xl p-3 text-xs space-y-1">
            <div className="font-semibold">{toIsoDate(x.movementDate)}</div>
            <div className="text-zinc-600">Item ID: {x.inventoryItemId}</div>
            <div className="text-zinc-600">Tipe: {x.movementType}</div>
            <div className="text-zinc-600">Qty: {x.quantity}</div>
            <div className="text-zinc-600">Biaya: {toRupiah(x.unitCost)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
