'use client';

import { useEffect, useState } from 'react';
import { apiGet } from '@/lib/api-client';
import InventoryNav from '../InventoryNav';
import { downloadCsv, toRupiah } from '../_lib';

export default function InventoryBalancesPage() {
  const [rows, setRows] = useState<any[]>([]);
  const [valuation, setValuation] = useState<any | null>(null);
  const [stockItemId, setStockItemId] = useState('');
  const [stockCard, setStockCard] = useState<any[]>([]);

  useEffect(() => {
    void apiGet<any>('/api/Inventory/balances').then((res) => setRows(res.data ?? []));
  }, []);

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-lg font-bold">Inventory Balances</h1>
      <InventoryNav />
      <div className="bg-white border rounded-2xl p-3 space-y-2">
        <div className="text-sm font-semibold">Valuasi Persediaan</div>
        <button className="border rounded-xl px-3 py-2 text-xs" onClick={async () => {
          const res = await apiGet<any>('/api/Inventory/valuation');
          setValuation(res.data ?? null);
        }}>Load Valuation</button>
        {valuation ? <div className="text-xs text-zinc-700">Total Nilai: <b>{toRupiah(valuation.totalValue ?? 0)}</b></div> : null}
        {valuation ? (
          <button className="border rounded-xl px-3 py-2 text-xs" onClick={() => {
            const items = Array.isArray(valuation.items) ? valuation.items : [];
            downloadCsv(
              `inventory-valuation-${new Date().toISOString().slice(0, 10)}.csv`,
              ['ItemId', 'SKU', 'Nama', 'QtyOnHand', 'AvgCost', 'InventoryValue'],
              items.map((x: any) => [x.inventoryItemId, x.sku ?? '', x.name ?? '', x.qtyOnHand ?? 0, x.avgCost ?? 0, x.inventoryValue ?? 0]),
            );
          }}>Export CSV Valuation</button>
        ) : null}
      </div>

      <div className="bg-white border rounded-2xl p-3 space-y-2">
        <div className="text-sm font-semibold">Kartu Stok per Item</div>
        <div className="flex gap-2">
          <input className="border rounded-xl px-3 py-2 text-xs flex-1" value={stockItemId} onChange={(e) => setStockItemId(e.target.value)} placeholder="Inventory Item ID" />
          <button className="border rounded-xl px-3 py-2 text-xs" onClick={async () => {
            const res = await apiGet<any>(`/api/Inventory/stock-card?inventoryItemId=${Number(stockItemId || 0)}`);
            setStockCard(res.data ?? []);
          }}>Load Stock Card</button>
        </div>
        {stockCard.length > 0 ? (
          <div className="space-y-2">
            <button className="border rounded-xl px-3 py-2 text-xs" onClick={() => {
              downloadCsv(
                `stock-card-item-${stockItemId || 'unknown'}-${new Date().toISOString().slice(0, 10)}.csv`,
                ['MovementId', 'Tanggal', 'Type', 'QtyIn', 'QtyOut', 'Balance', 'UnitCost', 'RefNo', 'BranchCode'],
                stockCard.map((x) => [x.id, new Date(x.movementDate).toISOString(), x.movementType ?? '', x.qtyIn ?? 0, x.qtyOut ?? 0, x.balance ?? 0, x.unitCost ?? 0, x.refNo ?? '', x.branchCode ?? '']),
              );
            }}>Export CSV Stock Card</button>
            <div className="max-h-56 overflow-auto border rounded-xl p-2 space-y-2">
              {stockCard.map((x) => (
                <div key={x.id} className="border rounded-lg p-2 text-xs space-y-1">
                  <div className="font-semibold">{new Date(x.movementDate).toLocaleString('id-ID')}</div>
                  <div className="text-zinc-600">Tipe: {x.movementType}</div>
                  <div className="text-zinc-600">IN: {x.qtyIn} | OUT: {x.qtyOut}</div>
                  <div className="text-zinc-700">Balance: {x.balance}</div>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>

      <div className="bg-white border rounded-2xl p-3 space-y-2">
        {rows.length === 0 ? <div className="text-xs text-zinc-500">Belum ada balance.</div> : null}
        {rows.map((x) => (
          <div key={x.inventoryItemId} className="border rounded-xl p-3 text-xs space-y-1">
            <div className="font-semibold text-sm">{x.name || '-'}</div>
            <div className="text-zinc-600">SKU: <span className="font-mono">{x.sku || '-'}</span></div>
            <div className="text-zinc-600">On Hand: {x.qtyOnHand}</div>
            <div className="text-zinc-600">Min Stock: {x.minStock}</div>
            <div className="text-zinc-600">Reorder: {x.reorderPoint}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
