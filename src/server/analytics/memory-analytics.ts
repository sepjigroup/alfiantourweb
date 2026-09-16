type TopPage = { page: string; count: number };

type SessionInfo = {
  sessionId: string;
  currentPage: string;
  lastSeen: number;
  userAgent?: string;
  ip?: string;
};

type DayBucket = {
  dateKey: string;
  peakOnlineUsers: number;
  totalVisitors: number;
  pageViews: number;
  uniqueSessions: Set<string>;
  topPages: Map<string, number>;
};

type RealtimeSnapshot = {
  datetime: string;
  currentOnlineUsers: number;
  peakOnlineUsers: number;
  totalVisitors: number;
  uniqueVisitors: number;
  pageViews: number;
  topPages: TopPage[];
  activeSessions: number;
};

const ONLINE_WINDOW_MS = 60_000;

class MemoryAnalyticsStore {
  private sessions = new Map<string, SessionInfo>();
  private day: DayBucket = this.newDayBucket(this.getDateKey());
  private lastFlushedDateKey: string | null = null;
  private flushing = false;
  private timerStarted = false;

  private getDateKey(d = new Date()) {
    return d.toISOString().slice(0, 10);
  }

  private newDayBucket(dateKey: string): DayBucket {
    return {
      dateKey,
      peakOnlineUsers: 0,
      totalVisitors: 0,
      pageViews: 0,
      uniqueSessions: new Set<string>(),
      topPages: new Map<string, number>(),
    };
  }

  private ensureDayBucket() {
    const nowKey = this.getDateKey();
    if (nowKey !== this.day.dateKey) {
      this.day = this.newDayBucket(nowKey);
    }
  }

  private getOnlineCount(nowMs = Date.now()) {
    let count = 0;
    for (const s of this.sessions.values()) {
      if (nowMs - s.lastSeen < ONLINE_WINDOW_MS) count += 1;
    }
    return Math.max(0, count);
  }

  private cleanupSessions(nowMs = Date.now()) {
    for (const [id, s] of this.sessions) {
      if (nowMs - s.lastSeen > ONLINE_WINDOW_MS * 10) {
        this.sessions.delete(id);
      }
    }
  }

  trackSession(input: { sessionId: string; currentPage: string; userAgent?: string; ip?: string }) {
    this.ensureDayBucket();
    const nowMs = Date.now();
    const id = input.sessionId.trim();
    if (!id) return;

    const existing = this.sessions.get(id);
    const firstSeenToday = !this.day.uniqueSessions.has(id);
    if (!existing && firstSeenToday) {
      this.day.totalVisitors += 1;
    }
    if (firstSeenToday) this.day.uniqueSessions.add(id);

    this.sessions.set(id, {
      sessionId: id,
      currentPage: input.currentPage || '/',
      lastSeen: nowMs,
      userAgent: input.userAgent,
      ip: input.ip,
    });

    this.day.pageViews += 1;
    const page = input.currentPage || '/';
    this.day.topPages.set(page, (this.day.topPages.get(page) ?? 0) + 1);

    const online = this.getOnlineCount(nowMs);
    this.day.peakOnlineUsers = Math.max(this.day.peakOnlineUsers, online);
    this.cleanupSessions(nowMs);
  }

  getSnapshot(): RealtimeSnapshot {
    this.ensureDayBucket();
    const nowMs = Date.now();
    this.cleanupSessions(nowMs);
    const currentOnline = this.getOnlineCount(nowMs);
    const topPages = Array.from(this.day.topPages.entries())
      .map(([page, count]) => ({ page, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
    return {
      datetime: new Date().toISOString(),
      currentOnlineUsers: Math.max(0, currentOnline),
      peakOnlineUsers: Math.max(0, this.day.peakOnlineUsers),
      totalVisitors: Math.max(0, this.day.totalVisitors),
      uniqueVisitors: Math.max(0, this.day.uniqueSessions.size),
      pageViews: Math.max(0, this.day.pageViews),
      topPages,
      activeSessions: Math.max(0, currentOnline),
    };
  }

  private getPreviousDate(dateKey: string) {
    const d = new Date(`${dateKey}T00:00:00.000Z`);
    d.setUTCDate(d.getUTCDate() - 1);
    return d.toISOString().slice(0, 10);
  }

  private msToNextMidnight() {
    const now = new Date();
    const next = new Date(now);
    next.setHours(24, 0, 0, 0);
    return Math.max(5_000, next.getTime() - now.getTime());
  }

  async flushDailySummaryIfNeeded(flushFn: (summary: {
    date: string;
    source: string;
    peakOnlineUsers: number;
    totalVisitors: number;
    uniqueVisitors: number;
    pageViews: number;
    activeSessions: number;
    topPages: TopPage[];
  }) => Promise<boolean>) {
    if (this.flushing) return;
    const nowKey = this.getDateKey();
    const prevKey = this.getPreviousDate(nowKey);
    if (this.lastFlushedDateKey === prevKey) return;

    this.flushing = true;
    try {
      const snap = this.getSnapshot();
      const ok = await flushFn({
        date: prevKey,
        source: 'web-client',
        peakOnlineUsers: snap.peakOnlineUsers,
        totalVisitors: snap.totalVisitors,
        uniqueVisitors: snap.uniqueVisitors,
        pageViews: snap.pageViews,
        activeSessions: snap.activeSessions,
        topPages: snap.topPages,
      });
      if (ok) {
        this.lastFlushedDateKey = prevKey;
        this.day = this.newDayBucket(nowKey);
      }
    } finally {
      this.flushing = false;
    }
  }

  startTimer(flushFn: (summary: {
    date: string;
    source: string;
    peakOnlineUsers: number;
    totalVisitors: number;
    uniqueVisitors: number;
    pageViews: number;
    activeSessions: number;
    topPages: TopPage[];
  }) => Promise<boolean>) {
    if (this.timerStarted) return;
    this.timerStarted = true;

    const run = async () => {
      await this.flushDailySummaryIfNeeded(flushFn);
      setTimeout(run, this.msToNextMidnight());
    };

    setTimeout(run, this.msToNextMidnight());
  }
}

declare global {
  // eslint-disable-next-line no-var
  var __alfianMemoryAnalytics: MemoryAnalyticsStore | undefined;
}

export function getMemoryAnalyticsStore() {
  if (!globalThis.__alfianMemoryAnalytics) {
    globalThis.__alfianMemoryAnalytics = new MemoryAnalyticsStore();
  }
  return globalThis.__alfianMemoryAnalytics;
}

