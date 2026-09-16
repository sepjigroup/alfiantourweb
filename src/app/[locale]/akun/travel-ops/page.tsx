'use client';

import { useEffect, useState } from 'react';
import { apiGet, apiPost, apiPut } from '@/lib/api-client';
import TravelOpsNav from './TravelOpsNav';

type FeatureMap = Record<string, boolean>;

const featureKeys = [
  'feature.travelops.booking',
  'feature.travelops.departure',
  'feature.travelops.supplier',
  'feature.travelops.support',
  'feature.travelops.finance',
] as const;

export default function TravelOpsPage() {
  const [features, setFeatures] = useState<FeatureMap>({});
  const [invoiceBookingId, setInvoiceBookingId] = useState('');
  const [invoices, setInvoices] = useState<any[]>([]);
  const [departures, setDepartures] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [tickets, setTickets] = useState<any[]>([]);
  const [closings, setClosings] = useState<any[]>([]);
  const [audits, setAudits] = useState<any[]>([]);
  const [msg, setMsg] = useState('');

  const load = async () => {
    try {
      const [f, i, d, s, t, c, a] = await Promise.all([
        apiGet<any>('/api/TravelOps/features'),
        apiGet<any>('/api/TravelOps/booking/invoices'),
        apiGet<any>('/api/TravelOps/departure/operations'),
        apiGet<any>('/api/TravelOps/supplier/contracts'),
        apiGet<any>('/api/TravelOps/support/tickets'),
        apiGet<any>('/api/TravelOps/finance/monthly-closing'),
        apiGet<any>('/api/TravelOps/audit-logs'),
      ]);
      setFeatures(f.data ?? {});
      setInvoices(i.data ?? []);
      setDepartures(d.data ?? []);
      setSuppliers(s.data ?? []);
      setTickets(t.data ?? []);
      setClosings(c.data ?? []);
      setAudits(a.data ?? []);
    } catch (e: any) {
      setMsg(e?.message || 'Gagal memuat data Travel Ops');
    }
  };

  useEffect(() => { void load(); }, []);

  const runAction = async (action: () => Promise<void>, successMessage?: string) => {
    try {
      await action();
      if (successMessage) setMsg(successMessage);
    } catch (e: any) {
      setMsg(e?.message || 'Terjadi kesalahan saat memproses permintaan');
    }
  };

  const saveFeatures = async () => {
    await runAction(async () => {
      await apiPut('/api/TravelOps/features', features);
      await load();
    }, 'Feature TravelOps tersimpan');
  };

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-lg font-bold">Travel Ops (Opsional)</h1>
      <p className="text-xs text-zinc-500">Modul enterprise tambahan. Aktifkan hanya saat dibutuhkan, fitur lama tetap jalan.</p>
      <TravelOpsNav />
      {msg ? <div className="text-xs text-emerald-700">{msg}</div> : null}

      <div className="bg-white border rounded-2xl p-3 space-y-2">
        <div className="font-semibold text-sm">Feature Toggle</div>
        {featureKeys.map((k) => (
          <label key={k} className="flex items-center justify-between text-xs border rounded-xl px-3 py-2">
            <span>{k}</span>
            <input type="checkbox" checked={Boolean(features[k])} onChange={(e) => setFeatures((p) => ({ ...p, [k]: e.target.checked }))} />
          </label>
        ))}
        <button className="border rounded-xl px-3 py-2 text-xs font-semibold" onClick={() => void saveFeatures()}>Simpan Toggle</button>
      </div>

      <div className="bg-white border rounded-2xl p-3 space-y-2">
        <div className="font-semibold text-sm">1) Booking Flow: Invoice + Reconcile</div>
        <div className="flex gap-2">
          <input className="border rounded-xl px-3 py-2 text-xs flex-1" placeholder="Booking ID" value={invoiceBookingId} onChange={(e) => setInvoiceBookingId(e.target.value)} />
          <button
            className="border rounded-xl px-3 py-2 text-xs"
            onClick={() => void runAction(async () => {
              await apiPost(`/api/TravelOps/booking/invoices/from-booking/${Number(invoiceBookingId || 0)}`, {});
              await load();
            })}
          >
            Buat Invoice
          </button>
        </div>
        <div className="text-xs text-zinc-600">Total invoice: {invoices.length}</div>
      </div>

      <div className="bg-white border rounded-2xl p-3 space-y-2">
        <div className="font-semibold text-sm">2) Operasi Keberangkatan</div>
        <button
          className="border rounded-xl px-3 py-2 text-xs"
          onClick={() => void runAction(async () => {
            await apiPost('/api/TravelOps/departure/operations', {
              departureDate: new Date().toISOString(),
              status: 'planning',
              operationLead: 'ops-team',
              visaStatus: 'pending',
              manifestCount: 0,
              roomingListCount: 0,
              documentsCompletedCount: 0,
            });
            await load();
          })}
        >
          Tambah Operasi
        </button>
        <div className="text-xs text-zinc-600">Total operasi: {departures.length}</div>
      </div>

      <div className="bg-white border rounded-2xl p-3 space-y-2">
        <div className="font-semibold text-sm">3) Supplier Ops</div>
        <button
          className="border rounded-xl px-3 py-2 text-xs"
          onClick={() => void runAction(async () => {
            await apiPost('/api/TravelOps/supplier/contracts', {
              supplierType: 'hotel',
              supplierName: `Supplier ${Date.now()}`,
              status: 'active',
              effectiveDate: new Date().toISOString(),
              allotmentTotal: 100,
              allotmentUsed: 0,
              unitCost: 0,
              penaltyCost: 0,
            });
            await load();
          })}
        >
          Tambah Kontrak
        </button>
        <div className="text-xs text-zinc-600">Total kontrak: {suppliers.length}</div>
      </div>

      <div className="bg-white border rounded-2xl p-3 space-y-2">
        <div className="font-semibold text-sm">4) Support Pipeline</div>
        <button
          className="border rounded-xl px-3 py-2 text-xs"
          onClick={() => void runAction(async () => {
            await apiPost('/api/TravelOps/support/tickets', {
              subject: 'Lead WA perlu follow up',
              channel: 'whatsapp',
              priority: 'normal',
              status: 'open',
            });
            await load();
          })}
        >
          Tambah Ticket
        </button>
        <div className="text-xs text-zinc-600">Total ticket: {tickets.length}</div>
      </div>

      <div className="bg-white border rounded-2xl p-3 space-y-2">
        <div className="font-semibold text-sm">5) Audit & Finance Closing</div>
        <button
          className="border rounded-xl px-3 py-2 text-xs"
          onClick={() => void runAction(async () => {
            const now = new Date();
            await apiPost('/api/TravelOps/finance/monthly-closing', {
              year: now.getUTCFullYear(),
              month: now.getUTCMonth() + 1,
              openingCash: 0,
              closingStatus: 'draft',
            });
            await load();
          })}
        >
          Generate Closing Bulanan
        </button>
        <div className="text-xs text-zinc-600">Total closing: {closings.length}</div>
      </div>

      <div className="bg-white border rounded-2xl p-3 space-y-2">
        <div className="font-semibold text-sm">Audit Trail (Latest)</div>
        <div className="text-xs text-zinc-600">Total log: {audits.length}</div>
        <div className="space-y-1 max-h-48 overflow-auto">
          {audits.slice(0, 10).map((x) => (
            <div key={x.id} className="text-xs border rounded-lg px-2 py-1">
              [{x.module}] {x.entityName}#{x.entityId} - {x.actionName} by {x.actor}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
