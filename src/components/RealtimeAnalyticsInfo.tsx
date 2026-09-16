'use client';

import { useEffect, useState } from 'react';

type Snapshot = {
  datetime: string;
  currentOnlineUsers: number;
  peakOnlineUsers: number;
  totalVisitors: number;
  uniqueVisitors: number;
  pageViews: number;
  topPages: Array<{ page: string; count: number }>;
  activeSessions: number;
};

export function RealtimeAnalyticsInfo() {
  const [data, setData] = useState<Snapshot | null>(null);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const res = await fetch('/api/analytics/realtime', { cache: 'no-store' });
        if (!res.ok) return;
        const json = await res.json();
        if (mounted) setData(json?.data ?? null);
      } catch {
        // ignore
      }
    };
    void load();
    const id = setInterval(load, 15_000);
    return () => {
      mounted = false;
      clearInterval(id);
    };
  }, []);

  if (!data) return null;

  return (
    <div className="mt-5 rounded-xl border bg-white p-3">
      <div className="text-[11px] font-bold text-zinc-700">Realtime Analytics</div>
      <div className="mt-2 grid grid-cols-2 gap-2 text-[11px] text-zinc-600">
        <div>Online: <b>{data.currentOnlineUsers}</b></div>
        <div>Peak: <b>{data.peakOnlineUsers}</b></div>
        <div>Visitors: <b>{data.totalVisitors}</b></div>
        <div>Unique: <b>{data.uniqueVisitors}</b></div>
        <div>Page Views: <b>{data.pageViews}</b></div>
        <div>Sessions: <b>{data.activeSessions}</b></div>
      </div>
      {data.topPages?.length ? (
        <div className="mt-2 text-[11px] text-zinc-600">
          <div className="font-semibold">Top Pages</div>
          <div className="mt-1 space-y-1">
            {data.topPages.slice(0, 5).map((x) => (
              <div key={x.page} className="flex items-center justify-between">
                <span className="truncate pr-2">{x.page}</span>
                <span className="font-semibold">{x.count}</span>
              </div>
            ))}
          </div>
        </div>
      ) : null}
      <div className="mt-2 text-[10px] text-zinc-400">Updated: {new Date(data.datetime).toLocaleString()}</div>
    </div>
  );
}

