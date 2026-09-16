'use client';

import { useEffect, useState } from 'react';
import { apiGet, apiPost, apiPut } from '@/lib/api-client';

export default function HrdPage() {
  const [enabled, setEnabled] = useState(false);
  const [msg, setMsg] = useState('');
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const [dash, setDash] = useState<any>(null);
  const [employees, setEmployees] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<any[]>([]);
  const [leaves, setLeaves] = useState<any[]>([]);
  const [payroll, setPayroll] = useState<any[]>([]);
  const [empJson, setEmpJson] = useState(`[
  { "employeeId":"EMP-001", "fullName":"Ahmad Fauzi", "department":"ops", "position":"Staff Ops", "joinDate":"2025-01-10", "isActive":true, "baseSalary":5000000, "allowance":500000, "deduction":0, "overtimeRatePerHour":25000, "absentPenaltyPerDay":75000 }
]`);
  const [attJson, setAttJson] = useState(`[
  { "employeeId":"EMP-001", "workDate":"${new Date().toISOString().slice(0, 10)}", "status":"present", "checkIn":"08:05", "checkOut":"17:12", "overtimeHours":1 }
]`);

  const load = async () => {
    try {
      const f = await apiGet<any>('/api/hrd/feature');
      const en = Boolean(f?.data?.enabled);
      setEnabled(en);
      if (!en) return;
      const [d, e, a, l, p] = await Promise.all([
        apiGet<any>(`/api/hrd/dashboard?month=${month}`),
        apiGet<any>('/api/hrd/employees'),
        apiGet<any>(`/api/hrd/attendance?month=${month}`),
        apiGet<any>('/api/hrd/leaves'),
        apiGet<any>(`/api/hrd/payroll?month=${month}`),
      ]);
      setDash(d?.data ?? null);
      setEmployees(Array.isArray(e?.data) ? e.data : []);
      setAttendance(Array.isArray(a?.data) ? a.data : []);
      setLeaves(Array.isArray(l?.data) ? l.data : []);
      setPayroll(Array.isArray(p?.data) ? p.data : []);
    } catch (e: any) {
      setMsg(e?.message || 'Gagal memuat HRD');
    }
  };

  useEffect(() => { void load(); }, [month]);

  const runAction = async (fn: () => Promise<void>) => {
    try { await fn(); } catch (e: any) { setMsg(e?.message || 'Terjadi kesalahan'); }
  };

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-lg font-bold">HRD Management</h1>
      {msg ? <div className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2">{msg}</div> : null}

      <div className="bg-white border rounded-2xl p-3 space-y-2">
        <div className="text-sm font-semibold">Feature Toggle</div>
        <div className="flex gap-2">
          <button className="border rounded-xl h-9 w-9 inline-flex items-center justify-center" title="Toggle HRD" onClick={() => void runAction(async () => {
            await apiPut('/api/hrd/feature', { enabled: !enabled });
            setMsg(`HRD ${!enabled ? 'aktif' : 'nonaktif'}`);
            await load();
          })}>{enabled ? '✓' : '✕'}</button>
          <input className="border rounded-xl px-3 py-2 text-xs" value={month} onChange={(e) => setMonth(e.target.value)} placeholder="YYYY-MM" />
          <button className="border rounded-xl h-9 w-9 inline-flex items-center justify-center" title="Refresh" onClick={() => void load()}>↻</button>
        </div>
      </div>

      {enabled ? (
        <>
          <div className="grid sm:grid-cols-3 gap-2">
            <div className="bg-white border rounded-2xl p-3"><div className="text-xs text-zinc-500">Employees Active</div><div className="font-bold">{Number(dash?.totalEmployees || 0)}</div></div>
            <div className="bg-white border rounded-2xl p-3"><div className="text-xs text-zinc-500">Leave Pending</div><div className="font-bold">{Number(dash?.leavePending || 0)}</div></div>
            <div className="bg-white border rounded-2xl p-3"><div className="text-xs text-zinc-500">Payroll Total</div><div className="font-bold">{Number(dash?.payrollTotal || 0).toLocaleString('id-ID')}</div></div>
          </div>

          <div className="bg-white border rounded-2xl p-3 space-y-2">
            <div className="text-sm font-semibold">Employees Bulk JSON</div>
            <textarea className="w-full min-h-36 border rounded-xl px-3 py-2 text-[11px] font-mono" value={empJson} onChange={(e) => setEmpJson(e.target.value)} />
            <button className="border rounded-xl h-9 w-9 inline-flex items-center justify-center" title="Save employees" onClick={() => void runAction(async () => {
              const parsed = JSON.parse(empJson);
              await apiPut('/api/hrd/employees', parsed);
              setMsg('Employees updated');
              await load();
            })}>💾</button>
            <div className="space-y-1">{employees.map((x) => <div key={x.employeeId} className="border rounded-xl p-2 text-xs">{x.fullName} ({x.employeeId}) - {x.department} - {x.position}</div>)}</div>
          </div>

          <div className="bg-white border rounded-2xl p-3 space-y-2">
            <div className="text-sm font-semibold">Attendance Bulk JSON</div>
            <textarea className="w-full min-h-36 border rounded-xl px-3 py-2 text-[11px] font-mono" value={attJson} onChange={(e) => setAttJson(e.target.value)} />
            <button className="border rounded-xl h-9 w-9 inline-flex items-center justify-center" title="Save attendance" onClick={() => void runAction(async () => {
              const parsed = JSON.parse(attJson);
              await apiPut('/api/hrd/attendance', parsed);
              setMsg('Attendance updated');
              await load();
            })}>⚡</button>
            <div className="space-y-1">{attendance.map((x, i) => <div key={`${x.employeeId}-${x.workDate}-${i}`} className="border rounded-xl p-2 text-xs">{x.workDate} - {x.employeeId} - {x.status} - OT {x.overtimeHours}</div>)}</div>
          </div>

          <div className="bg-white border rounded-2xl p-3 space-y-2">
            <div className="text-sm font-semibold">Leaves</div>
            <button className="border rounded-xl h-9 w-9 inline-flex items-center justify-center" title="Seed leave sample" onClick={() => void runAction(async () => {
              const first = employees[0];
              if (!first) throw new Error('Tambahkan employee dulu');
              const d = new Date().toISOString().slice(0, 10);
              await apiPost('/api/hrd/leaves', { employeeId: first.employeeId, startDate: d, endDate: d, leaveType: 'annual', reason: 'Keperluan keluarga' });
              setMsg('Leave submitted');
              await load();
            })}>＋</button>
            <div className="space-y-1">
              {leaves.map((x) => (
                <div key={x.id} className="border rounded-xl p-2 text-xs space-y-1">
                  <div>{x.employeeId} | {x.startDate} s/d {x.endDate} | {x.status}</div>
                  <div className="flex gap-1">
                    <button className="border rounded h-8 w-8 inline-flex items-center justify-center" title="Approve" onClick={() => void runAction(async () => { await apiPost(`/api/hrd/leaves/${x.id}/action`, { action: 'approve' }); await load(); })}>✓</button>
                    <button className="border rounded h-8 w-8 inline-flex items-center justify-center" title="Reject" onClick={() => void runAction(async () => { await apiPost(`/api/hrd/leaves/${x.id}/action`, { action: 'reject' }); await load(); })}>✕</button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white border rounded-2xl p-3 space-y-2">
            <div className="text-sm font-semibold">Payroll</div>
            <button className="border rounded-xl h-9 w-9 inline-flex items-center justify-center" title="Generate payroll" onClick={() => void runAction(async () => {
              await apiPost(`/api/hrd/payroll/generate?month=${month}`, {});
              setMsg('Payroll generated');
              await load();
            })}>🧾</button>
            <div className="space-y-1">{payroll.map((x) => <div key={x.payrollId} className="border rounded-xl p-2 text-xs">{x.employeeName} | Net: {Number(x.netSalary || 0).toLocaleString('id-ID')} | Present: {x.presentDays}</div>)}</div>
          </div>
        </>
      ) : (
        <div className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">HRD belum aktif.</div>
      )}
    </div>
  );
}

