'use client';

import { useEffect, useMemo, useState } from 'react';
import { Link } from '@/i18n/routing-patch';
import { API_BASE_URL, apiGet, apiPost, getAuthToken } from '@/lib/api-client';
import { Skeleton } from '@/components/Skeleton';

function toRupiah(v: number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(v || 0);
}

export default function LaporanKeuanganPage() {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<any>(null);
  const [finance, setFinance] = useState<any>(null);
  const [recon, setRecon] = useState<any>(null);
  const [entry, setEntry] = useState({ entryType: 'expense', category: 'operasional', amount: 0, descriptionText: '' });
  const [bulkCashJson, setBulkCashJson] = useState(`[
  { "entryType": "expense", "category": "operasional", "amount": 250000, "descriptionText": "ATK" }
]`);
  const [manualClosing, setManualClosing] = useState({
    customerName: '',
    customerWhatsApp: '',
    programCode: '',
    revenueAmount: 0,
    costAmount: 0,
    refAgentUsername: '',
    commissionType: 'fixed',
    commissionValue: 0,
    note: '',
  });
  const [bulkClosingJson, setBulkClosingJson] = useState(`[
  {
    "customerName": "Pelanggan A",
    "customerWhatsApp": "6281234567890",
    "programCode": "",
    "revenueAmount": 15000000,
    "costAmount": 12000000
  }
]`);
  const [message, setMessage] = useState('');
  const [closingPeriods, setClosingPeriods] = useState<any[]>([]);
  const [auditRows, setAuditRows] = useState<any[]>([]);
  const [periodAction, setPeriodAction] = useState({ year: new Date().getFullYear(), month: new Date().getMonth() + 1, note: '' });

  const load = async () => {
    setLoading(true);
    try {
      const [s, f, cp, a] = await Promise.all([
        apiGet<any>('/api/BusinessInsights/summary'),
        apiGet<any>('/api/BusinessInsights/finance/summary'),
        apiGet<any>(`/api/BusinessInsights/finance/closing-periods?year=${periodAction.year}`),
        apiGet<any>('/api/BusinessInsights/finance/audit-trail?page=1&pageSize=20'),
      ]);
      const r = await apiGet<any>('/api/BusinessInsights/finance/reconciliation');
      setSummary(s.data ?? null);
      setFinance(f.data ?? null);
      setRecon(r.data ?? null);
      setClosingPeriods(cp.data?.items ?? []);
      setAuditRows(a.data?.items ?? []);
      setMessage('');
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Gagal load laporan');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [periodAction.year]);
  const runAction = async (action: () => Promise<void>) => {
    try {
      await action();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Terjadi kesalahan saat memproses permintaan');
    }
  };
  const runBulkCash = async () => {
    await runAction(async () => {
      const parsed = JSON.parse(bulkCashJson);
      if (!Array.isArray(parsed) || parsed.length === 0) throw new Error('Bulk cash JSON harus array');
      for (const row of parsed) {
        await apiPost('/api/BusinessInsights/finance/cash-entry', {
          entryType: row?.entryType ?? 'expense',
          category: row?.category ?? 'operasional',
          amount: Number(row?.amount ?? 0),
          descriptionText: row?.descriptionText ?? '',
        });
      }
      setMessage(`Bulk arus kas berhasil: ${parsed.length}`);
      await load();
    });
  };
  const runBulkClosing = async () => {
    await runAction(async () => {
      const parsed = JSON.parse(bulkClosingJson);
      if (!Array.isArray(parsed) || parsed.length === 0) throw new Error('Bulk closing JSON harus array');
      for (const row of parsed) {
        await apiPost('/api/BusinessInsights/finance/manual-closing', {
          customerName: row?.customerName ?? '',
          customerEmail: row?.customerEmail ?? null,
          customerWhatsApp: row?.customerWhatsApp ?? null,
          programCode: row?.programCode ?? null,
          revenueAmount: Number(row?.revenueAmount ?? 0),
          costAmount: Number(row?.costAmount ?? 0),
          paxCount: Number(row?.paxCount ?? 1),
          jamaahCount: Number(row?.jamaahCount ?? 1),
          transactionDate: row?.transactionDate ?? null,
          refNo: row?.refNo ?? null,
          refAgentUsername: row?.refAgentUsername ?? null,
          commissionType: row?.commissionType ?? 'fixed',
          commissionValue: Number(row?.commissionValue ?? 0),
          minPayout: Number(row?.minPayout ?? 50000),
          note: row?.note ?? null,
        });
      }
      setMessage(`Bulk closing manual berhasil: ${parsed.length}`);
      await load();
    });
  };

  const downloadLedgerCsv = async () => {
    try {
      const token = getAuthToken();
      const res = await fetch(`${API_BASE_URL}/api/BusinessInsights/finance/cash-entries/export`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const blob = await res.blob();
      const href = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = href;
      a.download = `cash-ledger-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(href);
      setMessage('Export CSV berhasil diunduh');
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Gagal download CSV');
    }
  };

  const cards = useMemo(() => {
    if (!summary) return [];
    return [
      { label: 'Leads Masuk', value: summary.leadsMasuk ?? 0 },
      { label: 'Conversion Booking', value: summary.conversionBooking ?? 0 },
      { label: 'Repeat Customer', value: summary.repeatCustomer ?? 0 },
      { label: 'Total Viewers', value: summary.totalViewers ?? 0 },
      { label: 'Total Jamaah', value: summary.totalJamaah ?? 0 },
      { label: 'Avg Rating', value: `${summary.reviewRating?.avg ?? 0} (${summary.reviewRating?.total ?? 0})` },
    ];
  }, [summary]);

  return (
    <div className="p-4 space-y-4 animate-fade-up">
      <div className="bg-white border rounded-3xl p-5 space-y-1">
        <h1 className="text-lg font-extrabold g-text">Laporan Keuangan & Bisnis</h1>
        <p className="text-xs text-zinc-500">Data real: leads, conversion, repeat customer, jamaah, rating, profit, cashflow.</p>
      </div>

      {loading ? (
        <div className="space-y-2">
          <div className="bg-white border rounded-2xl p-3 space-y-2">
            <Skeleton className="h-4 w-44" />
            <Skeleton className="h-8 w-full rounded-xl" />
          </div>
          <div className="flex items-center gap-2 text-xs text-zinc-500">
            <span className="h-4 w-4 rounded-full border-2 border-zinc-300 border-t-primary-600 animate-spin" />
            Memuat data laporan...
          </div>
        </div>
      ) : null}
      {message ? <div className="text-xs text-red-600">{message}</div> : null}

      <div className="grid grid-cols-2 gap-2">
        {cards.map((c) => (
          <div key={c.label} className="bg-white border rounded-2xl p-3">
            <div className="text-[11px] text-zinc-500">{c.label}</div>
            <div className="text-sm font-extrabold mt-1">{c.value}</div>
          </div>
        ))}
      </div>

      <div className="bg-white border rounded-3xl p-5 space-y-2">
        <h2 className="text-sm font-bold">Trip Profit</h2>
        <div className="text-xs space-y-1">
          <div className="flex justify-between"><span>Total Profit</span><span>{toRupiah(Number(summary?.totalProfit ?? 0))}</span></div>
          <div className="flex justify-between"><span>Profit per Trip (Avg)</span><span>{toRupiah(Number(summary?.profitPerTripAvg ?? 0))}</span></div>
          <div className="flex justify-between"><span>Conversion Rate</span><span>{summary?.conversionRatePercent ?? 0}%</span></div>
        </div>
      </div>

      <div className="bg-white border rounded-3xl p-5 space-y-2">
        <h2 className="text-sm font-bold">Cashflow Singkat</h2>
        <div className="text-xs space-y-1">
          <div className="flex justify-between"><span>Income</span><span>{toRupiah(Number(finance?.cashflow?.income ?? 0))}</span></div>
          <div className="flex justify-between"><span>Capital</span><span>{toRupiah(Number(finance?.cashflow?.capital ?? 0))}</span></div>
          <div className="flex justify-between"><span>Expense</span><span>({toRupiah(Number(finance?.cashflow?.expense ?? 0))})</span></div>
          <div className="flex justify-between font-bold border-t pt-1"><span>Net Cash</span><span>{toRupiah(Number(finance?.cashflow?.net ?? 0))}</span></div>
        </div>
      </div>

      <div className="bg-white border rounded-3xl p-5 space-y-2">
        <h2 className="text-sm font-bold">Rekonsiliasi Booking vs Kas</h2>
        <div className="text-xs space-y-1">
          <div className="flex justify-between"><span>Total Booking</span><span>{Number(recon?.totalBookings || 0)}</span></div>
          <div className="flex justify-between"><span>Matched ke Ledger</span><span>{Number(recon?.matchedBookings || 0)}</span></div>
          <div className="flex justify-between"><span>Unmatched</span><span>{Number(recon?.unmatchedBookings || 0)}</span></div>
          <div className="flex justify-between"><span>Revenue Booking</span><span>{toRupiah(Number(recon?.bookingRevenue || 0))}</span></div>
          <div className="flex justify-between"><span>Income Ledger</span><span>{toRupiah(Number(recon?.ledgerIncome || 0))}</span></div>
          <div className="flex justify-between font-bold border-t pt-1"><span>Gap</span><span>{toRupiah(Number(recon?.gap || 0))}</span></div>
        </div>
      </div>

      <div className="bg-white border rounded-3xl p-5 space-y-2">
        <h2 className="text-sm font-bold">Input Arus Kas</h2>
        <div className="grid grid-cols-2 gap-2">
          <select className="border rounded-xl px-3 py-2 text-xs" value={entry.entryType} onChange={(e) => setEntry((p) => ({ ...p, entryType: e.target.value }))}>
            <option value="income">Pemasukan</option>
            <option value="expense">Pengeluaran</option>
            <option value="capital">Modal</option>
          </select>
          <input className="border rounded-xl px-3 py-2 text-xs" value={entry.category} onChange={(e) => setEntry((p) => ({ ...p, category: e.target.value }))} placeholder="Kategori (listrik/air/modal/dll)" />
          <input className="border rounded-xl px-3 py-2 text-xs" type="number" value={entry.amount} onChange={(e) => setEntry((p) => ({ ...p, amount: Number(e.target.value || 0) }))} placeholder="Nominal" />
          <input className="border rounded-xl px-3 py-2 text-xs" value={entry.descriptionText} onChange={(e) => setEntry((p) => ({ ...p, descriptionText: e.target.value }))} placeholder="Keterangan" />
        </div>
        <button className="rounded-xl bg-primary-600 text-white h-9 w-9 inline-flex items-center justify-center text-xs font-semibold" title="Simpan arus kas" onClick={() => void runAction(async () => {
          await apiPost('/api/BusinessInsights/finance/cash-entry', entry);
          setMessage('Arus kas tersimpan');
          await load();
        })}>💾</button>
      </div>
      <div className="bg-white border rounded-3xl p-5 space-y-2 text-xs">
        <h2 className="text-sm font-bold">Bulk JSON Arus Kas</h2>
        <textarea className="w-full min-h-[110px] border rounded-xl p-2 font-mono text-[11px]" value={bulkCashJson} onChange={(e) => setBulkCashJson(e.target.value)} />
        <button className="border rounded-xl h-9 w-9 inline-flex items-center justify-center" title="Execute bulk arus kas" onClick={() => void runBulkCash()}>⚡</button>
      </div>

      <div className="bg-white border rounded-3xl p-5 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-bold">Closing Period & Audit</h2>
          <button className="border rounded-xl px-3 py-2 text-xs" onClick={downloadLedgerCsv}>Download Cash Ledger CSV</button>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <input
            className="border rounded-xl px-3 py-2 text-xs"
            type="number"
            value={periodAction.year}
            onChange={(e) => setPeriodAction((p) => ({ ...p, year: Number(e.target.value || new Date().getFullYear()) }))}
            placeholder="Tahun"
          />
          <input
            className="border rounded-xl px-3 py-2 text-xs"
            type="number"
            min={1}
            max={12}
            value={periodAction.month}
            onChange={(e) => setPeriodAction((p) => ({ ...p, month: Math.min(12, Math.max(1, Number(e.target.value || 1))) }))}
            placeholder="Bulan (1-12)"
          />
        </div>
        <input
          className="border rounded-xl px-3 py-2 text-xs w-full"
          value={periodAction.note}
          onChange={(e) => setPeriodAction((p) => ({ ...p, note: e.target.value }))}
          placeholder="Catatan closing/reopen (opsional)"
        />
        <div className="flex gap-2">
          <button className="rounded-xl bg-zinc-900 text-white h-9 w-9 inline-flex items-center justify-center text-xs font-semibold" title="Close period" onClick={() => void runAction(async () => {
            await apiPost('/api/BusinessInsights/finance/closing-periods/close', periodAction);
            setMessage('Periode berhasil di-close');
            await load();
          })}>🔒</button>
          <button className="rounded-xl bg-amber-600 text-white h-9 w-9 inline-flex items-center justify-center text-xs font-semibold" title="Reopen period" onClick={() => void runAction(async () => {
            await apiPost('/api/BusinessInsights/finance/closing-periods/reopen', periodAction);
            setMessage('Periode berhasil di-reopen');
            await load();
          })}>↺</button>
        </div>
        <div className="text-xs border rounded-2xl p-3 bg-zinc-50 space-y-1">
          <div className="font-semibold">Daftar Closing Per Tahun {periodAction.year}</div>
          {(closingPeriods || []).length === 0 ? <div className="text-zinc-500">Belum ada data closing.</div> : null}
          {(closingPeriods || []).slice(0, 12).map((x) => (
            <div key={x.id} className="flex justify-between gap-2">
              <span>{x.year}-{String(x.month).padStart(2, '0')}</span>
              <span className="font-semibold">{x.closingStatus}</span>
            </div>
          ))}
        </div>
        <div className="text-xs border rounded-2xl p-3 bg-zinc-50 space-y-1">
          <div className="font-semibold">Audit Trail Finance (20 terakhir)</div>
          {(auditRows || []).length === 0 ? <div className="text-zinc-500">Belum ada audit trail.</div> : null}
          {(auditRows || []).map((x) => (
            <div key={x.id} className="flex justify-between gap-2">
              <span>{x.actionName}</span>
              <span className="text-zinc-500">{new Date(x.createdAt).toLocaleString('id-ID')}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white border rounded-3xl p-5 space-y-2">
        <h2 className="text-sm font-bold">Input Closing WA (Manual)</h2>
        <p className="text-[11px] text-zinc-500">Simpan transaksi closing manual agar masuk booking dan otomatis tercatat sebagai pemasukan keuangan.</p>
        <div className="grid grid-cols-2 gap-2">
          <input className="border rounded-xl px-3 py-2 text-xs" value={manualClosing.customerName} onChange={(e) => setManualClosing((p) => ({ ...p, customerName: e.target.value }))} placeholder="Nama customer/jamaah" />
          <input className="border rounded-xl px-3 py-2 text-xs" value={manualClosing.customerWhatsApp} onChange={(e) => setManualClosing((p) => ({ ...p, customerWhatsApp: e.target.value }))} placeholder="WhatsApp" />
          <input className="border rounded-xl px-3 py-2 text-xs" value={manualClosing.programCode} onChange={(e) => setManualClosing((p) => ({ ...p, programCode: e.target.value }))} placeholder="Kode/slug program (opsional)" />
          <input className="border rounded-xl px-3 py-2 text-xs" type="number" value={manualClosing.revenueAmount} onChange={(e) => setManualClosing((p) => ({ ...p, revenueAmount: Number(e.target.value || 0) }))} placeholder="Harga jual (revenue)" />
          <input className="border rounded-xl px-3 py-2 text-xs" type="number" value={manualClosing.costAmount} onChange={(e) => setManualClosing((p) => ({ ...p, costAmount: Number(e.target.value || 0) }))} placeholder="Modal/cost" />
          <input className="border rounded-xl px-3 py-2 text-xs" value={manualClosing.refAgentUsername} onChange={(e) => setManualClosing((p) => ({ ...p, refAgentUsername: e.target.value }))} placeholder="Username agen (opsional)" />
          <select className="border rounded-xl px-3 py-2 text-xs" value={manualClosing.commissionType} onChange={(e) => setManualClosing((p) => ({ ...p, commissionType: e.target.value }))}>
            <option value="fixed">Komisi Nominal (Rp)</option>
            <option value="percent">Komisi Persen (%)</option>
          </select>
          <input className="border rounded-xl px-3 py-2 text-xs" type="number" value={manualClosing.commissionValue} onChange={(e) => setManualClosing((p) => ({ ...p, commissionValue: Number(e.target.value || 0) }))} placeholder="Nilai komisi" />
        </div>
        <input className="border rounded-xl px-3 py-2 text-xs w-full" value={manualClosing.note} onChange={(e) => setManualClosing((p) => ({ ...p, note: e.target.value }))} placeholder="Catatan (opsional)" />
        <div className="text-[11px] text-zinc-600">
          Estimasi profit transaksi ini: <span className="font-semibold">{toRupiah(Math.max(0, Number(manualClosing.revenueAmount || 0) - Number(manualClosing.costAmount || 0)))}</span>
        </div>
        <button className="rounded-xl bg-emerald-600 text-white h-9 w-9 inline-flex items-center justify-center text-xs font-semibold" title="Simpan closing manual" onClick={() => void runAction(async () => {
          await apiPost('/api/BusinessInsights/finance/manual-closing', {
            customerName: manualClosing.customerName,
            customerEmail: null,
            customerWhatsApp: manualClosing.customerWhatsApp || null,
            programCode: manualClosing.programCode || null,
            revenueAmount: Number(manualClosing.revenueAmount || 0),
            costAmount: Number(manualClosing.costAmount || 0),
            paxCount: 1,
            jamaahCount: 1,
            transactionDate: null,
            refNo: null,
            refAgentUsername: manualClosing.refAgentUsername || null,
            commissionType: manualClosing.commissionType,
            commissionValue: Number(manualClosing.commissionValue || 0),
            minPayout: 50000,
            note: manualClosing.note || null,
          });
          setMessage('Closing manual berhasil disimpan');
          setManualClosing({
            customerName: '',
            customerWhatsApp: '',
            programCode: '',
            revenueAmount: 0,
            costAmount: 0,
            refAgentUsername: '',
            commissionType: 'fixed',
            commissionValue: 0,
            note: '',
          });
          await load();
        })}>💾</button>
      </div>
      <div className="bg-white border rounded-3xl p-5 space-y-2 text-xs">
        <h2 className="text-sm font-bold">Bulk JSON Closing Manual</h2>
        <textarea className="w-full min-h-[110px] border rounded-xl p-2 font-mono text-[11px]" value={bulkClosingJson} onChange={(e) => setBulkClosingJson(e.target.value)} />
        <button className="border rounded-xl h-9 w-9 inline-flex items-center justify-center" title="Execute bulk closing manual" onClick={() => void runBulkClosing()}>⚡</button>
      </div>

      <div className="flex gap-4">
        <Link href="/akun" className="inline-flex text-sm text-primary-600">← Kembali ke Akun</Link>
        <Link href="/akun/master" className="inline-flex text-sm text-primary-600">Ke Master Data</Link>
      </div>
    </div>
  );
}


