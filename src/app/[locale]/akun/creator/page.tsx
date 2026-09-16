'use client';

import { useEffect, useState } from 'react';
import { Link } from '@/i18n/routing-patch';
import { apiGet, apiPost, apiPut } from '@/lib/api-client';

const statusClass = (status?: string) => {
  const s = String(status || '').toLowerCase();
  if (s === 'approved') return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  if (s === 'rejected' || s === 'suspended') return 'bg-red-50 text-red-700 border-red-200';
  return 'bg-amber-50 text-amber-700 border-amber-200';
};

export default function CreatorPage() {
  const [dashboard, setDashboard] = useState<any>(null);
  const [challenges, setChallenges] = useState<any[]>([]);
  const [rewards, setRewards] = useState<any>(null);
  const [leaderboard, setLeaderboard] = useState<any>(null);
  const [form, setForm] = useState<any>({ tikTokUsername: '', instagramUsername: '', youtubeChannelUrl: '', facebookUrl: '', websiteUrl: '', nicheContent: '', bio: '' });
  const [submitForm, setSubmitForm] = useState<any>({});
  const [ai, setAi] = useState<any>({ toolType: 'Caption', category: 'Umroh', prompt: '' });
  const [aiResult, setAiResult] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const [d, c, r, l] = await Promise.all([
        apiGet<any>('/api/Creator/dashboard'),
        apiGet<any>('/api/Creator/challenges?page=1&pageSize=20'),
        apiGet<any>('/api/Creator/rewards'),
        apiGet<any>('/api/Creator/leaderboard?period=monthly&take=10'),
      ]);
      const data = d?.data ?? null;
      setDashboard(data);
      setChallenges(c?.data?.items ?? []);
      setRewards(r?.data ?? null);
      setLeaderboard(l?.data ?? null);
      if (data?.profile) {
        setForm({
          tikTokUsername: data.profile.tikTokUsername ?? '',
          instagramUsername: data.profile.instagramUsername ?? '',
          youtubeChannelUrl: data.profile.youtubeChannelUrl ?? '',
          facebookUrl: data.profile.facebookUrl ?? '',
          websiteUrl: data.profile.websiteUrl ?? '',
          nicheContent: data.profile.nicheContent ?? '',
          bio: data.profile.bio ?? '',
        });
      }
    } catch (e: any) {
      setError(e?.message || 'Gagal memuat creator dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);

  const saveProfile = async () => {
    setSaving('profile');
    setError('');
    try {
      if (dashboard?.profile) await apiPut('/api/Creator/profile', form);
      else await apiPost('/api/Creator/apply', form);
      setMessage('Profile creator tersimpan. Admin akan melakukan review jika status masih pending.');
      await load();
    } catch (e: any) {
      setError(e?.message || 'Gagal simpan profile');
    } finally {
      setSaving('');
    }
  };

  const submitChallenge = async (id: number) => {
    setSaving(`challenge-${id}`);
    setError('');
    try {
      await apiPost(`/api/Creator/challenges/${id}/submit`, submitForm[id] ?? {});
      setMessage('Submission challenge terkirim.');
      setSubmitForm((p: any) => ({ ...p, [id]: {} }));
      await load();
    } catch (e: any) {
      setError(e?.message || 'Gagal submit challenge');
    } finally {
      setSaving('');
    }
  };

  const claimReward = async (id: number) => {
    setSaving(`reward-${id}`);
    setError('');
    try {
      await apiPost(`/api/Creator/rewards/${id}/claim`, { notes: 'Klaim dari dashboard creator' });
      setMessage('Klaim reward terkirim.');
      await load();
    } catch (e: any) {
      setError(e?.message || 'Gagal klaim reward');
    } finally {
      setSaving('');
    }
  };

  const generateAi = async () => {
    setSaving('ai');
    setError('');
    try {
      const res = await apiPost<any>('/api/Creator/ai/generate', ai);
      setAiResult(res?.data?.result ?? '');
    } catch (e: any) {
      setError(e?.message || 'Gagal generate konten');
    } finally {
      setSaving('');
    }
  };

  const copy = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setMessage('Berhasil disalin');
    setTimeout(() => setMessage(''), 1600);
  };

  if (loading) return <div className="p-4"><div className="bg-white border rounded-3xl p-8 text-sm text-zinc-500">Memuat creator dashboard...</div></div>;

  const profile = dashboard?.profile;
  const approved = profile?.status === 'Approved';
  const total = Number(dashboard?.points?.total || 0);
  const progress = Math.min(100, Number(dashboard?.achievementProgressPercent || 0));

  return (
    <div className="p-4 space-y-4 animate-fade-up">
      <div className="bg-white border rounded-3xl p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-lg font-extrabold g-text">Creator Partner</h1>
            <p className="text-xs text-zinc-500 mt-1">Pusat konten, challenge, poin, AI assistant, reward, dan leaderboard creator Alfian Tour.</p>
          </div>
          <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${statusClass(profile?.status)}`}>{profile?.status || 'Belum Daftar'}</span>
        </div>
      </div>
      {message ? <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-700">{message}</div> : null}
      {error ? <div className="rounded-2xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">{error}</div> : null}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
        <div className="bg-white border rounded-2xl p-3"><div className="text-zinc-500">Total Poin</div><div className="text-lg font-bold">{total}</div></div>
        <div className="bg-white border rounded-2xl p-3"><div className="text-zinc-500">Poin Hari Ini</div><div className="text-lg font-bold">{dashboard?.points?.today || 0}</div></div>
        <div className="bg-white border rounded-2xl p-3"><div className="text-zinc-500">Challenge Approved</div><div className="text-lg font-bold">{dashboard?.stats?.approvedChallengeCount || 0}</div></div>
        <div className="bg-white border rounded-2xl p-3"><div className="text-zinc-500">Download Vault</div><div className="text-lg font-bold">{dashboard?.stats?.downloadCount || 0}</div></div>
      </div>

      <div className="bg-white border rounded-3xl p-5 space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold">{dashboard?.achievement?.name || 'Creator Pemula'}</h2>
            <p className="text-xs text-zinc-500">{dashboard?.nextAchievement ? `${dashboard.nextAchievement.minPoints - total} poin lagi ke ${dashboard.nextAchievement.name}` : 'Level tertinggi tercapai'}</p>
          </div>
          <span className="rounded-full bg-primary-50 px-3 py-1 text-xs font-semibold text-primary-700">{progress}%</span>
        </div>
        <div className="h-3 rounded-full bg-zinc-100 overflow-hidden">
          <div className="h-full bg-gradient-to-r from-sky-500 via-emerald-500 to-amber-500" style={{ width: `${progress}%` }} />
        </div>
      </div>

      <div className="bg-white border rounded-3xl p-5 space-y-3">
        <h2 className="text-sm font-bold">Profile Creator</h2>
        <div className="grid md:grid-cols-2 gap-2">
          <input className="rounded-xl border px-3 py-2 text-sm" placeholder="TikTok username" value={form.tikTokUsername} onChange={(e) => setForm({ ...form, tikTokUsername: e.target.value })} />
          <input className="rounded-xl border px-3 py-2 text-sm" placeholder="Instagram username" value={form.instagramUsername} onChange={(e) => setForm({ ...form, instagramUsername: e.target.value })} />
          <input className="rounded-xl border px-3 py-2 text-sm" placeholder="YouTube channel URL" value={form.youtubeChannelUrl} onChange={(e) => setForm({ ...form, youtubeChannelUrl: e.target.value })} />
          <input className="rounded-xl border px-3 py-2 text-sm" placeholder="Niche konten" value={form.nicheContent} onChange={(e) => setForm({ ...form, nicheContent: e.target.value })} />
        </div>
        <textarea className="w-full rounded-xl border px-3 py-2 text-sm" placeholder="Bio singkat creator" value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} />
        <button disabled={saving === 'profile'} onClick={saveProfile} className="rounded-xl bg-primary-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">{saving === 'profile' ? 'Menyimpan...' : profile ? 'Update Profile' : 'Daftar Creator Partner'}</button>
      </div>

      <div className="bg-white border rounded-3xl p-5 space-y-3">
        <h2 className="text-sm font-bold">AI Content Assistant</h2>
        <div className="grid md:grid-cols-3 gap-2">
          <select className="rounded-xl border px-3 py-2 text-sm" value={ai.toolType} onChange={(e) => setAi({ ...ai, toolType: e.target.value })}>{['Caption', 'Script', 'Title', 'Hashtag', 'Article'].map((x) => <option key={x}>{x}</option>)}</select>
          <input className="rounded-xl border px-3 py-2 text-sm" placeholder="Kategori" value={ai.category} onChange={(e) => setAi({ ...ai, category: e.target.value })} />
          <button disabled={saving === 'ai' || !ai.prompt} onClick={generateAi} className="rounded-xl bg-zinc-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">{saving === 'ai' ? 'Membuat...' : 'Generate'}</button>
        </div>
        <textarea className="w-full rounded-xl border px-3 py-2 text-sm" placeholder="Brief konten yang ingin dibuat" value={ai.prompt} onChange={(e) => setAi({ ...ai, prompt: e.target.value })} />
        {aiResult ? <div className="rounded-2xl bg-zinc-50 border p-3 text-xs whitespace-pre-line"><button className="float-right rounded-lg border px-2 py-1 text-[11px]" onClick={() => copy(aiResult)}>Copy</button>{aiResult}</div> : null}
      </div>

      <div className="bg-white border rounded-3xl p-5 space-y-3">
        <h2 className="text-sm font-bold">Challenge Aktif</h2>
        {!approved ? <div className="rounded-2xl bg-amber-50 border border-amber-200 p-3 text-xs text-amber-800">Submit challenge aktif setelah profile Creator Partner disetujui admin.</div> : null}
        {challenges.length === 0 ? <p className="text-xs text-zinc-500">Belum ada challenge aktif.</p> : null}
        {challenges.map((x) => (
          <div key={x.id} className="rounded-2xl border p-3 space-y-2">
            <div className="flex justify-between gap-2"><b className="text-sm">{x.title}</b><span className="text-xs text-primary-700">+{x.pointOnSubmit}/{x.pointOnApproved} poin</span></div>
            <p className="text-xs text-zinc-500">{x.category || 'Campaign'} • {x.platformRequirement || 'Semua platform'}</p>
            <div className="grid md:grid-cols-2 gap-2">
              <input className="rounded-xl border px-3 py-2 text-sm" placeholder="TikTok URL" value={submitForm[x.id]?.tikTokUrl ?? ''} onChange={(e) => setSubmitForm((p: any) => ({ ...p, [x.id]: { ...(p[x.id] ?? {}), tikTokUrl: e.target.value } }))} />
              <input className="rounded-xl border px-3 py-2 text-sm" placeholder="Instagram URL" value={submitForm[x.id]?.instagramUrl ?? ''} onChange={(e) => setSubmitForm((p: any) => ({ ...p, [x.id]: { ...(p[x.id] ?? {}), instagramUrl: e.target.value } }))} />
              <input className="rounded-xl border px-3 py-2 text-sm" placeholder="YouTube URL" value={submitForm[x.id]?.youtubeUrl ?? ''} onChange={(e) => setSubmitForm((p: any) => ({ ...p, [x.id]: { ...(p[x.id] ?? {}), youtubeUrl: e.target.value } }))} />
              <input className="rounded-xl border px-3 py-2 text-sm" placeholder="Evidence URL opsional" value={submitForm[x.id]?.evidenceUrl ?? ''} onChange={(e) => setSubmitForm((p: any) => ({ ...p, [x.id]: { ...(p[x.id] ?? {}), evidenceUrl: e.target.value } }))} />
            </div>
            <textarea className="w-full rounded-xl border px-3 py-2 text-sm" placeholder="Caption singkat" value={submitForm[x.id]?.caption ?? ''} onChange={(e) => setSubmitForm((p: any) => ({ ...p, [x.id]: { ...(p[x.id] ?? {}), caption: e.target.value } }))} />
            <button disabled={!approved || saving === `challenge-${x.id}`} onClick={() => submitChallenge(x.id)} className="rounded-xl bg-primary-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">{saving === `challenge-${x.id}` ? 'Mengirim...' : 'Submit Challenge'}</button>
          </div>
        ))}
      </div>

      <div className="bg-white border rounded-3xl p-5 space-y-3">
        <h2 className="text-sm font-bold">Reward Creator</h2>
        <div className="text-xs text-zinc-500">Poin tersedia: <b>{rewards?.availablePoints || 0}</b></div>
        <div className="grid md:grid-cols-2 gap-2">
          {(rewards?.rewards ?? []).map((x: any) => (
            <div key={x.id} className="rounded-2xl border p-3 text-xs space-y-2">
              <div className="font-bold">{x.name}</div>
              <div className="text-zinc-500">{x.rewardType} • {x.requiredPoints} poin</div>
              <button disabled={!x.canClaim || saving === `reward-${x.id}`} onClick={() => claimReward(x.id)} className="rounded-xl border px-3 py-2 font-semibold disabled:opacity-50">{saving === `reward-${x.id}` ? 'Mengirim...' : x.canClaim ? 'Klaim Reward' : 'Poin Belum Cukup'}</button>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white border rounded-3xl p-5 space-y-3">
        <h2 className="text-sm font-bold">Top Creator Bulanan</h2>
        {(leaderboard?.topCreator ?? []).map((x: any, idx: number) => <div key={x.userId} className="rounded-xl border px-3 py-2 text-xs flex justify-between"><span>#{idx + 1} {x.fullName || x.userName}</span><b>{x.points} poin</b></div>)}
      </div>

      <Link href="/akun" className="text-sm text-primary-600">Kembali ke Akun</Link>
    </div>
  );
}
