'use client';

import { useEffect, useState } from 'react';
import { apiGet, apiPut } from '@/lib/api-client';
import InventoryNav from './InventoryNav';
import { Skeleton } from '@/components/Skeleton';

export default function InventoryPage() {
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [balances, setBalances] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [msg, setMsg] = useState('');
  const [autoEnabled, setAutoEnabled] = useState(false);
  const [autoMapJson, setAutoMapJson] = useState('[]');

  const load = async () => {
    setLoading(true);
    try {
      const [f, b, r, cfg] = await Promise.all([
        apiGet<any>('/api/Inventory/feature'),
        apiGet<any>('/api/Inventory/balances'),
        apiGet<any>('/api/Inventory/requests'),
        apiGet<any>('/api/Inventory/auto-issue-config'),
      ]);
      setEnabled(Boolean(f.data?.enabled));
      setBalances(b.data ?? []);
      setRequests(r.data ?? []);
      setAutoEnabled(Boolean(cfg.data?.enabled));
      setAutoMapJson(JSON.stringify(cfg.data?.maps ?? [], null, 2));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-lg font-bold">Inventory Management (Opsional)</h1>
      <p className="text-xs text-zinc-500">Modul tambahan untuk stok operasional travel. Tidak mengubah flow existing saat dinonaktifkan.</p>
      <InventoryNav />

      <div className="bg-white border rounded-2xl p-3 space-y-3">
        <div className="flex items-center justify-between">
          <div className="text-sm font-semibold">Feature Toggle</div>
          <label className="text-xs flex items-center gap-2">
            <span>{enabled ? 'Aktif' : 'Nonaktif'}</span>
            <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} />
          </label>
        </div>
        <button
          className="border rounded-xl px-3 py-2 text-xs font-semibold"
          onClick={async () => {
            await apiPut('/api/Inventory/feature', { enabled });
            setMsg('Toggle inventory tersimpan');
            await load();
          }}
        >
          Simpan Toggle
        </button>
        {msg ? <div className="text-xs text-emerald-700">{msg}</div> : null}
      </div>

      <div className="bg-white border rounded-2xl p-3 space-y-3">
        <div className="text-sm font-semibold">Auto Issue Mapping (Booking to Inventory)</div>
        <label className="text-xs flex items-center gap-2">
          <span>{autoEnabled ? 'Aktif' : 'Nonaktif'}</span>
          <input type="checkbox" checked={autoEnabled} onChange={(e) => setAutoEnabled(e.target.checked)} />
        </label>
        <textarea
          className="border rounded-xl px-3 py-2 text-xs w-full min-h-[160px] font-mono"
          value={autoMapJson}
          onChange={(e) => setAutoMapJson(e.target.value)}
          placeholder='[{"programSlug":"umrah-2027","inventoryItemId":1,"qtyPerPax":1,"unitCost":0}]'
        />
        <button
          className="border rounded-xl px-3 py-2 text-xs font-semibold"
          onClick={async () => {
            let maps: any[] = [];
            try {
              maps = JSON.parse(autoMapJson || '[]');
              if (!Array.isArray(maps)) throw new Error('Format JSON harus array');
            } catch (e) {
              setMsg(e instanceof Error ? e.message : 'JSON tidak valid');
              return;
            }
            await apiPut('/api/Inventory/auto-issue-config', { enabled: autoEnabled, maps });
            setMsg('Konfigurasi auto-issue tersimpan');
            await load();
          }}
        >
          Simpan Auto-Issue Config
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white border rounded-2xl p-3">
          <div className="text-xs text-zinc-500">Total Item Saldo</div>
          <div className="text-2xl font-bold">{balances.length}</div>
        </div>
        <div className="bg-white border rounded-2xl p-3">
          <div className="text-xs text-zinc-500">Request Pending</div>
          <div className="text-2xl font-bold">{requests.filter((x) => x.workflowStatus === 'submitted').length}</div>
        </div>
        <div className="bg-white border rounded-2xl p-3">
          <div className="text-xs text-zinc-500">Status Fitur</div>
          <div className="text-sm font-semibold">{enabled ? 'Enabled' : 'Disabled'}</div>
        </div>
      </div>

      {loading ? (
        <div className="space-y-2">
          <div className="bg-white border rounded-2xl p-3 space-y-2">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-10 w-full rounded-xl" />
          </div>
          <div className="flex items-center gap-2 text-xs text-zinc-500">
            <span className="h-4 w-4 rounded-full border-2 border-zinc-300 border-t-primary-600 animate-spin" />
            Memuat data...
          </div>
        </div>
      ) : null}
    </div>
  );
}
