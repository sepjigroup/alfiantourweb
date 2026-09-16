'use client';

import { useEffect, useMemo, useState } from 'react';
import { ModalShell } from '@/components/ui/ModalShell';
import { apiGet, apiPost, apiPut, apiDelete } from '@/lib/api-client';

const emptyChallenge = {
  id: 0,
  title: '',
  slug: '',
  description: '',
  category: 'Umroh',
  platformRequirement: 'TikTok, Instagram, YouTube',
  startAt: '',
  endAt: '',
  pointOnSubmit: 20,
  pointOnApproved: 50,
  maxSubmissionPerUser: 1,
  status: 'Draft',
  coverUrl: '',
  labelsText: 'Penting,Challenge',
  isPinned: false,
  sortOrder: 0,
  isActive: true,
};

const emptyReward = {
  id: 0,
  code: '',
  name: '',
  description: '',
  rewardType: 'Voucher',
  requiredPoints: 1000,
  stockQty: '',
  coverUrl: '',
  terms: '',
  startAt: '',
  endAt: '',
  sortOrder: 0,
  isActive: true,
};

const statusClass = (status?: string) => {
  const s = String(status || '').toLowerCase();
  if (s === 'approved' || s === 'published' || s === 'fulfilled') return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  if (s === 'rejected' || s === 'suspended' || s === 'closed') return 'bg-red-50 text-red-700 border-red-200';
  return 'bg-amber-50 text-amber-700 border-amber-200';
};

const toInputDate = (value?: string | null) => value ? new Date(value).toISOString().slice(0, 16) : '';
const toApiDate = (value?: string) => value ? new Date(value).toISOString() : null;

export default function KelolaCreatorPage() {
  const [tab, setTab] = useState<'profiles' | 'challenges' | 'submissions' | 'points' | 'rewards' | 'leaderboard'>('profiles');
  const [profiles, setProfiles] = useState<any[]>([]);
  const [challenges, setChallenges] = useState<any[]>([]);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [pointRules, setPointRules] = useState<any[]>([]);
  const [rewards, setRewards] = useState<any[]>([]);
  const [claims, setClaims] = useState<any[]>([]);
  const [leaderboard, setLeaderboard] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [filters, setFilters] = useState({ search: '', status: '' });
  const [challengeForm, setChallengeForm] = useState<any>(emptyChallenge);
  const [rewardForm, setRewardForm] = useState<any>(emptyReward);
  const [pointForm, setPointForm] = useState<any>({ userId: '', points: 0, description: '' });
  const [modal, setModal] = useState<'challenge' | 'reward' | 'point' | ''>('');
  const [saving, setSaving] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const profileStats = useMemo(() => ({
    pending: profiles.filter((x) => x.status === 'Pending').length,
    approved: profiles.filter((x) => x.status === 'Approved').length,
    suspended: profiles.filter((x) => x.status === 'Suspended').length,
  }), [profiles]);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const qs = new URLSearchParams();
      if (filters.search) qs.set('search', filters.search);
      if (filters.status) qs.set('status', filters.status);
      qs.set('pageSize', '50');
      const [p, c, s, pr, rw, rc, lb, u] = await Promise.all([
        apiGet<any>(`/api/Creator/admin/profiles?${qs.toString()}`),
        apiGet<any>('/api/Creator/admin/challenges?page=1&pageSize=50'),
        apiGet<any>('/api/Creator/admin/submissions?page=1&pageSize=50'),
        apiGet<any>('/api/Creator/admin/point-rules'),
        apiGet<any>('/api/Creator/admin/rewards'),
        apiGet<any>('/api/Creator/admin/reward-claims?page=1&pageSize=50'),
        apiGet<any>('/api/Creator/admin/leaderboard?period=monthly&take=20'),
        apiGet<any>('/api/UserManagement?pageNumber=1&pageSize=300'),
      ]);
      setProfiles(p?.data?.items ?? []);
      setChallenges(c?.data?.items ?? []);
      setSubmissions(s?.data?.items ?? []);
      setPointRules(pr?.data ?? []);
      setRewards(rw?.data ?? []);
      setClaims(rc?.data?.items ?? []);
      setLeaderboard(lb?.data ?? null);
      setUsers(u?.data?.items ?? u?.data?.Items ?? []);
    } catch (e: any) {
      setError(e?.message || 'Gagal memuat data creator');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);

  const updateProfileStatus = async (id: number, status: string) => {
    setSaving(`profile-${id}`);
    try {
      await apiPost(`/api/Creator/admin/profiles/${id}/status`, { status, notes: `Set ${status} dari admin`, reason: status === 'Rejected' || status === 'Suspended' ? `Status ${status} oleh admin` : '' });
      setMessage('Status creator diperbarui');
      await load();
    } catch (e: any) { setError(e?.message || 'Gagal update status creator'); } finally { setSaving(''); }
  };

  const openChallenge = (row?: any) => {
    setChallengeForm(row ? {
      id: row.id,
      title: row.title ?? '',
      slug: row.slug ?? '',
      description: row.description ?? '',
      category: row.category ?? '',
      platformRequirement: row.platformRequirement ?? '',
      startAt: toInputDate(row.startAt),
      endAt: toInputDate(row.endAt),
      pointOnSubmit: row.pointOnSubmit ?? 20,
      pointOnApproved: row.pointOnApproved ?? 50,
      maxSubmissionPerUser: row.maxSubmissionPerUser ?? 1,
      status: row.status ?? 'Draft',
      coverUrl: row.coverUrl ?? '',
      labelsText: (row.labels ?? []).join(','),
      isPinned: Boolean(row.isPinned),
      sortOrder: row.sortOrder ?? 0,
      isActive: row.admin?.isActive ?? true,
    } : emptyChallenge);
    setModal('challenge');
  };

  const saveChallenge = async () => {
    setSaving('challenge');
    try {
      const payload = { ...challengeForm, startAt: toApiDate(challengeForm.startAt), endAt: toApiDate(challengeForm.endAt), labels: String(challengeForm.labelsText || '').split(',').map((x) => x.trim()).filter(Boolean) };
      if (challengeForm.id) await apiPut(`/api/Creator/admin/challenges/${challengeForm.id}`, payload);
      else await apiPost('/api/Creator/admin/challenges', payload);
      setModal('');
      setMessage('Challenge tersimpan');
      await load();
    } catch (e: any) { setError(e?.message || 'Gagal simpan challenge'); } finally { setSaving(''); }
  };

  const updateSubmission = async (id: number, status: string, pointsAwarded?: number) => {
    setSaving(`submission-${id}`);
    try {
      await apiPost(`/api/Creator/admin/submissions/${id}/status`, { status, pointsAwarded, notes: `Set ${status} dari admin`, reason: status === 'Rejected' ? 'Ditolak admin' : '' });
      setMessage('Submission diperbarui');
      await load();
    } catch (e: any) { setError(e?.message || 'Gagal update submission'); } finally { setSaving(''); }
  };

  const updatePointRule = async (row: any, next: any) => {
    setSaving(`rule-${row.id}`);
    try {
      await apiPut(`/api/Creator/admin/point-rules/${row.id}`, { ...row, ...next });
      setMessage('Rule poin diperbarui');
      await load();
    } catch (e: any) { setError(e?.message || 'Gagal update rule poin'); } finally { setSaving(''); }
  };

  const openReward = (row?: any) => {
    setRewardForm(row ? {
      id: row.id,
      code: row.code ?? '',
      name: row.name ?? '',
      description: row.description ?? '',
      rewardType: row.rewardType ?? 'Voucher',
      requiredPoints: row.requiredPoints ?? 0,
      stockQty: row.stockQty ?? '',
      coverUrl: row.coverUrl ?? '',
      terms: row.terms ?? '',
      startAt: toInputDate(row.startAt),
      endAt: toInputDate(row.endAt),
      sortOrder: row.sortOrder ?? 0,
      isActive: Boolean(row.isActive),
    } : emptyReward);
    setModal('reward');
  };

  const saveReward = async () => {
    setSaving('reward');
    try {
      const payload = { ...rewardForm, stockQty: rewardForm.stockQty === '' ? null : Number(rewardForm.stockQty), startAt: toApiDate(rewardForm.startAt), endAt: toApiDate(rewardForm.endAt) };
      if (rewardForm.id) await apiPut(`/api/Creator/admin/rewards/${rewardForm.id}`, payload);
      else await apiPost('/api/Creator/admin/rewards', payload);
      setModal('');
      setMessage('Reward tersimpan');
      await load();
    } catch (e: any) { setError(e?.message || 'Gagal simpan reward'); } finally { setSaving(''); }
  };

  const updateClaim = async (id: number, status: string) => {
    setSaving(`claim-${id}`);
    try {
      await apiPost(`/api/Creator/admin/reward-claims/${id}/status`, { status, notes: `Set ${status} dari admin`, fulfillmentReference: status === 'Fulfilled' ? `FUL-${Date.now()}` : '' });
      setMessage('Claim reward diperbarui');
      await load();
    } catch (e: any) { setError(e?.message || 'Gagal update claim reward'); } finally { setSaving(''); }
  };

  const adjustPoint = async () => {
    setSaving('point');
    try {
      await apiPost('/api/Creator/admin/points/adjust', { ...pointForm, points: Number(pointForm.points || 0) });
      setModal('');
      setPointForm({ userId: '', points: 0, description: '' });
      setMessage('Point adjustment tersimpan');
      await load();
    } catch (e: any) { setError(e?.message || 'Gagal adjustment poin'); } finally { setSaving(''); }
  };

  return (
    <div className="p-4 space-y-4 animate-fade-up">
      <div className="bg-white border rounded-3xl p-5">
        <h1 className="text-lg font-extrabold g-text">Kelola Creator</h1>
        <p className="text-xs text-zinc-500 mt-1">Approval creator, challenge, point rules, reward, klaim, dan leaderboard.</p>
      </div>
      {message ? <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-700">{message}</div> : null}
      {error ? <div className="rounded-2xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">{error}</div> : null}

      <div className="grid grid-cols-3 gap-2 text-xs">
        <div className="bg-white border rounded-2xl p-3"><div className="text-zinc-500">Pending</div><div className="text-lg font-bold">{profileStats.pending}</div></div>
        <div className="bg-white border rounded-2xl p-3"><div className="text-zinc-500">Approved</div><div className="text-lg font-bold">{profileStats.approved}</div></div>
        <div className="bg-white border rounded-2xl p-3"><div className="text-zinc-500">Suspended</div><div className="text-lg font-bold">{profileStats.suspended}</div></div>
      </div>

      <div className="bg-white border rounded-3xl p-3 flex flex-wrap gap-2">
        {[
          ['profiles', 'Creator'],
          ['challenges', 'Challenge'],
          ['submissions', 'Submission'],
          ['points', 'Point Rules'],
          ['rewards', 'Reward'],
          ['leaderboard', 'Leaderboard'],
        ].map(([key, label]) => (
          <button key={key} className={`rounded-xl px-3 py-2 text-xs font-semibold border ${tab === key ? 'bg-zinc-900 text-white' : 'bg-white'}`} onClick={() => setTab(key as any)}>{label}</button>
        ))}
      </div>

      {tab === 'profiles' ? (
        <div className="space-y-3">
          <div className="bg-white border rounded-3xl p-4 grid md:grid-cols-3 gap-2">
            <input className="rounded-xl border px-3 py-2 text-sm" placeholder="Cari nama/email/platform" value={filters.search} onChange={(e) => setFilters({ ...filters, search: e.target.value })} />
            <select className="rounded-xl border px-3 py-2 text-sm" value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}><option value="">Semua status</option>{['Pending', 'Approved', 'Rejected', 'Suspended'].map((x) => <option key={x}>{x}</option>)}</select>
            <button className="rounded-xl bg-primary-600 px-4 py-2 text-sm font-semibold text-white" onClick={load}>{loading ? 'Memuat...' : 'Terapkan Filter'}</button>
          </div>
          <div className="bg-white border rounded-3xl p-5 space-y-2">
            {profiles.map((x) => (
              <div key={x.id} className="rounded-2xl border p-3 text-xs space-y-2">
                <div className="flex justify-between gap-2"><b>{x.fullName || x.userName}</b><span className={`rounded-full border px-2 py-1 ${statusClass(x.status)}`}>{x.status}</span></div>
                <div className="text-zinc-500">{x.email || '-'} • TikTok: {x.tikTokUsername || '-'} • IG: {x.instagramUsername || '-'}</div>
                <div className="flex flex-wrap gap-2">
                  {['Approved', 'Rejected', 'Suspended', 'Pending'].map((s) => <button key={s} disabled={saving === `profile-${x.id}`} className="rounded-lg border px-3 py-1.5 disabled:opacity-50" onClick={() => updateProfileStatus(x.id, s)}>{s}</button>)}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {tab === 'challenges' ? (
        <div className="bg-white border rounded-3xl p-5 space-y-3">
          <button className="rounded-xl bg-primary-600 px-4 py-2 text-sm font-semibold text-white" onClick={() => openChallenge()}>Tambah Challenge</button>
          {challenges.map((x) => (
            <div key={x.id} className="rounded-2xl border p-3 text-xs space-y-2">
              <div className="flex justify-between"><b>{x.title}</b><span className={`rounded-full border px-2 py-1 ${statusClass(x.status)}`}>{x.status}</span></div>
              <div className="text-zinc-500">{x.category || '-'} • submit +{x.pointOnSubmit} • approved +{x.pointOnApproved}</div>
              <div className="flex gap-2"><button className="rounded-lg border px-3 py-1.5" onClick={() => openChallenge(x)}>Edit</button><button className="rounded-lg border px-3 py-1.5 text-red-600" onClick={async () => { await apiDelete(`/api/Creator/admin/challenges/${x.id}`); await load(); }}>Hapus</button></div>
            </div>
          ))}
        </div>
      ) : null}

      {tab === 'submissions' ? (
        <div className="bg-white border rounded-3xl p-5 space-y-2">
          {submissions.map((x) => (
            <div key={x.id} className="rounded-2xl border p-3 text-xs space-y-2">
              <div className="flex justify-between gap-2"><b>{x.challengeTitle}</b><span className={`rounded-full border px-2 py-1 ${statusClass(x.status)}`}>{x.status}</span></div>
              <div className="text-zinc-500">{x.fullName || x.userName} • {x.submittedAt ? new Date(x.submittedAt).toLocaleString('id-ID') : '-'}</div>
              <div className="grid md:grid-cols-2 gap-1 text-[11px]">
                {[x.tikTokUrl, x.instagramUrl, x.youtubeUrl, x.facebookUrl].filter(Boolean).map((url: string) => <a key={url} className="text-primary-600 break-all" href={url} target="_blank" rel="noreferrer">{url}</a>)}
              </div>
              <div className="flex flex-wrap gap-2"><button className="rounded-lg border px-3 py-1.5" onClick={() => updateSubmission(x.id, 'Approved')}>Approve</button><button className="rounded-lg border px-3 py-1.5 text-red-600" onClick={() => updateSubmission(x.id, 'Rejected')}>Reject</button></div>
            </div>
          ))}
        </div>
      ) : null}

      {tab === 'points' ? (
        <div className="space-y-3">
          <div className="bg-white border rounded-3xl p-4"><button className="rounded-xl bg-primary-600 px-4 py-2 text-sm font-semibold text-white" onClick={() => setModal('point')}>Manual Point Adjustment</button></div>
          <div className="bg-white border rounded-3xl p-5 space-y-2">
            {pointRules.map((x) => (
              <div key={x.id} className="rounded-2xl border p-3 text-xs grid md:grid-cols-[1fr_100px_100px_100px_auto] gap-2 items-center">
                <div><b>{x.displayName}</b><div className="text-zinc-500">{x.activityType}</div></div>
                <input className="rounded-xl border px-2 py-1" type="number" value={x.points} onChange={(e) => setPointRules((rows) => rows.map((r) => r.id === x.id ? { ...r, points: Number(e.target.value) } : r))} />
                <input className="rounded-xl border px-2 py-1" type="number" value={x.dailyLimit ?? ''} placeholder="Daily" onChange={(e) => setPointRules((rows) => rows.map((r) => r.id === x.id ? { ...r, dailyLimit: e.target.value === '' ? null : Number(e.target.value) } : r))} />
                <input className="rounded-xl border px-2 py-1" type="number" value={x.monthlyLimit ?? ''} placeholder="Monthly" onChange={(e) => setPointRules((rows) => rows.map((r) => r.id === x.id ? { ...r, monthlyLimit: e.target.value === '' ? null : Number(e.target.value) } : r))} />
                <button className="rounded-lg border px-3 py-1.5" onClick={() => updatePointRule(x, x)}>{saving === `rule-${x.id}` ? 'Simpan...' : 'Simpan'}</button>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {tab === 'rewards' ? (
        <div className="space-y-3">
          <div className="bg-white border rounded-3xl p-4"><button className="rounded-xl bg-primary-600 px-4 py-2 text-sm font-semibold text-white" onClick={() => openReward()}>Tambah Reward</button></div>
          <div className="bg-white border rounded-3xl p-5 space-y-2">
            <h2 className="text-sm font-bold">Katalog Reward</h2>
            {rewards.map((x) => <div key={x.id} className="rounded-2xl border p-3 text-xs flex justify-between gap-2"><span><b>{x.name}</b><span className="block text-zinc-500">{x.requiredPoints} poin • {x.rewardType}</span></span><button className="rounded-lg border px-3 py-1.5" onClick={() => openReward(x)}>Edit</button></div>)}
          </div>
          <div className="bg-white border rounded-3xl p-5 space-y-2">
            <h2 className="text-sm font-bold">Claim Reward</h2>
            {claims.map((x) => <div key={x.id} className="rounded-2xl border p-3 text-xs space-y-2"><div className="flex justify-between"><b>{x.rewardName}</b><span className={`rounded-full border px-2 py-1 ${statusClass(x.status)}`}>{x.status}</span></div><div className="text-zinc-500">{x.fullName || x.userName} • {x.pointsSpent} poin</div><div className="flex flex-wrap gap-2">{['Approved', 'Rejected', 'Fulfilled', 'Cancelled'].map((s) => <button key={s} className="rounded-lg border px-3 py-1.5" onClick={() => updateClaim(x.id, s)}>{s}</button>)}</div></div>)}
          </div>
        </div>
      ) : null}

      {tab === 'leaderboard' ? (
        <div className="grid md:grid-cols-3 gap-3">
          {[
            ['Top Creator', leaderboard?.topCreator ?? []],
            ['Top Downloader', leaderboard?.topDownloader ?? []],
            ['Top Challenge', leaderboard?.topChallenge ?? []],
          ].map(([title, rows]: any) => (
            <div key={title} className="bg-white border rounded-3xl p-5 space-y-2">
              <h2 className="text-sm font-bold">{title}</h2>
              {rows.map((x: any, idx: number) => <div key={`${title}-${x.userId}`} className="rounded-xl border px-3 py-2 text-xs flex justify-between"><span>#{idx + 1} {x.fullName || x.userName}</span><b>{x.points}</b></div>)}
            </div>
          ))}
        </div>
      ) : null}

      <ModalShell open={modal === 'challenge'} onBackdropClick={() => saving ? undefined : setModal('')}>
        <div className="mx-auto max-w-3xl rounded-3xl bg-white border shadow-xl p-5 max-h-[90vh] overflow-y-auto space-y-3">
          <div className="flex justify-between gap-3"><h2 className="text-sm font-bold">{challengeForm.id ? 'Edit Challenge' : 'Tambah Challenge'}</h2><button onClick={() => setModal('')} className="rounded-lg border px-3 py-1 text-xs">Tutup</button></div>
          <div className="grid md:grid-cols-2 gap-2">
            <input className="rounded-xl border px-3 py-2 text-sm" placeholder="Judul" value={challengeForm.title} onChange={(e) => setChallengeForm({ ...challengeForm, title: e.target.value })} />
            <input className="rounded-xl border px-3 py-2 text-sm" placeholder="Slug opsional" value={challengeForm.slug} onChange={(e) => setChallengeForm({ ...challengeForm, slug: e.target.value })} />
            <input className="rounded-xl border px-3 py-2 text-sm" placeholder="Kategori" value={challengeForm.category} onChange={(e) => setChallengeForm({ ...challengeForm, category: e.target.value })} />
            <select className="rounded-xl border px-3 py-2 text-sm" value={challengeForm.status} onChange={(e) => setChallengeForm({ ...challengeForm, status: e.target.value })}>{['Draft', 'Published', 'Closed', 'Archived'].map((x) => <option key={x}>{x}</option>)}</select>
            <input className="rounded-xl border px-3 py-2 text-sm" type="datetime-local" value={challengeForm.startAt} onChange={(e) => setChallengeForm({ ...challengeForm, startAt: e.target.value })} />
            <input className="rounded-xl border px-3 py-2 text-sm" type="datetime-local" value={challengeForm.endAt} onChange={(e) => setChallengeForm({ ...challengeForm, endAt: e.target.value })} />
            <input className="rounded-xl border px-3 py-2 text-sm" type="number" placeholder="Point submit" value={challengeForm.pointOnSubmit} onChange={(e) => setChallengeForm({ ...challengeForm, pointOnSubmit: Number(e.target.value) })} />
            <input className="rounded-xl border px-3 py-2 text-sm" type="number" placeholder="Point approved" value={challengeForm.pointOnApproved} onChange={(e) => setChallengeForm({ ...challengeForm, pointOnApproved: Number(e.target.value) })} />
          </div>
          <textarea className="w-full rounded-xl border px-3 py-2 text-sm" placeholder="Deskripsi HTML/brief challenge" value={challengeForm.description} onChange={(e) => setChallengeForm({ ...challengeForm, description: e.target.value })} />
          <button disabled={saving === 'challenge'} onClick={saveChallenge} className="rounded-xl bg-primary-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">{saving === 'challenge' ? 'Menyimpan...' : 'Simpan Challenge'}</button>
        </div>
      </ModalShell>

      <ModalShell open={modal === 'reward'} onBackdropClick={() => saving ? undefined : setModal('')}>
        <div className="mx-auto max-w-2xl rounded-3xl bg-white border shadow-xl p-5 max-h-[90vh] overflow-y-auto space-y-3">
          <div className="flex justify-between gap-3"><h2 className="text-sm font-bold">{rewardForm.id ? 'Edit Reward' : 'Tambah Reward'}</h2><button onClick={() => setModal('')} className="rounded-lg border px-3 py-1 text-xs">Tutup</button></div>
          <div className="grid md:grid-cols-2 gap-2">
            <input className="rounded-xl border px-3 py-2 text-sm" placeholder="Kode" value={rewardForm.code} onChange={(e) => setRewardForm({ ...rewardForm, code: e.target.value })} />
            <input className="rounded-xl border px-3 py-2 text-sm" placeholder="Nama reward" value={rewardForm.name} onChange={(e) => setRewardForm({ ...rewardForm, name: e.target.value })} />
            <input className="rounded-xl border px-3 py-2 text-sm" placeholder="Tipe reward" value={rewardForm.rewardType} onChange={(e) => setRewardForm({ ...rewardForm, rewardType: e.target.value })} />
            <input className="rounded-xl border px-3 py-2 text-sm" type="number" placeholder="Poin dibutuhkan" value={rewardForm.requiredPoints} onChange={(e) => setRewardForm({ ...rewardForm, requiredPoints: Number(e.target.value) })} />
            <input className="rounded-xl border px-3 py-2 text-sm" type="number" placeholder="Stok opsional" value={rewardForm.stockQty} onChange={(e) => setRewardForm({ ...rewardForm, stockQty: e.target.value })} />
            <input className="rounded-xl border px-3 py-2 text-sm" placeholder="Cover URL" value={rewardForm.coverUrl} onChange={(e) => setRewardForm({ ...rewardForm, coverUrl: e.target.value })} />
          </div>
          <textarea className="w-full rounded-xl border px-3 py-2 text-sm" placeholder="Deskripsi" value={rewardForm.description} onChange={(e) => setRewardForm({ ...rewardForm, description: e.target.value })} />
          <textarea className="w-full rounded-xl border px-3 py-2 text-sm" placeholder="Syarat & ketentuan" value={rewardForm.terms} onChange={(e) => setRewardForm({ ...rewardForm, terms: e.target.value })} />
          <button disabled={saving === 'reward'} onClick={saveReward} className="rounded-xl bg-primary-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">{saving === 'reward' ? 'Menyimpan...' : 'Simpan Reward'}</button>
        </div>
      </ModalShell>

      <ModalShell open={modal === 'point'} onBackdropClick={() => saving ? undefined : setModal('')}>
        <div className="mx-auto max-w-xl rounded-3xl bg-white border shadow-xl p-5 space-y-3">
          <div className="flex justify-between gap-3"><h2 className="text-sm font-bold">Manual Point Adjustment</h2><button onClick={() => setModal('')} className="rounded-lg border px-3 py-1 text-xs">Tutup</button></div>
          <select className="w-full rounded-xl border px-3 py-2 text-sm" value={pointForm.userId} onChange={(e) => setPointForm({ ...pointForm, userId: e.target.value })}><option value="">Pilih user</option>{users.map((u) => <option key={u.id} value={u.id}>{u.fullName || u.userName || u.email}</option>)}</select>
          <input className="w-full rounded-xl border px-3 py-2 text-sm" type="number" placeholder="Poin, bisa minus untuk koreksi" value={pointForm.points} onChange={(e) => setPointForm({ ...pointForm, points: Number(e.target.value) })} />
          <textarea className="w-full rounded-xl border px-3 py-2 text-sm" placeholder="Alasan adjustment" value={pointForm.description} onChange={(e) => setPointForm({ ...pointForm, description: e.target.value })} />
          <button disabled={saving === 'point' || !pointForm.userId || !pointForm.points} onClick={adjustPoint} className="rounded-xl bg-primary-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">{saving === 'point' ? 'Menyimpan...' : 'Simpan Adjustment'}</button>
        </div>
      </ModalShell>
    </div>
  );
}
