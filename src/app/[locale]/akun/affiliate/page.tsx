'use client';

import { useEffect, useMemo, useState } from 'react';
import { Link } from '@/i18n/routing-patch';
import { apiGet, apiPost } from '@/lib/api-client';

const money = (v: unknown) => `Rp ${Number(v || 0).toLocaleString('id-ID')}`;
const levelGradient = (level?: string) => {
  const v = String(level || '').toLowerCase();
  if (v.includes('elite')) return 'from-amber-400 to-yellow-700';
  if (v.includes('growth')) return 'from-emerald-400 to-green-700';
  if (v.includes('active')) return 'from-sky-400 to-blue-700';
  return 'from-zinc-400 to-zinc-700';
};

export default function AffiliatePage() {
  const [summary, setSummary] = useState<any>(null);
  const [refs, setRefs] = useState<any[]>([]);
  const [commissions, setCommissions] = useState<any[]>([]);
  const [leaderboards, setLeaderboards] = useState<any>(null);
  const [copied, setCopied] = useState('');
  const [downline, setDownline] = useState({ fullName: '', email: '', password: '', whatsApp: '', role: 'User', acceptAffiliateTos: false });
  const [savingDownline, setSavingDownline] = useState(false);
  const [error, setError] = useState('');
  const link = useMemo(() => summary?.referralCode ? `https://alfiantour.com/id/${summary.referralCode}` : '', [summary]);

  useEffect(() => {
    void (async () => {
      const [s, r, c, l] = await Promise.all([
        apiGet<any>('/api/Membership/affiliate/me'),
        apiGet<any>('/api/Membership/affiliate/referrals'),
        apiGet<any>('/api/Membership/affiliate/commissions'),
        apiGet<any>('/api/Membership/leaderboards?take=10'),
      ]);
      setSummary(s?.data ?? null);
      setRefs(r?.data ?? []);
      setCommissions(c?.data ?? []);
      setLeaderboards(l?.data ?? null);
    })();
  }, []);

  const copy = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied('Berhasil disalin');
    setTimeout(() => setCopied(''), 1500);
  };

  return (
    <div className="p-4 space-y-4 animate-fade-up">
      <div className="bg-white border rounded-3xl p-5">
        <h1 className="text-lg font-extrabold g-text">Affiliate</h1>
        <p className="text-xs text-zinc-500 mt-1">Kode referral, referral langsung, dan status komisi Anda.</p>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-3xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h3 className="font-extrabold text-sm text-amber-900 flex items-center gap-1.5">
            <span>📢</span>
            <span>Promosikan Layanan & Akomodasi</span>
          </h3>
          <p className="text-xs text-amber-800 leading-relaxed font-semibold">
            Dapatkan komisi untuk setiap pesanan hotel, visa, dokumen, atau transportasi. Salin link rujukan bersih langsung dari katalog.
          </p>
        </div>
        <Link 
          href="/akun/layanan-affiliate" 
          className="rounded-2xl bg-amber-600 hover:bg-amber-700 text-white font-bold px-4 py-2.5 text-xs text-center transition-colors shadow-sm shrink-0"
        >
          Buka Katalog Tautan
        </Link>
      </div>

      <div className="bg-white border rounded-3xl p-5 space-y-3">
        <div className="text-xs text-zinc-500">Link Referral</div>
        <div className="rounded-2xl bg-zinc-50 border p-3 text-xs break-all font-mono">{link || '-'}</div>
        <div className="flex gap-2">
          <button className="rounded-xl border px-3 py-2 text-xs font-semibold" onClick={() => copy(link)} disabled={!link}>Copy</button>
          <a className="rounded-xl bg-emerald-600 px-3 py-2 text-xs font-semibold text-white" href={`https://wa.me/?text=${encodeURIComponent(`Assalamu'alaikum, ini info AlfianTour: ${link}`)}`} target="_blank" rel="noreferrer">Share WhatsApp</a>
        </div>
        {copied ? <p className="text-xs text-emerald-600">{copied}</p> : null}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
        <div className="bg-white border rounded-2xl p-3"><div className="text-zinc-500">Referral</div><div className="text-lg font-bold">{summary?.directReferralCount || 0}</div></div>
        <div className="bg-white border rounded-2xl p-3"><div className="text-zinc-500">Pending</div><div className="font-bold">{money(summary?.pendingCommission)}</div></div>
        <div className="bg-white border rounded-2xl p-3"><div className="text-zinc-500">Approved</div><div className="font-bold">{money(summary?.approvedCommission)}</div></div>
        <div className="bg-white border rounded-2xl p-3"><div className="text-zinc-500">Paid</div><div className="font-bold">{money(summary?.paidCommission)}</div></div>
      </div>

      <div className="bg-white border rounded-3xl p-5 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold">Bonus Aktivitas</h2>
            <p className="text-xs text-zinc-500">Poin untuk badge, prioritas campaign, akses materi, dan ranking affiliate aktif.</p>
          </div>
          <span className="rounded-full bg-primary-50 px-3 py-1 text-xs font-semibold text-primary-700">{summary?.activityBonus?.badge || 'Starter'}</span>
        </div>
        <div className={`rounded-3xl bg-gradient-to-br ${levelGradient(summary?.activityBonus?.badge)} p-4 text-white`}>
          <div className="text-xs opacity-80">Level Saat Ini</div>
          <div className="text-xl font-extrabold">{summary?.activityBonus?.level?.name || 'Starter'}</div>
          <p className="mt-1 text-xs opacity-90">{summary?.activityBonus?.level?.benefit || summary?.activityBonus?.purpose}</p>
          <div className="mt-3 h-2 rounded-full bg-white/25 overflow-hidden">
            <div className="h-full bg-white" style={{ width: `${Math.min(100, Number(summary?.activityBonus?.levelProgressPercent || 0))}%` }} />
          </div>
          <div className="mt-2 text-[11px] opacity-90">
            {summary?.activityBonus?.nextLevel ? `${summary.activityBonus.pointsToNextLevel} poin lagi menuju ${summary.activityBonus.nextLevel.name}` : 'Level tertinggi tercapai'}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="rounded-2xl bg-zinc-50 p-3"><div className="text-zinc-500">Poin Hari Ini</div><div className="text-lg font-bold">{summary?.activityBonus?.pointsToday || 0}</div></div>
          <div className="rounded-2xl bg-zinc-50 p-3"><div className="text-zinc-500">Total Poin</div><div className="text-lg font-bold">{summary?.activityBonus?.pointsTotal || 0}</div></div>
        </div>
        <div className="rounded-2xl bg-zinc-50 p-3 text-xs text-zinc-600">
          {summary?.activityBonus?.purpose || 'Poin adalah indikator aktivitas affiliate, bukan saldo uang.'}
        </div>
        <div className="space-y-2">
          <div className="text-xs font-semibold text-zinc-600">Misi Harian</div>
          {(summary?.activityBonus?.dailyMission || []).map((m: any, idx: number) => (
            <div key={idx} className="rounded-xl border px-3 py-2 text-xs flex items-center justify-between gap-2">
              <span>{m.title}<span className="block text-[10px] text-zinc-400">{m.cta}</span></span>
              <span className={m.done ? 'text-emerald-600 font-semibold' : 'text-zinc-400'}>{m.done ? 'Selesai' : `+${m.points} poin`}</span>
            </div>
          ))}
        </div>
        <div className="grid md:grid-cols-2 gap-3">
          <div className="space-y-2">
            <div className="text-xs font-semibold text-zinc-600">Cara Mendapat Poin</div>
            {(summary?.activityBonus?.earningRules || []).map((x: any, idx: number) => (
              <div key={idx} className="rounded-xl border px-3 py-2 text-xs">
                <div className="font-semibold">{x.action}</div>
                <div className="text-zinc-500">{x.points} poin • {x.limit}</div>
              </div>
            ))}
          </div>
          <div className="space-y-2">
            <div className="text-xs font-semibold text-zinc-600">Reward & Benefit</div>
            {(summary?.activityBonus?.rewardCatalog || []).map((x: any) => (
              <div key={x.minPoints} className="rounded-xl border px-3 py-2 text-xs">
                <div className="font-semibold">{x.minPoints}+ poin • {x.title}</div>
                <div className="text-zinc-500">{x.benefit}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <form
        className="bg-white border rounded-3xl p-5 space-y-3"
        onSubmit={async (e) => {
          e.preventDefault();
          setSavingDownline(true);
          setError('');
          try {
            await apiPost('/api/Membership/affiliate/downline-register', downline);
            setDownline({ fullName: '', email: '', password: '', whatsApp: '', role: 'User', acceptAffiliateTos: false });
            const r = await apiGet<any>('/api/Membership/affiliate/referrals');
            setRefs(r?.data ?? []);
          } catch (err: any) {
            setError(err?.message || 'Gagal daftar downline');
          } finally {
            setSavingDownline(false);
          }
        }}
      >
        <h2 className="text-sm font-bold">Daftarkan Downline</h2>
        {error ? <p className="text-xs text-red-600">{error}</p> : null}
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900 space-y-1">
          <div className="font-bold">Peringatan Anti Self-Recruit</div>
          <p>Agen dilarang mendaftarkan diri sendiri, akun keluarga palsu, akun ganda, atau identitas yang dikendalikan sendiri hanya untuk mengejar bonus aktivitas. Pelanggaran dapat membuat bonus dibatalkan, akun disuspend, dan komisi ditahan untuk review admin.</p>
        </div>
        <div className="grid md:grid-cols-2 gap-2">
          <input className="rounded-xl border px-3 py-2 text-sm" placeholder="Nama lengkap" value={downline.fullName} onChange={(e) => setDownline({ ...downline, fullName: e.target.value })} required />
          <input className="rounded-xl border px-3 py-2 text-sm" placeholder="Email" type="email" value={downline.email} onChange={(e) => setDownline({ ...downline, email: e.target.value })} required />
          <input className="rounded-xl border px-3 py-2 text-sm" placeholder="Password awal" type="text" value={downline.password} onChange={(e) => setDownline({ ...downline, password: e.target.value })} required />
          <input className="rounded-xl border px-3 py-2 text-sm" placeholder="WhatsApp" value={downline.whatsApp} onChange={(e) => setDownline({ ...downline, whatsApp: e.target.value })} />
        </div>
        <label className="flex items-start gap-2 rounded-2xl border p-3 text-xs text-zinc-600">
          <input
            type="checkbox"
            className="mt-0.5"
            checked={downline.acceptAffiliateTos}
            onChange={(e) => setDownline({ ...downline, acceptAffiliateTos: e.target.checked })}
          />
          <span>
            Saya menyatakan downline ini adalah orang berbeda yang sah, bukan akun diri sendiri/akun ganda, dan saya menyetujui ketentuan affiliate pada <Link href="/information/tos" className="text-primary-600 font-semibold">TOS AlfianTour</Link>.
          </span>
        </label>
        <button disabled={savingDownline || !downline.acceptAffiliateTos} className="rounded-xl bg-primary-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">{savingDownline ? 'Mendaftarkan...' : 'Daftarkan Downline'}</button>
      </form>

      <div className="bg-white border rounded-3xl p-5 space-y-2">
        <h2 className="text-sm font-bold">Referral Langsung</h2>
        {refs.length === 0 ? <p className="text-xs text-zinc-500">Belum ada referral langsung.</p> : null}
        {refs.map((x) => <div key={x.referredUserId} className="rounded-xl border px-3 py-2 text-xs"><div className="font-semibold">{x.fullName || x.userName}</div><div className="text-zinc-500">{x.email || '-'}</div></div>)}
      </div>

      <div className="bg-white border rounded-3xl p-5 space-y-3">
        <h2 className="text-sm font-bold">Top Affiliate & Closing</h2>
        <div className="grid md:grid-cols-2 gap-3">
          <div className="space-y-2">
            <div className="text-xs font-semibold text-zinc-600">Top Affiliate</div>
            {(leaderboards?.topAffiliate || []).map((x: any, idx: number) => <div key={x.userId} className="rounded-xl border px-3 py-2 text-xs flex justify-between"><span>#{idx + 1} {x.fullName || x.userName}</span><b>{x.totalReferral}</b></div>)}
          </div>
          <div className="space-y-2">
            <div className="text-xs font-semibold text-zinc-600">Top Closing</div>
            {(leaderboards?.topClosing || []).map((x: any, idx: number) => <div key={x.userId} className="rounded-xl border px-3 py-2 text-xs flex justify-between"><span>#{idx + 1} {x.fullName || x.userName}</span><b>{money(x.paidCommission)}</b></div>)}
          </div>
        </div>
      </div>

      <div className="bg-white border rounded-3xl p-5 space-y-2">
        <h2 className="text-sm font-bold">Riwayat Komisi</h2>
        {commissions.length === 0 ? <p className="text-xs text-zinc-500">Belum ada komisi.</p> : null}
        {commissions.map((x) => <div key={x.id} className="rounded-xl border px-3 py-2 text-xs flex justify-between"><span>{x.sourceType} • {x.status}</span><span className="font-semibold">{money(x.amount)}</span></div>)}
      </div>

      <Link href="/akun" className="text-sm text-primary-600">Kembali ke Akun</Link>
    </div>
  );
}
