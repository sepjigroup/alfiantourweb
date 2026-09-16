import { API_BASE_URL } from '@/lib/api-client';
import { getMemoryAnalyticsStore } from './memory-analytics';

async function flushToApi(summary: {
  date: string;
  source: string;
  peakOnlineUsers: number;
  totalVisitors: number;
  uniqueVisitors: number;
  pageViews: number;
  activeSessions: number;
  topPages: Array<{ page: string; count: number }>;
}) {
  try {
    const res = await fetch(`${API_BASE_URL}/api/BusinessInsights/analytics/daily-sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        date: `${summary.date}T00:00:00.000Z`,
        source: summary.source,
        peakOnlineUsers: summary.peakOnlineUsers,
        totalVisitors: summary.totalVisitors,
        uniqueVisitors: summary.uniqueVisitors,
        pageViews: summary.pageViews,
        activeSessions: summary.activeSessions,
        topPages: summary.topPages,
      }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export function startAnalyticsWorker() {
  const store = getMemoryAnalyticsStore();
  store.startTimer(flushToApi);
}

