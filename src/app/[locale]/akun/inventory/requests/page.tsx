'use client';

import { useEffect, useState } from 'react';
import { apiGet, apiPost, apiPut } from '@/lib/api-client';
import InventoryNav from '../InventoryNav';

export default function InventoryRequestsPage() {
  const [rows, setRows] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>([]);
  const [inventoryItemId, setInventoryItemId] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [requestType, setRequestType] = useState('purchase');
  const [branchCode, setBranchCode] = useState('');
  const [approverBranchCode, setApproverBranchCode] = useState('');
  const [msg, setMsg] = useState('');
  const [bulkJson, setBulkJson] = useState(`[
  { "inventoryItemId": 1, "quantity": 5, "requestType": "purchase", "branchCode": "JKT" }
]`);

  const load = async () => {
    try {
      const [r, i] = await Promise.all([
        apiGet<any>('/api/Inventory/requests'),
        apiGet<any>('/api/Inventory/items'),
      ]);
      setRows(r.data ?? []);
      setItems(i.data ?? []);
    } catch (e: any) {
      setMsg(e?.message || 'Gagal memuat requests');
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
        await apiPost('/api/Inventory/requests', {
          inventoryItemId: Number(row?.inventoryItemId || 0),
          quantity: Number(row?.quantity || 0),
          requestType: String(row?.requestType || 'purchase'),
          branchCode: String(row?.branchCode || ''),
          notes: String(row?.notes || ''),
        });
      }
      setMsg(`Bulk request berhasil: ${parsed.length}`);
      await load();
    });
  };

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-lg font-bold">Inventory Requests</h1>
      <InventoryNav />
      {msg ? <div className="text-xs text-emerald-700">{msg}</div> : null}
      <div className="bg-white border rounded-2xl p-3 space-y-2">
        <div className="text-sm font-semibold">Input Request</div>
        <div className="grid sm:grid-cols-4 gap-2">
          <select className="border rounded-xl px-3 py-2 text-xs" value={inventoryItemId} onChange={(e) => setInventoryItemId(e.target.value)}>
            <option value="">Pilih Item</option>
            {items.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}
          </select>
          <input className="border rounded-xl px-3 py-2 text-xs" value={quantity} onChange={(e) => setQuantity(e.target.value)} placeholder="Qty" />
          <select className="border rounded-xl px-3 py-2 text-xs" value={requestType} onChange={(e) => setRequestType(e.target.value)}>
            <option value="purchase">Purchase</option><option value="transfer">Transfer</option><option value="reserve">Reserve</option>
          </select>
          <input className="border rounded-xl px-3 py-2 text-xs" value={branchCode} onChange={(e) => setBranchCode(e.target.value)} placeholder="Branch Code (opsional)" />
          <button className="border rounded-xl h-9 w-9 inline-flex items-center justify-center text-xs" title="Simpan request" onClick={() => void runAction(async () => {
            await apiPost('/api/Inventory/requests', { inventoryItemId: Number(inventoryItemId), quantity: Number(quantity), requestType, branchCode, notes: '' });
            await load();
          })}>💾</button>
        </div>
        <input className="border rounded-xl px-3 py-2 text-xs w-full" value={approverBranchCode} onChange={(e) => setApproverBranchCode(e.target.value)} placeholder="Branch Code Approver (untuk approve/reject)" />
      </div>
      <div className="bg-white border rounded-2xl p-3 space-y-2 text-xs">
        <div className="font-semibold">Bulk JSON Execute</div>
        <textarea className="w-full min-h-36 border rounded-xl px-3 py-2 font-mono text-[11px]" value={bulkJson} onChange={(e) => setBulkJson(e.target.value)} />
        <button className="border rounded-xl h-9 w-9 inline-flex items-center justify-center" title="Execute bulk JSON request" onClick={() => void runBulk()}>⚡</button>
      </div>

      <div className="bg-white border rounded-2xl p-3 space-y-2">
        {rows.length === 0 ? <div className="text-xs text-zinc-500">Belum ada request.</div> : null}
        {rows.map((x) => (
          <div key={x.id} className="border rounded-xl p-3 text-xs space-y-2">
            <div className="font-semibold">{x.requestNo || `REQ-${x.id}`}</div>
            <div className="grid grid-cols-2 gap-2 text-zinc-600">
              <div>Item ID: {x.inventoryItemId}</div>
              <div>Qty: {x.quantity}</div>
              <div>Tipe: {x.requestType}</div>
              <div>Branch: {x.branchCode || '-'}</div>
            </div>
            <div className="text-zinc-700">Status: {x.workflowStatus}</div>
            <div className="flex gap-1">
              <button className="border rounded h-8 w-8 inline-flex items-center justify-center" title="Submit" onClick={() => void runAction(async () => { await apiPut(`/api/Inventory/requests/${x.id}/workflow`, { action: 'submit', branchCode: approverBranchCode }); await load(); })}>↑</button>
              <button className="border rounded h-8 w-8 inline-flex items-center justify-center" title="Approve" onClick={() => void runAction(async () => { await apiPut(`/api/Inventory/requests/${x.id}/workflow`, { action: 'approve', branchCode: approverBranchCode }); await load(); })}>✓</button>
              <button className="border rounded h-8 w-8 inline-flex items-center justify-center" title="Reject" onClick={() => void runAction(async () => { await apiPut(`/api/Inventory/requests/${x.id}/workflow`, { action: 'reject', branchCode: approverBranchCode }); await load(); })}>✕</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
