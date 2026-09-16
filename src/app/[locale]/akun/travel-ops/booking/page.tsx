'use client';

import { useEffect, useMemo, useState } from 'react';
import { apiGet, apiPost, apiPut } from '@/lib/api-client';
import TravelOpsNav from '../TravelOpsNav';
import { downloadCsv, toRupiah } from '../_lib';

export default function TravelOpsBookingPage() {
  const [rows, setRows] = useState<any[]>([]);
  const [paymentStatus, setPaymentStatus] = useState('all');
  const [bookingId, setBookingId] = useState('');
  const [msg, setMsg] = useState('');
  const [bulkJson, setBulkJson] = useState(`[101,102,103]`);

  const load = async () => {
    try {
      const q = paymentStatus !== 'all' ? `?paymentStatus=${paymentStatus}` : '';
      const res = await apiGet<any>(`/api/TravelOps/booking/invoices${q}`);
      setRows(res.data ?? []);
    } catch (e: any) {
      setMsg(e?.message || 'Gagal memuat invoices');
    }
  };
  useEffect(() => { void load(); }, [paymentStatus]);
  const runAction = async (action: () => Promise<void>) => {
    try { await action(); } catch (e: any) { setMsg(e?.message || 'Terjadi kesalahan saat memproses permintaan'); }
  };
  const runBulk = async () => {
    await runAction(async () => {
      const parsed = JSON.parse(bulkJson);
      if (!Array.isArray(parsed) || parsed.length === 0) throw new Error('Bulk JSON harus array booking id');
      for (const id of parsed) {
        await apiPost(`/api/TravelOps/booking/invoices/from-booking/${Number(id || 0)}`, {});
      }
      setMsg(`Bulk generate invoice berhasil: ${parsed.length}`);
      await load();
    });
  };

  const sorted = useMemo(() => [...rows].sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt))), [rows]);

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-lg font-bold">TravelOps • Booking + Invoice</h1>
      <TravelOpsNav />
      {msg ? <div className="text-xs text-emerald-700">{msg}</div> : null}
      <div className="bg-white border rounded-2xl p-3 space-y-2">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
          <input value={bookingId} onChange={(e) => setBookingId(e.target.value)} placeholder="Booking ID" className="border rounded-xl px-3 py-2 text-xs" />
          <button className="border rounded-xl h-9 w-9 inline-flex items-center justify-center text-xs" title="Generate invoice" onClick={() => void runAction(async () => {
            await apiPost(`/api/TravelOps/booking/invoices/from-booking/${Number(bookingId || 0)}`, {});
            setMsg('Invoice dibuat/ditemukan');
            await load();
          })}>🧾</button>
          <select value={paymentStatus} onChange={(e) => setPaymentStatus(e.target.value)} className="border rounded-xl px-3 py-2 text-xs">
            <option value="all">Semua Status Bayar</option>
            <option value="unpaid">Unpaid</option>
            <option value="partial">Partial</option>
            <option value="paid">Paid</option>
          </select>
          <button
            className="border rounded-xl px-3 py-2 text-xs"
            onClick={() => downloadCsv('travelops-invoices.csv', ['InvoiceNo', 'BookingId', 'Status', 'PaymentStatus', 'Total', 'Paid', 'Outstanding'], sorted.map((x) => [x.invoiceNo, x.packBookingId, x.status, x.paymentStatus, x.totalAmount, x.paidAmount, x.outstandingAmount]))}
          >
            Export CSV
          </button>
        </div>
      </div>
      <div className="bg-white border rounded-2xl p-3 space-y-2 text-xs">
        <div className="font-semibold">Bulk JSON Execute</div>
        <textarea className="w-full min-h-24 border rounded-xl px-3 py-2 font-mono text-[11px]" value={bulkJson} onChange={(e) => setBulkJson(e.target.value)} />
        <button className="border rounded-xl h-9 w-9 inline-flex items-center justify-center" title="Execute bulk generate invoice" onClick={() => void runBulk()}>⚡</button>
      </div>
      <div className="space-y-2">
        {sorted.map((x) => (
          <div key={x.id} className="bg-white border rounded-2xl p-3 space-y-2 text-xs">
            <div className="flex items-start justify-between gap-2">
              <div className="font-semibold">{x.invoiceNo}</div>
              <div className="text-zinc-500">#{x.packBookingId}</div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-lg border p-2"><div className="text-zinc-500">Payment</div><div>{x.paymentStatus}</div></div>
              <div className="rounded-lg border p-2"><div className="text-zinc-500">Workflow</div><div>{x.workflowStatus || '-'}</div></div>
              <div className="rounded-lg border p-2"><div className="text-zinc-500">Total</div><div>{toRupiah(Number(x.totalAmount || 0))}</div></div>
              <div className="rounded-lg border p-2"><div className="text-zinc-500">Paid</div><div>{toRupiah(Number(x.paidAmount || 0))}</div></div>
              <div className="rounded-lg border p-2 col-span-2"><div className="text-zinc-500">Outstanding</div><div>{toRupiah(Number(x.outstandingAmount || 0))}</div></div>
            </div>
            <div className="flex gap-1">
              <button className="border rounded-lg px-2 py-1" onClick={async () => { await apiPut(`/api/TravelOps/booking/invoices/${x.id}/reconcile`, { paidAmount: Number(x.totalAmount || 0), referenceNo: `MANUAL-${Date.now()}` }); await load(); }}>Mark Paid</button>
              <button className="border rounded-lg px-2 py-1" onClick={async () => { await apiPut(`/api/TravelOps/booking/invoices/${x.id}/workflow`, { action: 'submit' }); await load(); }}>Submit</button>
              <button className="border rounded-lg px-2 py-1" onClick={async () => { await apiPut(`/api/TravelOps/booking/invoices/${x.id}/workflow`, { action: 'approve' }); await load(); }}>Approve</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
